# Vision funcional

Esta app es una SPA mobile first de ayuda para partidas de FetenQuest. Reúne un
editor de aventuras, gestion de aventuras guardadas, asistente de partida e
impresion de fichas. El generador automatico se conserva en el codigo pero no
esta visible.

## Usuarios objetivo

- Jugadores o directores que quieren escribir o compartir una mision de
  Aventuras Infinitas.
- Grupos que quieren preparar los mazos y jugar con ayuda guiada.
- Usuarios que quieren imprimir fichas de heroes, monstruos y aliados.

## Secciones de la aplicacion

| Ruta | Seccion | Funcion |
|---|---|---|
| `/aventuras/nueva` | Nueva aventura | Formulario para escribir la mision a mano; importar, exportar o copiar su JSON, imprimirla, copiarla como texto y guardarla. |
| `/aventuras` | Aventuras | Lista aventuras guardadas en el navegador. |
| `/aventuras/:id/editar` | Editar aventura | El mismo formulario con una aventura guardada. |
| `/aventuras/:id` | Detalle | Muestra la mision guardada y permite empezar, continuar o borrar. |
| `/aventuras/:id/configurar` | Preparacion | Asistente por pasos para reglas, grupo, mazos, monstruos y barajado. |
| `/aventuras/:id/configurar/:mazo` | Seleccion de mazo | Edicion detallada de un mazo durante la preparacion. |
| `/aventuras/:id/jugar` | Partida | Asistente de exploracion y gestion de sucesos de la partida. |
| `/imprimir` | Imprimir | Menu de imprimibles. |
| `/imprimir/heroes` | Fichas de heroes | Seleccion e impresion de fichas completas. |
| `/imprimir/monstruos` | Fichas de monstruos | Seleccion e impresion de fichas normales y avanzadas. |
| `/imprimir/aliados` | Fichas de aliados | Seleccion e impresion de aliados por grupo. |
| `/creditos` | Creditos | Licencias, autores y origen del material. |

## Flujo funcional principal

1. El usuario entra en `/aventuras/nueva` (o importa el JSON de una aventura
   compartida).
2. Escribe titulo, introduccion, preparacion, faccion y jefe, objetivo,
   reglas extras y epilogo. El tipo de mision pone la regla especial (texto
   editable) y los efectos que la partida aplica.
3. Puede imprimir la ficha, copiarla como texto o exportarla como JSON.
5. Al guardar, la mision se convierte en una aventura persistida en
   `localStorage`.
6. Desde `/aventuras/:id`, se empieza la preparacion.
7. El asistente configura reglas opcionales, heroes, aliados, modo de juego,
   mazos y monstruos.
8. Al barajar, se guarda un orden final de cartas.
9. En `/aventuras/:id/jugar`, la app crea o recupera la partida y guia la
   exploracion.

## Estados de una aventura

Los estados estan definidos en `src/features/aventuras/lib/aventuras.ts`:

| Estado | Significado |
|---|---|
| `sin-empezar` | La mision se ha guardado pero no se ha configurado. |
| `configurando` | La aventura esta en el asistente de preparacion. |
| `mazo-barajado` | Los mazos estan preparados y con orden final guardado. |
| `en-juego` | Existe una partida iniciada. |
| `terminada` | La partida tiene resultado final. |

## Alcance actual

- La app funciona sin backend: plantillas empaquetadas, estado local y PWA.
- No hay autenticacion ni sincronizacion multi-dispositivo.
- La persistencia depende del navegador y puede perderse si el usuario borra
  datos del sitio.
