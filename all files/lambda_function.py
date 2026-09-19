"""
AI Resume Analyzer — AWS Lambda Function
Hackathon: First Commit (AWS × WeMakeDevs) — Sept 2026
Team: Mayank (Backend) + Devraj (Frontend)

AWS Services Used:
  - Lambda: This function (serverless compute)
  - S3: Store uploaded resumes
  - Bedrock: Claude AI analysis
  - DynamoDB: Store analysis results
  - API Gateway: REST endpoint (configured separately)
  - CloudFront: Frontend CDN (configured separately)
"""

import json
import boto3
import base64
import io
import uuid
import traceback
from datetime import datetime

# ---------- AWS clients ----------
s3 = boto3.client("s3")
bedrock = boto3.client("bedrock-runtime", region_name="us-east-1")
dynamodb = boto3.resource("dynamodb", region_name="us-east-1")

# ---------- CONFIGURATION — UPDATE THESE ----------
S3_BUCKET = "resume-analyzer-uploads-hackathon"     # <-- Your S3 bucket name
DYNAMO_TABLE = "resume-analyses"                     # <-- Your DynamoDB table name

# ---------- Constants ----------
MAX_FILE_BYTES = 4 * 1024 * 1024  # 4 MB (base64 adds ~33%, keeps under Lambda 6MB payload limit)
ALLOWED_EXTENSIONS = {".pdf", ".txt"}

# CORS headers — attached to EVERY response
CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
    "Access-Control-Allow-Methods": "POST,OPTIONS",
    "Content-Type": "application/json",
}

# ---------- Claude System Prompt ----------
SYSTEM_PROMPT = """You are an expert career coach and resume reviewer with 15 years of experience.

RULES:
- ALWAYS respond in English, regardless of the resume's language.
- Be specific — reference actual content from the resume.
- Be actionable — every recommendation must be doable TODAY.
- Be honest but encouraging.

Respond in EXACTLY this JSON format (no markdown, no code fences, raw JSON only):
{
  "score": <number 0-100>,
  "summary": "<one sentence overall assessment>",
  "strengths": [
    {"title": "<short title>", "detail": "<specific explanation referencing resume content>"}
  ],
  "gaps": [
    {"title": "<short title>", "detail": "<specific explanation>", "fix": "<exactly what to add or change>"}
  ],
  "recommendations": [
    {"priority": <1-5>, "action": "<specific action>", "impact": "<why this matters>"}
  ],
  "keywords_missing": ["<ATS keyword 1>", "<ATS keyword 2>"],
  "ats_tips": "<one paragraph on ATS compatibility>"
}

Provide 2-3 strengths, 2-3 gaps, and 3-5 recommendations sorted by priority."""


# ============================================================
# MAIN HANDLER
# ============================================================
def lambda_handler(event, context):
    """Entry point — handles every request."""

    # ---- CORS preflight ----
    method = event.get("httpMethod", "")
    if method == "OPTIONS":
        return _resp(200, {"message": "CORS preflight OK"})

    # ---- Parse body ----
    body = _parse_body(event)

    # ---- Pre-warm ping (empty body = health check) ----
    if not body or not body.get("file"):
        return _resp(200, {"success": True, "warm": True, "message": "Lambda is warm and ready!"})

    file_b64 = body["file"]
    filename = body.get("filename", "resume.pdf").lower()

    # ---- Validate extension ----
    ext = ("." + filename.rsplit(".", 1)[-1]) if "." in filename else ""
    if ext not in ALLOWED_EXTENSIONS:
        return _resp(400, {
            "success": False,
            "error": f"Unsupported file type: {ext}",
            "hint": "Please upload a PDF or TXT file.",
        })

    # ---- Decode base64 ----
    try:
        file_bytes = base64.b64decode(file_b64)
    except Exception:
        return _resp(400, {
            "success": False,
            "error": "File data is corrupted.",
            "hint": "Try uploading the file again.",
        })

    # ---- Validate size ----
    if len(file_bytes) > MAX_FILE_BYTES:
        size_mb = round(len(file_bytes) / (1024 * 1024), 1)
        return _resp(400, {
            "success": False,
            "error": f"File too large ({size_mb} MB). Maximum is 4 MB.",
            "hint": "Compress your PDF or remove images, then retry.",
        })

    # ---- Generate unique ID for this analysis ----
    analysis_id = str(uuid.uuid4())[:8]
    timestamp = datetime.utcnow().isoformat() + "Z"

    # ---- Step 1: Save resume to S3 ----
    s3_key = f"resumes/{analysis_id}_{filename}"
    try:
        s3.put_object(
            Bucket=S3_BUCKET,
            Key=s3_key,
            Body=file_bytes,
            ContentType="application/pdf" if ext == ".pdf" else "text/plain",
        )
    except Exception as e:
        print(f"S3 upload failed (non-blocking): {e}")
        # Don't fail the whole request if S3 save fails — analysis still works
        s3_key = "upload-failed"

    # ---- Step 2: Extract text ----
    resume_text, extract_err = _extract_text(file_bytes, ext)
    if extract_err:
        return _resp(400, {
            "success": False,
            "error": extract_err,
            "hint": "Make sure your file is not password-protected or a scanned image.",
        })

    # ---- Step 3: Check for empty/blank text ----
    cleaned = resume_text.strip()
    if not cleaned or len(cleaned) < 50:
        return _resp(400, {
            "success": False,
            "error": "Resume appears blank or has too little text.",
            "hint": "This might be a scanned PDF (image-only). Use a text-based PDF or paste as TXT.",
        })

    # ---- Step 4: Call Claude via Bedrock ----
    try:
        raw_analysis = _call_claude(cleaned)
    except Exception as e:
        traceback.print_exc()
        return _resp(502, {
            "success": False,
            "error": "AI analysis service is temporarily unavailable.",
            "hint": "Please wait a moment and try again.",
        })

    # ---- Step 5: Parse Claude's response ----
    try:
        analysis = json.loads(raw_analysis)
    except json.JSONDecodeError:
        analysis = {"score": None, "raw_analysis": raw_analysis}

    # ---- Step 6: Save result to DynamoDB ----
    try:
        table = dynamodb.Table(DYNAMO_TABLE)
        table.put_item(Item={
            "analysis_id": analysis_id,
            "timestamp": timestamp,
            "filename": filename,
            "s3_key": s3_key,
            "score": int(analysis.get("score", 0)) if analysis.get("score") else 0,
            "summary": analysis.get("summary", ""),
            "text_length": len(cleaned),
        })
    except Exception as e:
        print(f"DynamoDB save failed (non-blocking): {e}")
        # Don't fail — the user still gets their analysis

    # ---- Return success ----
    return _resp(200, {
        "success": True,
        "analysis_id": analysis_id,
        "analysis": analysis,
        "text_length": len(cleaned),
    })


# ============================================================
# HELPERS
# ============================================================

def _parse_body(event):
    body = event.get("body")
    if not body:
        return event
    if isinstance(body, str):
        try:
            if event.get("isBase64Encoded"):
                body = base64.b64decode(body).decode("utf-8")
            return json.loads(body)
        except Exception:
            return {}
    return body


def _extract_text(file_bytes, ext):
    if ext == ".pdf":
        return _extract_pdf(file_bytes)
    elif ext == ".txt":
        try:
            return file_bytes.decode("utf-8"), None
        except UnicodeDecodeError:
            try:
                return file_bytes.decode("latin-1"), None
            except Exception:
                return "", "Could not read TXT file encoding."
    return "", f"Unsupported file type: {ext}"


def _extract_pdf(file_bytes):
    try:
        from PyPDF2 import PdfReader
        reader = PdfReader(io.BytesIO(file_bytes))
        pages = []
        for page in reader.pages:
            text = page.extract_text()
            if text:
                pages.append(text)
        if not pages:
            return "", "Could not extract text — PDF may be scanned or image-based."
        return "\n".join(pages), None
    except ImportError:
        return "", "PDF library not available — Lambda Layer missing."
    except Exception as e:
        return "", f"Error reading PDF: {str(e)}"


def _call_claude(resume_text):
    response = bedrock.converse(
        modelId="amazon.nova-2-lite-v1:0",
        messages=[
            {"role": "user", "content": [{"text": f"Analyze this resume and respond with the JSON format specified:\n\n{resume_text}"}]}
        ],
        system=[{"text": SYSTEM_PROMPT}],
        inferenceConfig={"maxTokens": 2000},
    )
    return response["output"]["message"]["content"][0]["text"]


def _resp(code, body):
    return {
        "statusCode": code,
        "headers": CORS,
        "body": json.dumps(body),
    }