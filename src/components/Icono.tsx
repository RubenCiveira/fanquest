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
