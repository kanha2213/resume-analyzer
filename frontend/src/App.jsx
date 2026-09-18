import React, { useState, useEffect, useCallback } from "react";
import "./App.css";

const API_URL = "https://rnqdw8rrbg.execute-api.us-east-1.amazonaws.com/analyze-resume"; 

const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const ALLOWED_TYPES = [
  "application/pdf",
  "text/plain",
];
const ALLOWED_EXTENSIONS = [".pdf", ".txt"];

const LOADING_MESSAGES = [
  "Reading your resume...",
  "Analyzing experience and skills...",
  "Identifying strengths...",
  "Finding areas for improvement...",
  "Generating recommendations...",
  "Checking ATS compatibility...",
  "Preparing your report...",
];

export default function App() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loadingMsg, setLoadingMsg] = useState(LOADING_MESSAGES[0]);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    if (!loading) return;
    let i = 0;
    const interval = setInterval(() => {
      i = (i + 1) % LOADING_MESSAGES.length;
      setLoadingMsg(LOADING_MESSAGES[i]);
    }, 2000);
    return () => clearInterval(interval);
  }, [loading]);

  useEffect(() => {
    if (API_URL === "YOUR_API_GATEWAY_URL_HERE") return;
    fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    }).catch(() => {});
  }, []);

  const validateFile = (f) => {
    if (!f) return "Please select a file.";
    const ext = "." + f.name.split(".").pop().toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return `Unsupported file type (${ext}). Please upload a PDF or TXT file.`;
    }
    if (f.size > MAX_FILE_SIZE_BYTES) {
      const sizeMB = (f.size / (1024 * 1024)).toFixed(1);
      return `File too large (${sizeMB} MB). Maximum size is ${MAX_FILE_SIZE_MB} MB. Try compressing your PDF.`;
    }
    return null;
  };

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const err = validateFile(f);
    if (err) {
      setError(err);
      setFile(null);
      return;
    }
    setFile(f);
    setError(null);
    setResult(null);
  };

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const f = e.dataTransfer.files?.[0];
    if (!f) return;
    const err = validateFile(f);
    if (err) {
      setError(err);
      setFile(null);
      return;
    }
    setFile(f);
    setError(null);
    setResult(null);
  }, []);

  const handleAnalyze = async () => {
    if (!file) {
      setError("Please select a resume file first.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const base64 = await fileToBase64(file);

      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          file: base64,
          filename: file.name,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.error || "Something went wrong. Please try again.");
        if (data.hint) setError((prev) => prev + " " + data.hint);
      } else {
        setResult(data.analysis);
      }
    } catch (err) {
      if (err.name === "TypeError" && err.message.includes("fetch")) {
        setError("Cannot reach the server. Check your internet connection and try again.");
      } else {
        setError("Unexpected error: " + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setResult(null);
    setError(null);
  };

  return (
    <div className="app">
      <div className="bg-glow bg-glow-1" />
      <div className="bg-glow bg-glow-2" />

      <div className="container">
        <header className="header">
          <div className="logo">
            <span className="logo-icon">📄</span>
            <span className="logo-text">ResumeAI</span>
          </div>
          <p className="tagline">Powered by Claude AI on AWS</p>
        </header>

        {!result && (
          <section className="hero">
            <h1>Get Expert Resume Feedback in Seconds</h1>
            <p className="hero-sub">
              Most resumes get rejected in under 7 seconds. Our AI analyzes yours
              against industry standards and gives you a score, specific strengths,
              gaps, and actionable recommendations — instantly.
            </p>
          </section>
        )}

        {!result && !loading && (
          <section className="upload-section">
            <div
              className={`dropzone ${dragActive ? "dropzone-active" : ""} ${file ? "dropzone-has-file" : ""}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              {file ? (
                <div className="file-info">
                  <span className="file-icon">📎</span>
                  <div>
                    <p className="file-name">{file.name}</p>
                    <p className="file-size">{(file.size / 1024).toFixed(0)} KB</p>
                  </div>
                  <button className="btn-remove" onClick={(e) => { e.stopPropagation(); handleReset(); }}>✕</button>
                </div>
              ) : (
                <>
                  <div className="drop-icon">⬆️</div>
                  <p className="drop-text">Drag & drop your resume here</p>
                  <p className="drop-or">or</p>
                  <label className="btn btn-outline">
                    Browse Files
                    <input
                      type="file"
                      accept=".pdf,.txt"
                      onChange={handleFileChange}
                      hidden
                    />
                  </label>
                  <p className="drop-hint">PDF or TXT • Max {MAX_FILE_SIZE_MB} MB</p>
                </>
              )}
            </div>

            {file && (
              <button className="btn btn-primary btn-analyze" onClick={handleAnalyze}>
                🔍 Analyze My Resume
              </button>
            )}
          </section>
        )}

        {error && (
          <div className="error-card">
            <span className="error-icon">⚠️</span>
            <div>
              <p className="error-title">Something went wrong</p>
              <p className="error-msg">{error}</p>
            </div>
          </div>
        )}

        {loading && (
          <section className="loading-section">
            <div className="spinner" />
            <p className="loading-msg">{loadingMsg}</p>
            <div className="loading-bar">
              <div className="loading-bar-fill" />
            </div>
          </section>
        )}

        {result && <Results data={result} onReset={handleReset} />}

        <footer className="footer">
          Built with ❤️ using AWS Lambda, Amazon Bedrock (Claude), and React
          <br />
          <span className="footer-sub">First Commit Hackathon — Sept 2026</span>
        </footer>
      </div>
    </div>
  );
}

function Results({ data, onReset }) {
  if (data.raw_analysis) {
    return (
      <section className="results">
        <h2>Analysis Results</h2>
        <div className="raw-analysis">
          {data.raw_analysis.split("\n").map((line, i) => (
            <p key={i}>{line}</p>
          ))}
        </div>
        <button className="btn btn-primary" onClick={onReset}>
          ↩ Analyze Another Resume
        </button>
      </section>
    );
  }

  const score = data.score;

  return (
    <section className="results">
      {score !== null && score !== undefined && (
        <div className="score-section">
          <ScoreGauge score={score} />
          <p className="score-summary">{data.summary}</p>
        </div>
      )}

      {data.strengths?.length > 0 && (
        <div className="result-card card-strengths">
          <h3>💪 Strengths</h3>
          {data.strengths.map((s, i) => (
            <div key={i} className="result-item">
              <p className="item-title">{s.title}</p>
              <p className="item-detail">{s.detail}</p>
            </div>
          ))}
        </div>
      )}

      {data.gaps?.length > 0 && (
        <div className="result-card card-gaps">
          <h3>🔍 Areas to Improve</h3>
          {data.gaps.map((g, i) => (
            <div key={i} className="result-item">
              <p className="item-title">{g.title}</p>
              <p className="item-detail">{g.detail}</p>
              {g.fix && <p className="item-fix">✏️ Fix: {g.fix}</p>}
            </div>
          ))}
        </div>
      )}

      {data.recommendations?.length > 0 && (
        <div className="result-card card-recs">
          <h3>🚀 Recommendations</h3>
          {data.recommendations.map((r, i) => (
            <div key={i} className="result-item">
              <div className="rec-header">
                <span className="rec-priority">P{r.priority}</span>
                <p className="item-title">{r.action}</p>
              </div>
              <p className="item-detail">{r.impact}</p>
            </div>
          ))}
        </div>
      )}

      {data.keywords_missing?.length > 0 && (
        <div className="result-card card-ats">
          <h3>🤖 ATS Optimization</h3>
          <div className="keywords">
            {data.keywords_missing.map((kw, i) => (
              <span key={i} className="keyword-tag">+ {kw}</span>
            ))}
          </div>
          {data.ats_tips && <p className="ats-tips">{data.ats_tips}</p>}
        </div>
      )}

      <button className="btn btn-primary btn-analyze" onClick={onReset}>
        ↩ Analyze Another Resume
      </button>
    </section>
  );
}

function ScoreGauge({ score }) {
  const clampedScore = Math.max(0, Math.min(100, score));
  const color =
    clampedScore >= 80 ? "#22c55e" :
    clampedScore >= 60 ? "#eab308" :
    clampedScore >= 40 ? "#f97316" :
    "#ef4444";

  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (clampedScore / 100) * circumference;

  return (
    <div className="gauge">
      <svg viewBox="0 0 120 120" className="gauge-svg">
        <circle cx="60" cy="60" r="54" fill="none" stroke="#e5e7eb" strokeWidth="8" />
        <circle
          cx="60" cy="60" r="54" fill="none"
          stroke={color} strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 60 60)"
          style={{ transition: "stroke-dashoffset 1s ease" }}
        />
      </svg>
      <div className="gauge-label">
        <span className="gauge-number" style={{ color }}>{clampedScore}</span>
        <span className="gauge-text">/ 100</span>
      </div>
    </div>
  );
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}
