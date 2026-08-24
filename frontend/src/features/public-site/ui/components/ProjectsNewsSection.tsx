import { Link } from 'react-router-dom'
import { news } from '@/content/publicSiteContent'

export function ProjectsNewsSection() {
  return (
    <section aria-labelledby="news-title" className="bg-brand-ivory pb-20 pt-4 md:pb-28">
      <div className="mx-auto w-full max-w-[1180px] px-4 min-[375px]:px-6">
        <header className="text-center">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-primary">
            Proyectos y noticias
          </p>
          <h2
            id="news-title"
            className="mt-3 font-display text-4xl font-normal leading-tight text-brand-ink md:text-5xl"
          >
            Avanzamos juntos
          </h2>
          <span aria-hidden="true" className="mx-auto mt-4 block h-1 w-16 rounded-full bg-brand-accent" />
        </header>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {news.map((item) => (
            <article
              key={item.slug}
              className="group flex flex-col overflow-hidden rounded-2xl border border-border/70 bg-white shadow-sm transition-shadow hover:shadow-md"
            >
              <div aria-hidden="true" className="relative h-44 overflow-hidden bg-brand-deep">
                <span className="absolute right-[18%] top-[16%] aspect-square w-16 rounded-full bg-brand-accent" />
                <span className="absolute -bottom-[30%] -left-[25%] aspect-[1.8] w-[130%] -rotate-[7deg] rounded-[50%_50%_0_0] bg-brand-primary" />
                <span className="absolute -bottom-[36%] -right-[20%] aspect-[1.8] w-[120%] -rotate-[7deg] rounded-[50%_50%_0_0] bg-brand-soft/80" />
                <span className="absolute left-3 top-3 rounded-full bg-brand-accent px-3 py-1 text-xs font-bold text-brand-ink">
                  {item.category}
                </span>
              </div>
              <div className="flex flex-1 flex-col gap-2 p-6">
                <p className="text-sm font-bold tracking-wide text-brand-primary">{item.date}</p>
                <h3 className="font-display text-2xl font-normal leading-snug text-brand-ink">
                  <Link to={`/noticias/${item.slug}`} className="group-hover:text-brand-primary">
                    {item.title}
                  </Link>
                </h3>
                <p className="flex-1 text-sm leading-relaxed text-brand-ink/70">{item.excerpt}</p>
                <Link
                  to={`/noticias/${item.slug}`}
                  className="mt-2 text-sm font-bold text-brand-primary hover:underline"
                >
                  Leer noticia<span className="sr-only">: {item.title}</span>
                </Link>
              </div>
            </article>
          ))}
        </div>
        <div className="mt-10 text-center">
          <Link
            to="/noticias"
            className="inline-flex h-12 items-center justify-center rounded-md border-2 border-brand-deep px-6 font-bold text-brand-deep transition-colors hover:bg-brand-deep hover:text-brand-ivory"
          >
            Ver todas las noticias
          </Link>
        </div>
      </div>
    </section>
  )
}
