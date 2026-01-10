#!/bin/bash

# Script to optimize MP4 videos for web horizontal scrolling carousel
# Usage: ./optimize-videos.sh input1.mp4 input2.mp4

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting video optimization for web...${NC}"

# Check if ffmpeg is installed
if ! command -v ffmpeg &> /dev/null; then
    echo -e "${YELLOW}FFmpeg is not installed. Installing via Homebrew...${NC}"
    brew install ffmpeg
fi

# Process each video file
for input_file_arg in "$@"; do
    input_file="$input_file_arg"
    
    # Try to find file if path is not absolute
    if [ ! -f "$input_file" ]; then
        # Try to find in common locations (Downloads first, as it's most common)
        if [ -f "$HOME/Downloads/$input_file" ]; then
            input_file="$HOME/Downloads/$input_file"
            echo -e "${GREEN}Found in Downloads: $input_file${NC}"
        elif [ -f "public/$input_file" ]; then
            input_file="public/$input_file"
            echo -e "${GREEN}Found in public/: $input_file${NC}"
        elif [ -f "$HOME/Desktop/$input_file" ]; then
            input_file="$HOME/Desktop/$input_file"
            echo -e "${GREEN}Found on Desktop: $input_file${NC}"
        elif [ -f "$HOME/Documents/$input_file" ]; then
            input_file="$HOME/Documents/$input_file"
            echo -e "${GREEN}Found in Documents: $input_file${NC}"
        elif [ -f "./$input_file" ]; then
            input_file="./$input_file"
            echo -e "${GREEN}Found in current directory: $input_file${NC}"
        fi
    fi
    
    if [ ! -f "$input_file" ]; then
        echo -e "${YELLOW}✗ File not found: $input_file_arg${NC}"
        echo -e "${YELLOW}  Searched in: Downloads, Desktop, Documents, current directory${NC}"
        continue
    fi
    
    # Get filename without extension
    filename=$(basename "$input_file" .MP4)
    filename=$(basename "$filename" .mp4)
    
    # Output directory
    output_dir="public/videos"
    mkdir -p "$output_dir"
    
    # Output filename - handle both IMG_* and video* files
    if [[ "$filename" == video* ]]; then
        output_file="$output_dir/${filename}-optimized.mp4"
    else
        output_file="$output_dir/${filename}-optimized.mp4"
    fi
    
    echo -e "${GREEN}Processing: $input_file${NC}"
    
    # Step 1: Resize and compress video
    # For horizontal scrolling, we want landscape orientation
    # Target: 1280x720 (16:9) or maintain aspect ratio if already landscape
    echo "  → Resizing and compressing..."
    ffmpeg -i "$input_file" \
        -vf "scale=1280:-2" \
        -c:v libx264 \
        -crf 23 \
        -preset medium \
        -profile:v high \
        -level 4.0 \
        -c:a aac \
        -b:a 128k \
        -movflags +faststart \
        -pix_fmt yuv420p \
        -y \
        "$output_file" 2>&1 | tail -5
    
    if [ $? -eq 0 ]; then
        # Get file sizes
        original_size=$(du -h "$input_file" | cut -f1)
        optimized_size=$(du -h "$output_file" | cut -f1)
        
        echo -e "${GREEN}  ✓ Optimized: $input_file${NC}"
        echo -e "    Original: $original_size → Optimized: $optimized_size"
        echo -e "    Output: $output_file"
    else
        echo -e "${YELLOW}  ✗ Failed to optimize: $input_file${NC}"
    fi
    
    echo ""
done

echo -e "${GREEN}Optimization complete!${NC}"
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Review the optimized videos in public/videos/"
echo "2. Update src/pages/index.astro to use the new video files"
echo "3. Test the horizontal scrolling carousel"
