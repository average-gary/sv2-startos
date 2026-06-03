import { sdk } from './sdk'
import { DOWNSTREAM_PORT } from './utils'
import { configToml } from './fileModels/config.toml'
import * as fs from 'fs'

// Placeholder loopback ports for advisory copy-only interfaces. They never
// accept traffic — the SDK requires bindPort even for URL-only surfaces.
const CONNECT_URI_PORT = 34294
const IROH_URI_PORT = 34295

// Reads the Iroh public key/NodeId written to /data/iroh/pool.public by the
// pool binary on first start. Returns null when iroh is disabled or the file
// hasn't been written yet (e.g. install-time before the first run).
async function readIrohNodeId(): Promise<string | null> {
  try {
    const raw = fs.readFileSync('/data/iroh/pool.public', 'utf8')
    const trimmed = raw.trim()
    return trimmed.length > 0 ? trimmed : null
  } catch (_err) {
    return null
  }
}

export const setInterfaces = sdk.setupInterfaces(async ({ effects }) => {
  // Pioneer Hash SV2 Pool exposes a TCP interface for translators/proxies
  const downstreamMulti = sdk.MultiHost.of(effects, 'downstream-multi')
  const downstreamMultiOrigin = await downstreamMulti.bindPort(DOWNSTREAM_PORT, {
    protocol: null,
    addSsl: null,
    preferredExternalPort: DOWNSTREAM_PORT,
    secure: { ssl: false }
  })
  const downstreamInterface = sdk.createInterface(effects, {
    name: 'Pioneer Hash SV2 Pool',
    id: 'pool-sv2',
    description: 'SV2 pool interface',
    type: 'api',
    masked: false,
    schemeOverride: null,
    username: null,
    path: '',
    query: {},
  })

  const downstreamReceipt = await downstreamMultiOrigin.export([downstreamInterface])

  const uiMulti = sdk.MultiHost.of(effects, 'ui-multi')
  const uiMultiOrigin = await uiMulti.bindPort(80, { protocol: 'http' })
  const uiInterface = sdk.createInterface(effects, {
    name: 'Pioneer Hash SV2 Pool Dashboard',
    id: 'pool-ui',
    description: 'Pioneer Hash dashboard for live pool monitoring and config viewing',
    type: 'ui',
    masked: false,
    schemeOverride: null,
    username: null,
    path: '',
    query: {},
  })
  const uiReceipt = await uiMultiOrigin.export([uiInterface])

  const receipts: Array<typeof downstreamReceipt> = [downstreamReceipt, uiReceipt]

  // sv2-spec § 4.7 connect URI — stratum2+tcp://host:port/<authority_pubkey>.
  // The authority pubkey lives in the URL PATH (not the query string). The SRI
  // UI and sv2-wizard already emit/parse this exact form.
  const config = await configToml.read().const(effects)
  if (config && config.authority_public_key) {
    const connectUriMulti = sdk.MultiHost.of(effects, 'connect-uri-multi')
    const connectUriOrigin = await connectUriMulti.bindPort(CONNECT_URI_PORT, {
      protocol: null,
      addSsl: null,
      preferredExternalPort: CONNECT_URI_PORT,
      secure: { ssl: false },
    })
    const connectUriInterface = sdk.createInterface(effects, {
      name: 'Pioneer Hash SV2 Pool — connect URI',
      id: 'pool-connect-uri',
      description:
        'sv2-spec § 4.7 connection string. Paste into a Stratum V2 translator or JD client as an upstream URL.',
      type: 'api',
      masked: true,
      schemeOverride: { ssl: 'stratum2+tcp', noSsl: 'stratum2+tcp' },
      username: null,
      path: '/' + config.authority_public_key,
      query: {},
    })
    const connectUriReceipt = await connectUriOrigin.export([connectUriInterface])
    receipts.push(connectUriReceipt)

    // Iroh dial-string interface — only emitted when /data/iroh/pool.public exists
    // (i.e. iroh-transport is enabled and the binary has run at least once and
    // generated/loaded its NodeId). Path keeps the authority pubkey per spec
    // analogy; node_id is carried in the query string. Host is a placeholder —
    // the consuming service parses ?node_id and ignores host/port.
    const nodeId = await readIrohNodeId()
    if (nodeId) {
      const irohUriMulti = sdk.MultiHost.of(effects, 'iroh-uri-multi')
      const irohUriOrigin = await irohUriMulti.bindPort(IROH_URI_PORT, {
        protocol: null,
        addSsl: null,
        preferredExternalPort: IROH_URI_PORT,
        secure: { ssl: false },
      })
      const irohQuery: Record<string, string> = { node_id: nodeId }
      const relay = config.iroh?.relay_url
      irohQuery.relay_url = relay && relay.length > 0 ? relay : ''
      const irohUriInterface = sdk.createInterface(effects, {
        name: 'Pioneer Hash SV2 Pool — Iroh dial-string',
        id: 'pool-iroh-uri',
        description:
          'Iroh-transport dial-string. Paste into a Stratum V2 translator or JD client as an iroh upstream.',
        type: 'api',
        masked: true,
        schemeOverride: { ssl: 'stratum2+iroh', noSsl: 'stratum2+iroh' },
        username: null,
        path: '/' + config.authority_public_key,
        query: irohQuery,
      })
      const irohUriReceipt = await irohUriOrigin.export([irohUriInterface])
      receipts.push(irohUriReceipt)
    }
  }

  return receipts
})
