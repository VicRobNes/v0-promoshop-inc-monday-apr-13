export interface TeamMember {
  name: string
  role: string
  description: string
  /** URL to profile picture. Leave empty to render initials fallback. */
  imagePath?: string
}

// Edited via the upcoming admin dashboard. Shared by the Home and About pages
// so both always render the same roster.
export const TEAM_MEMBERS: TeamMember[] = [
  {
    name: "Phil Duym",
    role: "Owner & President",
    description: "Leading PromoShop's vision for premium branded merchandise.",
    imagePath: "/placeholder-user.jpg",
  },
  {
    name: "Amy Duquette",
    role: "Account Executive",
    description: "Dedicated to delivering exceptional client experiences.",
    imagePath: "/placeholder-user.jpg",
  },
  {
    name: "Ania Wlodarkiewicz",
    role: "Account Executive",
    description: "Helping brands find the perfect promotional products.",
    imagePath: "/placeholder-user.jpg",
  },
  {
    name: "Alex Cyrenne",
    role: "Account Executive",
    description: "Building lasting partnerships with our clients.",
    imagePath: "/placeholder-user.jpg",
  },
]
