FROM codercom/code-server:4.98.0-debian

USER root
RUN apt-get update && apt-get install -y curl ca-certificates git && rm -rf /var/lib/apt/lists/*

# Persist global npm & user data on the Render disk
ENV NPM_CONFIG_PREFIX=/data/.npm-global
ENV PATH=/data/.npm-global/bin:$PATH
RUN mkdir -p /data/.npm-global /workspace

# Install Claude Code CLI
RUN npm install -g @anthropic-ai/claude-code

# Minimal static landing for healthcheck
RUN echo 'ok' >/workspace/index.html

# Entrypoint: start code-server bound to 0.0.0.0:8080, storing state on /data
COPY entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh
EXPOSE 8080
USER coder
WORKDIR /workspace
CMD ["/usr/local/bin/entrypoint.sh"]