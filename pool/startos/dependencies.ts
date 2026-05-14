import { sdk } from './sdk'

export const setDependencies = sdk.setupDependencies(
  async () => {
    return {
      bitcoind: {
        kind: 'running',
        versionRange: '>=30.0.0',
        healthChecks: [],
      },
    }
  },
)