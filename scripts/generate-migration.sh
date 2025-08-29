#!/bin/bash
if [ -z "$1" ]; then
  echo "Usage: bun migration:generate <MigrationName>"
  exit 1
fi
bun --bun typeorm migration:generate -d src/database/dataSource.ts -p --esm "src/database/migrations/$1"