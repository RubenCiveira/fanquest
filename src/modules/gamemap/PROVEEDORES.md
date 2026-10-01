# Cómo implementar los proveedores

`GestorMapa` no sabe nada del juego: lo que depende de él se lo pide a un
**proveedor** que implementa el proyecto. El proveedor es un solo objeto que
cumple todas las interfaces de `ProveedorMapa`:

```ts
type ProveedorMapa = ProveedorConfiguracion & ProveedorConfirmacion & ProveedorEstancias & ProveedorPersonajes & ProveedorTurnos
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
  jugador: string             // el jugador del que es, y sus personajes con ella
  personajes: Personaje[]
  activo?: string             // el personaje que está actuando
  modo?: ModoActivacion       // el último en que se activó (o el de partida)
  turnos: TurnoDeEscuadra[]   // { numero, activacion?, acciones: [{ accion, personaje? }] }
  flags?: string[]            // marcas de estado (`marcarFlag('escuadra', …)`)
}

type Personaje = {
  id: string
  nombre: string
  imagenVtt?: string
  estancia: string            // la estancia en que está
  casilla?: Casilla           // su casilla en ella; sin ella, en la zona de espera
  vida?: number               // puntos de vida que le quedan; sin ellos, no se lleva la cuenta
  turnos: TurnoDePersonaje[]      // { numero, acciones: string[], movimientos: [{ opcion, casillas, acciones }] }
  flags?: string[]            // marcas de estado: aturdido… (`marcarFlag('personaje', …)`)
}
```

Los personajes que no están en ninguna escuadra (enemigos, acólitos…) son
`PersonajeNoJugador`: un `Personaje` con su `jugador`. El reparto de
jugadores y alianzas también se guarda en el mapa (`mapa.jugadores`), con la
`rotacion`: los jugadores que han ido terminando activaciones, en orden.

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
| `ProveedorTurnos` | `turnoDe(jugador, mapa)` | Tras cada activación que termina y al empezar un turno, si a alguien le toca |
| `ProveedorTurnos` | `finDeTurno(mapa)` | Cuando termina la última activación pendiente del turno |
| `ProveedorPersonajes` | `listarEscuadras()` | La primera vez que necesita las clases (una sola vez por gestor) |
| `ClaseDeEscuadra` | `personajes()` | Al crear la estancia inicial y al buscar la clase de un personaje |
| `ClaseDeEscuadra` | `modoActivacion()` | Al crear la estancia inicial, con modo agresivo o sigiloso |
| `ClaseDeEscuadra` | `activar(acciones)` | Tras cada acción o movimiento de la escuadra, mientras se activa |
| `ClaseDePersonaje` | `acciones(personaje, mapa)` | Al pulsar su ficha y al ejecutar una de sus acciones |
| `ClaseDePersonaje` | `opcionesMovimiento(personaje, gastado)` | Al empezar a arrastrar su ficha y al soltarla |
| `ClaseDePersonaje` | `motivoParaNoAtacar(ataque, mapa)` | Al pasar su ficha arrastrada por encima de un enemigo y antes de atacar |
| `ClaseDePersonaje` | `atacar(ataque, mapa)` | Al soltar su ficha arrastrada sobre la de un enemigo, si puede |
| `ClaseDePersonaje` | `alEntrar?(personaje, donde, mapa)` | Al soltar su ficha, por cada casilla del recorrido en que podría quedarse, en orden |
| `Comando` | `exec()` | Al elegir una acción que es un comando |

## ProveedorConfiguracion

```ts
configuracion: {
  ordenActivaciones: 'alternas' | 'personajes-primero',
  modosActivacion: 'normal' | 'agresivo-sigiloso',
  medicionMovimiento: 'ortogonal' | 'diagonal' | 'euclidea',
  terrenoPersonajes: 'normal' | 'dificil' | 'muy-dificil' | 'impasable',
  distanciaControl: number,
  cuerpoACuerpo: 'ortogonal' | 'diagonal',
  jugadores: {
    alianzas: [{ id: string, nombre: string, posturas?: { [otraAlianza: string]: 'aliada' | 'neutral' | 'hostil' } }],
    jugadores: [{ id: string, nombre: string, tipo: 'humano' | 'ia', alianza: string }],
  },
}
```

- `jugadores`: el reparto con que empieza la partida. Cada escuadra y cada
  personaje no jugador es de un jugador, y cada jugador, de una alianza. La
  postura de una alianza hacia otra dice si sus personajes son enemigos de los
  de la otra: con `hostil`, lo son; sin postura, neutral. Va en un sentido:
  unos acólitos hostiles hacia los héroes son enemigos de los héroes, pero los
  héroes solo lo son de ellos si su alianza también es hostil hacia la suya.
  El gestor guarda el reparto en el mapa al crear la estancia inicial (falla
  si una escuadra es de un jugador que no está) y se puede cambiar en
  cualquier momento con `cambiarJugadores` (también desde un comando, con
  `MapaEnJuego`): un evento vuelve hostiles a los acólitos, un jugador cambia
  de alianza…
- `ordenActivaciones`: a qué jugador le toca activar una escuadra. Con
  `alternas`, tras cada activación la siguiente alianza y, dentro de ella, el
  siguiente jugador al último suyo que activó: A (alianza 1), B (alianza 2),
  T (alianza 1)… Con `personajes-primero`, la primera alianza hasta que no le
  quede nada que activar (rotando sus jugadores), luego la siguiente. Se salta
  a quien no tiene escuadras por activar en el turno. Solo se pueden elegir
  las miniaturas del jugador al que le toca (`gestor.jugadorEnTurno`). En la
  activación de una escuadra pueden actuar todos sus personajes; cada
  personaje no jugador tiene su propia activación.
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
- `terrenoPersonajes`: cómo cuenta para moverse la casilla en que hay otro
  personaje que no sea enemigo. `normal`, se pasa por encima
  como si nada; `dificil` o `muy-dificil`, cuesta como ese terreno;
  `impasable`, no se puede atravesar: un personaje parado ante una puerta
  cierra el paso a los demás. Nunca se termina encima de otro personaje. Si
  además hay terreno en esa casilla, cuenta el peor de los dos. La casilla de
  un enemigo es siempre impasable.
- `distanciaControl`: casillas alrededor de un personaje que controla: a
  las que llega en esos pasos o menos, en recto o en diagonal (1, las de su
  lado), sin atravesar muros (ni los interiores, salvo por sus pasos y
  puertas abiertas, ni los de la estancia, salvo por una puerta abierta). El
  terreno, los objetos y los personajes no la cortan. Quien está en la zona de control
  de un enemigo está trabado en cuerpo a cuerpo. Un movimiento normal no
  puede empezar en ella (trabado, no se mueve así) ni entrar; una carga
  (`tipo: 'carga'`) tiene que empezar fuera (trabado no se carga) y puede
  atravesarla para contactar con el enemigo; destrabarse (`tipo:
  'destrabarse'`) tiene que empezar en ella y terminar fuera de toda zona
  enemiga; y posicionarse (`tipo: 'posicionarse'`) tiene que empezar en ella
  y terminar pegado a uno de los enemigos que lo traban.
- `cuerpoACuerpo`: qué casillas están en contacto. Con `ortogonal`, solo las
  de al lado en recto: un enemigo en diagonal no se puede atacar cuerpo a
  cuerpo (es a distancia) y hay que posicionarse para atacarle. Con
  `diagonal`, también las de las esquinas. Vale para el tipo de ataque y
  para terminar junto a un enemigo (cargar, posicionarse). El banco de
  pruebas empieza con `ortogonal`. Con 0 no hay zona de control. La
  flecha del arrastre y «Agrupar aquí» buscan rutas que la rodeen; si el
  recorrido entra en ella, se rechaza diciéndolo.

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

## ProveedorTurnos

```ts
turnoDe(jugador: Jugador, mapa: MapaEnJuego): void
finDeTurno(mapa: MapaEnJuego): void
```

Tras cada activación que termina (y al pasar a un turno nuevo), el gestor
dice a qué jugador le toca, si a alguno le queda algo por activar: para
avisarle o, si es la IA, jugar por ella. El banco de pruebas abre un diálogo
«Le toca a …». Si al terminar una activación ya nadie tiene nada pendiente,
llama a `finDeTurno`: el proyecto decide cuándo pasar al siguiente
(`mapa.terminarTurno()`).

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
  muebles?: [{ id: string, tipo: 'mueble', nombre: string, columnas: number, filas: number, imagenVtt?: string }],
  terrenos?: [{ tipo: 'impasable' | 'dificil' | 'muy-dificil', cobertura?: 'ninguna' | 'ligera' | 'pesada' | 'bloqueante', posicion: { x, y }, columnas: number, filas: number, imagen?: string }],
  muros?: [{ desde: { x, y }, hasta: { x, y }, pasos?: number[], puertas?: number[], cobertura?: 'ninguna' | 'ligera' | 'pesada' | 'bloqueante' }],
  personajesNoJugadores?: [{ id: string, nombre: string, imagenVtt?: string, vida?: number, jugador: string, casilla?: { x, y }, zona?: { posicion: { x, y }, columnas: number, filas: number } }],
}
```

- La entrada va en el muro `entrada` (si no hay, en el contrario a
  `orientacion`) y las `salidas` se reparten por el muro de `orientacion`: no
  puede haber más salidas que casillas tiene ese muro.
- Los objetos no llevan posición: el gestor busca un hueco para cada uno y,
  si no cabe, lo deja en la zona de espera para colocarlo a mano.
- Los `muebles` son fijos: el proyecto les da un id estable, el gestor los
  pone al azar donde quepan y no se mueven a mano. Como todo lo que está vivo
  en el mapa, llevan su estado en `flags` (`marcarFlag('elemento', id, …)`):
  el banco de pruebas marca `revisado` al revisar uno.
- Los `terrenos` sí la llevan (en casillas de la estancia): zonas en las que
  entrar en cada casilla cuesta dos (`dificil`) o tres (`muy-dificil`), o que
  no se pueden pisar (`impasable`). Ni objetos ni personajes se colocan en
  terreno impasable, y un terreno que se sale de la estancia no se puede
  construir. Con `imagen`, la vista pinta solo la imagen sobre todas sus
  casillas; sin ella, un rayado según el tipo.
- La `cobertura` de un terreno dice cuánto protege de los disparos que lo
  cruzan: `ligera`, `pesada` o `bloqueante` (sin ella, `ninguna`). Es
  independiente del `tipo`, que solo afecta al movimiento: un seto puede ser
  difícil de cruzar y dar cobertura ligera. Si una casilla tiene varios
  terrenos, cuenta la mayor. El banco de pruebas la pone según el tipo:
  difícil, ligera; muy difícil, pesada; impasable, bloqueante.
- Los `muros` son muros dentro de la estancia: no la dividen en estancias ni
  ocupan casillas, van por los bordes entre ellas, en línea recta de la
  esquina `desde` a la `hasta` (coordenadas de esquina: la superior izquierda
  de la casilla x,y es x,y; tiene que ir por dentro, no por el muro
  exterior). Cada tramo (desde 0, de arriba abajo o de izquierda a derecha)
  puede ser:
  - muro: no se cruza;
  - paso (`pasos`): se cruza limpiamente;
  - puerta (`puertas`): una `Puerta` de tipo `interior`, cerrada al
    construirla. Cerrada no se cruza; abierta, limpiamente.

  Las rutas lo rodean por sus pasos y puertas abiertas; si aísla una zona
  sin ninguno, no se puede salir de ella. En diagonal no se corta su
  esquina. A los disparos que lo cruzan, el muro les da cobertura
  bloqueante; una puerta cerrada, también; una abierta, ligera; y un paso,
  la `cobertura` del muro (sin ella, ligera). No hay cuerpo a cuerpo a través de un muro ni de
  una puerta cerrada, sí por un paso o una puerta abierta. La zona de
  control tampoco lo atraviesa. La vista lo
  dibuja como los muros de la estancia (los pasos, en discontinuo). El banco
  de pruebas tiene un «Muro de prueba» vertical por el medio de la sala.
- Los `personajesNoJugadores`, cada uno de un `jugador` (enemigos si su
  alianza es hostil), aparecen en la
  estancia: en su `casilla`, o en una al azar de su `zona` o, sin ninguna de
  las dos, de toda la estancia. Siempre en una casilla libre: dentro, sin
  terreno impasable, puerta, objeto ni otro personaje; si no la hay, quedan
  en la zona de espera. Sus ids no pueden repetir los de otros personajes del
  mapa. El banco de pruebas pone uno o dos monstruos de las plantillas, al
  azar por la estancia.
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
  jugador: string // id de un jugador de `configuracion.jugadores`
  buscaTrampas?: boolean // si sus personajes pueden «Buscar trampas»; sin decirlo, sí
  personajes(): Promise<ClaseDePersonaje[]>
  modoActivacion(): Promise<'agresivo' | 'sigiloso'>
  activar(acciones: AccionEjecutada[]): Promise<ResultadoActivacion>
}

interface ClaseDePersonaje {
  id: string
  nombre: string
  imagenVtt?: string // URL de la ficha VTT vista desde arriba
  vida?: number      // puntos de vida con los que empieza
  opcionesMovimiento(personaje: PersonajeEnJuego, gastado: MovimientoGastado): Promise<OpcionesMovimiento | undefined>
  acciones(personaje: PersonajeEnJuego, mapa: MapaEnJuego): Promise<Accion[]>
  motivoParaNoAtacar(ataque: Ataque, mapa: MapaEnJuego): string | undefined
  atacar(ataque: Ataque, mapa: MapaEnJuego): Promise<ResultadoAccion>
  alEntrar?(personaje: PersonajeEnJuego, donde: Ubicacion, mapa: MapaEnJuego): Promise<'seguir' | 'detenerse' | 'terminar-turno'>
}
```

- Al crear la estancia inicial, el gestor crea el estado de cada escuadra y
  de sus personajes: cada alianza empieza hacia una esquina y cada personaje,
  en una casilla libre con aire alrededor y lejos de otras alianzas (o en la
  zona de espera). El id de cada personaje debe ser único en todo el mapa.
- `modoActivacion()`: el modo con el que empieza la escuadra. Solo se llama
  con `modosActivacion: 'agresivo-sigiloso'`, pero hay que implementarlo.
- `activar(acciones)`: tras cada acción o movimiento, el gestor pasa a la
  escuadra todas las acciones del turno (`{ accion, personaje? }`). Si responde
  `{ completo: true }`, termina su turno como con «Terminar turno». No se
  llama tras «Terminar turno».
- En la activación de una escuadra pueden actuar todos sus personajes. Si
  tiene más de uno, «Terminar turno» se llama «Terminar turno de escuadra».
- Un jugador con personajes no jugadores también aparece en `jugadorEnTurno`:
  con `alternas`, rota entre alianzas; con `personajes-primero`, completa una
  alianza antes de pasar a la siguiente. Cada PNJ tiene su activación
  (`mapa.activacionesJugadores`): solo actúa uno cada vez y sus acciones son
  las del gestor (cambiar de modo, terminar turno). Los PNJ no tienen clase:
  quien los mueve le pasa sus opciones a
  `moverPersonajeNoJugador(id, recorrido, opciones)`, con las mismas reglas
  que los personajes de escuadra. El banco de pruebas los mueve a mano con
  `movimientoDePrueba` y termina su activación con
  `terminarActivacionJugador`.
- El gestor pide las clases una sola vez. Un gestor creado con un mapa
  guardado vuelve a pedirlas: deben tener los mismos ids.

## Acciones del personaje: comandos

Al pulsar la ficha de un personaje, el gestor pregunta **solo a su clase**
(`acciones(personaje, mapa)`) con su estado. La clase decide qué puede hacer ahí:
mira qué objetos suyos hay en su casilla, comprueba en sus turnos lo que ya
ha hecho y compone sus acciones. El gestor no pregunta a los objetos ni
mezcla nada: solo añade detrás las suyas:

- «Buscar trampas» (`buscar-trampas`), mientras la estancia no esté marcada
  `sin_trampas` y la escuadra busque trampas (`ClaseDeEscuadra.buscaTrampas`
  no es `false`); al ejecutarla la marca. En el banco de pruebas, las
  escuadras de monstruos del dueño de la mazmorra no buscan trampas, igual
  que los monstruos solitarios.
- «Agrupar aquí» (`agrupar`), si la escuadra tiene más personajes: cada uno de
  los demás que está colocado se mueve, con su movimiento restante
  (`opcionesMovimiento` de su clase, solo la opción base: sin acciones
  adicionales como deslizar y con sus reglas, como alejarse de enemigos), a
  la casilla libre más cercana al pulsado a la que llega; si no le alcanza
  para ponerse a su lado, se acerca todo lo que puede. Cada movimiento se
  apunta en su turno como uno más y «agrupar», como acción del pulsado. Los
  que ya están a su lado y los de la zona de espera no se mueven.
- «Cambiar a agresivo/sigiloso» (si hay modos) y «Terminar turno».

No uses sus ids (`buscar-trampas`, `agrupar`, `cambiar-modo`,
`terminar-turno`).

Cada acción es `{ id, nombre, icono }`: la corona pinta el `icono` y
despliega el `nombre` al señalarlo. Una acción suele ser un **comando**, con
su código ya empaquetado:

```ts
interface Comando extends Accion {
  exec(): Promise<ResultadoAccion> // { quedanAcciones: boolean }: el estado del personaje tras la acción
}

interface MapaEnJuego {
  readonly mapa: Mapa                                  // el mapa tal como está
  personaje(id: string): PersonajeEnJuego | undefined  // cualquier personaje del mapa, en juego
  personajesEn(estancia: string): PersonajeEnJuego[]   // los de esa estancia, en juego
  puertaEn(ubicacion: Ubicacion): Puerta | undefined   // la puerta de esa casilla
  tieneFlag(tipo: TipoConFlags, id: string, flag: string): boolean // marcas de estado (`sin_trampas`, `aturdido`, `revisado`…)
  marcarFlag(tipo: TipoConFlags, id: string, flag: string): string | undefined // si no está en el mapa, el motivo
  quitarFlag(tipo: TipoConFlags, id: string, flag: string): string | undefined
  dameLoQueEstaAlLado(personaje: Personaje): Elemento[] // objetos y muebles colocados junto a él (sin diagonales)
  quitarElemento(elemento: string): string | undefined // lo saca de su estancia (el personaje lo coge…)
  abrirPuerta(ubicacion: Ubicacion): Promise<Estancia> // pide la estancia de detrás y la deja abierta
  anadirPersonajes(estancia: string, personajes: DescripcionPersonajeNoJugador[]): PersonajeNoJugador[] // como los de la descripción
  anadirMuebles(estancia: string, muebles: DescripcionMueble[]): Elemento[] // al azar donde quepan
  reducirVida(personaje: string, puntos: number): string | undefined // sin bajar de cero; si no lleva la cuenta, el motivo
  eliminarPersonaje(personaje: string): string | undefined // lo quita del mapa (muere, huye…)
  cambiarJugadores(jugadores: Jugadores): string | undefined // otro reparto de alianzas, jugadores o posturas; si no vale, el motivo
  terminarTurno(): string | undefined                  // pasa al turno siguiente si nadie tiene nada pendiente
}
```

Al elegir una acción del personaje, el gestor llama a `exec()` y después la apunta
en el turno del personaje y en el de su escuadra, que lo marca como su personaje
activo. `exec` resuelve, como `atacar`, con el estado del personaje tras la
acción: `{ quedanAcciones }`, si aún le quedan acciones en el turno, que el
gestor guarda en su turno (`TurnoDePersonaje.quedanAcciones`). Si `exec`
falla o se cancela (un diálogo que abre, o porque ya no le quedan acciones),
no se apunta.

Con `quedanAcciones: false`, la activación de ese personaje termina: ya no
puede actuar ni moverse en el turno. Cuando a ninguno de los personajes de su
escuadra le quedan acciones, el gestor termina la activación de la escuadra
sin esperar a `activar`; en una escuadra de un solo personaje, en cuanto él
se queda sin acciones.

`abrirPuerta` llama a `describirEstancia` con el muro de entrada, añade la
estancia pegada a la puerta y la marca `abierta` con su `destino`. Una
puerta `interior` (de un muro de dentro de la estancia) no da a otra
estancia: solo se abre, y se encuentra (`puertaEn`) y se abre desde la
casilla de cualquiera de sus dos lados. El banco de pruebas ofrece «Abrir
puerta» a quien esté a un lado de una cerrada. Falla si no
hay puerta, si ya está abierta o si el proveedor rechaza: entonces la puerta
sigue cerrada.

`anadirPersonajes` pone personajes no jugadores en una estancia que ya está
en el mapa (una emboscada, refuerzos…) con el mismo criterio de aparición que
los de `describirEstancia`, y devuelve cómo han quedado. Falla si la estancia
no está o un id se repite.

En el banco de pruebas (`map-debug-imp/modelo/`):

- `PuertasDePrueba` asocia una `PuertaDePrueba` a cada puerta de la estancia
  creada y da los objetos de una casilla (`objetosEn`).
- Los objetos del debug solo dicen qué efecto tienen (`AccionDeObjeto`, con
  `hacer()`): `PuertaDePrueba`, cuyo estado (abierta o no) es el del mapa, da
  `AbrirPuerta` si es una salida cerrada (`puerta.abrir()` →
  `mapa.abrirPuerta(donde)`); `CogerObjeto` quita el objeto de la estancia
  (`mapa.quitarElemento`: en teoría pasa a su inventario) y `RevisarMueble`
  lo marca `revisado` (`mapa.marcarFlag('elemento', …)`).
- `PersonajeDePrueba` (`implements ClaseDePersonaje`) hace **una acción por
  turno** (moverse no cuenta). Compone sus comandos con las acciones de los
  objetos de su casilla, las de revisar cada mueble sin revisar y coger cada
  objeto que tiene al lado. Cada comando, al ejecutarse, comprueba con su
  estado del mapa si aún le queda su acción: si no, lo avisa en un diálogo y
  se cancela; si sí, la hace y resuelve `{ quedanAcciones: false }`.

## Personajes en juego: trabados y apoyos

Las clases no reciben el estado tal cual (`Personaje`, que se guarda como
JSON) sino un `PersonajeEnJuego`: el estado más lo que el gestor sabe de él en
el mapa, calculado al preguntarlo (con el mapa de ese momento):

```ts
type PersonajeEnJuego = Personaje & {
  estaTrabado(): boolean           // en la zona de control (`distanciaControl`) de algún enemigo: trabado en cuerpo a cuerpo
  trabadoPor(): PersonajeEnJuego[] // los enemigos en cuya zona de control está: los que lo traban
  conApoyos(): PersonajeEnJuego[]  // los que están en su zona de control y lo consideran aliado (alianza aliada o la misma)
}
```

Lo reciben `acciones` y `opcionesMovimiento` (el personaje), `atacar` (el
atacante y el objetivo) y la función de `atacarNoJugador`. Para cualquier
otro personaje, `MapaEnJuego` da `personaje(id)` y `personajesEn(estancia)`,
también en juego. Los apoyos son personajes en juego: se puede seguir
preguntando (¿está trabado el que me apoya?). Con `distanciaControl: 0`
nadie está trabado ni tiene apoyos.

El banco de pruebas lo pinta en la consola en cada ataque: si el atacante y
el objetivo están trabados y quiénes los apoyan.

## Ataques: ClaseDePersonaje.atacar

Durante la activación de un personaje, al arrastrar su ficha sobre la de un
enemigo suyo (de una alianza hostil hacia la suya) la vista cambia la flecha
del recorrido por el icono del ataque; al soltarla, el gestor
(`atacar(personaje, objetivo)`) comprueba que puede actuar y que el objetivo
es enemigo, y llama a `atacar` de su clase:

```ts
type Ataque = {
  atacante: PersonajeEnJuego
  objetivo: PersonajeEnJuego
  tipo: 'cuerpo-a-cuerpo' | 'distancia' // en contacto (`cuerpoACuerpo`), sin muro ni esquina en medio; si no, a distancia
  distancia: number                    // casillas según `medicionMovimiento`, en línea recta y sin obstáculos; en contacto, 1
  recorrido?: number                   // lo que costaría llegar moviéndose (rodeando, con el terreno); sin él, no se puede llegar
  trayectoria: {
    casillas: Casilla[]                // las que cruza la línea de centro a centro, sin las de los dos
    aliados: number                    // personajes en ellas que no son enemigos del atacante
    enemigos: number
    coberturas: { ninguna: number; ligera: number; pesada: number; bloqueante: number } // casillas y muros interiores que dan cada cobertura
    objetos: number                    // casillas con objetos o muebles
    muros: number                      // muros que cruza: entre estancias sin puerta abierta, o fuera de ellas
  }
}
```

La trayectoria es la línea recta del centro de la casilla del atacante al de
la del objetivo, con todas las casillas que cruza (si pasa justo por una
esquina, sigue en diagonal sin contar las de los lados). Con ella la clase
puede decidir la línea de visión, la cobertura o los modificadores del
ataque.

- Antes, la clase decide si puede hacer ese ataque con sus datos
  (`motivoParaNoAtacar`: alcance, línea de visión, cobertura bloqueante…):
  devuelve el motivo si no puede, o nada. La vista lo pregunta al pasar la
  ficha arrastrada por encima del enemigo (`gestor.motivoParaNoAtacar`) y,
  si no puede, apaga el icono y muestra el motivo; el gestor lo vuelve a
  preguntar antes de atacar y, con motivo, no ataca y lo devuelve.
- La clase presenta el ataque (un diálogo, dados…) y aplica el resultado con
  `mapa.reducirVida(objetivo, puntos)` y, si se queda sin vida,
  `mapa.eliminarPersonaje(objetivo)`: el gestor no mata a nadie por su
  cuenta. También decide si puede atacar (alcance, línea de visión, si ya ha
  actuado…): para no hacerlo, falla.
- Si resuelve, el gestor apunta «atacar» en el turno del personaje y en el de
  su escuadra, y le pregunta si su activación está completa. Si falla o se
  cancela, no se apunta y el error sigue.
- Si resuelve `{ quedanAcciones: false }`, la activación del atacante termina
  (como la de cualquier personaje tras una acción que resuelve así).

- Los personajes empiezan con la `vida` de su clase (o de su descripción, los
  no jugadores).
- Los personajes no jugadores no tienen clase: quien los maneja ataca con
  `gestor.atacarNoJugador(personaje, objetivo, clase)`, pasando quién lo
  resuelve: un objeto con `motivoParaNoAtacar` y `atacar`, como los de una
  clase. Para preguntar antes, `gestor.motivoParaNoAtacar(personaje,
  objetivo, clase)`. Se
  apunta en su activación y, si resuelve `{ quedanAcciones: false }`, su
  activación termina. El banco de pruebas usa para ellos un
  `PersonajeDePrueba` (`claseDeNoJugador` del proveedor de pruebas).

En el banco de pruebas, `PersonajeDePrueba` ataca hasta su alcance
(`ALCANCE_DE_PRUEBA`: el bárbaro a menos de 2 casillas, el enano hasta 5 y
los demás a 1), nunca si la trayectoria cruza terreno bloqueante y, trabado,
solo a uno de los que lo traban (`trabadoPor`). Empieza
con el cuerpo de su héroe o monstruo como vida y pinta en la consola lo que el gestor dice de
cada ataque (tipo, distancias y trayectoria). Atacar gasta su acción del
turno: si ya no le queda, lo avisa en un diálogo y se cancela. Por ahora, un
monstruo siempre falla contra un héroe (un diálogo: «¡ups, ha fallado!»); en
los demás ataques pide
el daño en un diálogo (`DialogoAtaque`), se lo quita al objetivo y, si se
queda sin vida, lo elimina. Resuelve `{ quedanAcciones: false }`.

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
  tipo: 'normal' | 'carga' | 'destrabarse' | 'posicionarse' // ver `distanciaControl`: según empiece o no trabado y dónde termine
  accion: Accion                  // la que consume moverse así
  tramos: TramoMovimiento[]       // el primero es el movimiento; los siguientes lo alargan
  terminarJuntoAEnemigo?: boolean // carga
  terreno?: { dificil?: number; 'muy-dificil'?: number; impasable?: number } // lo que le cuesta cada terreno; con impasable, lo cruza
  cruzaMuros?: boolean            // cruza por encima los muros interiores (no sus puertas cerradas ni el muro de la estancia)
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
- Para saber cómo puede llegar un personaje a una casilla, el motor tiene
  `planearMovimiento(mapa, configuracion, personaje, destino, opciones)`:
  prueba cada opción por su mejor camino (las normales, rodeando la zona de
  control de los enemigos; las demás, por el más corto, aunque la crucen) y
  devuelve la primera que llega con su recorrido o, si ninguna, el motivo y
  el recorrido intentado. Así, sin estar trabado, se puede `mover` sin pasar
  por la zona de control o `cargar` cruzándola hasta quedar junto a un
  enemigo; trabado, `destrabarse` saliendo de ella o `posicionarse` pegado a
  quien lo traba. El banco de pruebas tiene las cuatro (destrabarse y
  posicionarse, de 6 casillas como mover). La vista
  del banco de pruebas traza con él la flecha del arrastre y «Agrupar aquí»
  busca con él cómo acercar a cada uno; `moverPersonaje` valida el recorrido
  que se le pasa.
- `terreno`: lo que le cuesta a esa forma de moverse entrar en cada tipo de
  terreno, en veces una casilla normal (1, como si no hubiera terreno); lo
  que no diga cuesta lo normal (difícil 2, muy difícil 3, impasable no se
  pisa) y, con un número para `impasable`, lo cruza (y puede terminar en
  él). El motor lo usa al buscar la ruta de esa opción, al ver si puede
  pasar y al calcular lo que cuesta y lo que se apunta. No cambia lo que
  pone el gestor para trazar (personajes, zona de control): ni volando se
  pasa por encima de un enemigo ni se entra en su zona de control.
- `cruzaMuros`: esa forma de moverse cruza los tramos de muro interior como
  si fueran pasos (volando por encima…). Nunca las puertas interiores
  cerradas ni el muro de la estancia, que solo se cruza por una puerta
  abierta. La zona de control, la cobertura y el cuerpo a cuerpo siguen
  viendo el muro. En el banco de pruebas, el bárbaro puede «Volar» 4
  casillas sin que le afecte el terreno y por encima de los muros
  interiores, si aún no se ha movido en el turno.
- La zona de control (`Configuracion.distanciaControl`) y `terminarJuntoAEnemigo`
  miran las casillas de los enemigos del personaje que se mueve (los de
  alianzas hostiles hacia la suya): solo una carga entra en la zona de control
  y, con `terminarJuntoAEnemigo`, solo vale si termina junto a uno. Por
  encima de un enemigo no se pasa.

## Al entrar en cada casilla: ClaseDePersonaje.alEntrar

```ts
alEntrar?(personaje: PersonajeEnJuego, donde: Ubicacion, mapa: MapaEnJuego): Promise<'seguir' | 'detenerse' | 'terminar-turno'>
```

Opcional. Al soltar la ficha de un personaje de escuadra, con el recorrido ya
validado (y confirmado, si desliza) y antes de moverlo, el gestor pregunta a
su clase por cada casilla del recorrido, en orden: `donde` es la estancia y
la casilla en ella. Es el sitio para lo que pasa al pisar una casilla (una
trampa, el área de influencia de un elemento, un terreno peligroso…), igual
que `acciones` lo es para lo que se hace a propósito. La clase puede
delegar en los objetos del proyecto que haya en esa casilla y cambiar el
mapa (`reducirVida`, `marcarFlag`…).

- El personaje aún está donde empezó: `personaje` es su estado al empezar.
- Solo se pregunta por las casillas en que podría quedarse: las de otros
  personajes, por encima de los que pasa, se saltan.
- `seguir`: pregunta por la siguiente; si todas siguen, se mueve hasta el
  final.
- `detenerse`: se mueve solo hasta esa casilla y no pregunta por las demás.
  Se apunta lo que ha recorrido: si se detiene antes del tramo de deslizar,
  no gasta deslizar. Las condiciones del destino (terminar junto a un
  enemigo al cargar…) no se vuelven a comprobar.
- `terminar-turno`: como `detenerse` y, además, ya no le quedan acciones en
  el turno (`TurnoDePersonaje.quedanAcciones: false`): su activación termina
  y, si a ninguno de su escuadra le quedan, la de la escuadra.
- Si mientras tanto deja de estar colocado (la trampa lo mata y se elimina),
  no se mueve ni se apunta nada.
- No se llama al mover personajes no jugadores (`moverPersonajeNoJugador`) ni
  al agrupar la escuadra.

En el banco de pruebas, un héroe (no un monstruo) que entra en una casilla
de una estancia sin `sin_trampas` pisa una trampa con un 30% de
probabilidades (`PROBABILIDAD_DE_TRAMPA`): lo avisa en un diálogo y se
detiene en esa casilla (`detenerse`). Cada llamada a `alEntrar` se ve en la
consola, con lo que responde.

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
      ? [{ id: 'abrir-puerta', nombre: 'Abrir puerta', icono: '🚪', exec: () => mapa.abrirPuerta(donde).then(() => ({ quedanAcciones: false })) }]
      : []
  },
  motivoParaNoAtacar: ({ tipo }) => (tipo === 'cuerpo-a-cuerpo' ? undefined : 'El bárbaro solo ataca cuerpo a cuerpo'),
  atacar: async ({ objetivo }, mapa) => {
    mapa.reducirVida(objetivo.id, 1)
    if ((objetivo.vida ?? 0) <= 1) mapa.eliminarPersonaje(objetivo.id)
    return { quedanAcciones: false }
  },
}

const grupo: ClaseDeEscuadra = {
  id: 'grupo',
  nombre: 'El grupo',
  jugador: 'ana',
  personajes: async () => [barbaro],
  modoActivacion: async () => 'sigiloso',
  activar: async (acciones) => ({ completo: acciones.some((a) => a.accion === 'mover') }),
}

const proveedor: ProveedorMapa = {
  configuracion: {
    ordenActivaciones: 'alternas',
    modosActivacion: 'agresivo-sigiloso',
    medicionMovimiento: 'ortogonal',
    terrenoPersonajes: 'normal',
    distanciaControl: 1,
    cuerpoACuerpo: 'ortogonal',
    jugadores: { alianzas: [{ id: 'heroes', nombre: 'Héroes' }], jugadores: [{ id: 'ana', nombre: 'Ana', tipo: 'humano', alianza: 'heroes' }] },
  },
  confirmar: async (mensaje) => window.confirm(mensaje),
  describirEstancia: async (mapa, entrada) => ({
    tipo: mapa ? 'pasillo' : 'sala',
    tamano: mapa ? { columnas: 2, filas: 7 } : { columnas: 6, filas: 4 },
    orientacion: entrada === 'abajo' ? 'arriba' : 'abajo',
    salidas: 1,
    elementos: [{ tipo: 'objeto', nombre: 'Mesa', columnas: 3, filas: 2 }],
  }),
  estanciaCreada: () => {},
  turnoDe: (jugador) => window.alert(`Le toca a ${jugador.nombre}`),
  finDeTurno: (mapa) => mapa.terminarTurno(),
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
