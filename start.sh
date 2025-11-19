#!/bin/bash

echo "🏥 ED Provider Dashboard - Startup Script"
echo "=========================================="
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    echo "Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    echo "Visit: https://docs.docker.com/compose/install/"
    exit 1
fi

echo "✅ Docker and Docker Compose are installed"
echo ""

# Check if containers are already running
if docker ps | grep -q "ed-dashboard"; then
    echo "⚠️  Dashboard containers are already running"
    echo ""
    echo "Options:"
    echo "  1. Stop and restart (docker-compose down && docker-compose up -d --build)"
    echo "  2. Just view logs (docker-compose logs -f)"
    echo "  3. Exit"
    read -p "Choose option (1/2/3): " choice

    case $choice in
        1)
            echo "Stopping and restarting..."
            docker-compose down
            docker-compose up -d --build
            ;;
        2)
            docker-compose logs -f
            exit 0
            ;;
        3)
            exit 0
            ;;
        *)
            echo "Invalid choice"
            exit 1
            ;;
    esac
else
    echo "🚀 Building and starting the dashboard..."
    echo ""
    docker-compose up -d --build
fi

# Wait a moment for containers to start
echo ""
echo "⏳ Waiting for containers to start..."
sleep 5

# Check if containers are running
if docker ps | grep -q "ed-dashboard-backend" && docker ps | grep -q "ed-dashboard-frontend"; then
    echo ""
    echo "✅ Dashboard is running!"
    echo ""
    echo "📱 Access URLs:"
    echo "   Frontend: http://localhost:3000"
    echo "   Backend API: http://localhost:3001/api"
    echo "   Health Check: http://localhost:3001/api/health"
    echo ""
    echo "📊 View logs:"
    echo "   docker-compose logs -f"
    echo ""
    echo "🛑 Stop dashboard:"
    echo "   docker-compose down"
    echo ""
    echo "🔄 Restart:"
    echo "   docker-compose restart"
    echo ""
else
    echo ""
    echo "❌ Failed to start containers. Check logs:"
    echo "   docker-compose logs"
    exit 1
fi
