# Task Manager

A modern, full-stack task management application built with Django REST Framework backend and React TypeScript frontend. Features include JWT authentication, task CRUD operations, advanced filtering, real-time statistics, and a responsive UI.

## ✨ Features

- **User Authentication**: JWT-based authentication with access and refresh tokens
- **Task Management**: Create, read, update, and delete tasks with rich metadata
- **Advanced Filtering**: Filter tasks by status, priority, due date, and search terms
- **Task Statistics**: Real-time analytics and insights on task completion
- **Role-Based Access**: Admin and user roles with appropriate permissions
- **Responsive Design**: Modern UI built with React and Tailwind CSS
- **API Documentation**: Interactive Swagger and ReDoc documentation
- **Production Ready**: Configured with Gunicorn, WhiteNoise, and Docker support
- **Security Features**: Rate limiting, CORS protection, and Django Defender

## 🚀 Quick Start

### Prerequisites

- Python 3.12+
- Node.js 18+
- MySQL 8.0+
- Redis (optional, for caching)

### Backend Setup (Django + Gunicorn + WhiteNoise)

1. **Navigate to backend directory**:
```bash
cd backend
```

2. **Create and activate virtual environment**:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. **Install dependencies**:
```bash
pip install -r requirements.txt
```

4. **Create `.env` file** (see Environment Variables section below)

5. **Run migrations**:
```bash
python manage.py migrate
```

6. **Create superuser** (optional):
```bash
python manage.py createsuperuser
```

7. **Collect static files**:
```bash
python manage.py collectstatic --noinput
```

8. **Run development server**:
```bash
python manage.py runserver
# Or with Gunicorn:
gunicorn -c gunicorn.conf.py task_manager.wsgi:application
```

Backend will be available at: http://localhost:8000

### Frontend Setup (React + Vite)

1. **Navigate to frontend directory**:
```bash
cd frontend
```

2. **Install dependencies**:
```bash
npm install
```

3. **Run development server**:
```bash
npm run dev
```

Frontend will be available at: http://localhost:5173

## 🐳 Docker Deployment

Run the entire stack with Docker Compose:

```bash
cd backend
docker-compose up -d
```

This will start:
- MySQL database on port 3306
- Django backend with Gunicorn on port 8000
- Automatic migrations and static file collection

To stop:
```bash
docker-compose down
```

To rebuild after code changes:
```bash
docker-compose up -d --build
```

## 🛠️ Tech Stack

### Backend
- **Framework**: Django 6.0
- **API**: Django REST Framework 3.16
- **Authentication**: JWT (djangorestframework-simplejwt)
- **Database**: MySQL 8.0
- **Caching**: Redis with django-redis
- **WSGI Server**: Gunicorn 23.0
- **Static Files**: WhiteNoise 6.8
- **API Documentation**: drf-spectacular (OpenAPI/Swagger)
- **Security**: Django Defender, Django Ratelimit, CORS Headers
- **Testing**: Pytest with Django plugin and Factory Boy
- **Monitoring**: Sentry SDK

### Frontend
- **Framework**: React 19
- **Language**: TypeScript 5.9
- **Build Tool**: Vite 7.2
- **Styling**: Tailwind CSS 3.4
- **Routing**: React Router 7.11
- **HTTP Client**: Axios 1.13
- **Icons**: Lucide React
- **Animations**: Framer Motion
- **Charts**: Recharts

## ⚙️ Environment Variables

Create a `.env` file in the `backend` directory:

```env
# Django Settings
SECRET_KEY=your-super-secret-key-change-in-production
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database Configuration
DB_NAME=task_manager_db
DB_USER=root
DB_PASSWORD=your-mysql-password
DB_HOST=localhost
DB_PORT=3306

# Redis Configuration (Optional)
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT Settings (Optional - has defaults)
JWT_ACCESS_TOKEN_LIFETIME=60  # minutes
JWT_REFRESH_TOKEN_LIFETIME=1440  # minutes (24 hours)

# CORS Settings (Optional)
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173

# Sentry (Optional - for production monitoring)
SENTRY_DSN=your-sentry-dsn
```

## 📚 API Documentation

Once the backend is running, access the interactive API documentation:

- **Swagger UI**: http://localhost:8000/api/schema/swagger-ui/
- **ReDoc**: http://localhost:8000/api/schema/redoc/
- **OpenAPI Schema (JSON)**: http://localhost:8000/api/schema/
- **Django Admin Panel**: http://localhost:8000/admin/

### API Endpoints Overview

#### Authentication
- `POST /api/users/register/` - Register new user
- `POST /api/users/login/` - Login and get JWT tokens
- `POST /api/users/token/refresh/` - Refresh access token

#### User Profile
- `GET /api/users/profile/` - Get current user profile
- `PUT /api/users/profile/` - Update full profile
- `PATCH /api/users/profile/` - Partial profile update

#### Tasks
- `GET /api/tasks/` - List all user tasks (with filtering)
- `POST /api/tasks/` - Create new task
- `GET /api/tasks/<id>/` - Get task details
- `PUT /api/tasks/<id>/` - Update task (full)
- `PATCH /api/tasks/<id>/` - Update task (partial)
- `DELETE /api/tasks/<id>/` - Delete task
- `GET /api/tasks/stats/` - Get task statistics

#### Admin
- `GET /api/users/list/` - List all users (admin only)

### Query Parameters

Filter tasks using these parameters:
- `status`: `todo`, `in_progress`, `completed`, `cancelled`
- `priority`: `low`, `medium`, `high`, `urgent`
- `overdue`: `true`/`false`
- `search`: Search in title and description
- `ordering`: Order by field (e.g., `created_at`, `due_date`, `priority`)

Example: `/api/tasks/?status=in_progress&priority=high&ordering=-due_date`

## 🧪 Testing

### Backend Tests

Run the test suite:
```bash
cd backend
pytest

# With coverage report
pytest --cov=apps --cov-report=html

# Run specific test file
pytest apps/tasks/tests.py
```

### Frontend Tests

```bash
cd frontend
npm run lint
```

## 📁 Project Structure

```
task-manager/
├── backend/
│   ├── apps/
│   │   ├── core/         # Core utilities and exception handlers
│   │   ├── tasks/        # Task management app
│   │   └── users/        # User authentication and profiles
│   ├── task_manager/     # Django project settings
│   ├── staticfiles/      # Collected static files
│   ├── logs/             # Application logs
│   ├── manage.py
│   ├── requirements.txt
│   ├── Dockerfile
│   └── docker-compose.yml
├── frontend/
│   ├── src/
│   │   ├── components/   # Reusable React components
│   │   ├── pages/        # Page components
│   │   ├── services/     # API service layer
│   │   ├── contexts/     # React contexts (Auth, etc.)
│   │   ├── hooks/        # Custom React hooks
│   │   ├── types/        # TypeScript type definitions
│   │   └── styles/       # Global styles and theme
│   ├── public/           # Static assets
│   ├── package.json
│   └── vite.config.ts
└── README.md
```

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Validation**: Strong password requirements
- **Rate Limiting**: API endpoint rate limiting with django-ratelimit
- **CORS Protection**: Configured CORS headers
- **Django Defender**: Brute-force attack protection
- **SQL Injection Protection**: Django ORM parameterized queries
- **XSS Protection**: React's built-in XSS protection

## 🚢 Production Deployment

### Backend

1. Set `DEBUG=False` in `.env`
2. Update `ALLOWED_HOSTS` with your domain
3. Set strong `SECRET_KEY`
4. Configure production database
5. Set up Redis for caching
6. Configure Sentry for error tracking
7. Use Gunicorn with appropriate worker count
8. Set up Nginx as reverse proxy
9. Enable HTTPS with SSL certificate

### Frontend

```bash
cd frontend
npm run build
```

The built files will be in the `dist/` directory. Serve them with Nginx or any static file server.

## 📝 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📧 Contact

For questions or support, please open an issue on GitHub.
