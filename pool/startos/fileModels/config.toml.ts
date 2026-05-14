import { matches, FileHelper } from '@start9labs/start-sdk'
const { object, string, number, literal } = matches

const shape = object({
  authority_public_key: string,
  authority_secret_key: string,
  cert_validity_sec: number,
  listen_address: literal('0.0.0.0:34254').onMismatch('0.0.0.0:34254'),
  coinbase_reward_script: string,
  server_id: number,
  pool_signature: string,
  log_file: literal('./pool.log').onMismatch('./pool.log'),
  shares_per_minute: number,
  share_batch_size: number,
  supported_extensions: string,
  required_extensions: string,
  bitcoin_ipc_socket: string,
  bitcoin_fee_threshold: number,
  bitcoin_min_interval: number,
})

export const configToml = FileHelper.toml(
  {
    volumeId: 'main',
    subpath: '/config.toml',
  },
  shape,
)