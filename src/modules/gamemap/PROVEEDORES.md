# Cómo implementar los proveedores

`GestorMapa` no sabe nada del juego: todo lo que depende de él se lo pide a
un **proveedor** que implementa el proyecto. El proveedor es un solo objeto
que cumple todas las interfaces de `ProveedorMapa`:

```ts
type ProveedorMapa = ProveedorConfiguracion & ProveedorConfirmacion & ProveedorEstancias & ProveedorHeroes
```

Todos los tipos se importan desde `index.ts` del módulo. La implementación de
referencia es la del banco de pruebas: `../map-debug-imp/useProveedorDebug.tsx`
y `../map-debug-imp/escuadras.ts`.

## Resumen

| Interfaz | Miembro | Cuándo lo usa el gestor |
| --- | --- | --- |
| `ProveedorConfiguracion` | `configuracion` | Siempre que aplica reglas de activación |
| `ProveedorConfirmacion` | `confirmar(mensaje)` | Antes de un movimiento que consume una acción adicional (deslizar…) |
| `ProveedorEstancias` | `describirEstancia(mapa?)` | En cada `nuevaEstancia()` |
| `ProveedorHeroes` | `listarEscuadras()` | La primera vez que necesita las escuadras (una sola vez por gestor) |
| `Escuadra` | `heroes()` | Al crear la estancia inicial |
| `Escuadra` | `modoActivacion()` | Al crear la estancia inicial, con modo agresivo o sigiloso, si la escuadra aún no tiene modo |
| `Escuadra` | `acciones(estado, mapa, heroe?)` | Al pulsar una ficha (`accionesDisponibles(escuadra, heroe)`) y en `ejecutarAccion()` |
| `Comando` | `exec()` | Al elegir una acción que es un comando |
| `Escuadra` | `activar(acciones)` | Tras cada acción o movimiento de la escuadra, mientras se activa |
| `Heroe` | `opcionesMovimiento(estado)` | Al empezar a arrastrar su ficha (`opcionesMovimiento()`) y al soltarla (`moverHeroe()`) |

## ProveedorConfiguracion

Datos fijos con las reglas de activación del juego:

```ts
configuracion: {
  ordenActivaciones: 'alternas' | 'heroes-primero',
  modosActivacion: 'normal' | 'agresivo-sigiloso',
}
```

- `ordenActivaciones`: si héroes y enemigos se van turnando o se activan
  primero todos los héroes. Se guarda, pero aún no cambia nada: no hay
  enemigos en el mapa.
- `modosActivacion`: con `agresivo-sigiloso`, cada escuadra se activa en uno
  de esos dos modos y puede cambiar de uno a otro; con `normal`, todas las
  activaciones son normales.

## ProveedorConfirmacion

```ts
confirmar(mensaje: string): Promise<boolean>
```

Pide al jugador que confirme algo antes de hacerlo; `true` si confirma. Ahora
se usa al soltar una ficha en un tramo que consume una acción adicional
(«Confirme que queremos deslizar»): sin confirmar, no se mueve. El banco de
pruebas lo resuelve con un diálogo de confirmar o cancelar.

## ProveedorEstancias

```ts
describirEstancia(mapa?: Mapa, entrada?: Direccion): Promise<DescripcionEstancia>
```

Se llama cada vez que hay que generar una estancia. Recibe el mapa ya
construido (`undefined` en la primera estancia) y, si se abre desde una
puerta, `entrada`: el muro de la nueva por el que se entrará. Devuelve cómo es
la nueva:

```ts
{
  tipo: 'exterior' | 'sala' | 'pasillo',
  tamano: { columnas: number, filas: number },
  orientacion: 'arriba' | 'abajo' | 'izquierda' | 'derecha',
  salidas: number,
  elementos: [{ tipo: 'objeto', nombre: string, columnas: number, filas: number }],
}
```

- La entrada va en el muro `entrada` (si no hay, en el contrario a
  `orientacion`) y las `salidas` se reparten por el muro de `orientacion`: no puede haber más salidas que
  casillas tiene ese muro.
- Los elementos no llevan posición: el gestor busca un hueco para cada uno y,
  si no cabe, lo deja en la zona de espera para colocarlo a mano.
- Puede resolverse con una tabla, un mazo, un formulario… Si la promesa se
  rechaza, no se crea ninguna estancia y `nuevaEstancia()` rechaza con el
  mismo error. El banco de pruebas rechaza con un `DOMException` de nombre
  `AbortError` cuando se cancela el diálogo.

## ProveedorHeroes y Escuadra

```ts
listarEscuadras(): Promise<Escuadra[]>
```

La activación es de la escuadra, no del héroe: vale para todos sus héroes.
Cada escuadra cumple esta interfaz (todos sus miembros son obligatorios):

```ts
interface Escuadra {
  id: string
  nombre: string
  heroes(): Promise<Heroe[]>
  modoActivacion(): Promise<'agresivo' | 'sigiloso'>
  acciones(estado: EstadoEscuadra, mapa: MapaEnJuego, heroe?: HeroeEnMapa): Promise<Accion[]> // pueden ser Comando
  activar(acciones: AccionEjecutada[]): Promise<ResultadoActivacion>
}

interface Heroe {
  id: string
  nombre: string
  imagenVtt?: string // URL de la ficha VTT vista desde arriba
  opcionesMovimiento(estado: EstadoEscuadra, gastado: MovimientoGastado): Promise<OpcionesMovimiento | undefined>
}
```

- `heroes()`: el gestor pone una ficha de una casilla por héroe en la
  estancia inicial. El id del héroe es el de su ficha, así que debe ser único
  en todo el mapa.
- `modoActivacion()`: el modo con el que empieza la escuadra. Solo se llama
  con `modosActivacion: 'agresivo-sigiloso'`, pero hay que implementarlo
  siempre.
- `acciones(estado, mapa, heroe?)`: lo que la escuadra puede hacer ahora.
  Devuelve solo las propias del juego (`{ id, nombre, icono }`: la corona
  pinta solo el `icono`, que interpreta la vista, en el banco de pruebas un
  emoji, y despliega el `nombre` al señalarlo o al primer toque); el
  gestor añade detrás las suyas: «Cambiar a agresivo/sigiloso» (si hay modos)
  y «Terminar turno» (id `terminar-turno`). No uses sus ids (`cambiar-modo`,
  `terminar-turno`) para acciones propias.

`EstadoEscuadra` es lo que recibe `acciones` para decidir:

```ts
{
  escuadra: string,  // su id
  turno: number,     // número del turno en curso
  heroes: [{ id: string, estancia: string, posicion?: { x: number, y: number } }],
  modo: 'normal' | 'agresivo' | 'sigiloso',
  acciones: [{ accion: string, heroe?: string }], // las ya ejecutadas en este turno; `heroe`, si la hizo uno
  movimientos: [{ heroe: string, opcion: string, casillas: number, acciones: string[] }], // los de este turno
}
```

- `activar(acciones)`: después de cada acción de la corona o movimiento, el
  gestor pasa a la escuadra todas las que lleva en el turno
  (`AccionEjecutada = { accion, heroe? }`, con `heroe` en las que hizo un
  héroe: mover, deslizar…). Responde `{ completo: true }` si su activación
  ha terminado: el gestor termina su turno como si hubiera elegido «Terminar
  turno». Con `{ completo: false }` sigue activándose. No se llama tras
  «Terminar turno». El banco de pruebas da la activación por completa cuando
  la escuadra se ha movido y además ha hecho otra acción, y lo muestra con
  `console.log`.

Sin `posicion`, el héroe está en la zona de espera de su estancia. De momento
el gestor solo apunta las acciones propias en `acciones`: su efecto en el
juego aún corre a cargo del proyecto.

## Acciones con código: comandos

Al pulsar una ficha, el gestor pregunta a su escuadra por sus acciones con
el mapa y el héroe pulsado, con su posición (`acciones(estado, mapa, heroe)`).
La escuadra decide qué puede hacer ese héroe donde está (abrir la puerta que
pisa…). Una acción puede ser un **comando**: una acción con su código ya
empaquetado en `exec`. Al elegirla, el gestor llama a `exec()`, la apunta
(como del héroe pulsado) y pregunta a la escuadra si su activación está
completa. Si `exec` falla (o se cancela un diálogo que abre), no se apunta.

```ts
interface Comando extends Accion {
  exec(): Promise<void>
}

type HeroeEnMapa = { id: string; nombre: string; escuadra: string; posicion: Ubicacion }
type Ubicacion = { estancia: string; casilla: { x: number; y: number } }

interface MapaEnJuego {
  readonly mapa: Mapa                                  // el mapa tal como está
  puertaEn(ubicacion: Ubicacion): Puerta | undefined   // la puerta de esa casilla
  abrirPuerta(ubicacion: Ubicacion): Promise<Estancia> // pide la estancia de detrás y la deja abierta
}
```

`abrirPuerta` llama a `describirEstancia` del proveedor (con el mapa
construido), añade la estancia y marca la puerta `abierta` con su `destino`.
El proveedor recibe en `entrada` el muro de la estancia nueva que encaja con
la puerta: ahí va su entrada, sea cual sea su `orientacion` (hacia donde
están las salidas, que no puede ser ese muro: si lo es, no se abre). La
estancia se pega a la puerta: su entrada comparte arista con ella y queda
abierta hacia la estancia de la que se viene; si choca con otra, se desliza a
lo largo de su muro. Falla si no hay puerta, si ya está abierta o si el
proveedor rechaza: entonces la puerta sigue cerrada.

Las estancias del mapa tienen su sitio en casillas comunes (`posicion`): la
primera en 0,0, las que se abren desde una puerta pegadas a ella y las que se
piden con `nuevaEstancia()`, aparte a la derecha de todo.

En el banco de pruebas, `accionesDeEscuadra` ofrece la clase `AbrirPuerta`
cuando el héroe pulsado está en una salida cerrada:

```ts
class AbrirPuerta implements Comando {
  readonly id = 'abrir-puerta'
  readonly nombre = 'Abrir puerta'
  readonly icono = '🚪'
  #donde: Ubicacion
  #mapa: MapaEnJuego
  constructor(donde: Ubicacion, mapa: MapaEnJuego) { this.#donde = donde; this.#mapa = mapa }
  async exec() { await this.#mapa.abrirPuerta(this.#donde) }
}
```

## Movimiento: Heroe.opcionesMovimiento

Al arrastrar una ficha, el gestor pregunta al héroe cómo puede moverse ahora,
con el estado de su escuadra y lo que ya ha movido este turno:
`gastado = { casillas, acciones }`, la suma de sus movimientos anteriores y
las acciones que consumieron. Se le pregunta cada vez que se arrastra, también
si ya se ha movido: devuelve lo que le queda (o `undefined` si no puede
moverse más), con su movimiento base y sus variaciones:

```ts
type OpcionesMovimiento = { base: OpcionMovimiento; variaciones: OpcionMovimiento[] }

type OpcionMovimiento = {
  id: string
  nombre: string                  // se muestra junto a la flecha
  tipo: 'normal' | 'carga'        // la carga se dibuja en otro color
  accion: Accion                  // la que consume moverse así
  tramos: TramoMovimiento[]       // el primero es el movimiento; los siguientes lo alargan
  alejarseDeEnemigos?: number     // no pasar ni terminar a esa distancia o menos (1: junto)
  terminarJuntoAEnemigo?: boolean // carga
}

type TramoMovimiento = { distancia: number; accion?: Accion } // `accion`: la adicional que consume
```

Ejemplos: mover 6 sin acercarse a enemigos es `tramos: [{ distancia: 6 }]` con
`alejarseDeEnemigos: 1`; cargar 8 es `tipo: 'carga'`, `tramos: [{ distancia: 8 }]`
y `terminarJuntoAEnemigo: true`; mover 6 y deslizar 3 más es
`tramos: [{ distancia: 6 }, { distancia: 3, accion: deslizar }]`.

- El recorrido va en las casillas comunes del mapa, casilla a casilla en
  ortogonal, sin atravesar objetos ni estancias interiores. Entre dos
  estancias solo se pasa por una puerta abierta; cualquier otro muro corta el
  paso aunque las estancias se toquen. Al terminar en otra estancia, la ficha
  pasa a ella. Puede pasar por encima de otros héroes, pero no terminar
  encima.
- Al soltar vale la primera opción que permite el recorrido: la base y
  después las variaciones, en el orden en que vienen. Ordénalas de la más
  barata a la más cara.
- Las distancias a enemigos cuentan las diagonales (junto es a 1 casilla en
  cualquier dirección). Aún no hay enemigos en el mapa: no se puede cargar.
- Si el recorrido llega a un tramo con acción adicional, el gestor pide
  confirmación (`ProveedorConfirmacion`) antes de mover.
- Al mover, el gestor apunta en la escuadra el movimiento (héroe, opción,
  casillas y acciones) en `estado.movimientos`, y la `accion` de la opción y
  la de cada tramo adicional usado en `estado.acciones`; si no había
  empezado, empieza su activación. Si el héroe solo puede moverse una vez por
  turno, comprueba `gastado.casillas`; para que tras deslizar no pueda
  moverse más, `gastado.acciones`. El banco de pruebas devuelve lo que queda
  de mover más deslizar 3, y nada si ya ha deslizado (`movimientoDePrueba`).
- La vista del banco de pruebas pinta la flecha en verde en el primer tramo,
  rojiza en los tramos con acción adicional y morada en una carga; no la
  alarga más allá del alcance, y soltar fuera de él no hace nada.

El mapa se guarda como JSON, así que el gestor no guarda las escuadras (tienen
métodos): guarda su `id` y su `nombre`, y cada ficha de héroe, el id de su
escuadra. Un gestor creado con un mapa guardado vuelve a pedir las escuadras
al proveedor, que debe devolver las mismas (mismos ids).

## Ejemplo completo

```ts
import { GestorMapa, type Escuadra, type ProveedorMapa } from '../gamemap'

const mover = { id: 'mover', nombre: 'Mover', icono: '🥾' }

const grupo: Escuadra = {
  id: 'grupo',
  nombre: 'El grupo',
  heroes: async () => [
    {
      id: 'barbaro',
      nombre: 'Bárbaro',
      imagenVtt: urlBarbaro,
      opcionesMovimiento: async (_estado, { casillas }) =>
        casillas > 0
          ? undefined
          : {
              base: { id: 'mover', nombre: 'Mover', tipo: 'normal', accion: mover, tramos: [{ distancia: 6 }] },
              variaciones: [],
            },
    },
  ],
  modoActivacion: async () => 'sigiloso',
  acciones: async (_estado, mapa, heroe) => {
    const puerta = heroe && mapa.puertaEn(heroe.posicion)
    return heroe && puerta && !puerta.abierta ? [new AbrirPuerta(heroe.posicion, mapa)] : []
  },
  activar: async (acciones) => ({ completo: acciones.some((a) => a.accion === 'mover') }),
}

const proveedor: ProveedorMapa = {
  configuracion: { ordenActivaciones: 'alternas', modosActivacion: 'agresivo-sigiloso' },
  confirmar: async (mensaje) => window.confirm(mensaje),
  describirEstancia: async (mapa) => ({
    tipo: mapa ? 'pasillo' : 'sala',
    tamano: mapa ? { columnas: 2, filas: 7 } : { columnas: 6, filas: 4 },
    orientacion: 'abajo',
    salidas: 1,
    elementos: [{ tipo: 'objeto', nombre: 'Mesa', columnas: 3, filas: 2 }],
  }),
  listarEscuadras: async () => [grupo],
}

const gestor = new GestorMapa(proveedor, mapaGuardado) // sin mapa guardado, empieza vacío
gestor.suscribir((mapa) => guardar(mapa)) // cada cambio crea un mapa nuevo
await gestor.nuevaEstancia() // la inicial, con los héroes
const acciones = await gestor.accionesDisponibles('grupo') // Cambiar a agresivo, Terminar turno
await gestor.moverHeroe('barbaro', [{ x: 2, y: 1 }, { x: 2, y: 2 }]) // de su casilla a la de al lado
```

## En React

- Crea el proveedor una sola vez (`useMemo`) y el gestor también una sola vez
  por mapa (`useState(() => new GestorMapa(...))`): un gestor nuevo perdería
  lo que esté esperando, como una estancia que se está describiendo.
- Lee el mapa con `useSyncExternalStore(gestor.suscribir, () => gestor.mapa)`.
- Si una interfaz necesita interfaz de usuario (un diálogo para describir la
  estancia), haz que su promesa se resuelva desde el componente, como
  `useProveedorDebug`.
