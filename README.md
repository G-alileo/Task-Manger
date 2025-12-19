# Task Manager

A full-stack task management application with Django REST API backend and React frontend.

## Quick Start

### Backend (Django + Gunicorn + WhiteNoise)
```bash
# From project root
cd backend
../venv/bin/python manage.py migrate
../venv/bin/python manage.py collectstatic --noinput
../venv/bin/gunicorn -c gunicorn.conf.py task_manager.wsgi:application
```

### Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev
```

## Tech Stack

**Backend:**
- Django 6.0
- Django REST Framework
- JWT Authentication
- Gunicorn WSGI Server
- WhiteNoise for static files
- MySQL Database
- Redis for caching

**Frontend:**
- React 19
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Axios

## Environment Setup

Create `.env` file in backend directory:
```
SECRET_KEY=your-secret-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
DB_NAME=task_manager_db
DB_USER=root
DB_PASSWORD=your-password
DB_HOST=localhost
DB_PORT=3306
```

## API Documentation

- Swagger UI: http://localhost:8000/api/schema/swagger-ui/
- ReDoc: http://localhost:8000/api/schema/redoc/
- Admin Panel: http://localhost:8000/admin/
