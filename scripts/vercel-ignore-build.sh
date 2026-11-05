#!/usr/bin/env bash
# Vercel "Ignored Build Step" (vercel.json → ignoreCommand).
# Exit 0 skips the deployment; any other exit code builds it.
#
# It skips only when every file changed since this branch's last deployment
# never reaches the site: docs and screenshots, tests, agent and editor
# settings, top-level Markdown. Each deployment takes ~60 MB of storage, so a
# push that only adds screenshots shouldn't make one.
#
# When in doubt it builds: the first deployment of a branch (no previous SHA),
# a previous SHA missing from Vercel's shallow clone, or any git error.

set -u

# Paths that never reach the deployed site
SITE_FREE='^(docs/|tests/|obsidian-theme/|\.agents/|\.claude/|\.cursor/|\.vscode/|[^/]+\.md$|homepage-current\.png$|skills-lock\.json$)'

base="${VERCEL_GIT_PREVIOUS_SHA:-}"
if [ -z "$base" ]; then
  echo "No previous deployment of this branch: building."
  exit 1
fi
if ! git cat-file -e "${base}^{commit}" 2>/dev/null; then
  echo "The previous deployment (${base}) isn't in the clone: building."
  exit 1
fi
if ! changed=$(git diff --name-only "$base" HEAD); then
  echo "git diff failed: building."
  exit 1
fi
if [ -z "$changed" ]; then
  echo "Nothing changed since ${base}: building (a redeploy)."
  exit 1
fi

site=$(printf '%s\n' "$changed" | grep -Ev "$SITE_FREE" || true)
if [ -n "$site" ]; then
  echo "Site files changed since ${base}: building."
  printf '%s\n' "$site" | sed 's/^/  /' | head -n 20
  exit 1
fi

echo "Only docs, tests or tool settings changed since ${base}: skipping this deployment."
printf '%s\n' "$changed" | sed 's/^/  /' | head -n 20
exit 0
