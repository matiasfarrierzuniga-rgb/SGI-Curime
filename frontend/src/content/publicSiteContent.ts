export const site = {
  name: "Asociación de Desarrollo Integral de Curime",
  shortName: "ADI Curime",
  slogan: "Un pueblo unido, un futuro compartido.",
  location: "Curime, Guanacaste, Costa Rica",
  email: "adicurimenicoya@gmail.com",
  socialLinks: {
    instagram: {
      label: "@adicurime",
      url: "https://www.instagram.com/adicurime?igsi=NnM0cGRvaGZ3cmZt",
    },
    facebook: {
      label: "ADI Curime",
      url: "https://www.facebook.com/profile.php?id=100084633551482",
    },
  },
  phone: null as string | null,
  whatsapp: null as string | null,
  authorizedContacts: [] as ReadonlyArray<{ name: string; role: string; channel: string }>,
  nav: [
    { label: "Inicio", to: "/" },
    { label: "Nosotros", to: "/nosotros" },
    { label: "Comunidad", to: "/comunidad" },
    { label: "Emprendimientos", to: "/ventures" },
    { label: "Voluntariado", to: "/voluntariado" },
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
  reservations: { enabled: true },
  volunteering: { enabled: true },
   entrepreneurship: { enabled: true },
  donations: { enabled: true },
  userRegistration: { enabled: true },
} as const;

export const services = [
  {
    key: "affiliation",
    title: "Afiliación",
    text: "Envíe sus datos de identidad, contacto y residencia. La Asociación revisará la solicitud; enviarla no aprueba la afiliación.",
  },
  {
    key: "reservations",
    title: "Reservas",
    text: "Indique espacio, fecha, horario y motivo. Consultar disponibilidad no confirma la reserva.",
  },
  {
    key: "volunteering",
    title: "Voluntariado",
    text: "Revise las oportunidades publicadas y envíe su postulación. No requiere crear una cuenta y queda pendiente de revisión.",
  },
  {
    key: "entrepreneurship",
    title: "Emprendimientos",
    text: "Consulte los emprendimientos publicados y sus detalles en el directorio, sin iniciar sesión.",
  },
  {
    key: "donations",
    title: "Donaciones",
    text: "Indique su intención de donar dinero o bienes. La Asociación revisará la solicitud; el portal no procesa pagos ni confirma recepción.",
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
