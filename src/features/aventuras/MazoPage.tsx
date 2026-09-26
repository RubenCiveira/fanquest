import { useLoaderData, useParams } from 'react-router'
import { Icono } from '../../components/Icono'
import { PageHeader } from '../../components/PageHeader'
import { Avisos } from './components/Avisos'
import { NOMBRE_MAZO } from './config/mazos'
import { urlImagen, type CartaMazo, type IdMazo } from '../../lib/mazos'
import {
  avisos,
  coincide,
  completar,
  disponibles,
  mover,
  recuento,
  seleccion,
  type SeleccionMazo,
} from './lib/preparacion'
import { useConfiguracion } from './lib/useConfiguracion'
import type { DatosConfiguracion } from './rutas'

const veces = (lista: string[], id: string) => lista.filter((x) => x === id).length

/** Lo que distingue a las variantes de una carta: su tirada o su texto */
function resumen(carta: CartaMazo) {
  const primero = carta.tirada?.resultados[0]
  if (primero?.texto) return `${primero.resultado}: ${primero.texto}`
  return carta.texto ?? carta.cita
}

type FilaProps = {
  mazo: IdMazo
  carta: CartaMazo
  s: SeleccionMazo
  quedan: number
  onMover: (delta: 1 | -1) => void
}

function FilaCarta({ mazo, carta, s, quedan, onMover }: FilaProps) {
  const enMesa = veces(s.cartas, carta.id)
  const porRegla = s.reemplazos.filter((r) => r.reemplazo === carta.id).length
  const apartadas = s.reemplazos.filter((r) => r.original === carta.id).length
  const imagen = urlImagen(mazo, carta)

  return (
    <li className={enMesa ? 'carta-fila en-mesa' : 'carta-fila'}>
      {imagen ? <img src={imagen} alt="" loading="lazy" /> : <span className="carta-sin-imagen" />}
      <div className="carta-info">
        <strong>{carta.titulo}</strong>
        <span className="carta-texto">{resumen(carta)}</span>
        {porRegla > 0 && <span className="etiqueta">Puesta por regla especial</span>}
        {apartadas > 0 && <span className="etiqueta">Apartada por regla especial ×{apartadas}</span>}
      </div>
      <div className="contador">
        <button
          type="button"
          className="icon-button"
          aria-label={`Quitar ${carta.titulo} de la mesa`}
          disabled={!enMesa}
          onClick={() => onMover(-1)}
        >
          <Icono nombre="menos" />
        </button>
        <span>
          {enMesa}/{enMesa + quedan}
        </span>
        <button
          type="button"
          className="icon-button"
          aria-label={`Poner ${carta.titulo} en la mesa`}
          disabled={quedan <= 0}
          onClick={() => onMover(1)}
        >
          <Icono nombre="mas" />
        </button>
      </div>
    </li>
  )
}

export function MazoPage() {
  const datos = useLoaderData<DatosConfiguracion>()
  const id = useParams().mazo as IdMazo
  const { aventura, mazos } = datos
  const { mision } = aventura
  const mazo = mazos[id]
  const { config, cambiarMazo } = useConfiguracion(datos)
  const s = seleccion(config, id)
  const quedan = disponibles(mazo, s)
  const grupos = recuento(mazo, mision, s)
  const otras = mazo.cartas.filter(
    (c) => !grupos.some(({ categoria }) => coincide(categoria, c.tipo)),
  )
  const fila = (carta: CartaMazo) => (
    <FilaCarta
      key={carta.id}
      mazo={id}
      carta={carta}
      s={s}
      quedan={quedan.get(carta.id) ?? 0}
      onMover={(delta) => cambiarMazo(id, mover(s, carta.id, delta))}
    />
  )

  return (
    <>
      <PageHeader title={NOMBRE_MAZO[id] ?? mazo.nombre} backTo={`/aventuras/${aventura.id}/configurar`} />
      <p className="nota">{s.cartas.length} cartas en la mesa. Pon o quita copias desde el mazo.</p>
      <Avisos avisos={avisos(mazo, mision, s)} />

      <div className="fila-botones mazo-acciones">
        <button type="button" className="button secondary" onClick={() => cambiarMazo(id, completar(mazo, mision, s))}>
          Completar cartas
        </button>
        <button type="button" className="button secondary" onClick={() => cambiarMazo(id, { cartas: [], reemplazos: [] })}>
          Descartar cartas
        </button>
      </div>

      {grupos.map(({ categoria, hay }) => (
        <section key={categoria.id} className="mazo-grupo">
          <h2>
            {categoria.etiqueta}
            <span className={hay === categoria.cantidad ? undefined : 'mal'}>
              {hay} / {categoria.cantidad}
            </span>
          </h2>
          <ul className="cartas">
            {mazo.cartas
              .filter((c) => coincide(categoria, c.tipo))
              .map(fila)}
          </ul>
        </section>
      ))}

      {otras.length > 0 && (
        <section className="mazo-grupo">
          <h2>Otras cartas</h2>
          <ul className="cartas">{otras.map(fila)}</ul>
        </section>
      )}
    </>
  )
}
