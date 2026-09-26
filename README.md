# FanQuest · Ayuda de juego

SPA (React + Vite + TypeScript, mobile first) de apoyo para partidas de FanQuest.

## Secciones

- **Generar** (`/generar`): genera una aventura; si convence, se guarda.
- **Aventuras** (`/aventuras`): aventuras guardadas con su estado.
  - `/aventuras/:id`: detalle.
  - `/aventuras/:id/jugar`: utilidades durante la partida.
- **Imprimir** (`/imprimir/:tipo`): losetas, fichas de monstruos, paperminis.

## Plantillas

El contenido editable (tablas, textos y reglas) está en
[`templates/`](templates/README.md).

## Desarrollo

```sh
pnpm install
pnpm dev
pnpm build
pnpm lint
```
