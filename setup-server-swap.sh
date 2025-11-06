#!/bin/bash
# Script to create swap file on server for npm builds
# Run this once on the server to add 2GB swap

echo "=== Current Memory ==="
free -h

echo ""
echo "=== Creating 2GB swap file ==="
# Check if swap already exists
if [ -f /swapfile ]; then
    echo "Swap file already exists. Skipping creation."
    swapon --show
else
    echo "Creating 2GB swap file..."
    fallocate -l 2G /swapfile || dd if=/dev/zero of=/swapfile bs=1M count=2048
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    
    echo ""
    echo "=== Adding to /etc/fstab for persistence ==="
    if ! grep -q "/swapfile" /etc/fstab; then
        echo "/swapfile none swap sw 0 0" >> /etc/fstab
        echo "Added to /etc/fstab"
    else
        echo "Already in /etc/fstab"
    fi
    
    echo ""
    echo "=== New Memory Status ==="
    free -h
    echo ""
    echo "✅ Swap file created successfully!"
fi

