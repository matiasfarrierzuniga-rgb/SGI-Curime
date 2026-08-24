import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/features/auth'

const communityValues = [
  ['Información oficial', 'Un lugar claro para conocer comunicaciones, actividades y documentos que la Asociación valida para Curime.'],
  ['Participación cercana', 'Canales digitales pensados para acercar a vecinas, vecinos e iniciativas comunitarias.'],
  ['Gestión que acompaña', 'Un sistema que crece con las necesidades reales de la Asociación y su comunidad.'],
] as const

const capabilities = [
  ['Noticias y actividades', 'Siga comunicaciones y agenda comunitaria desde un mismo espacio.'],
  ['Servicios en desarrollo', 'Conozca las gestiones que la Asociación habilita gradualmente.'],
  ['Acceso al SGI', 'Las personas autorizadas pueden ingresar a las funciones disponibles para su cuenta.'],
] as const

export function LandingPage() {
  const { isAuthenticated } = useAuth()
  const accessPath = isAuthenticated ? '/app' : '/login'
  const accessLabel = isAuthenticated ? 'Ir al SGI' : 'Ingresar al SGI'

  useEffect(() => {
    document.title = 'SGI-Curime | ADI Curime'
    const description = 'Portal comunitario de la Asociación de Desarrollo Integral de Curime, Nicoya, Guanacaste.'
    let meta = document.querySelector('meta[name="description"]')
    if (!meta) {
      meta = document.createElement('meta')
      meta.setAttribute('name', 'description')
      document.head.append(meta)
    }
    meta.setAttribute('content', description)
  }, [])

  return (
    <div className="landing-page">
      <section className="landing-hero" aria-labelledby="landing-title">
        <div className="container-public landing-hero-grid">
          <div className="landing-hero-copy">
            <p className="landing-kicker">Curime, Nicoya, Guanacaste</p>
            <h1 id="landing-title">Gestión comunitaria con raíces en Curime.</h1>
            <p className="landing-intro">
              SGI-Curime acompaña a la Asociación de Desarrollo Integral de Curime para compartir información oficial, fortalecer participación y cuidar trabajo común.
            </p>
            <div className="landing-actions">
              <Link className="landing-button landing-button-primary" to="/nosotros">Conozca la Asociación</Link>
              <Link className="landing-button landing-button-secondary" to={accessPath}>{accessLabel}</Link>
            </div>
          </div>
          <div className="landing-hero-emblem" aria-hidden="true">
            <span className="landing-sun" />
            <span className="landing-hill landing-hill-back" />
            <span className="landing-hill landing-hill-front" />
            <span className="landing-emblem-label">ADI<br />CURIME</span>
          </div>
        </div>
      </section>

      <section className="landing-section landing-introduction" aria-labelledby="community-title">
        <div className="container-public landing-two-column">
          <div>
            <p className="landing-kicker">Un espacio compartido</p>
            <h2 id="community-title">Información que acerca, participación que sostiene.</h2>
          </div>
          <p className="landing-lead">
            Este portal es punto de encuentro digital para mantener comunicación cercana entre la Asociación y comunidad de Curime. Aquí, cada novedad busca ser clara, útil y vinculada con territorio.
          </p>
        </div>
        <div className="container-public landing-value-list">
          {communityValues.map(([title, text], index) => (
            <article key={title} className="landing-value">
              <span aria-hidden="true">0{index + 1}</span>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-section landing-services" aria-labelledby="services-title">
        <div className="container-public">
          <header className="landing-section-heading">
            <p className="landing-kicker">SGI-Curime</p>
            <h2 id="services-title">Una herramienta para trabajo cotidiano de la comunidad.</h2>
          </header>
          <div className="landing-capability-grid">
            {capabilities.map(([title, text]) => (
              <article key={title} className="landing-capability">
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
          <Link className="landing-text-link" to="/servicios">Explore los servicios de la Asociación <span aria-hidden="true">→</span></Link>
        </div>
      </section>

      <section className="landing-closing" aria-labelledby="closing-title">
        <div className="container-public landing-closing-grid">
          <div>
            <p className="landing-kicker">Comunidad organizada</p>
            <h2 id="closing-title">Lo común también se construye con buena información.</h2>
          </div>
          <div>
            <p>Conozca los canales oficiales de ADI Curime o solicite acceso cuando corresponda a su participación en la Asociación.</p>
            <div className="landing-actions">
              <Link className="landing-button landing-button-light" to="/contacto">Contacte a la Asociación</Link>
              <Link className="landing-button landing-button-outline" to={isAuthenticated ? '/app' : '/register'}>{isAuthenticated ? 'Abrir mi espacio SGI' : 'Solicitar una cuenta'}</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
