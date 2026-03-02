#!/bin/bash
set -e

echo "==============================================="
echo "   Task Manager Backend - Starting Up"
echo "==============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to wait for a service
wait_for_service() {
    local host=$1
    local port=$2
    local service=$3
    local max_attempts=30
    local attempt=1

    echo -e "${YELLOW}Waiting for $service to be ready...${NC}"
    
    while ! nc -z "$host" "$port" >/dev/null 2>&1; do
        if [ $attempt -eq $max_attempts ]; then
            echo -e "${RED}ERROR: $service is not available after $max_attempts attempts${NC}"
            exit 1
        fi
        echo "Attempt $attempt/$max_attempts: $service is unavailable - sleeping"
        attempt=$((attempt + 1))
        sleep 2
    done
    
    echo -e "${GREEN}✓ $service is ready!${NC}"
}

# Wait for database
if [ -n "$DB_HOST" ] && [ -n "$DB_PORT" ]; then
    wait_for_service "$DB_HOST" "$DB_PORT" "Database"
else
    echo -e "${YELLOW}No database configuration found, skipping database wait...${NC}"
fi

# Wait for Redis
if [ -n "$REDIS_HOST" ] && [ -n "$REDIS_PORT" ]; then
    wait_for_service "$REDIS_HOST" "$REDIS_PORT" "Redis"
else
    echo -e "${YELLOW}No Redis configuration found, skipping Redis wait...${NC}"
fi

echo ""
echo "==============================================="
echo "   Running Database Migrations"
echo "==============================================="
python manage.py migrate --noinput

echo ""
echo "==============================================="
echo "   Collecting Static Files"
echo "==============================================="
python manage.py collectstatic --noinput --clear

echo ""
echo "==============================================="
echo "   Starting Application"
echo "==============================================="
echo -e "${GREEN}All checks passed! Starting server...${NC}"
echo ""

# Execute the main command
exec "$@"
