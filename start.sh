#!/bin/bash

# LOL Companion - Development Startup Script
# This script starts both the backend server and frontend client

echo "🚀 Starting LOL Companion Development Environment..."
echo "=============================================="

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️  Warning: .env file not found. Make sure to configure your RIOT_API_KEY${NC}"
    echo ""
fi

# Function to kill background processes on exit
cleanup() {
    echo -e "\n${YELLOW}🛑 Shutting down servers...${NC}"
    kill $SERVER_PID $CLIENT_PID 2>/dev/null
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Start backend server
echo -e "${BLUE}📡 Starting backend server...${NC}"
cd server
npm run dev > ../server.log 2>&1 &
SERVER_PID=$!
cd ..

# Wait a moment for server to start
sleep 3

# Check if server started successfully
if ps -p $SERVER_PID > /dev/null; then
    echo -e "${GREEN}✅ Backend server started (PID: $SERVER_PID)${NC}"
    echo -e "   📋 Server logs: tail -f server.log"
    echo -e "   🌐 API: http://localhost:4000"
else
    echo -e "${YELLOW}❌ Failed to start backend server${NC}"
    echo -e "   Check server.log for errors"
    exit 1
fi

# Start frontend client
echo -e "${BLUE}🎨 Starting frontend client...${NC}"
cd client
npm run dev > ../client.log 2>&1 &
CLIENT_PID=$!
cd ..

# Wait a moment for client to start
sleep 3

# Check if client started successfully
if ps -p $CLIENT_PID > /dev/null; then
    echo -e "${GREEN}✅ Frontend client started (PID: $CLIENT_PID)${NC}"
    echo -e "   📋 Client logs: tail -f client.log"
    echo -e "   🌐 App: http://localhost:5173"
else
    echo -e "${YELLOW}❌ Failed to start frontend client${NC}"
    echo -e "   Check client.log for errors"
    kill $SERVER_PID
    exit 1
fi

echo ""
echo -e "${GREEN}🎉 LOL Companion is now running!${NC}"
echo "=============================================="
echo -e "📱 Frontend: ${BLUE}http://localhost:5173${NC}"
echo -e "🔧 Backend:  ${BLUE}http://localhost:4000${NC}"
echo -e "📊 API Test: ${BLUE}http://localhost:4000/api/debug${NC}"
echo ""
echo -e "${YELLOW}📋 Useful commands:${NC}"
echo "   tail -f server.log  # View server logs"
echo "   tail -f client.log  # View client logs"
echo ""
echo -e "${YELLOW}⏹️  Press Ctrl+C to stop both servers${NC}"
echo ""

# Keep script running and show logs
echo -e "${BLUE}📋 Recent server logs:${NC}"
tail -5 server.log

# Wait for user to stop
wait 