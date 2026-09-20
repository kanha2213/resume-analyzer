import { useState, useEffect } from 'react'
import { Shell } from './components/Shell'
import { Dashboard } from './components/Dashboard'
import { Upload } from './components/Upload'
import { Analysis } from './components/Analysis'
import { ScreenTransition } from './components/ScreenTransition'
import { prewarm, type AnalysisResult } from './lib/api'
import { addHistoryEntry, getLatestEntry } from './lib/history'

type Screen = 'dashboard' | 'upload' | 'analysis'

export default function App() {
  const [screen, setScreen] = useState<Screen>('dashboard')
  const [activeResult, setActiveResult] = useState<AnalysisResult | null>(null)
  const [activeFilename, setActiveFilename] = useState<string>('')

  // Wake up the Lambda as soon as the app loads, so the first real upload
  // doesn't pay the full cold-start penalty.
  useEffect(() => {
    prewarm()
  }, [])

  const navigate = (s: Screen) => {
    // "View latest results" from the dashboard needs data to show —
    // load the most recent completed analysis if none is active yet.
    if (s === 'analysis' && !activeResult) {
      const latest = getLatestEntry()
      if (latest) {
        setActiveResult(latest.result)
        setActiveFilename(latest.filename)
      }
    }
    setScreen(s)
  }

  const handleAnalysisComplete = (result: AnalysisResult, filename: string) => {
    addHistoryEntry(filename, result)
    setActiveResult(result)
    setActiveFilename(filename)
    setScreen('analysis')
  }

  return (
    <Shell screen={screen} onNavigate={navigate}>
      <ScreenTransition screenKey={screen}>
        {screen === 'dashboard' && <Dashboard onNavigate={navigate} />}
        {screen === 'upload' && <Upload onNavigate={navigate} onComplete={handleAnalysisComplete} />}
        {screen === 'analysis' && activeResult && (
          <Analysis onNavigate={navigate} result={activeResult} filename={activeFilename} />
        )}
      </ScreenTransition>
    </Shell>
  )
}
