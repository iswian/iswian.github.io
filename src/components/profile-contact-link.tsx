"use client"

import { Github, Music } from "lucide-react"
import { IconBrandWechat } from "@tabler/icons-react"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useIsMobile } from "@/hooks/use-mobile"
import { type ProfileLink } from "@/data/profile"
import { QqIcon } from "@/components/icons/qq-icon"

const iconMap = {
  qq: QqIcon,
  music: Music,
  github: Github,
  wechat: IconBrandWechat,
}

interface ProfileContactLinkProps {
  link: ProfileLink
  className: string
  iconClassName: string
}

function WechatQrCard({ image, alt, label }: { image: string; alt: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <div className="w-32 h-32 overflow-hidden rounded-xl border border-border bg-background p-2">
        <img src={image} alt={alt} className="w-full h-full object-cover rounded-lg" loading="lazy" decoding="async" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">打开微信扫一扫即可</p>
      </div>
    </div>
  )
}

export function ProfileContactLink({ link, className, iconClassName }: ProfileContactLinkProps) {
  const Icon = iconMap[link.type]
  const isMobile = useIsMobile()

  if (link.type !== "wechat") {
    return (
      <a
        href={link.url}
        target="_blank"
        rel="noreferrer"
        className={className}
        aria-label={link.name}
      >
        <Icon className={iconClassName} />
      </a>
    )
  }

  const trigger = (
    <button type="button" className={className} aria-label={link.name}>
      <Icon className={iconClassName} />
    </button>
  )

  if (isMobile) {
    return (
      <Popover>
        <PopoverTrigger asChild>{trigger}</PopoverTrigger>
        <PopoverContent className="w-52 rounded-2xl p-4">
          <WechatQrCard image={link.qrImage} alt={link.qrAlt} label={link.label} />
        </PopoverContent>
      </Popover>
    )
  }

  return (
    <HoverCard openDelay={120} closeDelay={120}>
      <HoverCardTrigger asChild>{trigger}</HoverCardTrigger>
      <HoverCardContent className="w-52 rounded-2xl p-4">
        <WechatQrCard image={link.qrImage} alt={link.qrAlt} label={link.label} />
      </HoverCardContent>
    </HoverCard>
  )
}
