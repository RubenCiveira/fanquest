import { useState, type ReactNode } from 'react'
import { Icono } from '../../components/Icono'
import { PageHeader } from '../../components/PageHeader'

/** Una ficha imprimible: el naipe pequeño para elegir y la carta entera para imprimir */
export type Ficha = { clave: string; nombre: string; mini: ReactNode; completa: ReactNode }

export type GrupoFichas = { id: string; nombre: string; fichas: Ficha[] }

type Props = {
  titulo: string
  grupos: GrupoFichas[]
}

/** Elegir fichas por grupo e imprimirlas enteras, varias por página */
export function ImprimirFichas({ titulo, grupos }: Props) {
  const todas = grupos.flatMap((g) => g.fichas)
  const [elegidas, setElegidas] = useState(() => new Set(todas.map((f) => f.clave)))

  const cambiar = (claves: string[], incluir: boolean) =>
    setElegidas((antes) => {
      const nuevas = new Set(antes)
      for (const clave of claves) {
        if (incluir) nuevas.add(clave)
        else nuevas.delete(clave)
      }
      return nuevas
    })

  return (
    <>
      <PageHeader title={titulo} backTo="/imprimir" />

      <div className="imprimir-controles no-imprimir">
        <p className="nota">
          {elegidas.size} de {todas.length} fichas. Toca una para quitarla o volver a incluirla.
        </p>
        <button type="button" className="button" disabled={!elegidas.size} onClick={() => window.print()}>
          <Icono nombre="imprimir" />
          Imprimir
        </button>
      </div>

      {grupos.map((grupo) => {
        const claves = grupo.fichas.map((f) => f.clave)
        const completo = claves.every((c) => elegidas.has(c))
        return (
          <section key={grupo.id} className="panel-mazo boceto no-imprimir">
            <header className="panel-cabecera">
              <h2>{grupo.nombre}</h2>
              <button type="button" className="enlace" onClick={() => cambiar(claves, !completo)}>
                {completo ? 'Ninguna' : 'Todas'}
              </button>
            </header>
            <div className="naipes">
              {grupo.fichas.map((ficha) => {
                const elegida = elegidas.has(ficha.clave)
                return (
                  <button
                    key={ficha.clave}
                    type="button"
                    className={elegida ? 'naipe-boton' : 'naipe-boton naipe-apagado'}
                    onClick={() => cambiar([ficha.clave], !elegida)}
                    aria-label={`${elegida ? 'Quitar' : 'Incluir'} ${ficha.nombre}`}
                    aria-pressed={elegida}
                  >
                    {ficha.mini}
                  </button>
                )
              })}
            </div>
          </section>
        )
      })}

      <div className="fichas-impresion solo-imprimir">
        {todas.filter((f) => elegidas.has(f.clave)).map((f) => (
          <div key={f.clave}>{f.completa}</div>
        ))}
      </div>
    </>
  )
}
