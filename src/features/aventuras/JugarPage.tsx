import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useLoaderData } from 'react-router'
import { Carta, Tirada } from '../../components/Carta'
import { CartaDialog } from '../../components/CartaDialog'
import { ConfirmarDialog } from '../../components/ConfirmarDialog'
import { Icono } from '../../components/Icono'
import { PageHeader } from '../../components/PageHeader'
import { caraDC, entre } from '../../lib/dados'
import { itemPorId, nombreItem, type ItemEquipo } from '../../lib/equipo'
import { registrarEvento } from '../../lib/matomo'
import { DADOS_MOVIMIENTO, PERFILES_MOVIMIENTO, puntosMovimiento, urlRetrato, version, type Heroe } from '../../lib/personajes'
import type { IdMazo, Mazos } from '../../lib/mazos'
import type { EfectoEspecial } from '../generar/lib/tipos'
import { CartaAliado } from '../../components/CartaAliado'
import { CartaMonstruo } from '../../components/CartaMonstruo'
import { BarraFichas, type Ficha, type PanelFicha } from './components/BarraFichas'
import { CombateDialog, type Participante } from './components/CombateDialog'
import { perdidas, recuentoRecarga } from './lib/combate'
import { ReglasMisionDialog } from './components/ReglasMisionDialog'
import { SucesoPartida } from './components/SucesoPartida'
import { ExportarDialog } from './components/ExportarAventura'
import { MonstruosAlAzarDialog } from './components/MonstruosAlAzarDialog'
import { TablaTiradaDialog, type TiradaEnTabla } from './components/TablaTiradaDialog'
import { SALA_INICIAL } from './config/partida'
import { opciones, puntosCuerpoJefe } from './lib/monstruos'
import {
  aplicarCombate,
  activarEfecto,
  alternarEquipado,
  anadirItem,
  atrezoColocado,
  avanzar,
  buscarPuertasSecretas,
  buscarTrampas,
  cambiarOro,
  cambiarPeligro,
  cambiarVida,
  cambiarVidaMonstruo,
  carta,
  descargarRegla,
  disiparEfecto,
  elegirAtrezo,
  entrar,
  entrarPorPuertaSecreta,
  monstruosAlAzar,
  gastarPergamino,
  anadirPuerta,
  cambiarSinPuertas,
  puertas,
  quitarPuerta,
  recargarRegla,
  secciones,
  volver,
  type Zona,
  moverse,
  puedeBuscarPuertas,
  puedeCaerEnTrampa,
  reglasDeZona,
  robarTesoro,
  sePuedeTirar,
  sinMonstruos,
  estadisticasMiembro,
  tirarCarta,
  turnoBrujo,
  usarPocion,
  perderEquipo,
  type FinPartida,
  type Miembro,
  type Paso,
  type TipoZona,
} from './lib/partida'
import { reglas as reglasPartida } from './lib/preparacion'
import { cartasHechizosSeleccionadas, HABILIDADES_MAGIA } from './lib/hechizos'
import { reglasDeHeroe, type ReglaEspecial } from './lib/reglasEspeciales'
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
type DadoEfecto = 'D4' | 'D6' | 'D8' | 'D10' | 'D12' | 'D20' | 'DC'
type TiradaEfecto = { clave: string; cantidad: number; dado: DadoEfecto; resultado?: string[] }

const DADOS_EFECTO: DadoEfecto[] = ['D4', 'D6', 'D8', 'D10', 'D12', 'D20', 'DC']
const carasDado = (dado: DadoEfecto) => (dado === 'DC' ? 6 : Number(dado.slice(1)))
const etiquetaMultilinea = (texto: string) =>
  texto
    .replace(/^Pócima de /, 'Pócima ')
    .replace(/^Pergamino de /, 'Perg. ')
    .split(/\s+/)
    .slice(0, 3)
    .map((palabra) => <span key={palabra}>{palabra}</span>)

function AccionDialog({ titulo, children, onCerrar }: { titulo: string; children: ReactNode; onCerrar: () => void }) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => ref.current?.showModal(), [])

  return (
    <dialog ref={ref} className="dialog" aria-labelledby="accion-titulo" onClose={onCerrar} onClick={(e) => e.target === ref.current && onCerrar()}>
      <div className="dialog-contenido">
        <header className="dialog-cabecera">
          <h2 id="accion-titulo">{titulo}</h2>
          <button type="button" className="icon-button" onClick={onCerrar} aria-label="Cerrar">
            <Icono nombre="cerrar" />
          </button>
        </header>
        {children}
      </div>
    </dialog>
  )
}

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

function FichaHeroePartida({ heroe, pc, movimientoFijo }: { heroe: Heroe; pc: number; movimientoFijo: boolean }) {
  return (
    <article className="ficha-heroe-compacta">
      <header>
        <img src={urlRetrato('heroes', heroe)} alt="" />
        <div>
          <h2>{heroe.nombre}</h2>
          <p>
            {pc}/{heroe.cuerpo} PC · {heroe.mente} PM
          </p>
        </div>
      </header>
      <dl className="ficha-atributos">
        <div>
          <dt>Mov</dt>
          <dd>{movimientoFijo ? puntosMovimiento(heroe) : DADOS_MOVIMIENTO}</dd>
        </div>
        <div>
          <dt>Atq</dt>
          <dd>{heroe.ataque}</dd>
        </div>
        <div>
          <dt>Def</dt>
          <dd>{heroe.defensa}</dd>
        </div>
        <div>
          <dt>Cue</dt>
          <dd>{heroe.cuerpo}</dd>
        </div>
        <div>
          <dt>Men</dt>
          <dd>{heroe.mente}</dd>
        </div>
      </dl>
      <p className="ficha-movimiento">
        <strong>Movimiento:</strong>{' '}
        {movimientoFijo ? `${PERFILES_MOVIMIENTO[heroe.movimiento].descripcion.toLowerCase()}.` : `tira ${DADOS_MOVIMIENTO} cada turno.`}
      </p>
      <details className="ficha-biografia">
        <summary>Biografía y equipo inicial</summary>
        <p className="carta-cita">«{heroe.cita}»</p>
        <p>{heroe.descripcion}</p>
        <p>
          <strong>Equipo inicial:</strong> {heroe.equipo}.
        </p>
        <p>
          <strong>Limitaciones:</strong> {heroe.limitaciones}
        </p>
        {heroe.malvado && <p>Alineamiento malvado (regla opcional).</p>}
      </details>
    </article>
  )
}

function PanelHabilidad({ titulo, texto, tiradas }: { titulo: string; texto: string; tiradas?: Parameters<typeof Tirada>[0]['tirada'][] }) {
  return (
    <section className="panel-habilidad-ficha">
      <h4>{titulo}</h4>
      <p>{texto}</p>
      {tiradas?.map((t) => <Tirada key={t.accion} tirada={t} />)}
    </section>
  )
}

function descripcionItem(item: ItemEquipo | undefined) {
  if (!item) return undefined
  if ('efecto' in item) return item.efecto
  if ('reglas' in item) return item.reglas?.join(' ')
  return undefined
}

function AccionesRegla({ reglas, descargadas, onActivar, onDescargar }: { reglas: ReglaEspecial[]; descargadas: string[]; onActivar: (regla: ReglaEspecial) => void; onDescargar: (regla: ReglaEspecial) => void }) {
  const manuales = reglas.filter((r) => r.disparador === 'manual')
  if (!manuales.length) return null
  return (
    <div className="acciones-reglas">
      {manuales.map((regla) => {
        const descargada = descargadas.includes(regla.id)
        return (
          <button
            key={regla.id}
            type="button"
            className="button mini secondary"
            disabled={descargada}
            title={regla.descripcion}
            onClick={() => (regla.tipo === 'efecto' ? onActivar(regla) : onDescargar(regla))}
          >
            {descargada ? `${regla.nombre} descargada` : regla.tipo === 'efecto' ? `Activar ${regla.nombre}` : `Usar ${regla.nombre}`}
          </button>
        )
      })}
    </div>
  )
}

export function JugarPage() {
  const datos = useLoaderData<DatosPartida>()
  const { aventura, contexto, miembros, habilidades, monstruos, equipo } = datos
  const { mision, modo, mazos, heroes } = contexto
  const { partida: p, hacer, puedeDeshacer, deshacer } = usePartida(datos)
  const [verCarta, setVerCarta] = useState<{ mazo: IdMazo; id: string } | null>(null)
  const [verReglas, setVerReglas] = useState(false)
  const [terminar, setTerminar] = useState<FinPartida | null>(null)
  const [tabla, setTabla] = useState<TiradaEnTabla | null>(null)
  const [alAzar, setAlAzar] = useState(false)
  const [exportar, setExportar] = useState(false)
  const [ataque, setAtaque] = useState<{ atacante: string; defensor?: string } | null>(null)
  const [miembroAcciones, setMiembroAcciones] = useState<string | null>(null)
  const [accionMiembro, setAccionMiembro] = useState<{ clave: string; tipo: 'tesoro' | 'equipo' | 'encontrado' } | null>(null)
  const [equipoAUsar, setEquipoAUsar] = useState('')
  const [equipoEncontrado, setEquipoEncontrado] = useState('')
  const [tiradaEfecto, setTiradaEfecto] = useState<TiradaEfecto | null>(null)
  const { zona } = p
  const mapa = secciones(p)
  const seccion = (id: number) => mapa.find((z) => z.id === id)
  const padre = zona.padre === undefined ? undefined : seccion(zona.padre)
  const nombreZona = (z: Zona) => z.nombre ?? (z.tipo === 'inicial' ? NOMBRE_ZONA.inicial : `${NOMBRE_ZONA[z.tipo]} ${z.id}`)
  const porExplorar = (z: Zona) =>
    z.salidas.filter((s) => s.destino === undefined && p.caminos[s.camino ?? -1]?.length).length
  const { movimientoFijo, habilidadesEspeciales } = reglasPartida(aventura.configuracion)
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
  const opcionesEquipoEncontrado: { id: string; nombre: string; tipo?: 'equipo' | 'pociones' | 'pergaminos' | 'artefactos' }[] = [
    ...equipo.equipo.map((item) => ({ id: item.id, nombre: item.nombre, tipo: 'equipo' as const })),
    ...equipo.pociones.map((item) => ({ id: item.id, nombre: item.nombre, tipo: 'pociones' as const })),
    ...equipo.pergaminos.map((item) => ({ id: item.id, nombre: item.nombre, tipo: 'pergaminos' as const })),
    ...equipo.artefactos.map((item) => ({ id: item.id, nombre: item.nombre, tipo: 'artefactos' as const })),
    ...mazos.tesoros.cartas.flatMap((c) => (c.equipoId ? [{ id: c.equipoId, nombre: c.titulo }] : [])),
    ...mazos.sucesos.cartas
      .filter((c) => c.titulo.startsWith('Arcano Mágico'))
      .map((c) => ({ id: c.tipo, nombre: c.titulo, tipo: 'artefactos' as const })),
  ]
    .filter((item, i, todos) => todos.findIndex((otro) => otro.id === item.id) === i)
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
  const [errante] = opciones(mision.faccion.errante)
  const grupo: Ficha[] = miembros.map((m) => {
    const hechizos = 'heroe' in m ? cartasHechizosSeleccionadas(m.heroe, mazos.hechizos, aventura.configuracion.hechizos?.[m.clave]) : []
    const nombre = m.nombre ?? ('heroe' in m ? m.heroe.nombre : m.aliado.nombre)
    const puedeActuar = (p.vidas[m.clave] ?? m.cuerpo) > 0
    const puedeRobarTesoro = puedeActuar && !p.hayMonstruos && zona.tipo !== 'inicial' && zona.tipo !== 'pasillo' && Boolean(p.mazos.tesoros?.length)
    const puedeBuscarTrampasHeroe = puedeActuar && !p.hayMonstruos && puedeCaerEnTrampa(zona)
    const inv = p.inventario?.[m.clave]
    const efectosActivos = p.efectosActivos?.[m.clave] ?? []
    const reglasDescargadas = p.reglasDescargadas?.[m.clave] ?? []
    const idsDescargados = reglasDescargadas.map((r) => r.id)
    const reglasEspeciales = reglasDeHeroe('heroe' in m ? m.heroe : undefined, hechizos.map((h) => h.id), inv, habilidadesEspeciales)
    const activarRegla = (regla: ReglaEspecial) => hacer((a) => activarEfecto(a, m.clave, regla))
    const descargar = (regla: ReglaEspecial) => hacer((a) => descargarRegla(a, m.clave, regla))
    const equipoDisponible = [...(inv?.equipo ?? []), ...(inv?.artefactos ?? [])]
    const itemsInventario = [...(inv?.equipo ?? []), ...(inv?.artefactos ?? []), ...(inv?.pociones ?? []), ...(inv?.pergaminos ?? [])]
    const panelesIzquierda: PanelFicha[] = [
      ...itemsInventario.map((id, i) => {
        const texto = descripcionItem(itemPorId(equipo, id))
        const esPocion = inv?.pociones.includes(id)
        const esPergamino = inv?.pergaminos.includes(id)
        const esEquipo = inv?.equipo.includes(id) || inv?.artefactos.includes(id)
        return {
          id: `${m.clave}-${id}-${i}`,
          label: etiquetaMultilinea(nombreItem(equipo, id)),
          titulo: nombreItem(equipo, id),
          tipo: 'item' as const,
          children: (
            <div className="panel-item-ficha">
              {texto && <p>{texto}</p>}
              <AccionesRegla reglas={reglasEspeciales.filter((r) => r.origenId === id)} descargadas={idsDescargados} onActivar={activarRegla} onDescargar={descargar} />
              <div className="fila-botones">
                {esEquipo && (
                  <button type="button" className="button mini" onClick={() => hacer((a) => alternarEquipado(a, m.clave, id))}>
                    {inv?.equipado.includes(id) ? 'Desequipar' : 'Equipar'}
                  </button>
                )}
                {esPocion && (
                  <button type="button" className="button mini" onClick={() => hacer((a) => usarPocion(a, m.clave, id))}>
                    Usar
                  </button>
                )}
                {esPergamino && (
                  <button type="button" className="button mini" onClick={() => hacer((a) => gastarPergamino(a, m.clave, id))}>
                    Gastar
                  </button>
                )}
                {esEquipo && (
                  <button type="button" className="button mini secondary" onClick={() => hacer((a) => perderEquipo(a, m.clave, id))}>
                    Perder
                  </button>
                )}
              </div>
            </div>
          ),
        }
      }),
    ]
    const panelesDerecha: PanelFicha[] =
      'heroe' in m
        ? [
            ...[
              ...(habilidadesEspeciales ? m.heroe.habilidades.filter((id) => !HABILIDADES_MAGIA.has(id)).map((id) => ({ id, nota: m.heroe.opcionales?.includes(id) ? ' (opcional)' : '' })) : []),
              ...(habilidadesEspeciales ? (m.heroe.eligeUna ?? []).filter((id) => !HABILIDADES_MAGIA.has(id)).map((id) => ({ id, nota: '' })) : []),
            ].flatMap(({ id, nota }, i) => {
              const h = habilidades[id]
              return h
                ? [{
                    id: `${m.clave}-${id}-${i}`,
                    label: etiquetaMultilinea(h.titulo),
                    titulo: `${h.titulo}${nota}`,
                    tipo: 'habilidad' as const,
                    children: (
                      <>
                        <PanelHabilidad titulo={`${h.titulo}${nota}`} texto={h.texto} tiradas={h.tiradas} />
                        <AccionesRegla reglas={reglasEspeciales.filter((r) => r.origenId === id)} descargadas={idsDescargados} onActivar={activarRegla} onDescargar={descargar} />
                      </>
                    ),
                  }]
                : []
            }),
            ...hechizos.map((c) => ({
              id: `${m.clave}-${c.id}`,
              label: etiquetaMultilinea(c.titulo),
              titulo: c.titulo,
              tipo: 'hechizo' as const,
              children: (
                <>
                  <Carta mazo="hechizos" carta={c} variante="completa" />
                  <AccionesRegla reglas={reglasEspeciales.filter((r) => r.origenId === c.id)} descargadas={idsDescargados} onActivar={activarRegla} onDescargar={descargar} />
                </>
              ),
            })),
          ]
        : []
    return {
      clave: m.clave,
      nombre,
      retrato: 'heroe' in m ? urlRetrato('heroes', m.heroe) : undefined,
      pc: p.vidas[m.clave] ?? m.cuerpo,
      cuerpo: m.cuerpo,
      panelesIzquierda,
      panelesDerecha,
      resumen: inv && (
        <div className="ficha-dialog-resumen">
          <span className="ficha-oro">
            <strong>{inv.oro}</strong> mo
          </span>
          <button type="button" className="icon-button" aria-label={`Restar oro a ${nombre}`} onClick={() => hacer((a) => cambiarOro(a, m.clave, -25))}>
            <Icono nombre="menos" />
          </button>
          <button type="button" className="icon-button" aria-label={`Sumar oro a ${nombre}`} onClick={() => hacer((a) => cambiarOro(a, m.clave, 25))}>
            <Icono nombre="mas" />
          </button>
          {efectosActivos.map((efecto) => (
            <button key={efecto.id} type="button" className="button mini efecto-activo" title={efecto.descripcion} onClick={() => hacer((a) => disiparEfecto(a, m.clave, efecto.id))}>
              Disipar {efecto.nombre}
            </button>
          ))}
          {reglasDescargadas.map((regla) => (
            <button key={regla.id} type="button" className="button mini secondary" title={regla.descripcion} onClick={() => hacer((a) => recargarRegla(a, m.clave, regla.id))}>
              Recargar {regla.nombre}
            </button>
          ))}
        </div>
      ),
      acciones: (
        <div className="acciones-ficha-personaje">
          <button type="button" className="button" disabled={!puedeActuar} onClick={() => setAtaque({ atacante: m.clave })}>
            <Icono nombre="espada" />
            Atacar
          </button>
          <button type="button" className="button secondary" disabled={!puedeActuar} onClick={() => setTiradaEfecto({ clave: m.clave, cantidad: 1, dado: 'D6' })}>
            <Icono nombre="dado" />
            Tirar dados
          </button>
          <button type="button" className="button secondary" disabled={!puedeBuscarTrampasHeroe} onClick={() => hacer((a) => buscarTrampas(a, contexto))}>
            Buscar trampas
          </button>
          <button type="button" className="button secondary" disabled={!puedeRobarTesoro} onClick={() => setAccionMiembro({ clave: m.clave, tipo: 'tesoro' })}>
            Robar tesoro
          </button>
          <button
            type="button"
            className="button secondary"
            disabled={!puedeActuar || !equipoDisponible.length}
            onClick={() => {
              setEquipoAUsar(equipoDisponible[0] || '')
              setAccionMiembro({ clave: m.clave, tipo: 'equipo' })
            }}
          >
            Usar equipo
          </button>
          <button
            type="button"
            className="button secondary"
            disabled={!puedeActuar || !opcionesEquipoEncontrado.length}
            onClick={() => {
              setEquipoEncontrado(opcionesEquipoEncontrado[0]?.id || '')
              setAccionMiembro({ clave: m.clave, tipo: 'encontrado' })
            }}
          >
            Equipo encontrado
          </button>
        </div>
      ),
      carta:
        'heroe' in m ? (
          <FichaHeroePartida heroe={m.heroe} pc={p.vidas[m.clave] ?? m.cuerpo} movimientoFijo={movimientoFijo} />
        ) : (
          <CartaAliado aliado={m.aliado} variante="completa" />
        ),
    }
  })
  const enJuego: Ficha[] = (p.monstruos ?? []).flatMap((m) => {
    const datos = monstruos[m.monstruo]
    return datos
      ? [
          {
            clave: m.id,
            nombre: m.nombre ? datos.nombre : `${datos.nombre} ${m.numero}`,
            alias: m.nombre ?? String(m.numero),
            retrato: urlRetrato('monstruos', datos),
            pc: m.pc,
            cuerpo: m.cuerpo,
            carta: <CartaMonstruo monstruo={datos} avanzado={m.avanzado} variante="completa" papel={m.nombre ?? `Nº ${m.numero}`} />,
          },
        ]
      : []
  })
  // quién puede atacar a quién: el grupo a los monstruos y al revés
  const participantes: Participante[] = [
    ...miembros.map((m): Participante => {
      const datos = 'heroe' in m ? m.heroe : m.aliado
      const ficha = grupo.find((f) => f.clave === m.clave)
      const stats = estadisticasMiembro(m, p.inventario?.[m.clave], equipo, p.efectosActivos?.[m.clave])
      return { clave: m.clave, nombre: m.nombre ?? datos.nombre, bando: 'grupo', ataque: stats.ataque, defensa: stats.defensa, retrato: ficha?.retrato }
    }),
    ...(p.monstruos ?? []).flatMap((m): Participante[] => {
      const datos = monstruos[m.monstruo]
      const ficha = enJuego.find((f) => f.clave === m.id)
      if (!datos || !ficha) return []
      const { ataque: dados, defensa } = version(datos, m.avanzado)
      return [{ clave: m.id, nombre: ficha.alias ?? ficha.nombre, bando: 'monstruos', ataque: dados, defensa, retrato: ficha.retrato }]
    }),
  ]
  const participante = (clave?: string) => participantes.find((x) => x.clave === clave)
  const reglasCombate = Object.fromEntries(
    miembros.map((m) => {
      const hechizos = 'heroe' in m ? cartasHechizosSeleccionadas(m.heroe, mazos.hechizos, aventura.configuracion.hechizos?.[m.clave]) : []
      const descargadas = new Set((p.reglasDescargadas?.[m.clave] ?? []).map((r) => r.id))
      return [m.clave, reglasDeHeroe('heroe' in m ? m.heroe : undefined, hechizos.map((h) => h.id), p.inventario?.[m.clave], habilidadesEspeciales).filter((r) => !descargadas.has(r.id))]
    }),
  )
  const atacante = participante(ataque?.atacante)
  const pcJefe = puntosCuerpoJefe(mision, monstruos, heroes)
  const miembroEnAcciones = miembros.find((m) => m.clave === miembroAcciones)
  const miembroEnSubaccion = miembros.find((m) => m.clave === accionMiembro?.clave)
  const miembroEnTirada = miembros.find((m) => m.clave === tiradaEfecto?.clave)
  const nombreMiembro = (m: Miembro) => ('heroe' in m ? m.heroe.nombre : m.aliado.nombre)
  const inventarioSubaccion = miembroEnSubaccion ? p.inventario?.[miembroEnSubaccion.clave] : undefined
  const equipoSubaccion = [...(inventarioSubaccion?.equipo ?? []), ...(inventarioSubaccion?.artefactos ?? [])]
  const equipoSeleccionado = equipoAUsar || equipoSubaccion[0] || ''
  const encontradoSeleccionado = equipoEncontrado || opcionesEquipoEncontrado[0]?.id || ''

  return (
    <>
      <PageHeader title="En juego" backTo={`/aventuras/${aventura.id}`}>
        <span className="partida-cabecera">
          <button type="button" className="icon-button" onClick={() => setExportar(true)} aria-label="Exportar aventura">
            <Icono nombre="exportar" />
          </button>
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
          bando="grupo"
          onAtacar={(atacante, defensor) => setAtaque({ atacante, defensor })}
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
              <dd>{p.caminos.map((c) => c.length).filter(Boolean).join(' · ') || 0}</dd>
            </div>
            {p.mazos.tesoros && (
              <div>
                <dt>Tesoros</dt>
                <dd>{p.mazos.tesoros.length}</dd>
              </div>
            )}
            {p.mazos.sucesos && (
              <div>
                <dt>Sucesos</dt>
                <dd>{p.mazos.sucesos.length}</dd>
              </div>
            )}
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

          {mapa.length > 1 && (
            <details className="mapa">
              <summary>Mazmorra explorada: {mapa.length} secciones</summary>
              <ol>
                {mapa.map((z) => (
                  <li key={z.id} className={z.id === zona.id ? 'aqui' : undefined}>
                    {nombreZona(z)}
                    {z.id === zona.id && ' · estáis aquí'}
                    {porExplorar(z) > 0 && ` · ${porExplorar(z)} ${porExplorar(z) === 1 ? 'puerta' : 'puertas'} sin explorar`}
                  </li>
                ))}
              </ol>
            </details>
          )}

          <section className="zona" aria-labelledby="zona-titulo">
            <p className="zona-etiqueta">Dónde estáis</p>
            <h2 id="zona-titulo">{nombreZona(zona)}</h2>
            {padre && <p className="nota">Entrasteis desde {nombreZona(padre)}.</p>}

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
                  <SucesoPartida key={i} suceso={s} contexto={contexto} monstruos={monstruos} onVerCarta={onVerCarta} onVerTabla={setTabla} />
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
                  <button
                    type="button"
                    className="button"
                    onClick={() => {
                      const nueva = avanzar(p, contexto)
                      hacer(() => nueva)
                      // la tirada en una tabla de monstruos se muestra con la tabla entera
                      const tirada = nueva.zona.sucesos.findLast(
                        (s): s is TiradaEnTabla => s.tipo === 'encuentro' || s.tipo === 'errantes',
                      )
                      if (tirada && (paso.tipo === 'encuentro' || paso.tipo === 'errantes')) setTabla(tirada)
                    }}
                  >
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

                <div className="acciones-heroes" aria-label="Acciones por héroe">
                  {miembros.map((m) => {
                    const ficha = grupo.find((f) => f.clave === m.clave)
                    const nombre = nombreMiembro(m)
                    const puedeActuar = (p.vidas[m.clave] ?? m.cuerpo) > 0
                    return (
                      <button
                        key={m.clave}
                        type="button"
                        className={puedeActuar ? 'acciones-heroe' : 'acciones-heroe caido'}
                        disabled={!puedeActuar}
                        onClick={() => setMiembroAcciones(m.clave)}
                      >
                        <span className="acciones-heroe-cabecera">
                          {ficha?.retrato ? <img src={ficha.retrato} alt="" /> : <span className="miembro-iniciales">{nombre.slice(0, 2)}</span>}
                          <strong>{nombre}</strong>
                        </span>
                      </button>
                    )
                  })}
                </div>

                {p.hayMonstruos && zona.tipo !== 'inicial' && (
                  <p className="aviso-partida">
                    Hay monstruos a la vista: repartid las cartas de iniciativa. En su turno, activadlos como lo haría el
                    Malvado Brujo.
                  </p>
                )}

                <div className="grupo-acciones">
                  {!zona.sinPuertas && (
                    <p className="nota">Quien abre una puerta entra de inmediato y se detiene en la primera casilla.</p>
                  )}
                  {zona.sinPuertas && (
                    <p className="nota">
                      Sin puertas: solo podéis volver por la entrada{zona.tipo === 'secreta' ? '' : ' o buscar una puerta secreta'}.
                    </p>
                  )}
                  {modo === 'tablero' && !zona.sinPuertas && (
                    <div className="fila-botones">
                      <button
                        type="button"
                        className="button"
                        disabled={!p.caminos[0]?.length}
                        onClick={() => hacer((a) => entrar(a, contexto, { seccion: 'sala' }))}
                      >
                        Avanzar a una sala nueva
                      </button>
                      <button type="button" className="button" onClick={() => hacer((a) => entrar(a, contexto, { seccion: 'pasillo' }))}>
                        Avanzar a un pasillo nuevo
                      </button>
                    </div>
                  )}
                  {zona.salidas.map((salida, i) => {
                    const destino = salida.destino === undefined ? undefined : seccion(salida.destino)
                    const puerta = salida.secreta
                      ? 'la puerta secreta'
                      : modo === 'tablero' || zona.salidas.length === 1
                        ? 'la puerta'
                        : `la puerta ${i + 1}`
                    const sinSalida = !destino && !p.caminos[salida.camino ?? -1]?.length
                    return (
                      <button
                        key={i}
                        type="button"
                        className={destino ? 'button secondary' : 'button'}
                        disabled={sinSalida}
                        onClick={() => hacer((a) => entrar(a, contexto, { puerta: i }))}
                      >
                        Avanzar por {puerta}
                        {destino ? ` (a ${nombreZona(destino)})` : sinSalida ? ' · sin salida' : ' · sin explorar'}
                      </button>
                    )
                  })}
                  {padre && (
                    <button type="button" className="button secondary" onClick={() => hacer(volver)}>
                      Volver por la entrada (a {nombreZona(padre)})
                    </button>
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
                  {modo === 'losetas' ? (
                    <div className="editar-puertas">
                      <span>
                        Puertas de esta sección
                        <span className="nota">Ajústalas si una regla especial pone o quita puertas.</span>
                      </span>
                      <span className="contador">
                        <button
                          type="button"
                          className="icon-button"
                          aria-label="Quitar una puerta"
                          disabled={!zona.salidas.some((s) => s.destino === undefined && !s.secreta)}
                          onClick={() => hacer(quitarPuerta)}
                        >
                          <Icono nombre="menos" />
                        </button>
                        <span>{puertas(zona).length}</span>
                        <button type="button" className="icon-button" aria-label="Añadir una puerta" onClick={() => hacer(anadirPuerta)}>
                          <Icono nombre="mas" />
                        </button>
                      </span>
                    </div>
                  ) : (
                    <label className="editar-puertas">
                      <span>
                        Sección sin puertas
                        <span className="nota">Márcalo si una regla especial quita las puertas.</span>
                      </span>
                      <input type="checkbox" checked={Boolean(zona.sinPuertas)} onChange={() => hacer((a) => cambiarSinPuertas(a, !a.zona.sinPuertas))} />
                    </label>
                  )}
                  {modo === 'losetas' && p.caminos.every((c) => !c.length) && !zona.puertaSecreta && (
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

                    {zona.tipo !== 'pasillo' && (
                      <div className="grupo-acciones">
                        <p className="nota">Si la sala o una regla especial pide monstruos de una categoría.</p>
                        <button type="button" className="button secondary" onClick={() => setAlAzar(true)}>
                          <Icono nombre="dado" />
                          Añadir monstruos al azar
                        </button>
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
            bando="monstruos"
            onAtacar={(atacante, defensor) => setAtaque({ atacante, defensor })}
            onVida={(id, delta) => hacer((a) => cambiarVidaMonstruo(a, id, delta))}
            nota="A 0 PC el monstruo muere y sale de la barra."
          />
        )}
      </div>

      {miembroEnAcciones && (
        <AccionDialog titulo={`Acciones de ${nombreMiembro(miembroEnAcciones)}`} onCerrar={() => setMiembroAcciones(null)}>
          {(() => {
            const puedeActuar = (p.vidas[miembroEnAcciones.clave] ?? miembroEnAcciones.cuerpo) > 0
            const puedeRobarTesoro = puedeActuar && !p.hayMonstruos && zona.tipo !== 'inicial' && zona.tipo !== 'pasillo' && Boolean(p.mazos.tesoros?.length)
            const puedeBuscarTrampasHeroe = puedeActuar && !p.hayMonstruos && puedeCaerEnTrampa(zona)
            const inv = p.inventario?.[miembroEnAcciones.clave]
            const equipoDisponible = [...(inv?.equipo ?? []), ...(inv?.artefactos ?? [])]
            return (
              <div className="acciones-dialogo">
                <button
                  type="button"
                  className="button"
                  disabled={!puedeActuar}
                  onClick={() => {
                    setAtaque({ atacante: miembroEnAcciones.clave })
                    setMiembroAcciones(null)
                  }}
                >
                  Atacar
                </button>
                <button
                  type="button"
                  className="button secondary"
                  disabled={!puedeActuar}
                  onClick={() => {
                    setTiradaEfecto({ clave: miembroEnAcciones.clave, cantidad: 1, dado: 'D6' })
                    setMiembroAcciones(null)
                  }}
                >
                  <Icono nombre="dado" />
                  Tirar dados para efecto
                </button>
                <button
                  type="button"
                  className="button secondary"
                  disabled={!puedeBuscarTrampasHeroe}
                  onClick={() => {
                    hacer((a) => buscarTrampas(a, contexto))
                    setMiembroAcciones(null)
                  }}
                >
                  Buscar trampas
                </button>
                <button
                  type="button"
                  className="button secondary"
                  disabled={!puedeRobarTesoro}
                  onClick={() => {
                    setAccionMiembro({ clave: miembroEnAcciones.clave, tipo: 'tesoro' })
                    setMiembroAcciones(null)
                  }}
                >
                  Robar tesoro
                </button>
                <button
                  type="button"
                  className="button secondary"
                  disabled={!puedeActuar || !equipoDisponible.length}
                  onClick={() => {
                    setEquipoAUsar(equipoDisponible[0] || '')
                    setAccionMiembro({ clave: miembroEnAcciones.clave, tipo: 'equipo' })
                    setMiembroAcciones(null)
                  }}
                >
                  Usar equipo
                </button>
                <button
                  type="button"
                  className="button secondary"
                  disabled={!puedeActuar || !opcionesEquipoEncontrado.length}
                  onClick={() => {
                    setEquipoEncontrado(opcionesEquipoEncontrado[0]?.id || '')
                    setAccionMiembro({ clave: miembroEnAcciones.clave, tipo: 'encontrado' })
                    setMiembroAcciones(null)
                  }}
                >
                  Equipo encontrado
                </button>
              </div>
            )
          })()}
        </AccionDialog>
      )}

      {miembroEnSubaccion && accionMiembro?.tipo === 'tesoro' && (
        <AccionDialog titulo={`Robar tesoro: ${nombreMiembro(miembroEnSubaccion)}`} onCerrar={() => setAccionMiembro(null)}>
          <div className="acciones-dialogo">
            <p className="nota">Roba la siguiente carta del Mazo de Tesoros para {nombreMiembro(miembroEnSubaccion)}.</p>
            <button
              type="button"
              className="button"
              onClick={() => {
                hacer((a) => robarTesoro(a, contexto, miembroEnSubaccion.clave))
                setAccionMiembro(null)
              }}
            >
              Robar carta de tesoro
            </button>
          </div>
        </AccionDialog>
      )}

      {miembroEnSubaccion && accionMiembro?.tipo === 'equipo' && (
        <AccionDialog titulo={`Usar equipo: ${nombreMiembro(miembroEnSubaccion)}`} onCerrar={() => setAccionMiembro(null)}>
          <div className="acciones-dialogo">
            <select value={equipoSeleccionado} onChange={(e) => setEquipoAUsar(e.target.value)}>
              {equipoSubaccion.map((id, i) => (
                <option key={`${id}-${i}`} value={id}>
                  {nombreItem(equipo, id)}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="button"
              disabled={!equipoSeleccionado}
              onClick={() => {
                hacer((a) => perderEquipo(a, miembroEnSubaccion.clave, equipoSeleccionado))
                setAccionMiembro(null)
              }}
            >
              Consumir equipo
            </button>
          </div>
        </AccionDialog>
      )}

      {miembroEnSubaccion && accionMiembro?.tipo === 'encontrado' && (
        <AccionDialog titulo={`Equipo encontrado: ${nombreMiembro(miembroEnSubaccion)}`} onCerrar={() => setAccionMiembro(null)}>
          <div className="acciones-dialogo">
            <select value={encontradoSeleccionado} onChange={(e) => setEquipoEncontrado(e.target.value)}>
              {opcionesEquipoEncontrado.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.nombre}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="button"
              disabled={!encontradoSeleccionado}
              onClick={() => {
                const item = opcionesEquipoEncontrado.find((item) => item.id === encontradoSeleccionado)
                if (item) hacer((a) => anadirItem(a, miembroEnSubaccion.clave, item.id, item.tipo))
                setAccionMiembro(null)
              }}
            >
              Anotar en inventario
            </button>
          </div>
        </AccionDialog>
      )}

      {miembroEnTirada && tiradaEfecto && (
        <AccionDialog titulo={`Tirada de efecto: ${nombreMiembro(miembroEnTirada)}`} onCerrar={() => setTiradaEfecto(null)}>
          <div className="acciones-dialogo tirada-efecto">
            <label>
              <span>Cantidad</span>
              <select
                value={tiradaEfecto.cantidad}
                onChange={(e) => setTiradaEfecto({ ...tiradaEfecto, cantidad: Number(e.target.value), resultado: undefined })}
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Tipo de dado</span>
              <select value={tiradaEfecto.dado} onChange={(e) => setTiradaEfecto({ ...tiradaEfecto, dado: e.target.value as DadoEfecto, resultado: undefined })}>
                {DADOS_EFECTO.map((dado) => (
                  <option key={dado} value={dado}>
                    {dado === 'DC' ? 'Dado de combate' : dado}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              className="button"
              onClick={() => {
                const resultado = Array.from({ length: tiradaEfecto.cantidad }, () => {
                  const valor = entre(1, carasDado(tiradaEfecto.dado))
                  return tiradaEfecto.dado === 'DC' ? caraDC(valor) : String(valor)
                })
                setTiradaEfecto({ ...tiradaEfecto, resultado })
              }}
            >
              <Icono nombre="dado" />
              Tirar
            </button>
            {tiradaEfecto.resultado && (
              <p className="tirada-efecto-resultado">
                Resultado: <strong>{tiradaEfecto.resultado.join(' · ')}</strong>
                {tiradaEfecto.dado !== 'DC' && ` = ${tiradaEfecto.resultado.reduce((total, valor) => total + Number(valor), 0)}`}
              </p>
            )}
          </div>
        </AccionDialog>
      )}

      {verCarta && (
        <CartaDialog
          mazo={verCarta.mazo}
          carta={carta(mazos[verCarta.mazo], verCarta.id)}
          onCerrar={() => setVerCarta(null)}
        />
      )}
      {atacante && (
        <CombateDialog
          atacante={atacante}
          defensor={participante(ataque?.defensor)}
          enemigos={participantes.filter((x) => x.bando !== atacante.bando && (x.bando === 'monstruos' || (p.vidas[x.clave] ?? 1) > 0))}
          reglas={reglasCombate}
          onUsarRegla={(clave, regla) => {
            if (regla.origenId === 'pocima-de-batalla') hacer((a) => usarPocion(a, clave, regla.origenId))
            else if (regla.tipo !== 'repetir-dados' || regla.origenId !== 'cimitarra') hacer((a) => descargarRegla(a, clave, regla))
          }}
          onAplicar={(c) =>
            hacer((a) =>
              aplicarCombate(
                a,
                c.atacante.nombre,
                c.defensor.nombre,
                perdidas(c).map((x) => ({
                  ...x,
                  monstruo: participante(x.clave)?.bando === 'monstruos',
                  cuerpo: grupo.find((f) => f.clave === x.clave)?.cuerpo ?? 0,
                })),
                recuentoRecarga(c),
              ),
            )
          }
          onCerrar={() => setAtaque(null)}
        />
      )}
      {exportar && <ExportarDialog mision={mision} onCerrar={() => setExportar(false)} />}
      {alAzar && (
        <MonstruosAlAzarDialog
          contexto={contexto}
          onTirar={(categoria, cantidad) => {
            const nueva = monstruosAlAzar(p, contexto, categoria, cantidad)
            hacer(() => nueva)
            const tirada = nueva.zona.sucesos.at(-1)
            if (tirada?.tipo === 'azar') setTabla(tirada)
          }}
          onCerrar={() => setAlAzar(false)}
        />
      )}
      {tabla && <TablaTiradaDialog tirada={tabla} contexto={contexto} monstruos={monstruos} onCerrar={() => setTabla(null)} />}
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
