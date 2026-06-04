import { configToml } from './fileModels/config.toml'
import { sdk } from './sdk'

export const main = sdk.setupMain(async ({ effects, started }) => {
  console.info('Starting Pioneer Hash JD Client!')

  // Read and validate configuration
  const config = await configToml.read().const(effects)

  const defaultTestnetAddress = 'addr(tb1qa0sm0hxzj0x25rh8gw5xlzwlsfvvyz8u96w3p8)'

  if (
    !config ||
    !config.coinbase_reward_script ||
    config.coinbase_reward_script === defaultTestnetAddress
  ) {
    throw new Error(
      'Configuration Required: You must configure a Bitcoin address for solo mining fallback. ' +
        'The default testnet address cannot be used. ' +
        'Please run the "Configure JD Client" action and enter your Bitcoin address.',
    )
  }

  // Render the upstream array. SOLOMINING uses an empty list.
  // Optional iroh fields are emitted only when set, keeping output backward-compatible.
  const upstreamsToml = config.upstreams
    .map((u) => {
      const irohPoolLine = u.iroh_pool_node_id
        ? `iroh_pool_node_id = "${u.iroh_pool_node_id}"\n`
        : ''
      const irohJdsLine = u.iroh_jds_node_id
        ? `iroh_jds_node_id = "${u.iroh_jds_node_id}"\n`
        : ''
      const irohRelayLine = u.iroh_relay_url
        ? `iroh_relay_url = "${u.iroh_relay_url}"\n`
        : ''
      const preferLine = u.prefer_transport
        ? `prefer_transport = "${u.prefer_transport}"\n`
        : ''
      return `[[upstreams]]
authority_pubkey = "${u.authority_pubkey}"
pool_address = "${u.pool_address}"
pool_port = ${u.pool_port}
jds_address = "${u.jds_address}"
jds_port = ${u.jds_port}
${irohPoolLine}${irohJdsLine}${irohRelayLine}${preferLine}`
    })
    .join('\n')

  // Render the template_provider_type nested table.
  let tpSection: string
  if (config.template_provider_mode === 'bitcoin_core_ipc') {
    const tp = config.template_provider_bitcoin_core_ipc
    const dataDirLine = tp.data_dir ? `data_dir = "${tp.data_dir}"\n` : ''
    tpSection = `[template_provider_type.BitcoinCoreIpc]
network = "${tp.network}"
${dataDirLine}fee_threshold = ${tp.fee_threshold}
min_interval = ${tp.min_interval}
`
  } else {
    const tp = config.template_provider_sv2_tp
    const pubkeyLine = tp.public_key ? `public_key = "${tp.public_key}"\n` : ''
    tpSection = `[template_provider_type.Sv2Tp]
address = "${tp.address}"
${pubkeyLine}`
  }

  // Optional [template_provider_iroh] block (additive). Emit only if user provided
  // an iroh_node_id; the JDC binary ignores the section when not built with the
  // iroh-transport feature.
  let tpIrohSection = ''
  if (
    config.template_provider_iroh &&
    config.template_provider_iroh.iroh_node_id
  ) {
    const tpi = config.template_provider_iroh
    const tpiRelay = tpi.iroh_relay_url
      ? `iroh_relay_url = "${tpi.iroh_relay_url}"\n`
      : ''
    const tpiPrefer = tpi.prefer_transport
      ? `prefer_transport = "${tpi.prefer_transport}"\n`
      : ''
    tpIrohSection = `
[template_provider_iroh]
iroh_node_id = "${tpi.iroh_node_id}"
${tpiRelay}${tpiPrefer}`
  }

  // Optional top-level [iroh] block. Match the canonical schema from the
  // pool config example. Emitted only when the user explicitly enables iroh.
  let irohSection = ''
  if (config.iroh) {
    const ir = config.iroh
    irohSection = `
[iroh]
listen_address = "${ir.listen_address}"
secret_key_path = "${ir.secret_key_path}"
relay_url = "${ir.relay_url}"
discovery_relay_enable = ${ir.discovery_relay_enable}
discovery_pkarr_pub_enable = ${ir.discovery_pkarr_pub_enable}
discovery_pkarr_res_enable = ${ir.discovery_pkarr_res_enable}
discovery_dht_enable = ${ir.discovery_dht_enable}
discovery_n0_enable = ${ir.discovery_n0_enable}
max_idle_timeout_secs = ${ir.max_idle_timeout_secs}
keep_alive_interval_secs = ${ir.keep_alive_interval_secs}
per_request_timeout_secs = ${ir.per_request_timeout_secs}
`
  }

  const logFileLine = config.log_file
    ? `log_file = "${config.log_file}"\n`
    : ''
  // Monitoring is always on internally so the UI sidecar can reach it on localhost:9090.
  const monitoringLines = `monitoring_address = "0.0.0.0:9090"
monitoring_cache_refresh_secs = ${config.monitoring_cache_refresh_secs || 15}
`

  const supportedExt = config.supported_extensions.join(', ')
  const requiredExt = config.required_extensions.join(', ')

  const configContent = `# Pioneer Hash JD Client Configuration
listening_address = "${config.listening_address}"
max_supported_version = ${config.max_supported_version}
min_supported_version = ${config.min_supported_version}

authority_public_key = "${config.authority_public_key}"
authority_secret_key = "${config.authority_secret_key}"
cert_validity_sec = ${config.cert_validity_sec}

user_identity = "${config.user_identity}"
shares_per_minute = ${config.shares_per_minute}
share_batch_size = ${config.share_batch_size}
reserved_downstream_rollable_extranonce_size = ${config.reserved_downstream_rollable_extranonce_size}

mode = "${config.mode}"
jdc_signature = "${config.jdc_signature}"
coinbase_reward_script = "${config.coinbase_reward_script}"
${logFileLine}
supported_extensions = [${supportedExt}]
required_extensions = [${requiredExt}]

${monitoringLines}${upstreamsToml}
${tpSection}${tpIrohSection}${irohSection}`

  const initContainer = await sdk.SubContainer.of(
    effects,
    { imageId: 'sv2-jd-client' },
    sdk.Mounts.of().mountVolume({
      volumeId: 'main',
      subpath: null,
      mountpoint: '/data',
      readonly: false,
    }),
    'sv2-jd-client-init',
  )

  await initContainer.exec([
    'sh',
    '-c',
    `cat > /data/config.toml << 'EOF'\n${configContent}\nEOF`,
  ])
  await initContainer.destroy()

  console.info('JD Client config rendered to /data/config.toml')

  const subcontainer = await sdk.SubContainer.of(
    effects,
    { imageId: 'sv2-jd-client' },
    sdk.Mounts.of().mountVolume({
      volumeId: 'main',
      subpath: null,
      mountpoint: '/data',
      readonly: false,
    }),
    'sv2-jd-client-sub',
  )

  const uiSubcontainer = await sdk.SubContainer.of(
    effects,
    { imageId: 'sv2-jd-client-ui' },
    sdk.Mounts.of().mountVolume({
      volumeId: 'main',
      subpath: null,
      mountpoint: '/data',
      readonly: true,
    }),
    'sv2-jd-client-ui-sub',
  )

  // Determine whether iroh transport is enabled for this service. The jdc
  // schema has no explicit `enabled` flag — presence of the [iroh] block is
  // the signal. We still defensively honour an `enabled === false` override
  // in case the schema later grows one.
  const irohEnabled =
    !!config.iroh &&
    (config.iroh as { enabled?: boolean }).enabled !== false
  // Role label used by the iroh-transport metrics in /metrics. JDC dials
  // upstreams (so it has no listener proper) but iroh-transport still emits
  // sv2_iroh_active_connections{role="jdc"} for outbound connections, so the
  // same registry-presence probe applies.
  const irohRole = 'jdc'

  const daemons = sdk.Daemons.of(effects, started)
    .addDaemon('primary', {
      subcontainer,
      exec: { command: ['jd_client_sv2', '-c', '/data/config.toml'] },
      ready: {
        display: 'Pioneer Hash JD Client Service',
        fn: () =>
          sdk.healthCheck.checkPortListening(effects, 34265, {
            successMessage: 'Pioneer Hash JD Client is accepting connections',
            errorMessage: 'Pioneer Hash JD Client is not ready',
          }),
      },
      requires: [],
    })
    .addDaemon('ui', {
      subcontainer: uiSubcontainer,
      exec: { command: ['/entrypoint.sh'] },
      ready: {
        display: 'Pioneer Hash JD Client Dashboard',
        fn: () =>
          sdk.healthCheck.checkPortListening(effects, 80, {
            successMessage: 'Dashboard is reachable',
            errorMessage: 'Dashboard is not ready',
          }),
      },
      requires: ['primary'],
    })
    .addHealthCheck('iroh-listener', {
      ready: {
        display: 'Iroh Transport',
        fn: async () => {
          if (!irohEnabled) {
            return {
              result: 'disabled' as const,
              message: 'Iroh transport disabled',
            }
          }
          // Probe the in-process monitoring server's /metrics endpoint and
          // count lines beginning with `sv2_iroh_active_connections`. Any
          // non-zero count means the iroh listener registered with the
          // prometheus registry — value 0 is fine on idle. We pipe to
          // `|| true` so a curl/grep non-match never trips `set -e`; we then
          // pattern-match the captured output ourselves.
          const probe = await subcontainer.exec([
            'sh',
            '-c',
            'curl -fsS http://127.0.0.1:9090/metrics | grep -c "^sv2_iroh_active_connections" || true',
          ])
          if (probe.exitCode !== 0) {
            return {
              result: 'failure' as const,
              message: `Failed to probe /metrics (exit ${probe.exitCode ?? 'null'}): ${
                typeof probe.stderr === 'string'
                  ? probe.stderr
                  : probe.stderr.toString()
              }`.trim(),
            }
          }
          const stdout = (
            typeof probe.stdout === 'string'
              ? probe.stdout
              : probe.stdout.toString()
          ).trim()
          const count = Number.parseInt(stdout, 10)
          if (!Number.isFinite(count) || count <= 0) {
            return {
              result: 'failure' as const,
              message:
                'Iroh metrics absent from /metrics — listener did not register with the prometheus registry. ' +
                'Is the binary built with the iroh-transport-monitoring feature?',
            }
          }
          return {
            result: 'success' as const,
            message: `Iroh transport up (role=${irohRole}, ${count} sv2_iroh_active_connections series)`,
          }
        },
      },
      requires: ['primary'],
    })

  return daemons
})
