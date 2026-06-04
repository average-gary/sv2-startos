import { sdk } from '../sdk'
import { configToml } from '../fileModels/config.toml'

const { InputSpec, Value, List } = sdk

const TOR_WARNING =
  '⚠️ EXPERIMENTAL: SV2 over Tor is untested. Stratum V2 has not been verified end-to-end over Tor circuits anywhere we know of. Latency, share submission timing, circuit churn, and Noise NX handshake behavior under Tor are all unknown. No guarantees — share loss, stale work, or silent disconnects are plausible. If you paste an .onion address here and it works (or breaks), please file an issue at https://github.com/average-gary/sv2-startos/issues with what worked and what didn\'t.'

const upstreamSpec = InputSpec.of({
  address: Value.text({
    name: 'Pool Address',
    description: 'IP address or hostname of the upstream SV2 pool',
    required: true,
    default: null,
    placeholder: 'e.g., 127.0.0.1 or pool.example.com',
    warning: TOR_WARNING,
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
  // Optional iroh-transport fields for this upstream (opt-in).
  iroh_node_id: Value.text({
    name: 'Iroh Node ID (optional)',
    description:
      'Iroh node ID of this upstream (Ed25519 public key, base32). Leave blank for TCP-only upstreams.',
    required: false,
    default: null,
    placeholder: 'e.g., abc123...xyz',
  }),
  iroh_relay_url: Value.text({
    name: 'Iroh Relay URL (optional)',
    description:
      'Optional iroh relay URL for hole-punching to this upstream. Leave blank to use the translator\'s configured relay or no relay.',
    required: false,
    default: null,
    placeholder: 'https://relay.example.com',
  }),
  prefer_transport: Value.select({
    name: 'Preferred Transport',
    description:
      'Preferred transport when dialing this upstream. TCP is the default; Iroh requires the upstream to publish a node ID and an iroh-capable build.',
    default: 'tcp' as const,
    values: {
      tcp: 'TCP (default)',
      iroh: 'Iroh',
    },
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

  // Iroh Transport (optional, off by default for translator — mostly outbound)
  iroh: Value.object(
    {
      name: 'Iroh Transport',
      description:
        'Optional iroh QUIC transport. When enabled, the translator can dial upstreams over iroh in addition to TCP. Sovereignty-friendly defaults: local discovery on, public DHT/pkarr publish off.',
    },
    InputSpec.of({
      enabled: Value.toggle({
        name: 'Enable Iroh',
        description:
          'Enable the iroh QUIC transport for outbound upstream dials. Off by default for the translator (mostly outbound).',
        default: false,
      }),
      listen_address: Value.text({
        name: 'Iroh Listen Address',
        description:
          'host:port the iroh endpoint binds to. Use 0.0.0.0:0 for an ephemeral port (recommended for outbound-only).',
        required: true,
        default: '0.0.0.0:0',
        placeholder: '0.0.0.0:0',
      }),
      relay_url: Value.text({
        name: 'Iroh Relay URL',
        description:
          'Optional iroh relay for NAT traversal. Leave blank for direct connections only, or point at your own relay for the sovereignty path.',
        required: false,
        default: null,
        placeholder: 'https://relay.example.com',
      }),
      discovery_relay_enable: Value.toggle({
        name: 'Relay-based Discovery',
        description:
          'mDNS / local discovery (safe, default on). Lets peers on the same LAN find each other.',
        default: true,
      }),
      discovery_pkarr_pub_enable: Value.toggle({
        name: 'Publish to pkarr DNS',
        description:
          'Publish reachability to the public pkarr DNS — leaks every interface IP on this host (issue n0/iroh#3074). Off by default.',
        default: false,
      }),
      discovery_pkarr_res_enable: Value.toggle({
        name: 'Resolve via pkarr DNS',
        description: 'Resolve peers via pkarr DNS (safe, default on).',
        default: true,
      }),
      discovery_dht_enable: Value.toggle({
        name: 'Mainline DHT Discovery',
        description:
          'Mainline DHT participation. Off for sovereignty — joining the DHT advertises this node to the public swarm.',
        default: false,
      }),
      discovery_n0_enable: Value.toggle({
        name: 'n0 Discovery Service',
        description:
          'Use the n0-operated dns.iroh.link discovery service. Off by default — third-party dependency.',
        default: false,
      }),
      max_idle_timeout_secs: Value.number({
        name: 'Max Idle Timeout',
        description: 'Maximum idle time before iroh closes a connection.',
        required: false,
        default: 60,
        min: 1,
        max: 86400,
        integer: true,
        units: 'seconds',
      }),
      keep_alive_interval_secs: Value.number({
        name: 'Keep-Alive Interval',
        description: 'How often iroh sends keep-alive pings on idle connections.',
        required: false,
        default: 30,
        min: 1,
        max: 86400,
        integer: true,
        units: 'seconds',
      }),
      per_request_timeout_secs: Value.number({
        name: 'Per-Request Timeout',
        description: 'Timeout for individual iroh requests.',
        required: false,
        default: 30,
        min: 1,
        max: 86400,
        integer: true,
        units: 'seconds',
      }),
      secret_key_path: Value.text({
        name: 'Iroh Secret Key Path',
        description:
          "Advanced: Ed25519 secret key path. Auto-generated on first start. Don't change unless rotating identity.",
        required: false,
        default: '/data/iroh/translator.secret',
        placeholder: '/data/iroh/translator.secret',
      }),
    }),
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
    const priorIroh = config.iroh
    const irohPrefill = {
      enabled: priorIroh ? true : false,
      listen_address: priorIroh?.listen_address ?? '0.0.0.0:0',
      relay_url: priorIroh?.relay_url ?? null,
      discovery_relay_enable: priorIroh?.discovery_relay_enable ?? true,
      discovery_pkarr_pub_enable: priorIroh?.discovery_pkarr_pub_enable ?? false,
      discovery_pkarr_res_enable: priorIroh?.discovery_pkarr_res_enable ?? true,
      discovery_dht_enable: priorIroh?.discovery_dht_enable ?? false,
      discovery_n0_enable: priorIroh?.discovery_n0_enable ?? false,
      max_idle_timeout_secs: priorIroh?.max_idle_timeout_secs ?? 60,
      keep_alive_interval_secs: priorIroh?.keep_alive_interval_secs ?? 30,
      per_request_timeout_secs: priorIroh?.per_request_timeout_secs ?? 30,
      secret_key_path:
        priorIroh?.secret_key_path ?? '/data/iroh/translator.secret',
    }
    const upstreams = (config.upstreams || []).map((u) => ({
      address: u.address,
      port: u.port,
      authority_pubkey: u.authority_pubkey,
      iroh_node_id: u.iroh_node_id ?? null,
      iroh_relay_url: u.iroh_relay_url ?? null,
      prefer_transport: (u.prefer_transport === 'iroh' ? 'iroh' : 'tcp') as
        | 'tcp'
        | 'iroh',
    }))
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
      upstreams,
      iroh: irohPrefill,
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

    // Map per-upstream iroh fields onto the upstreams array; blank strings
    // collapse to undefined so they're omitted from the TOML.
    const upstreams = (input.upstreams || []).map((u) => {
      const nodeIdRaw = (u.iroh_node_id ?? '').trim()
      const relayRaw = (u.iroh_relay_url ?? '').trim()
      const prefer = u.prefer_transport === 'iroh' ? 'iroh' : 'tcp'
      return {
        address: u.address,
        port: u.port,
        authority_pubkey: u.authority_pubkey,
        iroh_node_id: nodeIdRaw === '' ? undefined : nodeIdRaw,
        iroh_relay_url: relayRaw === '' ? undefined : relayRaw,
        prefer_transport: prefer,
      }
    })

    // Build the [iroh] block from the form. When iroh is disabled, omit the
    // block entirely so the binary doesn't try to bind an iroh endpoint.
    const irohRelayRaw = (input.iroh.relay_url ?? '').trim()
    const irohSecretRaw = (input.iroh.secret_key_path ?? '').trim()
    const iroh = input.iroh.enabled
      ? {
          listen_address: input.iroh.listen_address,
          secret_key_path: irohSecretRaw === '' ? undefined : irohSecretRaw,
          relay_url: irohRelayRaw === '' ? undefined : irohRelayRaw,
          discovery_relay_enable: input.iroh.discovery_relay_enable,
          discovery_pkarr_pub_enable: input.iroh.discovery_pkarr_pub_enable,
          discovery_pkarr_res_enable: input.iroh.discovery_pkarr_res_enable,
          discovery_dht_enable: input.iroh.discovery_dht_enable,
          discovery_n0_enable: input.iroh.discovery_n0_enable,
          max_idle_timeout_secs: input.iroh.max_idle_timeout_secs ?? undefined,
          keep_alive_interval_secs:
            input.iroh.keep_alive_interval_secs ?? undefined,
          per_request_timeout_secs:
            input.iroh.per_request_timeout_secs ?? undefined,
        }
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
      upstreams,
      iroh,
    }
    await configToml.merge(effects, configData)
  },
)
