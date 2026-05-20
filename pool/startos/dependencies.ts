import { sdk } from './sdk'
import { configToml } from './fileModels/config.toml'

export const setDependencies = sdk.setupDependencies(
  async ({ effects }) => {
    const config = await configToml.read().const(effects)
    if (!config || config.template_provider.mode !== 'bitcoin_core_ipc') {
      return {}
    }
    return {
      bitcoind: {
        kind: 'running',
        versionRange: '>=30.0.0',
        healthChecks: [],
      },
    }
  },
)
