import { useState } from 'react'
import { Link } from 'react-router'
import { Carta } from '../../../components/Carta'
import { CartaDialog } from '../../../components/CartaDialog'
import { Icono } from '../../../components/Icono'
import type { Mision } from '../../generar/lib/tipos'
import { NOMBRE_MAZO } from '../config/mazos'
import type { CartaMazo, IdMazo, Mazo } from '../../../lib/mazos'
import { avisos, coincide, completar, recuento, type SeleccionMazo } from '../lib/preparacion'
import { Avisos } from './Avisos'

type Props = {
  id: IdMazo
  mazo: Mazo
  mision: Mision
  seleccion: SeleccionMazo
  onCambiar: (seleccion: SeleccionMazo) => void
}

/** Un mazo de la misión: resumen, cartas escogidas y acciones */
export function PanelMazo({ id, mazo, mision, seleccion: s, onCambiar }: Props) {
  const [abierta, setAbierta] = useState<CartaMazo | null>(null)
  const lista = avisos(mazo, mision, s)
  const grupos = recuento(mazo, mision, s)
  const titulo = (carta: string) => mazo.cartas.find((c) => c.id === carta)?.titulo ?? carta
  const sello = (carta: CartaMazo) => {
    const r = s.reemplazos.find((r) => r.reemplazo === carta.id)
    return r && `Regla especial · en lugar de ${titulo(r.original)}`
  }
  // cartas escogidas en el orden del mazo, agrupadas por grupo de la misión
  const orden = (carta: CartaMazo) => {
    const i = grupos.findIndex(({ categoria }) => coincide(categoria, carta.tipo))
    return i < 0 ? grupos.length : i
  }
  const escogidas = mazo.cartas
    .filter((c) => s.cartas.includes(c.id))
    .sort((a, b) => orden(a) - orden(b))

  return (
    <section className="panel-mazo boceto">
      <header className="panel-cabecera">
        <h2>{NOMBRE_MAZO[id]}</h2>
        <span className={lista.length ? 'panel-estado mal' : 'panel-estado'}>
          <Icono nombre={lista.length ? 'aviso' : 'hecho'} />
          {s.cartas.length} cartas
        </span>
      </header>

      <p className="resumen-grupos">
        {grupos.map(({ categoria, hay }) => (
          <span key={categoria.id} className={hay === categoria.cantidad ? undefined : 'mal'}>
            {categoria.etiqueta} {hay}/{categoria.cantidad}
          </span>
        ))}
      </p>
      <Avisos avisos={lista} />

      {escogidas.length ? (
        <div className="naipes">
          {escogidas.map((carta) => (
            <button key={carta.id} type="button" className="naipe-boton" onClick={() => setAbierta(carta)} aria-label={`Ver ${carta.titulo}`}>
              <Carta mazo={id} carta={carta} copias={s.cartas.filter((c) => c === carta.id).length} sello={sello(carta)} />
            </button>
          ))}
        </div>
      ) : (
        <p className="nota">No hay cartas en la mesa.</p>
      )}

      {abierta && <CartaDialog mazo={id} carta={abierta} sello={sello(abierta)} onCerrar={() => setAbierta(null)} />}

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
