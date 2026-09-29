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

- `modelo/`: definiciones del dominio, una por fichero, sin lógica
  (`Casilla`, `Medida`, `Direccion`, `Puerta`, `Elemento`, `Estancia`,
  `DescripcionEstancia`, `Mapa`, `Heroe`, `Escuadra`, `Configuracion`,
  `Activacion`, `Turno`).
- Raíz: operaciones puras sobre el modelo (`estancias.ts`, `orientacion.ts`,
  `elementos.ts`, `construccion.ts`, `activaciones.ts`), cada una con sus
  tests.
- `gestor/`: `GestorMapa`, que guarda el estado del mapa, y los puertos que
  implementa el proyecto. `ProveedorMapa` los reúne todos
  (`ProveedorConfiguracion`, `ProveedorEstancias` y `ProveedorHeroes`): el gestor recibe un solo objeto
  que los cumple.

## Uso

```ts
const proveedor: ProveedorMapa = {
  configuracion: { ordenActivaciones: 'alternas', modosActivacion: 'agresivo-sigiloso' },
  // mapa: el ya construido; en la primera estancia, undefined
  describirEstancia: async (mapa) => ({
    tipo: 'sala',
    tamano: { columnas: 6, filas: 4 },
    orientacion: 'abajo',
    salidas: 2,
    elementos: [{ tipo: 'objeto', nombre: 'Mesa', columnas: 3, filas: 2 }],
  }),
  listarEscuadras: async () => [
    { id: 'grupo', nombre: 'Grupo', heroes: async () => [{ id: 'barbaro', nombre: 'Bárbaro', imagenVtt: url }] },
  ],
}
const gestor = new GestorMapa(proveedor, mapaGuardado)
gestor.suscribir((mapa) => guardar(mapa))
await gestor.nuevaEstancia()
```

## Dominio

- **Estancia**: mapa de `filas` × `columnas` casillas de un tipo (`exterior`,
  `sala` o `pasillo`). Puede contener otras estancias sin salirse ni solaparse
  entre ellas: un jardín (exterior) con las cuatro salas de una casa. Cada
  casilla es de la estancia más interior que la cubre (`estanciaEn`).
- **Casilla**: `{ x, y }`, columna y fila desde 0 en la esquina superior
  izquierda de su estancia.
- **Orientación**: hacia dónde se recorre una estancia. Se entra por el muro
  contrario (una puerta de entrada en su centro) y se sale por el de la
  orientación (las salidas repartidas a lo largo del muro).
- **Elemento**: objeto que ocupa `filas` × `columnas` casillas (más adelante,
  monstruos). Al crear la estancia, el gestor lo pone en el sitio libre más
  cercano al centro, sin tapar puertas ni pisar otros elementos; si no cabe,
  queda en la **zona de espera** (sin `posicion`) para que el jugador lo
  coloque a mano (`GestorMapa.colocarElemento`).
- **Escuadra y héroe**: el proyecto da las escuadras (`ProveedorHeroes`) y
  cada una, sus héroes (`id`, `nombre` e `imagenVtt`). Al crear la estancia
  inicial, el gestor pone una ficha de una casilla por héroe (`FichaHeroe`,
  con el id de su escuadra) como cualquier otro elemento y guarda en el mapa
  el id y el nombre de cada escuadra.
- **Configuración**: la da el proyecto. `ordenActivaciones` dice si héroes y
  enemigos se van turnando (`alternas`) o se activan primero todos los héroes
  (`heroes-primero`); `modosActivacion`, si cada héroe elige modo agresivo o
  sigiloso al activarse o todas las activaciones son normales.
- **Turno y activación**: la activación es de la escuadra y vale para todos
  sus héroes. El mapa guarda el turno en curso y, por escuadra, su activación
  (modo y si ha terminado) y su último modo agresivo o sigiloso de turnos
  anteriores. Una escuadra se activa una vez por turno y no se activa otra
  hasta que termine la que está en curso; el turno solo termina cuando todas
  han completado su activación.
- **Modo de partida**: con modo agresivo o sigiloso, al crear la estancia
  inicial el gestor pregunta a cada escuadra sin modo cuál es el suyo
  (`Escuadra.modoActivacion`).
- **Acciones**: el gestor pregunta a cada escuadra qué acciones tiene
  (`Escuadra.acciones`), pasándole su `EstadoEscuadra`: turno, posición de sus
  héroes, modo y acciones ya hechas en el turno. Añade las suyas: «Cambiar a
  …» (con modo agresivo o sigiloso) y «Terminar turno». La primera acción de
  la escuadra en el turno empieza su activación; «Terminar turno» la termina.
- **Descripción de estancia**: lo que el proyecto devuelve al pedirle una
  estancia nueva: tipo, tamaño, orientación, número de salidas y elementos.
- **Puerta**: va en una arista del muro exterior, no dentro de una casilla:
  la casilla del borde y el `lado` por el que se sale de ella.
