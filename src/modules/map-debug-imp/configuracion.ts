import type { Configuracion, Jugadores } from '../gamemap'

/** Jugador (la IA) de los monstruos de prueba */
export const JUGADOR_MONSTRUOS = 'oscuridad'

/**
 * Reparto de prueba: Ana (el bárbaro) y Bruno (el enano), humanos de los
 * Héroes; la Oscuridad, IA de los Monstruos, hostiles entre sí; y los
 * Mercenarios, sin nadie, para pasar a alguien a otra alianza
 */
export const JUGADORES_DE_PRUEBA: Jugadores = {
  alianzas: [
    { id: 'heroes', nombre: 'Héroes', posturas: { monstruos: 'hostil' } },
    { id: 'monstruos', nombre: 'Monstruos', posturas: { heroes: 'hostil', mercenarios: 'hostil' } },
    { id: 'mercenarios', nombre: 'Mercenarios' },
  ],
  jugadores: [
    { id: 'ana', nombre: 'Ana', tipo: 'humano', alianza: 'heroes' },
    { id: 'bruno', nombre: 'Bruno', tipo: 'humano', alianza: 'heroes' },
    { id: JUGADOR_MONSTRUOS, nombre: 'La Oscuridad', tipo: 'ia', alianza: 'monstruos' },
  ],
}

/** Reglas del ejemplo si no se han cambiado: activaciones alternas, modo agresivo o sigiloso, movimiento sin diagonales y por encima de los demás personajes */
export const CONFIGURACION_INICIAL: Configuracion = {
  ordenActivaciones: 'alternas',
  modosActivacion: 'agresivo-sigiloso',
  medicionMovimiento: 'ortogonal',
  terrenoPersonajes: 'normal',
  jugadores: JUGADORES_DE_PRUEBA,
}

/** Ajustes del formulario: el reparto de jugadores se cambia en la partida */
export type Ajuste = Exclude<keyof Configuracion, 'jugadores'>

/** Textos del formulario para cada valor de cada ajuste */
export const OPCIONES_CONFIGURACION: { [K in Ajuste]: { etiqueta: string; valores: Record<Configuracion[K], string> } } = {
  ordenActivaciones: { etiqueta: 'Orden de activación', valores: { alternas: 'Alternas entre alianzas', 'personajes-primero': 'Alianza a alianza' } },
  modosActivacion: { etiqueta: 'Modo de activación', valores: { 'agresivo-sigiloso': 'Agresivo o sigiloso', normal: 'Todas normales' } },
  medicionMovimiento: {
    etiqueta: 'Medición del movimiento',
    valores: { ortogonal: 'Sin diagonales', diagonal: 'Diagonal como recta', euclidea: 'Por Pitágoras (redondeando hacia arriba)' },
  },
  terrenoPersonajes: {
    etiqueta: 'Casilla con un personaje',
    valores: { normal: 'Normal (se pasa por encima)', dificil: 'Difícil', 'muy-dificil': 'Muy difícil', impasable: 'Impasable (bloquea el paso)' },
  },
}

const CLAVE = 'fetenquest.map-debug.configuracion.v3'

/** La configuración guardada en este navegador, con lo que falte de la inicial y el reparto de prueba */
export function cargarConfiguracion(): Configuracion {
  try {
    return { ...CONFIGURACION_INICIAL, ...(JSON.parse(localStorage.getItem(CLAVE) ?? '{}') as Partial<Configuracion>), jugadores: JUGADORES_DE_PRUEBA }
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
