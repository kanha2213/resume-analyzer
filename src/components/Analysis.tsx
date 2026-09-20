import { useState } from 'react'
import { Button } from './ui/Button'
import { Badge } from './ui/Badge'
import { Section } from './ui/Section'
import type { AnalysisResult, Gap, Strength, Recommendation } from '../lib/api'
import { formatRelativeDate } from '../lib/history'

type Screen = 'dashboard' | 'upload' | 'analysis'

interface AnalysisProps {
  onNavigate: (screen: Screen) => void
  result: AnalysisResult
  filename: string
}

type Severity = 'high' | 'medium' | 'low'

const severityColor: Record<Severity, string> = {
  high: '#9B3A3A',
  medium: '#92743A',
  low: '#4A7C59',
}

const severityLabel: Record<Severity, string> = {
  high: 'High',
  medium: 'Medium',
  low: 'Low',
}

const effortLabel: Record<string, string> = {
  quick: 'Quick fix',
  moderate: '30–60 min',
  involved: '2+ hours',
}

function scoreColor(score: number): string {
  if (score >= 85) return '#4A7C59'
  if (score >= 70) return '#171717'
  if (score >= 55) return '#92743A'
  return '#9B3A3A'
}

function scoreBadge(score: number): { label: string; variant: 'success' | 'warning' } {
  if (score >= 85) return { label: 'Strong resume', variant: 'success' }
  if (score >= 70) return { label: 'Good, room to improve', variant: 'warning' }
  if (score >= 55) return { label: 'Needs improvement', variant: 'warning' }
  return { label: 'Significant gaps', variant: 'warning' }
}

function GapItem({ gap }: { gap: Gap }) {
  const [expanded, setExpanded] = useState(false)
  const severity = gap.severity

  return (
    <div
      className="py-4 border-t border-[#E5E5E5] first:border-t-0 cursor-pointer"
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
          style={{ backgroundColor: severity ? severityColor[severity] : '#A3A3A3' }}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm font-medium text-[#171717] leading-snug">{gap.title}</p>
            <div className="flex items-center gap-2 flex-shrink-0">
              {severity && (
                <span className="text-[11px]" style={{ color: severityColor[severity] }}>
                  {severityLabel[severity]}
                </span>
              )}
              <svg
                width="12" height="12" viewBox="0 0 12 12" fill="none"
                className={`text-[#D4D4D4] transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
              >
                <path d="M2 4.5L6 8L10 4.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>

          {expanded && (
            <div className="mt-3 space-y-3">
              <p className="text-sm text-[#737373] leading-relaxed">{gap.detail}</p>
              <div
                className="bg-[#F5F5F4] rounded-[6px] p-3 border-l-2"
                style={{ borderColor: severity ? severityColor[severity] : '#D4D4D4' }}
              >
                <p className="text-[11px] font-medium text-[#A3A3A3] uppercase tracking-wider mb-1">How to fix</p>
                <p className="text-xs text-[#737373] leading-relaxed">{gap.fix}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StrengthItem({ strength }: { strength: Strength }) {
  return (
    <div className="py-3.5 border-t border-[#E5E5E5] first:border-t-0">
      <div className="flex items-start gap-3">
        <div className="w-1.5 h-1.5 rounded-full mt-1.5 bg-[#4A7C59] flex-shrink-0" />
        <div>
          <p className="text-sm font-medium text-[#171717]">{strength.title}</p>
          <p className="text-xs text-[#737373] mt-0.5 leading-relaxed">{strength.detail}</p>
        </div>
      </div>
    </div>
  )
}

function RecommendationItem({ rec, index }: { rec: Recommendation; index: number }) {
  return (
    <div className="py-4 border-t border-[#E5E5E5] first:border-t-0">
      <div className="flex items-start gap-3">
        <span className="text-[11px] font-mono text-[#A3A3A3] mt-0.5 w-4 flex-shrink-0">{index + 1}.</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm font-medium text-[#171717]">{rec.action}</p>
            {rec.effort && (
              <Badge variant="neutral" className="flex-shrink-0">{effortLabel[rec.effort]}</Badge>
            )}
          </div>
          <p className="text-xs text-[#737373] mt-1.5 leading-relaxed">{rec.impact}</p>
        </div>
      </div>
    </div>
  )
}

export function Analysis({ onNavigate, result, filename }: AnalysisProps) {
  // If the LLM path ever fails to return structured JSON at all, the backend
  // sends back a raw_analysis string as a last-resort fallback. Handle that
  // degraded case explicitly rather than letting the rest of this component crash.
  if (!result || result.raw_analysis) {
    return (
      <div className="max-w-[800px]">
        <button
          onClick={() => onNavigate('dashboard')}
          className="flex items-center gap-1.5 text-[#737373] hover:text-[#171717] text-xs mb-6 transition-colors duration-150"
        >
          Dashboard
        </button>
        <h1 className="text-[28px] font-semibold text-[#171717] mb-4">Analysis</h1>
        <div className="border border-[#E5E5E5] rounded-[8px] p-6 whitespace-pre-wrap text-sm text-[#737373]">
          {result?.raw_analysis || 'No analysis available.'}
        </div>
        <div className="mt-6">
          <Button variant="primary" size="md" onClick={() => onNavigate('upload')}>
            Analyze another resume
          </Button>
        </div>
      </div>
    )
  }

  const badge = scoreBadge(result.score)

  return (
    <div className="max-w-[1200px]">
      {/* Header */}
      <div className="flex items-start justify-between mb-8 gap-4 flex-wrap">
        <div>
          <button
            onClick={() => onNavigate('dashboard')}
            className="flex items-center gap-1.5 text-[#737373] hover:text-[#171717] text-xs mb-4 transition-colors duration-150"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M7.5 2.5L4 6L7.5 9.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Dashboard
          </button>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-[4px] bg-[#F5F5F4] border border-[#E5E5E5] flex items-center justify-center flex-shrink-0">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M3 1h6l3 3v9H3V1z" stroke="#A3A3A3" strokeWidth="1" fill="none" strokeLinejoin="round" />
                <path d="M9 1v3h3" stroke="#A3A3A3" strokeWidth="1" fill="none" />
                <path d="M5 6h4M5 8h4M5 10h2" stroke="#A3A3A3" strokeWidth="1" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-[#171717] tracking-tight">{filename}</h1>
              <p className="text-xs text-[#A3A3A3]">
                Analyzed {formatRelativeDate(new Date().toISOString())}
                {result._engine === 'rule-based-fallback' ? ' · Heuristic analysis (AI temporarily unavailable)' : ''}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => onNavigate('upload')}>
            Re-analyze
          </Button>
        </div>
      </div>

      {/* Score + summary */}
      <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-10 pb-10 border-b border-[#E5E5E5] mb-10">
        {/* Score */}
        <div className="flex flex-col gap-2">
          <p className="text-[11px] font-medium text-[#A3A3A3] uppercase tracking-widest">Overall Score</p>
          <div className="flex items-end gap-2">
            <span
              className="text-[72px] leading-none font-mono font-medium tracking-tighter"
              style={{ color: scoreColor(result.score) }}
            >
              {result.score}
            </span>
            <span className="text-[#A3A3A3] font-mono text-lg mb-2">/ 100</span>
          </div>
          <Badge variant={badge.variant}>{badge.label}</Badge>
          <p className="text-xs text-[#A3A3A3] mt-1">{result.gaps.length} issues · {result.strengths.length} strengths</p>
        </div>

        {/* Summary + JD match (real data only — no fabricated category scores) */}
        <div>
          <p className="text-[11px] font-medium text-[#A3A3A3] uppercase tracking-widest mb-3">Summary</p>
          <p className="text-sm text-[#737373] leading-relaxed max-w-[560px]">{result.summary}</p>

          {result.jd_match && (
            <div className="mt-6">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-xs text-[#737373]">Job Description Match</span>
                <span className="text-xs font-mono font-medium" style={{ color: scoreColor(result.jd_match.match_percent) }}>
                  {result.jd_match.match_percent}%
                </span>
              </div>
              <div className="h-[3px] w-full max-w-[320px] bg-[#E5E5E5] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${result.jd_match.match_percent}%`, backgroundColor: scoreColor(result.jd_match.match_percent) }}
                />
              </div>
              {result.jd_match.missing_keywords.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {result.jd_match.missing_keywords.slice(0, 6).map(kw => (
                    <span key={kw} className="text-[11px] px-2 py-0.5 rounded-full bg-[#F5F5F4] border border-[#E5E5E5] text-[#737373]">
                      + {kw}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {result.keywords_missing.length > 0 && (
            <div className="mt-6">
              <p className="text-xs text-[#737373] mb-2">Consider adding these keywords:</p>
              <div className="flex flex-wrap gap-1.5">
                {result.keywords_missing.slice(0, 8).map(kw => (
                  <span key={kw} className="text-[11px] px-2 py-0.5 rounded-full bg-[#F5F5F4] border border-[#E5E5E5] text-[#737373]">
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main content: two columns */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-12">

        {/* Left: issues + strengths */}
        <div>
          <Section title="Issues to Fix" count={result.gaps.length} defaultOpen={true}>
            <div className="flex flex-col">
              {result.gaps.map((gap, i) => (
                <GapItem key={i} gap={gap} />
              ))}
            </div>
          </Section>

          <Section title="Strengths" count={result.strengths.length} defaultOpen={true}>
            <div className="flex flex-col">
              {result.strengths.map((strength, i) => (
                <StrengthItem key={i} strength={strength} />
              ))}
            </div>
          </Section>
        </div>

        {/* Right: recommendations */}
        <div className="lg:border-l lg:border-[#E5E5E5] lg:pl-10">
          <div className="mb-6">
            <p className="text-[11px] font-medium text-[#A3A3A3] uppercase tracking-widest mb-1">
              Recommendations
            </p>
            <p className="text-xs text-[#737373]">Prioritized by impact. Start with #1.</p>
          </div>

          <div className="flex flex-col">
            {result.recommendations
              .slice()
              .sort((a, b) => a.priority - b.priority)
              .map((rec, i) => (
                <RecommendationItem key={i} rec={rec} index={i} />
              ))}
          </div>

          {/* ATS notice — real text from the model, not a fabricated score */}
          {result.ats_tips && (
            <div className="mt-8 p-4 bg-[#F5F5F4] rounded-[6px] border border-[#E5E5E5]">
              <p className="text-xs font-medium text-[#737373] mb-1">ATS Optimization</p>
              <p className="text-xs text-[#737373] leading-relaxed mt-2">{result.ats_tips}</p>
            </div>
          )}

          {/* Next action */}
          <div className="mt-6">
            <Button variant="primary" size="md" className="w-full" onClick={() => onNavigate('upload')}>
              Upload updated resume
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
