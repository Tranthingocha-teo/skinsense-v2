#!/usr/bin/env bash
# Ticket 07 rating pass: turn one good photo into graded bad ones with known
# ground truth, so Dinh can point at the step where each signal becomes "bad".
# Yaw cannot be faked in 2D — real turned-head photos cover that.
# Usage: bash degrade.sh photos/<name>.jpg   → photos/rating/<name>__<variant>.jpg
set -euo pipefail
src=$1
name=$(basename "${src%.*}")
out=$(dirname "$src")/rating
mkdir -p "$out"

v() { ffmpeg -y -loglevel error -i "$src" -vf "$2" -q:v 2 "$out/${name}__$1.jpg"; echo "$out/${name}__$1.jpg"; }

for ev in 1 1.5 2 3; do v "dark$ev" "exposure=exposure=-$ev"; done  # filter range is ±3 EV
for ev in 1 2 3; do v "bright$ev" "exposure=exposure=$ev"; done
# far: shrink the whole frame and pad with a neutral wall colour
for f in 70 50 35; do v "far$f" "scale=iw*$f/100:ih*$f/100,pad=iw*100/$f:ih*100/$f:(ow-iw)/2:(oh-ih)/2:color=0x9a9590"; done
# close: centre crop then scale back up
for f in 70 55; do v "close$f" "crop=iw*$f/100:ih*$f/100,scale=iw*100/$f:ih*100/$f"; done
# off-centre: crop a corner-anchored window, face ends up toward one edge
v "offcenter" "crop=iw*0.8:ih*0.8:0:0,scale=iw*1.25:ih*1.25"
v "offcenter2" "crop=iw*0.7:ih*0.7:iw*0.3:ih*0.3,scale=iw/0.7:ih/0.7"
for s in 1.5 3 6 10; do v "blur$s" "gblur=sigma=$s"; done
