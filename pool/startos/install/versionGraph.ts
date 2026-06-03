import { VersionGraph } from '@start9labs/start-sdk'
import { current, other } from './versions'
import { configToml } from '../fileModels/config.toml'
import { sdk } from '../sdk'
import { setConfig } from '../actions/setConfig'

export const versionGraph = VersionGraph.of({
  current,
  other,
  preInstall: async (effects) => {
    await configToml.write(effects, {
      // Pool Authority Keys - These are example keys from SV2 reference implementation
      // Users should generate their own keys for production use
      authority_public_key: '9auqWEzQDVyd2oe1JVGFLMLHZtCo2FFqZwtKA5gd9xbuEu7PH72',
      authority_secret_key: 'mkDLTBBRxdBv998612qipDYoTK3YUrqLe8uWw7gu3iXbSrn2n',

      // Certificate validity duration (1 hour default)
      cert_validity_sec: 3600,

      // Listen address for downstream connections (translators/proxies)
      listen_address: '0.0.0.0:34254',

      // Coinbase reward script - default testnet address (users must configure their own)
      coinbase_reward_script: 'addr(tb1qa0sm0hxzj0x25rh8gw5xlzwlsfvvyz8u96w3p8)',

      // Server ID for unique search space allocation (random)
      server_id: Math.floor(Math.random() * 65535) + 1,

      // Pool signature for coinbase tx (random to preserve privacy)
      pool_signature: `Pool-${Math.random().toString(36).substring(2, 15)}`,

      // Optional log file - blank means disabled
      log_file: '',

      // Shares configuration
      shares_per_minute: 6.0,
      share_batch_size: 10,

      // Protocol extensions
      supported_extensions: [],
      required_extensions: [],

      // Template Provider - default to Bitcoin Core IPC on mainnet
      template_provider: {
        mode: 'bitcoin_core_ipc',
        bitcoin_core_ipc: {
          network: 'mainnet',
          data_dir: '',
          fee_threshold: 100,
          min_interval: 5,
        },
        sv2_tp: {
          address: '127.0.0.1:8442',
          public_key: '',
        },
      },

      // Embedded Job Declarator Server - enabled by default
      jds: {
        enabled: true,
        listen_address: '0.0.0.0:34264',
        supported_extensions: [],
        required_extensions: [],
      },

      // Monitoring endpoint - disabled by default
      monitoring: {
        enabled: false,
        address: '127.0.0.1:9090',
        cache_refresh_secs: 15,
      },

      // Iroh transport - enabled by default on the pool inbound side per design plan §7.
      // Discovery defaults honor StartOS sovereignty: relay on, pkarr-resolve on,
      // pkarr-publish/dht/n0 off. Operators can flip these via the Configure action.
      iroh: {
        enabled: true,
        listen_address: '0.0.0.0:34256',
        secret_key_path: '/data/iroh/pool.secret',
        relay_url: undefined,
        discovery_relay_enable: true,
        discovery_pkarr_pub_enable: false,
        discovery_pkarr_res_enable: true,
        discovery_dht_enable: false,
        discovery_n0_enable: false,
        max_idle_timeout_secs: 60,
        keep_alive_interval_secs: 30,
        per_request_timeout_secs: 30,
      },
    })

    // Create configuration task for user
    await sdk.action.createOwnTask(effects, setConfig, 'critical', {
      reason:
        'Configure your SV2 Pool settings including authority keys, Bitcoin address, and Template Provider connection',
    })
  },
})
