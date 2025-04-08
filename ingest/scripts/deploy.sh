#!/bin/bash

# Check if docker is installed
if ! [ -x "$(command -v docker)" ]; then
  echo 'Error: docker is not installed.' >&2
  exit 1
fi

echo "Building container for sprout_sense_ingest"
# Build the docker container
docker build -t bk1031/sprout_sense_ingest:latest --platform linux/amd64,linux/arm64 --push --progress=plain .

echo "Container deployed successfully"