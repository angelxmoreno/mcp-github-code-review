#!/bin/bash
if [ -z "$1" ]; then
  echo "Usage: bun migration:create <MigrationName>"
  exit 1
fi
bun --bun typeorm migration:create --esm "src/database/migrations/$1"
