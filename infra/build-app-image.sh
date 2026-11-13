#!/usr/bin/env bash
# Build only. Never activate a service or silently fall back to the root builder.
set -euo pipefail
builder=app-oled
tag=
context=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
while [ "$#" -gt 0 ]; do
  case "$1" in
    --tag|--builder|--context)
      [ "$#" -ge 2 ] || { echo "Missing value for $1" >&2; exit 2; }
      case "$1" in --tag) tag=$2 ;; --builder) builder=$2 ;; --context) context=$2 ;; esac
      shift 2 ;;
    *) echo "Unknown option: $1" >&2; exit 2 ;;
  esac
done
[[ "$tag" =~ ^blockallisto-app:[A-Za-z0-9_][A-Za-z0-9_.-]{0,127}$ ]] || { echo 'An explicit blockallisto-app tag is required.' >&2; exit 2; }
case "$builder" in app-oled|default) ;; *) echo 'Builder must be app-oled or the explicit default fallback.' >&2; exit 2 ;; esac
[ -d "$context" ] && [ -f "$context/Dockerfile" ] || { echo 'Build context needs a Dockerfile.' >&2; exit 2; }
for command in docker df setsid sleep; do command -v "$command" >/dev/null || { echo "Missing command: $command" >&2; exit 2; }; done
floor=3221225472
# Cancellation has time to propagate before the hard floor is reached.
abort_at=3355443200
space_ok() {
  local point available
  for point in / /var/oled; do
    available=$(df -B1 --output=avail "$point" | tail -n 1 | tr -d '[:space:]')
    [[ "$available" =~ ^[0-9]+$ ]] || { echo "Cannot measure free space: $point" >&2; return 1; }
    printf 'SPACE %s %s %s\n' "$1" "$point" "$available"
    [ "$available" -ge "$2" ] || return 1
  done
}
space_ok before "$abort_at" || { echo 'Build refused: disk reserve is too low.' >&2; exit 1; }
# Inspect only: never bootstrap, create, or select another builder here.
docker buildx inspect "$builder"
pid=
stop_build() {
  if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
    kill -INT -- "-$pid" 2>/dev/null || true
    # BuildKit receives cancellation through the client connection.
    for attempt in {1..30}; do kill -0 "$pid" 2>/dev/null || break; sleep 1; done
    if kill -0 "$pid" 2>/dev/null; then kill -TERM -- "-$pid" 2>/dev/null || true; fi
    wait "$pid" 2>/dev/null || true
  fi
}
trap 'stop_build' EXIT
trap 'exit 130' INT TERM
setsid docker buildx build --builder "$builder" --platform linux/arm64 --load --tag "$tag" "$context" &
pid=$!
while kill -0 "$pid" 2>/dev/null; do
  if ! space_ok during "$abort_at"; then
    echo 'Build canceled at the disk safety reserve. No deployment was attempted.' >&2
    stop_build
    pid=
    exit 1
  fi
  sleep 1
done
status=0
wait "$pid" || status=$?
pid=
[ "$status" -eq 0 ] || exit "$status"
space_ok after "$floor" || { echo 'Build finished below the disk floor. Do not activate it.' >&2; exit 1; }
printf 'Built %s with %s. No deployment performed.\n' "$tag" "$builder"
