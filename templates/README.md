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

## `mazos/`: mazos de cartas

Un directorio por mazo con:

- `base.json`: el mazo base.
- `dorso.webp`: el dorso, común a todas las cartas del mazo.
- `imagenes/`: la ilustración de cabecera de cada carta.

| Mazo | Cartas |
|---|---|
| `atrezo` | 41 |
| `trampas` | 14 |
| `salas-especiales` | 27 |
| `salas` (tablero) | 21 |
| `mazmorra` (losetas) | 32 |
| `pasillo` (tablero) | 12 |

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
