"""
Production Gunicorn + Uvicorn Configuration for Career Path Simulator.
Usage:
    gunicorn -c gunicorn_conf.py app.main:app
"""
import multiprocessing
import os

# Host and Port binding
host = os.getenv("HOST", "0.0.0.0")
port = os.getenv("PORT", "8000")
bind = f"{host}:{port}"

# Concurrency & Worker Model
default_workers = max(2, multiprocessing.cpu_count() * 2 + 1)
workers = int(os.getenv("WEB_CONCURRENCY", default_workers))
worker_class = "uvicorn.workers.UvicornWorker"

# Timeouts: Allow generous time for streaming SSE AI generation and simulations
timeout = int(os.getenv("GUNICORN_TIMEOUT", "120"))
graceful_timeout = int(os.getenv("GUNICORN_GRACEFUL_TIMEOUT", "30"))
keepalive = int(os.getenv("GUNICORN_KEEPALIVE", "65"))

# Memory leak mitigation: periodic worker recycling
max_requests = int(os.getenv("GUNICORN_MAX_REQUESTS", "1000"))
max_requests_jitter = int(os.getenv("GUNICORN_MAX_REQUESTS_JITTER", "100"))

# Logging
accesslog = "-"
errorlog = "-"
loglevel = os.getenv("LOG_LEVEL", "info")
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s" (%(D)s µs)'
