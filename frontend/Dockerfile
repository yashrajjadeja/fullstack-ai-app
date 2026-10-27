# frontend/Dockerfile  (multi-stage build)
# Stage 1 — build the React app with Node
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# VITE_API_URL is passed as a build argument so the URL is baked into the JS bundle
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# Stage 2 — serve the built files with Nginx (much smaller than Node)
FROM nginx:alpine
# Custom config makes page-refresh work for React Router (try_files)
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
