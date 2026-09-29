/** Reglas de activación que fija el proyecto */
export type Configuracion = {
  /** Héroes y enemigos se van turnando al activarse, o se activan primero todos los héroes */
  ordenActivaciones: 'alternas' | 'heroes-primero'
  /** Si cada héroe elige activarse en modo agresivo o sigiloso, o todas las activaciones son normales */
  modosActivacion: 'normal' | 'agresivo-sigiloso'
}
