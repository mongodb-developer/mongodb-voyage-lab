#!/bin/bash
set -e

npm install
node .devcontainer/seed.js
