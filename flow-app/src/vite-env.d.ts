/// <reference types="vite/client" />

declare const __APP_VERSION__: string;

interface ImportMetaEnv {
  readonly VITE_OPENAI_API_KEY?: string;
  readonly VITE_OPENAI_MODEL?: string;
  readonly VITE_ENABLE_MUSCLE_ANALYSIS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
