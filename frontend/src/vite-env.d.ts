/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_PLATFORM_PROVIDER?: string
  readonly VITE_PLATFORM_NAME?: string
  readonly VITE_INSTITUTION_NAME?: string
  readonly VITE_INSTITUTION_SHORT_NAME?: string
  readonly VITE_INSTITUTION_LOGO?: string
  readonly VITE_INSTITUTION_ADDRESS?: string
  readonly VITE_INSTITUTION_EMAIL?: string
  readonly VITE_INSTITUTION_EMAIL_DOMAIN?: string
  readonly VITE_INSTITUTION_PHONE?: string
  readonly VITE_INSTITUTION_WEBSITE?: string
  readonly VITE_INSTITUTION_PRIMARY_COLOR?: string
  readonly VITE_INSTITUTION_SECONDARY_COLOR?: string
  readonly VITE_REGULATORY_AUTHORITY?: string
  readonly VITE_INSTITUTION_TYPE?: string
  readonly VITE_PUBLIC_APP_DOMAIN?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
