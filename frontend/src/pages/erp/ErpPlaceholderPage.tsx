type ErpPlaceholderPageProps = {
  title: string
}

export function ErpPlaceholderPage({ title }: ErpPlaceholderPageProps) {
  return (
    <section className="max-w-2xl">
      <p className="text-sm font-bold uppercase tracking-[0.12em] text-brand-deep">{title}</p>
      <h1 className="mt-3 font-display text-4xl font-normal leading-tight text-brand-ink">{title}</h1>
      <p className="mt-5 text-lg leading-8 text-brand-ink/75">Módulo pendiente de implementación funcional en Sprint 1.</p>
    </section>
  )
}
