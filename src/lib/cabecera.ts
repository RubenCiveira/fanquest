import { createContext } from 'react'

/**
 * Hueco de la barra superior donde cada página pone su título, su enlace
 * de volver y sus acciones (ver `PageHeader`)
 */
export const CabeceraContext = createContext<HTMLElement | null>(null)
