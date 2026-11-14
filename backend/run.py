import os
import sys

# Ensure backend root is in Python sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app
from config.settings import Config

app = create_app()

if __name__ == "__main__":
    print(f"🚀 Starting FitVerse Backend on port {Config.PORT}...")
    app.run(host="0.0.0.0", port=Config.PORT, debug=(Config.FLASK_ENV == "development"))

