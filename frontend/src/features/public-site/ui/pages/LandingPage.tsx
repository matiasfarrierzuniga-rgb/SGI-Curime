import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/features/auth'
import { news } from '@/content/publicSiteContent'

const buttonBase =
  'inline-flex min-h-[46px] items-center justify-center px-5 py-3 text-center font-bold transition-colors'
const buttonPrimary = `${buttonBase} bg-brand-accent text-brand-ink hover:bg-brand-accent/85`
const buttonSecondary = `${buttonBase} border border-brand-ivory/75 text-brand-ivory hover:bg-brand-ivory hover:text-brand-ink`
const buttonLight = `${buttonBase} bg-brand-ivory text-brand-ink hover:bg-white`
const buttonOutline = `${buttonBase} border border-brand-ivory/75 text-brand-ivory hover:border-brand-accent hover:bg-brand-accent hover:text-brand-ink`
const kicker = 'mb-4 text-xs font-bold uppercase tracking-[0.13em]'

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
    <div className="overflow-clip bg-brand-ivory font-body text-brand-ink">
      <section aria-labelledby="landing-title" className="relative bg-brand-deep text-brand-ivory before:absolute before:inset-0 before:opacity-30 before:content-[''] before:[background-image:radial-gradient(circle_at_15%_20%,var(--color-brand-accent)_0_1px,transparent_1.5px),radial-gradient(circle_at_78%_12%,var(--color-brand-soft)_0_1px,transparent_1.5px)] before:[background-size:28px_28px,37px_37px]">
        <div className="relative mx-auto grid w-full max-w-[1180px] items-center gap-12 px-4 py-16 min-[375px]:px-6 md:min-h-[min(680px,calc(100vh-79px))] md:grid-cols-[minmax(0,1.12fr)_minmax(260px,0.88fr)] md:gap-[clamp(2.5rem,8vw,8rem)] md:py-[clamp(4.5rem,10vw,8rem)]">
          <div className="max-w-[46rem]">
            <p className={`${kicker} text-brand-accent`}>Curime, Nicoya, Guanacaste</p>
            <h1
              id="landing-title"
              className="max-w-[11ch] font-display text-[clamp(3rem,6.8vw,6.5rem)] font-normal leading-[0.93] tracking-[-0.025em]"
            >
              Gestión comunitaria con raíces en Curime.
            </h1>
            <p className="mt-7 max-w-[38rem] text-[clamp(1.05rem,1.6vw,1.28rem)] leading-[1.65]">
              SGI-Curime acompaña a la Asociación de Desarrollo Integral de Curime para compartir información oficial, fortalecer participación y cuidar trabajo común.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link className={buttonPrimary} to="/nosotros">Conozca la Asociación</Link>
              <Link className={buttonSecondary} to={accessPath}>{accessLabel}</Link>
            </div>
          </div>
          <div aria-hidden="true" className="relative min-h-[270px] overflow-hidden border border-brand-ivory/45 bg-[#1b5968] md:min-h-[360px]">
            <span className="absolute right-[17%] top-[13%] aspect-square w-[clamp(5.5rem,12vw,9.5rem)] rounded-full bg-brand-accent" />
            <span className="absolute -bottom-[18%] -right-[50%] aspect-[1.8] w-[125%] -rotate-[7deg] rounded-[50%_50%_0_0] bg-brand-soft" />
            <span className="absolute -bottom-[18%] -left-[45%] aspect-[1.8] w-[125%] -rotate-[7deg] rounded-[50%_50%_0_0] bg-brand-primary" />
            <span className="absolute bottom-6 left-6 font-display text-[clamp(1.3rem,2.2vw,2rem)] leading-[0.9] tracking-[0.05em]">
              ADI
              <br />
              CURIME
            </span>
          </div>
        </div>
      </section>

      <section aria-labelledby="community-title" className="py-[clamp(4.5rem,9vw,8rem)]">
        <div className="mx-auto grid w-full max-w-[1180px] items-end gap-8 px-4 min-[375px]:px-6 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] md:gap-x-[clamp(3rem,10vw,11rem)]">
          <div>
            <p className={`${kicker} text-brand-primary`}>Un espacio compartido</p>
            <h2 id="community-title" className="max-w-[16ch] font-display text-[clamp(2rem,4.3vw,4.25rem)] font-normal leading-[1] tracking-[-0.025em]">
              Información que acerca, participación que sostiene.
            </h2>
          </div>
          <p className="max-w-[38rem] text-[clamp(1.05rem,1.5vw,1.25rem)] leading-[1.7]">
            Este portal es punto de encuentro digital para mantener comunicación cercana entre la Asociación y comunidad de Curime. Aquí, cada novedad busca ser clara, útil y vinculada con territorio.
          </p>
        </div>
        <div className="mx-auto mt-12 grid w-full max-w-[1180px] gap-10 border-t border-brand-deep/25 px-4 pt-6 min-[375px]:px-6 md:grid-cols-3 md:gap-0 md:divide-x md:divide-brand-deep/25 md:pt-0">
          {communityValues.map(([title, text], index) => (
            <article key={title} className="md:px-8 md:py-6 md:first:pl-0 md:last:pr-0">
              <span aria-hidden="true" className="text-sm font-bold tracking-[0.12em] text-brand-primary">
                0{index + 1}
              </span>
              <h3 className="mb-3 mt-6 font-display text-2xl font-normal">{title}</h3>
              <p className="m-0 leading-[1.65] text-brand-ink/80">{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section aria-labelledby="services-title" className="bg-brand-deep py-[clamp(4.5rem,9vw,8rem)] text-brand-ivory">
        <div className="mx-auto w-full max-w-[1180px] px-4 min-[375px]:px-6">
          <header className="grid gap-8 md:grid-cols-[minmax(0,0.55fr)_minmax(0,1.45fr)]">
            <p className={`${kicker} text-brand-accent`}>SGI-Curime</p>
            <h2 id="services-title" className="max-w-[18ch] font-display text-[clamp(2rem,4.3vw,4.25rem)] font-normal leading-[1] tracking-[-0.025em]">
              Una herramienta para trabajo cotidiano de la comunidad.
            </h2>
          </header>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {capabilities.map(([title, text]) => (
              <article key={title} className="min-h-[13rem] border-t-4 border-brand-accent bg-brand-ivory/[0.08] p-6">
                <h3 className="mt-1 font-display text-2xl font-normal">{title}</h3>
                <p className="m-0 leading-[1.65] text-brand-ivory/85">{text}</p>
              </article>
            ))}
          </div>
          <Link className="mt-8 inline-flex gap-2 font-bold text-brand-accent underline-offset-4 hover:underline" to="/servicios">
            Explore los servicios de la Asociación <span aria-hidden="true">→</span>
          </Link>
        </div>
      </section>

      <section aria-labelledby="news-title" className="py-[clamp(4.5rem,9vw,8rem)]">
        <div className="mx-auto w-full max-w-[1180px] px-4 min-[375px]:px-6">
          <div className="grid items-end gap-8 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] md:gap-x-[clamp(3rem,10vw,11rem)]">
            <div>
              <p className={`${kicker} text-brand-primary`}>Actualidad</p>
              <h2 id="news-title" className="max-w-[16ch] font-display text-[clamp(2rem,4.3vw,4.25rem)] font-normal leading-[1] tracking-[-0.025em]">
                Actualidad comunitaria.
              </h2>
            </div>
            <p className="max-w-[38rem] leading-[1.7] text-brand-ink/80">
              Comunicaciones oficiales de la Asociación, publicadas una vez validadas.
            </p>
          </div>
          <div className="mt-12 grid gap-10 border-t border-brand-deep/25 pt-8 md:grid-cols-3 md:gap-8">
            {news.map((item) => (
              <article key={item.slug} className="max-w-xl">
                <p className="text-sm font-bold tracking-wide text-brand-primary">
                  {item.category} · {item.date}
                </p>
                <h3 className="mt-2 font-display text-3xl font-normal leading-tight">
                  <Link className="hover:text-brand-primary hover:underline" to={`/noticias/${item.slug}`}>
                    {item.title}
                  </Link>
                </h3>
                <p className="mt-3 leading-[1.65] text-brand-ink/80">{item.excerpt}</p>
                <Link className="mt-4 inline-flex font-bold text-brand-primary underline-offset-4 hover:underline" to={`/noticias/${item.slug}`}>
                  Leer noticia<span className="sr-only">: {item.title}</span>
                </Link>
              </article>
            ))}
          </div>
          <Link className="mt-10 inline-flex gap-2 font-bold text-brand-primary underline-offset-4 hover:underline" to="/noticias">
            Ver todas las noticias <span aria-hidden="true">→</span>
          </Link>
        </div>
      </section>

      <section aria-labelledby="closing-title" className="bg-brand-primary py-[clamp(4.5rem,9vw,7.5rem)] text-brand-ivory">
        <div className="mx-auto grid w-full max-w-[1180px] items-end gap-10 px-4 min-[375px]:px-6 md:grid-cols-[minmax(0,1.1fr)_minmax(16rem,0.9fr)] md:gap-x-[clamp(3rem,9vw,9rem)]">
          <div>
            <p className={`${kicker} text-brand-accent`}>Comunidad organizada</p>
            <h2 id="closing-title" className="max-w-[16ch] font-display text-[clamp(2rem,4.3vw,4.25rem)] font-normal leading-[1] tracking-[-0.025em]">
              Lo común también se construye con buena información.
            </h2>
          </div>
          <div>
            <p className="m-0 text-[1.08rem] leading-[1.7]">
              Conozca los canales oficiales de ADI Curime o solicite acceso cuando corresponda a su participación en la Asociación.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link className={buttonLight} to="/contacto">Contacte a la Asociación</Link>
              <Link className={buttonOutline} to={isAuthenticated ? '/app' : '/register'}>
                {isAuthenticated ? 'Abrir mi espacio SGI' : 'Solicitar una cuenta'}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
