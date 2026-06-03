import { matches, FileHelper } from '@start9labs/start-sdk'
const { object, string, number, literal, boolean, array } = matches

const shape = object({
  // Downstream Mining Device Connection
  // We don't want people changing Downstream address and port
  downstream_address: literal('0.0.0.0').onMismatch('0.0.0.0'),
  downstream_port: literal(34255).onMismatch(34255),

  // Protocol Version Support
  // We don't want people changing protocol versions
  min_supported_version: literal(2).onMismatch(2),
  max_supported_version: literal(2).onMismatch(2),

  // Extranonce2 size for downstream connections
  // This controls the rollable part of the extranonce for downstream SV1 miners
  // Max value for CGminer: 8, Min value: 2
  downstream_extranonce2_size: number,

  // User identity/username for pool connection
  // This will be appended with a counter for each mining client (e.g., username.miner1, username.miner2)
  user_identity: string,

  // Aggregate channels: if true, all miners share one upstream channel; if false, each miner gets its own channel
  aggregate_channels: boolean,

  // Optional log file path. Omitted from TOML when undefined to disable file logging.
  log_file: string.optional().onMismatch(undefined),

  // SV2 protocol extensions advertised/required to the upstream
  supported_extensions: array(number),
  required_extensions: array(number),

  // Optional Prometheus monitoring endpoint. Both keys omitted from TOML when undefined.
  monitoring_address: string.optional().onMismatch(undefined),
  monitoring_cache_refresh_secs: number.optional().onMismatch(undefined),

  // Downstream Difficulty Configuration
  downstream_difficulty_config: object({
    min_individual_miner_hashrate: number,
    shares_per_minute: number,
    // Enable variable difficulty adjustment (true by default, set to false when using with JDC)
    enable_vardiff: boolean,
    // Interval at which keepalive jobs are emitted to downstream miners
    job_keepalive_interval_secs: number,
  }),

  // Upstream SV2 Pool/JDC Connections (array of upstreams for failover support)
  // Per-upstream iroh fields are optional and opt-in for upstream dials.
  upstreams: array(object({
    address: string,
    port: number,
    authority_pubkey: string,
    // Optional iroh-transport fields for this upstream (opt-in)
    iroh_node_id: string.optional().onMismatch(undefined),
    iroh_relay_url: string.optional().onMismatch(undefined),
    // 'tcp' or 'iroh' — preferred transport for this upstream
    prefer_transport: string.optional().onMismatch(undefined),
  })),

  // Optional [iroh] block — when present, translator may dial upstreams via
  // iroh QUIC (requires iroh-transport feature in the binary). Schema matches
  // the canonical sv2-apps fork example. StartOS-sovereign discovery defaults.
  iroh: object({
    listen_address: string.onMismatch('0.0.0.0:0'),
    secret_key_path: string.optional().onMismatch(undefined),
    relay_url: string.optional().onMismatch(undefined),
    discovery_relay_enable: boolean.onMismatch(true),
    discovery_pkarr_pub_enable: boolean.onMismatch(false),
    discovery_pkarr_res_enable: boolean.onMismatch(true),
    discovery_dht_enable: boolean.onMismatch(false),
    discovery_n0_enable: boolean.onMismatch(false),
    max_idle_timeout_secs: number.optional().onMismatch(undefined),
    keep_alive_interval_secs: number.optional().onMismatch(undefined),
    per_request_timeout_secs: number.optional().onMismatch(undefined),
  }).optional().onMismatch(undefined),
})

export const configToml = FileHelper.toml(
  {
    volumeId: 'main',
    subpath: '/config.toml',
  },
  shape,
)
