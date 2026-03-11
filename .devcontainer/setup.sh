#!/bin/bash
set -e

npm install
node .devcontainer/seed.js

# postCreateCommand has access to Codespace secrets; initializeCommand does not.
# Write the key to .env so docker-compose can inject it into the mongodb container,
# then recreate mongodb so mongot picks it up for auto-embedding (notebook 02).
if [ -n "$VOYAGE_API_KEY" ]; then
  printf 'VOYAGE_API_KEY=%s\n' "$VOYAGE_API_KEY" > /workspaces/mongodb-voyage-lab/.devcontainer/.env
  docker-compose -f /workspaces/mongodb-voyage-lab/.devcontainer/docker-compose.yml \
    up -d --force-recreate --no-deps mongodb
  echo "Waiting for MongoDB to be ready..."
  until docker-compose -f /workspaces/mongodb-voyage-lab/.devcontainer/docker-compose.yml \
    exec -T mongodb mongosh --quiet --eval "db.adminCommand('ping').ok" 2>/dev/null | grep -q 1; do
    sleep 3
  done
  echo "MongoDB ready with VOYAGE_API_KEY configured."
else
  echo "VOYAGE_API_KEY not set — auto-embedding (notebook 02) will not work."
  echo "Set it as a Codespace secret and rebuild."
fi
