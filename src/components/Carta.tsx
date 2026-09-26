import { urlImagen, type CartaMazo, type IdMazo, type TiradaCarta } from '../lib/mazos'

type Props = {
  mazo: IdMazo
  carta: CartaMazo
  /**
   * `mini`: naipe pequeño para reconocerla (p. ej. en una baraja impresa);
   * `completa`: la carta entera con todas sus reglas
   */
  variante?: 'mini' | 'completa'
  /** Copias de la carta que representa */
  copias?: number
  /** Sello en el pie de la carta, p. ej. una regla especial */
  sello?: string
}

function Tirada({ tirada }: { tirada: TiradaCarta }) {
  return (
    <>
      {(tirada.accion || tirada.dado) && (
        <p className="carta-tirada-titulo">
          {tirada.accion}
          {tirada.dado && ` (${tirada.dado})`}:
        </p>
      )}
      <ul className="carta-tirada">
        {tirada.resultados.map((r) => (
          <li key={r.resultado}>
            <strong>{r.resultado}:</strong> {r.texto}
            {r.tirada && <Tirada tirada={r.tirada} />}
          </li>
        ))}
      </ul>
    </>
  )
}

/** Resumen corto del texto de una carta, para la variante mini */
function resumen(c: CartaMazo) {
  if (c.texto) return c.texto
  if (c.activada) return c.activada.sinMonstruos
  return c.tirada?.resultados.map((r) => `${r.resultado}: ${r.texto ?? ''}`).join(' ')
}

/** Carta de un mazo dibujada como un naipe, reutilizable en toda la app */
export function Carta({ mazo, carta, variante = 'mini', copias = 1, sello }: Props) {
  const imagen = urlImagen(mazo, carta)
  const completa = variante === 'completa'

  return (
    <figure className={`carta carta-${variante} carta-${carta.imagen?.tamano ?? 'texto'}`}>
      <figcaption className="carta-titulo">{carta.titulo}</figcaption>
      {imagen && <img src={imagen} alt="" loading="lazy" />}

      {completa ? (
        <div className="carta-cuerpo">
          {carta.cita && <p className="carta-cita">«{carta.cita}»</p>}
          {carta.texto && <p className="carta-reglas">{carta.texto}</p>}
          {carta.tirada && <Tirada tirada={carta.tirada} />}
          {carta.notas && <p className="carta-reglas">{carta.notas}</p>}
          {carta.activada && (
            <>
              <p className="carta-seccion">Activada</p>
              <p className="carta-reglas">
                <strong>» Si no hay monstruos:</strong> {carta.activada.sinMonstruos}
              </p>
              <p className="carta-reglas">
                <strong>» Si hay monstruos:</strong> {carta.activada.conMonstruos}
              </p>
            </>
          )}
          {carta.encontrada && (
            <>
              <p className="carta-seccion">Encontrada</p>
              <p className="carta-reglas">{carta.encontrada}</p>
            </>
          )}
        </div>
      ) : (
        <p className="carta-resumen">{resumen(carta)}</p>
      )}

      {copias > 1 && <span className="carta-copias">×{copias}</span>}
      {sello && <span className="carta-sello">{sello}</span>}
    </figure>
  )
}
