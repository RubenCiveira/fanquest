# Cómo implementar los proveedores

`GestorMapa` no sabe nada del juego: lo que depende de él se lo pide a un
**proveedor** que implementa el proyecto. El proveedor es un solo objeto que
cumple todas las interfaces de `ProveedorMapa`:

```ts
type ProveedorMapa = ProveedorConfiguracion & ProveedorConfirmacion & ProveedorEstancias & ProveedorPersonajes
```

Todos los tipos se importan desde `index.ts` del módulo. La implementación de
referencia es la del banco de pruebas, en `../map-debug-imp/`
(`useProveedorDebug.tsx`, `escuadras.ts` y `modelo/`).

## Clases y estado

La librería separa dos cosas con nombres distintos:

- **Clases** (`ClaseDeEscuadra`, `ClaseDePersonaje`): las define el proyecto y
  dicen qué puede hacer cada uno (moverse, sus acciones, cómo se activa). Son
  objetos con métodos y no se guardan.
- **Estado** (`Escuadra`, `Personaje`): lo guarda el gestor dentro del `Mapa` (se
  puede guardar como JSON). Dice dónde está cada personaje y qué ha hecho cada uno
  en cada turno.

```ts
type Escuadra = {
  id: string
  nombre: string
  personajes: Personaje[]
  activo?: string             // el personaje que está actuando
  modo?: ModoActivacion       // el último en que se activó (o el de partida)
  turnos: TurnoDeEscuadra[]   // { numero, activacion?, acciones: [{ accion, personaje? }] }
}

type Personaje = {
  id: string
  nombre: string
  imagenVtt?: string
  estancia: string            // la estancia en que está
  casilla?: Casilla           // su casilla en ella; sin ella, en la zona de espera
  turnos: TurnoDePersonaje[]      // { numero, acciones: string[], movimientos: [{ opcion, casillas, acciones }] }
}
```

El número del turno en curso es `mapa.turno` (`numeroDeTurno(mapa)`);
`turnoDePersonaje(personaje, numero)` y `turnoDeEscuadra(escuadra, numero)` dan lo que
ha hecho cada uno en un turno (vacío si nada). En los turnos del personaje,
`acciones` son sus acciones (sin contar moverse) y `movimientos`, sus
movimientos con las acciones que consumieron.

## Resumen

| Interfaz | Miembro | Cuándo lo usa el gestor |
| --- | --- | --- |
| `ProveedorConfiguracion` | `configuracion` | Siempre que aplica reglas de activación |
| `ProveedorConfirmacion` | `confirmar(mensaje)` | Antes de un movimiento que consume una acción adicional (deslizar…) |
| `ProveedorEstancias` | `describirEstancia(mapa?, entrada?)` | En cada `nuevaEstancia()` y `abrirPuerta()` |
| `ProveedorEstancias` | `estanciaCreada(estancia, mapa)` | Cuando la estancia ya está creada y en su sitio |
| `ProveedorPersonajes` | `listarEscuadras()` | La primera vez que necesita las clases (una sola vez por gestor) |
| `ClaseDeEscuadra` | `personajes()` | Al crear la estancia inicial y al buscar la clase de un personaje |
| `ClaseDeEscuadra` | `modoActivacion()` | Al crear la estancia inicial, con modo agresivo o sigiloso |
| `ClaseDeEscuadra` | `activar(acciones)` | Tras cada acción o movimiento de la escuadra, mientras se activa |
| `ClaseDePersonaje` | `acciones(personaje, mapa)` | Al pulsar su ficha y al ejecutar una de sus acciones |
| `ClaseDePersonaje` | `opcionesMovimiento(personaje, gastado)` | Al empezar a arrastrar su ficha y al soltarla |
| `Comando` | `exec()` | Al elegir una acción que es un comando |

## ProveedorConfiguracion

```ts
configuracion: {
  ordenActivaciones: 'alternas' | 'personajes-primero',
  modosActivacion: 'normal' | 'agresivo-sigiloso',
  medicionMovimiento: 'ortogonal' | 'diagonal' | 'euclidea',
}
```

- `ordenActivaciones`: si personajes y enemigos se van turnando o se activan
  primero todos los personajes. Se guarda, pero aún no cambia nada: no hay
  enemigos en el mapa.
- `modosActivacion`: con `agresivo-sigiloso`, cada escuadra se activa en uno
  de esos dos modos y puede cambiar de uno a otro; con `normal`, todas las
  activaciones son normales.
- `medicionMovimiento`: cómo se mide lo que se mueve un personaje. `ortogonal`,
  casilla a casilla sin diagonales; `diagonal`, también en diagonal y cada
  paso cuesta uno; `euclidea`, también en diagonal pero cuenta el largo del
  camino por Pitágoras (√2 cada diagonal) redondeado hacia arriba: tres
  diagonales cuestan 5. En diagonal no se cortan esquinas de muros ni de
  objetos, ni se cruza de una estancia a otra (las puertas se cruzan de
  frente). La flecha sigue el camino más corto según la medición.

El gestor lee `configuracion` cada vez que la necesita: si el proveedor la
expone con un getter, un cambio vale al momento (el banco de pruebas tiene un
formulario para cambiarla).
## ProveedorConfirmacion

```ts
confirmar(mensaje: string): Promise<boolean>
```

Pide al jugador que confirme algo antes de hacerlo; `true` si confirma. Se
usa al soltar una ficha en un tramo que consume una acción adicional
(«Confirme que queremos deslizar»): sin confirmar, no se mueve.

## ProveedorEstancias

```ts
describirEstancia(mapa?: Mapa, entrada?: Direccion): Promise<DescripcionEstancia>
estanciaCreada(estancia: Estancia, mapa: MapaEnJuego): void
```

`describirEstancia` se llama cada vez que hay que generar una estancia.
Recibe el mapa ya construido (`undefined` en la primera) y, si se abre desde
una puerta, `entrada`: el muro de la nueva por el que se entrará. Devuelve:

```ts
{
  tipo: 'exterior' | 'sala' | 'pasillo',
  tamano: { columnas: number, filas: number },
  orientacion: 'arriba' | 'abajo' | 'izquierda' | 'derecha', // muro de las salidas; no puede ser el de `entrada`
  salidas: number,
  elementos: [{ tipo: 'objeto', nombre: string, columnas: number, filas: number }],
  terrenos?: [{ tipo: 'impasable' | 'dificil' | 'muy-dificil', posicion: { x, y }, columnas: number, filas: number, imagen?: string }],
}
```

- La entrada va en el muro `entrada` (si no hay, en el contrario a
  `orientacion`) y las `salidas` se reparten por el muro de `orientacion`: no
  puede haber más salidas que casillas tiene ese muro.
- Los objetos no llevan posición: el gestor busca un hueco para cada uno y,
  si no cabe, lo deja en la zona de espera para colocarlo a mano.
- Los `terrenos` sí la llevan (en casillas de la estancia): zonas en las que
  entrar en cada casilla cuesta dos (`dificil`) o tres (`muy-dificil`), o que
  no se pueden pisar (`impasable`). Ni objetos ni personajes se colocan en
  terreno impasable, y un terreno que se sale de la estancia no se puede
  construir. Con `imagen`, la vista pinta solo la imagen sobre todas sus
  casillas; sin ella, un rayado según el tipo.
- Si la promesa se rechaza, no se crea ninguna estancia y el error sigue. El
  banco de pruebas rechaza con un `DOMException` `AbortError` al cancelar su
  diálogo.

`estanciaCreada` avisa de cada estancia ya construida y colocada, con sus
puertas en su sitio: es el momento de asociarle los objetos propios del
proyecto. El banco de pruebas asocia una `PuertaDePrueba` a cada puerta.

Las estancias del mapa tienen su sitio en casillas comunes (`posicion`): la
primera en 0,0, las que se piden con `nuevaEstancia()` aparte a la derecha y
las que se abren desde una puerta pegadas a ella, con su entrada compartiendo
arista con la puerta y las dos abiertas una hacia la otra.

## ProveedorPersonajes: clases de escuadra y de personaje

```ts
listarEscuadras(): Promise<ClaseDeEscuadra[]>

interface ClaseDeEscuadra {
  id: string
  nombre: string
  personajes(): Promise<ClaseDePersonaje[]>
  modoActivacion(): Promise<'agresivo' | 'sigiloso'>
  activar(acciones: AccionEjecutada[]): Promise<ResultadoActivacion>
}

interface ClaseDePersonaje {
  id: string
  nombre: string
  imagenVtt?: string // URL de la ficha VTT vista desde arriba
  opcionesMovimiento(personaje: Personaje, gastado: MovimientoGastado): Promise<OpcionesMovimiento | undefined>
  acciones(personaje: Personaje, mapa: MapaEnJuego): Promise<Accion[]>
}
```

- Al crear la estancia inicial, el gestor crea el estado de cada escuadra y
  de sus personajes, que coloca en el sitio libre más cercano al centro (o en la
  zona de espera). El id de cada personaje debe ser único en todo el mapa.
- `modoActivacion()`: el modo con el que empieza la escuadra. Solo se llama
  con `modosActivacion: 'agresivo-sigiloso'`, pero hay que implementarlo.
- `activar(acciones)`: tras cada acción o movimiento, el gestor pasa a la
  escuadra todas las acciones del turno (`{ accion, personaje? }`). Si responde
  `{ completo: true }`, termina su turno como con «Terminar turno». No se
  llama tras «Terminar turno».
- El gestor pide las clases una sola vez. Un gestor creado con un mapa
  guardado vuelve a pedirlas: deben tener los mismos ids.

## Acciones del personaje: comandos

Al pulsar la ficha de un personaje, el gestor pregunta **solo a su clase**
(`acciones(personaje, mapa)`) con su estado. La clase decide qué puede hacer ahí:
mira qué objetos suyos hay en su casilla, comprueba en sus turnos lo que ya
ha hecho y compone sus acciones. El gestor no pregunta a los objetos ni
mezcla nada: solo añade detrás las suyas, «Cambiar a agresivo/sigiloso» (si
hay modos) y «Terminar turno». No uses sus ids (`cambiar-modo`,
`terminar-turno`).

Cada acción es `{ id, nombre, icono }`: la corona pinta el `icono` y
despliega el `nombre` al señalarlo. Una acción suele ser un **comando**, con
su código ya empaquetado:

```ts
interface Comando extends Accion {
  exec(): Promise<void>
}

interface MapaEnJuego {
  readonly mapa: Mapa                                  // el mapa tal como está
  puertaEn(ubicacion: Ubicacion): Puerta | undefined   // la puerta de esa casilla
  abrirPuerta(ubicacion: Ubicacion): Promise<Estancia> // pide la estancia de detrás y la deja abierta
}
```

Al elegir una acción del personaje, el gestor llama a `exec()` y después la apunta
en el turno del personaje y en el de su escuadra, que lo marca como su personaje
activo. Si `exec` falla (o se cancela un diálogo que abre), no se apunta.

`abrirPuerta` llama a `describirEstancia` con el muro de entrada, añade la
estancia pegada a la puerta y la marca `abierta` con su `destino`. Falla si no
hay puerta, si ya está abierta o si el proveedor rechaza: entonces la puerta
sigue cerrada.

En el banco de pruebas (`map-debug-imp/modelo/`):

- `PuertasDePrueba` asocia una `PuertaDePrueba` a cada puerta de la estancia
  creada y da los objetos de una casilla (`objetosEn`).
- `PuertaDePrueba` es un objeto del debug: su estado (abierta o no) es el del
  mapa y, si es una salida cerrada, ofrece el comando `AbrirPuerta`, cuyo
  `exec()` llama a `puerta.abrir()` → `mapa.abrirPuerta(donde)`.
- `PersonajeDePrueba` (`implements ClaseDePersonaje`) compone sus acciones con las de
  los objetos de su casilla, si aún no ha hecho ninguna acción en el turno
  (moverse no cuenta).

## Movimiento: ClaseDePersonaje.opcionesMovimiento

Al arrastrar una ficha, el gestor pregunta a la clase del personaje cómo puede
moverse ahora, con su estado y lo que ya ha movido este turno
(`gastado = { casillas, acciones }`). Se le pregunta cada vez, también si ya
se ha movido: devuelve lo que le queda (o `undefined` si no puede moverse
más):

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

- El recorrido va en las casillas comunes del mapa, casilla a casilla (con o
  sin diagonales, según `medicionMovimiento`), sin atravesar objetos ni
  estancias interiores. Las `distancia` de los tramos y `gastado.casillas` se
  cuentan en lo que cuesta el camino según esa medición. Entre dos
  estancias solo se pasa por una puerta abierta. Puede pasar por encima de
  otros personajes, pero no terminar encima. Entrar en terreno difícil cuesta
  dos veces lo normal y en muy difícil, tres; el impasable no se pisa.
- Vale la primera opción que permite el recorrido: la base y después las
  variaciones, en orden. Ordénalas de la más barata a la más cara.
- Si el recorrido llega a un tramo con acción adicional, el gestor pide
  confirmación (`ProveedorConfirmacion`) antes de mover.
- Al mover, el gestor apunta el movimiento en el turno del personaje y las
  acciones que consume (la de la opción y la de cada tramo adicional usado)
  en el de su escuadra; si no había empezado, empieza su activación.
- Aún no hay enemigos en el mapa: no se puede cargar.

## Ejemplo completo

```ts
import { GestorMapa, numeroDeTurno, turnoDePersonaje, type ClaseDeEscuadra, type ClaseDePersonaje, type ProveedorMapa } from '../gamemap'

const mover = { id: 'mover', nombre: 'Mover', icono: '🥾' }

const barbaro: ClaseDePersonaje = {
  id: 'barbaro',
  nombre: 'Bárbaro',
  imagenVtt: urlBarbaro,
  opcionesMovimiento: async (_personaje, { casillas }) =>
    casillas > 0 ? undefined : { base: { id: 'mover', nombre: 'Mover', tipo: 'normal', accion: mover, tramos: [{ distancia: 6 }] }, variaciones: [] },
  acciones: async (personaje, mapa) => {
    if (!personaje.casilla || turnoDePersonaje(personaje, numeroDeTurno(mapa.mapa)).acciones.length) return []
    const donde = { estancia: personaje.estancia, casilla: personaje.casilla }
    const puerta = mapa.puertaEn(donde)
    return puerta && !puerta.abierta
      ? [{ id: 'abrir-puerta', nombre: 'Abrir puerta', icono: '🚪', exec: () => mapa.abrirPuerta(donde).then(() => {}) }]
      : []
  },
}

const grupo: ClaseDeEscuadra = {
  id: 'grupo',
  nombre: 'El grupo',
  personajes: async () => [barbaro],
  modoActivacion: async () => 'sigiloso',
  activar: async (acciones) => ({ completo: acciones.some((a) => a.accion === 'mover') }),
}

const proveedor: ProveedorMapa = {
  configuracion: { ordenActivaciones: 'alternas', modosActivacion: 'agresivo-sigiloso' },
  confirmar: async (mensaje) => window.confirm(mensaje),
  describirEstancia: async (mapa, entrada) => ({
    tipo: mapa ? 'pasillo' : 'sala',
    tamano: mapa ? { columnas: 2, filas: 7 } : { columnas: 6, filas: 4 },
    orientacion: entrada === 'abajo' ? 'arriba' : 'abajo',
    salidas: 1,
    elementos: [{ tipo: 'objeto', nombre: 'Mesa', columnas: 3, filas: 2 }],
  }),
  estanciaCreada: () => {},
  listarEscuadras: async () => [grupo],
}

const gestor = new GestorMapa(proveedor, mapaGuardado) // sin mapa guardado, empieza vacío
gestor.suscribir((mapa) => guardar(mapa)) // cada cambio crea un mapa nuevo
await gestor.nuevaEstancia() // la inicial, con las escuadras y sus personajes
const acciones = await gestor.accionesDisponibles('grupo', 'barbaro') // las del bárbaro y las del gestor
await gestor.moverPersonaje('barbaro', [{ x: 2, y: 1 }, { x: 2, y: 2 }]) // de su casilla a la de al lado
```

## En React

- Crea el proveedor una sola vez (`useMemo`) y el gestor también una sola vez
  por mapa (`useState(() => new GestorMapa(...))`): un gestor nuevo perdería
  lo que esté esperando, como una estancia que se está describiendo.
- Lee el mapa con `useSyncExternalStore(gestor.suscribir, () => gestor.mapa)`.
- Si una interfaz necesita interfaz de usuario (un diálogo para describir la
  estancia), haz que su promesa se resuelva desde el componente, como
  `useProveedorDebug`.
