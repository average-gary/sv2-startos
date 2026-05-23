import { setupManifest } from '@start9labs/start-sdk'
import { SDKImageInputSpec } from '@start9labs/start-sdk/base/lib/types/ManifestTypes'

const BUILD = process.env.BUILD || ''

const architectures =
  BUILD === 'x86_64' || BUILD === 'aarch64' ? [BUILD] : ['x86_64', 'aarch64']

export const manifest = setupManifest({
  id: 'sv2-pool',
  title: 'Pioneer Hash SV2 Pool',
  license: 'MIT OR Apache-2.0',
  wrapperRepo: 'https://github.com/PioneerHash/sv2-pool-startos',
  upstreamRepo: 'https://github.com/stratum-mining/sv2-apps',
  supportSite: 'https://stratumprotocol.org',
  marketingSite: 'https://stratumprotocol.org',
  donationUrl: 'https://opensats.org/projects/stratumv2',
  docsUrl:
    'https://github.com/stratum-mining/sv2-apps/blob/main/pool-apps/pool/README.md',
  description: {
    short: 'Pioneer Hash SV2 Pool',
    long: 'Pioneer Hash SV2 Pool provides a complete Stratum V2 (SV2) pool server for Bitcoin mining operations, communicating with downstream mining translators and proxies while connecting to Bitcoin Core via IPC for block templates.',
  },
  volumes: ['main'],
  images: {
    'sv2-pool': {
      source: {
        dockerBuild: {
          dockerfile: 'Dockerfile',
          workdir: '.',
        },
      },
      arch: architectures,
    } as SDKImageInputSpec,
    'sv2-pool-ui': {
      source: {
        dockerBuild: {
          dockerfile: 'Dockerfile.ui',
          workdir: '.',
        },
      },
      arch: architectures,
    } as SDKImageInputSpec,
  },
  hardwareRequirements: {
    arch: architectures,
  },
  alerts: {
    install:
      'IMPORTANT: Configure the Pool in the Config menu to set your mining reward address before starting. Bitcoin Core must be installed and running.',
    update: null,
    uninstall: null,
    restore: null,
    start:
      'Starting Pool. Ensure Bitcoin Core is installed and running with IPC enabled.',
    stop: null,
  },
  dependencies: {
    bitcoind: {
      description:
        'Bitcoin Core for direct IPC connection. Provides block templates via IPC socket. Only required when Template Provider Mode is set to Bitcoin Core IPC.',
      optional: true,
      s9pk: null,
    },
  },
})
