/**
 * Un hueco del orden de un turno (`ordenActivaciones: 'iniciativa'`): le toca
 * a `jugador` hasta `activaciones` activaciones seguidas; sin decirlo, todas
 * las que le queden (el turno escoba de los monstruos…)
 */
export type HuecoDelTurno = { jugador: string; activaciones?: number }

/** El orden del turno `numero`, que da el proveedor al empezarlo: sus huecos, en orden */
export type OrdenDelTurno = { numero: number; huecos: HuecoDelTurno[] }
