import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import { api } from './client'
import { SERVICE, supports } from '~/lib/service'

const REFRESH_MS = 5_000

export const useGlobal = () =>
  useQuery({ queryKey: ['global'], queryFn: api.global, refetchInterval: REFRESH_MS })

export const useHealth = () =>
  useQuery({ queryKey: ['health'], queryFn: api.health, refetchInterval: REFRESH_MS })

export const useServer = (): UseQueryResult<ReturnType<typeof api.server> extends Promise<infer T> ? T : never> =>
  useQuery({
    queryKey: ['server'],
    queryFn: api.server,
    enabled: supports.server(SERVICE),
    refetchInterval: REFRESH_MS,
  })

export const useClients = (offset = 0, limit = 25) =>
  useQuery({
    queryKey: ['clients', offset, limit],
    queryFn: () => api.clients(offset, limit),
    enabled: supports.clients(SERVICE),
    refetchInterval: REFRESH_MS,
  })

export const useSv1Clients = (offset = 0, limit = 25) =>
  useQuery({
    queryKey: ['sv1Clients', offset, limit],
    queryFn: () => api.sv1Clients(offset, limit),
    enabled: supports.sv1Clients(SERVICE),
    refetchInterval: REFRESH_MS,
  })

export const useConfig = () =>
  useQuery({ queryKey: ['config'], queryFn: api.config, refetchInterval: 30_000 })
