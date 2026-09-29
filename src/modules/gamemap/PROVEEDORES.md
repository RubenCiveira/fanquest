# Cómo implementar los proveedores

`GestorMapa` no sabe nada del juego: todo lo que depende de él se lo pide a
un **proveedor** que implementa el proyecto. El proveedor es un solo objeto
que cumple todas las interfaces de `ProveedorMapa`:

```ts
type ProveedorMapa = ProveedorConfiguracion & ProveedorEstancias & ProveedorHeroes
```

Todos los tipos se importan desde `index.ts` del módulo. La implementación de
referencia es la del banco de pruebas: `../map-debug-imp/useProveedorDebug.tsx`
y `../map-debug-imp/escuadras.ts`.

## Resumen

| Interfaz | Miembro | Cuándo lo usa el gestor |
| --- | --- | --- |
| `ProveedorConfiguracion` | `configuracion` | Siempre que aplica reglas de activación |
| `ProveedorEstancias` | `describirEstancia(mapa?)` | En cada `nuevaEstancia()` |
| `ProveedorHeroes` | `listarEscuadras()` | La primera vez que necesita las escuadras (una sola vez por gestor) |
| `Escuadra` | `heroes()` | Al crear la estancia inicial |
| `Escuadra` | `modoActivacion()` | Al crear la estancia inicial, con modo agresivo o sigiloso, si la escuadra aún no tiene modo |
| `Escuadra` | `acciones(estado)` | En cada `accionesDisponibles()` y `ejecutarAccion()` |

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

## ProveedorEstancias

```ts
describirEstancia(mapa?: Mapa): Promise<DescripcionEstancia>
```

Se llama cada vez que hay que generar una estancia. Recibe el mapa ya
construido (`undefined` en la primera estancia) y devuelve cómo es la nueva:

```ts
{
  tipo: 'exterior' | 'sala' | 'pasillo',
  tamano: { columnas: number, filas: number },
  orientacion: 'arriba' | 'abajo' | 'izquierda' | 'derecha',
  salidas: number,
  elementos: [{ tipo: 'objeto', nombre: string, columnas: number, filas: number }],
}
```

- La entrada va en el muro contrario a `orientacion` y las `salidas` se
  reparten por el muro de `orientacion`: no puede haber más salidas que
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
  acciones(estado: EstadoEscuadra): Promise<Accion[]>
}

interface Heroe {
  id: string
  nombre: string
  imagenVtt?: string // URL de la ficha VTT vista desde arriba
}
```

- `heroes()`: el gestor pone una ficha de una casilla por héroe en la
  estancia inicial. El id del héroe es el de su ficha, así que debe ser único
  en todo el mapa.
- `modoActivacion()`: el modo con el que empieza la escuadra. Solo se llama
  con `modosActivacion: 'agresivo-sigiloso'`, pero hay que implementarlo
  siempre.
- `acciones(estado)`: lo que la escuadra puede hacer ahora. Devuelve solo las
  propias del juego (`{ id, nombre }`, con `nombre` como texto del botón); el
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
  acciones: string[], // ids de las acciones ya ejecutadas en este turno
}
```

Sin `posicion`, el héroe está en la zona de espera de su estancia. De momento
el gestor solo apunta las acciones propias en `acciones`: su efecto en el
juego aún corre a cargo del proyecto.

El mapa se guarda como JSON, así que el gestor no guarda las escuadras (tienen
métodos): guarda su `id` y su `nombre`, y cada ficha de héroe, el id de su
escuadra. Un gestor creado con un mapa guardado vuelve a pedir las escuadras
al proveedor, que debe devolver las mismas (mismos ids).

## Ejemplo completo

```ts
import { GestorMapa, type Escuadra, type ProveedorMapa } from '../gamemap'

const grupo: Escuadra = {
  id: 'grupo',
  nombre: 'El grupo',
  heroes: async () => [{ id: 'barbaro', nombre: 'Bárbaro', imagenVtt: urlBarbaro }],
  modoActivacion: async () => 'sigiloso',
  acciones: async ({ acciones }) => (acciones.includes('mover') ? [] : [{ id: 'mover', nombre: 'Mover' }]),
}

const proveedor: ProveedorMapa = {
  configuracion: { ordenActivaciones: 'alternas', modosActivacion: 'agresivo-sigiloso' },
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
const acciones = await gestor.accionesDisponibles('grupo') // Mover, Cambiar a agresivo, Terminar turno
await gestor.ejecutarAccion('grupo', 'mover')
```

## En React

- Crea el proveedor una sola vez (`useMemo`) y el gestor también una sola vez
  por mapa (`useState(() => new GestorMapa(...))`): un gestor nuevo perdería
  lo que esté esperando, como una estancia que se está describiendo.
- Lee el mapa con `useSyncExternalStore(gestor.suscribir, () => gestor.mapa)`.
- Si una interfaz necesita interfaz de usuario (un diálogo para describir la
  estancia), haz que su promesa se resuelva desde el componente, como
  `useProveedorDebug`.
