#!/bin/bash

# Script to create poster images from optimized videos
# Usage: ./create-video-posters.sh

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}Creating video posters...${NC}"

# Check if ffmpeg is installed
if ! command -v ffmpeg &> /dev/null; then
    echo -e "${YELLOW}FFmpeg is not installed.${NC}"
    exit 1
fi

# Output directory
output_dir="public/videos"
mkdir -p "$output_dir"

# Process each optimized video
for video_file in public/videos/IMG_*-optimized.mp4; do
    if [ ! -f "$video_file" ]; then
        continue
    fi
    
    # Get filename without extension
    filename=$(basename "$video_file" -optimized.mp4)
    poster_file="$output_dir/${filename}-poster.webp"
    
    echo -e "${GREEN}Creating poster for: $video_file${NC}"
    
    # Extract frame at 1 second (or 10% of video duration, whichever is smaller)
    ffmpeg -i "$video_file" \
        -vf "scale=1280:-2" \
        -frames:v 1 \
        -y \
        "$poster_file" 2>&1 | grep -E "(Duration|Stream|frame)" || true
    
    if [ -f "$poster_file" ]; then
        echo -e "${GREEN}  ✓ Created: $poster_file${NC}"
    else
        echo -e "${YELLOW}  ✗ Failed to create poster${NC}"
    fi
done

echo -e "${GREEN}Poster creation complete!${NC}"
