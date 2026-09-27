# Arquitectura tecnica

## Stack

- React 19 con TypeScript.
- Vite como bundler y servidor de desarrollo.
- React Router para rutas, loaders y actions.
- Vitest para tests unitarios.
- Oxlint para linting.
- `vite-plugin-pwa` para manifest y service worker.
- Matomo opcional para analitica sin cookies.

## Comandos

```sh
pnpm install
pnpm dev
pnpm build
pnpm lint
pnpm test
pnpm test:watch
```

El servidor de desarrollo usa el puerto fijo `5180`, configurado en
`vite.config.ts`.

## Estructura principal

```text
src/
  app/                 Layout, router y aviso de actualizacion
  components/          Componentes reutilizables de cartas, dialogos e iconos
  features/
    aventuras/         Aventuras guardadas, preparacion y partida
    creditos/          Pagina de creditos
    generar/           Generador de misiones
    imprimir/          Fichas imprimibles
  lib/                 Utilidades compartidas: dados, plantillas, mazos,
                       personajes, texto y Matomo
public/                Iconos PWA y assets publicos
```

## Entrada de la app

- `src/main.tsx` inicializa Matomo y monta `RouterProvider`.
- `src/app/router.tsx` define las rutas y sus loaders/actions.
- `src/app/AppLayout.tsx` renderiza cabecera, navegacion inferior y `Outlet`.

## Rutas y loaders

La app usa loaders para cargar datos antes de renderizar:

- `/generar` carga `cargarPlantillaAventuras()`.
- `/aventuras` carga `listarAventuras()`.
- `/aventuras/:id` carga una aventura o redirige.
- `/aventuras/:id/configurar` carga aventura, mazos, heroes, habilidades,
  monstruos, bestiario y aliados.
- `/aventuras/:id/jugar` carga lo anterior, crea la partida si no existe y la
  persiste.
- `/imprimir/*` carga datos de personajes segun el tipo de ficha.

Las acciones de aventura estan en `src/features/aventuras/rutas.ts`: empezar una
aventura crea la configuracion inicial y borrar elimina el registro local.

## Persistencia

La persistencia actual esta encapsulada en
`src/features/aventuras/lib/aventuras.ts`.

- Clave de almacenamiento: `fanquest.aventuras.v1`.
- Medio: `localStorage`.
- API publica asincrona: `listarAventuras`, `obtenerAventura`,
  `guardarAventura`, `actualizarAventura` y `borrarAventura`.

La API es asincrona aunque use `localStorage`, lo que facilita cambiar a una
fuente remota sin tocar la UI.

## Carga de plantillas

`src/lib/plantillas.ts` define `FuentePlantillas`:

- `leer(coleccion, archivo)` carga JSON desde `templates/`.
- `url(coleccion, ruta)` resuelve imagenes `.webp`.

La fuente local usa `import.meta.glob`, por lo que los JSON se descargan por
chunks y las imagenes se publican como assets.

`cachePorFuente` cachea resultados por fuente con `WeakMap` y borra la entrada
si la carga falla.

## PWA y despliegue

`vite.config.ts` configura:

- Manifest PWA con nombre, iconos, colores y modo standalone.
- Service worker con `registerType: 'prompt'` para avisar de nuevas versiones.
- Precarga de `js`, `css`, `html`, `svg`, `png` y `woff2`.
- `base` controlado por `BASE_PATH`, usado en GitHub Pages.

El workflow `.github/workflows/deploy-pages.yml`:

1. Instala pnpm y Node 22.
2. Ejecuta tests.
3. Construye con `BASE_PATH` y `VITE_MATOMO_SITE_ID=2`.
4. Copia `dist/index.html` a `dist/404.html` para soportar recargas de la SPA.
5. Publica `dist/` en `gh-pages`.

## Analitica

`src/lib/matomo.ts` carga Matomo solo si existe `VITE_MATOMO_SITE_ID`.

- Desactiva cookies.
- Respeta Do Not Track.
- Registra page views en cada cambio de ruta.
- Registra eventos de generacion, guardado, borrado e inicio de partida.
