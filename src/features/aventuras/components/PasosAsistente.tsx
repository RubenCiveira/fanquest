import { Icono } from '../../../components/Icono'
import { estadoPaso, TITULO_PASO } from '../lib/asistente'
import { PASOS, type Configuracion, type Paso } from '../lib/preparacion'

type Props = {
  config: Configuracion
  /** Volver a un paso completado para prepararlo de nuevo */
  onVolver: (paso: Paso) => void
}

export function PasosAsistente({ config, onVolver }: Props) {
  return (
    <ol className="pasos">
      {PASOS.map((paso, i) => {
        const estado = estadoPaso(config, paso)
        const marca = estado === 'completado' ? <Icono nombre="hecho" /> : <span>{i + 1}</span>
        return (
          <li key={paso} className={`paso paso-${estado}`} aria-current={estado === 'actual' ? 'step' : undefined}>
            {estado === 'completado' ? (
              <button type="button" onClick={() => onVolver(paso)} aria-label={`Volver al paso ${TITULO_PASO[paso]}`}>
                {marca}
                {TITULO_PASO[paso]}
              </button>
            ) : (
              <span className="paso-etiqueta">
                {marca}
                {TITULO_PASO[paso]}
              </span>
            )}
          </li>
        )
      })}
    </ol>
  )
}
