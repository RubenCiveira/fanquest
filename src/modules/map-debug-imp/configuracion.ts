import type { Configuracion } from '../gamemap'

/** Reglas del ejemplo si no se han cambiado: activaciones alternas, modo agresivo o sigiloso y movimiento sin diagonales */
export const CONFIGURACION_INICIAL: Configuracion = { ordenActivaciones: 'alternas', modosActivacion: 'agresivo-sigiloso', medicionMovimiento: 'ortogonal' }

/** Textos del formulario para cada valor de cada ajuste */
export const OPCIONES_CONFIGURACION: { [K in keyof Configuracion]: { etiqueta: string; valores: Record<Configuracion[K], string> } } = {
  ordenActivaciones: { etiqueta: 'Orden de activación', valores: { alternas: 'Alternas', 'personajes-primero': 'Todos los personajes primero' } },
  modosActivacion: { etiqueta: 'Modo de activación', valores: { 'agresivo-sigiloso': 'Agresivo o sigiloso', normal: 'Todas normales' } },
  medicionMovimiento: {
    etiqueta: 'Medición del movimiento',
    valores: { ortogonal: 'Sin diagonales', diagonal: 'Diagonal como recta', euclidea: 'Por Pitágoras (redondeando hacia arriba)' },
  },
}

const CLAVE = 'fetenquest.map-debug.configuracion.v2'

/** La configuración guardada en este navegador, con lo que falte de la inicial */
export function cargarConfiguracion(): Configuracion {
  try {
    return { ...CONFIGURACION_INICIAL, ...(JSON.parse(localStorage.getItem(CLAVE) ?? '{}') as Partial<Configuracion>) }
  } catch {
    return CONFIGURACION_INICIAL
  }
}

export function guardarConfiguracion(configuracion: Configuracion) {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(configuracion))
  } catch {
    // sin almacenamiento, la configuración dura lo que la página
  }
}
