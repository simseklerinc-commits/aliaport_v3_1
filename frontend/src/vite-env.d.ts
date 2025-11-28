/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  // daha fazla env değişkeni buraya eklenebilir
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
