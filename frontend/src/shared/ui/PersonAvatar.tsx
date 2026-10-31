import { cn } from "@/shared/lib/utils"

const avatarTones = [
  "bg-status-info-surface text-status-info",
  "bg-status-success-surface text-status-success",
  "bg-status-warning-surface text-status-warning",
  "bg-status-neutral-surface text-status-neutral",
]

type PersonAvatarProps = {
  name: string | null | undefined
  className?: string
}

function getInitials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "SR"
}

function getAvatarTone(name: string) {
  const hash = Array.from(name).reduce((sum, character) => sum + character.charCodeAt(0), 0)
  return avatarTones[hash % avatarTones.length]
}

function PersonAvatar({ name, className }: PersonAvatarProps) {
  const displayName = name?.trim() || "Sin registro"

  return <span aria-hidden="true" className={cn("grid size-10 shrink-0 place-items-center rounded-full text-label font-bold", getAvatarTone(displayName), className)}>{getInitials(displayName)}</span>
}

export { PersonAvatar }
export type { PersonAvatarProps }
