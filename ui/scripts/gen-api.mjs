#!/usr/bin/env node
// Regenerate src/api/generated/schema.ts from upstream OpenAPI.
// Looks for sv2-apps submodule first; otherwise prompts for a URL.
import { execSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'

const here = resolve(new URL(import.meta.url).pathname, '..')
const candidates = [
  resolve(here, '../../sv2-apps/stratum-apps/src/monitoring/openapi.json'),
  resolve(here, '../../../sv2-apps/stratum-apps/src/monitoring/openapi.json'),
]
const spec = candidates.find((p) => existsSync(p))
if (!spec) {
  console.error('Could not find openapi.json in sv2-apps submodule. Tried:')
  for (const p of candidates) console.error('  -', p)
  process.exit(1)
}
const out = resolve(here, '../src/api/generated/schema.ts')
console.log(`Generating ${out} from ${spec}`)
execSync(`npx openapi-typescript "${spec}" -o "${out}"`, { stdio: 'inherit' })
