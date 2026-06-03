import { promises as fs } from 'fs'
import { configToml } from './fileModels/config.toml'
import { sdk } from './sdk'
import { DOWNSTREAM_PORT } from './utils'

// Placeholder loopback ports used purely to satisfy the StartOS interface
// machinery for synthesized canonical URIs (sv2-spec § 4.7) — these ports are
// not actually listened on by the JDC binary, they exist so MultiHost can mint
// stratum2+tcp:// and stratum2+iroh:// dial strings for display/copy.
const CONNECT_URI_TCP_PORT = 34294
const CONNECT_URI_IROH_PORT = 34295

export const setInterfaces = sdk.setupInterfaces(async ({ effects }) => {
  // Pioneer Hash JD Client exposes a TCP interface for translators/proxies
  const downstreamMulti = sdk.MultiHost.of(effects, 'downstream-multi')
  const downstreamMultiOrigin = await downstreamMulti.bindPort(DOWNSTREAM_PORT, {
    protocol: null,
    addSsl: null,
    preferredExternalPort: DOWNSTREAM_PORT,
    secure: { ssl: false },
  })
  const downstreamInterface = sdk.createInterface(effects, {
    name: 'Pioneer Hash JD Client',
    id: 'jd-client',
    description: 'Job Declarator Client interface for connecting translators/proxies',
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
    name: 'Pioneer Hash JD Client Dashboard',
    id: 'jd-client-ui',
    description: 'Pioneer Hash dashboard for live JDC monitoring and config viewing',
    type: 'ui',
    masked: false,
    schemeOverride: null,
    username: null,
    path: '',
    query: {},
  })
  const uiReceipt = await uiMultiOrigin.export([uiInterface])

  const receipts: Array<typeof downstreamReceipt | typeof uiReceipt> = [
    downstreamReceipt,
    uiReceipt,
  ]

  // Best-effort read of authority_public_key for canonical URI minting.
  // Failing to read should NOT block startup of the existing TCP/UI interfaces.
  let authorityPubkey = ''
  try {
    const cfg = await configToml.read().const(effects)
    if (cfg && cfg.authority_public_key) {
      authorityPubkey = cfg.authority_public_key
    }
  } catch {
    // pre-config or unreadable: skip URI minting
  }

  if (authorityPubkey) {
    // sv2-spec § 4.7 canonical URI: stratum2+tcp://host:port/<authority_pubkey>
    const connectMulti = sdk.MultiHost.of(effects, 'jdc-connect-uri')
    const connectOrigin = await connectMulti.bindPort(CONNECT_URI_TCP_PORT, {
      protocol: null,
      addSsl: null,
      preferredExternalPort: CONNECT_URI_TCP_PORT,
      secure: { ssl: false },
    })
    const connectInterface = sdk.createInterface(effects, {
      name: 'JD Client Connect URI',
      id: 'jdc-connect-uri',
      description:
        'Canonical sv2-spec stratum2+tcp:// dial string (authority_public_key embedded in path)',
      type: 'api',
      masked: true,
      schemeOverride: { ssl: 'stratum2+tcp', noSsl: 'stratum2+tcp' },
      username: null,
      path: '/' + authorityPubkey,
      query: {},
    })
    const connectReceipt = await connectOrigin.export([connectInterface])
    receipts.push(connectReceipt)

    // Iroh dial-string variant — only mint when /data/iroh/jdc.public exists.
    let irohNodeId = ''
    let irohRelayUrl = ''
    try {
      const raw = await fs.readFile('/data/iroh/jdc.public', 'utf8')
      irohNodeId = raw.trim()
    } catch {
      // iroh disabled or key not yet generated — skip
    }

    if (irohNodeId) {
      const irohMulti = sdk.MultiHost.of(effects, 'jdc-iroh-uri')
      const irohOrigin = await irohMulti.bindPort(CONNECT_URI_IROH_PORT, {
        protocol: null,
        addSsl: null,
        preferredExternalPort: CONNECT_URI_IROH_PORT,
        secure: { ssl: false },
      })
      const irohInterface = sdk.createInterface(effects, {
        name: 'JD Client Iroh Dial String',
        id: 'jdc-iroh-uri',
        description:
          'Canonical stratum2+iroh:// dial string (authority_public_key in path, NodeId in query)',
        type: 'api',
        masked: true,
        schemeOverride: { ssl: 'stratum2+iroh', noSsl: 'stratum2+iroh' },
        username: null,
        path: '/' + authorityPubkey,
        query: { node_id: irohNodeId, relay_url: irohRelayUrl },
      })
      const irohReceipt = await irohOrigin.export([irohInterface])
      receipts.push(irohReceipt)
    }
  }

  return receipts
})
