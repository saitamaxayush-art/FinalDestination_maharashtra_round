#!/usr/bin/env bash
set -e

mkdir -p public/story/desktop public/story/mobile

if ffmpeg -encoders 2>/dev/null | grep -q "libwebp"; then
  echo "Using ffmpeg libwebp encoder directly..."
  ffmpeg -y -i reference/story.mp4 -t 8.5 -vf "scale=1280:720:flags=lanczos" -c:v libwebp -quality 82 -compression_level 6 public/story/desktop/f_%03d.webp
  ffmpeg -y -i reference/story.mp4 -t 8.5 -vf "scale=854:480:flags=lanczos" -c:v libwebp -quality 80 public/story/mobile/f_%03d.webp
else
  echo "ffmpeg does not have libwebp built-in; using ffmpeg + cwebp pipeline..."
  TMP_DIR=$(mktemp -d)
  mkdir -p "$TMP_DIR/desk" "$TMP_DIR/mob"
  
  echo "Extracting PNG frames from video..."
  ffmpeg -y -i reference/story.mp4 -t 8.5 -vf "scale=1280:720:flags=lanczos" "$TMP_DIR/desk/f_%03d.png"
  ffmpeg -y -i reference/story.mp4 -t 8.5 -vf "scale=854:480:flags=lanczos" "$TMP_DIR/mob/f_%03d.png"
  
  echo "Encoding desktop WebP frames (-quality 82 -m 6)..."
  find "$TMP_DIR/desk" -name "f_*.png" | xargs -n 1 -P 8 -I {} sh -c 'base=$(basename "$1" .png); cwebp -quiet -q 82 -m 6 "$1" -o "public/story/desktop/${base}.webp"' _ {}
  
  echo "Encoding mobile WebP frames (-quality 80)..."
  find "$TMP_DIR/mob" -name "f_*.png" | xargs -n 1 -P 8 -I {} sh -c 'base=$(basename "$1" .png); cwebp -quiet -q 80 "$1" -o "public/story/mobile/${base}.webp"' _ {}
  
  rm -rf "$TMP_DIR"
fi

# Generate poster from frame 1
cp public/story/desktop/f_001.webp public/story/poster.webp

# Count frames
DESKTOP_COUNT=$(ls -1 public/story/desktop/f_*.webp 2>/dev/null | wc -l | tr -d ' ')
MOBILE_COUNT=$(ls -1 public/story/mobile/f_*.webp 2>/dev/null | wc -l | tr -d ' ')

echo "Desktop frames: $DESKTOP_COUNT"
echo "Mobile frames: $MOBILE_COUNT"

cat <<EOF > public/story/manifest.json
{
  "frameCount": $DESKTOP_COUNT,
  "fps": 24,
  "duration": 8.5,
  "desktop": {
    "width": 1280,
    "height": 720,
    "pathPattern": "/story/desktop/f_%03d.webp"
  },
  "mobile": {
    "width": 854,
    "height": 480,
    "pathPattern": "/story/mobile/f_%03d.webp"
  },
  "poster": "/story/poster.webp"
}
EOF

echo "Done! Manifest generated at public/story/manifest.json"
