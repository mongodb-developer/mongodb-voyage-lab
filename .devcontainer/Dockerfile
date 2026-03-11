FROM jupyter/base-notebook:latest

# Install Node.js 20 via conda-forge (avoids requiring curl or external apt repos)
RUN mamba install -y -c conda-forge nodejs=20 git \
    && mamba clean --all -y

# Install tslab globally and register TypeScript and JavaScript kernels
RUN npm install -g tslab \
    && tslab install --python=python3

# Install Docker CLI + docker-compose so postCreateCommand (setup.sh) can
# recreate the mongodb container with VOYAGE_API_KEY after secrets are available.
USER root
RUN apt-get update \
    && apt-get install -y --no-install-recommends docker.io curl \
    && ARCH=$(uname -m) \
    && curl -fsSL "https://github.com/docker/compose/releases/download/v2.24.6/docker-compose-linux-${ARCH}" \
       -o /usr/local/bin/docker-compose \
    && chmod +x /usr/local/bin/docker-compose \
    && rm -rf /var/lib/apt/lists/*
USER ${NB_UID}
