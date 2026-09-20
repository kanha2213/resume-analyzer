# Architecture Decision Records (ADR)

This document records the significant technical decisions made while building ResumeAI, why they were made, and the trade-offs accepted. Written for anyone (including future us) who wants to understand *why* the system looks the way it does, not just *what* it does.

---

## ADR-001: Serverless (AWS Lambda + API Gateway) over EC2/ECS

**Context:** Needed a backend that could go from zero to a working API within a hackathon's build window, with no ops overhead and near-zero idle cost.

**Decision:** AWS Lambda behind API Gateway (HTTP API), Python 3.11/3.13 runtime.

**Trade-offs accepted:**
- Cold starts add ~1-2 seconds of latency on the first request after idle. Mitigated with a pre-warm ping fired from the frontend on page load.
- No persistent in-memory state between invocations — each request is stateless by design, which actually simplified the code (no session management needed).

**Why this over the alternative:** A container-based backend (ECS/EC2) would have meant provisioning, patching, and paying for idle compute — none of which adds value for a demo-scale workload with bursty, low-volume traffic.

---

## ADR-002: Multi-provider AI strategy with an automatic rule-based fallback

**Context:** The original plan was Claude via Amazon Bedrock. This hit two separate, unrelated blockers during the build:
1. Anthropic models on Bedrock required manual account approval ("Your account is not authorized to perform this action") — not something fixable within the hackathon window.
2. A subsequent attempt to enable any Bedrock model at all was blocked by AWS's own new-account verification hold ("Your account is currently being verified").

**Decision:** Built the analysis engine as a **swappable provider layer**:
- A rule-based, keyword/heuristic scoring engine as the guaranteed-available baseline (skills detection, section detection, scoring, gap analysis — zero external dependencies).
- A real LLM call (first Amazon Nova, then Google Gemini, finally Groq's `openai/gpt-oss-120b`) layered on top, wrapped in a try/except.
- If the LLM call fails for *any* reason — auth, rate limit, malformed response, network — the system silently falls back to the rule-based engine and still returns a complete, valid analysis. The response includes an `_engine` field (`"groq"` or `"rule-based-fallback"`) so the failure mode is observable, not hidden.

**Why this matters:** This is the same circuit-breaker pattern production systems use for third-party API dependencies. A hackathon demo that goes down because a cloud AI provider is having a bad five minutes is a bad demo; this system doesn't do that.

**Trade-off accepted:** The rule-based fallback produces noticeably more generic feedback than the LLM path. This is disclosed, not hidden — see ADR-004 for the honesty stance on this.

---

## ADR-003: Enforced JSON-mode output over prompt-only JSON instructions

**Context:** The first LLM integration (Gemini `gemini-3.6-flash`) was asked to "respond with only JSON" purely via system prompt instructions. Direct testing (outside the app, via a standalone script hitting the raw API) showed this produced **truncated, invalid JSON** on real resume-length inputs — the model would stop mid-string despite `finishReason: STOP`, meaning it wasn't a token-limit problem, it was an output-formatting reliability problem.

**Decision:** Switched to the API's structured-output mode (`response_format: {"type": "json_object"}` on Groq / `responseMimeType: "application/json"` on Gemini), which constrains the model's decoding to always emit syntactically valid JSON, rather than relying on the model to *choose* to follow formatting instructions.

**Why this matters:** This bug was caught by testing the raw API call in isolation before wiring it into the app — not discovered live in the demo. That order of operations (test the dependency in isolation, then integrate) is the actual practice being demonstrated here.

---

## ADR-004: Full-stack hosting kept entirely on AWS

**Context:** The frontend could have been deployed to Vercel in minutes (and initially was, during early testing) while the backend ran on AWS Lambda/API Gateway.

**Decision:** Migrated frontend hosting from Vercel to AWS S3 static website hosting.

**Why:** The hackathon's judging rubric explicitly states *"Using an AWS open-source project or AWS services is mandatory to win a prize."* A split stack (AWS backend + third-party frontend host) is a completely normal real-world architecture, but for this specific submission, keeping the entire stack — compute, API, and static hosting — on one platform makes the "Built on AWS" story unambiguous rather than something a judge has to infer.

**Trade-off accepted:** S3 static website hosting has no built-in HTTPS or CDN caching (unlike CloudFront in front of it, which was scoped as a fast-follow if time allowed). Acceptable for a hackathon demo; noted as a production gap in `INCIDENTS.md` / future work.

---

## ADR-005: Optional job-description matching over always-required job matching

**Context:** One of the requested features was ATS keyword matching against a specific job description.

**Decision:** Made the job description field entirely optional. If provided, the response includes a `jd_match` object (match percentage, matched/missing keywords). If omitted, the analysis proceeds as a standalone resume review.

**Why:** Forcing a job description as a required input would have added friction for the primary use case (general resume feedback) to serve a secondary use case (targeted role matching). Optional-by-default with graceful enhancement when provided is the better default.
