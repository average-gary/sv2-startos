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
  const upstreamsToml = config.upstreams
    .map(
      (u) => `[[upstreams]]
authority_pubkey = "${u.authority_pubkey}"
pool_address = "${u.pool_address}"
pool_port = ${u.pool_port}
jds_address = "${u.jds_address}"
jds_port = ${u.jds_port}
`,
    )
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

  const logFileLine = config.log_file
    ? `log_file = "${config.log_file}"\n`
    : ''
  const monitoringLines = config.monitoring_address
    ? `monitoring_address = "${config.monitoring_address}"
monitoring_cache_refresh_secs = ${config.monitoring_cache_refresh_secs}
`
    : ''

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
${tpSection}`

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

  return sdk.Daemons.of(effects, started).addDaemon('primary', {
    subcontainer: await sdk.SubContainer.of(
      effects,
      { imageId: 'sv2-jd-client' },
      sdk.Mounts.of().mountVolume({
        volumeId: 'main',
        subpath: null,
        mountpoint: '/data',
        readonly: false,
      }),
      'sv2-jd-client-sub',
    ),
    exec: {
      command: ['jd_client_sv2', '-c', '/data/config.toml'],
    },
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
})
