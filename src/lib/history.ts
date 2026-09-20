// Real, session-persisted history of resume analyses, backed by localStorage.
// Replaces the previous hardcoded "Sarah Chen" demo dataset with genuinely
// completed analyses from this browser. No backend database needed for this scope.

import type { AnalysisResult } from './api'

const STORAGE_KEY = 'resumeai_history_v1'
const MAX_HISTORY_ITEMS = 20

export interface HistoryEntry {
  id: string
  filename: string
  score: number
  date: string // ISO string
  result: AnalysisResult
}

export function getHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function addHistoryEntry(filename: string, result: AnalysisResult): HistoryEntry {
  const entry: HistoryEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    filename,
    score: result.score,
    date: new Date().toISOString(),
    result,
  }

  const existing = getHistory()
  const updated = [entry, ...existing].slice(0, MAX_HISTORY_ITEMS)

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  } catch {
    // localStorage can throw (private browsing, quota exceeded) — history is a
    // convenience feature, not required for the app to function, so fail silently.
  }

  return entry
}

export function getLatestEntry(): HistoryEntry | null {
  const history = getHistory()
  return history.length > 0 ? history[0] : null
}

export function formatRelativeDate(isoString: string): string {
  const date = new Date(isoString)
  const now = new Date()
  const isToday = date.toDateString() === now.toDateString()

  if (isToday) {
    return `Today, ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
  }

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
