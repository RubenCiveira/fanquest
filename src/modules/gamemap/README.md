# gamemap

Motor de mapas reutilizable: reglas de mapa y combate agnósticas del juego.
El proyecto que lo usa decide la configuración del mapa, las unidades y lo que
pueden hacer sobre él (como en `../map-debug-imp`, la implementación de
FetenQuest).

Para poder copiarlo a otro proyecto:

- No importa nada de fuera de este directorio.
- Solo TypeScript puro, sin React ni dependencias.
- Todo lo público sale por `index.ts`.

La investigación de partida está en `ref/Detalles sobre mapas.md`. Cómo
implementar los proveedores que necesita el gestor: [PROVEEDORES.md](./PROVEEDORES.md).

## Estructura

- `modelo/`: definiciones del dominio, una por fichero, sin lógica. El
  **estado** que guarda el gestor (`Mapa`, `Estancia`, `Escuadra`, `Personaje`,
  sus turnos, `Puerta`, `Objeto`…) y las **clases** que implementa el
  proyecto para decir qué puede hacer cada uno (`ClaseDeEscuadra`,
  `ClaseDePersonaje`).
- Raíz: operaciones puras sobre el modelo (`estancias.ts`, `orientacion.ts`,
  `elementos.ts`, `construccion.ts`, `puertas.ts`, `activaciones.ts`,
  `acciones.ts`, `movimiento.ts`, `terrenos.ts`, `apariciones.ts`,
  `jugadores.ts`, `agrupar.ts`, `ataques.ts`, `zonaDeControl.ts`), cada una con sus tests.
- `gestor/`: `GestorMapa`, que guarda el estado del mapa, y los puertos que
  implementa el proyecto. `ProveedorMapa` los reúne todos
  (`ProveedorConfiguracion`, `ProveedorConfirmacion`, `ProveedorEstancias`,
  `ProveedorPersonajes` y `ProveedorTurnos`): el gestor recibe un solo objeto que los cumple.

## Uso

Ver el ejemplo completo en [PROVEEDORES.md](./PROVEEDORES.md#ejemplo-completo).

```ts
const gestor = new GestorMapa(proveedor, mapaGuardado)
gestor.suscribir((mapa) => guardar(mapa))
await gestor.nuevaEstancia()
```

El gestor admite un tercer argumento, `azar` (una función que da números
entre 0 y 1, `Math.random` por defecto), con el que reparte los personajes
que aparecen sin casilla: en los tests se fija para que salgan siempre en el
mismo sitio.

## Dominio

- **Estancia**: mapa de `filas` × `columnas` casillas de un tipo (`exterior`,
  `sala` o `pasillo`). Puede contener otras estancias sin salirse ni solaparse
  entre ellas: un jardín (exterior) con las cuatro salas de una casa. Cada
  casilla es de la estancia más interior que la cubre (`estanciaEn`). En el
  mapa, cada estancia tiene su sitio en casillas comunes (`posicion`).
- **Casilla**: `{ x, y }`, columna y fila desde 0 en la esquina superior
  izquierda de su estancia.
- **Orientación**: hacia dónde se recorre una estancia: se sale por ese muro
  (las salidas repartidas a lo largo de él) y se entra por el contrario o, si
  se abre desde una puerta, por el muro que encaja con ella.
- **Puerta**: va en una arista del muro exterior, no dentro de una casilla:
  la casilla del borde y el `lado` por el que se sale de ella. Al abrirla, la
  estancia de detrás se pega a ella y las dos quedan abiertas.
- **Terreno**: zona de una estancia difícil (entrar en cada casilla cuesta
  dos), muy difícil (tres) o impasable, con o sin imagen que la cubra. La
  ruta de un personaje lo tiene en cuenta y lo rodea si sale más barato.
  Además, da a los disparos que lo cruzan una cobertura: ninguna, ligera,
  pesada o bloqueante.
- **Objeto** (elemento): ocupa `filas` × `columnas` casillas de una estancia.
  Al crearla, el gestor lo pone en el sitio libre más cercano al centro, sin
  tapar puertas ni pisar otros; si no cabe, queda en la **zona de espera**
  (sin `posicion`) para colocarlo a mano. Un personaje puede cogerlo: sale de
  la estancia (`quitarElemento`).
- **Mueble** (elemento): fijo, con id del proyecto, imagen opcional y marcas
  de estado (`flags`, como `revisado`). El gestor lo pone al azar donde quepa
  y no se mueve a mano.
- **Marcas de estancia** (`flags`): estado que cambia en la partida, como
  `sin_trampas` tras «Buscar trampas».
- **Escuadra y personaje** (estado): el gestor guarda cada escuadra con sus
  personajes, su personaje activo, su último modo y sus turnos (activación y
  acciones); y cada personaje con su posición (estancia y casilla; sin casilla, en
  la zona de espera) y sus turnos (acciones y movimientos).
- **Jugador y alianza**: cada escuadra y cada personaje no jugador es de un
  jugador (humano o IA) y cada jugador, de una alianza. La postura de una
  alianza hacia otra (aliada, neutral u hostil) dice si sus personajes son
  enemigos de los de la otra. El reparto viene de la configuración, se guarda
  en el mapa y puede cambiar en mitad de la partida (`cambiarJugadores`).
- **Personaje no jugador**: un personaje (id, nombre e imagen, estancia y
  casilla) que no está en ninguna escuadra, de un jugador (enemigos,
  acólitos…). Aparece al crear una estancia o con `anadirPersonajes`: en su
  casilla o al azar en su zona o en la estancia, nunca en terreno impasable ni
  encima de nada.
- **Enemigo**: personaje de una alianza hostil hacia la del que se mueve. Su
  casilla es impasable y cuenta para alejarse o cargar.
- **Personaje en juego**: lo que reciben las clases del proyecto: el estado
  del personaje con `estaTrabado()` (en la zona de control de un enemigo),
  `trabadoPor()` (esos enemigos) y `conApoyos()` (los aliados en su zona de
  control), calculados al
  preguntarlos. `MapaEnJuego` da cualquier otro (`personaje`, `personajesEn`).
- **Clase de escuadra y de personaje**: las da el proyecto (`ProveedorPersonajes`) y
  dicen qué puede hacer cada uno: sus personajes, su modo de partida y cuándo
  termina su activación (`ClaseDeEscuadra`); cómo se mueve y qué acciones
  tiene donde está (`ClaseDePersonaje`).
- **Configuración**: la da el proyecto. `jugadores` (el reparto inicial),
  `ordenActivaciones` (alternas entre alianzas o alianza a alianza), `modosActivacion` (agresivo o sigiloso, o normal) y
  `medicionMovimiento` (sin diagonales, diagonal como recta o por Pitágoras
  redondeando hacia arriba), `terrenoPersonajes` (cómo cuenta la casilla de
  otro personaje: normal, difícil, muy difícil o impasable) y
  `distanciaControl` (casillas alrededor de un personaje que controla: salvo
  cargando, nadie entra en la zona de control de un enemigo).
- **Turno y activación**: la activación es de la escuadra y en ella pueden
  actuar todos sus personajes. Una escuadra se activa una vez por turno y no
  se activa otra hasta que termine la que está en curso; solo se activan las
  del jugador al que le toca (`jugadorEnTurno`), que rota entre alianzas y
  entre los jugadores de cada una según `ordenActivaciones`. Un jugador con
  personajes no jugadores también ocupa su activación del turno; por ahora el
  banco de pruebas permite moverlos a mano y terminar su activación. Al
  terminar cada activación, el gestor avisa al proveedor de a quién le toca
  (`turnoDe`) o, si ya nadie tiene nada pendiente, de que el turno puede
  terminar (`finDeTurno`). El turno solo termina cuando todas han completado
  su activación.
- **Acciones**: al pulsar un personaje, el gestor pregunta a su clase qué puede
  hacer donde está; la clase mira los objetos de su casilla y lo que ya ha
  hecho, y compone sus comandos (acciones con su código en `exec`). El gestor
  añade «Buscar trampas», «Agrupar aquí» (con más personajes en la escuadra:
  los demás se acercan a su alrededor con el movimiento que les queda),
  «Cambiar a …» y «Terminar turno».
- **Movimiento**: al arrastrar una ficha, el gestor pregunta a la clase del
  personaje sus `OpcionesMovimiento` (movimiento base y variaciones, en tramos que
  pueden consumir acciones adicionales). El recorrido vale con la primera
  opción que lo permite, por todo el mapa cruzando puertas abiertas; si
  consume una acción adicional, antes se pide confirmación. El motor planea
  el camino hasta una casilla (`planearMovimiento`): moviéndose, rodeando la
  zona de control de los enemigos; cargando, cruzándola hasta quedar junto a
  uno. Trabado en ella no puede moverse ni cargar: solo destrabarse, saliendo
  de ella, o posicionarse, pegado a quien lo traba.
- **Ataque**: al arrastrar una ficha sobre la de un enemigo, el gestor pide a
  la clase del personaje que ataque (`atacar`), con el tipo (cuerpo a cuerpo o
  a distancia), la distancia según la medición del movimiento, lo que costaría
  llegar moviéndose y la trayectoria: las casillas que cruza la línea del
  ataque, con los aliados, enemigos, coberturas, objetos y muros que hay en
  ella. La clase decide y aplica el daño sobre la
  `vida` del objetivo (`reducirVida`) y lo elimina si hace falta
  (`eliminarPersonaje`).
- **Resultado de una acción**: los comandos (`exec`) y los ataques resuelven
  con el estado del personaje tras la acción, `{ quedanAcciones }`, que el
  gestor guarda en su turno. Sin acciones, su activación termina (no puede
  actuar ni moverse más en el turno) y, cuando ninguno de su escuadra tiene,
  la de la escuadra.
- **Descripción de estancia**: lo que el proyecto devuelve al pedirle una
  estancia nueva: tipo, tamaño, orientación, número de salidas y objetos.
