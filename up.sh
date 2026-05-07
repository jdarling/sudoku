#!/bin/bash

set -o errexit -o pipefail -o nounset

trap 'echo "ERROR: line=$LINENO cmd=$BASH_COMMAND exit=$?"' ERR

declare SCRIPT_NAME="${0##*/}"
declare SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
declare WORK_DIR="${PWD}"
declare ROOT_DIR="${SCRIPT_DIR}"

declare DEFAULT_PORT="8080"
declare PORT="${DEFAULT_PORT}"
declare CONTAINER_NAME="sudoku"

showHelp() {
  local exitCode="${1:-0}"
  local errorMsg="${2:-}"
  echo "Usage: ${SCRIPT_NAME} [options]"
  echo ""
  echo "  Starts an nginx Docker container serving the sudoku app."
  echo ""
  echo "Options:"
  echo "  --port <port>    Port to expose (default: ${DEFAULT_PORT})"
  echo "  -h, --help       Show this help message"
  echo ""
  echo "Examples:"
  echo "  ${SCRIPT_NAME}"
  echo "  ${SCRIPT_NAME} --port 9090"
  if [[ -n "${errorMsg}" ]]; then
    echo ""
    echo "Error: ${errorMsg}"
  fi
  exit "${exitCode}"
}

parseArgs() {
  while [[ $# > 0 ]]; do
    case "$1" in
      --port)
        PORT="$2"
        shift 2
        ;;
      -h|--help)
        showHelp 0
        ;;
      *)
        showHelp 1 "Unknown option: $1"
        ;;
    esac
  done
}

stopExisting() {
  if docker ps -q --filter "name=${CONTAINER_NAME}" | grep -q .; then
    echo "[!] Stopping existing container: ${CONTAINER_NAME}"
    docker stop "${CONTAINER_NAME}" > /dev/null
  fi
}

parseArgs "$@"

stopExisting

echo "[+] Starting sudoku on http://localhost:${PORT}"
docker run --rm \
  --name "${CONTAINER_NAME}" \
  -p "${PORT}:80" \
  -v "${ROOT_DIR}:/usr/share/nginx/html:ro" \
  nginx:alpine

echo "[✓] Sudoku running at http://localhost:${PORT}"
