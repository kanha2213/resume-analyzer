
echo "🔧 Building PyPDF2 Lambda Layer..."

rm -rf layer-build pypdf2-layer.zip
mkdir -p layer-build/python

pip install PyPDF2 -t layer-build/python --no-cache-dir

cd layer-build
zip -r ../pypdf2-layer.zip python/
cd ..

echo "✅ pypdf2-layer.zip created!"
echo ""
echo "Next steps:"
echo "1. Go to AWS Lambda Console → Layers → Create Layer"
echo "2. Name: pypdf2-layer"
echo "3. Upload: pypdf2-layer.zip"
echo "4. Compatible runtimes: Python 3.11"
echo "5. Click Create"
echo "6. Go to your Lambda function → Layers → Add Layer → select pypdf2-layer"
