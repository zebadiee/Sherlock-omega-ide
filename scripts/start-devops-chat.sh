#!/bin/bash

# Sherlock Ω DevOps Chat Startup Script
# Usage: ./scripts/start-devops-chat.sh [mode]
# Modes: simulation (default), real, hybrid

MODE=${1:-simulation}
PORT=${2:-3000}

echo "🚀 Starting Sherlock Ω DevOps Chat"
echo "📋 Mode: $MODE"
echo "🌐 Port: $PORT"
echo ""

case $MODE in
  "real")
    echo "⚠️  WARNING: REAL EXECUTION MODE ENABLED!"
    echo "   This will execute actual system commands!"
    echo "   Press Ctrl+C within 5 seconds to cancel..."
    sleep 5
    echo ""
    DEVOPS_MODE=real PORT=$PORT npm run demo:simple
    ;;
  "hybrid")
    echo "🔄 HYBRID MODE: Safe commands will execute for real"
    DEVOPS_MODE=hybrid PORT=$PORT npm run demo:simple
    ;;
  "simulation")
    echo "🎭 SIMULATION MODE: All commands are simulated"
    DEVOPS_MODE=simulation PORT=$PORT npm run demo:simple
    ;;
  *)
    echo "❌ Invalid mode: $MODE"
    echo "Valid modes: simulation, real, hybrid"
    exit 1
    ;;
esac