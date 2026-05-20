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
})

export const configToml = FileHelper.toml(
  {
    volumeId: 'main',
    subpath: '/user-config.toml',
  },
  shape,
)
