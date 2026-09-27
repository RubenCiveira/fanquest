# Datos y plantillas

La app separa contenido editable y reglas de motor.

- Contenido ampliable: `templates/`.
- Reglas, tablas y efectos de juego: `src/features/<feature>/config/`.
- Cargadores y tipos compartidos: `src/lib/`.

## Colecciones de plantillas

| Carpeta | Uso |
|---|---|
| `templates/aventuras/` | Textos y datos del generador de misiones. |
| `templates/mazos/` | Cartas, dorsos e imagenes de mazos. |
| `templates/heroes/` | Fichas base de heroes e imagenes. |
| `templates/habilidades/` | Habilidades de heroes. |
| `templates/monstruos/` | Bestiario por familias. |
| `templates/aliados/` | Animales, mercenarios y PNJ aliados. |

## Generador de aventuras

`src/features/generar/lib/plantilla.ts` carga y valida las partes de
`templates/aventuras/`:

- `especiales.json`
- `jefes.json`
- `personajes.json`
- `lugares.json`
- `objetos.json`
- `titulos.json`
- `introducciones.json`
- `epilogos.json`

Tambien valida que:

- `especiales.json` defina todas las reglas usadas por la tabla de objetivos.
- Los efectos especiales usen tipos conocidos.
- Las narrativas tengan entradas para todos los tipos esperados.

## Reglas especiales estructuradas

Las reglas especiales de `templates/aventuras/especiales.json` tienen texto para
mostrar al usuario y efectos estructurados para automatizar ayudas.

Tipos reconocidos:

| Tipo | Uso |
|---|---|
| `cambiar-cartas` | Sustituye cartas durante la preparacion de mazos. |
| `anadir-cartas` | Describe cartas que se deben anadir a mazos no gestionados. |
| `sala` | Modifica contenido o comportamiento de una sala. |
| `objeto` | Define como se encuentra un objeto de mision. |
| `pnj` | Define aparicion y estado de un PNJ. |
| `contador-muerte` | Gestiona tiradas periodicas por la vida del PNJ. |
| `jefe` | Ajusta el jefe final. |
| `recompensa` | Anade o retira recompensa segun condicion. |

## Mazos

Los mazos se definen en `src/lib/mazos.ts` y viven en `templates/mazos/`.

Mazos existentes:

- `atrezo`
- `trampas`
- `salas-especiales`
- `salas`
- `mazmorra`
- `pasillo`

Cada mazo tiene `base.json`, `dorso.webp` e imagenes en `imagenes/`. Las cartas
incluyen `id`, `tipo`, `titulo`, `copias` y opcionalmente imagen, cita, texto,
notas, tiradas o campos propios de trampas.

## Personajes

`src/lib/personajes.ts` centraliza tipos y carga de:

- Heroes: `cargarHeroes()`.
- Habilidades: `cargarHabilidades()`.
- Bestiario agrupado: `cargarBestiario()`.
- Monstruos por id: `cargarMonstruos()`.
- Aliados: `cargarAliados()`.

El movimiento usa perfiles narrativos convertidos a puntos fijos por
`PERFILES_MOVIMIENTO`.

## Anadir contenido nuevo

Para anadir contenido sin tocar motor:

1. Edita el JSON correspondiente en `templates/`.
2. Usa ids estables y unicos dentro de su coleccion.
3. Si anades imagenes, referencialas con rutas relativas esperadas por el
   cargador.
4. Ejecuta tests, porque varias pruebas cargan plantillas reales.

Para anadir familias de monstruos o mazos nuevos no basta con crear JSON:

- Familias: actualizar `FAMILIAS_MONSTRUOS` en `src/lib/personajes.ts`.
- Mazos: actualizar `MAZOS` en `src/lib/mazos.ts` y las configuraciones que los
  usen.
