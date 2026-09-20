import { useState, useRef, DragEvent, ChangeEvent } from 'react'
import { analyzeResume, ApiError, type AnalysisResult } from '../lib/api'
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion'

type Screen = 'dashboard' | 'upload' | 'analysis'
// 'processing' covers both PDF parsing and AI analysis. The backend does this
// as a single atomic Lambda call, so the client genuinely cannot observe which
// finished first — showing separate fake timings for them would violate the
// "never mark a step done before its actual work has finished" rule. Both
// visual rows for that phase animate together and complete together, honestly.
type UploadState = 'idle' | 'dragover' | 'uploading' | 'processing' | 'error'

const MAX_FILE_SIZE_MB = 5
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024
// Kept in sync with the backend's ALLOWED_EXTENSIONS — the API rejects .docx,
// so it isn't offered here either. Promising a format the server can't handle
// would just produce a confusing round-trip error.
const ALLOWED_EXTENSIONS = ['.pdf', '.txt']

interface UploadProps {
  onNavigate: (screen: Screen) => void
  onComplete: (result: AnalysisResult, filename: string) => void
}

function ProgressStep({ label, active, done }: { label: string; active: boolean; done: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div className={[
        'w-4 h-4 rounded-full border flex items-center justify-center',
        'motion-safe:transition-all motion-safe:duration-300',
        done ? 'border-[#171717] bg-[#171717]' : active ? 'border-[#171717] bg-transparent' : 'border-[#D4D4D4] bg-transparent',
      ].join(' ')}>
        {done && (
          <svg
            width="8" height="8" viewBox="0 0 8 8" fill="none"
            className="motion-safe:animate-[checkmark-in_150ms_ease-out_both]"
          >
            <path d="M1.5 4L3 5.5L6.5 2" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
        {active && !done && (
          <div className="w-1.5 h-1.5 rounded-full bg-[#171717] animate-pulse" />
        )}
      </div>
      <span className={`text-xs motion-safe:transition-colors motion-safe:duration-150 ${done || active ? 'text-[#171717]' : 'text-[#A3A3A3]'}`}>
        {label}
      </span>
    </div>
  )
}

export function Upload({ onNavigate, onComplete }: UploadProps) {
  const [state, setState] = useState<UploadState>('idle')
  const [filename, setFilename] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [uploadPercent, setUploadPercent] = useState(0)
  const [jobDescription, setJobDescription] = useState('')
  const [targetRole, setTargetRole] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const prefersReduced = usePrefersReducedMotion()

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setState('idle') // returns to non-dragover styling immediately; the existing
                      // 150ms transition on scale/border handles the "settle back" motion
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }

  const validateFile = (file: File): string | null => {
    const ext = '.' + (file.name.split('.').pop() || '').toLowerCase()
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return `Unsupported file format (${ext}). Please upload a PDF or TXT file.`
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1)
      return `File too large (${sizeMB} MB). Maximum size is ${MAX_FILE_SIZE_MB} MB.`
    }
    return null
  }

  const processFile = (file: File) => {
    const validationError = validateFile(file)
    if (validationError) {
      setError(validationError)
      setState('error')
      return
    }
    setFilename(file.name)
    setError('')
    runAnalysis(file)
  }

  const runAnalysis = async (file: File) => {
    setState('uploading')
    setUploadPercent(0)
    try {
      const result = await analyzeResume(file, jobDescription, targetRole, (percent) => {
        setUploadPercent(percent)
        // The instant every byte is actually sent, move to the processing
        // phase — this is a real signal from the browser, not a guess.
        if (percent >= 100) {
          setState('processing')
        }
      })
      onComplete(result, file.name)
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Something went wrong. Please try again.'
      setError(message)
      setState('error')
    }
  }

  const isProcessing = state === 'uploading' || state === 'processing'
  const isDragover = state === 'dragover'

  return (
    <div className="max-w-[560px] mx-auto">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => onNavigate('dashboard')}
          className="flex items-center gap-1.5 text-[#737373] hover:text-[#171717] text-xs mb-6 motion-safe:transition-colors motion-safe:duration-150"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M7.5 2.5L4 6L7.5 9.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Dashboard
        </button>
        <h1 className="text-[28px] font-semibold text-[#171717] leading-tight tracking-tight">
          Analyze Resume
        </h1>
        <p className="mt-1.5 text-sm text-[#737373]">
          Upload your resume and get detailed feedback in seconds.
        </p>
      </div>

      {/* Upload zone */}
      {!isProcessing && (
        <>
          <div
            onDragOver={(e) => { e.preventDefault(); setState('dragover') }}
            onDragLeave={() => setState('idle')}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={[
              'relative border rounded-[8px] cursor-pointer',
              'motion-safe:transition-[border-color,background-color,transform] motion-safe:duration-150',
              'flex flex-col items-center justify-center py-16 px-8 text-center',
              isDragover && !prefersReduced ? 'scale-[1.01]' : 'scale-100',
              isDragover
                ? 'border-[#171717] bg-[#F5F5F4]'
                : state === 'error'
                  ? 'border-[#9B3A3A] bg-[#FBF0F0]'
                  : 'border-dashed border-[#D4D4D4] bg-[#FFFFFF] hover:border-[#A3A3A3] hover:bg-[#FAFAF9]',
            ].join(' ')}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.txt"
              onChange={handleFileChange}
              className="hidden"
            />

            {state === 'error' ? (
              <>
                <div className="w-10 h-10 rounded-full border border-[#9B3A3A] flex items-center justify-center mb-4">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M8 5v4M8 11v.5" stroke="#9B3A3A" strokeWidth="1.5" strokeLinecap="round" />
                    <circle cx="8" cy="8" r="6.5" stroke="#9B3A3A" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-[#9B3A3A] motion-safe:animate-[fade-in_200ms_ease-out_both]">{error}</p>
                <p className="text-xs text-[#9B3A3A] opacity-70 mt-1">Click to try again</p>
              </>
            ) : (
              <>
                <div className={[
                  'w-10 h-10 rounded-full border flex items-center justify-center mb-4',
                  'motion-safe:transition-colors motion-safe:duration-150',
                  isDragover ? 'border-[#171717]' : 'border-[#D4D4D4]',
                ].join(' ')}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M8 11V4M5 7L8 4L11 7" stroke={isDragover ? '#171717' : '#A3A3A3'} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M3 12h10" stroke={isDragover ? '#171717' : '#D4D4D4'} strokeWidth="1.2" strokeLinecap="round" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-[#171717]">
                  {isDragover ? 'Drop to upload' : 'Drop your resume here'}
                </p>
                <p className="text-xs text-[#A3A3A3] mt-1">or click to browse files</p>
              </>
            )}
          </div>

          <p className="text-xs text-[#A3A3A3] text-center mt-3">
            Supported formats: PDF, TXT — max {MAX_FILE_SIZE_MB} MB
          </p>

          <div className="mt-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-[#E5E5E5]" />
            <span className="text-xs text-[#A3A3A3]">or</span>
            <div className="h-px flex-1 bg-[#E5E5E5]" />
          </div>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="mt-4 w-full py-2.5 rounded-[6px] border border-[#E5E5E5] bg-[#FFFFFF] text-sm text-[#737373] hover:text-[#171717] hover:border-[#D4D4D4] hover:bg-[#FAFAF9] motion-safe:transition-all motion-safe:duration-150"
          >
            Browse files
          </button>

          {/* Optional: job description + target role — used to tailor the
              analysis (ATS keyword match, and framing for the target field). */}
          <div className="mt-8 pt-6 border-t border-[#E5E5E5]">
            <label className="text-xs text-[#737373] block mb-1.5">
              Job description (optional) — enables ATS keyword matching
            </label>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste a job description here..."
              rows={4}
              className="w-full py-2 px-3 rounded-[6px] border border-[#E5E5E5] bg-[#FFFFFF] text-sm text-[#171717] resize-none motion-safe:transition-colors motion-safe:duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#171717]"
            />

            <label className="text-xs text-[#737373] block mb-1.5 mt-4">
              Target role (optional)
            </label>
            <select
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              className="w-full py-2 px-3 rounded-[6px] border border-[#E5E5E5] bg-[#FFFFFF] text-sm text-[#171717] motion-safe:transition-colors motion-safe:duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#171717]"
            >
              <option value="">General / no specific target</option>
              <option value="tech">Tech / Engineering</option>
              <option value="creative">Creative / Hybrid Creative-Tech</option>
              <option value="finance">Finance / Management</option>
              <option value="generalist">Generalist (writing, research, ops)</option>
            </select>
          </div>
        </>
      )}

      {/* Processing state */}
      {isProcessing && (
        <div className="border border-[#E5E5E5] rounded-[8px] bg-[#FFFFFF] p-8">
          <div className="flex items-center gap-3 mb-8 pb-6 border-b border-[#E5E5E5]">
            <div className="w-8 h-8 rounded-[4px] bg-[#F5F5F4] border border-[#E5E5E5] flex items-center justify-center flex-shrink-0">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M3 1h6l3 3v9H3V1z" stroke="#A3A3A3" strokeWidth="1" fill="none" strokeLinejoin="round" />
                <path d="M9 1v3h3" stroke="#A3A3A3" strokeWidth="1" fill="none" />
              </svg>
            </div>
            <div className="motion-safe:animate-[fade-in_200ms_ease-out_both]">
              <p className="text-sm font-medium text-[#171717]">{filename}</p>
              <p className="text-xs text-[#A3A3A3]">
                {state === 'uploading' ? `Uploading… ${uploadPercent}%` : 'Processing…'}
              </p>
            </div>
          </div>

          {/* Real upload progress bar — width is driven directly by actual
              bytes-transmitted events (xhr.upload.onprogress), not a timer. */}
          {state === 'uploading' && (
            <div className="h-[3px] w-full bg-[#E5E5E5] rounded-full overflow-hidden mb-8 -mt-4">
              <div
                className="h-full bg-[#171717] rounded-full motion-safe:transition-[width] motion-safe:duration-150 motion-safe:ease-out"
                style={{ width: `${uploadPercent}%` }}
              />
            </div>
          )}

          <div className="flex flex-col gap-4">
            <ProgressStep
              label="Uploading"
              active={state === 'uploading'}
              done={state === 'processing'}
            />
            <ProgressStep
              label="Parsing document"
              active={state === 'processing'}
              done={false}
            />
            <ProgressStep
              label="Analyzing content"
              active={state === 'processing'}
              done={false}
            />
          </div>

          <p className="text-xs text-[#A3A3A3] mt-8">This usually takes 5–10 seconds.</p>
        </div>
      )}
    </div>
  )
}
