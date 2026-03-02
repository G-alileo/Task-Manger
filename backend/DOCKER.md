# Docker Quick Reference Card

## 🚀 Quick Start

```bash
# Development (with hot reload)
make dev

# Production (with Nginx)
make prod-d
```

## 📋 Common Commands

### Service Management
| Command | Description |
|---------|-------------|
| `make up` | Start all services |
| `make up-d` | Start in background |
| `make down` | Stop all services |
| `make restart` | Restart services |
| `make ps` | Show status |
| `make logs` | View all logs |
| `make build` | Build images |

### Development
| Command | Description |
|---------|-------------|
| `make dev` | Start dev environment |
| `make dev-d` | Start dev in background |
| `make dev-down` | Stop dev environment |
| `make shell` | Django shell |
| `make bash` | Bash in container |

### Production
| Command | Description |
|---------|-------------|
| `make prod` | Start production |
| `make prod-d` | Start prod in background |
| `make prod-down` | Stop production |
| `make health` | Check service health |

### Database
| Command | Description |
|---------|-------------|
| `make migrate` | Run migrations |
| `make makemigrations` | Create migrations |
| `make db-shell` | MySQL shell |
| `make backup` | Backup database |
| `make restore BACKUP=file.sql` | Restore database |

### Testing
| Command | Description |
|---------|-------------|
| `make test` | Run tests |
| `make test-coverage` | Tests with coverage |
| `make test-verbose` | Verbose tests |

### Django
| Command | Description |
|---------|-------------|
| `make createsuperuser` | Create admin user |
| `make collectstatic` | Collect static files |
| `make shell` | Django shell |

### Maintenance
| Command | Description |
|---------|-------------|
| `make clean` | Remove all containers |
| `make clean-volumes` | Remove volumes |
| `make prune` | Clean unused resources |
| `make rebuild` | Rebuild from scratch |

### Logs
| Command | Description |
|---------|-------------|
| `make logs` | All logs |
| `make logs-backend` | Backend only |
| `make logs-db` | Database only |
| `make logs-redis` | Redis only |

### Shell Access
| Command | Description |
|---------|-------------|
| `make shell` | Django shell |
| `make bash` | Bash shell |
| `make db-shell` | MySQL shell |
| `make redis-cli` | Redis CLI |

## 🔧 Docker Compose Commands

### Without Makefile
```bash
# Start
docker-compose up -d

# Stop
docker-compose down

# Logs
docker-compose logs -f

# Execute command
docker-compose exec backend python manage.py migrate

# Multiple compose files
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up
```

## 📁 Files

- `docker-compose.yml` - Standard setup
- `docker-compose.dev.yml` - Development
- `docker-compose.prod.yml` - Production with Nginx
- `Dockerfile` - Production image
- `Dockerfile.dev` - Development image
- `.dockerignore` - Exclude files from build
- `docker-entrypoint.sh` - Startup script

## 🌐 URLs

| Service | URL |
|---------|-----|
| Backend API | http://localhost:8000 |
| Admin Panel | http://localhost:8000/admin/ |
| Swagger Docs | http://localhost:8000/api/schema/swagger-ui/ |
| ReDoc | http://localhost:8000/api/schema/redoc/ |
| Health Check | http://localhost:8000/health/ |
| Frontend | http://localhost:5173 |
| MySQL | localhost:3306 |
| Redis | localhost:6379 |

## 🔐 Environment Variables

```env
# Core
SECRET_KEY=your-secret-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database
DB_NAME=taskmanager_db
DB_USER=taskmanager_user
DB_PASSWORD=secure-password
DB_HOST=db
DB_PORT=3306

# Redis
REDIS_HOST=redis
REDIS_PORT=6379

# Gunicorn
GUNICORN_WORKERS=4
LOG_LEVEL=info
```

## 🏥 Health Checks

```bash
# Check all services
make health

# Check specific service
curl http://localhost:8000/health/

# Container status
docker-compose ps
```

## 🐛 Troubleshooting

```bash
# View logs
make logs

# Restart service
docker-compose restart backend

# Rebuild single service
docker-compose up -d --build backend

# Check container status
docker-compose ps

# Inspect container
docker inspect taskmanager_backend

# Remove everything and start fresh
make clean
make rebuild
```

## 💾 Backup & Restore

```bash
# Create backup
make backup

# Restore from backup
make restore BACKUP=backups/backup_20260303_120000.sql

# Manual backup
docker-compose exec -T db mysqldump -u root -p$DB_PASSWORD $DB_NAME > backup.sql

# Manual restore
docker-compose exec -T db mysql -u root -p$DB_PASSWORD $DB_NAME < backup.sql
```

## 🔄 Update Workflow

```bash
# 1. Pull latest code
git pull

# 2. Stop services
make down

# 3. Rebuild
make build

# 4. Start services
make up-d

# 5. Run migrations
make migrate

# 6. Check health
make health
```

## 📝 Notes

- Run `make help` for complete command list
- Use `.env` file for configuration
- Development uses volume mounting for hot reload
- Production includes Nginx reverse proxy
- All data persists in named volumes
- Health checks ensure service availability

---

**For detailed documentation, see [DOCKER.md](DOCKER.md)**
