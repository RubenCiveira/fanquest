import { useState, type ReactNode } from 'react'
import { Icono } from '../../../components/Icono'
import { NaipeDialog } from '../../../components/NaipeDialog'

/** Personaje en la barra: retrato, Puntos de Cuerpo y su carta entera */
export type Ficha = {
  clave: string
  nombre: string
  retrato?: string
  pc: number
  cuerpo: number
  /** Para distinguir miniaturas iguales, p. ej. su número */
  marca?: string
  carta: ReactNode
}

type Props = {
  etiqueta: string
  fichas: Ficha[]
  onVida: (clave: string, delta: 1 | -1) => void
  /** Aviso bajo el contador, p. ej. que a 0 PC el monstruo muere */
  nota?: string
  className?: string
}

const iniciales = (texto: string) =>
  texto
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')

/** Héroes o monstruos a mano: su ficha y su contador de Puntos de Cuerpo */
export function BarraFichas({ etiqueta, fichas, onVida, nota, className = '' }: Props) {
  const [abierta, setAbierta] = useState<string | null>(null)
  const ficha = fichas.find((f) => f.clave === abierta)

  return (
    <aside className={`partida-fichas ${className}`} aria-label={etiqueta}>
      {fichas.map((f) => (
        <button
          key={f.clave}
          type="button"
          className={f.pc ? 'miembro' : 'miembro caido'}
          onClick={() => setAbierta(f.clave)}
          aria-label={`${f.nombre}: ${f.pc} de ${f.cuerpo} PC`}
        >
          {f.retrato ? <img src={f.retrato} alt="" /> : <span className="miembro-iniciales">{iniciales(f.nombre)}</span>}
          {f.marca && <span className="miembro-marca">{f.marca}</span>}
          <span className="miembro-vida">
            {f.pc}/{f.cuerpo}
          </span>
        </button>
      ))}

      {ficha && (
        <NaipeDialog
          etiqueta={ficha.nombre}
          onCerrar={() => setAbierta(null)}
          acciones={
            <>
              <div className="fila-copias">
                <button
                  type="button"
                  className="icon-button"
                  aria-label="Perder 1 PC"
                  disabled={!ficha.pc}
                  onClick={() => onVida(ficha.clave, -1)}
                >
                  <Icono nombre="menos" />
                </button>
                <span>
                  {ficha.pc} / {ficha.cuerpo} PC
                </span>
                <button
                  type="button"
                  className="icon-button"
                  aria-label="Recuperar 1 PC"
                  disabled={ficha.pc >= ficha.cuerpo}
                  onClick={() => onVida(ficha.clave, 1)}
                >
                  <Icono nombre="mas" />
                </button>
              </div>
              {nota && <p className="nota">{nota}</p>}
            </>
          }
        >
          {ficha.carta}
        </NaipeDialog>
      )}
    </aside>
  )
}
