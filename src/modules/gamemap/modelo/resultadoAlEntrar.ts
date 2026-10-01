/**
 * Qué pasa cuando un personaje entra en una casilla de su recorrido, según su
 * clase (`ClaseDePersonaje.alEntrar`): sigue moviéndose, se detiene en ella o
 * se detiene y termina su activación (ya no le quedan acciones en el turno)
 */
export type ResultadoAlEntrar = 'seguir' | 'detenerse' | 'terminar-turno'
