import { useState, type ReactNode } from 'react'
import { useLoaderData, useNavigate } from 'react-router'
import { Icono } from '../../components/Icono'
import { PageHeader } from '../../components/PageHeader'
import { registrarEvento } from '../../lib/matomo'
import { MisionCard } from '../generar/components/MisionCard'
import { FACCIONES } from '../generar/config/facciones'
import { PREPARACION } from '../generar/config/preparacion'
import { REGLAS_EXTRAS } from '../generar/config/reglasExtras'
import { textoPlano } from '../generar/lib/textoPlano'
import type { EfectoEspecial, Mision } from '../generar/lib/tipos'
import { ExportarAventura } from './components/ExportarAventura'
import { ImportarDialog } from './components/ImportarDialog'
import { actualizarAventura, guardarAventura } from './lib/aventuras'
import { aplicarFaccion, aplicarTipo, misionVacia } from './lib/editarMision'
import type { DatosEditor } from './rutas'

/** Qué hace en la partida cada efecto de la regla especial */
const EFECTO: Record<EfectoEspecial['tipo'], string> = {
  'cambiar-cartas': 'cambia cartas de un mazo al prepararla',
  'anadir-cartas': 'añade cartas de tesoro',
  sala: 'contenido de salas',
  objeto: 'dónde está el objeto',
  pnj: 'aparición del PNJ',
  'contador-muerte': 'contador de muerte del PNJ',
  jefe: 'Puntos de Cuerpo del Jefe',
  recompensa: 'recompensa extra o perdida',
}

function Grupo({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <fieldset className="panel-mazo boceto editor-grupo">
      <legend className="panel-cabecera">
        <h2>{titulo}</h2>
      </legend>
      {children}
    </fieldset>
  )
}

/** Crear o editar una aventura a mano: textos, preparación y reglas especiales */
export function EditarAventuraPage() {
  const { plantilla, aventura } = useLoaderData<DatosEditor>()
  const navigate = useNavigate()
  const tipos = plantilla.especiales.reglas
  const [base] = tipos
  const [m, setM] = useState<Mision>(() => aventura?.mision ?? misionVacia(base))
  const [importar, setImportar] = useState(false)
  const [copiado, setCopiado] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const faccion = FACCIONES.find((f) => f.nombre === m.faccion.nombre)
  const tiposJefe = [...new Set([...(faccion?.jefes.map((j) => j.tipo) ?? []), m.tipoJefe].filter(Boolean))]
  const efectos = [...new Set(m.efectos.map((e) => EFECTO[e.tipo]))]

  const cambiar = <K extends keyof Mision>(campo: K, valor: Mision[K]) => {
    setM({ ...m, [campo]: valor })
    setError(null)
  }
  const texto = (campo: 'titulo' | 'introduccion' | 'epilogo' | 'objetivo' | 'salaObjetivo' | 'reglaEspecial' | 'mazoAtrezo' | 'jefe' | 'puntosCuerpoJefe') => ({
    value: m[campo],
    onChange: (e: { target: { value: string } }) => cambiar(campo, e.target.value),
  })
  const numero = (campo: 'salasNormales' | 'salasEspeciales' | 'pasillos' | 'peligro' | 'recompensa', min = 0) => ({
    type: 'number',
    min,
    value: m[campo],
    onChange: (e: { target: { value: string } }) => cambiar(campo, Math.max(min, Number(e.target.value) || 0)),
  })

  const guardar = async () => {
    if (!m.titulo.trim()) {
      setError('Ponle un título a la aventura.')
      return
    }
    try {
      if (aventura) {
        await actualizarAventura({ ...aventura, mision: m })
        registrarEvento('Aventuras', 'Editar')
        navigate(`/aventuras/${aventura.id}`)
      } else {
        const nueva = await guardarAventura(m)
        registrarEvento('Aventuras', 'Crear')
        navigate(`/aventuras/${nueva.id}`)
      }
    } catch {
      setError('No se ha podido guardar: este navegador no permite almacenar datos.')
    }
  }

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(textoPlano(m))
      setCopiado(true)
      setTimeout(() => setCopiado(false), 1500)
    } catch {
      alert('No se pudo copiar. Selecciona el texto manualmente.')
    }
  }

  return (
    <>
      <PageHeader title={aventura ? 'Editar aventura' : 'Nueva aventura'} backTo={aventura ? `/aventuras/${aventura.id}` : '/aventuras'} />

      <div className="editor no-imprimir">
        <section className="editor-json">
          <p className="nota">Importa una aventura compartida o expórtala como JSON.</p>
          <div className="fila-botones">
            <button type="button" className="button secondary" onClick={() => setImportar(true)}>
              Importar…
            </button>
            <ExportarAventura mision={m} />
          </div>
          {aventura?.configuracion && (
            <p className="nota">
              Esta aventura ya está preparada: si cambias las salas o la regla especial, revisa los mazos en la preparación.
            </p>
          )}
        </section>

        <Grupo titulo="Misión">
          <label className="campo">
            Título
            <input type="text" required {...texto('titulo')} />
          </label>
          <label className="campo">
            Introducción
            <textarea rows={5} {...texto('introduccion')} />
          </label>
        </Grupo>

        <Grupo titulo="Preparación">
          <div className="editor-numeros">
            <label className="campo">
              Salas normales
              <input {...numero('salasNormales')} />
            </label>
            <label className="campo">
              Salas especiales
              <input {...numero('salasEspeciales')} />
            </label>
            <label className="campo">
              Losetas de pasillo
              <input {...numero('pasillos')} />
            </label>
            <label className="campo">
              Nivel de peligro
              <input {...numero('peligro')} />
            </label>
            <label className="campo">
              Dado de trampa
              <select value={m.dadoTrampa} onChange={(e) => cambiar('dadoTrampa', e.target.value)}>
                {PREPARACION.dadosTrampa.map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </select>
            </label>
            <label className="campo">
              Recompensa (mo)
              <input {...numero('recompensa')} />
            </label>
          </div>
          <label className="campo">
            Mazo de atrezo
            <textarea rows={2} {...texto('mazoAtrezo')} />
          </label>
        </Grupo>

        <Grupo titulo="Enemigos">
          <label className="campo">
            Facción (tabla de encuentros)
            <select
              value={m.faccion.nombre}
              onChange={(e) => {
                const f = FACCIONES.find((x) => x.nombre === e.target.value)
                if (f) setM(aplicarFaccion(m, f))
              }}
            >
              {!faccion && <option value={m.faccion.nombre}>{m.faccion.nombre || 'Elige una facción'}</option>}
              {FACCIONES.map((f) => (
                <option key={f.nombre}>{f.nombre}</option>
              ))}
            </select>
          </label>
          <div className="editor-numeros">
            <label className="campo">
              Monstruo errante
              <input type="text" value={m.faccion.errante} onChange={(e) => cambiar('faccion', { ...m.faccion, errante: e.target.value })} />
            </label>
            <label className="campo">
              Errante superior
              <input
                type="text"
                value={m.faccion.erranteSuperior}
                onChange={(e) => cambiar('faccion', { ...m.faccion, erranteSuperior: e.target.value })}
              />
            </label>
            <label className="campo">
              Tipo de Jefe Final
              <select value={m.tipoJefe} onChange={(e) => cambiar('tipoJefe', e.target.value)}>
                {tiposJefe.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </label>
            <label className="campo">
              Nombre del Jefe
              <input type="text" {...texto('jefe')} />
            </label>
          </div>
          <label className="campo">
            Puntos de Cuerpo del Jefe
            <input type="text" {...texto('puntosCuerpoJefe')} />
          </label>
        </Grupo>

        <Grupo titulo="Objetivo y regla especial">
          <label className="campo">
            Tipo de misión
            <select
              value={m.regla}
              onChange={(e) => {
                const t = tipos.find((x) => x.regla === Number(e.target.value))
                if (t) setM(aplicarTipo(m, t))
              }}
            >
              {tipos.map((t) => (
                <option key={t.regla} value={t.regla}>
                  {t.regla} · {t.etiqueta}
                </option>
              ))}
            </select>
          </label>
          <p className="nota">Cambiar el tipo sustituye el objetivo y la regla especial por los suyos.</p>
          <label className="campo">
            Objetivo
            <textarea rows={3} {...texto('objetivo')} />
          </label>
          <label className="campo">
            Sala Objetivo
            <textarea rows={2} {...texto('salaObjetivo')} />
          </label>
          <label className="campo">
            Regla especial
            <textarea rows={6} {...texto('reglaEspecial')} />
          </label>
          <p className="nota">
            {efectos.length
              ? `En la partida se aplica: ${efectos.join(', ')}.`
              : 'Este tipo de misión no tiene efectos que la partida aplique sola.'}
          </p>
        </Grupo>

        <Grupo titulo="Reglas extras">
          {m.extras.length === 0 && <p className="nota">{m.sinReglasExtras}</p>}
          {m.extras.map((ex, i) => (
            <div key={i} className="editor-extra">
              <label className="campo">
                Nombre
                <input
                  type="text"
                  value={ex.nombre}
                  onChange={(e) => cambiar('extras', m.extras.map((x, j) => (j === i ? { ...x, nombre: e.target.value } : x)))}
                />
              </label>
              <label className="campo">
                Texto
                <textarea
                  rows={3}
                  value={ex.texto}
                  onChange={(e) => cambiar('extras', m.extras.map((x, j) => (j === i ? { ...x, texto: e.target.value } : x)))}
                />
              </label>
              <button type="button" className="enlace" onClick={() => cambiar('extras', m.extras.filter((_, j) => j !== i))}>
                Quitar regla extra
              </button>
            </div>
          ))}
          <label className="campo">
            Añadir regla extra
            <select
              value=""
              onChange={(e) => {
                const r = REGLAS_EXTRAS.reglas.find((x) => x.id === e.target.value)
                cambiar('extras', [...m.extras, r ? { nombre: r.nombre, texto: r.texto } : { nombre: '', texto: '' }])
              }}
            >
              <option value="" disabled>
                Elige una…
              </option>
              {REGLAS_EXTRAS.reglas.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.nombre}
                </option>
              ))}
              <option value="otra">Otra, escrita a mano</option>
            </select>
          </label>
        </Grupo>

        <Grupo titulo="Epílogo">
          <label className="campo">
            Epílogo
            <textarea rows={4} {...texto('epilogo')} />
          </label>
        </Grupo>

        <div className="editor-acciones">
          {error && (
            <p className="nota mal" role="alert">
              {error}
            </p>
          )}
          <button type="button" className="button" onClick={guardar}>
            <Icono nombre="pergamino" />
            Guardar aventura
          </button>
          <div className="fila-botones">
            <button type="button" className="button secondary" onClick={() => window.print()}>
              Imprimir
            </button>
            <button type="button" className="button secondary" onClick={copiar}>
              {copiado ? 'Copiado' : 'Copiar texto'}
            </button>
          </div>
        </div>
      </div>

      <div className="solo-imprimir">
        <MisionCard mision={m} />
      </div>

      {importar && (
        <ImportarDialog
          base={misionVacia(base)}
          onImportar={(importada) => {
            setM(importada)
            registrarEvento('Aventuras', 'Importar')
          }}
          onCerrar={() => setImportar(false)}
        />
      )}
    </>
  )
}
