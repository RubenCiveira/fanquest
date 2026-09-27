import { useState } from 'react'
import { CartaMonstruo } from '../../../components/CartaMonstruo'
import { Icono } from '../../../components/Icono'
import { NaipeDialog } from '../../../components/NaipeDialog'
import type { Familia, Monstruos } from '../../../lib/personajes'
import type { Mision } from '../../generar/lib/tipos'
import { TABLAS_ENCUENTROS } from '../config/encuentros'
import {
  claveMonstruo,
  desdeClave,
  opciones,
  propuesta,
  puntosCuerpoJefe,
  seleccionMonstruos,
  tablaDeMision,
  type Papel,
  type SeleccionMonstruos,
} from '../lib/monstruos'

type Props = {
  mision: Mision
  monstruos: Monstruos
  bestiario: Familia[]
  /** Héroes del grupo: deciden cuántas miniaturas hacen falta */
  heroes: number
  /** Lo elegido; sin dato, la propuesta */
  elegidos?: SeleccionMonstruos
  onCambiar: (seleccion?: SeleccionMonstruos) => void
}

const ETIQUETA_PAPEL: Partial<Record<Papel, string>> = {
  jefe: 'Jefe Final',
  errante: 'Errante',
  'errante-superior': 'Errante superior',
}

const nombres = (nombre: string, monstruos: Monstruos) =>
  opciones(nombre).map((o) => monstruos[o.monstruo]?.nombre ?? o.monstruo).join(' o ')

/** Monstruos de la misión: la propuesta según sus datos, ajustable */
export function PanelMonstruos({ mision, monstruos, bestiario, heroes, elegidos, onCambiar }: Props) {
  const [abierta, setAbierta] = useState<string | null>(null)
  const sugeridas = propuesta(mision, heroes)
  const seleccion = seleccionMonstruos(elegidos, mision, heroes)
  const tabla = tablaDeMision(mision)
  const pc = puntosCuerpoJefe(mision, monstruos, heroes)
  // primero lo propuesto, en su orden; después lo añadido a mano
  const claves = [
    ...sugeridas.map((c) => claveMonstruo(c.monstruo, c.avanzado)),
    ...Object.keys(seleccion),
  ].filter((clave, i, todas) => todas.indexOf(clave) === i && seleccion[clave])
  const papel = (clave: string) =>
    sugeridas
      .find((c) => claveMonstruo(c.monstruo, c.avanzado) === clave)
      ?.papeles.flatMap((p) => ETIQUETA_PAPEL[p] ?? [])
      .join(' · ') || undefined
  const miniaturas = claves.reduce((n, c) => n + (seleccion[c] ?? 0), 0)

  const copias = (clave: string, n: number) => {
    const { [clave]: _, ...resto } = seleccion
    onCambiar(n > 0 ? { ...seleccion, [clave]: n } : resto)
  }

  const carta = (clave: string, variante?: 'completa') => {
    const { monstruo, avanzado } = desdeClave(clave)
    return (
      <CartaMonstruo
        monstruo={monstruos[monstruo]}
        avanzado={avanzado}
        variante={variante}
        copias={variante ? undefined : seleccion[clave]}
        papel={papel(clave)}
      />
    )
  }

  return (
    <section className="panel-mazo boceto">
      <header className="panel-cabecera">
        <h2>Monstruos</h2>
        <span className="panel-estado">{miniaturas} miniaturas</span>
      </header>

      <ul className="recuento">
        {tabla && (
          <li>
            <span>Encuentros</span>
            <span>Tabla de {TABLAS_ENCUENTROS[tabla].nombre}</span>
          </li>
        )}
        <li>
          <span>Errante</span>
          <span>{nombres(mision.faccion.errante, monstruos)}</span>
        </li>
        <li>
          <span>Errante superior</span>
          <span>{nombres(mision.faccion.erranteSuperior, monstruos)}</span>
        </li>
        <li>
          <span>Jefe Final</span>
          <span>
            {mision.jefe} ({mision.tipoJefe})
          </span>
        </li>
      </ul>
      <p className="nota">
        {pc !== undefined && `Con ${heroes || 'los'} héroes, el Jefe Final tiene ${pc} PC más 1 por el rango más elevado del grupo. `}
        {[mision.faccion.errante, mision.faccion.erranteSuperior].some((n) => opciones(n).length > 1) &&
          'Con dos errantes posibles se propone el primero. '}
        Las copias son las miniaturas que pide el encuentro más numeroso con {heroes || 4} héroes.
      </p>

      <div className="naipes">
        {claves.map((clave) => (
          <button
            key={clave}
            type="button"
            className="naipe-boton"
            onClick={() => setAbierta(clave)}
            aria-label={`Ver ${monstruos[desdeClave(clave).monstruo]?.nombre}`}
          >
            {carta(clave)}
          </button>
        ))}
      </div>

      <details className="aliados-grupo">
        <summary>Añadir otros monstruos</summary>
        {bestiario.map((familia) => {
          const libres = familia.monstruos.filter((m) => !seleccion[m.id])
          return (
            libres.length > 0 && (
              <div key={familia.id} className="anadir-monstruos">
                <p className="nota">{familia.nombre}</p>
                <div className="fila-chips">
                  {libres.map((m) => (
                    <button key={m.id} type="button" className="chip" onClick={() => copias(m.id, 1)}>
                      <Icono nombre="mas" />
                      {m.nombre}
                    </button>
                  ))}
                </div>
              </div>
            )
          )
        })}
      </details>

      {elegidos && (
        <button type="button" className="button secondary" onClick={() => onCambiar(undefined)}>
          Volver a la propuesta de la misión
        </button>
      )}

      {abierta && (
        <NaipeDialog
          etiqueta={monstruos[desdeClave(abierta).monstruo]?.nombre ?? abierta}
          onCerrar={() => setAbierta(null)}
          acciones={
            <div className="fila-copias">
              <button
                type="button"
                className="icon-button"
                aria-label="Una miniatura menos"
                onClick={() => copias(abierta, (seleccion[abierta] ?? 0) - 1)}
              >
                <Icono nombre="menos" />
              </button>
              <span>{seleccion[abierta] ?? 0} miniaturas</span>
              <button
                type="button"
                className="icon-button"
                aria-label="Una miniatura más"
                onClick={() => copias(abierta, (seleccion[abierta] ?? 0) + 1)}
              >
                <Icono nombre="mas" />
              </button>
            </div>
          }
        >
          {carta(abierta, 'completa')}
        </NaipeDialog>
      )}
    </section>
  )
}
