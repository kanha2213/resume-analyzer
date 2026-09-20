# Testing

This project doesn't have automated unit tests (out of scope for a hackathon timeline), but it was tested deliberately with a designed set of inputs rather than a single happy-path resume, specifically to check that the scoring engine behaves sensibly across different domains and — critically — that it correctly produces a *low* score on a bad fit rather than flattering every input.

## Test personas

Five synthetic resumes were built as real PDFs (via `reportlab`), each targeting a different scenario:

| # | Resume | Domain | Purpose |
|---|--------|--------|---------|
| 1 | Rahul Sharma — Cloud Engineer | AWS/Cloud, strong technical match | **Best-case check.** Paired with a matching AWS job description. Confirms high score + high JD-match % when the fit is genuinely strong. |
| 2 | Priya Mehta — Frontend Developer (deliberately thin, no work experience) | Frontend | **Worst-case / edge-case check.** Paired with a *senior backend engineer* job description (deliberate mismatch). Confirms the tool correctly produces a low score and low match %, rather than uniformly scoring everything highly. |
| 3 | Ananya Iyer — Research & Writing Generalist | Non-technical, AI-training/data-annotation roles | Confirms the tool doesn't assume every resume is a software engineering resume — correctly detects soft skills, writing/research experience, and generalist strengths. |
| 4 | Devraj Singh Bhadauria — Backend Engineer | Backend, matches the actual builder's real project | Used as the primary demo resume — the hackathon project itself becomes the "experience" being evaluated, which is a nice self-referential proof point live. |
| 5 | Arjun Nair — Professional Cyclist / Product Test Rider | Completely non-tech, sports/product-testing industry | **Domain-generality check.** Confirms the scoring engine's keyword/section detection isn't hardcoded to software job vocabulary — correctly picks up domain-specific skills (power meters, bike fit, endurance training) for an unrelated industry. |

## What each test actually validates

- **Score sensitivity:** the same engine should score Rahul-vs-AWS-JD noticeably higher than Priya-vs-Senior-Backend-JD. A tool that gives everyone 90+ regardless of fit is not doing real analysis — this was explicitly checked for, not assumed.
- **Domain generality:** the keyword/section heuristics (in the rule-based fallback) and the LLM prompt (in the AI path) were checked against a resume with zero overlap with typical tech-resume vocabulary (cycling) to confirm the system doesn't silently fail or produce nonsense outside a software-engineering context.
- **Graceful degradation:** every persona above was also run through the pipeline with the LLM path deliberately unavailable (API key unset, or during Gemini's live outage — see `INCIDENTS.md`), confirming the rule-based fallback produces a complete, valid, non-crashing response every time.

## API-level test coverage

Beyond the persona resumes, the following edge cases are explicitly handled and were verified with direct requests against the deployed endpoint (not just the UI):

| Input | Expected behavior | Verified |
|---|---|---|
| Empty/warm-up ping (`{}` body) | `200`, `{"warm": true}` — used for pre-warming Lambda before a demo | ✅ |
| `.docx` or other unsupported file extension | `400` with a clear error + hint | ✅ |
| Blank or near-empty extracted text (e.g. a scanned/image-only PDF) | `400`, explains it may be a scanned PDF, suggests a text-based file instead | ✅ |
| File over the size limit | `400`, states the limit and suggests compressing | ✅ |
| Corrupted / non-decodable base64 payload | `400`, does not crash the function | ✅ |
| CORS preflight (`OPTIONS`) | `200` with correct `Access-Control-Allow-*` headers on every response path, including error responses | ✅ |
| LLM provider returns malformed JSON | Caught, logged, falls back to rule-based engine — does not surface a raw exception to the user | ✅ |
| LLM provider rate-limited or briefly unavailable (`429`/`503`) | Retried once with backoff before falling back | ✅ |

## Known gaps (deliberately out of scope for this submission)

- No automated test suite (pytest/jest) — testing was manual and API-direct, appropriate for the timeline but noted as the first thing to add if this became a longer-lived project.
- `.doc`/`.docx` resumes are explicitly rejected with a message asking for PDF/TXT rather than actually parsed — parsing legacy Word formats was scoped out.
- No load testing was performed; the API Gateway + Lambda combination is inherently auto-scaling, but concurrent-request behavior of the LLM provider under load was not specifically verified beyond the single-request retry logic.
