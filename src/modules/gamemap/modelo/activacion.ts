export type ModoActivacion = 'normal' | 'agresivo' | 'sigiloso'

/** Modos entre los que se elige cuando la configuración permite activarse en modo agresivo o sigiloso */
export type ModoAgresivoSigiloso = Exclude<ModoActivacion, 'normal'>

/** Activación de una escuadra en el turno: en curso hasta que `terminada` */
export type Activacion = { modo: ModoActivacion; terminada: boolean }
