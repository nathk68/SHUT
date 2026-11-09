#!/bin/bash
# ─────────────────────────────────────────────────────────────
# SHUT HLS Simulation Script
# Simule un vrai stream RTMP vers Mux avec ffmpeg (test pattern)
#
# Usage:
#   ./simulate-hls.sh <STREAM_KEY> [DURATION_SECONDS]
#
# Prerequis:
#   brew install ffmpeg  (si pas installe)
#
# Cout estime: ~$0.055/min d'ingest Mux
# ─────────────────────────────────────────────────────────────

set -e

STREAM_KEY="${1}"
DURATION="${2:-300}"  # 5 min par defaut
RTMP_URL="rtmp://global-live.mux.com:5222/app"

if [ -z "$STREAM_KEY" ]; then
  echo ""
  echo "  Usage: ./simulate-hls.sh <STREAM_KEY> [DURATION_SECONDS]"
  echo ""
  echo "  STREAM_KEY:  Ton Mux stream key (trouve dans Firestore > users > muxStreamKey)"
  echo "  DURATION:    Duree en secondes (defaut: 300 = 5 min)"
  echo ""
  echo "  Exemple:"
  echo "    ./simulate-hls.sh abc123def456 60    # 1 min de test"
  echo ""
  echo "  Cout estime: ~\$0.055/min d'ingest"
  echo "  Pour 5 min: ~\$0.28"
  echo ""
  exit 1
fi

echo ""
echo "  SHUT HLS Simulation"
echo "  ─────────────────────────────────"
echo "  Stream Key:  ${STREAM_KEY:0:6}..."
echo "  Duree:       ${DURATION}s"
echo "  RTMP URL:    ${RTMP_URL}"
echo "  ─────────────────────────────────"
echo ""

# Check ffmpeg
if ! command -v ffmpeg &> /dev/null; then
  echo "  ERREUR: ffmpeg non installe!"
  echo "  Installe avec: brew install ffmpeg"
  exit 1
fi

echo "  Demarrage du stream test..."
echo "  (Ctrl+C pour arreter)"
echo ""

# Generate a test pattern with DJ-style text overlay and synthetic audio
ffmpeg -hide_banner -loglevel warning \
  -re \
  -f lavfi -i "testsrc2=size=1280x720:rate=30" \
  -f lavfi -i "sine=frequency=440:sample_rate=44100" \
  -vf "drawtext=text='SHUT LOAD TEST':fontsize=48:fontcolor=white:x=(w-text_w)/2:y=h/4,drawtext=text='%{localtime}':fontsize=36:fontcolor=yellow:x=(w-text_w)/2:y=h/2,drawtext=text='Stream Key\: ${STREAM_KEY:0:6}...':fontsize=24:fontcolor=gray:x=(w-text_w)/2:y=3*h/4" \
  -c:v libx264 -preset veryfast -b:v 1500k -maxrate 1500k -bufsize 3000k \
  -g 60 -keyint_min 60 \
  -c:a aac -b:a 128k -ar 44100 \
  -f flv \
  -t "$DURATION" \
  "${RTMP_URL}/${STREAM_KEY}"

echo ""
echo "  Stream termine apres ${DURATION}s"
echo ""
