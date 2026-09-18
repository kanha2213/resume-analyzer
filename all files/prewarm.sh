#!/bin/bash
# Pre-warm Lambda before recording demo video
# Run this 2-3 minutes before you start recording
# Usage: bash prewarm.sh YOUR_API_URL

API_URL="${1:-https://rnqdw8rrbg.execute-api.us-east-1.amazonaws.com/analyze-resume}"

echo "🔥 Pre-warming Lambda..."

for i in 1 2 3; do
  echo "  Ping $i/3..."
  curl -s -X POST "$API_URL" \
    -H "Content-Type: application/json" \
    -d '{}' \
    -o /dev/null -w "  HTTP %{http_code} in %{time_total}s\n"
  sleep 2
done

echo "✅ Lambda is warm! Start your demo now."
echo "   (Lambda stays warm for ~5-15 minutes)"
