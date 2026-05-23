import { setupManifest } from '@start9labs/start-sdk'
import { SDKImageInputSpec } from '@start9labs/start-sdk/base/lib/types/ManifestTypes'

const BUILD = process.env.BUILD || ''

const architectures =
  BUILD === 'x86_64' || BUILD === 'aarch64' ? [BUILD] : ['x86_64', 'aarch64']

export const manifest = setupManifest({
  id: 'sv2-jd-client',
  title: 'Pioneer Hash JD Client',
  license: 'MIT OR Apache-2.0',
  wrapperRepo: 'https://github.com/PioneerHash/sv2-jd-client-startos',
  upstreamRepo: 'https://github.com/stratum-mining/sv2-apps',
  supportSite: 'https://stratumprotocol.org',
  marketingSite: 'https://stratumprotocol.org',
  donationUrl: 'https://opensats.org/projects/stratumv2',
  docsUrl:
    'https://github.com/stratum-mining/sv2-apps/blob/main/miner-apps/jd-client/README.md',
  description: {
    short: 'Pioneer Hash SV2 Job Declarator Client',
    long: 'Pioneer Hash JD Client allows miners to declare custom block templates for decentralized mining, enabling full control over transaction selection while connecting to pools.',
  },
  volumes: ['main'],
  images: {
    'sv2-jd-client': {
      source: {
        dockerBuild: {
          dockerfile: 'Dockerfile',
          workdir: '.',
        },
      },
      arch: architectures,
    } as SDKImageInputSpec,
    'sv2-jd-client-ui': {
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
    install: null,
    update: null,
    uninstall: null,
    restore: null,
    start: null,
    stop: null,
  },
  dependencies: {},
})
