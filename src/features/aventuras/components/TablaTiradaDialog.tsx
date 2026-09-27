import { useEffect, useRef } from 'react'
import { Icono } from '../../../components/Icono'
import type { Monstruos } from '../../../lib/personajes'
import { TABLAS_ENCUENTROS } from '../config/encuentros'
import { ENCUENTRO_SIN_MONSTRUOS, filaErrantes, TABLA_ERRANTES } from '../config/partida'
import { columna, nombreErrante, nombreMonstruo, tablaDeMision } from '../lib/monstruos'
import { filaEncuentro, type Contexto, type Suceso } from '../lib/partida'

export type TiradaEnTabla = Extract<Suceso, { tipo: 'encuentro' | 'errantes' }>

type Props = {
  tirada: TiradaEnTabla
  contexto: Contexto
  monstruos: Monstruos
  onCerrar: () => void
}

const COLUMNA = ['3 o 4 héroes', '2 héroes', '1 héroe']

type Fila = { resultado: string; texto: string; nota?: string; sale: boolean }

function filasEncuentros(s: Extract<Suceso, { tipo: 'encuentro' }>, { mision, heroes }: Contexto, monstruos: Monstruos): Fila[] {
  const tabla = tablaDeMision(mision)
  const total = s.dado + s.peligro
  const sale = filaEncuentro(mision, total)?.resultado
  return [
    {
      resultado: `1-${ENCUENTRO_SIN_MONSTRUOS}`,
      texto: 'Hacéis más ruido del debido: sin monstruos y el Nivel de Peligro sube 1',
      sale: total <= ENCUENTRO_SIN_MONSTRUOS,
    },
    ...(tabla ? TABLAS_ENCUENTROS[tabla].encuentros : []).map((e, i, todas) => ({
      resultado: i === todas.length - 1 ? `${e.resultado}+` : String(e.resultado),
      texto: e.grupos
        .map((g) => ({ ...g, n: g.cantidad[columna(heroes)] }))
        .filter((g) => g.n > 0)
        .map((g) => `${g.n} ${nombreMonstruo([g.monstruo].flat(), monstruos)}${g.avanzado ? ' (avanzados)' : ''}`)
        .join(', '),
      nota: e.alternativa && `Alternativa: ${e.alternativa}`,
      sale: e.resultado === sale,
    })),
  ]
}

function filasErrantes(s: Extract<Suceso, { tipo: 'errantes' }>, { mision }: Contexto, monstruos: Monstruos): Fila[] {
  const sale = filaErrantes(s.dado)
  return TABLA_ERRANTES.map((f, i) => {
    const desde = i === 0 ? 1 : TABLA_ERRANTES[i - 1].hasta + 1
    return {
      resultado: desde === f.hasta ? String(f.hasta) : `${desde}-${f.hasta}`,
      texto: f.superiores
        ? `${f.superiores} ${nombreErrante(mision.faccion.erranteSuperior, monstruos)} (errante superior)`
        : `${f.errantes} ${nombreErrante(mision.faccion.errante, monstruos)} (errante)`,
      nota: 'a 1D6 casillas del héroe',
      sale: f === sale,
    }
  })
}

/** La tirada en la tabla de monstruos y la tabla entera, con la fila que sale; se monta abierto */
export function TablaTiradaDialog({ tirada: s, contexto, monstruos, onCerrar }: Props) {
  const ref = useRef<HTMLDialogElement>(null)
  const fila = useRef<HTMLTableRowElement>(null)

  useEffect(() => {
    ref.current?.showModal()
    fila.current?.scrollIntoView({ block: 'center' })
  }, [])

  const encuentros = s.tipo === 'encuentro'
  const tabla = tablaDeMision(contexto.mision)
  const filas = encuentros ? filasEncuentros(s, contexto, monstruos) : filasErrantes(s, contexto, monstruos)
  const titulo = encuentros
    ? `Tabla de encuentros${tabla ? ` de ${TABLAS_ENCUENTROS[tabla].nombre}` : ''}`
    : 'Tabla de monstruos errantes'

  return (
    <dialog
      ref={ref}
      className="dialog dialog-tabla"
      aria-labelledby="tabla-titulo"
      onClose={onCerrar}
      onClick={(e) => e.target === ref.current && onCerrar()}
    >
      <div className="dialog-contenido">
        <header className="dialog-cabecera">
          <h2 id="tabla-titulo">{titulo}</h2>
          <button type="button" className="icon-button" onClick={onCerrar} aria-label="Cerrar">
            <Icono nombre="cerrar" />
          </button>
        </header>

        <p className="tirada-resultado">
          {encuentros ? (
            <>
              1D20 <strong className="dado-valor">{s.dado}</strong> + {s.peligro} de peligro ={' '}
              <strong className="dado-valor">{s.dado + s.peligro}</strong>
            </>
          ) : (
            <>
              1D6 <strong className="dado-valor">{s.dado}</strong> · distancia 1D6{' '}
              <strong className="dado-valor">{s.distancia}</strong> casillas
            </>
          )}
        </p>
        {encuentros && <p className="nota">Monstruos para {COLUMNA[columna(contexto.heroes)]}.</p>}

        <div className="tabla-tirada">
          <table>
            <thead>
              <tr>
                <th scope="col">{encuentros ? '1D20+NP' : '1D6'}</th>
                <th scope="col">Monstruos</th>
              </tr>
            </thead>
            <tbody>
              {filas.map((f) => (
                <tr key={f.resultado} ref={f.sale ? fila : undefined} className={f.sale ? 'sale' : undefined} aria-current={f.sale || undefined}>
                  <th scope="row">{f.resultado}</th>
                  <td>
                    {f.texto}
                    {f.nota && <span className="nota">{f.nota}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <button type="button" className="button" onClick={onCerrar}>
          Entendido
        </button>
      </div>
    </dialog>
  )
}
