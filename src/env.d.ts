interface ImportMetaEnv {
  /** URL de la instalación de Matomo, terminada en / */
  readonly VITE_MATOMO_URL?: string
  /** Sin ID de sitio no se registra nada (p. ej. en desarrollo) */
  readonly VITE_MATOMO_SITE_ID?: string
}
