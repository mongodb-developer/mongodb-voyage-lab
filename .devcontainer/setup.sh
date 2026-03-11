#!/bin/bash
set -e

npm install
node .devcontainer/seed.js

if [ -z "$VOYAGE_API_KEY" ]; then
  echo "VOYAGE_API_KEY not set — auto-embedding (notebook 02) will not work."
  echo "Add it as a Codespace secret and rebuild."
  exit 0
fi

# Fix docker socket permissions for this session (group membership from
# docker-outside-of-docker feature only applies to new login shells).
sudo chmod 666 /var/run/docker.sock

# Write the key where docker-compose reads it for variable substitution.
printf 'VOYAGE_API_KEY=%s\n' "$VOYAGE_API_KEY" \
  > /workspaces/mongodb-voyage-lab/.devcontainer/.env

# Discover the project name Codespaces actually used (not predictable in advance).
MONGODB_CONTAINER=$(docker ps --filter "ancestor=mongodb/mongodb-atlas-local:8.2.0" --format "{{.Names}}" | head -1)
if [ -z "$MONGODB_CONTAINER" ]; then
  echo "Could not find mongodb container — skipping auto-embedding setup."
  exit 0
fi
PROJECT=$(docker inspect "$MONGODB_CONTAINER" \
  --format "{{index .Config.Labels \"com.docker.compose.project\"}}")

echo "Recreating mongodb (project: $PROJECT) with VOYAGE_API_KEY..."
docker compose \
  --project-name "$PROJECT" \
  -f /workspaces/mongodb-voyage-lab/.devcontainer/docker-compose.yml \
  up -d --force-recreate --no-deps mongodb

echo "Waiting for MongoDB to be ready..."
until docker compose \
  --project-name "$PROJECT" \
  -f /workspaces/mongodb-voyage-lab/.devcontainer/docker-compose.yml \
  exec -T mongodb mongosh --quiet --eval "db.adminCommand('ping').ok" 2>/dev/null | grep -q 1; do
  sleep 3
done
echo "MongoDB ready with VOYAGE_API_KEY configured."
