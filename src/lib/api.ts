// API client for the ResumeAI backend (AWS Lambda + API Gateway).
// Kept as a dedicated module so the rest of the app never talks to fetch/JSON directly.

const API_URL = "https://lnxm4j4lh7.execute-api.eu-north-1.amazonaws.com/analyze-resume"

export interface Strength {
  title: string
  detail: string
}

export interface Gap {
  title: string
  detail: string
  fix: string
  severity?: 'high' | 'medium' | 'low'
}

export interface Recommendation {
  priority: number
  action: string
  impact: string
  effort?: 'quick' | 'moderate' | 'involved'
}

export interface JdMatch {
  match_percent: number
  matched_keywords: string[]
  missing_keywords: string[]
}

export interface AnalysisResult {
  score: number
  summary: string
  strengths: Strength[]
  gaps: Gap[]
  recommendations: Recommendation[]
  keywords_missing: string[]
  ats_tips: string
  jd_match: JdMatch | null
  _engine?: string
  // Present only on the raw-text fallback path, if the model ever fails to return valid JSON
  raw_analysis?: string
}

export class ApiError extends Error {}

/**
 * Sends a resume file (and optional job description) to the backend and returns
 * the parsed analysis. Throws ApiError with a user-facing message on any failure —
 * network error, validation error (bad file type, blank resume, too large), or
 * an unexpected server error.
 */
export async function analyzeResume(file: File, jobDescription = ''): Promise<AnalysisResult> {
  let base64: string
  try {
    base64 = await fileToBase64(file)
  } catch {
    throw new ApiError('Could not read the file. Try a different file or re-export the PDF.')
  }

  let response: Response
  try {
    response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        file: base64,
        filename: file.name,
        job_description: jobDescription,
      }),
    })
  } catch {
    throw new ApiError('Cannot reach the server. Check your internet connection and try again.')
  }

  let data: any
  try {
    data = await response.json()
  } catch {
    throw new ApiError('The server returned an unexpected response. Please try again.')
  }

  if (!response.ok || !data.success) {
    const message = data.hint ? `${data.error} ${data.hint}` : (data.error || 'Something went wrong. Please try again.')
    throw new ApiError(message)
  }

  return data.analysis as AnalysisResult
}

/** Fires a no-op request to wake up a cold Lambda before the user actually uploads a file. */
export function prewarm(): void {
  fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{}',
  }).catch(() => {
    // Deliberately ignored — this is a best-effort optimization, not a required step.
  })
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      resolve(result.split(',')[1])
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}
