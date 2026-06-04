import { configToml } from './fileModels/config.toml'
import { sdk } from './sdk'

function ipcSocketPath(network: string): string {
  const base = '/ipc'
  return network === 'mainnet' ? `${base}/node.sock` : `${base}/${network}/node.sock`
}

function tomlString(s: string): string {
  return `"${s.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`
}

type PoolConfig = ReturnType<typeof configToml.validate>

function renderConfig(config: PoolConfig): string {
  const lines: string[] = []
  lines.push('# Pioneer Hash SV2 Pool Configuration')
  lines.push(`authority_public_key = ${tomlString(config.authority_public_key)}`)
  lines.push(`authority_secret_key = ${tomlString(config.authority_secret_key)}`)
  lines.push(`cert_validity_sec = ${config.cert_validity_sec}`)
  lines.push(`listen_address = ${tomlString(config.listen_address)}`)
  lines.push('')
  lines.push(`coinbase_reward_script = ${tomlString(config.coinbase_reward_script)}`)
  lines.push(`server_id = ${config.server_id}`)
  lines.push(`pool_signature = ${tomlString(config.pool_signature)}`)
  if (config.log_file && config.log_file.length > 0) {
    lines.push(`log_file = ${tomlString(config.log_file)}`)
  }
  lines.push('')
  lines.push(`shares_per_minute = ${config.shares_per_minute}`)
  lines.push(`share_batch_size = ${config.share_batch_size}`)
  lines.push('')
  lines.push(`supported_extensions = [${config.supported_extensions.join(', ')}]`)
  lines.push(`required_extensions = [${config.required_extensions.join(', ')}]`)

  // Monitoring is always enabled internally so the UI sidecar can reach it on localhost:9090.
  // The user-facing toggle (config.monitoring.enabled) controls whether to also expose
  // monitoring as a separate StartOS interface for external Prometheus scraping.
  lines.push(`monitoring_address = "0.0.0.0:9090"`)
  lines.push(`monitoring_cache_refresh_secs = ${config.monitoring.cache_refresh_secs}`)

  lines.push('')

  if (config.template_provider.mode === 'bitcoin_core_ipc') {
    const ipc = config.template_provider.bitcoin_core_ipc
    const dataDir = ipc.data_dir && ipc.data_dir.length > 0 ? ipc.data_dir : '/ipc'
    lines.push('[template_provider_type.BitcoinCoreIpc]')
    lines.push(`network = ${tomlString(ipc.network)}`)
    lines.push(`data_dir = ${tomlString(dataDir)}`)
    lines.push(`fee_threshold = ${ipc.fee_threshold}`)
    lines.push(`min_interval = ${ipc.min_interval}`)
  } else {
    const sv2 = config.template_provider.sv2_tp
    lines.push('[template_provider_type.Sv2Tp]')
    lines.push(`address = ${tomlString(sv2.address)}`)
    if (sv2.public_key && sv2.public_key.length > 0) {
      lines.push(`public_key = ${tomlString(sv2.public_key)}`)
    }
  }

  if (config.jds.enabled) {
    lines.push('')
    lines.push('[jds]')
    lines.push(`listen_address = ${tomlString(config.jds.listen_address)}`)
    lines.push(`supported_extensions = [${config.jds.supported_extensions.join(', ')}]`)
    lines.push(`required_extensions = [${config.jds.required_extensions.join(', ')}]`)
  }

  // [iroh] block — emit only when enabled. When disabled, the upstream binary
  // takes the no-iroh code path even if compiled with the iroh-transport feature.
  // Schema mirrors fork's pool-config-bitcoin-core-ipc-example.toml.
  if (config.iroh.enabled) {
    lines.push('')
    lines.push('[iroh]')
    lines.push(`listen_address = ${tomlString(config.iroh.listen_address)}`)
    lines.push(`secret_key_path = ${tomlString(config.iroh.secret_key_path)}`)
    if (config.iroh.relay_url && config.iroh.relay_url.length > 0) {
      lines.push(`relay_url = ${tomlString(config.iroh.relay_url)}`)
    }
    lines.push(`discovery_relay_enable = ${config.iroh.discovery_relay_enable}`)
    lines.push(`discovery_pkarr_pub_enable = ${config.iroh.discovery_pkarr_pub_enable}`)
    lines.push(`discovery_pkarr_res_enable = ${config.iroh.discovery_pkarr_res_enable}`)
    lines.push(`discovery_dht_enable = ${config.iroh.discovery_dht_enable}`)
    lines.push(`discovery_n0_enable = ${config.iroh.discovery_n0_enable}`)
    lines.push(`max_idle_timeout_secs = ${config.iroh.max_idle_timeout_secs}`)
    lines.push(`keep_alive_interval_secs = ${config.iroh.keep_alive_interval_secs}`)
    lines.push(`per_request_timeout_secs = ${config.iroh.per_request_timeout_secs}`)
  }

  return lines.join('\n') + '\n'
}

export const main = sdk.setupMain(async ({ effects, started }) => {
  console.info('Starting Pioneer Hash SV2 Pool!')

  const config = await configToml.read().const(effects)

  const defaultTestnetAddress = 'addr(tb1qa0sm0hxzj0x25rh8gw5xlzwlsfvvyz8u96w3p8)'

  if (
    !config ||
    !config.coinbase_reward_script ||
    config.coinbase_reward_script === defaultTestnetAddress
  ) {
    throw new Error(
      'Configuration Required: You must configure a Bitcoin address for mining rewards. ' +
        'The default testnet address cannot be used. ' +
        'Please run the "Configure Pool" action and enter your Bitcoin address where mining rewards should be sent.',
    )
  }

  const configContent = renderConfig(config)
  const useIpc = config.template_provider.mode === 'bitcoin_core_ipc'
  const expectedSocketPath = useIpc
    ? ipcSocketPath(config.template_provider.bitcoin_core_ipc.network)
    : null

  const initContainer = await sdk.SubContainer.of(
    effects,
    { imageId: 'sv2-pool' },
    sdk.Mounts.of().mountVolume({
      volumeId: 'main',
      subpath: null,
      mountpoint: '/data',
      readonly: false,
    }),
    'sv2-pool-init',
  )

  await initContainer.exec([
    'sh',
    '-c',
    `cat > /data/config.toml << 'EOF'\n${configContent}\nEOF`,
  ])
  await initContainer.destroy()

  console.info(
    useIpc
      ? 'Pool configured with Bitcoin Core IPC'
      : 'Pool configured with remote Sv2 Template Provider',
  )

  let mounts = sdk.Mounts.of().mountVolume({
    volumeId: 'main',
    subpath: null,
    mountpoint: '/data',
    readonly: false,
  })

  if (useIpc) {
    mounts = mounts.mountDependency({
      dependencyId: 'bitcoind',
      volumeId: 'main',
      subpath: 'ipc',
      mountpoint: '/ipc',
      readonly: true,
    })
    console.info('Mounting Bitcoin Core IPC socket for direct connection')
  }

  const subcontainer = await sdk.SubContainer.of(
    effects,
    { imageId: 'sv2-pool' },
    mounts,
    'sv2-pool-sub',
  )

  if (useIpc && expectedSocketPath) {
    console.info('Validating Bitcoin Core IPC socket availability...')
    const ipcCheck = await subcontainer.exec(['test', '-S', expectedSocketPath])

    if (ipcCheck.exitCode !== 0) {
      await subcontainer.destroy()
      throw new Error(
        `Bitcoin Core IPC socket not found at ${expectedSocketPath}. ` +
          `Ensure Bitcoin Core has IPC enabled in its configuration.`,
      )
    }
    console.info('Bitcoin Core IPC socket validated successfully')
  }

  const uiSubcontainer = await sdk.SubContainer.of(
    effects,
    { imageId: 'sv2-pool-ui' },
    sdk.Mounts.of().mountVolume({
      volumeId: 'main',
      subpath: null,
      mountpoint: '/data',
      readonly: true,
    }),
    'sv2-pool-ui-sub',
  )

  const daemons = sdk.Daemons.of(effects, started)
    .addDaemon('primary', {
      subcontainer,
      exec: {
        command: ['pool_sv2', '-c', '/data/config.toml'],
      },
      ready: {
        display: 'Pioneer Hash SV2 Pool Service',
        fn: () =>
          sdk.healthCheck.checkPortListening(effects, 34254, {
            successMessage: 'Pioneer Hash SV2 Pool is accepting connections',
            errorMessage: 'Pioneer Hash SV2 Pool is not ready',
          }),
      },
      requires: [],
    })
    .addDaemon('ui', {
      subcontainer: uiSubcontainer,
      exec: { command: ['/entrypoint.sh'] },
      ready: {
        display: 'Pioneer Hash SV2 Pool Dashboard',
        fn: () =>
          sdk.healthCheck.checkPortListening(effects, 80, {
            successMessage: 'Dashboard is reachable',
            errorMessage: 'Dashboard is not ready',
          }),
      },
      requires: ['primary'],
    })

  if (useIpc && expectedSocketPath) {
    daemons.addHealthCheck('ipc-validation', {
      ready: {
        display: 'Bitcoin Core IPC Connection',
        fn: async () => {
          const ipcCheck = await subcontainer.exec([
            'test',
            '-S',
            expectedSocketPath,
          ])

          if (ipcCheck.exitCode !== 0) {
            return {
              result: 'failure' as const,
              message: `Bitcoin Core IPC socket not available at ${expectedSocketPath}. Check that Bitcoin Core has IPC enabled.`,
            }
          }

          return {
            result: 'success' as const,
            message: 'Bitcoin Core IPC socket is available',
          }
        },
      },
      requires: ['primary'],
    })
  }

  // Iroh listener health check. Reports 'disabled' when [iroh] is absent or
  // explicitly disabled. When enabled, scrapes the in-process Prometheus
  // monitoring endpoint (always bound on 127.0.0.1:9090 inside the
  // subcontainer) and confirms the binary registered the
  // `sv2_iroh_active_connections` metric family. Any non-error response
  // containing that family — even with active count 0 — is sufficient
  // evidence that the iroh listener is up.
  daemons.addHealthCheck('iroh-listener', {
    ready: {
      display: 'Iroh Transport Listener',
      fn: async () => {
        if (!config.iroh || config.iroh.enabled !== true) {
          return {
            result: 'disabled' as const,
            message: 'Iroh transport disabled',
          }
        }

        const probe = await subcontainer.exec([
          'sh',
          '-c',
          'curl -fsS http://127.0.0.1:9090/metrics | grep -c "^sv2_iroh_active_connections" || true',
        ])

        if (probe.exitCode !== 0) {
          return {
            result: 'failure' as const,
            message: `Unable to reach monitoring endpoint at 127.0.0.1:9090/metrics (exit ${probe.exitCode}).`,
          }
        }

        const matchCount = parseInt((probe.stdout ?? '').toString().trim(), 10)
        if (!Number.isFinite(matchCount) || matchCount <= 0) {
          return {
            result: 'failure' as const,
            message:
              'Monitoring endpoint reachable but no sv2_iroh_* metrics present — iroh listener did not register (binary may be built without the iroh-transport-monitoring feature, or listener failed to start).',
          }
        }

        return {
          result: 'success' as const,
          message: `Iroh listener registered (role=pool) on ${config.iroh.listen_address}`,
        }
      },
    },
    requires: ['primary'],
  })

  return daemons
})
