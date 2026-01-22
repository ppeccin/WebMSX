#!/bin/bash

# claude --permission-mode acceptEdits "@progress.txt \
# 1. Read the progress file. \
# 2. Identify the next missing type to fix using \`npx tsc --noEmit 2>&1 | head -50\` (ignore errors related to JSZIP or ZIP.ts), and fix it without changing any code behaviour. Avoid using \`any\` if possible. \
# 3. Commit your changes. \
# 4. Update progress.txt with what you did and the learnings you gained avoiding repeating yourself. \
# ONLY DO ONE FIX AT A TIME."

set -e

if [ -z "$1" ]; then
  echo "Usage: $0 <iterations>"
  exit 1
fi

for ((i=1; i<=$1; i++)); do
  result=$(claude --permission-mode acceptEdits -p "@progress.txt \
  1. Read the progress file. \
  2. Identify the next missing type to fix using \`npx tsc --noEmit 2>&1 | head -50\` (ignore errors related to JSZIP or ZIP.ts), and fix it without changing any code behaviour. Avoid using \`any\` if possible. \
  3. Commit your changes. \
  4. Update progress.txt with what you did and the learnings you gained avoiding repeating yourself. \
  ONLY DO ONE FIX AT A TIME. \
  If there are no errors to fix, output <promise>COMPLETE</promise>.")

  echo "$result"

  if [[ "$result" == *"<promise>COMPLETE</promise>"* ]]; then
    echo "PRD complete after $i iterations."
    exit 0
  fi
done