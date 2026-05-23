export type Service = 'pool' | 'translator' | 'jdc'

const raw = (import.meta.env.VITE_SERVICE ?? 'pool') as string
const valid: Service[] = ['pool', 'translator', 'jdc']

export const SERVICE: Service = (valid.includes(raw as Service) ? raw : 'pool') as Service

export const SERVICE_LABEL: Record<Service, string> = {
  pool: 'Pioneer Hash SV2 Pool',
  translator: 'Pioneer Hash TProxy',
  jdc: 'Pioneer Hash JD Client',
}

export const SERVICE_TAG: Record<Service, string> = {
  pool: 'POOL',
  translator: 'TPROXY',
  jdc: 'JDC',
}

export const supports = {
  server: (s: Service) => s === 'translator' || s === 'jdc',
  clients: (s: Service) => s === 'pool' || s === 'jdc',
  sv1Clients: (s: Service) => s === 'translator',
} as const
