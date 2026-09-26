import { useRegisterSW } from 'virtual:pwa-register/react'

/** Avisa cuando la app ya funciona sin conexión o hay una versión nueva */
export function AvisoActualizacion() {
  const {
    needRefresh: [hayVersion, setHayVersion],
    offlineReady: [sinConexion, setSinConexion],
    updateServiceWorker,
  } = useRegisterSW()

  if (!hayVersion && !sinConexion) return null

  const cerrar = () => {
    setHayVersion(false)
    setSinConexion(false)
  }

  return (
    <div className="aviso boceto" role="status">
      <p>
        {hayVersion
          ? 'Hay una versión nueva de FanQuest.'
          : 'FanQuest ya funciona sin conexión.'}
      </p>
      <div className="fila-botones">
        {hayVersion && (
          <button type="button" className="button" onClick={() => updateServiceWorker(true)}>
            Actualizar
          </button>
        )}
        <button type="button" className="button secondary" onClick={cerrar}>
          {hayVersion ? 'Más tarde' : 'Entendido'}
        </button>
      </div>
    </div>
  )
}
