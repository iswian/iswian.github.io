export type ExternalProfileLinkType = "qq" | "music" | "github"
export type ProfileLinkType = ExternalProfileLinkType | "wechat"

export interface ExternalProfileLink {
  type: ExternalProfileLinkType
  name: string
  url: string
}

export interface QrProfileLink {
  type: "wechat"
  name: string
  qrImage: string
  qrAlt: string
  label: string
}

export type ProfileLink = ExternalProfileLink | QrProfileLink

export const profile: {
  name: string
  bio: string
  avatar: string
  links: ProfileLink[]
} = {
  name: "抹茶iswian",
  bio: "探索技术与生活的交汇点",
  avatar: "/avatar.webp",
  links: [
    {
      type: "github",
      name: "GitHub",
      url: "https://github.com/iswian",
    },
  ],
}
