export type ExternalProfileLinkType = "qq" | "music" | "github"
export type ProfileLinkType = ExternalProfileLinkType

export interface ExternalProfileLink {
  type: ExternalProfileLinkType
  name: string
  url: string
}

export type ProfileLink = ExternalProfileLink

export const profile: {
  name: string
  bio: string
  avatar: string
  links: ProfileLink[]
} = {
  name: "iswian",
  bio: "量化韭菜，但很努力",
  avatar: "/avatar.jpg",
  links: [
    {
      type: "github",
      name: "GitHub",
      url: "https://github.com/iswian",
    },
  ],
}
