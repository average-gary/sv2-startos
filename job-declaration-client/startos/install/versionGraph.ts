import { VersionGraph } from '@start9labs/start-sdk'
import { current, other } from './versions'
import { configToml } from '../fileModels/config.toml'
import { sdk } from '../sdk'
import { setConfig } from '../actions/setConfig'

export const versionGraph = VersionGraph.of({
  current,
  other,
  preInstall: async (effects) => {
    ;(await Promise.all([
      configToml.write(effects, {
        // Fixed Configuration
        listening_address: '0.0.0.0:34265',
        min_supported_version: 2,
        max_supported_version: 2,
        log_file: '',

        // Authority keys for encrypted downstream connections
        // These are example keys from sv2-apps - users should generate their own for production
        authority_public_key: '9auqWEzQDVyd2oe1JVGFLMLHZtCo2FFqZwtKA5gd9xbuEu7PH72',
        authority_secret_key: 'mkDLTBBRxdBv998612qipDYoTK3YUrqLe8uWw7gu3iXbSrn2n',
        cert_validity_sec: 3600,

        // User Identity
        user_identity: 'start9',

        // Shares Configuration (from sv2-apps examples)
        shares_per_minute: 6.0,
        share_batch_size: 10,
        reserved_downstream_rollable_extranonce_size: 8,

        // Mining Mode
        mode: 'FULLTEMPLATE',

        // Template Provider Configuration - default to local SV2 TP
        template_provider_mode: 'sv2_tp',
        template_provider_sv2_tp: {
          address: '127.0.0.1:8442',
          public_key: '',
        },
        template_provider_bitcoin_core_ipc: {
          network: 'mainnet',
          data_dir: '',
          fee_threshold: 100,
          min_interval: 5,
        },

        // JDC Signature
        jdc_signature: 'StartOS',

        // Solo Mining Fallback
        // Example testnet address from sv2-apps - users must configure their own
        coinbase_reward_script: 'addr(tb1qa0sm0hxzj0x25rh8gw5xlzwlsfvvyz8u96w3p8)',

        // SV2 protocol extensions
        supported_extensions: [],
        required_extensions: [],

        // Monitoring (disabled by default)
        monitoring_address: '',
        monitoring_cache_refresh_secs: 15,

        // Upstream JDS Connections (local by default)
        upstreams: [
          {
            authority_pubkey:
              '9auqWEzQDVyd2oe1JVGFLMLHZtCo2FFqZwtKA5gd9xbuEu7PH72',
            pool_address: '127.0.0.1',
            pool_port: 34254,
            jds_address: '127.0.0.1',
            jds_port: 34264,
          },
        ],
      }),
    ]),
      // critical - needs to be done before start
      // important - dismissible
      // optional - less in the user's face
      await sdk.action.createOwnTask(effects, setConfig, 'critical', {
        reason: 'Configure your Job Declaration Client settings',
      }))
  },
})
