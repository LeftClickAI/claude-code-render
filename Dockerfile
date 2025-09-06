FROM node:20-slim

# OS deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    git bash curl ca-certificates \
 && rm -rf /var/lib/apt/lists/*

# Global npm dir (so PATH finds global bins like `claude`)
ENV NPM_CONFIG_PREFIX=/opt/npm-global
ENV PATH=/opt/npm-global/bin:$PATH

# Install Claude Code CLI
RUN npm i -g @anthropic-ai/claude-code

# App deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

# App code
COPY server.js ./

EXPOSE 8080
CMD ["node", "server.js"]