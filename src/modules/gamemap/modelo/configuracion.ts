/** Reglas de activación y de movimiento que fija el proyecto */
export type Configuracion = {
  /** Héroes y enemigos se van turnando al activarse, o se activan primero todos los héroes */
  ordenActivaciones: 'alternas' | 'heroes-primero'
  /** Si cada escuadra elige activarse en modo agresivo o sigiloso, o todas las activaciones son normales */
  modosActivacion: 'normal' | 'agresivo-sigiloso'
  /**
   * Cómo se mide lo que se mueve un héroe: `ortogonal`, casilla a casilla sin
   * diagonales; `diagonal`, también en diagonal y cada paso cuesta lo mismo;
   * `euclidea`, también en diagonal pero el largo del camino por Pitágoras
   * (√2 cada paso en diagonal), redondeado hacia arriba
   */
  medicionMovimiento: 'ortogonal' | 'diagonal' | 'euclidea'
}
