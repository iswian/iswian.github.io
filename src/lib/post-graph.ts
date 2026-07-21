import { getSortedPosts, type PostEntry } from "@/lib/posts"

export type PostGraphNode = {
  id: string
  title: string
  category: string
  url?: string
  ghost?: boolean
  degree: number
  radius: number
}

export type PostGraphLink = {
  source: string
  target: string
}

export type PostGraphData = {
  nodes: PostGraphNode[]
  links: PostGraphLink[]
  categories: string[]
  stats: {
    publishedCount: number
    referenceCount: number
    edgeCount: number
  }
}

const MARKDOWN_LINK_RE = /(?<!!)\[([^\]]+)\]\(([^)]+)\)/g

const normalizeKey = (input: string) => {
  return decodeURIComponent(input)
    .replace(/\\/g, "/")
    .replace(/[#?].*$/, "")
    .replace(/^\.\//, "")
    .replace(/\/+$/, "")
    .replace(/\.(md|mdx)$/i, "")
    .replace(/^\/posts?\//, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
}

const basename = (input: string) => {
  const clean = input.replace(/\\/g, "/").replace(/\/+$/, "")
  const parts = clean.split("/")
  return parts[parts.length - 1] || clean
}

const readableTitle = (raw: string) => {
  const text = raw.replace(/\.(md|mdx)$/i, "")
  return text.replace(/[-_]/g, " ").trim()
}

const isExternalHref = (href: string) => /^(https?:)?\/\//i.test(href) || /^(mailto|tel):/i.test(href)

const extractMarkdownLinks = (body: string) => {
  const matches: Array<{ label: string; href: string }> = []
  for (const match of body.matchAll(MARKDOWN_LINK_RE)) {
    const label = (match[1] || "").trim()
    const href = (match[2] || "").trim()
    if (!href || href.startsWith("#") || isExternalHref(href)) continue
    matches.push({ label, href })
  }
  return matches
}

const addAlias = (map: Map<string, string>, alias: string, nodeId: string) => {
  const normalized = normalizeKey(alias)
  if (!normalized || map.has(normalized)) return
  map.set(normalized, nodeId)
}

const buildAliasMap = (posts: PostEntry[]) => {
  const aliasMap = new Map<string, string>()

  posts.forEach((post) => {
    const nodeId = `post:${post.slug}`
    addAlias(aliasMap, post.slug, nodeId)
    addAlias(aliasMap, basename(post.slug), nodeId)
    addAlias(aliasMap, post.id, nodeId)
    addAlias(aliasMap, basename(post.id), nodeId)
    addAlias(aliasMap, post.data.title, nodeId)
  })

  return aliasMap
}

const resolveReference = (
  label: string,
  href: string,
  aliasMap: Map<string, string>,
) => {
  const hrefKey = normalizeKey(href)
  const hrefBaseKey = normalizeKey(basename(href))
  const labelKey = normalizeKey(label)

  return (
    aliasMap.get(hrefKey) ||
    aliasMap.get(hrefBaseKey) ||
    aliasMap.get(labelKey) ||
    null
  )
}

const buildGhostId = (label: string, href: string) => {
  const preferred = label || readableTitle(basename(href)) || href
  const key = normalizeKey(preferred || href)
  return {
    id: `ghost:${key}`,
    title: preferred || readableTitle(href),
  }
}

export async function getPostGraphData(): Promise<PostGraphData> {
  const posts = await getSortedPosts(true)
  const aliasMap = buildAliasMap(posts)
  const nodeMap = new Map<string, PostGraphNode>()
  const edgeSet = new Set<string>()

  posts.forEach((post) => {
    const nodeId = `post:${post.slug}`
    nodeMap.set(nodeId, {
      id: nodeId,
      title: post.data.title,
      category: (post.data.category ?? "").toString().trim() || "未分类",
      url: `/posts/${post.slug}/`,
      degree: 0,
      radius: 6,
    })
  })

  posts.forEach((post) => {
    const sourceId = `post:${post.slug}`
    const body = typeof post.body === "string" ? post.body : String(post.body || "")
    const links = extractMarkdownLinks(body)

    links.forEach(({ label, href }) => {
      const resolvedId = resolveReference(label, href, aliasMap)
      let targetId = resolvedId

      if (!targetId) {
        const ghost = buildGhostId(label, href)
        targetId = ghost.id
        if (!nodeMap.has(targetId)) {
          nodeMap.set(targetId, {
            id: targetId,
            title: ghost.title,
            category: "引用",
            ghost: true,
            degree: 0,
            radius: 4,
          })
        }
      }

      if (targetId === sourceId) return

      const edgeId = [sourceId, targetId].sort().join("::")
      if (edgeSet.has(edgeId)) return
      edgeSet.add(edgeId)
    })
  })

  const links = Array.from(edgeSet).map((edgeId) => {
    const [source, target] = edgeId.split("::")
    return { source, target }
  })

  links.forEach((link) => {
    const source = nodeMap.get(link.source)
    const target = nodeMap.get(link.target)
    if (source) source.degree += 1
    if (target) target.degree += 1
  })

  const nodes = Array.from(nodeMap.values()).map((node) => ({
    ...node,
    radius: node.ghost
      ? Math.max(4, Math.min(9, 4 + Math.sqrt(node.degree)))
      : Math.max(6, Math.min(18, 6 + Math.sqrt(node.degree) * 1.6)),
  }))

  const categories = Array.from(
    new Set(nodes.filter((node) => !node.ghost).map((node) => node.category)),
  ).sort((a, b) => a.localeCompare(b))

  return {
    nodes,
    links,
    categories,
    stats: {
      publishedCount: nodes.filter((node) => !node.ghost).length,
      referenceCount: nodes.filter((node) => node.ghost).length,
      edgeCount: links.length,
    },
  }
}
