# 📄 ResumeAI — AI-Powered Resume Analyzer

> Upload your resume, get expert AI feedback in seconds.

Built for the **First Commit Hackathon** (AWS × WeMakeDevs) — September 2026

🔗 **Live Demo:** [your-vercel-url.vercel.app](https://your-vercel-url.vercel.app)  
🎥 **Demo Video:** [Watch on YouTube](https://youtube.com/your-video)

---

## 🧠 The Problem

Most resumes get rejected within **7 seconds** by recruiters and ATS systems. Job seekers don't know what's wrong — they send the same resume hundreds of times, never getting feedback.

Professional resume reviews cost ₹2,000–₹10,000 and take days. We built a solution that gives **specific, actionable feedback in under 10 seconds** — for free.

## 💡 The Solution

**ResumeAI** uses Claude AI (via Amazon Bedrock) to analyze resumes and provide:

- **Resume Score** (0–100) — instant quality benchmark
- **Strengths** — what's already working
- **Gaps** — what's missing or weak
- **Actionable Recommendations** — prioritized fixes
- **ATS Optimization Tips** — missing keywords for automated screening

## 🏗️ Architecture

```
┌──────────────┐     HTTPS POST      ┌────────────────┐
│              │ ──────────────────▸  │                │
│   React UI   │                      │  API Gateway   │
│  (Vercel)    │ ◂──────────────────  │  (REST API)    │
│              │     JSON response    │                │
└──────────────┘                      └───────┬────────┘
                                              │
                                              ▼
                                    ┌──────────────────┐
                                    │  AWS Lambda       │
                                    │  (Python 3.11)    │
                                    │                   │
                                    │  1. Validate file │
                                    │  2. Extract text  │
                                    │  3. Call Claude   │
                                    │  4. Return JSON   │
                                    └────────┬─────────┘
                                             │
                                             ▼
                                    ┌──────────────────┐
                                    │  Amazon Bedrock   │
                                    │  (Claude 3 Sonnet)│
                                    │                   │
                                    │  Analyzes resume  │
                                    │  Returns scored   │
                                    │  JSON feedback    │
                                    └──────────────────┘
```

### Why This Architecture?

| Decision | Why |
|----------|-----|
| **Lambda** (not EC2/ECS) | Pay-per-request. Zero cost when no one is uploading. Auto-scales to 1000 concurrent users. |
| **API Gateway** | Managed HTTPS, throttling, and request validation — no server to maintain. |
| **Bedrock** (not direct API) | Stays inside AWS VPC. No API keys to manage. IAM-based auth. |
| **Claude 3 Sonnet** | Best balance of speed and analysis quality for text understanding. |
| **React + Vercel** | Fast static hosting with global CDN. Free tier handles hackathon traffic. |

## 💰 Cost Estimate

| Service | Cost | Notes |
|---------|------|-------|
| Lambda | ~$0.00 | Free tier: 1M requests/month |
| API Gateway | ~$0.00 | Free tier: 1M calls/month |
| Bedrock (Claude) | ~$0.003/resume | ~3 paise per analysis |
| Vercel | $0 | Free tier for frontend |
| **Total for 1,000 resumes** | **~₹2.50** | Less than a cup of chai |
| **Scale to 100K/month** | **~₹250/month** | Still cheaper than one human reviewer |

## 🚀 Quick Start

### Prerequisites
- AWS Account with Bedrock access enabled
- Node.js 18+ installed
- Python 3.11

### Backend (Lambda)

1. **Create Lambda function** in AWS Console
   - Runtime: Python 3.11
   - Memory: 512 MB
   - Timeout: 30 seconds

2. **Add PyPDF2 Lambda Layer**
   ```bash
   # On your machine (or Cloud9):
   mkdir python && cd python
   pip install PyPDF2 -t .
   cd .. && zip -r pypdf2-layer.zip python/
   # Upload as Lambda Layer in AWS Console
   ```

3. **Set Lambda permissions**
   - Attach policy: `AmazonBedrockFullAccess` to the Lambda execution role

4. **Paste `backend/lambda_function.py`** into the Lambda code editor → Deploy

5. **Create API Gateway**
   - Type: REST API
   - Method: POST `/analyze-resume`
   - Integration: Lambda function
   - Enable CORS
   - Deploy to stage `prod`
   - Copy the Invoke URL

### Frontend (React)

```bash
cd frontend
npm install
# Edit src/App.jsx → replace YOUR_API_GATEWAY_URL_HERE with your API URL
npm start
```

### Deploy Frontend

```bash
npm install -g vercel
cd frontend
vercel
# Follow prompts → get your live URL
```

## 🔧 Edge Cases Handled

| Scenario | What Happens |
|----------|-------------|
| User uploads .exe or .zip | Rejected with clear error message |
| File > 5 MB | Rejected before upload to Lambda |
| Scanned/image PDF (no text) | Detected → user told to use text-based PDF |
| Blank PDF | Caught → "Resume appears to be blank" |
| Non-English resume | Claude still analyzes; responds in English |
| Bedrock timeout | Graceful error → "AI service temporarily unavailable" |
| Lambda cold start | Pre-warmed on page load (invisible to user) |
| CORS issues | Headers set on every response including errors |

## 🛠️ Tech Stack

- **Frontend:** React 18 · CSS3 (no UI library) · Vercel
- **Backend:** Python 3.11 · AWS Lambda · PyPDF2
- **AI:** Claude 3 Sonnet via Amazon Bedrock
- **API:** AWS API Gateway (REST)
- **Infra:** Serverless (no servers to manage)

## 📸 Screenshots

> *Add screenshots of your working app here*

| Upload Screen | Analysis Results |
|--------------|-----------------|
| ![Upload](screenshots/upload.png) | ![Results](screenshots/results.png) |

## 👥 Team

- **Mayank** — Backend (Lambda, Bedrock, API Gateway)
- **Devraj** — Frontend (React, UI/UX, Deployment, Video)

## 📝 What We Learned

- How serverless (Lambda) works — pay-per-use, auto-scaling
- How to integrate AI models via AWS Bedrock
- How to handle file uploads end-to-end (browser → API → Lambda)
- How to build and deploy a full-stack app in under 48 hours
- Edge case handling matters more than features

## 📄 License

MIT — use it, modify it, build on it.

---

Built with ❤️ at the First Commit Hackathon (AWS × WeMakeDevs) — September 2026
