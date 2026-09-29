# Plantillas

Contenido que se combina en la app y que se puede ampliar libremente: textos,
personajes, lugares, objetos… Cada colección es una carpeta de archivos JSON
que la app carga de forma asíncrona y solo cuando la necesita
(`src/lib/plantillas.ts`).

Las reglas del juego (tiradas, tablas, efectos y textos de reglas) no son
plantillas: viven en el código, en `src/features/<sección>/config/`.

## `aventuras/`: generador de aventuras

Basado en el *Generador de Aventuras FAI* (autoría original: Ryback).

| Archivo | Contenido |
|---|---|
| `jefes.json` | Nombres propios por tipo de jefe |
| `personajes.json` | Quien encarga la misión (`mecenas`), PNJ y sus perfiles |
| `lugares.json` | Dónde están los héroes y dónde transcurre la aventura |
| `objetos.json` | Objetos que buscar |
| `especiales.json` | Tipos de misión y sus reglas especiales, estructuradas |
| `titulos.json` | Títulos por tipo de narrativa |
| `introducciones.json` | Introducciones por tipo de narrativa y `relleno` para las cortas |
| `epilogos.json` | Epílogos por tipo de narrativa, `relleno` y `botinPorDefecto` |

Para ampliar basta con añadir elementos a las listas. Las claves de
`jefes.json` son los tipos de jefe de las facciones
(`src/features/generar/config/facciones.ts`); un tipo sin nombres usa
«Señor Oscuro».

### Tipos de narrativa

`titulos.json`, `introducciones.json` y `epilogos.json` necesitan una lista
para cada tipo: `jefe`, `rescate`, `explorador`, `salvavidas`, `aliado` y
`objeto`. Cada tipo de misión indica cuál le corresponde.

### Marcadores de texto

`{faccion}`, `{jefe}`, `{tipoJefe}`, `{lugarHeroes}`, `{lugarAventura}`,
`{mecenas}`, `{pnj}`, `{perfil}`, `{objeto}`, `{botin}` y `{recompensa}`.
Con `|mayus` se pone en mayúscula la primera letra: `{mecenas|mayus}`.

`{pnj}`, `{perfil}` y `{objeto}` solo tienen valor en los tipos de misión
cuyo objetivo los usa (por ejemplo, `rescate` siempre tiene `{pnj}`). Un
marcador sin valor se muestra tal cual, para detectar el error.

### Reglas especiales (`especiales.json`)

Cada entrada de `reglas` es un tipo de misión: `regla` (el número que usa la
tabla de objetivos 2D6), `etiqueta` (el selector del generador),
`narrativa`, `objetivo` (texto con marcadores), `texto` (la regla completa,
tal como se muestra) y `efectos`: la regla estructurada para que las ayudas
de juego la apliquen. Cada efecto tiene un `tipo`:

| `tipo` | Qué describe | Campos |
|---|---|---|
| `cambiar-cartas` | Al preparar la partida, cambia cartas al azar de un mazo | `mazo`, `quitar` (`cantidad`, `excepto`: tipos), `poner` (`tipo` o `id`, `cantidad`) |
| `anadir-cartas` | Cartas para un mazo que la app aún no gestiona (tesoros) | `mazo`, `cantidad`, `carta` |
| `sala` | Qué contiene una sala al descubrirla | `sala`, `texto`, `elementos`, `monstruos`, `sustituirMonstruos`, `siPnjMuerto`, `sinAtrezo`, `sinPuertas`, `tiradaEncuentros` |
| `objeto` | Dónde y cómo se encuentra el objeto | `buscar` (`al`: `revisar`, `buscar-tesoros`, `abrir-cofre` o `buscar-tesoros-o-revisar`), `alEncontrar`, `siNoSeEncuentra` |
| `pnj` | Cuándo aparece el PNJ y en qué estado | `aparece`, `estado`, `al`, `carta`, `mercenario`, `tirada`, `liberar`, `alLiberar` |
| `contador-muerte` | Tirada por la vida del PNJ en cada tirada de peligro | `dado`, `sumaNivelPeligro`, `umbral`, `maximo`, `alCompletar` |
| `jefe` | Modificadores del Jefe Final | `puntosCuerpo` |
| `recompensa` | Recompensa extra o perdida | `extra` o `perdida`, `condicion` |

Las salas son `inicial`, `primera-sala`, `especial` (todas), `primera-especial`,
`especial-a` y `objetivo`. Las cartas se nombran con el `tipo` o el `id` de
`templates/mazos/`: `mesa-del-brujo` para la «Mesa de Hechicero»,
`banco-de-alquimista` para la «Mesa de Alquimista» y
`sala-especial-de-mision-1` para la «Sala Especial A». Un efecto con un `tipo`
desconocido hace fallar la carga de la plantilla.

## `mazos/`: mazos de cartas

Un directorio por mazo con:

- `base.json`: el mazo base.
- `dorso.webp`: el dorso, común a todas las cartas del mazo, salvo mazos de texto.
- `imagenes/`: la ilustración de cabecera de cada carta.

| Mazo | Cartas |
|---|---|
| `atrezo` | 41 |
| `trampas` | 14 |
| `salas-especiales` | 27 |
| `salas` (tablero) | 21 |
| `mazmorra` (losetas) | 32 |
| `pasillo` (tablero) | 12 |
| `tesoros` | 36 |
| `sucesos` | 100 |
| `hechizos` | 92 |

Cada carta tiene:

- `id`: único en el mazo, con el número de la carta en su serie
  (`sin-atrezo-1`, `sin-atrezo-2`…).
- `tipo`: el `id` sin número, para agrupar las variantes de una misma carta
  (mismo texto o función con distinta ilustración).
- `titulo` y `copias` (cuántas hay en la baraja).
- `imagen`: `archivo` y `tamano` (`pequeña`, `mediana` o `grande`), que marca
  la maquetación de la carta. Sin `imagen`, la carta es solo texto.
- `cita`: la frase de ambientación en cursiva.
- `texto`: las reglas; `notas` para lo que va tras una tirada.
- `tirada`: `accion`, `dado` y `resultados` (`resultado` + `texto`, o una
  `tirada` anidada), para que las ayudas de juego puedan resolverla.
- Trampas: `activada.sinMonstruos`, `activada.conMonstruos` y `encontrada`.

`tesoros` y `sucesos` salen de `MazoTesoros_FQL_FAI.pdf` y
`MazoSucesos_FQL_FAI.pdf`: ilustraciones recortadas del recuadro de cada carta
y el dorso de cada mazo. Los tesoros llevan `categoria` (`positiva`, el sol, o
`negativa`, la calavera), `oro` cuando conceden monedas, `equipoId` cuando
conceden una pócima de `equipo/base.json`, `reciclar` en las negativas, que
vuelven al mazo, y `suceso` en «Suceso Inesperado», que roba del Mazo de
Sucesos. Las tiradas de los sucesos pueden tener un `dado` descriptivo («D6
por cada Punto de Mente») que se tira a mano. `hechizos` sale de la sección
Hechizos de `FetenQuest_4_1_Legacy.pdf` y añade `grupo`, `nivel` y `saber` para
clasificar cada carta.

## `equipo/`: armería, pociones, pergaminos y artefactos

`base.json` recoge el equipo de FetenQuest en cuatro listas:

- `equipo`: armería, armas, armaduras y objetos de apoyo con `precio`,
  modificadores simples (`ataque`, `defensa`), `rasgos`, `restricciones`,
  `consumible`, `usos` y reglas textuales.
- `pociones`: pociones comunes e infrecuentes con `rareza`, `precio`,
  `comprable` opcional y `efecto`.
- `pergaminos`: tabla 1D20 de pergaminos mágicos con el hechizo y saber que
  contienen.
- `artefactos`: artefactos conocidos por reglas del manual, como el Brazal
  sanador y los Artefactos del Caos.

`tablas` permite generar pociones comunes, pociones infrecuentes y pergaminos al
azar con los ids de las listas anteriores.

## `heroes/`: fichas de héroes

`base.json` con los 24 héroes de *FetenQuest 4.1 Legacy* (clásicos y extra)
e `imagenes/` con su ilustración del manual. Cada héroe tiene `id`, `nombre`,
`grupo` (`clasico` o `extra`), `malvado` (alineamiento malvado opcional),
`cita`, `descripcion`, `ataque`, `defensa`, `cuerpo`, `mente`, `equipo`,
`limitaciones` e `imagen`.

`printables/` guarda los recortables que genera `pnpm heroes:recortar` a
partir de las hojas `<id>-<hombre|mujer>.png`: `papermini/`, `vtt-face/` y
`vtt-heroe/`, con el mismo nombre de archivo. En la partida, la barra de
héroes usa la ficha de `vtt-face/` del sexo elegido al añadir el héroe, si la
hay, en lugar de la ilustración. Los monstruos hacen lo mismo con
`monstruos/printables/vtt-face/<id>.png`.

`habilidades` son los ids de `habilidades/` con los que empieza; `opcionales`,
las que el manual marca como opcionales, y `eligeUna`, las que se eligen de una
en una (las marcas de los Dioses del Caos).

`movimiento` no es un número sino un perfil de la tabla de las «Nuevas reglas
de movimiento» de Aventuras Infinitas (`pesado`, `tambaleante`, `lento`,
`humanoide`, `agil`, `veloz` o `volador`); los Puntos de Movimiento están en
`src/lib/personajes.ts`.

## `habilidades/`: mazo de habilidades

`base.json` con las habilidades de «Habilidades de héroes» de FetenQuest, una
sola vez cada una aunque la tengan varios héroes (Pequeño, Vigor…). Cada
habilidad tiene `id`, `titulo`, `texto` y, si pide tirar en una tabla,
`tiradas` con la misma forma que la `tirada` de las cartas de `mazos/`.

## `monstruos/`: bestiario

Un archivo por familia (`no-muertos`, `pieles-verdes`, `ogros-y-trolls`,
`forajidos`, `caos`, `demonios`, `skaven`, `bestias` y `elementales`) con los
monstruos del Bestiario de FetenQuest y los que citan las Categorías de
monstruos y las tablas de encuentros de Aventuras Infinitas. Una familia nueva
se añade también a `FAMILIAS_MONSTRUOS` (`src/lib/personajes.ts`); los tests
avisan si falta. Los ids no se pueden repetir entre familias. Cada monstruo
tiene `id`, `nombre`, `nombres` (nombres cortos que la partida reparte al
azar entre las miniaturas iguales para distinguirlas), `categoria` (1 a 8, si
figura en las Categorías), `movimiento`, `ataque`, `defensa`, `cuerpo`, `mente`,
`descripcion`, `reglas` (`nombre` y `texto` opcional) e `imagen` opcional.

- `avanzado`: estadísticas y reglas de «Monstruos avanzados».
- Arqueros y Campeones del Caos se derivan de las reglas del libro (arco o
  ballesta; Guerrero del Caos con la marca de su Dios).
- `estimado`: los monstruos sin estadísticas en ningún libro (Yeti, Lobo
  Gigante…) llevan valores estimados y en qué se basan.

Las tablas de encuentros son reglas: están en
`src/features/aventuras/config/encuentros.ts`. El mazo temático de cada tabla
se construye a partir de ellas.

## `aliados/`: quienes acompañan a los héroes

Un archivo por grupo, cada uno con sus `reglas` comunes y la lista `aliados`:

| Archivo | Contenido |
|---|---|
| `animales.json` | Compañeros animales del Domador de Bestias (FetenQuest) |
| `mercenarios.json` | Mercenarios del Cuartel (FetenQuest) |
| `pnjs.json` | Perfiles de la Tabla de PNJs de Aventuras Infinitas |

Cada aliado tiene `id`, `nombre`, `movimiento`, `ataque`, `defensa`, `cuerpo`,
`mente`, `reglas`, `descripcion` opcional y `coste` (precio en la ciudad).
