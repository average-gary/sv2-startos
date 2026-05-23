/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SERVICE?: 'pool' | 'translator' | 'jdc'
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
