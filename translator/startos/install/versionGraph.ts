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
        // Downstream Mining Device Connection
        downstream_address: '0.0.0.0',
        downstream_port: 34255,

        // Protocol Version Support
        min_supported_version: 2,
        max_supported_version: 2,

        // Extranonce Configuration
        downstream_extranonce2_size: 4,

        // User Identity
        user_identity: 'start9',

        // Channel Aggregation
        aggregate_channels: true,

        // Log File (omitted from TOML; user can opt in via setConfig)
        log_file: undefined,

        // SV2 Extension Negotiation
        supported_extensions: [],
        required_extensions: [],

        // Monitoring (omitted from TOML until user opts in)
        monitoring_address: undefined,
        monitoring_cache_refresh_secs: undefined,

        // Downstream Difficulty Configuration
        downstream_difficulty_config: {
          min_individual_miner_hashrate: 10000000000000,
          shares_per_minute: 6.0,
          enable_vardiff: true,
          job_keepalive_interval_secs: 60,
        },

        // Upstream SV2 Pool/JDC Connections
        upstreams: [
          {
            address: '',
            port: 34254,
            authority_pubkey:
              '9auqWEzQDVyd2oe1JVGFLMLHZtCo2FFqZwtKA5gd9xbuEu7PH72',
          },
        ],

        // Iroh transport - on by default per design plan §7. Block presence
        // is the toggle (the schema has no `enabled` field). Sovereignty:
        // relay on, pkarr-resolve on, pkarr-publish/dht/n0 off. Translator
        // is mostly outbound, so listen_address binds an ephemeral port.
        iroh: {
          listen_address: '0.0.0.0:0',
          secret_key_path: '/data/iroh/translator.secret',
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
      }),
    ]),
      // critical - needs to be done before start
      // important - dismissible
      // optional - less in the user's face
      await sdk.action.createOwnTask(effects, setConfig, 'critical', {
        reason: 'Configure your SV2 Translator Proxy settings',
      }))
  },
})
