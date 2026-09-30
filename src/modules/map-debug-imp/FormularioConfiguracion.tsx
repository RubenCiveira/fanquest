import type { Configuracion } from '../gamemap'
import { OPCIONES_CONFIGURACION } from './configuracion'

type Props = { configuracion: Configuracion; onCambiar: (configuracion: Configuracion) => void }

/** Formulario con las reglas que el proveedor de pruebas da al gestor: cada cambio vale al momento */
export function FormularioConfiguracion({ configuracion, onCambiar }: Props) {
  const ajustes = Object.keys(OPCIONES_CONFIGURACION) as (keyof Configuracion)[]
  return (
    <fieldset className="map-debug-configuracion">
      <legend>Configuración del proveedor</legend>
      {ajustes.map((ajuste) => (
        <label key={ajuste} className="campo">
          {OPCIONES_CONFIGURACION[ajuste].etiqueta}
          <select value={configuracion[ajuste]} onChange={(e) => onCambiar({ ...configuracion, [ajuste]: e.target.value })}>
            {Object.entries(OPCIONES_CONFIGURACION[ajuste].valores).map(([valor, texto]) => (
              <option key={valor} value={valor}>
                {texto}
              </option>
            ))}
          </select>
        </label>
      ))}
    </fieldset>
  )
}
