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
    if awk "BEGIN{exit !($t >= $e)}" || { tail -5 "$d/log.interFoam" 2>/dev/null | grep -q '^End' && grep '^Time = ' "$d/log.interFoam" | tail -1 | awk -v e=$e '{exit !($3 >= e-1e-3)}'; }; then echo "$c: finished (t=$t of $e)"; continue; fi
    python3 "$HERE/fix_denormals.py" "$d"
    setstop "$d" endTime; N=$(cat "$d/RANKS")
    nohup openfoam -c "cd $d && mpirun -np $N interFoam -parallel >> log.interFoam 2>&1" > /dev/null 2>&1 &
    echo $! > "$d/RUN.pid"; echo "$t $(date +%s)" > "$d/RUN.t0"
    nohup caffeinate -dimsu -w "$(cat $d/RUN.pid)" > /dev/null 2>&1 &
    echo "$c: resumed from t=$t (end $e), $N ranks, pid $(cat $d/RUN.pid), Mac kept awake while it runs"
  done
  if [ -n "$UNTIL" ]; then
    secs=$(python3 -c "import datetime as D;n=D.datetime.now();h,m=map(int,'$UNTIL'.split(':'));t=n.replace(hour=h,minute=m,second=0,microsecond=0);t=t if t>n else t+D.timedelta(days=1);print(int((t-n).total_seconds()))")
    echo "$(date +%s) $(( $(date +%s) + secs ))" > "$ROOT/night.window"
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
  bar() { awk -v f="$1" -v w=30 'BEGIN{f=(f<0)?0:(f>1?1:f); n=int(f*w+0.5); b=""; for(i=0;i<w;i++) b=b (i<n?"#":"-"); printf "[%s] %5.1f%%", b, f*100}'; }
  hm() { awk -v s="$1" 'BEGIN{s=int(s); printf "%dh%02dm", s/3600, (s%3600)/60}'; }
  now=$(date +%s)
  for c in $CASES; do d=$ROOT/foam/$c; e=$(endtime "$d"); sv=$(latest "$d"); sv=${sv:-0}
    cur=$(grep '^Time = ' "$d/log.interFoam" 2>/dev/null | tail -1 | awk '{print $3}'); cur=${cur:-$sv}
    if alive "$d"; then s="RUNNING pid $(cat $d/RUN.pid)"; else s="stopped"; cur=$sv; fi
    echo "$c: $s"
    printf "  simulated time  %s  %s of %s s\n" "$(bar "$(awk "BEGIN{print $cur/$e}")")" "$cur" "$e"
    printf "  last restart    %s  t=%s s\n" "$(bar "$(awk "BEGIN{print $sv/$e}")")" "$sv"
    if alive "$d" && [ -f "$d/RUN.t0" ]; then read t0 w0 < "$d/RUN.t0"
      el=$((now - w0)); eta=$(awk -v c="$cur" -v t0="$t0" -v e="$e" -v el="$el" 'BEGIN{r=(c-t0)/(el>0?el:1); if(r>0) printf "%d", (e-c)/r; else print -1}')
      printf "  this session    ran %s, finish in about %s (estimate, rate will change)\n" "$(hm $el)" "$([ "$eta" -ge 0 ] && hm $eta || echo '?')"
    fi
    ang=$(grep -E 'Orientation' "$d/log.interFoam" 2>/dev/null | tail -1 | awk '{gsub(/[()]/,""); printf "%.1f", atan2($4,$2)*57.29578}')
    [ -n "$ang" ] && echo "  roll angle      $ang deg relative to the 30 deg start (latest step)"
    if [ -f "$d/system/controlDict" ]; then wr=$(ls -d "$d"/processor0/[0-9]* 2>/dev/null | wc -l | tr -d ' '); echo "  restart writes  $wr kept on disk"; fi
  done
  if [ -f "$ROOT/night.window" ]; then read ws we < "$ROOT/night.window"
    if [ "$now" -lt "$we" ]; then printf "tonight's window  %s  stops in %s (07:00 stop)\n" "$(bar "$(awk "BEGIN{print ($now-$ws)/($we-$ws)}")")" "$(hm $((we-now)))"; else echo "tonight's window  ended"; fi
  fi
  pmset -g ps | head -1; pgrep -lf caffeinate | head -3 ;;
*) sed -n 2,7p "$0" ;;
esac
