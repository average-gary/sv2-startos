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

  template_provider_mode: Value.select({
    name: 'Template Provider Mode',
    description:
      'How the pool obtains block templates. BitcoinCoreIpc connects directly to a local Bitcoin Core node via its IPC socket. Sv2Tp connects to a remote Stratum V2 Template Provider over TCP.',
    default: 'bitcoin_core_ipc' as const,
    values: {
      bitcoin_core_ipc: 'Bitcoin Core IPC (local)',
      sv2_tp: 'Sv2 Template Provider (remote)',
    },
  }),

  bitcoin_core_network: Value.select({
    name: 'Bitcoin Network',
    description:
      'Bitcoin network used by the local Bitcoin Core node (only used in Bitcoin Core IPC mode).',
    default: 'mainnet' as const,
    values: {
      mainnet: 'Mainnet',
      testnet4: 'Testnet4',
      signet: 'Signet',
      regtest: 'Regtest',
    },
  }),

  bitcoin_core_data_dir: Value.text({
    name: 'Bitcoin Core Data Dir Override',
    description:
      'Optional override for the Bitcoin Core data directory used to resolve the IPC socket path. Leave blank to use the default mounted at /ipc.',
    required: false,
    default: null,
    placeholder: '/ipc',
  }),

  fee_threshold: Value.number({
    name: 'Fee Threshold',
    description:
      'Minimum fee threshold for transaction inclusion in templates. When mempool fees exceed this threshold, a new block template is generated. (Bitcoin Core IPC mode only.)',
    required: true,
    default: 100,
    integer: true,
    min: 0,
    units: 'satoshis',
  }),

  min_interval: Value.number({
    name: 'Minimum Interval',
    description:
      'Minimum time between template updates from Bitcoin Core. (Bitcoin Core IPC mode only.)',
    required: true,
    default: 5,
    integer: true,
    min: 1,
    max: 60,
    units: 'seconds',
  }),

  sv2_tp_address: Value.text({
    name: 'Sv2 Template Provider Address',
    description:
      'TCP host:port of the upstream Sv2 Template Provider. (Sv2Tp mode only.)',
    required: true,
    default: '127.0.0.1:8442',
    placeholder: '127.0.0.1:8442',
  }),

  sv2_tp_public_key: Value.text({
    name: 'Sv2 Template Provider Public Key',
    description:
      'Optional Noise authority public key of the upstream Template Provider. (Sv2Tp mode only.)',
    required: false,
    default: null,
  }),

  enable_jds: Value.toggle({
    name: 'Enable Embedded Job Declarator Server',
    description:
      'Run the embedded Job Declarator Server (JDS) alongside the pool. Required if you want to allow connections from Job Declarator Clients.',
    default: true,
  }),

  jds_listen_address: Value.text({
    name: 'JDS Listen Address',
    description:
      'host:port the embedded Job Declarator Server listens on. (Only used when JDS is enabled.)',
    required: true,
    default: '0.0.0.0:34264',
    placeholder: '0.0.0.0:34264',
  }),

  monitoring_enabled: Value.toggle({
    name: 'Enable Monitoring Endpoint',
    description:
      'Expose a Prometheus-style monitoring endpoint for the pool service.',
    default: false,
  }),

  monitoring_address: Value.text({
    name: 'Monitoring Address',
    description:
      'host:port for the monitoring endpoint. (Only used when monitoring is enabled.)',
    required: false,
    default: '127.0.0.1:9090',
    placeholder: '127.0.0.1:9090',
  }),

  monitoring_cache_refresh_secs: Value.number({
    name: 'Monitoring Cache Refresh',
    description:
      'How often the monitoring endpoint refreshes its cached metrics. (Only used when monitoring is enabled.)',
    required: false,
    default: 15,
    integer: true,
    min: 1,
    max: 3600,
    units: 'seconds',
  }),
})

export const setConfig = sdk.Action.withInput(
  'set-config',

  async ({ effects }) => ({
    name: 'Configure Pool',
    description:
      'Configure Pioneer Hash SV2 Pool settings including mining rewards, template provider mode, and embedded JDS',
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
      template_provider_mode: config.template_provider.mode,
      bitcoin_core_network: config.template_provider.bitcoin_core_ipc.network,
      bitcoin_core_data_dir:
        config.template_provider.bitcoin_core_ipc.data_dir || null,
      fee_threshold: config.template_provider.bitcoin_core_ipc.fee_threshold,
      min_interval: config.template_provider.bitcoin_core_ipc.min_interval,
      sv2_tp_address: config.template_provider.sv2_tp.address,
      sv2_tp_public_key: config.template_provider.sv2_tp.public_key || null,
      enable_jds: config.jds.enabled,
      jds_listen_address: config.jds.listen_address,
      monitoring_enabled: config.monitoring.enabled,
      monitoring_address: config.monitoring.address || null,
      monitoring_cache_refresh_secs: config.monitoring.cache_refresh_secs,
    }
  },

  async ({ effects, input }) => {
    // Preserve any existing [iroh] block — this Configure action doesn't yet
    // expose iroh fields in its form, but a prior install or future form rev
    // may have populated them. Fall back to plan defaults (Iroh on for pool
    // inbound, sovereignty-friendly discovery toggles).
    const prior = await configToml.read().const(effects)
    const irohDefaults = {
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
    }
    const iroh = prior?.iroh ?? irohDefaults

    const config = {
      authority_public_key: input.authority_public_key,
      authority_secret_key: input.authority_secret_key,
      cert_validity_sec: input.cert_validity_sec,
      listen_address: '0.0.0.0:34254',
      coinbase_reward_script: `addr(${input.coinbase_reward_address})`,
      server_id: input.server_id,
      pool_signature: input.pool_signature,
      log_file: '',
      shares_per_minute: input.shares_per_minute,
      share_batch_size: input.share_batch_size,
      supported_extensions: [],
      required_extensions: [],
      template_provider: {
        mode: input.template_provider_mode,
        bitcoin_core_ipc: {
          network: input.bitcoin_core_network,
          data_dir: input.bitcoin_core_data_dir || '',
          fee_threshold: input.fee_threshold,
          min_interval: input.min_interval,
        },
        sv2_tp: {
          address: input.sv2_tp_address,
          public_key: input.sv2_tp_public_key || '',
        },
      },
      jds: {
        enabled: input.enable_jds,
        listen_address: input.jds_listen_address,
        supported_extensions: [],
        required_extensions: [],
      },
      monitoring: {
        enabled: input.monitoring_enabled,
        address: input.monitoring_address || '',
        cache_refresh_secs: input.monitoring_cache_refresh_secs ?? 15,
      },
      iroh,
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
