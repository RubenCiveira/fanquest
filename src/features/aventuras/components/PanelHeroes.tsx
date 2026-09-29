import { useEffect, useRef, useState } from 'react'
import { CartaHeroe } from '../../../components/CartaHeroe'
import { Icono } from '../../../components/Icono'
import { NaipeDialog } from '../../../components/NaipeDialog'
import type { Habilidades, Heroe, Sexo } from '../../../lib/personajes'
import { HABILIDADES_MAGIA, puedeLanzarHechizos } from '../lib/hechizos'
import { MAX_HEROES, type HeroeSeleccionado } from '../lib/preparacion'

type Props = {
  heroes: Heroe[]
  habilidades: Habilidades
  grupo: HeroeSeleccionado[]
  onAnadir: (tipo: string, nombre: string, sexo: Sexo) => void
  onQuitar: (id: string) => void
  movimientoFijo: boolean
  habilidadesEspeciales: boolean
}

function DialogNombreHeroe({ heroe, onAnadir, onCerrar }: { heroe: Heroe; onAnadir: (nombre: string, sexo: Sexo) => void; onCerrar: () => void }) {
  const ref = useRef<HTMLDialogElement>(null)
  const [nombre, setNombre] = useState(heroe.nombre)
  const [sexo, setSexo] = useState<Sexo>()

  useEffect(() => ref.current?.showModal(), [])

  return (
    <dialog ref={ref} className="dialog" aria-labelledby="nombre-heroe-titulo" onClose={onCerrar} onClick={(e) => e.target === ref.current && onCerrar()}>
      <form
        className="dialog-contenido"
        onSubmit={(e) => {
          e.preventDefault()
          const limpio = nombre.trim()
          if (limpio && sexo) onAnadir(limpio, sexo)
        }}
      >
        <header className="dialog-cabecera">
          <h2 id="nombre-heroe-titulo">Añadir héroe</h2>
          <button type="button" className="icon-button" onClick={onCerrar} aria-label="Cerrar">
            <Icono nombre="cerrar" />
          </button>
        </header>
        <label className="campo">
          <span>Nombre propio de {heroe.nombre}</span>
          <input type="text" value={nombre} autoFocus onChange={(e) => setNombre(e.target.value)} />
        </label>
        <fieldset className="modo">
          <legend>Sexo</legend>
          {(['hombre', 'mujer'] as const).map((opcion) => (
            <label key={opcion}>
              <input type="radio" name="sexo" checked={sexo === opcion} onChange={() => setSexo(opcion)} />
              {opcion === 'hombre' ? 'Hombre' : 'Mujer'}
            </label>
          ))}
        </fieldset>
        {puedeLanzarHechizos(heroe) && (
          <p className="nota">La selección de hechizos se realizará más adelante, cuando todo el grupo esté listo.</p>
        )}
        <div className="fila-botones">
          <button type="submit" className="button" disabled={!nombre.trim() || !sexo}>
            Añadir héroe
          </button>
          <button type="button" className="button secondary" onClick={onCerrar}>
            Cancelar
          </button>
        </div>
      </form>
    </dialog>
  )
}

/** Elegir el grupo de héroes: al tocar una ficha se abre con la acción */
export function PanelHeroes({ heroes, habilidades, grupo, onAnadir, onQuitar, movimientoFijo, habilidadesEspeciales }: Props) {
  const [abierto, setAbierto] = useState<Heroe | null>(null)
  const [nombrando, setNombrando] = useState<Heroe | null>(null)
  const completo = grupo.length >= MAX_HEROES
  const seleccionados = abierto ? grupo.filter((heroe) => heroe.tipo === abierto.id) : []

  const abrirNombre = (heroe: Heroe) => {
    setAbierto(null)
    setNombrando(heroe)
  }

  const confirmarNombre = (nombre: string, sexo: Sexo) => {
    if (!nombrando) return
    onAnadir(nombrando.id, nombre, sexo)
    setNombrando(null)
  }

  const cerrarNombre = () => {
    setNombrando(null)
    setAbierto(null)
  }

  const habilidadesVisibles = habilidadesEspeciales
    ? habilidades
    : Object.fromEntries(Object.entries(habilidades).filter(([id]) => HABILIDADES_MAGIA.has(id)))

  return (
    <section className="panel-mazo boceto">
      <header className="panel-cabecera">
        <h2>Grupo de héroes</h2>
        <span className={grupo.length ? 'panel-estado' : 'panel-estado mal'}>
          {grupo.length} / {MAX_HEROES}
        </span>
      </header>
      <p className="resumen-grupos">
        {grupo.length
          ? grupo.map((h) => <span key={h.id}>{h.nombre}</span>)
          : 'Toca una ficha para verla y añadirla al grupo.'}
      </p>

      <div className="naipes">
        {heroes.map((heroe) => (
          <button
            key={heroe.id}
            type="button"
            className="naipe-boton"
            onClick={() => setAbierto(heroe)}
            aria-label={`Ver ${heroe.nombre}`}
            aria-pressed={grupo.some((h) => h.tipo === heroe.id)}
          >
            <CartaHeroe
              heroe={heroe}
              sello={grupo.some((h) => h.tipo === heroe.id) ? 'En el grupo' : undefined}
              movimientoFijo={movimientoFijo}
            />
          </button>
        ))}
      </div>

      {abierto && (
        <NaipeDialog
          etiqueta={abierto.nombre}
          onCerrar={() => setAbierto(null)}
          acciones={
            <>
              {seleccionados.map((heroe) => (
                <button key={heroe.id} type="button" className="button secondary" onClick={() => onQuitar(heroe.id)}>
                  Quitar {heroe.nombre}
                </button>
              ))}
              {completo && <p className="nota">El grupo ya tiene {MAX_HEROES} héroes.</p>}
            </>
          }
        >
          <CartaHeroe
            heroe={abierto}
            habilidades={habilidadesVisibles}
            variante="completa"
            movimientoFijo={movimientoFijo}
            accion={
              !completo && (
                <button type="button" className="button carta-accion" onClick={() => abrirNombre(abierto)}>
                  Añadir héroe
                </button>
              )
            }
          />
        </NaipeDialog>
      )}

      {nombrando && <DialogNombreHeroe heroe={nombrando} onAnadir={confirmarNombre} onCerrar={cerrarNombre} />}
    </section>
  )
}
