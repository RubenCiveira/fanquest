import { cachePorFuente, type FuentePlantillas } from './plantillas'

export type ObjetoEquipo = {
  id: string
  nombre: string
  tipo: 'arma' | 'armadura' | 'apoyo' | string
  precio?: number
  ataque?: number
  defensa?: number
  rasgos?: string[]
  restricciones?: string[]
  reglas?: string[]
}

export type Pocion = {
  id: string
  nombre: string
  rareza?: string
  precio?: number
  efecto: string
}

export type Pergamino = {
  id: string
  nombre: string
  hechizo: string
  saber: string
}

export type Artefacto = {
  id: string
  nombre: string
  tipo: string
  ataque?: number
  defensa?: number
  efecto: string
}

export type Equipo = {
  equipo: ObjetoEquipo[]
  pociones: Pocion[]
  pergaminos: Pergamino[]
  artefactos: Artefacto[]
}

export type ItemEquipo = ObjetoEquipo | Pocion | Pergamino | Artefacto

export const cargarEquipo = cachePorFuente(async (fuente: FuentePlantillas): Promise<Equipo> => {
  const equipo = await fuente.leer('equipo', 'base')
  if (typeof equipo !== 'object' || equipo === null || !('equipo' in equipo)) {
    throw new Error('templates/equipo/base.json no tiene equipo')
  }
  return equipo as Equipo
})

export const nombreItem = (catalogo: Equipo, id: string): string => itemPorId(catalogo, id)?.nombre ?? id

export function itemPorId(catalogo: Equipo, id: string): ItemEquipo | undefined {
  return [...catalogo.equipo, ...catalogo.pociones, ...catalogo.pergaminos, ...catalogo.artefactos].find((item) => item.id === id)
}

export function objetoEquipable(catalogo: Equipo, id: string): ObjetoEquipo | Artefacto | undefined {
  return [...catalogo.equipo, ...catalogo.artefactos].find((item): item is ObjetoEquipo | Artefacto => item.id === id)
}
