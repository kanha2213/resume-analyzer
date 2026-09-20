// API client for the ResumeAI backend (AWS Lambda + API Gateway).
// Kept as a dedicated module so the rest of the app never talks to
// XMLHttpRequest/fetch/JSON directly.

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
 * Sends a resume file (and optional job description + target role) to the
 * backend and returns the parsed analysis. Throws ApiError with a
 * user-facing message on any failure — network error, validation error
 * (bad file type, blank resume, too large), or an unexpected server error.
 *
 * Uses XMLHttpRequest rather than fetch specifically so real upload-progress
 * events are available via `onUploadProgress`. This is what lets the UI show a
 * genuine 0-100% upload bar instead of an arbitrary fixed-duration animation —
 * the percentage always reflects bytes actually transmitted, nothing fabricated.
 */
export function analyzeResume(
  file: File,
  jobDescription = '',
  targetRole = '',
  onUploadProgress?: (percent: number) => void
): Promise<AnalysisResult> {
  return new Promise((resolve, reject) => {
    fileToBase64(file)
      .catch(() => {
        reject(new ApiError('Could not read the file. Try a different file or re-export the PDF.'))
        return null
      })
      .then(base64 => {
        if (base64 === null) return // already rejected above

        const xhr = new XMLHttpRequest()
        xhr.open('POST', API_URL, true)
        xhr.setRequestHeader('Content-Type', 'application/json')

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable && onUploadProgress) {
            onUploadProgress(Math.round((e.loaded / e.total) * 100))
          }
        }

        xhr.onerror = () => {
          reject(new ApiError('Cannot reach the server. Check your internet connection and try again.'))
        }

        xhr.onload = () => {
          onUploadProgress?.(100)

          let data: any
          try {
            data = JSON.parse(xhr.responseText)
          } catch {
            reject(new ApiError('The server returned an unexpected response. Please try again.'))
            return
          }

          if (xhr.status < 200 || xhr.status >= 300 || !data.success) {
            const message = data.hint ? `${data.error} ${data.hint}` : (data.error || 'Something went wrong. Please try again.')
            reject(new ApiError(message))
            return
          }

          resolve(data.analysis as AnalysisResult)
        }

        xhr.send(JSON.stringify({
          file: base64,
          filename: file.name,
          job_description: jobDescription,
          target_role: targetRole,
        }))
      })
  })
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
