import { sdk } from '../sdk'
import { configToml } from '../fileModels/config.toml'

const { InputSpec, Value, List } = sdk

const upstreamSpec = InputSpec.of({
  address: Value.text({
    name: 'Pool Address',
    description: 'IP address or hostname of the upstream SV2 pool',
    required: true,
    default: null,
    placeholder: 'e.g., 127.0.0.1 or pool.example.com',
  }),
  port: Value.number({
    name: 'Pool Port',
    description:
      'Port number for the upstream SV2 pool (typically 34254 for pool, 34265 for JDC)',
    required: true,
    default: 34254,
    min: 1,
    max: 65535,
    integer: true,
  }),
  authority_pubkey: Value.text({
    name: 'Authority Public Key',
    description: 'The authority public key of the upstream SV2 pool',
    required: true,
    default: '9auqWEzQDVyd2oe1JVGFLMLHZtCo2FFqZwtKA5gd9xbuEu7PH72',
    placeholder: '9auqWEzQDVyd2oe1JVGFLMLHZtCo2FFqZwtKA5gd9xbuEu7PH72',
  }),
})

// Hex (e.g. 0x0002) or decimal extension IDs.
const extensionPattern = {
  regex: '^(0x[0-9a-fA-F]+|[0-9]+)$',
  description: 'Hex (e.g. 0x0002) or decimal (e.g. 2) extension ID',
}

const parseExtension = (raw: string): number => {
  const trimmed = raw.trim()
  return trimmed.toLowerCase().startsWith('0x')
    ? parseInt(trimmed.slice(2), 16)
    : parseInt(trimmed, 10)
}

const formatExtension = (n: number): string =>
  '0x' + n.toString(16).padStart(4, '0')

export const inputSpec = InputSpec.of({
  // User Identity
  user_identity: Value.text({
    name: 'User Identity / Username',
    description:
      'Username for pool connection. Will be appended with a counter for each mining client (e.g., username.miner1, username.miner2)',
    required: true,
    default: 'start9',
    placeholder: 'start9',
  }),

  // Extranonce Configuration
  downstream_extranonce2_size: Value.number({
    name: 'Downstream Extranonce2 Size',
    description:
      'Extranonce2 size for downstream connections. Controls the rollable part of the extranonce for downstream SV1 miners (Max for CGminer: 8, Min: 2)',
    required: true,
    default: 4,
    min: 2,
    max: 16,
    integer: true,
  }),

  // Channel Aggregation
  aggregate_channels: Value.toggle({
    name: 'Aggregate Channels',
    description:
      'If enabled, all miners share one upstream channel. If disabled, each miner gets its own channel',
    default: true,
  }),

  // Optional file logging
  log_file: Value.text({
    name: 'Log File Path',
    description:
      'Optional path for tproxy log file. Leave blank to disable file logging.',
    required: false,
    default: null,
    placeholder: './tproxy.log',
  }),

  // SV2 Extension Negotiation
  supported_extensions: Value.list(
    List.text(
      {
        name: 'Supported Extensions',
        description:
          'SV2 extension IDs advertised to the upstream as supported (hex or decimal).',
        default: ['0x0002'],
      },
      {
        placeholder: '0x0002',
        patterns: [extensionPattern],
        inputmode: 'text',
      },
    ),
  ),
  required_extensions: Value.list(
    List.text(
      {
        name: 'Required Extensions',
        description:
          'SV2 extension IDs the upstream MUST support (hex or decimal).',
        default: [],
      },
      {
        placeholder: '0x0002',
        patterns: [extensionPattern],
        inputmode: 'text',
      },
    ),
  ),

  // Optional Prometheus monitoring
  monitoring_enabled: Value.toggle({
    name: 'Enable Monitoring Endpoint',
    description:
      'Expose a Prometheus-compatible metrics endpoint for scraping translator stats.',
    default: false,
  }),
  monitoring_address: Value.text({
    name: 'Monitoring Address',
    description:
      'host:port for the metrics endpoint. Only used when monitoring is enabled.',
    required: false,
    default: '0.0.0.0:9092',
    placeholder: '0.0.0.0:9092',
  }),
  monitoring_cache_refresh_secs: Value.number({
    name: 'Monitoring Cache Refresh',
    description:
      'How often the monitoring endpoint refreshes its cached values. Only used when monitoring is enabled.',
    required: false,
    default: 15,
    min: 1,
    max: 3600,
    integer: true,
    units: 'seconds',
  }),

  // Downstream Difficulty Configuration
  downstream_difficulty_config: Value.object(
    {
      name: 'Downstream Difficulty Settings',
      description: 'Difficulty settings for mining devices',
    },
    InputSpec.of({
      min_individual_miner_hashrate: Value.number({
        name: 'Minimum Miner Hashrate (TH/s)',
        description:
          'Hashrate of the weakest miner in terahashes per second (e.g., 10 TH/s)',
        required: true,
        default: 10,
        min: 0.001,
        max: 10000,
        integer: false,
      }),
      shares_per_minute: Value.number({
        name: 'Target Shares Per Minute',
        description:
          'Target number of shares per minute each miner should submit',
        required: true,
        default: 6.0,
        min: 0.1,
        max: 60,
        integer: false,
      }),
      enable_vardiff: Value.toggle({
        name: 'Enable Variable Difficulty',
        description:
          'Enable variable difficulty adjustment (set to false when using with Job Declarator Client)',
        default: true,
      }),
      job_keepalive_interval_secs: Value.number({
        name: 'Job Keepalive Interval',
        description:
          'How often the translator emits keepalive jobs to downstream miners',
        required: true,
        default: 60,
        min: 1,
        max: 3600,
        integer: true,
        units: 'seconds',
      }),
    }),
  ),

  // Upstream SV2 Pool/JDC Connections
  upstreams: Value.list(
    List.obj(
      {
        name: 'Upstream Pools',
        description:
          'SV2 pool connections (add multiple for failover support). The first pool will be used as primary, others as backups',
      },
      {
        spec: upstreamSpec,
        displayAs: '{{address}}:{{port}}',
        uniqueBy: 'address',
      },
    ),
  ),
})

export const setConfig = sdk.Action.withInput(
  // id
  'set-config',

  // metadata
  async ({ effects }) => ({
    name: 'Configure Translator',
    description:
      'Configure SV2 Translator Proxy settings for pool and mining device connections',
    warning: null,
    allowedStatuses: 'any',
    group: null,
    visibility: 'enabled',
  }),

  // form input specification
  inputSpec,

  // optionally pre-fill the input form
  async ({ effects }) => {
    const config = await configToml.read().const(effects)
    if (!config) {
      return null
    }
    const monitoringAddress = config.monitoring_address
    return {
      user_identity: config.user_identity,
      downstream_extranonce2_size: config.downstream_extranonce2_size,
      aggregate_channels: config.aggregate_channels,
      log_file: config.log_file ?? '',
      supported_extensions: (config.supported_extensions || []).map(
        formatExtension,
      ),
      required_extensions: (config.required_extensions || []).map(
        formatExtension,
      ),
      monitoring_enabled: !!monitoringAddress,
      monitoring_address: monitoringAddress ?? '0.0.0.0:9092',
      monitoring_cache_refresh_secs: config.monitoring_cache_refresh_secs ?? 15,
      downstream_difficulty_config: {
        ...config.downstream_difficulty_config,
        min_individual_miner_hashrate:
          config.downstream_difficulty_config.min_individual_miner_hashrate /
          1e12,
      },
      upstreams: config.upstreams,
    }
  },

  // the execution function
  async ({ effects, input }) => {
    const supported_extensions = input.supported_extensions.map(parseExtension)
    const required_extensions = input.required_extensions.map(parseExtension)

    const trimmedLogFile = (input.log_file ?? '').trim()
    const log_file = trimmedLogFile === '' ? undefined : trimmedLogFile
    const trimmedMonitoring = (input.monitoring_address ?? '').trim()
    const monitoring_address =
      input.monitoring_enabled && trimmedMonitoring !== ''
        ? trimmedMonitoring
        : undefined
    const monitoring_cache_refresh_secs = input.monitoring_enabled
      ? input.monitoring_cache_refresh_secs ?? 15
      : undefined

    const configData = {
      user_identity: input.user_identity,
      downstream_extranonce2_size: input.downstream_extranonce2_size,
      aggregate_channels: input.aggregate_channels,
      log_file,
      supported_extensions,
      required_extensions,
      monitoring_address,
      monitoring_cache_refresh_secs,
      downstream_difficulty_config: {
        ...input.downstream_difficulty_config,
        min_individual_miner_hashrate:
          input.downstream_difficulty_config.min_individual_miner_hashrate *
          1e12,
      },
      upstreams: input.upstreams,
    }
    await configToml.merge(effects, configData)
  },
)
