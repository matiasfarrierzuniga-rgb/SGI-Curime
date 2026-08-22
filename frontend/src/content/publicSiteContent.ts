export const site = {
  name: "Asociación de Desarrollo Integral de Curime",
  shortName: "ADI Curime",
  slogan: "Un pueblo unido, un futuro compartido.",
  location: "Curime, Guanacaste, Costa Rica",
  email: "adicurimenicoya@gmail.com",
  instagram: "@adicurime",
  phone: null as string | null,
  whatsapp: null as string | null,
  authorizedContacts: [] as ReadonlyArray<{ name: string; role: string; channel: string }>,
  nav: [
    { label: "Inicio", to: "/" },
    { label: "Nosotros", to: "/nosotros" },
    { label: "Comunidad", to: "/comunidad" },
    { label: "Noticias", to: "/noticias" },
    { label: "Eventos", to: "/eventos" },
    { label: "Servicios", to: "/servicios" },
    { label: "Transparencia", to: "/transparencia" },
    { label: "Contacto", to: "/contacto" },
  ],
  pending: "Contenido pendiente de validación con la ADI.",
} as const;

export const moduleAvailability = {
  affiliation: { enabled: true },
  reservations: { enabled: false },
  volunteering: { enabled: false },
  entrepreneurship: { enabled: false },
  donations: { enabled: false },
  userRegistration: { enabled: true },
} as const;

export const services = [
  {
    key: "affiliation",
    title: "Afiliación",
    text: "Gestiones de afiliación comunitaria.",
  },
  {
    key: "reservations",
    title: "Reservas",
    text: "Solicitud y seguimiento de espacios comunitarios.",
  },
  {
    key: "volunteering",
    title: "Voluntariado",
    text: "Participación en iniciativas de la comunidad.",
  },
  {
    key: "entrepreneurship",
    title: "Emprendimientos",
    text: "Apoyo y visibilidad para iniciativas locales.",
  },
  {
    key: "donations",
    title: "Donaciones",
    text: "Canales para colaborar con proyectos autorizados.",
  },
] as const;

export const news = [
  {
    slug: "canal-informativo-en-preparacion",
    category: "Comunidad",
    date: "Próximamente",
    title: "Canal informativo de ADI Curime",
    excerpt:
      "Este espacio publicará noticias institucionales verificadas cuando estén disponibles.",
    body: "Las noticias de la Asociación serán incorporadas y validadas antes de su publicación.",
  },
] as const;

export const events = [
  {
    title: "Agenda comunitaria en preparación",
    date: "Por confirmar",
    time: "Por confirmar",
    place: "Curime",
    summary:
      "La programación oficial se comunicará por los canales de la Asociación.",
    status: "próximo",
  },
] as const;
