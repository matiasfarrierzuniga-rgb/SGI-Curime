import { cn } from "@/shared/lib/utils"

type SocialPlatform = "instagram" | "facebook"

const facebookPath =
  "M24 12.1C24 5.4 18.6 0 12 0S0 5.4 0 12.1c0 6 4.4 11 10.1 11.9v-8.4H7.1v-3.4h3V9.5c0-3 1.8-4.7 4.5-4.7 1.3 0 2.7.2 2.7.2v3h-1.5c-1.5 0-2 .9-2 1.9v2.2h3.3l-.5 3.4h-2.8V24C19.6 23.1 24 18.1 24 12.1Z"

function SocialIcon({ platform, className, strokeWidth = 1.75 }: { platform: SocialPlatform; className?: string; strokeWidth?: number }) {
  if (platform === "facebook") {
    return (
      <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" className={cn("shrink-0 fill-current", className)}>
        <path d={facebookPath} />
      </svg>
    )
  }

  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("shrink-0", className)}
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  )
}

export { SocialIcon }
export type { SocialPlatform }
