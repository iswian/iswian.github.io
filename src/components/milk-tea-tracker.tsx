"use client"

import { useEffect, useMemo, useState, type FormEvent } from "react"
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Coffee,
  Copy,
  Loader2,
  LockKeyhole,
  LogOut,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react"

type MilkTeaEntry = {
  id: string
  date: string
  brand: string
  drink: string
  sugar: string
  ice: string
  toppings: string
  price: number
  rating: number
  note: string
  createdAt: number
}

type DayCell = {
  date: string
  day: number
  month: number
  inYear: boolean
  isFuture: boolean
}

type Draft = Omit<MilkTeaEntry, "id" | "createdAt" | "price"> & {
  price: string
}

const STORAGE_KEY = "iswian-daily-milk-tea-v1"
const TOKEN_KEY = "iswian-diary-admin-token"
const API_BASE_URL = (import.meta.env.PUBLIC_CWD_API_BASE_URL ?? "").replace(/\/+$/, "")
const WEEKDAY_LABELS = ["一", "", "三", "", "五", "", "日"]
const SUGAR_OPTIONS = ["不另外加糖", "三分糖", "五分糖", "七分糖", "全糖"]
const ICE_OPTIONS = ["热", "去冰", "少冰", "正常冰"]

const pad = (value: number) => String(value).padStart(2, "0")

const toDateKey = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`

const parseDateKey = (value: string) => {
  const [year, month, day] = value.split("-").map(Number)
  return new Date(year, month - 1, day)
}

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("zh-CN", {
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(parseDateKey(value))

const createDraft = (date: string): Draft => ({
  date,
  brand: "",
  drink: "",
  sugar: "五分糖",
  ice: "少冰",
  toppings: "",
  price: "",
  rating: 4,
  note: "",
})

function buildYearGrid(year: number): DayCell[][] {
  const firstDay = new Date(year, 0, 1)
  const mondayOffset = (firstDay.getDay() + 6) % 7
  const gridStart = new Date(year, 0, 1 - mondayOffset)
  const lastDay = new Date(year, 11, 31)
  const sundayOffset = 6 - ((lastDay.getDay() + 6) % 7)
  const gridEnd = new Date(year, 11, 31 + sundayOffset)
  const today = toDateKey(new Date())
  const weeks: DayCell[][] = []

  for (let cursor = new Date(gridStart); cursor <= gridEnd; cursor.setDate(cursor.getDate() + 7)) {
    const week: DayCell[] = []
    for (let offset = 0; offset < 7; offset += 1) {
      const date = new Date(cursor)
      date.setDate(cursor.getDate() + offset)
      const key = toDateKey(date)
      week.push({
        date: key,
        day: date.getDate(),
        month: date.getMonth(),
        inYear: date.getFullYear() === year,
        isFuture: key > today,
      })
    }
    weeks.push(week)
  }

  return weeks
}

function getLevel(count: number) {
  if (count === 0) return 0
  if (count === 1) return 1
  if (count === 2) return 2
  if (count === 3) return 3
  return 4
}

export function MilkTeaTracker() {
  const today = toDateKey(new Date())
  const [entries, setEntries] = useState<MilkTeaEntry[]>([])
  const [selectedDate, setSelectedDate] = useState(today)
  const [year, setYear] = useState(new Date().getFullYear())
  const [draft, setDraft] = useState<Draft>(() => createDraft(today))
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [hydrated, setHydrated] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [authToken, setAuthToken] = useState("")
  const [loginOpen, setLoginOpen] = useState(false)
  const [password, setPassword] = useState("")
  const [authError, setAuthError] = useState("")
  const [apiError, setApiError] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const initialize = async () => {
      let cachedEntries: MilkTeaEntry[] = []
      try {
        const stored = window.localStorage.getItem(STORAGE_KEY)
        if (stored) {
          const parsed = JSON.parse(stored)
          if (Array.isArray(parsed)) cachedEntries = parsed
        }
      } catch {
        // Ignore an unavailable or malformed local cache.
      }

      if (API_BASE_URL) {
        try {
          const response = await fetch(`${API_BASE_URL}/api/diary/milk-tea`)
          if (!response.ok) throw new Error("读取日记失败")
          const payload = await response.json()
          setEntries(Array.isArray(payload?.data) ? payload.data : [])
        } catch {
          setEntries(cachedEntries)
          setApiError("暂时无法连接日记服务，正在显示本机缓存。")
        }
      } else {
        setEntries(cachedEntries)
        setApiError("尚未配置日记服务地址。")
      }

      const storedToken = window.sessionStorage.getItem(TOKEN_KEY) ?? ""
      if (storedToken && API_BASE_URL) {
        try {
          const response = await fetch(`${API_BASE_URL}/admin/diary/session`, {
            headers: { Authorization: `Bearer ${storedToken}` },
          })
          if (response.ok) {
            setAuthToken(storedToken)
            setIsAdmin(true)
          } else {
            window.sessionStorage.removeItem(TOKEN_KEY)
          }
        } catch {
          // Keep the page readable when the API is temporarily unavailable.
        }
      }

      setLoading(false)
      setHydrated(true)
    }
    void initialize()
  }, [])

  useEffect(() => {
    if (!hydrated) return
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
  }, [entries, hydrated])

  const entryCounts = useMemo(() => {
    const counts = new Map<string, number>()
    for (const entry of entries) counts.set(entry.date, (counts.get(entry.date) ?? 0) + 1)
    return counts
  }, [entries])

  const yearEntries = useMemo(
    () => entries.filter((entry) => entry.date.startsWith(`${year}-`)),
    [entries, year],
  )

  const grid = useMemo(() => buildYearGrid(year), [year])
  const selectedEntries = useMemo(
    () =>
      entries
        .filter((entry) => entry.date === selectedDate)
        .sort((a, b) => b.createdAt - a.createdAt),
    [entries, selectedDate],
  )

  const monthLabels = useMemo(() => {
    const labels: { month: number; column: number }[] = []
    grid.forEach((week, column) => {
      const firstInYear = week.find((day) => day.inYear && day.day <= 7)
      if (firstInYear && !labels.some((item) => item.month === firstInYear.month)) {
        labels.push({ month: firstInYear.month, column })
      }
    })
    return labels
  }, [grid])

  const activeDays = new Set(yearEntries.map((entry) => entry.date)).size
  const averageRating = yearEntries.length
    ? (yearEntries.reduce((sum, entry) => sum + entry.rating, 0) / yearEntries.length).toFixed(1)
    : "—"
  const totalSpend = yearEntries.reduce((sum, entry) => sum + (Number(entry.price) || 0), 0)
  const quickPresets = useMemo(() => {
    const seen = new Set<string>()
    return [...entries]
      .sort((a, b) => b.createdAt - a.createdAt)
      .filter((entry) => {
        const signature = [entry.brand, entry.drink, entry.sugar, entry.ice, entry.toppings, entry.price].join("|")
        if (seen.has(signature)) return false
        seen.add(signature)
        return true
      })
      .slice(0, 6)
  }, [entries])

  const selectDay = (date: string) => {
    setSelectedDate(date)
    setDraft(createDraft(date))
    setEditingId(null)
    setFormOpen(false)
  }

  const startAdding = () => {
    if (!isAdmin) {
      setLoginOpen(true)
      return
    }
    setDraft(createDraft(selectedDate))
    setEditingId(null)
    setFormOpen(true)
  }

  const startEditing = (entry: MilkTeaEntry) => {
    if (!isAdmin) {
      setLoginOpen(true)
      return
    }
    const { id, createdAt, price, ...rest } = entry
    void createdAt
    setEditingId(id)
    setDraft({ ...rest, price: price ? String(price) : "" })
    setFormOpen(true)
  }

  const reuseEntry = (entry: MilkTeaEntry) => {
    if (!isAdmin) {
      setLoginOpen(true)
      return
    }
    setDraft({
      date: selectedDate,
      brand: entry.brand,
      drink: entry.drink,
      sugar: entry.sugar,
      ice: entry.ice,
      toppings: entry.toppings ?? "",
      price: entry.price ? String(entry.price) : "",
      rating: entry.rating,
      note: "",
    })
    setEditingId(null)
    setFormOpen(true)
  }

  const saveEntry = async (event: FormEvent) => {
    event.preventDefault()
    if (!draft.drink.trim()) return
    if (!API_BASE_URL || !authToken) {
      setFormOpen(false)
      setLoginOpen(true)
      return
    }

    setSaving(true)
    setApiError("")
    try {
      const body = {
        ...draft,
        ...(editingId ? { id: editingId } : {}),
        price: Number(draft.price) || 0,
      }
      const response = await fetch(`${API_BASE_URL}/admin/diary/milk-tea`, {
        method: editingId ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(body),
      })
      const payload = await response.json()
      if (response.status === 401) {
        logout()
        throw new Error("登录已过期，请重新登录。")
      }
      if (!response.ok || !payload?.data) throw new Error(payload?.message || "保存失败")
      const saved = payload.data as MilkTeaEntry
      setEntries((current) =>
        editingId
          ? current.map((entry) => (entry.id === editingId ? saved : entry))
          : [...current, saved],
      )
      setFormOpen(false)
      setEditingId(null)
      setDraft(createDraft(selectedDate))
    } catch (error) {
      setApiError(error instanceof Error ? error.message : "保存失败")
    } finally {
      setSaving(false)
    }
  }

  const deleteEntry = async (id: string) => {
    if (!isAdmin || !authToken || !API_BASE_URL) {
      setLoginOpen(true)
      return
    }
    setApiError("")
    try {
      const response = await fetch(`${API_BASE_URL}/admin/diary/milk-tea?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${authToken}` },
      })
      if (response.status === 401) {
        logout()
        throw new Error("登录已过期，请重新登录。")
      }
      if (!response.ok) {
        const payload = await response.json()
        throw new Error(payload?.message || "删除失败")
      }
      setEntries((current) => current.filter((entry) => entry.id !== id))
      if (editingId === id) {
        setEditingId(null)
        setFormOpen(false)
      }
    } catch (error) {
      setApiError(error instanceof Error ? error.message : "删除失败")
    }
  }

  const login = async (event: FormEvent) => {
    event.preventDefault()
    if (!API_BASE_URL) {
      setAuthError("尚未配置日记服务。")
      return
    }
    setSaving(true)
    setAuthError("")
    try {
      const response = await fetch(`${API_BASE_URL}/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Admin", password }),
      })
      const payload = await response.json()
      const token = payload?.data?.key
      if (!response.ok || !token) throw new Error("密码不正确")
      window.sessionStorage.setItem(TOKEN_KEY, token)
      setAuthToken(token)
      setIsAdmin(true)
      setPassword("")
      setLoginOpen(false)
      setApiError("")
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "登录失败")
    } finally {
      setSaving(false)
    }
  }

  const logout = () => {
    window.sessionStorage.removeItem(TOKEN_KEY)
    setAuthToken("")
    setIsAdmin(false)
    setFormOpen(false)
    setEditingId(null)
  }

  return (
    <section className="mx-auto max-w-6xl px-6 py-12 md:py-16">
      <div className="mb-10 flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div>
          <div className="mb-3 flex items-center gap-2 text-sm font-medium text-primary">
            <Coffee className="h-4 w-4" />
            日常 · 奶茶足迹
          </div>
          <h1 className="font-serif-cn text-3xl font-semibold tracking-tight text-foreground md:text-5xl">
            今天喝了什么？
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-7 text-muted-foreground md:text-base">
            每一小格都是一天。颜色越深，代表那天喝得越多；点一下日期，就能留下今天的味道。
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isAdmin && (
            <button
              type="button"
              onClick={logout}
              className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2.5 text-sm text-muted-foreground transition hover:bg-secondary hover:text-foreground"
            >
              <LogOut className="h-4 w-4" />
              退出编辑
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              if (!isAdmin) {
                setLoginOpen(true)
                return
              }
              setYear(new Date().getFullYear())
              selectDay(today)
              setFormOpen(true)
            }}
            className="inline-flex w-fit items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90"
          >
            {isAdmin ? <Plus className="h-4 w-4" /> : <LockKeyhole className="h-4 w-4" />}
            {isAdmin ? "记录今天" : "编辑登录"}
          </button>
        </div>
      </div>

      {apiError && (
        <div className="mb-5 rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
          {apiError}
        </div>
      )}

      <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm md:p-7">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setYear((value) => value - 1)}
              className="rounded-lg border border-border p-2 text-muted-foreground transition hover:bg-secondary hover:text-foreground"
              aria-label="上一年"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <strong className="min-w-16 text-center text-lg font-semibold">{year}</strong>
            <button
              type="button"
              onClick={() => setYear((value) => value + 1)}
              disabled={year >= new Date().getFullYear()}
              className="rounded-lg border border-border p-2 text-muted-foreground transition hover:bg-secondary hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
              aria-label="下一年"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <div className="flex items-center gap-5 text-sm text-muted-foreground">
            <span><b className="text-foreground">{yearEntries.length}</b> 杯</span>
            <span><b className="text-foreground">{activeDays}</b> 天</span>
            <span><b className="text-foreground">¥{totalSpend.toFixed(2)}</b> 花费</span>
            <span><b className="text-foreground">{averageRating}</b> 均分</span>
          </div>
        </div>

        <div className="overflow-x-auto pb-2">
          <div className="min-w-[760px]">
            <div className="relative ml-8 h-5 text-[10px] text-muted-foreground">
              {monthLabels.map(({ month, column }) => (
                <span
                  key={month}
                  className="absolute top-0"
                  style={{ left: `${column * 14}px` }}
                >
                  {month + 1}月
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <div className="grid h-[96px] w-6 grid-rows-7 gap-[3px] text-[10px] text-muted-foreground">
                {WEEKDAY_LABELS.map((label, index) => (
                  <span key={index} className="flex h-[11px] items-center">{label}</span>
                ))}
              </div>
              <div className="flex gap-[3px]" role="grid" aria-label={`${year} 年奶茶记录`}>
                {grid.map((week, weekIndex) => (
                  <div key={weekIndex} className="grid grid-rows-7 gap-[3px]">
                    {week.map((day) => {
                      const count = entryCounts.get(day.date) ?? 0
                      const disabled = !day.inYear || day.isFuture
                      const selected = day.date === selectedDate
                      return (
                        <button
                          key={day.date}
                          type="button"
                          disabled={disabled}
                          onClick={() => selectDay(day.date)}
                          data-level={disabled ? "outside" : getLevel(count)}
                          className={`milk-tea-cell h-[11px] w-[11px] rounded-[3px] transition ${
                            selected ? "ring-2 ring-primary ring-offset-2 ring-offset-card" : ""
                          }`}
                          title={
                            disabled
                              ? ""
                              : `${day.date} · ${count ? `${count} 杯奶茶` : "没有记录"}`
                          }
                          aria-label={`${day.date}，${count ? `${count} 杯奶茶` : "没有记录"}`}
                        />
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-end gap-2 text-xs text-muted-foreground">
          <span>少</span>
          {[0, 1, 2, 3, 4].map((level) => (
            <span key={level} data-level={level} className="milk-tea-cell h-[11px] w-[11px] rounded-[3px]" />
          ))}
          <span>多</span>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_0.9fr]">
        <div className="rounded-2xl border border-border/70 bg-card p-6">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <CalendarDays className="h-4 w-4" />
                {selectedDate}
              </div>
              <h2 className="mt-1 text-xl font-semibold">{formatDate(selectedDate)}</h2>
            </div>
            <button
              type="button"
              onClick={startAdding}
              className="inline-flex items-center gap-2 rounded-lg border border-primary/30 px-3 py-2 text-sm font-medium text-primary transition hover:bg-primary/10"
            >
              <Plus className="h-4 w-4" />
              加一杯
            </button>
          </div>

          {loading ? (
            <div className="flex min-h-44 items-center justify-center text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : selectedEntries.length ? (
            <div className="space-y-3">
              {selectedEntries.map((entry) => (
                <article key={entry.id} className="group rounded-xl border border-border/70 bg-background/60 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-medium text-foreground">{entry.drink}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {[entry.brand, entry.sugar, entry.ice].filter(Boolean).join(" · ")}
                      </p>
                      {(entry.toppings || entry.price > 0) && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {[entry.toppings ? `小料：${entry.toppings}` : "", entry.price > 0 ? `¥${entry.price.toFixed(2)}` : ""]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                      )}
                    </div>
                    {isAdmin && (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => reuseEntry(entry)}
                          className="rounded-md p-2 text-muted-foreground transition hover:bg-primary/10 hover:text-primary"
                          aria-label={`复用 ${entry.drink}`}
                          title="再来一杯"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => startEditing(entry)}
                          className="rounded-md p-2 text-muted-foreground transition hover:bg-secondary hover:text-foreground"
                          aria-label={`编辑 ${entry.drink}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => void deleteEntry(entry.id)}
                          className="rounded-md p-2 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                          aria-label={`删除 ${entry.drink}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="mt-3 flex items-center gap-1 text-amber-500" aria-label={`${entry.rating} 分`}>
                    {Array.from({ length: 5 }, (_, index) => (
                      <span key={index} className={index < entry.rating ? "" : "opacity-20"}>★</span>
                    ))}
                  </div>
                  {entry.note && <p className="mt-3 text-sm leading-6 text-muted-foreground">{entry.note}</p>}
                </article>
              ))}
            </div>
          ) : (
            <div className="flex min-h-44 flex-col items-center justify-center rounded-xl border border-dashed border-border text-center">
              <Coffee className="mb-3 h-8 w-8 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">这一天还没有奶茶记录</p>
              <button type="button" onClick={startAdding} className="mt-2 text-sm font-medium text-primary">
                {isAdmin ? "记下第一杯" : "登录后记录"}
              </button>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-border/70 bg-card p-6">
          {formOpen ? (
            <form onSubmit={saveEntry}>
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{selectedDate}</p>
                  <h2 className="mt-1 text-xl font-semibold">{editingId ? "编辑这一杯" : "今天喝了什么"}</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setFormOpen(false)}
                  className="rounded-lg p-2 text-muted-foreground transition hover:bg-secondary hover:text-foreground"
                  aria-label="关闭表单"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-4">
                {quickPresets.length > 0 && !editingId && (
                  <div>
                    <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                      <Copy className="h-4 w-4 text-primary" />
                      快捷复用
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {quickPresets.map((preset) => (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => reuseEntry(preset)}
                          className="shrink-0 rounded-lg border border-border bg-background px-3 py-2 text-left transition hover:border-primary/40 hover:bg-primary/5"
                        >
                          <span className="block max-w-32 truncate text-sm font-medium">{preset.drink}</span>
                          <span className="mt-0.5 block max-w-32 truncate text-xs text-muted-foreground">
                            {preset.brand || "未填品牌"}{preset.price > 0 ? ` · ¥${preset.price}` : ""}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium">口味 / 奶茶名称 *</span>
                  <input
                    required
                    value={draft.drink}
                    onChange={(event) => setDraft({ ...draft, drink: event.target.value })}
                    placeholder="例如：伯牙绝弦"
                    className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium">品牌 / 店铺</span>
                  <input
                    value={draft.brand}
                    onChange={(event) => setDraft({ ...draft, brand: event.target.value })}
                    placeholder="例如：霸王茶姬"
                    className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
                  />
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <label>
                    <span className="mb-1.5 block text-sm font-medium">甜度</span>
                    <select
                      value={draft.sugar}
                      onChange={(event) => setDraft({ ...draft, sugar: event.target.value })}
                      className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
                    >
                      {SUGAR_OPTIONS.map((option) => <option key={option}>{option}</option>)}
                    </select>
                  </label>
                  <label>
                    <span className="mb-1.5 block text-sm font-medium">温度</span>
                    <select
                      value={draft.ice}
                      onChange={(event) => setDraft({ ...draft, ice: event.target.value })}
                      className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
                    >
                      {ICE_OPTIONS.map((option) => <option key={option}>{option}</option>)}
                    </select>
                  </label>
                </div>

                <div className="grid grid-cols-[1fr_0.65fr] gap-3">
                  <label>
                    <span className="mb-1.5 block text-sm font-medium">小料</span>
                    <input
                      value={draft.toppings}
                      onChange={(event) => setDraft({ ...draft, toppings: event.target.value })}
                      placeholder="珍珠、椰果…"
                      className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
                    />
                  </label>
                  <label>
                    <span className="mb-1.5 block text-sm font-medium">价格</span>
                    <div className="relative">
                      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">¥</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        inputMode="decimal"
                        value={draft.price}
                        onChange={(event) => setDraft({ ...draft, price: event.target.value })}
                        placeholder="0.00"
                        className="w-full rounded-lg border border-input bg-background py-2.5 pl-7 pr-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
                      />
                    </div>
                  </label>
                </div>

                <fieldset>
                  <legend className="mb-1.5 text-sm font-medium">好喝程度</legend>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <button
                        key={rating}
                        type="button"
                        onClick={() => setDraft({ ...draft, rating })}
                        className={`text-2xl transition hover:scale-110 ${
                          rating <= draft.rating ? "text-amber-500" : "text-muted-foreground/20"
                        }`}
                        aria-label={`${rating} 分`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </fieldset>

                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium">随手记</span>
                  <textarea
                    rows={3}
                    value={draft.note}
                    onChange={(event) => setDraft({ ...draft, note: event.target.value })}
                    placeholder="今天这杯是什么味道？"
                    className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
                  />
                </label>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-wait disabled:opacity-60"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {editingId ? "保存修改" : "保存这一杯"}
              </button>
            </form>
          ) : (
            <div className="flex h-full min-h-80 flex-col items-center justify-center text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Coffee className="h-6 w-6" />
              </div>
              <h2 className="text-lg font-semibold">点亮今天的小格子</h2>
              <p className="mt-2 max-w-xs text-sm leading-6 text-muted-foreground">
                选中上方任意一天，再记下当天喝过的奶茶。记录会安全保存到日记数据库，并在所有设备上同步展示。
              </p>
              <button
                type="button"
                onClick={startAdding}
                className="mt-5 inline-flex items-center gap-2 rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-foreground transition hover:bg-primary/10 hover:text-primary"
              >
                {isAdmin ? <Plus className="h-4 w-4" /> : <LockKeyhole className="h-4 w-4" />}
                {isAdmin ? `记录 ${formatDate(selectedDate)}` : "登录后编辑"}
              </button>
            </div>
          )}
        </div>
      </div>

      {loginOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-background/75 px-6 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="diary-login-title"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setLoginOpen(false)
          }}
        >
          <form onSubmit={login} className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <LockKeyhole className="h-5 w-5" />
                </div>
                <h2 id="diary-login-title" className="text-xl font-semibold">日记编辑登录</h2>
                <p className="mt-1 text-sm text-muted-foreground">访客可以阅读，只有管理员能够修改记录。</p>
              </div>
              <button
                type="button"
                onClick={() => setLoginOpen(false)}
                className="rounded-lg p-2 text-muted-foreground transition hover:bg-secondary hover:text-foreground"
                aria-label="关闭登录"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium">管理员密码</span>
              <input
                type="password"
                autoFocus
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="输入密码"
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
              />
            </label>
            {authError && <p className="mt-2 text-sm text-destructive">{authError}</p>}
            <button
              type="submit"
              disabled={!password || saving}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              登录编辑
            </button>
          </form>
        </div>
      )}

      <style>{`
        .milk-tea-cell[data-level="outside"] {
          background: transparent;
          cursor: default;
        }
        .milk-tea-cell[data-level="0"] {
          background: color-mix(in oklab, var(--muted), var(--border) 30%);
        }
        .milk-tea-cell[data-level="1"] {
          background: oklch(0.86 0.075 195);
        }
        .milk-tea-cell[data-level="2"] {
          background: oklch(0.73 0.12 190);
        }
        .milk-tea-cell[data-level="3"] {
          background: oklch(0.60 0.145 185);
        }
        .milk-tea-cell[data-level="4"] {
          background: oklch(0.47 0.14 180);
        }
        .milk-tea-cell:not(:disabled):hover {
          outline: 2px solid color-mix(in oklab, var(--primary), transparent 35%);
          outline-offset: 1px;
        }
        .dark .milk-tea-cell[data-level="0"] {
          background: color-mix(in oklab, var(--muted), white 4%);
        }
      `}</style>
    </section>
  )
}
