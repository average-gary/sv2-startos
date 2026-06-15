import { matches, FileHelper } from '@start9labs/start-sdk'
const { object, string, number, array, literals, boolean } = matches

const bitcoinCoreIpc = object({
  network: literals('mainnet', 'testnet4', 'signet', 'regtest'),
  data_dir: string,
  fee_threshold: number,
  min_interval: number,
})

const sv2Tp = object({
  address: string,
  public_key: string,
})

const templateProvider = object({
  mode: literals('bitcoin_core_ipc', 'sv2_tp'),
  bitcoin_core_ipc: bitcoinCoreIpc,
  sv2_tp: sv2Tp,
})

const jds = object({
  enabled: boolean,
  listen_address: string,
  supported_extensions: array(number),
  required_extensions: array(number),
})

const monitoring = object({
  enabled: boolean,
  address: string,
  cache_refresh_secs: number,
})

// [iroh] block — canonical schema mirrors the fork's commented-out example in
// sv2-apps/pool-apps/pool/config-examples/mainnet/pool-config-bitcoin-core-ipc-example.toml
// Discovery defaults honor StartOS sovereignty (see plan §7):
//   relay enabled, pkarr_resolve enabled, pkarr_publish/dht/n0 disabled.
const iroh = object({
  enabled: boolean,
  listen_address: string,
  secret_key_path: string,
  relay_url: string.optional().onMismatch(undefined),
  discovery_relay_enable: boolean,
  discovery_pkarr_pub_enable: boolean,
  discovery_pkarr_res_enable: boolean,
  discovery_dht_enable: boolean,
  discovery_n0_enable: boolean,
  max_idle_timeout_secs: number,
  keep_alive_interval_secs: number,
  per_request_timeout_secs: number,
}).onMismatch({
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
})

const shape = object({
  authority_public_key: string,
  authority_secret_key: string,
  cert_validity_sec: number,
  listen_address: string,
  coinbase_reward_script: string,
  server_id: number,
  pool_signature: string,
  log_file: string,
  shares_per_minute: number,
  share_batch_size: number,
  supported_extensions: array(number),
  required_extensions: array(number),
  template_provider: templateProvider,
  jds,
  monitoring,
  iroh,
})

export const configToml = FileHelper.toml(
  {
    volumeId: 'main',
    subpath: '/user-config.toml',
  },
  shape,
)
