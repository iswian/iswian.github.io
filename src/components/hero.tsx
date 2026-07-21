"use client"

import { useEffect, useRef, useState, useCallback } from "react"

export function Hero() {
  const [mounted, setMounted] = useState(false)
  const sectionRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleBrowseClick = useCallback((event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault()
    const target = document.getElementById("home-main")
    if (!target) return
    target.scrollIntoView({ behavior: "smooth", block: "start" })
    if (history.replaceState) {
      history.replaceState({}, "", "#home-main")
    }
  }, [])

  return (
    <section ref={sectionRef} className="relative min-h-[90vh] flex items-center justify-center px-6 bg-muted/30">
      <div className="max-w-4xl mx-auto text-center">
        <div
          className={`transition-all duration-1000 ease-out ${
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <p className="text-xs sm:text-sm tracking-[0.3em] text-muted-foreground uppercase mb-8">
            金融数学 · 量化研究 · 衍生品定价
          </p>

          <h1 className="font-sans text-[min(10.5vw,3rem)] sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight text-foreground leading-[1.1] mb-8">
            抹茶iswian的博客
          </h1>

          <blockquote className="max-w-xl mx-auto mb-10">
            <p className="text-muted-foreground text-base sm:text-lg leading-relaxed italic">
              「我不知道我在想什么，直到我读到我写的东西。」
            </p>
            <footer className="mt-2 text-sm text-muted-foreground/70">
              —— Flannery O'Connor
            </footer>
          </blockquote>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="#home-main"
              onClick={handleBrowseClick}
              className="group flex items-center gap-2 px-8 py-3 bg-foreground text-background rounded-full font-medium text-sm hover:bg-foreground/90 transition-all duration-300"
            >
              浏览文章
              <svg
                className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </a>
            <a
              href="/about/"
              className="px-8 py-3 border border-border rounded-full font-medium text-sm text-foreground hover:border-foreground/40 transition-all duration-300"
            >
              关于我
            </a>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
        <div className="w-px h-12 bg-gradient-to-b from-border to-transparent relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-primary animate-bounce" />
        </div>
      </div>
    </section>
  )
}
