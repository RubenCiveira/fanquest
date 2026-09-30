# Pendientes

## Validar jugadores de personajes no jugadores

Los `personajesNoJugadores` se pueden crear con un `jugador` inexistente.
La estancia inicial valida el reparto antes de añadir los PNJ de
`descripcion.personajesNoJugadores`, y `anadirPersonajes` tampoco valida cada
descripción antes de cambiar el mapa.

Esto puede dejar PNJ huérfanos que nunca serán enemigos y bloquear después
`cambiarJugadores` por un estado inválido. Conviene validar el reparto después
de incorporar los PNJ, o validar cada descripción antes de cambiar el mapa.

## Colocar PNJ desde la zona de espera

Los PNJ que no encuentran casilla quedan en la zona de espera, pero el gestor y
el mock de debug no ofrecen una forma de colocarlos después.

`GestorMapa.colocarPersonaje` solo actualiza personajes de escuadras, y
`map-debug-imp/MapaPage.tsx` solo lista en espera objetos y personajes de
escuadra. Hay que permitir colocar `personajesNoJugadores` en espera o ajustar
el comportamiento/documentación para que no queden inaccesibles.
