import { useState } from 'react'
import { useLoaderData } from 'react-router'
import { CartaDialog } from '../../components/CartaDialog'
import { ConfirmarDialog } from '../../components/ConfirmarDialog'
import { Icono } from '../../components/Icono'
import { PageHeader } from '../../components/PageHeader'
import { registrarEvento } from '../../lib/matomo'
import { DADOS_MOVIMIENTO, urlRetrato } from '../../lib/personajes'
import type { IdMazo, Mazos } from '../../lib/mazos'
import type { EfectoEspecial } from '../generar/lib/tipos'
import { CartaAliado } from '../../components/CartaAliado'
import { CartaHeroe } from '../../components/CartaHeroe'
import { CartaMonstruo } from '../../components/CartaMonstruo'
import { BarraFichas, type Ficha } from './components/BarraFichas'
import { ReglasMisionDialog } from './components/ReglasMisionDialog'
import { SucesoPartida } from './components/SucesoPartida'
import { SALA_INICIAL } from './config/partida'
import { opciones, puntosCuerpoJefe } from './lib/monstruos'
import {
  atrezoColocado,
  avanzar,
  buscarPuertasSecretas,
  buscarTrampas,
  cambiarPeligro,
  cambiarVida,
  cambiarVidaMonstruo,
  carta,
  elegirAtrezo,
  entrar,
  entrarPorPuertaSecreta,
  moverse,
  puedeBuscarPuertas,
  puedeCaerEnTrampa,
  reglasDeZona,
  sePuedeTirar,
  sinMonstruos,
  tirarCarta,
  turnoBrujo,
  type FinPartida,
  type Paso,
  type TipoZona,
} from './lib/partida'
import { reglas as reglasPartida } from './lib/preparacion'
import { usePartida } from './lib/usePartida'
import type { DatosPartida } from './rutas'

const NOMBRE_ZONA: Record<TipoZona, string> = {
  inicial: 'Sala Inicial',
  pasillo: 'Pasillo',
  sala: 'Sala normal',
  especial: 'Sala especial',
  objetivo: 'Sala Objetivo',
  escaleras: 'Sala de escaleras',
  secreta: 'Sala secreta',
}

const FIN: Record<FinPartida, { accion: string; titulo: string; texto: string }> = {
  cumplida: {
    accion: 'Misión cumplida',
    titulo: '¡Misión cumplida!',
    texto:
      'Tras recibir la recompensa, podéis salir todos juntos sin volver a la escalera si no quedan monstruos y la misión lo permite.',
  },
  huida: {
    accion: 'Huir de la mazmorra',
    titulo: 'Habéis huido',
    texto:
      'Si llegáis por vuestro pie a la salida, conserváis la mitad del oro conseguido (redondeando hacia abajo) y descartáis los objetos de la misión. Podréis volver a jugarla.',
  },
  derrota: {
    accion: 'Todos han muerto',
    titulo: 'La mazmorra os ha vencido',
    texto: 'Todos los héroes han muerto. Cread nuevos héroes: la misión podrá jugarse de nuevo.',
  },
}

type EfectoSala = Extract<EfectoEspecial, { tipo: 'sala' }>

/** Las reglas de sala sin texto propio se describen a partir de sus datos */
function describirSala(e: EfectoSala, mazos: Mazos): string {
  if (e.texto) return e.texto
  const partes = [
    ...(e.elementos ?? []).map((el) => {
      const titulo = mazos.atrezo.cartas.find((c) => c.tipo === el.tipo)?.titulo ?? el.tipo
      return `coloca ${titulo}${el.siEsPosible ? ' si es posible' : ''}${el.contiene === 'objeto' ? ' con el objeto de la misión' : ''}`
    }),
    ...(e.sinAtrezo ? ['sin atrezo'] : []),
    ...(e.sinPuertas ? ['sin puertas'] : []),
  ]
  const texto = partes.join('; ')
  return texto && `${texto[0].toUpperCase()}${texto.slice(1)}.`
}

function explicarPaso(paso: Paso, dadoTrampa: string, peligro: number): [string, string] {
  switch (paso.tipo) {
    case 'atrezo':
      if (paso.robar === 'hasta-con-atrezo') {
        return [
          'Robar atrezo hasta sacar uno',
          'Roba cartas de atrezo hasta sacar una con atrezo y colócalo si hay espacio: los enemigos tienen prioridad.',
        ]
      }
      return [
        paso.robar === 1 ? 'Robar carta de atrezo' : `Robar ${paso.robar} cartas de atrezo`,
        paso.elegir
          ? 'Tras una puerta secreta se roban tres cartas de atrezo y se coloca una a elección.'
          : 'Coloca el mueble sin bloquear puertas; los de pared, pegados a un muro, y el cofre, lo más lejos posible de quien entró.',
      ]
    case 'elegir-atrezo':
      return ['', 'Elegid qué atrezo colocar; las demás cartas vuelven al mazo.']
    case 'encuentro':
      return ['Tirar en la tabla de encuentros', `Tira 1D20 y suma el Nivel de Peligro (${peligro}).`]
    case 'errantes':
      return ['Tirar en la tabla de errantes', 'La carta pide una tirada en la tabla de monstruos errantes (1D6) y otra de 1D6 para la distancia.']
    case 'especial':
      return ['Robar carta de sala especial', 'Roba una carta de sala especial y resuélvela. Explorarla sube 1 el Nivel de Peligro.']
    case 'trampa':
      return [
        `Tirar el dado de trampa (${dadoTrampa})`,
        `Nadie ha buscado trampas aquí: quien ha entrado tira el dado de trampa. Con un 1 activa una trampa.`,
      ]
  }
}

export function JugarPage() {
  const datos = useLoaderData<DatosPartida>()
  const { aventura, contexto, miembros, habilidades, monstruos } = datos
  const { mision, modo, mazos, heroes } = contexto
  const { partida: p, hacer, puedeDeshacer, deshacer } = usePartida(datos)
  const [verCarta, setVerCarta] = useState<{ mazo: IdMazo; id: string } | null>(null)
  const [verReglas, setVerReglas] = useState(false)
  const [terminar, setTerminar] = useState<FinPartida | null>(null)
  const { zona } = p
  const { movimientoFijo } = reglasPartida(aventura.configuracion)
  const [paso] = zona.pendientes
  const onVerCarta = (mazo: IdMazo, id: string) => setVerCarta({ mazo, id })
  const reglas = reglasDeZona(mision, zona).map((e) => describirSala(e, mazos)).filter(Boolean)
  const contador = mision.efectos.find((e) => e.tipo === 'contador-muerte')
  const pnjAlInicio = mision.efectos.some((e) => e.tipo === 'pnj' && e.aparece === 'inicio')
  const especial = zona.sucesos.find((s) => s.tipo === 'especial')?.id
  const tiradas = [
    ...atrezoColocado(zona).map((id) => ({ mazo: 'atrezo' as const, id })),
    ...(especial ? [{ mazo: 'salas-especiales' as const, id: especial }] : []),
  ].filter(({ mazo, id }, i, todas) => sePuedeTirar(carta(mazos[mazo], id)) && todas.findIndex((t) => t.id === id) === i)
  const [errante] = opciones(mision.faccion.errante)
  const grupo: Ficha[] = miembros.map((m) => ({
    clave: m.clave,
    nombre: 'heroe' in m ? m.heroe.nombre : m.aliado.nombre,
    retrato: 'heroe' in m ? urlRetrato('heroes', m.heroe) : undefined,
    pc: p.vidas[m.clave] ?? m.cuerpo,
    cuerpo: m.cuerpo,
    carta:
      'heroe' in m ? (
        <CartaHeroe heroe={m.heroe} habilidades={habilidades} variante="completa" movimientoFijo={movimientoFijo} />
      ) : (
        <CartaAliado aliado={m.aliado} variante="completa" />
      ),
  }))
  const enJuego: Ficha[] = (p.monstruos ?? []).flatMap((m) => {
    const datos = monstruos[m.monstruo]
    return datos
      ? [
          {
            clave: m.id,
            nombre: `${datos.nombre} ${m.numero}`,
            retrato: urlRetrato('monstruos', datos),
            pc: m.pc,
            cuerpo: m.cuerpo,
            marca: String(m.numero),
            carta: <CartaMonstruo monstruo={datos} avanzado={m.avanzado} variante="completa" papel={`Nº ${m.numero}`} />,
          },
        ]
      : []
  })
  const pcJefe = puntosCuerpoJefe(mision, monstruos, heroes)

  return (
    <>
      <PageHeader title="En juego" backTo={`/aventuras/${aventura.id}`}>
        <span className="partida-cabecera">
          <button type="button" className="icon-button" onClick={() => setVerReglas(true)} aria-label="Reglas de la misión">
            <Icono nombre="pergamino" />
          </button>
          <button type="button" className="icon-button" onClick={deshacer} disabled={!puedeDeshacer} aria-label="Deshacer">
            <Icono nombre="deshacer" />
          </button>
        </span>
      </PageHeader>
      <p className="configurar-mision">{mision.titulo}</p>

      <div className={enJuego.length ? 'partida con-monstruos' : 'partida'}>
        <BarraFichas
          etiqueta="Grupo"
          className="partida-grupo"
          fichas={grupo}
          onVida={(clave, delta) =>
            hacer((a) => cambiarVida(a, clave, delta, grupo.find((f) => f.clave === clave)?.cuerpo ?? 0))
          }
        />

        <div className="partida-centro">
          <dl className="marcador boceto">
            <div>
              <dt>Peligro</dt>
              <dd className="contador">
                <button type="button" className="icon-button" aria-label="Bajar el peligro" disabled={p.peligro <= 0} onClick={() => hacer((a) => cambiarPeligro(a, -1))}>
                  <Icono nombre="menos" />
                </button>
                <span>{p.peligro}</span>
                <button type="button" className="icon-button" aria-label="Subir el peligro" onClick={() => hacer((a) => cambiarPeligro(a, 1))}>
                  <Icono nombre="mas" />
                </button>
              </dd>
            </div>
            <div>
              <dt>Trampas</dt>
              <dd>{p.dadoTrampa}</dd>
            </div>
            <div>
              <dt>{modo === 'losetas' ? 'Mazmorra' : 'Salas'}</dt>
              <dd>{p.caminos.map((c) => c.length).join(' · ')}</dd>
            </div>
            <div>
              <dt>
                <label htmlFor="hay-monstruos">Monstruos</label>
              </dt>
              <dd>
                <input
                  id="hay-monstruos"
                  type="checkbox"
                  checked={p.hayMonstruos}
                  onChange={() => hacer((a) => (a.hayMonstruos ? sinMonstruos(a) : { ...a, hayMonstruos: true }))}
                />
              </dd>
            </div>
            {contador?.tipo === 'contador-muerte' && (
              <div>
                <dt>PNJ</dt>
                <dd>
                  {p.contadorMuerte}/{contador.maximo}
                </dd>
              </div>
            )}
          </dl>

          {contador?.tipo === 'contador-muerte' && p.contadorMuerte >= contador.maximo && (
            <p className="aviso-partida">{contador.alCompletar}</p>
          )}

          <section className="zona" aria-labelledby="zona-titulo">
            <p className="zona-etiqueta">Dónde estáis</p>
            <h2 id="zona-titulo">{NOMBRE_ZONA[zona.tipo]}</h2>

            {zona.tipo === 'inicial' && (
              <>
                <p>{SALA_INICIAL}</p>
                {pnjAlInicio && <p>El PNJ de la misión os acompaña desde el principio.</p>}
              </>
            )}
            {zona.tipo === 'secreta' && (
              <p>
                Coloca una loseta mediana o pequeña sin puertas. No se roba carta de mazmorra ni se tira en la tabla de
                encuentros, y aquí no se pueden buscar más puertas secretas.
              </p>
            )}
            {zona.tipo !== 'inicial' && zona.tipo !== 'secreta' && (
              <p className="nota">
                Quien abrió la puerta está en la primera casilla y decide dónde colocar la loseta, las puertas (cerradas y
                centradas en muros sin puerta) y el contenido.
              </p>
            )}
            {zona.tipo === 'objetivo' && (
              <div className="objetivo">
                <p>
                  <strong>Jefe Final:</strong> {mision.jefe} ({mision.tipoJefe})
                  {pcJefe !== undefined && `, ${pcJefe} PC más el rango más alto del grupo`}.
                </p>
                <p>
                  <strong>Monstruos errantes:</strong> {heroes} {errante ? (monstruos[errante.monstruo]?.nombre ?? mision.faccion.errante) : mision.faccion.errante}
                  , uno por héroe.
                </p>
                <p>
                  <strong>Además:</strong> un cofre y atrezo si hay espacio. Aquí no se tira el dado de trampa.
                </p>
                <p className="nota">{mision.salaObjetivo}</p>
              </div>
            )}
            {reglas.map((texto) => (
              <p key={texto} className="regla-mision">
                <strong>Regla de la misión:</strong> {texto}{' '}
                <button type="button" className="enlace" onClick={() => setVerReglas(true)}>
                  Ver completa
                </button>
              </p>
            ))}

            {zona.sucesos.length > 0 && (
              <ol className="sucesos">
                {zona.sucesos.map((s, i) => (
                  <SucesoPartida key={i} suceso={s} contexto={contexto} monstruos={monstruos} onVerCarta={onVerCarta} />
                ))}
              </ol>
            )}

            {paso && !p.fin && (
              <div className="paso-siguiente">
                <p className="zona-etiqueta">Ahora</p>
                <p>{explicarPaso(paso, p.dadoTrampa, p.peligro)[1]}</p>
                {paso.tipo === 'elegir-atrezo' ? (
                  <div className="fila-botones">
                    {[...new Set(paso.cartas)].map((id) => (
                      <button key={id} type="button" className="button" onClick={() => hacer((a) => elegirAtrezo(a, id))}>
                        {carta(mazos.atrezo, id).titulo}
                      </button>
                    ))}
                  </div>
                ) : (
                  <button type="button" className="button" onClick={() => hacer((a) => avanzar(a, contexto))}>
                    <Icono nombre="dado" />
                    {explicarPaso(paso, p.dadoTrampa, p.peligro)[0]}
                  </button>
                )}
              </div>
            )}
          </section>

          {p.fin ? (
            <section className="zona fin-partida">
              <h2>{FIN[p.fin].titulo}</h2>
              <p>{FIN[p.fin].texto}</p>
              {p.fin === 'cumplida' && (
                <>
                  <p>
                    <strong>Recompensa:</strong> {mision.recompensa} mo a repartir.
                  </p>
                  <p className="mision-narrativa">{mision.epilogo}</p>
                </>
              )}
              <p className="nota">Si os habéis equivocado, podéis deshacer.</p>
            </section>
          ) : (
            !paso && (
              <section className="acciones" aria-labelledby="acciones-titulo">
                <h2 id="acciones-titulo">Qué podéis hacer</h2>

                {p.hayMonstruos && zona.tipo !== 'inicial' && (
                  <p className="aviso-partida">
                    Hay monstruos a la vista: repartid las cartas de iniciativa. En su turno, activadlos como lo haría el
                    Malvado Brujo.
                  </p>
                )}

                <div className="grupo-acciones">
                  <p className="nota">Quien abre una puerta entra de inmediato y se detiene en la primera casilla.</p>
                  {modo === 'losetas' ? (
                    p.caminos.map((c, i) => (
                      <button key={i} type="button" className="button" disabled={!c.length} onClick={() => hacer((a) => entrar(a, contexto, { camino: i }))}>
                        {p.caminos.length > 1 ? `Abrir la puerta del camino ${i + 1}` : 'Abrir una puerta y entrar'}
                        {!c.length && ' (sin salida)'}
                      </button>
                    ))
                  ) : (
                    <div className="fila-botones">
                      <button
                        type="button"
                        className="button"
                        disabled={!p.caminos[0]?.length}
                        onClick={() => hacer((a) => entrar(a, contexto, { seccion: 'sala' }))}
                      >
                        Entrar en una sala
                      </button>
                      <button type="button" className="button" onClick={() => hacer((a) => entrar(a, contexto, { seccion: 'pasillo' }))}>
                        Entrar en un pasillo
                      </button>
                    </div>
                  )}
                  {zona.puertaSecreta &&
                    (modo === 'losetas' ? (
                      <button type="button" className="button secondary" onClick={() => hacer((a) => entrarPorPuertaSecreta(a, contexto))}>
                        Abrir la puerta secreta
                      </button>
                    ) : (
                      <div className="fila-botones">
                        <button type="button" className="button secondary" onClick={() => hacer((a) => entrarPorPuertaSecreta(a, contexto, 'sala'))}>
                          Puerta secreta a una sala
                        </button>
                        <button type="button" className="button secondary" onClick={() => hacer((a) => entrarPorPuertaSecreta(a, contexto, 'pasillo'))}>
                          Puerta secreta a un pasillo
                        </button>
                      </div>
                    ))}
                  {modo === 'losetas' && p.caminos.every((c) => !c.length) && (
                    <p className="nota">
                      No quedan cartas de mazmorra: buscad puertas secretas o volved sobre vuestros pasos.
                    </p>
                  )}
                </div>

                {zona.tipo !== 'inicial' && (
                  <>
                    {(!movimientoFijo || puedeCaerEnTrampa(zona)) && (
                      <div className="grupo-acciones">
                        <p className="nota">
                          {movimientoFijo ? '' : `Cada héroe tira ${DADOS_MOVIMIENTO} al moverse en su turno. `}
                          {puedeCaerEnTrampa(zona) &&
                            'Aquí nadie ha buscado trampas: quien se mueva tira el dado de trampa una vez en su turno.'}
                        </p>
                        <div className="fila-botones">
                          <button type="button" className="button secondary" onClick={() => hacer((a) => moverse(a, contexto, !movimientoFijo))}>
                            {movimientoFijo ? `Dado de trampa al moverse (${p.dadoTrampa})` : `Moverse (${DADOS_MOVIMIENTO})`}
                          </button>
                          {puedeCaerEnTrampa(zona) && !p.hayMonstruos && (
                            <button type="button" className="button secondary" onClick={() => hacer((a) => buscarTrampas(a, contexto))}>
                              Buscar trampas
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {puedeBuscarPuertas(zona) && !p.hayMonstruos && (
                      <div className="grupo-acciones">
                        <p className="nota">Buscar puertas secretas: 1D6 por cada pared sin puertas. Con un 6, la encontráis.</p>
                        <div className="fila-botones">
                          {[1, 2, 3, 4].map((n) => (
                            <button key={n} type="button" className="button secondary" onClick={() => hacer((a) => buscarPuertasSecretas(a, n))}>
                              {n} {n === 1 ? 'pared' : 'paredes'}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {tiradas.length > 0 && !p.hayMonstruos && (
                      <div className="grupo-acciones">
                        <p className="nota">Revisar un mueble es una acción gratuita junto a él.</p>
                        <div className="fila-botones">
                          {tiradas.map(({ mazo, id }) => {
                            const c = carta(mazos[mazo], id)
                            return (
                              <button key={id} type="button" className="button secondary" onClick={() => hacer((a) => tirarCarta(a, contexto, mazo, id))}>
                                {mazo === 'atrezo' ? `Revisar ${c.titulo}` : (c.tirada?.accion ?? c.titulo)}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    <div className="grupo-acciones">
                      {p.hayMonstruos ? (
                        <button type="button" className="button secondary" onClick={() => hacer(sinMonstruos)}>
                          Ya no quedan monstruos
                        </button>
                      ) : (
                        <>
                          <p className="nota">Sin monstruos a la vista, en su turno el Malvado Brujo hace la tirada de peligro.</p>
                          <button type="button" className="button secondary" onClick={() => hacer((a) => turnoBrujo(a, contexto))}>
                            Turno del Malvado Brujo
                          </button>
                        </>
                      )}
                    </div>
                  </>
                )}

                <details className="terminar">
                  <summary>Terminar la partida</summary>
                  <div className="fila-botones">
                    {(Object.keys(FIN) as FinPartida[]).map((fin) => (
                      <button key={fin} type="button" className="button secondary" onClick={() => setTerminar(fin)}>
                        {FIN[fin].accion}
                      </button>
                    ))}
                  </div>
                </details>
              </section>
            )
          )}
        </div>

        {enJuego.length > 0 && (
          <BarraFichas
            etiqueta="Monstruos en juego"
            className="partida-monstruos"
            fichas={enJuego}
            onVida={(id, delta) => hacer((a) => cambiarVidaMonstruo(a, id, delta))}
            nota="A 0 PC el monstruo muere y sale de la barra."
          />
        )}
      </div>

      {verCarta && (
        <CartaDialog
          mazo={verCarta.mazo}
          carta={carta(mazos[verCarta.mazo], verCarta.id)}
          onCerrar={() => setVerCarta(null)}
        />
      )}
      {verReglas && <ReglasMisionDialog mision={mision} onCerrar={() => setVerReglas(false)} />}
      {terminar && (
        <ConfirmarDialog
          titulo={FIN[terminar].accion}
          accion="Terminar"
          onConfirmar={() => {
            hacer((a) => ({ ...a, fin: terminar }))
            registrarEvento('Aventuras', 'Terminar partida', terminar)
          }}
          onCerrar={() => setTerminar(null)}
        >
          {FIN[terminar].texto}
        </ConfirmarDialog>
      )}
    </>
  )
}
