const trazos = {
  dado: (
    <>
      <path d="M12 2.8 20.6 7.4v9.3L12 21.2 3.4 16.7V7.4Z" />
      <path d="M3.6 7.5 12 12l8.4-4.5M12 12v9" />
      <circle cx="12" cy="7.2" r=".9" />
      <circle cx="7" cy="12.3" r=".9" />
      <circle cx="8.6" cy="16" r=".9" />
      <circle cx="15.4" cy="13.4" r=".9" />
      <circle cx="17.2" cy="16.4" r=".9" />
    </>
  ),
  pergamino: (
    <>
      <path d="M6.5 4.2h11.2c1.3 0 2.2 1 2.2 2.1s-.9 2-2.2 2H16" />
      <path d="M6.5 4.2C5.2 4.2 4.2 5.2 4.2 6.4s1 2 2.3 2h1.6v10.4c0 1.3 1 2.2 2.2 2.2h9.3" />
      <path d="M16 8.3v10.5c0 1.2-.9 2.2-2.1 2.2" />
      <path d="M10.7 11.3h2.9M10.7 14.4h2.9" />
    </>
  ),
  imprimir: (
    <>
      <path d="M5.2 3.6h9.6l4 4v12.8H5.2Z" />
      <path d="M14.8 3.6v4h4" />
      <path d="M8.3 11.2h7.4v6.2H8.3ZM12 11.2v6.2M8.3 14.3h7.4" />
    </>
  ),
  volver: <path d="M14.6 5.4 8.2 12l6.4 6.6" />,
  derecha: <path d="M9.4 5.4 15.8 12l-6.4 6.6" />,
  arriba: <path d="M5.4 14.6 12 8.2l6.6 6.4" />,
  abajo: <path d="M5.4 9.4 12 15.8l6.6-6.4" />,
  cerrar: <path d="M6.4 6.2 17.8 17.6M17.6 6.4 6.2 17.8" />,
  mas: <path d="M12 5.2v13.6M5.2 12h13.6" />,
  menos: <path d="M5.2 12.2h13.6" />,
  aviso: (
    <>
      <path d="M12 3.6 21 19.6H3Z" />
      <path d="M12 9.6v4.6" />
      <circle cx="12" cy="17" r=".9" />
    </>
  ),
  hecho: <path d="M5 12.6 9.8 17.4 19.2 6.8" />,
  info: (
    <>
      <circle cx="12" cy="12" r="8.6" />
      <path d="M12 10.8v5.6" />
      <circle cx="12" cy="7.8" r=".9" />
    </>
  ),
  exportar: (
    <>
      <path d="M12 3.8v11M7.6 10.6 12 15l4.4-4.4" />
      <path d="M4.6 15.4v3.8h14.8v-3.8" />
    </>
  ),
  espada: (
    <>
      <path d="M19.6 4.4v3.8l-9.2 9.2-3.8-3.8 9.2-9.2Z" />
      <path d="M4.8 12.4l6.8 6.8M7 17l-3 3" />
    </>
  ),
  calavera: (
    <>
      <path d="M12 3.6c-4.3 0-7.4 3-7.4 7 0 2.3 1 4 2.6 5.1V19h9.6v-3.3c1.6-1.1 2.6-2.8 2.6-5.1 0-4-3.1-7-7.4-7Z" />
      <circle cx="9.2" cy="11" r="1.6" />
      <circle cx="14.8" cy="11" r="1.6" />
      <path d="M11.2 15.2h1.6M10 19v-2M14 19v-2" />
    </>
  ),
  escudo: <path d="M12 3.4 19 6v5.4c0 4.2-2.9 7.6-7 9.2-4.1-1.6-7-5-7-9.2V6Z" />,
  deshacer: (
    <>
      <path d="M8.6 6.4 4.6 10.4l4 4" />
      <path d="M4.8 10.4h9.4c2.9 0 5.2 2.2 5.2 5s-2.3 5-5.2 5h-2.6" />
    </>
  ),
}

export type NombreIcono = keyof typeof trazos

export function Icono({ nombre }: { nombre: NombreIcono }) {
  return (
    <svg
      className="icono"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {trazos[nombre]}
    </svg>
  )
}
