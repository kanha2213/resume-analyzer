import { useState, useEffect } from 'react'
import { Button } from './ui/Button'
import { Badge } from './ui/Badge'
import { Empty } from './ui/Empty'
import { useCountUp } from '../hooks/useCountUp'
import { getHistory, formatRelativeDate, type HistoryEntry } from '../lib/history'

type Screen = 'dashboard' | 'upload' | 'analysis'

interface DashboardProps {
  onNavigate: (screen: Screen) => void
}

function scoreColor(score: number): string {
  if (score >= 85) return '#4A7C59'
  if (score >= 70) return '#171717'
  if (score >= 55) return '#92743A'
  return '#9B3A3A'
}

function ScoreDelta({ current, previous }: { current: number; previous: number }) {
  const delta = current - previous
  if (delta === 0) return null
  const positive = delta > 0
  return (
    <span className={`text-xs font-mono ${positive ? 'text-[#4A7C59]' : 'text-[#9B3A3A]'}`}>
      {positive ? '+' : ''}{delta}
    </span>
  )
}

function AnimatedScore({ score }: { score: number }) {
  const animated = useCountUp(score, 650)
  return (
    <span
      className="text-[64px] leading-none font-mono font-medium"
      style={{ color: scoreColor(score) }}
    >
      {animated}
    </span>
  )
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const [analyzeLoading, setAnalyzeLoading] = useState(false)
  const [history, setHistory] = useState<HistoryEntry[]>([])

  // Read real history from localStorage on mount and whenever we return to
  // this screen — this is genuinely persisted data from completed analyses,
  // not a fixture.
  useEffect(() => {
    setHistory(getHistory())
  }, [])

  const hasAnalyses = history.length > 0
  const latest = history[0]
  const previous = history[1]
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  const handleAnalyzeClick = () => {
    setAnalyzeLoading(true)
    setTimeout(() => {
      setAnalyzeLoading(false)
      onNavigate('upload')
    }, 320)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-12">

      {/* Left column */}
      <div className="flex flex-col gap-8">

        {/* Welcome */}
        <div>
          <p className="text-xs text-[#A3A3A3] uppercase tracking-widest mb-1">{today}</p>
          <h1 className="text-[28px] font-semibold text-[#171717] leading-tight tracking-tight">
            Good {new Date().getHours() < 18 ? 'afternoon' : 'evening'}.
          </h1>
          <p className="mt-1 text-[#737373] text-sm">
            {hasAnalyses
              ? `Your latest resume scored ${latest.score}/100. Here's what to improve.`
              : 'Upload your first resume to get detailed feedback.'}
          </p>
        </div>

        {/* Primary action */}
        <div className="flex items-center gap-3">
          <Button size="lg" loading={analyzeLoading} onClick={handleAnalyzeClick}>
            Analyze Resume
          </Button>
          {hasAnalyses && (
            <Button variant="ghost" size="lg" onClick={() => onNavigate('analysis')}>
              View latest results
            </Button>
          )}
        </div>

        {/* Recent analyses — real history from this browser */}
        <div>
          <h2 className="text-[11px] font-medium text-[#A3A3A3] uppercase tracking-widest mb-4">
            Recent Analyses
          </h2>

          {!hasAnalyses ? (
            <Empty
              message="No resume analyses yet."
              description="Upload your first resume to start getting feedback."
              action={{ label: 'Upload Resume', onClick: () => onNavigate('upload') }}
            />
          ) : (
            <div className="divide-y divide-[#E5E5E5]">
              {history.map((item, i) => (
                <button
                  key={item.id}
                  onClick={() => onNavigate('analysis')}
                  className="w-full flex items-center justify-between py-3.5 group text-left -mx-3 px-3 rounded-[6px] motion-safe:transition-colors motion-safe:duration-150 hover:bg-[#F5F5F4]"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-[4px] bg-[#F5F5F4] border border-[#E5E5E5] flex items-center justify-center flex-shrink-0">
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M3 1h6l3 3v9H3V1z" stroke="#A3A3A3" strokeWidth="1" fill="none" strokeLinejoin="round" />
                        <path d="M9 1v3h3" stroke="#A3A3A3" strokeWidth="1" fill="none" />
                        <path d="M5 6h4M5 8h4M5 10h2" stroke="#A3A3A3" strokeWidth="1" strokeLinecap="round" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[#171717] truncate">{item.filename}</p>
                      <p className="text-xs text-[#A3A3A3]">{formatRelativeDate(item.date)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                    {i === 0 && previous && (
                      <ScoreDelta current={item.score} previous={previous.score} />
                    )}
                    <span className="text-sm font-mono font-medium" style={{ color: scoreColor(item.score) }}>
                      {item.score}
                    </span>
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 12 12"
                      fill="none"
                      className="text-[#D4D4D4] group-hover:text-[#A3A3A3] group-hover:translate-x-[3px] transition-[color,transform] duration-150"
                    >
                      <path d="M4.5 2.5L8 6L4.5 9.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right column */}
      <div className="flex flex-col gap-8 lg:border-l lg:border-[#E5E5E5] lg:pl-10">

        {/* Latest score — real, from the last completed analysis */}
        {hasAnalyses && (
          <div>
            <p className="text-[11px] font-medium text-[#A3A3A3] uppercase tracking-widest mb-4">
              Latest Score
            </p>
            <div className="flex items-end gap-3">
              <AnimatedScore score={latest.score} />
              <div className="mb-2">
                <span className="text-[#A3A3A3] text-sm font-mono">/ 100</span>
                <p className="text-xs text-[#A3A3A3] mt-0.5">Overall Resume Score</p>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <Badge variant="warning">
                {latest.score >= 85 ? 'Strong resume' : latest.score >= 70 ? 'Good, room to improve' : 'Needs improvement'}
              </Badge>
              <span className="text-xs text-[#A3A3A3]">{latest.result.gaps.length} issues found</span>
            </div>
          </div>
        )}

        {/* Latest summary — real text from the model, replaces the fabricated category grid */}
        {hasAnalyses && latest.result.summary && (
          <div>
            <p className="text-[11px] font-medium text-[#A3A3A3] uppercase tracking-widest mb-3">
              Latest Summary
            </p>
            <p className="text-sm text-[#737373] leading-relaxed">{latest.result.summary}</p>
          </div>
        )}

        {/* Strengths from latest analysis — real, not a fabricated activity feed */}
        {hasAnalyses && latest.result.strengths.length > 0 && (
          <div>
            <p className="text-[11px] font-medium text-[#A3A3A3] uppercase tracking-widest mb-4">
              Top Strength
            </p>
            <div className="flex gap-3">
              <div className="w-1 h-1 rounded-full bg-[#4A7C59] mt-2 flex-shrink-0" />
              <div>
                <p className="text-xs font-medium text-[#171717]">{latest.result.strengths[0].title}</p>
                <p className="text-xs text-[#737373] mt-0.5 leading-relaxed">{latest.result.strengths[0].detail}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
