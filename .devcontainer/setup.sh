#!/bin/bash
set -e

npm install
node .devcontainer/seed.js

if [ -z "$VOYAGE_API_KEY" ]; then
  echo "VOYAGE_API_KEY not set — auto-embedding (notebook 02) will not work."
  echo "Add it as a Codespace secret and rebuild."
  exit 0
fi

# Make the docker socket accessible (jovyan has passwordless sudo)
sudo chmod 666 /var/run/docker.sock

# Find the running mongodb container
MONGODB_CONTAINER=$(docker ps --filter "ancestor=mongodb/mongodb-atlas-local:8.2.0" --format "{{.Names}}" | head -1)
if [ -z "$MONGODB_CONTAINER" ]; then
  echo "Could not find mongodb container — skipping auto-embedding setup."
  exit 0
fi

# Capture its network and volume before we stop it
NETWORK=$(docker inspect "$MONGODB_CONTAINER" --format '{{range $k,$v := .NetworkSettings.Networks}}{{$k}}{{end}}')
VOLUME=$(docker inspect "$MONGODB_CONTAINER" --format '{{range .Mounts}}{{if eq .Type "volume"}}{{.Name}}{{end}}{{end}}')

echo "Restarting mongodb (network=$NETWORK, volume=$VOLUME) with VOYAGE_API_KEY..."

docker stop "$MONGODB_CONTAINER"
docker rm   "$MONGODB_CONTAINER"

# Start a fresh container on the same network/volume with the API key
docker run -d \
  --name "$MONGODB_CONTAINER" \
  --network "$NETWORK" \
  --network-alias mongodb \
  -v "${VOLUME}:/data/db" \
  -e MONGODB_INITDB_ROOT_USERNAME=admin \
  -e MONGODB_INITDB_ROOT_PASSWORD=mongodb \
  -e "INDEXING_VOYAGE_AI_API_KEY=$VOYAGE_API_KEY" \
  -e "QUERY_VOYAGE_AI_API_KEY=$VOYAGE_API_KEY" \
  -p 27017:27017 \
  --restart unless-stopped \
  mongodb/mongodb-atlas-local:8.2.0

echo "MongoDB restarting with VOYAGE_API_KEY — will be ready in ~30s."
