"use client"

import type { TeamMember } from "@/lib/cms/team"
import { SiteImage } from "@/components/site-image"
import { teamImageId } from "@/lib/image-registry"
import { useImageSrc } from "@/hooks/use-image-src"

interface TeamMemberAvatarProps {
  member: TeamMember
  size: number
}

export function TeamMemberAvatar({ member, size }: TeamMemberAvatarProps) {
  const id = teamImageId(member.name)
  const src = useImageSrc(id, member.imagePath ?? "")

  if (src) {
    return (
      <SiteImage
        imageId={id}
        defaultSrc={member.imagePath ?? ""}
        alt={member.name}
        width={size}
        height={size}
        className="w-full h-full object-cover rounded-full"
      />
    )
  }

  return (
    <span className="font-montserrat font-bold text-2xl text-[#ef473f]">
      {member.name
        .split(" ")
        .map((n) => n[0])
        .join("")}
    </span>
  )
}
