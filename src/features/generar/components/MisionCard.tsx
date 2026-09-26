import type { ReactNode } from 'react'
import type { Mision } from '../lib/tipos'

function Seccion({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="mision-seccion">
      <h3>{titulo}</h3>
      {children}
    </section>
  )
}

export function MisionCard({ mision: m }: { mision: Mision }) {
  return (
    <article className="mision">
      <h2 className="mision-titulo">{m.titulo}</h2>

      <Seccion titulo="Introducción">
        <p className="mision-narrativa">{m.introduccion}</p>
      </Seccion>

      <Seccion titulo="Preparación">
        <dl className="mision-prep">
          <div><dt>Salas normales</dt><dd>{m.salasNormales}</dd></div>
          <div><dt>Salas especiales</dt><dd>{m.salasEspeciales}</dd></div>
          <div><dt>Losetas de pasillo</dt><dd>{m.pasillos}</dd></div>
          <div>
            <dt>Nivel de peligro</dt>
            <dd>
              {m.peligro}
              {m.peligro >= 1 && <span className="badge">ALTO</span>}
            </dd>
          </div>
          <div><dt>Dado de trampa</dt><dd>{m.dadoTrampa}</dd></div>
          <div><dt>Recompensa</dt><dd>{m.recompensa} mo</dd></div>
        </dl>
        <p className="nota">{m.mazoAtrezo}</p>
      </Seccion>

      <Seccion titulo="Tabla de encuentros y jefe">
        <p>
          Facción: <strong>{m.faccion.nombre}</strong> · Errante:{' '}
          <strong>{m.faccion.errante}</strong> · Errante Superior:{' '}
          <strong>{m.faccion.erranteSuperior}</strong>
        </p>
        <p>
          Jefe Final: <strong>{m.jefe}</strong> (<strong>{m.tipoJefe}</strong>).{' '}
          {m.puntosCuerpoJefe}
        </p>
      </Seccion>

      <Seccion titulo="Objetivo de la misión">
        <p>{m.objetivo}</p>
        <p className="nota">{m.salaObjetivo}</p>
      </Seccion>

      <Seccion titulo="Reglas especiales">
        <div className="reglas boceto">{m.reglaEspecial}</div>
      </Seccion>

      <Seccion titulo="Reglas extras">
        <div className="reglas boceto">
          {m.extras.length === 0 && <p className="nota">{m.sinReglasExtras}</p>}
          {m.extras.map((ex) => (
            <p key={ex.nombre}>
              <strong>♦ {ex.nombre}:</strong> {ex.texto}
            </p>
          ))}
        </div>
      </Seccion>

      <Seccion titulo="Epílogo">
        <p className="mision-narrativa">{m.epilogo}</p>
      </Seccion>
    </article>
  )
}
