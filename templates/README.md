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
