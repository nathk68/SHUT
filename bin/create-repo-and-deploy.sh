#!/usr/bin/env bash
# Minimal helper script: initialize git, create GitHub repo (using gh), push, and deploy with vercel CLI.

set -euo pipefail

REPO_NAME="SHUT"
VISIBILITY="public" # or private

echo "Initializing git repository..."
git init
git add .
git commit -m "chore: initial commit"

if command -v gh >/dev/null 2>&1; then
  echo "Creating GitHub repo via gh..."
  gh repo create "$REPO_NAME" --$VISIBILITY --source=. --remote=origin --push
else
  echo "gh CLI not found. Create the repo manually or install gh: https://cli.github.com/"
fi

if command -v vercel >/dev/null 2>&1; then
  echo "Deploying to Vercel. The vercel CLI will prompt for login if needed."
  vercel --prod
else
  echo "vercel CLI not found. Install it: npm i -g vercel"
fi

echo "Done. If any step required authentication, follow the CLI prompts."
