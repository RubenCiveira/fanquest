import { PageHeader } from '../../components/PageHeader'

const LICENCIA = 'https://creativecommons.org/licenses/by-nc-nd/4.0/deed.es'

/** Atribución de FetenQuest y de las obras en que se basa la app */
export function CreditosPage() {
  return (
    <>
      <PageHeader title="Créditos" />

      <section className="creditos">
        <p>
          Esta app es una ayuda de juego no oficial, gratuita y sin ánimo de lucro para{' '}
          <strong>FetenQuest</strong>. No está afiliada ni respaldada por su autor.
        </p>

        <h2>FetenQuest</h2>
        <p>
          <cite>FetenQuest 4.1 Legacy</cite> y <cite>FetenQuest, Aventuras Infinitas</cite> © 2026 por{' '}
          <strong>@SrMiyagi</strong>, bajo licencia{' '}
          <a href={LICENCIA} target="_blank" rel="noopener noreferrer">
            CC BY-NC-ND 4.0
          </a>
          . Las reglas, los textos y las cartas de los mazos (incluidas sus ilustraciones) proceden de estas obras.
        </p>
        <ul>
          <li>
            Comunidad:{' '}
            <a href="https://t.me/Fetenquest" target="_blank" rel="noopener noreferrer">
              t.me/Fetenquest
            </a>
          </li>
          <li>
            Contacto del autor: <a href="mailto:fetenquest@gmail.com">fetenquest@gmail.com</a> · Telegram @SrMiyagi
          </li>
        </ul>

        {/* el generador de aventuras está oculto: al volver a mostrarlo, recuperar su crédito:
            «Basado en el Generador de Aventuras FAI, autoría original de Ryback» */}

        <h2>HeroQuest</h2>
        <p>
          FetenQuest es una ampliación de reglas para HeroQuest. HeroQuest es una marca de Hasbro; esta app no
          está relacionada con Hasbro.
        </p>
      </section>
    </>
  )
}
