import { configToml } from './fileModels/config.toml'
import { sdk } from './sdk'

function tomlString(s: string): string {
  return `"${s.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`
}

type TranslatorConfig = ReturnType<typeof configToml.validate>

function renderConfig(config: TranslatorConfig): string {
  const lines: string[] = []
  lines.push('# Pioneer Hash TProxy Configuration')
  lines.push(`downstream_address = ${tomlString(config.downstream_address)}`)
  lines.push(`downstream_port = ${config.downstream_port}`)
  lines.push('')
  lines.push(`max_supported_version = ${config.max_supported_version}`)
  lines.push(`min_supported_version = ${config.min_supported_version}`)
  lines.push(`downstream_extranonce2_size = ${config.downstream_extranonce2_size}`)
  lines.push('')
  lines.push(`user_identity = ${tomlString(config.user_identity)}`)
  lines.push(`aggregate_channels = ${config.aggregate_channels}`)

  if (config.log_file && config.log_file.length > 0) {
    lines.push(`log_file = ${tomlString(config.log_file)}`)
  }

  lines.push('')
  lines.push(`supported_extensions = [${config.supported_extensions.join(', ')}]`)
  lines.push(`required_extensions = [${config.required_extensions.join(', ')}]`)
  lines.push('')

  // Monitoring is always on internally so the UI sidecar can reach it on localhost:9090.
  lines.push(`monitoring_address = "0.0.0.0:9090"`)
  lines.push(
    `monitoring_cache_refresh_secs = ${config.monitoring_cache_refresh_secs ?? 15}`,
  )
  lines.push('')

  lines.push('[downstream_difficulty_config]')
  lines.push(`min_individual_miner_hashrate = ${config.downstream_difficulty_config.min_individual_miner_hashrate}`)
  lines.push(`shares_per_minute = ${config.downstream_difficulty_config.shares_per_minute}`)
  lines.push(`enable_vardiff = ${config.downstream_difficulty_config.enable_vardiff}`)
  lines.push(`job_keepalive_interval_secs = ${config.downstream_difficulty_config.job_keepalive_interval_secs}`)
  lines.push('')

  for (const u of config.upstreams) {
    lines.push('[[upstreams]]')
    lines.push(`address = ${tomlString(u.address)}`)
    lines.push(`port = ${u.port}`)
    lines.push(`authority_pubkey = ${tomlString(u.authority_pubkey)}`)
    lines.push('')
  }

  return lines.join('\n') + '\n'
}

export const main = sdk.setupMain(async ({ effects, started }) => {
  console.info('Starting Pioneer Hash TProxy!')

  const config = await configToml.read().const(effects)
  if (!config) {
    throw new Error(
      'Configuration Required: please run the "Configure Translator" action.',
    )
  }
  if (config.upstreams.length === 0 || !config.upstreams[0].address) {
    throw new Error(
      'Configuration Required: please configure at least one upstream pool address.',
    )
  }

  const configContent = renderConfig(config)

  const initContainer = await sdk.SubContainer.of(
    effects,
    { imageId: 'sv2-tproxy' },
    sdk.Mounts.of().mountVolume({
      volumeId: 'main',
      subpath: null,
      mountpoint: '/data',
      readonly: false,
    }),
    'sv2-tproxy-init',
  )
  await initContainer.exec([
    'sh',
    '-c',
    `cat > /data/config.toml << 'EOF'\n${configContent}\nEOF`,
  ])
  await initContainer.destroy()

  const subcontainer = await sdk.SubContainer.of(
    effects,
    { imageId: 'sv2-tproxy' },
    sdk.Mounts.of().mountVolume({
      volumeId: 'main',
      subpath: null,
      mountpoint: '/data',
      readonly: false,
    }),
    'sv2-tproxy-sub',
  )

  const uiSubcontainer = await sdk.SubContainer.of(
    effects,
    { imageId: 'sv2-tproxy-ui' },
    sdk.Mounts.of().mountVolume({
      volumeId: 'main',
      subpath: null,
      mountpoint: '/data',
      readonly: true,
    }),
    'sv2-tproxy-ui-sub',
  )

  return sdk.Daemons.of(effects, started)
    .addDaemon('primary', {
      subcontainer,
      exec: { command: ['translator_sv2', '-c', '/data/config.toml'] },
      ready: {
        display: 'Pioneer Hash TProxy Service',
        fn: () =>
          sdk.healthCheck.checkPortListening(effects, 34255, {
            successMessage: 'Pioneer Hash TProxy is accepting mining device connections',
            errorMessage: 'Pioneer Hash TProxy is not ready',
          }),
      },
      requires: [],
    })
    .addDaemon('ui', {
      subcontainer: uiSubcontainer,
      exec: { command: ['/entrypoint.sh'] },
      ready: {
        display: 'Pioneer Hash TProxy Dashboard',
        fn: () =>
          sdk.healthCheck.checkPortListening(effects, 80, {
            successMessage: 'Dashboard is reachable',
            errorMessage: 'Dashboard is not ready',
          }),
      },
      requires: ['primary'],
    })
})
