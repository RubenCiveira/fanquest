import { anidar, crearEstancia, type Estancia } from '../gamemap'

const sala = (id: string) => crearEstancia({ id, tipo: 'sala', columnas: 4, filas: 3 })

/** Jardín con una casa de cuatro salas en medio y un pasillo que llega a ella */
export function jardinConCasa(): Estancia {
  const jardin = crearEstancia({ id: 'jardin', tipo: 'exterior', columnas: 16, filas: 12 })
  const pasillo = crearEstancia({ id: 'camino', tipo: 'pasillo', columnas: 2, filas: 3 })
  return [
    { estancia: sala('salon'), posicion: { x: 4, y: 3 } },
    { estancia: sala('cocina'), posicion: { x: 8, y: 3 } },
    { estancia: sala('dormitorio'), posicion: { x: 4, y: 6 } },
    { estancia: sala('despensa'), posicion: { x: 8, y: 6 } },
    { estancia: pasillo, posicion: { x: 7, y: 9 } },
  ].reduce((madre, { estancia, posicion }) => anidar(madre, estancia, posicion), jardin)
}
