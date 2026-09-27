import { caraDC } from '../../../lib/dados'
import { urlImagen, type IdMazo } from '../../../lib/mazos'
import type { Monstruos } from '../../../lib/personajes'
import { ENCUENTRO_SIN_MONSTRUOS, EVENTOS_MAZMORRA, filaErrantes, PUERTA_SECRETA, TIRADA_PELIGRO } from '../config/partida'
import { nombreErrante, nombreMonstruo } from '../lib/monstruos'
import { apariciones, carta, filaEncuentro, resultados, type Contexto, type Suceso } from '../lib/partida'

type Props = {
  suceso: Suceso
  contexto: Contexto
  monstruos: Monstruos
  onVerCarta: (mazo: IdMazo, id: string) => void
  /** Abre la tabla de monstruos de una tirada */
  onVerTabla: (s: Extract<Suceso, { tipo: 'encuentro' | 'errantes' }>) => void
}

/** Carta robada: se abre entera al pulsarla */
export function FilaCartaJuego({ mazo, id, contexto, onVerCarta, texto }: { mazo: IdMazo; id: string; contexto: Contexto; onVerCarta: Props['onVerCarta']; texto?: string }) {
  const c = carta(contexto.mazos[mazo], id)
  const imagen = urlImagen(mazo, c)
  return (
    <button type="button" className="carta-fila carta-juego" onClick={() => onVerCarta(mazo, id)}>
      {imagen ? <img src={imagen} alt="" /> : <span className="carta-sin-imagen" />}
      <span className="carta-info">
        <strong>{c.titulo}</strong>
        <span className="carta-texto">{texto ?? c.texto ?? c.cita}</span>
      </span>
    </button>
  )
}

/** Lo que ha pasado en la zona, con el resultado de cada tirada */
export function SucesoPartida({ suceso: s, contexto, monstruos, onVerCarta, onVerTabla }: Props) {
  const { mision, heroes } = contexto
  const fila = (mazo: IdMazo, id: string, texto?: string) => (
    <FilaCartaJuego key={id} mazo={mazo} id={id} contexto={contexto} onVerCarta={onVerCarta} texto={texto} />
  )

  switch (s.tipo) {
    case 'carta':
      return <li className="suceso">{fila(s.mazo, s.id)}</li>

    case 'caminos':
      return <li className="suceso nota">{s.texto}</li>

    case 'atrezo':
      return (
        <li className="suceso">
          <p className="suceso-titulo">{s.cartas.length > 1 ? 'Cartas de atrezo' : 'Carta de atrezo'}</p>
          {s.cartas.length === 0 && <p className="nota">No quedan cartas de atrezo: no se coloca nada.</p>}
          {s.cartas.map((id, i) => (
            <div key={`${id}-${i}`} className={s.elegida && s.elegida !== id ? 'descartada' : undefined}>
              {fila('atrezo', id)}
            </div>
          ))}
          {s.elegida && <p className="nota">Las demás vuelven al mazo de atrezo, que se baraja.</p>}
        </li>
      )

    case 'encuentro': {
      const total = s.dado + s.peligro
      const e = filaEncuentro(mision, total)
      return (
        <li className="suceso">
          <p className="suceso-titulo">
            Tabla de encuentros: {s.dado} + {s.peligro} de peligro = <strong>{total}</strong>{' '}
            <button type="button" className="enlace" onClick={() => onVerTabla(s)}>
              Ver tabla
            </button>
          </p>
          {total <= ENCUENTRO_SIN_MONSTRUOS ? (
            <p>Hacéis más ruido del debido: no hay monstruos y el Nivel de Peligro sube 1.</p>
          ) : e ? (
            <>
              <ol className="apariciones">
                {apariciones(e, heroes, monstruos).map((a) => (
                  <li key={a.monstruos.join()}>
                    <strong>{a.cantidad}</strong> {nombreMonstruo(a.monstruos, monstruos)}
                    {a.avanzado && ' (avanzado)'}
                  </li>
                ))}
              </ol>
              <p className="nota">
                En orden de colocación: los más débiles en la casilla junto al héroe, en damero; después los más fuertes,
                los de ataque a distancia y los que usan magia.
                {e.alternativa && ` Alternativa: ${e.alternativa}.`}
              </p>
            </>
          ) : (
            <p className="nota">La misión no tiene tabla de encuentros: elegid los monstruos.</p>
          )}
        </li>
      )
    }

    case 'errantes': {
      const f = filaErrantes(s.dado)
      const quien = f.superiores
        ? `1 ${nombreErrante(mision.faccion.erranteSuperior, monstruos)} (errante superior)`
        : `${f.errantes} ${nombreErrante(mision.faccion.errante, monstruos)} (errante)`
      return (
        <li className="suceso">
          <p className="suceso-titulo">
            Tabla de monstruos errantes: {s.dado}{' '}
            <button type="button" className="enlace" onClick={() => onVerTabla(s)}>
              Ver tabla
            </button>
          </p>
          <p>
            <strong>{quien}</strong> a {s.distancia} casillas del héroe. Actúan nada más aparecer.
          </p>
        </li>
      )
    }

    case 'especial':
      return (
        <li className="suceso">
          <p className="suceso-titulo">Sala especial · el Nivel de Peligro sube 1</p>
          {s.id ? fila('salas-especiales', s.id) : <p className="nota">No quedan cartas de sala especial.</p>}
        </li>
      )

    case 'trampa': {
      const titulo = s.motivo === 'buscar' ? 'Buscar trampas' : s.motivo === 'entrar' ? 'Dado de trampa al entrar' : 'Dado de trampa al moverse'
      const c = s.carta ? carta(contexto.mazos.trampas, s.carta) : undefined
      const texto = c && (s.motivo === 'buscar' ? c.encontrada : s.conMonstruos ? c.activada?.conMonstruos : c.activada?.sinMonstruos)
      return (
        <li className={c ? 'suceso suceso-alerta' : 'suceso'}>
          <p className="suceso-titulo">
            {titulo}: {s.dado} = <strong>{s.valor}</strong>
          </p>
          {c ? (
            <>
              <p>{s.motivo === 'buscar' ? '¡Trampa encontrada!' : '¡Trampa activada! Detén el movimiento: el turno acaba en esa casilla.'}</p>
              {fila('trampas', c.id, texto)}
              {s.motivo !== 'buscar' && (
                <p className="nota">{s.conMonstruos ? 'Hay monstruos en juego.' : 'No hay monstruos en juego.'}</p>
              )}
            </>
          ) : (
            <p>
              {s.motivo === 'buscar'
                ? 'No hay trampas: ya nadie tira el dado de trampa al moverse por aquí.'
                : 'Sin trampa: puedes seguir moviendo sin volver a tirar este turno.'}
            </p>
          )}
        </li>
      )
    }

    case 'tirada': {
      const c = carta(contexto.mazos[s.mazo], s.carta)
      const toca = c.tirada ? resultados(c.tirada, s.valores) : []
      return (
        <li className="suceso">
          <p className="suceso-titulo">
            {c.tirada?.accion ?? 'Tirada'} · {c.titulo}: <strong>{s.valores.join(', ')}</strong>
          </p>
          {toca.map((r) => (
            <p key={r.resultado}>
              <strong>{r.resultado}:</strong> {r.texto}
            </p>
          ))}
          {c.notas && <p className="nota">{c.notas}</p>}
        </li>
      )
    }

    case 'movimiento':
      return (
        <li className="suceso">
          <p className="suceso-titulo">
            Movimiento: {s.valores.join(' + ')} = <strong>{s.valores.reduce((a, b) => a + b, 0)}</strong> casillas
          </p>
          {s.valores.length > 1 && s.valores.every((v) => v === s.valores[0]) && <p className="nota">¡Dobles!</p>}
        </li>
      )

    case 'combate': {
      const heridos = s.perdidas.filter((x) => x.pc > 0)
      return (
        <li className={heridos.length ? 'suceso suceso-alerta' : 'suceso'}>
          <p className="suceso-titulo">
            Combate: {s.atacante} contra {s.defensor}
          </p>
          <p>{heridos.length ? heridos.map((x) => `${x.nombre} pierde ${x.pc} PC`).join('; ') : 'Nadie pierde PC.'}</p>
        </li>
      )
    }

    case 'puertas-secretas':
      return (
        <li className="suceso">
          <p className="suceso-titulo">
            Buscar puertas secretas: <strong>{s.valores.join(', ')}</strong>
          </p>
          <p>
            {s.valores.includes(PUERTA_SECRETA)
              ? '¡Puerta secreta! Colócala en cualquier casilla libre de un muro sin puertas.'
              : 'No encontráis ninguna puerta secreta.'}
          </p>
        </li>
      )

    case 'brujo': {
      const cara = caraDC(s.valor)
      const evento = s.tabla ? EVENTOS_MAZMORRA[s.tabla - 1] : undefined
      const umbral = mision.efectos.flatMap((e) => (e.tipo === 'contador-muerte' ? [e.umbral] : []))[0]
      return (
        <li className={evento ? 'suceso suceso-alerta' : 'suceso'}>
          <p className="suceso-titulo">
            Tirada de peligro: <strong>{cara}</strong> ({s.valor})
          </p>
          <p>{TIRADA_PELIGRO[cara]}</p>
          {s.evento !== undefined && (
            <p>
              Tirada de evento: <strong>{s.evento}</strong>{' '}
              {evento ? 'no supera el Nivel de Peligro: hay evento.' : 'supera el Nivel de Peligro: no ocurre nada.'}
            </p>
          )}
          {evento && (
            <>
              <p>
                <strong>
                  {s.tabla}. {evento.titulo}:
                </strong>{' '}
                {evento.texto}
              </p>
              <p className="nota">
                {evento.subePeligro ? 'El Nivel de Peligro sube 1.' : 'Tras el evento, el Nivel de Peligro baja 1.'}
              </p>
            </>
          )}
          {umbral !== undefined && s.muerte !== undefined && (
            <p className="nota">
              Por la vida del PNJ: {s.muerte}
              {s.muerte >= umbral ? ', se añade un contador de muerte.' : ', sin contador.'}
            </p>
          )}
        </li>
      )
    }

    case 'cofre':
      return (
        <li className="suceso nota">
          El Nivel de Peligro llega a {s.nivel}:{' '}
          {s.anadido ? 'se añade un cofre al mazo de atrezo, que se baraja.' : 'no quedan cofres que añadir.'}
        </li>
      )
  }
}
