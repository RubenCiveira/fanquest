# Generar aventura

Port del *Generador de Aventuras FAI* (`ref/Generador_Aventuras_FAI_v3.html`,
autoría original: Ryback).

- `config/`: reglas del juego que no se editan como contenido: facciones y
  sus tiradas, tabla de objetivos 2D6, preparación y reglas extras con sus
  efectos. Los tipos de misión y sus reglas especiales están en
  `templates/aventuras/especiales.json`.
- [`templates/aventuras/`](../../../templates/README.md): textos y elementos
  ampliables que se combinan en cada misión, cargados de forma asíncrona.
- `lib/plantilla.ts`: carga y comprobación de las plantillas.
- `lib/generador.ts`: resuelve una misión a partir de la configuración y la
  plantilla; la misión resultante no depende de ninguna de las dos.
- `lib/reglasExtras.ts`, `lib/narrativa.ts`: tiradas, efectos y textos.
- `components/`: ficha de misión y diálogo de reglas extras.
