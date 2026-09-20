# Incident Log

A record of real bugs hit during development, how each was diagnosed, and how it was fixed. Kept because "we fixed some bugs" is not a useful engineering story, but the actual diagnostic path usually is.

---

## Incident 001: `Runtime.ImportModuleError: No module named 'PyPDF2'`

**Symptom:** Lambda returned a 500 on every request involving a PDF, immediately after a fresh code deployment.

**Diagnosis:** Checked CloudWatch Logs → found the exact error at `INIT_START` / `INIT_REPORT` phase, meaning the failure happened before the handler even ran — a packaging problem, not a logic problem. The Lambda console's inline code editor only contains the handler file; it does not include third-party dependencies. PyPDF2 was never actually bundled into the deployed artifact.

**Fix:** Built a proper deployment package: `pip install PyPDF2 -t <dir>` to vendor the dependency alongside `lambda_function.py`, then zipped the directory contents (not the directory itself) so the package root matches what Lambda expects, and re-uploaded via "Upload from .zip file."

**Lesson:** Lambda's inline editor is fine for iterating on handler logic; it is not a substitute for a real build step once external dependencies are involved.

---

## Incident 002: Silent Lambda timeout on real (non-trivial) input

**Symptom:** The warm-up ping worked fine (`{"body": "{}"}` → 200 OK in ~1ms), but a real PDF upload returned nothing useful. CloudWatch showed `Status: timeout`, `Duration: 3000.00 ms`, `Billed Duration: 3000 ms`.

**Diagnosis:** Lambda's default timeout is 3 seconds. PDF text extraction plus (at the time) a synchronous LLM call comfortably exceeds that on a cold start.

**Fix:** Raised the function's configured timeout to 30 seconds and memory to 512 MB (which also speeds up CPU-bound work like PDF parsing, since Lambda allocates CPU proportionally to memory).

**Lesson:** A test event with an empty body will never catch this class of bug — it has to be tested with realistic payload size and complexity, not just "does the function respond at all."

---

## Incident 003: Gemini returning truncated, unparseable JSON despite `finishReason: STOP`

**Symptom:** The LLM integration worked for a trivial "say hello" test call, but on the real system prompt + full resume text, the JSON response consistently cut off mid-string (e.g., `"Compensates for the current single-project work` with no closing quote or brace) — even though the API reported the generation finished normally, not due to a token limit.

**Diagnosis:** Rather than debugging inside the deployed Lambda (slow iteration loop — deploy, invoke, check logs, repeat), the exact request payload was extracted into a standalone local script and hit directly against the Gemini API outside of AWS entirely. This isolated the variable: the API itself was returning malformed output, independent of anything in the Lambda code. Further isolated testing revealed the model in use was a "thinking" model that spends tokens on internal reasoning before the visible answer; a `thinkingConfig: {thinkingBudget: 0}` override intended to speed this up appears to have measurably degraded output completeness for this model version.

**Fix:** Removed the thinking-budget override and switched to the API's enforced structured-output mode (`responseMimeType: "application/json"`), which constrains the model to always emit valid JSON rather than relying on it to follow a prompt instruction. Verified with a dedicated retry-and-log test script before re-integrating.

**Lesson:** When a third-party API's behavior looks like "it's fine on my simple test but not on real data," reproduce the exact real request outside the application first. Isolating the failure to "is this our code or their API" saved multiple deploy-and-pray cycles.

---

## Incident 004: Groq API returning `HTTP 403 / error code 1010` on every request

**Symptom:** A request that should have hit Groq's completions endpoint returned a 403 with `error code: 1010` — not a shape of error Groq's own documentation describes for auth or rate-limit failures.

**Diagnosis:** Error code 1010 is a Cloudflare-specific response code (Cloudflare sits in front of Groq's API), meaning "request blocked by the site owner's bot-protection rules," not an application-level error at all. Python's `urllib` sends a default User-Agent string that some Cloudflare WAF configurations flag as a script/bot.

**Fix:** Added an explicit, browser-like `User-Agent` header to the outgoing request. This alone resolved the block; the next attempt reached the actual Groq API and returned a normal, informative error (`model_not_found`, listing the correct current model name), confirming the fix.

**Lesson:** A 403 from an API is not automatically "your credentials are wrong" — check whether a CDN/WAF layer in front of the actual service is the one rejecting the request, and check for provider-specific error codes before assuming it's an auth bug.

---

## Incident 005 (infrastructure, not code): Two divergent local project directories causing "my fix isn't showing up"

**Symptom:** Frontend code was edited and rebuilt, but the deployed S3 site kept serving the old UI — confirmed by comparing the JS bundle hash served by S3 against the local build output, which matched exactly (ruling out caching).

**Diagnosis:** The build tooling was reading from a *different* local copy of the project (`~/projects/resume-analyzer`) than the one being manually edited (`~/resume-analyzer`) — an artifact of having created the project in more than one location earlier in the build process. `grep`-ing the filesystem for a known unique string (an old, hardcoded API URL) located every duplicate copy and identified which one was actually wired into the live deployment pipeline.

**Fix:** Standardized on a single project directory going forward; corrected the stale API URL in the directory that was actually being built and deployed.

**Lesson:** "It's not updating" is very rarely a caching problem and very often a "which file is actually being read" problem — verify with a `find`/`grep` across the whole filesystem before assuming the deploy pipeline itself is broken.
