#!/bin/bash
# Script to check server memory and resources

echo "=== Memory Information ==="
free -h

echo ""
echo "=== Detailed Memory Info ==="
cat /proc/meminfo | grep -E "MemTotal|MemFree|MemAvailable|SwapTotal|SwapFree"

echo ""
echo "=== Disk Space ==="
df -h /

echo ""
echo "=== Node.js Memory Limit ==="
node --max-old-space-size=4096 -e "console.log('Node.js can use up to 4GB')" 2>/dev/null || echo "Node.js not available"

echo ""
echo "=== Current Node.js Processes ==="
ps aux | grep node | grep -v grep | head -5

echo ""
echo "=== System Load ==="
uptime

echo ""
echo "=== Top Memory Consumers ==="
ps aux --sort=-%mem | head -10

