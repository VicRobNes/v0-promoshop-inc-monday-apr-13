"use client"

import { useEffect, useState } from "react"
import { TEAM_MEMBERS, type TeamMember } from "@/lib/cms/team"
import { readTeamOverride, OVERRIDE_KEYS } from "@/lib/admin-overrides"

/**
 * Returns the team roster the admin has configured via the dashboard,
 * falling back to the compiled-in `TEAM_MEMBERS` seed when no override
 * exists. Re-renders when the override changes in another tab.
 */
export function useTeamMembers(): TeamMember[] {
  const [members, setMembers] = useState<TeamMember[]>(TEAM_MEMBERS)

  useEffect(() => {
    const sync = () => {
      const override = readTeamOverride()
      setMembers(override && override.length > 0 ? override : TEAM_MEMBERS)
    }
    sync()
    const handler = (e: StorageEvent) => {
      if (e.key === OVERRIDE_KEYS.team) sync()
    }
    window.addEventListener("storage", handler)
    return () => window.removeEventListener("storage", handler)
  }, [])

  return members
}
