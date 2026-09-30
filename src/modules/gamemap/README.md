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
  **estado** que guarda el gestor (`Mapa`, `Estancia`, `Escuadra`, `Heroe`,
  sus turnos, `Puerta`, `Objeto`…) y las **clases** que implementa el
  proyecto para decir qué puede hacer cada uno (`ClaseDeEscuadra`,
  `ClaseDeHeroe`).
- Raíz: operaciones puras sobre el modelo (`estancias.ts`, `orientacion.ts`,
  `elementos.ts`, `construccion.ts`, `puertas.ts`, `activaciones.ts`,
  `acciones.ts`, `movimiento.ts`), cada una con sus tests.
- `gestor/`: `GestorMapa`, que guarda el estado del mapa, y los puertos que
  implementa el proyecto. `ProveedorMapa` los reúne todos
  (`ProveedorConfiguracion`, `ProveedorConfirmacion`, `ProveedorEstancias` y
  `ProveedorHeroes`): el gestor recibe un solo objeto que los cumple.

## Uso

Ver el ejemplo completo en [PROVEEDORES.md](./PROVEEDORES.md#ejemplo-completo).

```ts
const gestor = new GestorMapa(proveedor, mapaGuardado)
gestor.suscribir((mapa) => guardar(mapa))
await gestor.nuevaEstancia()
```

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
- **Objeto** (elemento): ocupa `filas` × `columnas` casillas de una estancia.
  Al crearla, el gestor lo pone en el sitio libre más cercano al centro, sin
  tapar puertas ni pisar otros; si no cabe, queda en la **zona de espera**
  (sin `posicion`) para colocarlo a mano.
- **Escuadra y héroe** (estado): el gestor guarda cada escuadra con sus
  héroes, su héroe activo, su último modo y sus turnos (activación y
  acciones); y cada héroe con su posición (estancia y casilla; sin casilla, en
  la zona de espera) y sus turnos (acciones y movimientos).
- **Clase de escuadra y de héroe**: las da el proyecto (`ProveedorHeroes`) y
  dicen qué puede hacer cada uno: sus héroes, su modo de partida y cuándo
  termina su activación (`ClaseDeEscuadra`); cómo se mueve y qué acciones
  tiene donde está (`ClaseDeHeroe`).
- **Configuración**: la da el proyecto. `ordenActivaciones` (alternas o todos
  los héroes primero), `modosActivacion` (agresivo o sigiloso, o normal) y
  `medicionMovimiento` (sin diagonales, diagonal como recta o por Pitágoras
  redondeando hacia arriba).
- **Turno y activación**: la activación es de la escuadra y vale para todos
  sus héroes. Una escuadra se activa una vez por turno y no se activa otra
  hasta que termine la que está en curso; el turno solo termina cuando todas
  han completado su activación.
- **Acciones**: al pulsar un héroe, el gestor pregunta a su clase qué puede
  hacer donde está; la clase mira los objetos de su casilla y lo que ya ha
  hecho, y compone sus comandos (acciones con su código en `exec`). El gestor
  añade «Cambiar a …» y «Terminar turno».
- **Movimiento**: al arrastrar una ficha, el gestor pregunta a la clase del
  héroe sus `OpcionesMovimiento` (movimiento base y variaciones, en tramos que
  pueden consumir acciones adicionales). El recorrido vale con la primera
  opción que lo permite, por todo el mapa cruzando puertas abiertas; si
  consume una acción adicional, antes se pide confirmación.
- **Descripción de estancia**: lo que el proyecto devuelve al pedirle una
  estancia nueva: tipo, tamaño, orientación, número de salidas y objetos.
