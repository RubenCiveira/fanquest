# Flujos internos

## Edicion de una mision

Archivos principales:

- `src/features/aventuras/EditarAventuraPage.tsx`
- `src/features/aventuras/lib/editarMision.ts`
- `src/features/aventuras/components/ExportarAventura.tsx` e `ImportarDialog.tsx`

Flujo:

1. El loader `cargarEditor` carga la plantilla de aventuras (tipos de mision)
   y, al editar, la aventura guardada.
2. Una mision nueva parte de `misionVacia()`: la preparacion estandar y la
   primera faccion.
3. `aplicarTipo()` pone la regla especial, sus efectos y el objetivo del tipo
   de mision; `aplicarFaccion()`, los errantes y un tipo de jefe de la faccion.
4. `exportarMision()` e `importarMision()` pasan la mision a JSON y de vuelta;
   lo que falte al importar toma el valor de una mision vacia.
5. Guardar crea la aventura (`guardarAventura`) o actualiza la mision
   (`actualizarAventura`).

## Generacion de una mision (sin ruta por ahora)

Archivos principales:

- `src/features/generar/GenerarPage.tsx`
- `src/features/generar/lib/generador.ts`
- `src/features/generar/lib/plantilla.ts`
- `src/features/generar/config/*`
- `templates/aventuras/*`

Flujo:

1. El loader de `/generar` (hoy sin ruta) llama a `cargarPlantillaAventuras()`.
2. La pagina mantiene en estado la seleccion de regla, configuracion de reglas
   extras y mision actual.
3. `generarMision()` escoge faccion, tipo de jefe, tipo de mision, lugares,
   personajes, objeto, recompensa y reglas extras.
4. `redactar` y `redactarLargo` interpolan marcadores de texto.
5. La mision resultante es autonoma: conserva textos y valores finales, no
   depende de volver a cargar la plantilla para jugarse.
6. `guardarAventura()` persiste la mision como aventura `sin-empezar`.

## Preparacion de aventura

Archivos principales:

- `src/features/aventuras/rutas.ts`
- `src/features/aventuras/lib/preparacion.ts`
- `src/features/aventuras/lib/asistente.ts`
- `src/features/aventuras/config/mazos.ts`

Flujo:

1. La accion de `/aventuras/:id` con `intent=empezar` crea una configuracion si
   no existe.
2. `nuevaConfiguracion()` prepara mazos para modo `losetas` y `tablero`, usando
   la mision y los mazos base.
3. El asistente recorre los pasos `reglas`, `heroes`, `mazos`, `monstruos` y
   `barajar`.
4. `completar()` rellena cada mazo segun las categorias requeridas y aplica
   reglas especiales de cambio de cartas.
5. `barajarYGuardar()` fija el orden final de los mazos usados por el modo de
   juego.
6. `estadoAventura()` deriva el estado visible segun configuracion y partida.

## Partida

Archivos principales:

- `src/features/aventuras/JugarPage.tsx`
- `src/features/aventuras/lib/partida.ts`
- `src/features/aventuras/lib/usePartida.ts`
- `src/features/aventuras/config/partida.ts`
- `src/features/aventuras/config/encuentros.ts`

Flujo:

1. El loader de `/aventuras/:id/jugar` exige que exista configuracion barajada.
2. Carga mazos, heroes, habilidades, monstruos y aliados.
3. Construye el `Contexto` de partida con modo, mision, numero de heroes y
   seleccion de monstruos.
4. Si la partida no existe, `nuevaPartida()` inicializa peligro, mazos,
   caminos, vidas, zona inicial y contadores.
5. Las acciones de partida mutan una copia del estado y se guardan en la
   aventura.
6. La exploracion se modela con zonas, pendientes y sucesos ya resueltos.

Conceptos clave:

- `Partida`: estado persistido de una sesion.
- `Zona`: sala, pasillo, especial, objetivo, secreta o inicial.
- `Paso`: accion pendiente de resolver en la zona.
- `Suceso`: resultado ya anotado, como carta robada, encuentro o tirada.

## Impresion

Archivos principales:

- `src/features/imprimir/ImprimirPage.tsx`
- `src/features/imprimir/FichasPages.tsx`
- `src/features/imprimir/ImprimirFichas.tsx`
- `src/components/CartaHeroe.tsx`
- `src/components/CartaMonstruo.tsx`
- `src/components/CartaAliado.tsx`

Flujo:

1. El usuario entra en `/imprimir`.
2. Escoge heroes, monstruos o aliados.
3. El loader carga las plantillas necesarias.
4. La pagina agrupa fichas y permite seleccionar miniaturas/fichas completas.
5. Los componentes de carta renderizan la version imprimible.

## Errores esperados

- Si una plantilla no existe o tiene forma invalida, el loader lanza error.
- `GenerarError` muestra el fallo de plantillas del generador si se vuelve a dar ruta a `/generar`.
- Las rutas de aventura redirigen a `/aventuras` si el id no existe.
- Si no hay `localStorage`, guardar aventura puede fallar y se avisa al usuario.
