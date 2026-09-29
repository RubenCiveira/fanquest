import { useState } from 'react'
import { Icono } from '../../../components/Icono'
import { NaipeDialog } from '../../../components/NaipeDialog'
import type { Ficha, PanelFicha } from './BarraFichas'

type Props = {
  ficha: Ficha
  onVida: (clave: string, delta: 1 | -1) => void
  /** Aviso bajo el contador, p. ej. que a 0 PC el monstruo muere */
  nota?: string
  /** «Atacar» cierra la ficha y el enemigo se elige en el diálogo de combate */
  onAtacar: (clave: string) => void
  onCerrar: () => void
}

/** La carta entera de un personaje, con sus Puntos de Cuerpo y sus acciones */
export function FichaDialog({ ficha, onVida, nota, onAtacar, onCerrar }: Props) {
  const [pestana, setPestana] = useState<'ficha' | 'inventario' | 'hechizos'>('ficha')
  const [panel, setPanel] = useState<PanelFicha | null>(null)

  return (
    <NaipeDialog
      etiqueta={ficha.nombre}
      onCerrar={onCerrar}
      acciones={
        <div className="ficha-dialog-acciones">
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
          {ficha.resumen}
          {nota && <p className="nota">{nota}</p>}
          {ficha.acciones ?? (ficha.pc > 0 && (
            <button
              type="button"
              className="button"
              onClick={() => {
                onCerrar()
                onAtacar(ficha.clave)
              }}
            >
              <Icono nombre="espada" />
              Atacar
            </button>
          ))}
        </div>
      }
    >
      {ficha.panelesIzquierda?.length || ficha.panelesDerecha?.length ? (
        <div className="ficha-popup-marco">
          {ficha.panelesIzquierda?.length ? (
            <div className="ficha-pestanas ficha-pestanas-izquierda" aria-label="Objetos del inventario">
              {ficha.panelesIzquierda.map((p) => (
                <button key={p.id} type="button" className={`${panel?.id === p.id ? 'activo' : ''} ${p.tipo ?? ''}`} onClick={() => setPanel(p)} title={p.titulo}>
                  {p.label}
                </button>
              ))}
            </div>
          ) : null}
          <div className="ficha-popup-centro">{ficha.carta}</div>
          {ficha.panelesDerecha?.length ? (
            <div className="ficha-pestanas ficha-pestanas-derecha" aria-label="Habilidades y hechizos">
              {ficha.panelesDerecha.map((p) => (
                <button key={p.id} type="button" className={`${panel?.id === p.id ? 'activo' : ''} ${p.tipo ?? ''}`} onClick={() => setPanel(p)} title={p.titulo}>
                  {p.label}
                </button>
              ))}
            </div>
          ) : null}
          {panel && (
            <div className="ficha-panel-popover" role="dialog" aria-label={panel.titulo}>
              <header>
                <h3>{panel.titulo}</h3>
                <button type="button" className="icon-button" onClick={() => setPanel(null)} aria-label="Cerrar">
                  <Icono nombre="cerrar" />
                </button>
              </header>
              {panel.children}
            </div>
          )}
        </div>
      ) : ficha.inventario || ficha.hechizos ? (
        <>
          <div className="naipes-tabs" role="tablist" aria-label={`Contenido de ${ficha.nombre}`}>
            <button type="button" role="tab" aria-selected={pestana === 'ficha'} className={pestana === 'ficha' ? 'activo' : undefined} onClick={() => setPestana('ficha')}>
              Ficha
            </button>
            {ficha.inventario && (
              <button type="button" role="tab" aria-selected={pestana === 'inventario'} className={pestana === 'inventario' ? 'activo' : undefined} onClick={() => setPestana('inventario')}>
                Inventario
              </button>
            )}
            {ficha.hechizos && (
              <button type="button" role="tab" aria-selected={pestana === 'hechizos'} className={pestana === 'hechizos' ? 'activo' : undefined} onClick={() => setPestana('hechizos')}>
                Hechizos
              </button>
            )}
          </div>
          {pestana === 'ficha' ? ficha.carta : pestana === 'inventario' ? ficha.inventario : ficha.hechizos}
        </>
      ) : (
        ficha.carta
      )}
    </NaipeDialog>
  )
}
