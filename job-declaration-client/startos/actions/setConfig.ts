import { sdk } from '../sdk'
import { configToml } from '../fileModels/config.toml'

const { InputSpec, Value, List } = sdk

const TOR_UNTESTED_WARNING =
  '⚠️ EXPERIMENTAL: SV2 over Tor is untested. Stratum V2 has not been verified end-to-end over Tor circuits anywhere we know of. Latency, share submission timing, circuit churn, and Noise NX handshake behavior under Tor are all unknown. No guarantees — share loss, stale work, or silent disconnects are plausible. If you paste an .onion address here and it works (or breaks), please file an issue at https://github.com/average-gary/sv2-startos/issues with what worked and what didn\'t.'

const upstreamSpec = InputSpec.of({
  authority_pubkey: Value.text({
    name: 'JDS Authority Public Key',
    description: 'The authority public key of the Job Declaration Server',
    required: true,
    default: '9auqWEzQDVyd2oe1JVGFLMLHZtCo2FFqZwtKA5gd9xbuEu7PH72',
    placeholder: '9auqWEzQDVyd2oe1JVGFLMLHZtCo2FFqZwtKA5gd9xbuEu7PH72',
  }),
  pool_address: Value.text({
    name: 'Pool Address',
    description: 'IP address or hostname of the upstream SV2 pool',
    required: true,
    default: '127.0.0.1',
    placeholder: '127.0.0.1',
    warning: TOR_UNTESTED_WARNING,
  }),
  pool_port: Value.number({
    name: 'Pool Port',
    description: 'Port number for the upstream SV2 pool (typically 34254)',
    required: true,
    default: 34254,
    min: 1,
    max: 65535,
    integer: true,
  }),
  jds_address: Value.text({
    name: 'JDS Address',
    description: 'IP address or hostname of the Job Declaration Server',
    required: true,
    default: '127.0.0.1',
    placeholder: '127.0.0.1',
    warning: TOR_UNTESTED_WARNING,
  }),
  jds_port: Value.number({
    name: 'JDS Port',
    description: 'Port number for the Job Declaration Server (typically 34264)',
    required: true,
    default: 34264,
    min: 1,
    max: 65535,
    integer: true,
  }),
  // Optional iroh transport metadata (per-upstream, opt-in). When set with
  // prefer_transport='iroh', the JDC will dial this upstream over iroh instead
  // of TCP. Honored only when the JDC binary is built with iroh-transport.
  iroh_pool_node_id: Value.text({
    name: 'Iroh Pool Node ID',
    description:
      'Optional. Iroh node ID of the upstream pool. Leave empty to use TCP only.',
    required: false,
    default: '',
    placeholder: 'k51qzi5uqu5d...',
  }),
  iroh_jds_node_id: Value.text({
    name: 'Iroh JDS Node ID',
    description:
      'Optional. Iroh node ID of the upstream Job Declaration Server. Leave empty to use TCP only.',
    required: false,
    default: '',
    placeholder: 'k51qzi5uqu5d...',
  }),
  iroh_relay_url: Value.text({
    name: 'Iroh Relay URL',
    description:
      'Optional. Iroh relay URL hint for this upstream. Leave empty to fall back to the global iroh relay or default discovery.',
    required: false,
    default: '',
    placeholder: 'https://relay.example.org',
  }),
  prefer_transport: Value.select({
    name: 'Preferred Transport',
    description:
      'Which transport to try first when dialing this upstream. Iroh is honored only if the JDC binary is built with iroh-transport and the iroh node IDs above are populated.',
    default: 'tcp',
    values: {
      tcp: 'TCP (default)',
      iroh: 'Iroh',
    },
  }),
})

const extensionSpec = InputSpec.of({
  value: Value.number({
    name: 'Extension ID',
    description: 'SV2 protocol extension ID (e.g. 2 for Worker-Specific Hashrate Tracking)',
    required: true,
    default: 2,
    min: 0,
    max: 65535,
    integer: true,
  }),
})

export const inputSpec = InputSpec.of({
  // User Identity
  user_identity: Value.text({
    name: 'User Identity / Username',
    description: 'Username for pool connection',
    required: true,
    default: 'start9',
    placeholder: 'start9',
  }),

  // Shares Configuration
  shares_per_minute: Value.number({
    name: 'Target Shares Per Minute',
    description:
      'Target number of shares per minute applied to every downstream channel',
    required: true,
    default: 6.0,
    min: 0.1,
    max: 60,
    integer: false,
    units: 'shares/min',
  }),

  share_batch_size: Value.number({
    name: 'Share Batch Size',
    description: 'Number of shares to batch before submitting',
    required: true,
    default: 10,
    min: 1,
    max: 1000,
    integer: true,
    units: 'shares',
  }),

  reserved_downstream_rollable_extranonce_size: Value.number({
    name: 'Reserved Downstream Rollable Extranonce Size',
    description: 'Number of rollable extranonce bytes reserved for extended downstreams',
    required: true,
    default: 8,
    min: 0,
    max: 16,
    integer: true,
    units: 'bytes',
  }),

  // Mining Mode
  mode: Value.select({
    name: 'JDC Mode',
    description:
      'FULLTEMPLATE = full template mining (needs Template Provider). COINBASEONLY = coinbase-only mining. SOLOMINING = bypass pool/JDS and mine direct to Bitcoin Core.',
    default: 'FULLTEMPLATE',
    values: {
      FULLTEMPLATE: 'Full Template',
      COINBASEONLY: 'Coinbase Only',
      SOLOMINING: 'Solo Mining',
    },
  }),

  // Template Provider Configuration
  template_provider_mode: Value.select({
    name: 'Template Provider Mode',
    description:
      'sv2_tp = connect to a Stratum V2 Template Provider over the network. bitcoin_core_ipc = connect directly to Bitcoin Core via Unix socket / IPC.',
    default: 'sv2_tp',
    values: {
      sv2_tp: 'SV2 Template Provider (network)',
      bitcoin_core_ipc: 'Bitcoin Core IPC (local socket)',
    },
  }),

  template_provider_sv2_tp: Value.object(
    {
      name: 'SV2 Template Provider Settings',
      description: 'Used when Template Provider Mode is "SV2 Template Provider".',
    },
    InputSpec.of({
      address: Value.text({
        name: 'Template Provider Address',
        description: 'host:port of the SV2 Template Provider',
        required: true,
        default: '127.0.0.1:8442',
        placeholder: '127.0.0.1:8442',
      }),
      public_key: Value.text({
        name: 'Template Provider Public Key',
        description:
          'Optional authority public key. Leave empty for a local TP; required for remote/hosted Template Providers.',
        required: false,
        default: '',
        placeholder: '9bwHCYnjhbHm4AS3pWg9MtAH83mzWohoJJJDELYBqZhDNqszDLc',
      }),
    }),
  ),

  template_provider_iroh: Value.object(
    {
      name: 'SV2 Template Provider — Iroh (optional)',
      description:
        'Optional. Iroh dial info for the Template Provider. Used only when Template Provider Mode is "SV2 Template Provider" AND the JDC binary is built with iroh-transport. Leave Iroh Node ID empty to keep the TP on TCP.',
    },
    InputSpec.of({
      iroh_node_id: Value.text({
        name: 'Iroh Node ID',
        description:
          'Optional. Iroh node ID of the Template Provider. Leave empty to use TCP only.',
        required: false,
        default: '',
        placeholder: 'k51qzi5uqu5d...',
      }),
      iroh_relay_url: Value.text({
        name: 'Iroh Relay URL',
        description:
          'Optional. Iroh relay URL hint for the Template Provider. Leave empty to fall back to the global iroh relay or default discovery.',
        required: false,
        default: '',
        placeholder: 'https://relay.example.org',
      }),
      prefer_transport: Value.select({
        name: 'Preferred Transport',
        description:
          'Which transport to try first when dialing the Template Provider. Iroh is honored only if the JDC binary is built with iroh-transport and the Iroh Node ID above is populated.',
        default: 'tcp',
        values: {
          tcp: 'TCP (default)',
          iroh: 'Iroh',
        },
      }),
    }),
  ),

  template_provider_bitcoin_core_ipc: Value.object(
    {
      name: 'Bitcoin Core IPC Settings',
      description: 'Used when Template Provider Mode is "Bitcoin Core IPC".',
    },
    InputSpec.of({
      network: Value.select({
        name: 'Bitcoin Network',
        description: 'Network the Bitcoin Core node is on',
        default: 'mainnet',
        values: {
          mainnet: 'Mainnet',
          testnet4: 'Testnet4',
          signet: 'Signet',
          regtest: 'Regtest',
        },
      }),
      data_dir: Value.text({
        name: 'Bitcoin Core Data Directory',
        description:
          'Optional. Override the default data directory (~/.bitcoin on Linux). Leave empty to use the default.',
        required: false,
        default: '',
        placeholder: '/root/.bitcoin',
      }),
      fee_threshold: Value.number({
        name: 'Fee Threshold',
        description:
          'Minimum fee threshold for transaction inclusion in templates. When mempool fees exceed this threshold, a new block template is generated.',
        required: true,
        default: 100,
        min: 0,
        integer: true,
        units: 'satoshis',
      }),
      min_interval: Value.number({
        name: 'Minimum Interval',
        description: 'Minimum time between template updates from Bitcoin Core',
        required: true,
        default: 5,
        min: 1,
        max: 60,
        integer: true,
        units: 'seconds',
      }),
    }),
  ),

  // JDC Signature
  jdc_signature: Value.text({
    name: 'JDC Signature',
    description: 'String to be added into the Coinbase scriptSig',
    required: true,
    default: 'StartOS',
    placeholder: 'StartOS',
    maxLength: 100,
  }),

  // Solo Mining Fallback
  coinbase_reward_script: Value.text({
    name: 'Coinbase Reward Script',
    description:
      'Bitcoin address descriptor for solo mining fallback. Use format: addr(your_address). Example testnet address provided - replace with your own!',
    required: true,
    default: 'addr(tb1qa0sm0hxzj0x25rh8gw5xlzwlsfvvyz8u96w3p8)',
    placeholder: 'addr(bc1q...)',
  }),

  // Authority Keys
  authority_public_key: Value.text({
    name: 'Authority Public Key',
    description: 'Authority public key for authenticated connections (example key provided from sv2-apps)',
    required: true,
    default: '9auqWEzQDVyd2oe1JVGFLMLHZtCo2FFqZwtKA5gd9xbuEu7PH72',
    placeholder: '9auqWEzQDVyd2oe1JVGFLMLHZtCo2FFqZwtKA5gd9xbuEu7PH72',
  }),

  authority_secret_key: Value.text({
    name: 'Authority Secret Key',
    description: 'Authority secret key for authenticated connections (example key provided from sv2-apps)',
    required: true,
    masked: true,
    default: 'mkDLTBBRxdBv998612qipDYoTK3YUrqLe8uWw7gu3iXbSrn2n',
    placeholder: 'mkDLTBBRxdBv998612qipDYoTK3YUrqLe8uWw7gu3iXbSrn2n',
  }),

  cert_validity_sec: Value.number({
    name: 'Certificate Validity',
    description: 'Certificate validity duration in seconds',
    required: true,
    default: 3600,
    min: 60,
    max: 31536000,
    integer: true,
    units: 'seconds',
  }),

  log_file: Value.text({
    name: 'Log File Path',
    description:
      'Optional. Path to write logs to. Leave empty to log to stdout only.',
    required: false,
    default: '',
    placeholder: './jd-client.log',
  }),

  // SV2 Protocol Extensions
  supported_extensions: Value.list(
    List.obj(
      {
        name: 'Supported Extensions',
        description:
          'SV2 protocol extensions the JDC will accept if requested by downstream clients (e.g. 2 for Worker-Specific Hashrate Tracking).',
        default: [],
      },
      {
        spec: extensionSpec,
        displayAs: '{{value}}',
        uniqueBy: 'value',
      },
    ),
  ),

  required_extensions: Value.list(
    List.obj(
      {
        name: 'Required Extensions',
        description:
          'SV2 protocol extensions the JDC will require from downstream clients.',
        default: [],
      },
      {
        spec: extensionSpec,
        displayAs: '{{value}}',
        uniqueBy: 'value',
      },
    ),
  ),

  // Monitoring
  monitoring_enabled: Value.toggle({
    name: 'Enable Monitoring HTTP Server',
    description:
      'When enabled, exposes a Prometheus-style HTTP endpoint with channel data.',
    default: false,
  }),

  monitoring_address: Value.text({
    name: 'Monitoring Address',
    description:
      'host:port for the monitoring HTTP server. Only used if monitoring is enabled.',
    required: false,
    default: '0.0.0.0:9091',
    placeholder: '0.0.0.0:9091',
  }),

  monitoring_cache_refresh_secs: Value.number({
    name: 'Monitoring Cache Refresh',
    description: 'How often the monitoring endpoint refreshes its cached data',
    required: true,
    default: 15,
    min: 1,
    max: 3600,
    integer: true,
    units: 'seconds',
  }),

  // Upstream JDS Connections
  upstreams: Value.list(
    List.obj(
      {
        name: 'Upstream Job Declaration Servers',
        description:
          'Job Declaration Server connections (add multiple for failover support). The first JDS will be used as primary, others as backups. Leave empty when using SOLOMINING mode.',
      },
      {
        spec: upstreamSpec,
        displayAs: '{{pool_address}}:{{pool_port}} via {{jds_address}}:{{jds_port}}',
        uniqueBy: 'pool_address',
      },
    ),
  ),

  // Iroh Transport (additive, optional). Honored only when the JDC binary is
  // built with the iroh-transport feature; ignored otherwise. Disabled by
  // default for the JDC since it primarily dials outbound to a pool/JDS.
  iroh: Value.object(
    {
      name: 'Iroh Transport',
      description:
        'Optional QUIC-based peer-to-peer transport. Iroh lets the JDC reach an upstream pool/JDS without exposing TCP ports or relying on TCP NAT traversal. Off by default — enable only if your upstream advertises an Iroh node ID.',
    },
    InputSpec.of({
      enabled: Value.toggle({
        name: 'Enable Iroh',
        description:
          'When enabled, the JDC will attempt iroh dials for upstreams whose Preferred Transport is set to Iroh. Requires a build of jd-client with the iroh-transport feature.',
        default: false,
      }),
      listen_address: Value.text({
        name: 'Iroh Listen Address',
        description:
          'host:port the iroh endpoint binds to. Mostly relevant for inbound connections; outbound-only nodes can leave the default.',
        required: true,
        default: '0.0.0.0:34266',
        placeholder: '0.0.0.0:34266',
      }),
      relay_url: Value.text({
        name: 'Iroh Relay URL',
        description:
          'Optional. Override the iroh relay used for hole-punching. Leave empty to use defaults. For sovereignty, point at a relay you operate or trust.',
        required: false,
        default: '',
        placeholder: 'https://relay.example.org',
      }),
      discovery_relay_enable: Value.toggle({
        name: 'Discovery: Relay / mDNS',
        description:
          'mDNS / local discovery. Safe, default on. Helps peers on the same LAN find each other without leaking to the public internet.',
        default: true,
      }),
      discovery_pkarr_pub_enable: Value.toggle({
        name: 'Discovery: pkarr publish (LEAKS IPs)',
        description:
          'Publish reachability to the public pkarr DNS. WARNING: leaks every interface IP on this host (issue n0/iroh#3074). Off by default — only enable if you understand the privacy implications.',
        default: false,
      }),
      discovery_pkarr_res_enable: Value.toggle({
        name: 'Discovery: pkarr resolve',
        description:
          'Resolve peers via pkarr DNS. Safe (resolution only, no publishing). Default on.',
        default: true,
      }),
      discovery_dht_enable: Value.toggle({
        name: 'Discovery: Mainline DHT',
        description:
          'Mainline DHT participation. Off by default for sovereignty — enabling joins your node to the public DHT swarm.',
        default: false,
      }),
      discovery_n0_enable: Value.toggle({
        name: 'Discovery: n0 DNS',
        description:
          'Use the n0-operated dns.iroh.link discovery service. Off by default for sovereignty — relies on a third-party (number0) name service.',
        default: false,
      }),
      max_idle_timeout_secs: Value.number({
        name: 'Max Idle Timeout',
        description:
          'QUIC max idle timeout. Connections idle longer than this are dropped.',
        required: true,
        default: 60,
        min: 1,
        max: 3600,
        integer: true,
        units: 'seconds',
      }),
      keep_alive_interval_secs: Value.number({
        name: 'Keep-Alive Interval',
        description:
          'How often to send QUIC keep-alive frames on otherwise-idle connections.',
        required: true,
        default: 30,
        min: 1,
        max: 3600,
        integer: true,
        units: 'seconds',
      }),
      per_request_timeout_secs: Value.number({
        name: 'Per-Request Timeout',
        description: 'Timeout for individual iroh request/response exchanges.',
        required: true,
        default: 30,
        min: 1,
        max: 3600,
        integer: true,
        units: 'seconds',
      }),
      secret_key_path: Value.text({
        name: 'Iroh Secret Key Path',
        description:
          "Advanced: Ed25519 secret key path. Auto-generated on first start. Don't change unless rotating identity.",
        required: true,
        default: '/data/iroh/jdc.secret',
        placeholder: '/data/iroh/jdc.secret',
      }),
    }),
  ),
})

export const setConfig = sdk.Action.withInput(
  // id
  'set-config',

  // metadata
  async ({ effects }) => ({
    name: 'Configure Job Declaration Client',
    description:
      'Configure Job Declaration Client settings for pool connections and mining parameters',
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
    // Iroh form defaults for existing installs that pre-date the iroh fields.
    const irohPrior = config.iroh
    const iroh = {
      enabled: !!irohPrior,
      listen_address: irohPrior?.listen_address ?? '0.0.0.0:34266',
      relay_url: irohPrior?.relay_url ?? '',
      discovery_relay_enable: irohPrior?.discovery_relay_enable ?? true,
      discovery_pkarr_pub_enable: irohPrior?.discovery_pkarr_pub_enable ?? false,
      discovery_pkarr_res_enable: irohPrior?.discovery_pkarr_res_enable ?? true,
      discovery_dht_enable: irohPrior?.discovery_dht_enable ?? false,
      discovery_n0_enable: irohPrior?.discovery_n0_enable ?? false,
      max_idle_timeout_secs: irohPrior?.max_idle_timeout_secs ?? 60,
      keep_alive_interval_secs: irohPrior?.keep_alive_interval_secs ?? 30,
      per_request_timeout_secs: irohPrior?.per_request_timeout_secs ?? 30,
      secret_key_path: irohPrior?.secret_key_path ?? '/data/iroh/jdc.secret',
    }
    const tpIrohPrior = config.template_provider_iroh
    const template_provider_iroh = {
      iroh_node_id: tpIrohPrior?.iroh_node_id ?? '',
      iroh_relay_url: tpIrohPrior?.iroh_relay_url ?? '',
      prefer_transport: tpIrohPrior?.prefer_transport ?? 'tcp',
    }
    return {
      user_identity: config.user_identity,
      shares_per_minute: config.shares_per_minute,
      share_batch_size: config.share_batch_size,
      reserved_downstream_rollable_extranonce_size:
        config.reserved_downstream_rollable_extranonce_size,
      mode: config.mode,
      template_provider_mode: config.template_provider_mode,
      template_provider_sv2_tp: config.template_provider_sv2_tp,
      template_provider_iroh,
      template_provider_bitcoin_core_ipc: config.template_provider_bitcoin_core_ipc,
      jdc_signature: config.jdc_signature,
      coinbase_reward_script: config.coinbase_reward_script,
      authority_public_key: config.authority_public_key,
      authority_secret_key: config.authority_secret_key,
      cert_validity_sec: config.cert_validity_sec,
      log_file: config.log_file,
      supported_extensions: config.supported_extensions.map((value) => ({ value })),
      required_extensions: config.required_extensions.map((value) => ({ value })),
      monitoring_enabled: config.monitoring_address.length > 0,
      monitoring_address: config.monitoring_address || '0.0.0.0:9091',
      monitoring_cache_refresh_secs: config.monitoring_cache_refresh_secs,
      upstreams: config.upstreams.map((u) => ({
        authority_pubkey: u.authority_pubkey,
        pool_address: u.pool_address,
        pool_port: u.pool_port,
        jds_address: u.jds_address,
        jds_port: u.jds_port,
        iroh_pool_node_id: u.iroh_pool_node_id ?? '',
        iroh_jds_node_id: u.iroh_jds_node_id ?? '',
        iroh_relay_url: u.iroh_relay_url ?? '',
        prefer_transport: u.prefer_transport ?? 'tcp',
      })),
      iroh,
    }
  },

  // the execution function
  async ({ effects, input }) => {
    // Build the optional [iroh] block from the form. The schema treats the
    // entire block as optional, so when 'enabled' is false we omit it entirely
    // (main.ts only emits the section when config.iroh is truthy).
    const irohBlock = input.iroh.enabled
      ? {
          listen_address: input.iroh.listen_address,
          secret_key_path: input.iroh.secret_key_path,
          relay_url: input.iroh.relay_url || '',
          discovery_relay_enable: input.iroh.discovery_relay_enable,
          discovery_pkarr_pub_enable: input.iroh.discovery_pkarr_pub_enable,
          discovery_pkarr_res_enable: input.iroh.discovery_pkarr_res_enable,
          discovery_dht_enable: input.iroh.discovery_dht_enable,
          discovery_n0_enable: input.iroh.discovery_n0_enable,
          max_idle_timeout_secs: input.iroh.max_idle_timeout_secs,
          keep_alive_interval_secs: input.iroh.keep_alive_interval_secs,
          per_request_timeout_secs: input.iroh.per_request_timeout_secs,
        }
      : undefined

    // Build the optional [template_provider_iroh] block. Emit only when the
    // user supplied an iroh_node_id; main.ts also gates emission on this.
    const tpIrohBlock = input.template_provider_iroh.iroh_node_id
      ? {
          iroh_node_id: input.template_provider_iroh.iroh_node_id,
          iroh_relay_url: input.template_provider_iroh.iroh_relay_url || '',
          prefer_transport: input.template_provider_iroh.prefer_transport,
        }
      : undefined

    const configData = {
      // Fixed values
      listening_address: '0.0.0.0:34265' as const,
      min_supported_version: 2 as const,
      max_supported_version: 2 as const,

      // User-configurable values
      user_identity: input.user_identity,
      shares_per_minute: input.shares_per_minute,
      share_batch_size: input.share_batch_size,
      reserved_downstream_rollable_extranonce_size:
        input.reserved_downstream_rollable_extranonce_size,
      mode: input.mode,
      template_provider_mode: input.template_provider_mode,
      template_provider_sv2_tp: {
        address: input.template_provider_sv2_tp.address,
        public_key: input.template_provider_sv2_tp.public_key || '',
      },
      template_provider_iroh: tpIrohBlock,
      template_provider_bitcoin_core_ipc: {
        network: input.template_provider_bitcoin_core_ipc.network,
        data_dir: input.template_provider_bitcoin_core_ipc.data_dir || '',
        fee_threshold: input.template_provider_bitcoin_core_ipc.fee_threshold,
        min_interval: input.template_provider_bitcoin_core_ipc.min_interval,
      },
      jdc_signature: input.jdc_signature,
      coinbase_reward_script: input.coinbase_reward_script,
      authority_public_key: input.authority_public_key,
      authority_secret_key: input.authority_secret_key,
      cert_validity_sec: input.cert_validity_sec,
      log_file: input.log_file || '',
      supported_extensions: input.supported_extensions.map((e) => e.value),
      required_extensions: input.required_extensions.map((e) => e.value),
      monitoring_address: input.monitoring_enabled ? (input.monitoring_address || '') : '',
      monitoring_cache_refresh_secs: input.monitoring_cache_refresh_secs,
      upstreams: input.upstreams.map((u) => ({
        authority_pubkey: u.authority_pubkey,
        pool_address: u.pool_address,
        pool_port: u.pool_port,
        jds_address: u.jds_address,
        jds_port: u.jds_port,
        iroh_pool_node_id: u.iroh_pool_node_id || undefined,
        iroh_jds_node_id: u.iroh_jds_node_id || undefined,
        iroh_relay_url: u.iroh_relay_url || undefined,
        prefer_transport: u.prefer_transport,
      })),
      iroh: irohBlock,
    }
    await configToml.merge(effects, configData)
  },
)
