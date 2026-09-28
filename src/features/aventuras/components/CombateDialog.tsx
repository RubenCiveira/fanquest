import { useEffect, useRef, useState } from 'react'
import { Icono } from '../../../components/Icono'
import { caraDC } from '../../../lib/dados'
import {
  ajustar,
  anadirObjetivoExtra,
  cambiarDados,
  cambiarDadosEn,
  cambiarCara,
  caraDeDefensa,
  contar,
  danios,
  iniciarCombate,
  perdidas,
  repetir,
  siguiente,
  terminado,
  type Combate,
  type Combatiente,
} from '../lib/combate'
import type { ReglaEspecial } from '../lib/reglasEspeciales'

/** Combatiente con su retrato para elegirlo */
export type Participante = Combatiente & { retrato?: string }

type Props = {
  atacante: Participante
  /** Sin defensor (se pulsó «Atacar» sin arrastrar), se elige en el diálogo */
  defensor?: Participante
  enemigos: Participante[]
  reglas?: Record<string, ReglaEspecial[]>
  onUsarRegla?: (clave: string, regla: ReglaEspecial) => void
  onAplicar: (c: Combate) => void
  onCerrar: () => void
}

const CLASE_CARA = { Calavera: 'calavera', 'Escudo blanco': 'blanco', 'Escudo negro': 'negro' } as const

function Dado({ valor, elegido, onClick }: { valor: number; elegido: boolean; onClick: () => void }) {
  const cara = caraDC(valor)
  return (
    <button
      type="button"
      className={`dado dado-${CLASE_CARA[cara]}${elegido ? ' elegido' : ''}`}
      aria-pressed={elegido}
      aria-label={`${cara}${elegido ? ', para repetir' : ''}`}
      onClick={onClick}
    >
      <Icono nombre={cara === 'Calavera' ? 'calavera' : 'escudo'} />
    </button>
  )
}

function Retrato({ p }: { p: Participante }) {
  return (
    <span className="combatiente">
      {p.retrato ? <img src={p.retrato} alt="" /> : <span className="miembro-iniciales">{p.nombre.slice(0, 2)}</span>}
      <strong>{p.nombre}</strong>
    </span>
  )
}

/** Simula los dados de un ataque paso a paso; se monta abierto */
const VALOR_CARA = { Calavera: 1, 'Escudo blanco': 4, 'Escudo negro': 6 } as const
const AJUSTES_DADOS = [-3, -2, -1, 1, 2, 3] as const

export function CombateDialog({ atacante, defensor, enemigos, reglas = {}, onUsarRegla, onAplicar, onCerrar }: Props) {
  const ref = useRef<HTMLDialogElement>(null)
  const [combate, setCombate] = useState(() => (defensor ? iniciarCombate(atacante, defensor) : null))
  const [elegidos, setElegidos] = useState<number[]>([])
  const [objetivoExtra, setObjetivoExtra] = useState('')

  useEffect(() => ref.current?.showModal(), [])

  const cambiar = (c: Combate) => {
    setCombate(c)
    setElegidos([])
  }

  const fase = combate && !terminado(combate) ? combate.fases[combate.actual] : undefined
  const quien = fase && combate && (fase.tipo === 'ataque' ? combate.atacante : combate.defensor)
  const reglasFase = quien && fase ? (reglas[quien.clave] ?? []).filter((r) => r.disparador === `despues-${fase.tipo}`) : []
  const varios = combate ? combate.fases.filter((f) => f.tipo === 'ataque').length > 1 : false
  const proxima = combate?.fases[combate.actual + 1]
  const objetivosExtra = combate ? enemigos.filter((e) => e.clave !== combate.defensor.clave) : []
  const objetivoExtraSeleccionado = objetivosExtra.find((e) => e.clave === (objetivoExtra || objetivosExtra[0]?.clave))

  return (
    <dialog
      ref={ref}
      className="dialog dialog-combate"
      aria-labelledby="combate-titulo"
      onClose={onCerrar}
      onClick={(e) => e.target === ref.current && onCerrar()}
    >
      <div className="dialog-contenido">
        <header className="dialog-cabecera">
          <h2 id="combate-titulo">Combate</h2>
          <button type="button" className="icon-button" onClick={onCerrar} aria-label="Cerrar">
            <Icono nombre="cerrar" />
          </button>
        </header>

        {!combate ? (
          <section className="combate-elegir">
            <p>
              <strong>{atacante.nombre}</strong> ataca a…
            </p>
            {enemigos.length ? (
              <div className="combate-enemigos">
                {enemigos.map((e) => (
                  <button key={e.clave} type="button" className="chip" onClick={() => cambiar(iniciarCombate(atacante, e))}>
                    <Retrato p={e} />
                  </button>
                ))}
              </div>
            ) : (
              <p className="nota">No hay enemigos en juego.</p>
            )}
          </section>
        ) : (
          <>
            <p className="combate-versus">
              <Retrato p={atacante} /> <span className="nota">contra</span>{' '}
              <Retrato p={enemigos.find((e) => e.clave === combate.defensor.clave) ?? { ...combate.defensor }} />
            </p>

            <ol className="combate-fases">
              {combate.fases.map((f, i) => {
                const hecha = i < combate.actual
                const bloquea = caraDeDefensa(combate.defensor.bando)
                return (
                  <li key={i} className={i === combate.actual ? 'actual' : hecha ? 'hecha' : undefined}>
                    {f.tipo === 'ataque' ? 'Ataque' : 'Defensa'}
                    {varios && ` ${f.ataque + 1}`}
                    {(hecha || i === combate.actual) &&
                      (f.tipo === 'ataque'
                        ? `: ${contar(f.valores, 'Calavera')} calaveras`
                        : `: ${contar(f.valores, bloquea)} ${bloquea === 'Escudo blanco' ? 'escudos blancos' : 'escudos negros'}`)}
                  </li>
                )
              })}
            </ol>

            {fase && quien ? (
              <section className="combate-fase">
                <p className="suceso-titulo">
                  {fase.tipo === 'ataque'
                    ? `${quien.nombre} ataca con ${fase.valores.length} dados: cada calavera es un impacto`
                    : `${quien.nombre} se defiende con ${fase.valores.length} dados: bloquea con ${
                        caraDeDefensa(quien.bando) === 'Escudo blanco' ? 'escudos blancos' : 'escudos negros'
                      }`}
                </p>
                <div className="dados">
                  {fase.valores.map((v, i) => (
                    <Dado
                      key={i}
                      valor={v}
                      elegido={elegidos.includes(i)}
                      onClick={() => setElegidos(elegidos.includes(i) ? elegidos.filter((x) => x !== i) : [...elegidos, i])}
                    />
                  ))}
                </div>
                <p className="nota">
                  Toca los dados que quieras repetir por un hechizo o regla especial.
                  {fase.repeticiones > 0 && ` Repetidos ${fase.repeticiones} ${fase.repeticiones === 1 ? 'vez' : 'veces'}.`}
                </p>
                <div className="fila-botones">
                  <button type="button" className="button secondary" disabled={!elegidos.length} onClick={() => cambiar(repetir(combate, elegidos))}>
                    Repetir {elegidos.length || ''} {elegidos.length === 1 ? 'dado' : 'dados'}
                  </button>
                  <button type="button" className="button secondary" onClick={() => cambiar(repetir(combate, fase.valores.map((_, i) => i)))}>
                    Repetir todos (ventaja)
                  </button>
                </div>
                {reglasFase.length > 0 && (
                  <div className="combate-reglas">
                    <strong>Reglas disponibles</strong>
                    {reglasFase.map((regla) => {
                      const calaverasElegidas = elegidos.filter((i) => caraDC(fase.valores[i]) === 'Calavera').length
                      return (
                        <div key={regla.id} className="combate-regla">
                          <span>{regla.nombre}</span>
                          {regla.tipo === 'repetir-dados' && (
                            <button
                              type="button"
                              className="button mini secondary"
                              disabled={!elegidos.length || (regla.origenId === 'cimitarra' && elegidos.length !== 1)}
                              onClick={() => {
                                cambiar(repetir(combate, elegidos))
                                onUsarRegla?.(quien.clave, regla)
                              }}
                            >
                              Usar
                            </button>
                          )}
                          {regla.tipo === 'cambiar-cara' && (
                            <span className="fila-botones compacta">
                              {Object.entries(VALOR_CARA).map(([cara, valor]) => (
                                <button
                                  key={cara}
                                  type="button"
                                  className="button mini secondary"
                                  disabled={!elegidos.length}
                                  onClick={() => {
                                    cambiar(cambiarCara(combate, elegidos, valor))
                                    onUsarRegla?.(quien.clave, regla)
                                  }}
                                >
                                  A {cara.toLowerCase()}
                                </button>
                              ))}
                            </span>
                          )}
                          {regla.tipo === 'dividir-impactos' && (
                            <span className="fila-botones compacta">
                              <select value={objetivoExtra || objetivosExtra[0]?.clave || ''} onChange={(e) => setObjetivoExtra(e.target.value)}>
                                {objetivosExtra.map((e) => (
                                  <option key={e.clave} value={e.clave}>
                                    {e.nombre}
                                  </option>
                                ))}
                              </select>
                              <button
                                type="button"
                                className="button mini secondary"
                                disabled={!calaverasElegidas || !objetivoExtraSeleccionado}
                                onClick={() => {
                                  if (!objetivoExtraSeleccionado) return
                                  cambiar(anadirObjetivoExtra(cambiarCara(combate, elegidos, VALOR_CARA['Escudo blanco']), objetivoExtraSeleccionado, calaverasElegidas))
                                  onUsarRegla?.(quien.clave, regla)
                                }}
                              >
                                Dividir {calaverasElegidas || ''}
                              </button>
                            </span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
                <div className="fila-copias combate-dados-extra">
                  <button type="button" className="icon-button" aria-label="Un dado menos" disabled={!fase.valores.length} onClick={() => cambiar(cambiarDados(combate, -1))}>
                    <Icono nombre="menos" />
                  </button>
                  <span>{fase.valores.length} dados</span>
                  <button type="button" className="icon-button" aria-label="Un dado más" onClick={() => cambiar(cambiarDados(combate, 1))}>
                    <Icono nombre="mas" />
                  </button>
                </div>
                <div className="fila-botones compacta">
                  {AJUSTES_DADOS.map((delta) => (
                    <button key={delta} type="button" className="button mini secondary" disabled={delta < 0 && fase.valores.length < Math.abs(delta)} onClick={() => cambiar(cambiarDadosEn(combate, delta))}>
                      {delta > 0 ? `+${delta}` : delta} dados
                    </button>
                  ))}
                </div>
                <button type="button" className="button" onClick={() => cambiar(siguiente(combate))}>
                  {proxima
                    ? `Siguiente: ${proxima.tipo === 'ataque' ? 'ataque' : 'defensa'}${varios ? ` ${proxima.ataque + 1}` : ''}`
                    : 'Siguiente: daño'}
                </button>
              </section>
            ) : (
              <section className="combate-resumen">
                <h3>Daño</h3>
                {varios && (
                  <p className="nota">
                    Por ataque: {danios(combate).map((d, i) => `${i + 1}.º ${d}`).join(' · ')}
                  </p>
                )}
                <ul className="recuento">
                  {perdidas(combate).map((p) => (
                    <li key={p.clave}>
                      <span>{p.nombre}</span>
                      <span className="contador">
                        <button type="button" className="icon-button" aria-label={`Menos daño a ${p.nombre}`} disabled={!p.pc} onClick={() => cambiar(ajustar(combate, p.clave, -1))}>
                          <Icono nombre="menos" />
                        </button>
                        <span>−{p.pc} PC</span>
                        <button type="button" className="icon-button" aria-label={`Más daño a ${p.nombre}`} onClick={() => cambiar(ajustar(combate, p.clave, 1))}>
                          <Icono nombre="mas" />
                        </button>
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="nota">Ajusta el daño por efectos especiales: fuego, hechizos, armaduras, habilidades…</p>
                <div className="fila-botones">
                  <button type="button" className="button secondary" onClick={onCerrar}>
                    Cerrar sin aplicar
                  </button>
                  <button
                    type="button"
                    className="button"
                    onClick={() => {
                      onAplicar(combate)
                      onCerrar()
                    }}
                  >
                    Aplicar daño
                  </button>
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </dialog>
  )
}
