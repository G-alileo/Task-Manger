.PHONY: help build up down restart logs clean test dev prod ps shell migrate collectstatic createsuperuser backup restore

# Default target
.DEFAULT_GOAL := help

# Colors for output
BLUE := \033[0;34m
GREEN := \033[0;32m
YELLOW := \033[1;33m
RED := \033[0;31m
NC := \033[0m # No Color

help: ## Show this help message
	@echo "$(BLUE)Task Manager - Docker Management$(NC)"
	@echo ""
	@echo "$(GREEN)Available commands:$(NC)"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(YELLOW)%-20s$(NC) %s\n", $$1, $$2}'

# Development commands
dev: ## Start development environment
	@echo "$(GREEN)Starting development environment...$(NC)"
	docker-compose -f docker-compose.dev.yml up --build

dev-d: ## Start development environment in background
	@echo "$(GREEN)Starting development environment in background...$(NC)"
	docker-compose -f docker-compose.dev.yml up -d --build

dev-down: ## Stop development environment
	@echo "$(YELLOW)Stopping development environment...$(NC)"
	docker-compose -f docker-compose.dev.yml down

# Production commands
prod: ## Start production environment
	@echo "$(GREEN)Starting production environment...$(NC)"
	docker-compose -f docker-compose.prod.yml up --build

prod-d: ## Start production environment in background
	@echo "$(GREEN)Starting production environment in background...$(NC)"
	docker-compose -f docker-compose.prod.yml up -d --build

prod-down: ## Stop production environment
	@echo "$(YELLOW)Stopping production environment...$(NC)"
	docker-compose -f docker-compose.prod.yml down

# Standard commands
build: ## Build Docker images
	@echo "$(GREEN)Building Docker images...$(NC)"
	docker-compose build

up: ## Start all services
	@echo "$(GREEN)Starting all services...$(NC)"
	docker-compose up

up-d: ## Start all services in background
	@echo "$(GREEN)Starting all services in background...$(NC)"
	docker-compose up -d

down: ## Stop all services
	@echo "$(YELLOW)Stopping all services...$(NC)"
	docker-compose down

restart: ## Restart all services
	@echo "$(YELLOW)Restarting all services...$(NC)"
	docker-compose restart

ps: ## Show running containers
	@docker-compose ps

logs: ## Show logs from all services
	@docker-compose logs -f

logs-backend: ## Show backend logs
	@docker-compose logs -f backend

logs-db: ## Show database logs
	@docker-compose logs -f db

logs-redis: ## Show Redis logs
	@docker-compose logs -f redis

# Shell commands
shell: ## Open Django shell in backend container
	@echo "$(GREEN)Opening Django shell...$(NC)"
	docker-compose exec backend python manage.py shell

bash: ## Open bash shell in backend container
	@echo "$(GREEN)Opening bash shell in backend...$(NC)"
	docker-compose exec backend bash

db-shell: ## Open MySQL shell
	@echo "$(GREEN)Opening MySQL shell...$(NC)"
	docker-compose exec db mysql -u root -p

redis-cli: ## Open Redis CLI
	@echo "$(GREEN)Opening Redis CLI...$(NC)"
	docker-compose exec redis redis-cli

# Django commands
migrate: ## Run database migrations
	@echo "$(GREEN)Running migrations...$(NC)"
	docker-compose exec backend python manage.py migrate

makemigrations: ## Create new migrations
	@echo "$(GREEN)Creating migrations...$(NC)"
	docker-compose exec backend python manage.py makemigrations

collectstatic: ## Collect static files
	@echo "$(GREEN)Collecting static files...$(NC)"
	docker-compose exec backend python manage.py collectstatic --noinput

createsuperuser: ## Create Django superuser
	@echo "$(GREEN)Creating superuser...$(NC)"
	docker-compose exec backend python manage.py createsuperuser

# Testing commands
test: ## Run all tests
	@echo "$(GREEN)Running tests...$(NC)"
	docker-compose exec backend pytest

test-coverage: ## Run tests with coverage
	@echo "$(GREEN)Running tests with coverage...$(NC)"
	docker-compose exec backend pytest --cov=apps --cov-report=html --cov-report=term

test-verbose: ## Run tests in verbose mode
	@echo "$(GREEN)Running tests in verbose mode...$(NC)"
	docker-compose exec backend pytest -v

# Maintenance commands
clean: ## Remove all containers, volumes, and images
	@echo "$(RED)Removing all containers, volumes, and images...$(NC)"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		docker-compose down -v --rmi all; \
		echo "$(GREEN)Cleanup complete!$(NC)"; \
	else \
		echo "$(YELLOW)Cleanup cancelled.$(NC)"; \
	fi

clean-volumes: ## Remove all volumes
	@echo "$(RED)Removing all volumes...$(NC)"
	docker-compose down -v

prune: ## Remove unused Docker resources
	@echo "$(YELLOW)Pruning unused Docker resources...$(NC)"
	docker system prune -f

# Backup commands
backup: ## Backup database
	@echo "$(GREEN)Creating database backup...$(NC)"
	@mkdir -p backups
	docker-compose exec -T db mysqldump -u root -p$$DB_PASSWORD $$DB_NAME > backups/backup_$$(date +%Y%m%d_%H%M%S).sql
	@echo "$(GREEN)Backup created successfully!$(NC)"

restore: ## Restore database from backup (usage: make restore BACKUP=backups/backup_file.sql)
	@if [ -z "$(BACKUP)" ]; then \
		echo "$(RED)Error: Please specify BACKUP file$(NC)"; \
		echo "Usage: make restore BACKUP=backups/backup_file.sql"; \
		exit 1; \
	fi
	@echo "$(YELLOW)Restoring database from $(BACKUP)...$(NC)"
	docker-compose exec -T db mysql -u root -p$$DB_PASSWORD $$DB_NAME < $(BACKUP)
	@echo "$(GREEN)Database restored successfully!$(NC)"

# Health checks
health: ## Check health of all services
	@echo "$(GREEN)Checking service health...$(NC)"
	@docker-compose ps
	@echo ""
	@echo "$(GREEN)Backend health:$(NC)"
	@curl -s http://localhost:8000/health/ | python -m json.tool || echo "$(RED)Backend is not responding$(NC)"

# Quick rebuild
rebuild: ## Rebuild and restart all services
	@echo "$(GREEN)Rebuilding and restarting services...$(NC)"
	docker-compose down
	docker-compose build --no-cache
	docker-compose up -d
	@echo "$(GREEN)Services rebuilt and started!$(NC)"
