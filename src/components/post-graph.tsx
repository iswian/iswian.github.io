"use client"

import { useEffect, useState } from "react"
import type { PostGraphData } from "@/lib/post-graph"
import { cn } from "@/lib/utils"

type LayoutNode = PostGraphData["nodes"][number] & {
  x: number
  y: number
  vx: number
  vy: number
  color: string
}

type LayoutLink = PostGraphData["links"][number]

const WIDTH = 1280
const HEIGHT = 920
const PALETTE = [
  "#9d6d3f",
  "#845734",
  "#b98754",
  "#6f4d2b",
  "#c59a72",
  "#8f775e",
]

const normalizeQuery = (value: string) => value.trim().toLowerCase()

function runLayout(graph: PostGraphData) {
  const centerX = WIDTH / 2
  const centerY = HEIGHT / 2
  const categories = graph.categories
  const categoryCenters = new Map<string, { x: number; y: number; color: string }>()

  categories.forEach((category, index) => {
    const angle = (index / Math.max(categories.length, 1)) * Math.PI * 2 - Math.PI / 2
    categoryCenters.set(category, {
      x: centerX + Math.cos(angle) * 250,
      y: centerY + Math.sin(angle) * 220,
      color: PALETTE[index % PALETTE.length],
    })
  })

  const nodes: LayoutNode[] = graph.nodes.map((node, index) => {
    const seed = index + 1
    const cluster = node.ghost
      ? { x: centerX, y: centerY, color: "#d9c9b7" }
      : (categoryCenters.get(node.category) ?? { x: centerX, y: centerY, color: "#9d6d3f" })

    const jitterX = ((seed * 97) % 140) - 70
    const jitterY = ((seed * 57) % 140) - 70

    return {
      ...node,
      x: cluster.x + jitterX,
      y: cluster.y + jitterY,
      vx: 0,
      vy: 0,
      color: cluster.color,
    }
  })

  const nodeById = new Map(nodes.map((node) => [node.id, node]))
  const links: LayoutLink[] = graph.links

  for (let step = 0; step < 220; step += 1) {
    for (const node of nodes) {
      const cluster = node.ghost
        ? { x: centerX, y: centerY + 40 }
        : (categoryCenters.get(node.category) ?? { x: centerX, y: centerY })
      const pull = node.ghost ? 0.0014 : 0.0025
      node.vx += (cluster.x - node.x) * pull
      node.vy += (cluster.y - node.y) * pull
    }

    for (let i = 0; i < nodes.length; i += 1) {
      for (let j = i + 1; j < nodes.length; j += 1) {
        const a = nodes[i]
        const b = nodes[j]
        let dx = b.x - a.x
        let dy = b.y - a.y
        let distSq = dx * dx + dy * dy
        if (distSq < 0.01) {
          dx = 0.1
          dy = 0.1
          distSq = 0.02
        }
        const dist = Math.sqrt(distSq)
        const repel = 1300 / distSq
        const collision = Math.max(0, a.radius + b.radius + 10 - dist) * 0.05
        const force = repel + collision
        const fx = (dx / dist) * force
        const fy = (dy / dist) * force
        a.vx -= fx
        a.vy -= fy
        b.vx += fx
        b.vy += fy
      }
    }

    for (const link of links) {
      const source = nodeById.get(link.source)
      const target = nodeById.get(link.target)
      if (!source || !target) continue
      let dx = target.x - source.x
      let dy = target.y - source.y
      let dist = Math.sqrt(dx * dx + dy * dy)
      if (dist < 0.01) dist = 0.01
      const ideal = 64 + (source.radius + target.radius) * 2.4
      const stretch = (dist - ideal) * 0.0038
      const fx = (dx / dist) * stretch
      const fy = (dy / dist) * stretch
      source.vx += fx
      source.vy += fy
      target.vx -= fx
      target.vy -= fy
    }

    for (const node of nodes) {
      node.vx *= 0.84
      node.vy *= 0.84
      node.x = Math.min(WIDTH - 28, Math.max(28, node.x + node.vx))
      node.y = Math.min(HEIGHT - 28, Math.max(28, node.y + node.vy))
    }
  }

  return { nodes, links }
}

export function PostGraph({ graph }: { graph: PostGraphData }) {
  const [layout, setLayout] = useState<{ nodes: LayoutNode[]; links: LayoutLink[] } | null>(null)
  const [query, setQuery] = useState("")
  const [activeId, setActiveId] = useState<string | null>(null)

  useEffect(() => {
    setLayout(runLayout(graph))
    setActiveId((current) => current ?? graph.nodes.find((node) => !node.ghost)?.id ?? null)
  }, [graph])

  const normalizedQuery = normalizeQuery(query)
  const nodes = layout?.nodes ?? []
  const links = layout?.links ?? []
  const activeNode =
    nodes.find((node) => node.id === activeId) ??
    nodes.find((node) => !node.ghost) ??
    null
  const relatedLinks = activeNode
    ? links.filter((link) => link.source === activeNode.id || link.target === activeNode.id)
    : []
  const relatedIds = new Set(
    relatedLinks.flatMap((link) => [link.source, link.target]),
  )
  const neighbors = nodes
    .filter((node) => node.id !== activeNode?.id && relatedIds.has(node.id))
    .sort((a, b) => b.degree - a.degree)
    .slice(0, 12)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <div
            className="text-[11px] uppercase text-muted-foreground"
            style={{ fontFamily: "'Playfair Display', Georgia, serif", letterSpacing: "0.18em" }}
          >
            Graph View
          </div>
          <h1 className="font-serif-cn text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            文章关系图谱
          </h1>
          <p className="max-w-2xl font-serif-cn text-sm leading-7 text-muted-foreground md:text-[15px]">
            节点来自文章本身，连线来自 Markdown 里的相互引用。浅色节点表示站内文章引用到了，但当前未作为已发布文章收录的笔记。
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <Stat value={graph.stats.publishedCount} label="已发布文章" />
          <Stat value={graph.stats.referenceCount} label="引用节点" />
          <Stat value={graph.stats.edgeCount} label="关系连边" />
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-3xl border border-border/70 bg-card/60 p-4 md:flex-row md:items-center md:justify-between md:p-5">
        <label className="flex flex-1 flex-col gap-2 md:max-w-sm">
          <span className="text-xs text-muted-foreground">筛选节点</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="按标题或分类搜索"
            className="h-11 rounded-2xl border border-border bg-background px-4 text-sm outline-none transition-colors focus:border-primary"
          />
        </label>

        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          {graph.categories.slice(0, 6).map((category, index) => (
            <div key={category} className="inline-flex items-center gap-2">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: PALETTE[index % PALETTE.length] }}
              />
              <span>{category}</span>
            </div>
          ))}
          <div className="inline-flex items-center gap-2">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#d9c9b7]" />
            <span>未解析引用</span>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="overflow-hidden rounded-[28px] border border-border/70 bg-[linear-gradient(180deg,#fffdfa_0%,#fffaf2_100%)] shadow-[0_24px_80px_rgba(88,58,24,0.08)]">
          <div className="overflow-x-auto">
            <svg
              viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
              className="h-[720px] min-w-[960px] w-full"
              role="img"
              aria-label="文章关系图谱"
            >
              {links.map((link) => {
                const source = nodes.find((node) => node.id === link.source)
                const target = nodes.find((node) => node.id === link.target)
                if (!source || !target) return null
                const faded =
                  normalizedQuery &&
                  ![source.title, source.category, target.title, target.category].some((value) =>
                    value.toLowerCase().includes(normalizedQuery),
                  )
                return (
                  <line
                    key={`${link.source}-${link.target}`}
                    x1={source.x}
                    y1={source.y}
                    x2={target.x}
                    y2={target.y}
                    stroke={faded ? "rgba(132, 100, 70, 0.10)" : "rgba(132, 100, 70, 0.18)"}
                    strokeWidth={1}
                  />
                )
              })}

              {nodes.map((node) => {
                const matches =
                  !normalizedQuery ||
                  node.title.toLowerCase().includes(normalizedQuery) ||
                  node.category.toLowerCase().includes(normalizedQuery)
                const isActive = node.id === activeNode?.id
                const isNeighbor = relatedIds.has(node.id)
                const faded = normalizedQuery ? !matches : !isActive && activeNode ? !isNeighbor : false

                return (
                  <g
                    key={node.id}
                    transform={`translate(${node.x} ${node.y})`}
                    className={cn("cursor-pointer transition-opacity", faded && "opacity-20")}
                    onMouseEnter={() => setActiveId(node.id)}
                    onClick={() => {
                      setActiveId(node.id)
                      if (node.url) window.location.href = node.url
                    }}
                  >
                    <circle
                      r={isActive ? node.radius + 1.6 : node.radius}
                      fill={node.color}
                      opacity={node.ghost ? 0.72 : 0.96}
                    />
                    <text
                      x={node.radius + 6}
                      y={4}
                      fontSize={node.ghost ? 12 : 13}
                      fill="rgba(58, 37, 17, 0.94)"
                      style={{ fontFamily: "'Noto Serif SC', serif" }}
                    >
                      {node.title.length > 28 ? `${node.title.slice(0, 28)}…` : node.title}
                    </text>
                  </g>
                )
              })}
            </svg>
          </div>
        </div>

        <aside className="rounded-[28px] border border-border/70 bg-card/70 p-5">
          {activeNode ? (
            <div className="space-y-5">
              <div>
                <div className="mb-2 text-[11px] uppercase text-muted-foreground tracking-[0.18em]">
                  Active Node
                </div>
                <h2 className="font-serif-cn text-2xl font-semibold leading-tight text-foreground">
                  {activeNode.title}
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  {activeNode.ghost ? "未解析引用节点" : activeNode.category}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <PanelStat label="连接数" value={String(activeNode.degree)} />
                <PanelStat label="类型" value={activeNode.ghost ? "引用" : "文章"} />
              </div>

              {activeNode.url ? (
                <a
                  href={activeNode.url}
                  className="inline-flex items-center rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
                >
                  打开文章
                </a>
              ) : null}

              <div>
                <div className="mb-3 text-xs text-muted-foreground">直接相连的节点</div>
                <div className="space-y-2">
                  {neighbors.length > 0 ? (
                    neighbors.map((node) =>
                      node.url ? (
                        <a
                          key={node.id}
                          href={node.url}
                          className="block rounded-2xl border border-border/60 bg-background/80 px-4 py-3 text-sm text-foreground transition-colors hover:border-primary/40"
                        >
                          {node.title}
                        </a>
                      ) : (
                        <div
                          key={node.id}
                          className="rounded-2xl border border-border/60 bg-background/70 px-4 py-3 text-sm text-foreground/80"
                        >
                          {node.title}
                        </div>
                      ),
                    )
                  ) : (
                    <div className="rounded-2xl border border-dashed border-border px-4 py-5 text-sm text-muted-foreground">
                      这个节点当前没有可展示的直接连接。
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </aside>
      </div>
    </div>
  )
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-background/70 px-4 py-3">
      <div className="font-serif text-2xl text-foreground">{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{label}</div>
    </div>
  )
}

function PanelStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-background/70 px-4 py-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-sm font-medium text-foreground">{value}</div>
    </div>
  )
}
