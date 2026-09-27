# Guia de desarrollo

## Puesta en marcha

```sh
pnpm install
pnpm dev
```

La app queda disponible en el puerto `5180`.

## Verificacion

```sh
pnpm lint
pnpm test
pnpm build
```

Los tests cargan plantillas reales, por lo que detectan cambios de contenido que
rompan el generador, mazos, personajes o preparacion.

## Convenciones del proyecto

- Mantener la logica de juego en `lib/` y `config/`, no dentro de componentes.
- Mantener las plantillas como datos JSON editables en `templates/`.
- Preferir funciones puras para reglas y transformaciones de estado.
- Hacer loaders/actions en `rutas.ts` cuando una pagina necesite datos o
  mutaciones ligadas a React Router.
- Guardar estado persistente solo a traves de las APIs de `lib/aventuras.ts`.

## Puntos de extension frecuentes

### Anadir un tipo de mision

1. Actualizar `templates/aventuras/especiales.json`.
2. Asegurar que la regla esta cubierta por la tabla de objetivos si debe salir
   aleatoriamente.
3. Anadir textos necesarios en `titulos`, `introducciones` y `epilogos`.
4. Si usa efectos nuevos, ampliar tipos y validacion en el generador y las
   ayudas de partida.
5. Ejecutar `pnpm test`.

### Anadir cartas a un mazo existente

1. Editar `templates/mazos/<mazo>/base.json`.
2. Anadir imagen en `templates/mazos/<mazo>/imagenes/` si procede.
3. Respetar `id`, `tipo` y `copias`.
4. Revisar si las categorias de `src/features/aventuras/config/mazos.ts` deben
   reconocer el nuevo tipo.
5. Ejecutar tests.

### Anadir heroes, monstruos o aliados

1. Editar el JSON de `templates/heroes`, `templates/monstruos` o
   `templates/aliados`.
2. Anadir imagen en la carpeta de la coleccion si procede.
3. Si se crea una familia nueva de monstruos, actualizar `FAMILIAS_MONSTRUOS`.
4. Ejecutar tests de personajes y build.

### Cambiar persistencia

La API de aventuras ya es asincrona. Para migrar a backend o Appwrite:

1. Mantener firmas de `listarAventuras`, `obtenerAventura`, `guardarAventura`,
   `actualizarAventura` y `borrarAventura`.
2. Preservar el modelo `Aventura` o documentar una migracion.
3. Definir estrategia offline, conflictos y autenticacion antes de cambiar UI.

## Riesgos tecnicos actuales

- El estado vive en `localStorage`; no hay copia remota ni exportacion/importacion
  documentada.
- Los ids de plantillas son referencias internas: cambiarlos puede romper
  aventuras guardadas.
- Las reglas especiales mezclan texto visible y efectos estructurados; al tocar
  `especiales.json` hay que verificar generacion, preparacion y partida.
- La PWA cachea assets; cambios de datos deben validarse tambien en build y en
  actualizacion de service worker.
