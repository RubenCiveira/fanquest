import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Icono } from '../../components/Icono'
import { cargarMonstruos, type Monstruo } from '../../lib/personajes'
import { fuenteLocal } from '../../lib/plantillas'
import {
  construirEstancia,
  largoMuro,
  OPUESTA,
  type DescripcionElemento,
  type DescripcionEstancia,
  type DescripcionMueble,
  type DescripcionPersonajeNoJugador,
  type Direccion,
  type Mapa,
  type TipoEstancia,
} from '../gamemap'
import { ETIQUETA_ORIENTACION } from './mapas'
import { monstruosDePruebaDeTipo, monstruosGrandesDePrueba } from './monstruos'
import { murosDePrueba } from './muros'
import { terrenosDePrueba } from './terrenos'
import { VistaMapa } from './VistaMapa'

/** Lado máximo de una estancia de prueba, como el de la rejilla de la partida */
const MAX_LADO = 16

const TIPOS: TipoEstancia[] = ['sala', 'pasillo', 'exterior']

const lado = (n: number) => Math.min(MAX_LADO, Math.max(1, Math.trunc(n) || 1))

const TAMANO_ESCUADRA_MONSTRUOS = 3

type Props = {
  /** Mapa ya construido que recibe el proveedor; en la primera estancia no hay */
  mapa?: Mapa
  /** Si se abre desde una puerta, el muro por el que se entra: la sala no puede orientarse hacia él */
  entrada?: Direccion
  onCrear: (d: DescripcionEstancia) => void
  onEscuadrasMonstruos?: (escuadras: DescripcionPersonajeNoJugador[][]) => void
  onCancelar: () => void
}

/** Formulario para describir a mano una estancia nueva, con vista previa de puertas y objetos */
export function DialogoEstancia({ mapa, entrada, onCrear, onEscuadrasMonstruos, onCancelar }: Props) {
  const ref = useRef<HTMLDialogElement>(null)
  const [tipo, setTipo] = useState<TipoEstancia>('sala')
  const [tamano, setTamano] = useState({ columnas: 6, filas: 4 })
  // entrando desde una puerta, por defecto se sigue de frente
  const [orientacion, setOrientacion] = useState<Direccion>(entrada ? OPUESTA[entrada] : 'abajo')
  const [salidas, setSalidas] = useState(1)
  const [elementos, setElementos] = useState<DescripcionElemento[]>([])
  const [muebles, setMuebles] = useState<DescripcionMueble[]>([])
  const [conTerreno, setConTerreno] = useState(true)
  const [conMuro, setConMuro] = useState(false)
  const inicial = !mapa
  const [monstruosDisponibles, setMonstruosDisponibles] = useState<Monstruo[]>([])
  const [solitarios, setSolitarios] = useState(1)
  const [escuadrasMonstruos, setEscuadrasMonstruos] = useState(0)
  const [conMonstruos, setConMonstruos] = useState(true)
  const [conGrandes, setConGrandes] = useState(false)

  useEffect(() => ref.current?.showModal(), [])
  useEffect(() => {
    let vigente = true
    cargarMonstruos(fuenteLocal).then((todos) => vigente && setMonstruosDisponibles(Object.values(todos)))
    return () => {
      vigente = false
    }
  }, [mapa])

  const maxSalidas = largoMuro(tamano, orientacion)
  const solos = conMonstruos ? monstruosDePruebaDeTipo(monstruosDisponibles, 'esqueleto', mapa, solitarios) : []
  const monstruos = [...solos, ...(conGrandes ? monstruosGrandesDePrueba(monstruosDisponibles, mapa, solos.map((m) => m.id)) : [])]
  const escuadras = inicial
    ? Array.from({ length: escuadrasMonstruos }, (_, i) =>
        monstruosDePruebaDeTipo(
          monstruosDisponibles,
          i === 0 ? 'asesino-a-sueldo' : 'orco',
          mapa,
          TAMANO_ESCUADRA_MONSTRUOS,
          [...monstruos.map((m) => m.id), ...(i > 0 ? Array.from({ length: TAMANO_ESCUADRA_MONSTRUOS }, (_, n) => `asesino-a-sueldo-${n + 1}`) : [])],
        ),
      )
    : []
  const descripcion: DescripcionEstancia = {
    tipo,
    tamano,
    orientacion,
    salidas: Math.min(salidas, maxSalidas),
    elementos,
    muebles,
    terrenos: conTerreno ? terrenosDePrueba(tamano) : [],
    muros: conMuro ? murosDePrueba(tamano) : [],
    personajesNoJugadores: monstruos,
  }
  const cambiarElemento = (i: number, cambio: Partial<DescripcionElemento>) =>
    setElementos(elementos.map((el, j) => (j === i ? { ...el, ...cambio } : el)))
  const cambiarMueble = (i: number, cambio: Partial<DescripcionMueble>) =>
    setMuebles(muebles.map((el, j) => (j === i ? { ...el, ...cambio } : el)))
  const cambiarEscuadrasMonstruos = (n: number) => {
    setEscuadrasMonstruos(n)
    if (n > 0) setTamano((t) => ({ columnas: Math.max(t.columnas, 10), filas: Math.max(t.filas, 8) }))
  }

  function crear(e: FormEvent) {
    e.preventDefault()
    onEscuadrasMonstruos?.(escuadras)
    onCrear(descripcion)
  }

  return (
    <dialog ref={ref} className="dialog" aria-labelledby="estancia-titulo" onClose={onCancelar}>
      <form className="dialog-contenido map-debug-dialogo" onSubmit={crear}>
        <header className="dialog-cabecera">
          <h2 id="estancia-titulo">Nueva estancia</h2>
          <button type="button" className="icon-button" onClick={onCancelar} aria-label="Cerrar">
            <Icono nombre="cerrar" />
          </button>
        </header>
        <p className="nota">
          {mapa ? `El mapa ya tiene ${mapa.estancias.length} estancias.` : 'Primera estancia del mapa.'}
        </p>

        <div className="editor-numeros">
          <label className="campo">
            Tipo
            <select value={tipo} onChange={(e) => setTipo(e.target.value as TipoEstancia)}>
              {TIPOS.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </label>
          <label className="campo">
            Columnas
            <input
              type="number"
              min={1}
              max={MAX_LADO}
              value={tamano.columnas}
              onChange={(e) => setTamano({ ...tamano, columnas: lado(e.target.valueAsNumber) })}
            />
          </label>
          <label className="campo">
            Filas
            <input
              type="number"
              min={1}
              max={MAX_LADO}
              value={tamano.filas}
              onChange={(e) => setTamano({ ...tamano, filas: lado(e.target.valueAsNumber) })}
            />
          </label>
          <label className="campo">
            Orientación
            <select value={orientacion} onChange={(e) => setOrientacion(e.target.value as Direccion)}>
              {Object.entries(ETIQUETA_ORIENTACION)
                .filter(([valor]) => valor !== entrada)
                .map(([valor, etiqueta]) => (
                  <option key={valor} value={valor}>
                    {etiqueta}
                  </option>
                ))}
            </select>
          </label>
          <label className="campo">
            Puertas de salida
            <input
              type="number"
              min={0}
              max={maxSalidas}
              value={descripcion.salidas}
              onChange={(e) => setSalidas(Math.max(0, Math.trunc(e.target.valueAsNumber) || 0))}
            />
          </label>
        </div>

        <label className="map-debug-casilla-marcar">
          <input type="checkbox" checked={conTerreno} onChange={(e) => setConTerreno(e.target.checked)} />
          Terreno de prueba: barro difícil, zarzas muy difíciles, un pilar impasable y escombros con imagen (los que quepan)
        </label>

        <label className="map-debug-casilla-marcar">
          <input type="checkbox" checked={conMuro} onChange={(e) => setConMuro(e.target.checked)} />
          Muro de prueba: vertical por el medio, con un paso arriba y una puerta cerrada a media altura (solo se cruza por el paso o la puerta abierta; a los disparos los bloquea, salvo por el paso o la puerta abierta, que dan cobertura ligera)
        </label>

        <fieldset className="map-debug-configuracion">
          <legend>Monstruos de prueba</legend>
          <label className="map-debug-casilla-marcar">
            <input type="checkbox" checked={conMonstruos} onChange={(e) => setConMonstruos(e.target.checked)} />
            Añadir monstruos solitarios, repartidos al azar donde se pueda estar.
          </label>
          <label className="campo">
            Solitarios
            <input type="number" min={0} max={8} value={conMonstruos ? solitarios : 0} disabled={!conMonstruos} onChange={(e) => setSolitarios(Math.max(0, Math.trunc(e.target.valueAsNumber) || 0))} />
          </label>
          <label className="map-debug-casilla-marcar">
            <input type="checkbox" checked={conGrandes} onChange={(e) => setConGrandes(e.target.checked)} />
            Añadir monstruos grandes: un ogro (2 × 2 casillas) y un león (2 × 1, dos casillas hacia donde mira).
          </label>
          {inicial && (
            <label className="campo">
              Escuadras de monstruos
              <input type="number" min={0} max={2} value={escuadrasMonstruos} onChange={(e) => cambiarEscuadrasMonstruos(Math.min(2, Math.max(0, Math.trunc(e.target.valueAsNumber) || 0)))} />
            </label>
          )}
          <p className="nota">
            {monstruos.length ? `Solitarios: ${monstruos.map((m) => m.nombre).join(' y ')}.` : 'Sin monstruos solitarios.'}{' '}
            {escuadras.length ? `Escuadras: ${escuadras.map((e) => e.map((m) => m.nombre).join(' y ')).join('; ')}.` : inicial ? 'Sin escuadra de monstruos.' : ''}
          </p>
        </fieldset>

        <fieldset className="map-debug-elementos">
          <legend>Objetos</legend>
          {elementos.map((el, i) => (
            <div key={i} className="map-debug-elemento">
              <label className="campo">
                Nombre
                <input type="text" required value={el.nombre} onChange={(e) => cambiarElemento(i, { nombre: e.target.value })} />
              </label>
              <label className="campo">
                Columnas
                <input type="number" min={1} max={MAX_LADO} value={el.columnas} onChange={(e) => cambiarElemento(i, { columnas: lado(e.target.valueAsNumber) })} />
              </label>
              <label className="campo">
                Filas
                <input type="number" min={1} max={MAX_LADO} value={el.filas} onChange={(e) => cambiarElemento(i, { filas: lado(e.target.valueAsNumber) })} />
              </label>
              <button type="button" className="icon-button" aria-label={`Quitar ${el.nombre || 'objeto'}`} onClick={() => setElementos(elementos.filter((_, j) => j !== i))}>
                <Icono nombre="cerrar" />
              </button>
            </div>
          ))}
          <button
            type="button"
            className="button secondary"
            onClick={() => setElementos([...elementos, { tipo: 'objeto', nombre: `Objeto ${elementos.length + 1}`, columnas: 1, filas: 1 }])}
          >
            <Icono nombre="mas" />
            Añadir objeto
          </button>
        </fieldset>

        <fieldset className="map-debug-elementos">
          <legend>Muebles</legend>
          {muebles.map((mueble, i) => (
            <div key={i} className="map-debug-elemento">
              <label className="campo">
                Id
                <input type="text" required value={mueble.id} onChange={(e) => cambiarMueble(i, { id: e.target.value })} />
              </label>
              <label className="campo">
                Nombre
                <input type="text" required value={mueble.nombre} onChange={(e) => cambiarMueble(i, { nombre: e.target.value })} />
              </label>
              <label className="campo">
                Columnas
                <input type="number" min={1} max={MAX_LADO} value={mueble.columnas} onChange={(e) => cambiarMueble(i, { columnas: lado(e.target.valueAsNumber) })} />
              </label>
              <label className="campo">
                Filas
                <input type="number" min={1} max={MAX_LADO} value={mueble.filas} onChange={(e) => cambiarMueble(i, { filas: lado(e.target.valueAsNumber) })} />
              </label>
              <label className="campo">
                Imagen
                <input type="text" value={mueble.imagenVtt ?? ''} onChange={(e) => cambiarMueble(i, { imagenVtt: e.target.value || undefined })} />
              </label>
              <button type="button" className="icon-button" aria-label={`Quitar ${mueble.nombre || 'mueble'}`} onClick={() => setMuebles(muebles.filter((_, j) => j !== i))}>
                <Icono nombre="cerrar" />
              </button>
            </div>
          ))}
          <button
            type="button"
            className="button secondary"
            onClick={() => setMuebles([...muebles, { id: `mueble-${muebles.length + 1}`, tipo: 'mueble', nombre: `Mueble ${muebles.length + 1}`, columnas: 1, filas: 1 }])}
          >
            <Icono nombre="mas" />
            Añadir mueble
          </button>
        </fieldset>

        <VistaMapa mapa={{ estancias: [construirEstancia('vista-previa', descripcion, entrada)] }} />
        <p className="nota">
          {entrada
            ? `Se entra por el muro de ${entrada}, el de la puerta que se abre, y se sale por el de la orientación.`
            : 'Se entra por el muro contrario a la orientación y se sale por el de la orientación.'}{' '}
          Los objetos que no caben quedan en la zona de espera.
        </p>

        <div className="fila-botones">
          <button type="button" className="button secondary" onClick={onCancelar}>
            Cancelar
          </button>
          <button type="submit" className="button">
            Crear estancia
          </button>
        </div>
      </form>
    </dialog>
  )
}
