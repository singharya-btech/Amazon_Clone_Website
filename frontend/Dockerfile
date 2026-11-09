FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci

COPY . .

RUN npm run build

# ---------------------------------------------------------------------------
# Production stage — serve the static build with nginx
# ---------------------------------------------------------------------------
FROM nginx:1.27-alpine

# Install envsubst (for runtime template substitution) and curl (for healthcheck)
RUN apk add --no-cache gettext curl

# Copy the nginx configuration template (placed outside /etc/nginx/templates/
# so the nginx entrypoint does NOT auto-process it with envsubst — we need
# to limit substitution to only BACKEND_HOST / BACKEND_PORT to preserve
# nginx's own $host / $remote_addr variables).
COPY nginx.conf /etc/nginx/conf.d/default.conf.template

# Copy the built static files
COPY --from=build /app/dist /usr/share/nginx/html

# Expose the default HTTP port
EXPOSE 80

# Substitute only BACKEND_HOST / BACKEND_PORT at container start, then
# launch nginx.  Defaults are set in-shell so the container also works
# when the env vars are not provided.
CMD ["sh", "-c", "BACKEND_HOST=${BACKEND_HOST:-backend-service} BACKEND_PORT=${BACKEND_PORT:-8000} envsubst '${BACKEND_HOST} ${BACKEND_PORT}' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf && exec nginx -g 'daemon off;'"]
