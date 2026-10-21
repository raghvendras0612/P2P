"""
Vercel Serverless Function Entry Point for Career Path Simulator FastAPI Backend.
When deploying the backend as a Python serverless function on Vercel, requests are
routed to this ASGI application instance.
"""
import os
import sys

# Ensure backend application root is accessible on Python module path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))

from app.main import app  # noqa: E402

handler = app
