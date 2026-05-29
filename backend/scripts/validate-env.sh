#!/usr/bin/env bash
# Validates that backend/.env on the server has exactly the same variable keys as .env.example.
set -euo pipefail

ROOT_DIR="${1:-.}"
EXAMPLE_FILE="${ROOT_DIR}/.env.example"
ENV_FILE="${ROOT_DIR}/.env"

if [[ ! -f "$EXAMPLE_FILE" ]]; then
  echo "::error::Missing ${EXAMPLE_FILE}"
  exit 1
fi

if [[ ! -f "$ENV_FILE" ]]; then
  echo "::error::Missing ${ENV_FILE} — create it on the server from .env.example before deploying."
  exit 1
fi

extract_keys() {
  local file="$1"
  grep -v '^\s*#' "$file" \
    | grep -v '^\s*$' \
    | sed 's/^\s*//' \
    | cut -d= -f1 \
    | sed 's/\s*$//' \
    | sort -u
}

mapfile -t example_keys < <(extract_keys "$EXAMPLE_FILE")
mapfile -t env_keys < <(extract_keys "$ENV_FILE")

missing=()
for key in "${example_keys[@]}"; do
  found=0
  for ek in "${env_keys[@]}"; do
    if [[ "$key" == "$ek" ]]; then
      found=1
      break
    fi
  done
  if [[ $found -eq 0 ]]; then
    missing+=("$key")
  fi
done

extra=()
for key in "${env_keys[@]}"; do
  found=0
  for ek in "${example_keys[@]}"; do
    if [[ "$key" == "$ek" ]]; then
      found=1
      break
    fi
  done
  if [[ $found -eq 0 ]]; then
    extra+=("$key")
  fi
done

if [[ ${#missing[@]} -gt 0 || ${#extra[@]} -gt 0 ]]; then
  echo "::error::backend/.env does not match backend/.env.example (keys must be identical)."
  if [[ ${#missing[@]} -gt 0 ]]; then
    echo "  Missing in .env: ${missing[*]}"
  fi
  if [[ ${#extra[@]} -gt 0 ]]; then
    echo "  Extra in .env (not in .env.example): ${extra[*]}"
  fi
  exit 1
fi

echo "Environment keys match .env.example (${#example_keys[@]} variables)."
