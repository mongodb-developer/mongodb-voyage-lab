#!/bin/bash
set -e

npm install

if [ -z "$VOYAGE_API_KEY" ]; then
  echo "VOYAGE_API_KEY not set — seeding without auto-embedding (notebook 02 will not work)."
  echo "Add it as a Codespace secret and rebuild."
  node .devcontainer/seed.js
  exit 0
fi

# Make the docker socket accessible (jovyan has passwordless sudo)
sudo chmod 666 /var/run/docker.sock

# Find the running mongodb container
MONGODB_CONTAINER=$(docker ps --filter "ancestor=mongodb/mongodb-atlas-local:8.2.0" --format "{{.Names}}" | head -1)
if [ -z "$MONGODB_CONTAINER" ]; then
  echo "Could not find mongodb container — seeding original and exiting."
  node .devcontainer/seed.js
  exit 0
fi

# Get exactly the volume mounted at /data/db (avoid concatenating multiple mount names)
VOLUME=$(docker inspect "$MONGODB_CONTAINER" \
  --format '{{range .Mounts}}{{if and (eq .Type "volume") (eq .Destination "/data/db")}}{{.Name}}{{end}}{{end}}')
NETWORK=$(docker inspect "$MONGODB_CONTAINER" \
  --format '{{range $k,$v := .NetworkSettings.Networks}}{{$k}}{{end}}')

echo "Restarting mongodb (network=$NETWORK, volume=$VOLUME) with VOYAGE_API_KEY..."

docker stop "$MONGODB_CONTAINER"
docker rm   "$MONGODB_CONTAINER"

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

echo "Waiting for MongoDB to accept connections..."
until docker exec "$MONGODB_CONTAINER" mongosh --quiet --eval "db.adminCommand('ping').ok" 2>/dev/null | grep -q 1; do
  sleep 3
done

node .devcontainer/seed.js
echo "Setup complete. MongoDB ready with VOYAGE_API_KEY."
