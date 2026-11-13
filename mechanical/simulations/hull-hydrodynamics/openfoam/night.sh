#!/bin/bash
# Multi-night runner for the Test Assembly 10 roll-decay cases (see README, "Test Assembly 10 multi-night run").
#   ./night.sh prepare            mesh + set fields + decompose both cases (once)
#   ./night.sh resume [--until HH:MM] [--force]   start or resume both cases, keep the Mac awake while they run
#   ./night.sh stop               write the current state and stop both cases cleanly (morning)
#   ./night.sh status             where each case is
# Env: CFD_ROOT (default ~/scout-cfd), CASES (default "ta10-fins ta10-nofins").
ROOT=${CFD_ROOT:-$HOME/scout-cfd}; HERE=$(cd "$(dirname "$0")" && pwd)
CASES=${CASES:-"ta10-fins ta10-nofins"}
export PATH=/opt/homebrew/bin:$PATH
alive() { [ -f "$1/RUN.pid" ] && kill -0 "$(cat "$1/RUN.pid")" 2>/dev/null; }
latest() { ls "$1"/processor0 2>/dev/null | grep -E '^[0-9.eE+-]+$' | sort -g | tail -1; }
setstop() { sed -i '' -E "s/^stopAt .*/stopAt          $2;/" "$1/system/controlDict"; }
endtime() { awk '/^endTime/ {gsub(";","",$2); print $2}' "$1/system/controlDict"; }

case "$1" in
prepare)
  for c in $CASES; do d=$ROOT/foam/$c
    # one `openfoam -c` per step: a long && chain inside one call crashed (segmentation fault) in the OpenFOAM shell
    /bin/rm -rf "$d"/0 "$d"/processor* "$d"/PREPARED; cp -r "$d/0.orig" "$d/0"
    for step in "blockMesh" "snappyHexMesh -overwrite" "checkMesh" "setFields" "decomposePar -force"; do
      openfoam -c "cd $d && $step > log.${step%% *} 2>&1" || { echo "$c: $step failed"; continue 2; }
    done
    echo PREPARED > "$d/PREPARED"
  done
  for c in $CASES; do d=$ROOT/foam/$c; [ -f "$d/PREPARED" ] && echo "$c: prepared. $(grep -m1 'cells:' $d/log.checkMesh) | $(grep -E '^Mesh OK|Failed' $d/log.checkMesh | head -1)" || echo "$c: PREPARE FAILED, see $d/log.*"; done ;;
resume)
  shift; UNTIL=""; FORCE=0
  while [ $# -gt 0 ]; do case "$1" in --until) UNTIL=$2; shift 2;; --force) FORCE=1; shift;; *) shift;; esac; done
  if ! pmset -g ps | head -1 | grep -q "AC Power" && [ $FORCE = 0 ]; then echo "Not on AC power: plug in (or --force)."; exit 1; fi
  for c in $CASES; do d=$ROOT/foam/$c
    [ -f "$d/PREPARED" ] || { echo "$c: not prepared (run ./night.sh prepare)"; continue; }
    alive "$d" && { echo "$c: already running (pid $(cat $d/RUN.pid))"; continue; }
    t=$(latest "$d"); e=$(endtime "$d")
    if awk "BEGIN{exit !($t >= $e)}"; then echo "$c: finished (t=$t of $e)"; continue; fi
    python3 "$HERE/fix_denormals.py" "$d"
    setstop "$d" endTime; N=$(cat "$d/RANKS")
    nohup openfoam -c "cd $d && mpirun -np $N interFoam -parallel >> log.interFoam 2>&1" > /dev/null 2>&1 &
    echo $! > "$d/RUN.pid"
    nohup caffeinate -dimsu -w "$(cat $d/RUN.pid)" > /dev/null 2>&1 &
    echo "$c: resumed from t=$t (end $e), $N ranks, pid $(cat $d/RUN.pid), Mac kept awake while it runs"
  done
  if [ -n "$UNTIL" ]; then
    secs=$(python3 -c "import datetime as D;n=D.datetime.now();h,m=map(int,'$UNTIL'.split(':'));t=n.replace(hour=h,minute=m,second=0,microsecond=0);t=t if t>n else t+D.timedelta(days=1);print(int((t-n).total_seconds()))")
    nohup caffeinate -dimsu -t "$secs" > /dev/null 2>&1 &
    nohup sh -c "sleep $secs; '$0' stop >> '$ROOT/night.log' 2>&1" > /dev/null 2>&1 &
    echo "Will stop cleanly at $UNTIL (in ${secs}s). Log: $ROOT/night.log"
  fi ;;
stop)
  for c in $CASES; do d=$ROOT/foam/$c
    alive "$d" || { echo "$c: not running (t=$(latest $d))"; rm -f "$d/RUN.pid"; continue; }
    setstop "$d" writeNow
    for i in $(seq 1 120); do alive "$d" || break; sleep 5; done
    if alive "$d"; then echo "$c: still running after 10 min, try again"; else setstop "$d" endTime; rm -f "$d/RUN.pid"; echo "$c: stopped and saved at t=$(latest $d)"; fi
  done ;;
status)
  for c in $CASES; do d=$ROOT/foam/$c
    if alive "$d"; then s="RUNNING pid $(cat $d/RUN.pid)"; else s="stopped"; fi
    echo "$c: $s | saved t=$(latest $d) of $(endtime $d) | $(grep '^Time = ' $d/log.interFoam 2>/dev/null | tail -1) | $(grep 'ClockTime' $d/log.interFoam 2>/dev/null | tail -1)"
    grep -E 'Orientation' $d/log.interFoam 2>/dev/null | tail -1
  done
  pmset -g ps | head -1; pgrep -lf caffeinate | head -3 ;;
*) sed -n 2,7p "$0" ;;
esac
