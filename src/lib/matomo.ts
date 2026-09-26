type Comando = [string, ...unknown[]]

declare global {
  interface Window {
    _paq?: Comando[]
  }
}

const URL_MATOMO = import.meta.env.VITE_MATOMO_URL ?? 'https://matomo.civeira.net/'
const SITIO = import.meta.env.VITE_MATOMO_SITE_ID

const enviar = (...comando: Comando) => window._paq?.push(comando)

/**
 * Carga el tracker de Matomo. Sin cookies y respetando «Do Not Track», por
 * lo que no requiere aviso de consentimiento.
 */
export function iniciarMatomo() {
  if (!SITIO || window._paq) return

  window._paq = [
    ['disableCookies'],
    ['setDoNotTrack', true],
    ['enableLinkTracking'],
    ['setTrackerUrl', `${URL_MATOMO}matomo.php`],
    ['setSiteId', SITIO],
  ]
  const script = document.createElement('script')
  script.async = true
  script.src = `${URL_MATOMO}matomo.js`
  document.head.append(script)
}

let urlAnterior: string | undefined

/** Visita de página: la SPA la notifica en cada cambio de ruta */
export function registrarVisita() {
  if (urlAnterior) enviar('setReferrerUrl', urlAnterior)
  enviar('setCustomUrl', location.href)
  enviar('setDocumentTitle', document.title)
  enviar('trackPageView')
  urlAnterior = location.href
}

export function registrarEvento(categoria: string, accion: string, nombre?: string) {
  enviar('trackEvent', categoria, accion, nombre)
}
