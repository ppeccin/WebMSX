#!/bin/bash

claude --permission-mode acceptEdits "@progress.txt \
1. Read the progress file. \
2. Identify the next missing type to fix using \`npx tsc --noEmit 2>&1 | head -50\`, and fix it without changing any code behaviour. Avoid using \`any\` if possible. \
3. Commit your changes. \
4. Update progress.txt with what you did and the learnings you gained. \
ONLY DO ONE FIX AT A TIME."