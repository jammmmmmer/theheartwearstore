#!/usr/bin/env bash
# Reconcile the new project folder with the unpushed July 8 work.
# Run this in your own Terminal (not the Claude sandbox), where your
# GitHub credentials are available.
#
#   bash reconcile-with-july8-work.sh
#
set -e

OLD="$HOME/Claude/theheartwearstore"          # up-to-date copy (2 unpushed commits)
NEW="$HOME/Projects/theheartwearstore"        # new canonical folder (behind)

echo "==> Clearing any stale git lock files"
rm -f "$OLD/.git/index.lock" "$NEW/.git/index.lock" \
      "$NEW/.git/packed-refs.lock" 2>/dev/null || true

echo "==> Removing temporary remote left over from diagnosis (if present)"
git -C "$NEW" remote remove localold 2>/dev/null || true

echo "==> Confirming the old copy is 2 commits ahead of origin"
git -C "$OLD" fetch origin
git -C "$OLD" log --oneline origin/main..HEAD

echo "==> Pushing the July 8 work to GitHub"
git -C "$OLD" push origin main

echo "==> Fast-forwarding the new folder from GitHub"
git -C "$NEW" pull origin main

echo "==> Installing dependencies in the new folder"
cd "$NEW"
npm install

echo "==> Done. Verify with: git -C \"$NEW\" log --oneline -3"
