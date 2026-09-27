# FanQuest · Ayuda de juego

SPA (React + Vite + TypeScript, mobile first) de apoyo para partidas de FanQuest.

## Secciones

- **Generar** (`/generar`): genera una aventura; si convence, se guarda.
- **Aventuras** (`/aventuras`): aventuras guardadas con su estado.
  - `/aventuras/:id`: detalle.
  - `/aventuras/:id/jugar`: utilidades durante la partida.
- **Imprimir** (`/imprimir/:tipo`): fichas de héroes, monstruos y aliados (se
  eligen y se imprimen enteras, dos por fila), losetas y paperminis.

## Créditos y licencia

Ayuda de juego no oficial y sin ánimo de lucro para FetenQuest.

- *FetenQuest 4.1 Legacy* y *FetenQuest, Aventuras Infinitas* © 2026 por
  @SrMiyagi, bajo licencia
  [CC BY-NC-ND 4.0](https://creativecommons.org/licenses/by-nc-nd/4.0/).
  Las reglas, los textos y las cartas (con sus ilustraciones) proceden de
  estas obras. Comunidad: <https://t.me/Fetenquest>.
- *Generador de Aventuras FAI*, autoría original de Ryback.
- HeroQuest es una marca de Hasbro, sin relación con esta app.

La app muestra estos créditos en `/creditos`.

## Plantillas

El contenido editable (tablas, textos y reglas) está en
[`templates/`](templates/README.md).

## Desarrollo

```sh
pnpm install
pnpm dev
pnpm build
pnpm lint
pnpm test        # tests unitarios (Vitest); pnpm test:watch para desarrollo
```

Los tests cargan las plantillas y mazos reales de `templates/`, así que
también detectan cambios en ellos que rompan el generador o la preparación
de misiones.

## Analítica

Matomo (`https://matomo.civeira.net/`) sin cookies y respetando «Do Not
Track». Solo se activa si hay ID de sitio:

- Local: `VITE_MATOMO_SITE_ID` en `.env.local` (sin él no se registra nada).
- GitHub Pages: sitio `2`, fijado en `.github/workflows/deploy-pages.yml`.
- `VITE_MATOMO_URL` permite apuntar a otra instalación.

Se registra cada cambio de página y el evento `Generador` al generar una
misión, con el tipo de misión como nombre.
