import { Link } from 'react-router'
import { Icono } from '../../../components/Icono'
import type { Mision } from '../../generar/lib/tipos'
import { NOMBRE_MAZO } from '../config/mazos'
import type { IdMazo, Mazo } from '../lib/mazos'
import { avisos, completar, recuento, type SeleccionMazo } from '../lib/preparacion'
import { Avisos } from './Avisos'

type Props = {
  id: IdMazo
  mazo: Mazo
  mision: Mision
  seleccion: SeleccionMazo
  onCambiar: (seleccion: SeleccionMazo) => void
}

/** Resumen de un mazo de la misión con sus acciones */
export function PanelMazo({ id, mazo, mision, seleccion: s, onCambiar }: Props) {
  const lista = avisos(mazo, mision, s)
  const titulo = (carta: string) => mazo.cartas.find((c) => c.id === carta)?.titulo ?? carta

  return (
    <section className="panel-mazo boceto">
      <header className="panel-cabecera">
        <h2>{NOMBRE_MAZO[id]}</h2>
        <span className={lista.length ? 'panel-estado mal' : 'panel-estado'}>
          <Icono nombre={lista.length ? 'aviso' : 'hecho'} />
          {s.cartas.length} cartas
        </span>
      </header>

      <ul className="recuento">
        {recuento(mazo, mision, s).map(({ categoria, hay }) => (
          <li key={categoria.id} className={hay === categoria.cantidad ? undefined : 'mal'}>
            <span>{categoria.etiqueta}</span>
            <span>
              {hay} / {categoria.cantidad}
            </span>
          </li>
        ))}
      </ul>

      {s.reemplazos.length > 0 && (
        <ul className="reemplazos">
          {s.reemplazos.map((r, i) => (
            <li key={i}>
              Regla especial: <s>{titulo(r.original)}</s> → {titulo(r.reemplazo)}
            </li>
          ))}
        </ul>
      )}

      <Avisos avisos={lista} />

      <div className="fila-botones">
        <Link to={id} className="button secondary">
          Escoger
        </Link>
        <button type="button" className="button secondary" onClick={() => onCambiar(completar(mazo, mision, s))}>
          Completar
        </button>
        <button type="button" className="button secondary" onClick={() => onCambiar({ cartas: [], reemplazos: [] })}>
          Descartar
        </button>
      </div>
    </section>
  )
}
