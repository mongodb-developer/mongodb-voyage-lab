FROM jupyter/base-notebook:latest

# Install docker CLI so postCreateCommand can restart the mongodb service
# with VOYAGE_API_KEY injected into mongot (no docker-outside-of-docker feature needed)
USER root
RUN apt-get update \
    && apt-get install -y --no-install-recommends docker.io docker-compose \
    && rm -rf /var/lib/apt/lists/*
USER jovyan

# Install Node.js 20 via conda-forge
RUN mamba install -y -c conda-forge nodejs=20 git \
    && mamba clean --all -y

# Install tslab globally and register TypeScript and JavaScript kernels
RUN npm install -g tslab \
    && tslab install --python=python3
