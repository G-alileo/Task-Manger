"""Gunicorn configuration for Task Manager"""
import multiprocessing

# Server socket
bind = '0.0.0.0:8000'
backlog = 2048

# Workers
workers = multiprocessing.cpu_count() * 2 + 1
worker_class = 'sync'
worker_connections = 1000
timeout = 30
keepalive = 2

# Logging
accesslog = '-'
errorlog = '-'
loglevel = 'info'

# Process naming
proc_name = 'task_manager'
