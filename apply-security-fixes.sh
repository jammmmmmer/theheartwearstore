#!/usr/bin/env bash
# Apply dependency security fixes for The Heartwear Store.
# package.json already pins next + eslint-config-next to 14.2.35.
# Run in your own Terminal from anywhere:
#   bash ~/Projects/theheartwearstore/apply-security-fixes.sh
set -e

cd "$HOME/Projects/theheartwearstore"

echo "==> Installing pinned Next.js 14.2.35"
npm install

echo "==> Fixing remaining transitive vulns (qs, ws) without breaking changes"
npm audit fix

echo "==> Re-running audit to confirm"
npm audit || true

echo "==> Verifying the app still builds"
npm run build

echo "==> Done. If the build passed, commit and push:"
echo "    git add package.json package-lock.json"
echo "    git commit -m 'Security: bump Next.js to 14.2.35, fix qs/ws advisories'"
echo "    git push origin main"
