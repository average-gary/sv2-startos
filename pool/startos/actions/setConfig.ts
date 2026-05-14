import { sdk } from '../sdk'
import { configToml } from '../fileModels/config.toml'

const { InputSpec, Value } = sdk

export const inputSpec = InputSpec.of({
  authority_public_key: Value.text({
    name: 'Authority Public Key',
    description: 'Pool authority public key for Noise protocol authentication',
    required: true,
    default: '9auqWEzQDVyd2oe1JVGFLMLHZtCo2FFqZwtKA5gd9xbuEu7PH72',
  }),

  authority_secret_key: Value.text({
    name: 'Authority Secret Key',
    description:
      'Pool authority secret key for Noise protocol (keep secure)',
    required: true,
    masked: true,
    default: 'mkDLTBBRxdBv998612qipDYoTK3YUrqLe8uWw7gu3iXbSrn2n',
  }),

  cert_validity_sec: Value.number({
    name: 'Certificate Validity Duration',
    description:
      'Duration for which generated certificates are valid (1 hour = 3600)',
    required: true,
    default: 3600,
    min: 300,
    max: 86400,
    integer: true,
    units: 'seconds',
  }),

  coinbase_reward_address: Value.text({
    name: 'Mining Reward Address',
    description:
      'Bitcoin address where mining rewards will be sent. IMPORTANT: Verify this address carefully - all mining rewards will go here!',
    required: true,
    default: 'tb1qa0sm0hxzj0x25rh8gw5xlzwlsfvvyz8u96w3p8',
    placeholder: 'bc1q... or tb1q...',
    patterns: [
      {
        regex: '^[a-zA-Z0-9]{25,100}$',
        description: 'Must be a valid Bitcoin address',
      },
    ],
  }),

  server_id: Value.number({
    name: 'Server ID',
    description:
      'Unique identifier for this pool server. Each pool instance must have a unique ID to ensure unique search space allocation across different servers',
    required: true,
    default: Math.floor(Math.random() * 65535) + 1,
    min: 1,
    max: 65535,
    integer: true,
  }),

  pool_signature: Value.text({
    name: 'Pool Signature',
    description:
      'Text included in the coinbase transaction of mined blocks. This appears on the blockchain.',
    required: true,
    default: `Pool-${Math.random().toString(36).substring(2, 15)}`,
    maxLength: 100,
    warning:
      'PRIVACY WARNING: This signature is publicly visible on the blockchain. Using identifiable information (like your name, location, or email) will permanently link your identity to this pool and compromise privacy. Use a random or generic string instead.',
  }),

  shares_per_minute: Value.number({
    name: 'Target Shares Per Minute',
    description:
      'Expected number of shares per minute (determines difficulty targets)',
    required: true,
    default: 6.0,
    min: 0.1,
    max: 1000,
    integer: false,
    units: 'shares/min',
  }),

  share_batch_size: Value.number({
    name: 'Share Batch Size',
    description: 'Number of shares to acknowledge in a batch',
    required: true,
    default: 10,
    min: 1,
    max: 1000,
    integer: true,
    units: 'shares',
  }),

  fee_threshold: Value.number({
    name: 'Fee Threshold',
    description:
      'Minimum fee threshold for transaction inclusion in templates. When mempool fees exceed this threshold, a new block template is generated.',
    required: true,
    default: 100,
    integer: true,
    min: 0,
    units: 'satoshis',
  }),

  min_interval: Value.number({
    name: 'Minimum Interval',
    description:
      'Minimum time between template updates from Bitcoin Core',
    required: true,
    default: 5,
    integer: true,
    min: 1,
    max: 60,
    units: 'seconds',
  }),
})

export const setConfig = sdk.Action.withInput(
  'set-config',

  async ({ effects }) => ({
    name: 'Configure Pool',
    description:
      'Configure Pioneer Hash SV2 Pool settings including mining rewards and Bitcoin Core IPC connection',
    warning: null,
    allowedStatuses: 'any',
    group: null,
    visibility: 'enabled',
  }),

  inputSpec,

  async ({ effects }) => {
    let config
    try {
      config = await configToml.read().const(effects)
    } catch (e) {
      return null
    }

    if (!config) {
      return null
    }

    let coinbase_reward_address = config.coinbase_reward_script || ''
    if (
      coinbase_reward_address.startsWith('addr(') &&
      coinbase_reward_address.endsWith(')')
    ) {
      coinbase_reward_address = coinbase_reward_address.slice(5, -1)
    }

    return {
      authority_public_key: config.authority_public_key,
      authority_secret_key: config.authority_secret_key,
      cert_validity_sec: config.cert_validity_sec,
      coinbase_reward_address,
      server_id: config.server_id,
      pool_signature: config.pool_signature,
      shares_per_minute: config.shares_per_minute,
      share_batch_size: config.share_batch_size,
      fee_threshold: config.bitcoin_fee_threshold || 100,
      min_interval: config.bitcoin_min_interval || 5,
    }
  },

  async ({ effects, input }) => {
    const config = {
      authority_public_key: input.authority_public_key,
      authority_secret_key: input.authority_secret_key,
      cert_validity_sec: input.cert_validity_sec,
      listen_address: '0.0.0.0:34254',
      coinbase_reward_script: `addr(${input.coinbase_reward_address})`,
      server_id: input.server_id,
      pool_signature: input.pool_signature,
      log_file: './pool.log',
      shares_per_minute: input.shares_per_minute,
      share_batch_size: input.share_batch_size,
      supported_extensions: JSON.stringify([]),
      required_extensions: JSON.stringify([]),
      bitcoin_ipc_socket: '/root/.bitcoin/ipc/bitcoin-core.sock',
      bitcoin_fee_threshold: input.fee_threshold,
      bitcoin_min_interval: input.min_interval,
    }

    await configToml.write(effects, config)

    return {
      version: '1',
      title: 'Configuration Saved',
      message: `Pool configuration saved. Restart the pool for changes to take effect.`,
      result: null,
    }
  },
)