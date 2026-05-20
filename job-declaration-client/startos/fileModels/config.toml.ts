import { matches, FileHelper } from '@start9labs/start-sdk'
const { object, string, number, literal, literals, array } = matches

const shape = object({
  // JD Client listening address - fixed
  listening_address: literal('0.0.0.0:34265').onMismatch('0.0.0.0:34265'),

  // Protocol Version Support - fixed
  min_supported_version: literal(2).onMismatch(2),
  max_supported_version: literal(2).onMismatch(2),

  // Auth keys for open encrypted connection downstream
  authority_public_key: string,
  authority_secret_key: string,
  cert_validity_sec: number,

  // User identity/username for pool connection
  user_identity: string,

  // Target number of shares per minute applied to every downstream channel
  shares_per_minute: number,

  // Share batch size
  share_batch_size: number,

  // JDC mode: full template, coinbase-only, or solo mining
  mode: literals('FULLTEMPLATE', 'COINBASEONLY', 'SOLOMINING'),

  // String to be added into the Coinbase scriptSig
  jdc_signature: string,

  // Coinbase reward script for Solo Mining (fallback solution)
  coinbase_reward_script: string,

  // Optional Log File (empty string disables file logging)
  log_file: string,

  // SV2 protocol extensions advertised/required
  supported_extensions: array(number),
  required_extensions: array(number),

  // Optional Prometheus monitoring endpoint (empty string disables)
  monitoring_address: string,
  monitoring_cache_refresh_secs: number,

  // Number of rollable extranonce bytes reserved for extended downstreams
  reserved_downstream_rollable_extranonce_size: number,

  // Template Provider mode + nested config (rendered into [template_provider_type.X] in main.ts)
  template_provider_mode: literals('bitcoin_core_ipc', 'sv2_tp'),
  template_provider_bitcoin_core_ipc: object({
    network: literals('mainnet', 'testnet4', 'signet', 'regtest'),
    data_dir: string,
    fee_threshold: number,
    min_interval: number,
  }),
  template_provider_sv2_tp: object({
    address: string,
    public_key: string,
  }),

  // List of upstreams (Pool + JDS) used as backup endpoints
  upstreams: array(object({
    authority_pubkey: string,
    pool_address: string,
    pool_port: number,
    jds_address: string,
    jds_port: number,
  })),
})

export const configToml = FileHelper.toml(
  {
    volumeId: 'main',
    subpath: '/config.toml',
  },
  shape,
)
