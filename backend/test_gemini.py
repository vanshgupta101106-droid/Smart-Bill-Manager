import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")

print(f"Testing key: {api_key}")

try:
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel('gemini-1.5-flash-latest')
    response = model.generate_content("Hello")
    print("✅ Success! Key is working.")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"❌ Error: {e}")
