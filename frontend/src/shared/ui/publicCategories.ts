import { Calendar1, CloudSun, HandHeart, HeartHandshake, Mail, Newspaper, PartyPopper, Store, UsersRound } from "lucide-react"

import type { CategoryIconGlyph, CategoryIconTone } from "./CategoryIcon"

export type PublicCategoryKey =
  | "affiliation"
  | "reservations"
  | "events"
  | "entrepreneurship"
  | "volunteering"
  | "donations"
  | "news"
  | "transparency"
  | "contact"

type PublicCategoryDefinition = {
  label: string
  icon: CategoryIconGlyph
  tone: CategoryIconTone
}

/**
 * Single source of truth for public-site categories.
 * The glyph identifies the object; the tone identifies the domain.
 */
const publicCategories = {
  affiliation: { label: "Afiliación", icon: UsersRound, tone: "affiliates" },
  reservations: { label: "Reservas", icon: Calendar1, tone: "reservations" },
  events: { label: "Eventos", icon: PartyPopper, tone: "events" },
  entrepreneurship: { label: "Emprendimientos", icon: Store, tone: "entrepreneurship" },
  volunteering: { label: "Voluntariado", icon: HandHeart, tone: "volunteering" },
  donations: { label: "Donaciones", icon: HeartHandshake, tone: "donations" },
  news: { label: "Noticias", icon: Newspaper, tone: "news" },
  transparency: { label: "Transparencia", icon: CloudSun, tone: "transparency" },
  contact: { label: "Contacto", icon: Mail, tone: "contact" },
} as const satisfies Record<PublicCategoryKey, PublicCategoryDefinition>

type PublicCategory = PublicCategoryDefinition & { key: PublicCategoryKey }

function getPublicCategory(key: PublicCategoryKey): PublicCategory {
  return { key, ...publicCategories[key] }
}

export { getPublicCategory, publicCategories }
export type { PublicCategory }
