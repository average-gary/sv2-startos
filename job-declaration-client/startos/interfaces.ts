import { sdk } from './sdk'
import { DOWNSTREAM_PORT } from './utils'

export const setInterfaces = sdk.setupInterfaces(async ({ effects }) => {
  // Pioneer Hash JD Client exposes a TCP interface for translators/proxies
  const downstreamMulti = sdk.MultiHost.of(effects, 'downstream-multi')
  const downstreamMultiOrigin = await downstreamMulti.bindPort(DOWNSTREAM_PORT, {
    protocol: null,
    addSsl: null,
    preferredExternalPort: DOWNSTREAM_PORT,
    secure: { ssl: false }
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

  return [downstreamReceipt, uiReceipt]
})
