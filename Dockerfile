# Blockallisto app image (API + built frontend served by backend/scripts/host.mjs).
# Multi-stage: full workspace install for the build, production-only install for
# the runtime. Pure-JS dependencies only (express, pg, stellar-sdk, pdfkit, viem,
# zod, openid-client) - no native modules, so this builds on arm64 and amd64 alike.
FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY backend/package.json backend/
COPY frontend/package.json frontend/
RUN npm ci
COPY . .
ARG VITE_PUBLIC_MEDIA_ORIGIN=https://blockallisto-public-media.pages.dev
ARG VITE_COUNTRY_ORIGIN=https://blockallisto-country.nunrib-df6.workers.dev
ENV VITE_PUBLIC_MEDIA_ORIGIN=$VITE_PUBLIC_MEDIA_ORIGIN \
    VITE_COUNTRY_ORIGIN=$VITE_COUNTRY_ORIGIN
RUN npm run build
RUN node backend/scripts/check-reviewed-wasm.mjs

FROM node:24-alpine AS runtime
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=4000
WORKDIR /app
COPY package.json package-lock.json ./
COPY backend/package.json backend/
COPY frontend/package.json frontend/
RUN npm ci --omit=dev && npm cache clean --force
ENV MEDIA_ORIGIN=https://blockallisto-public-media.pages.dev \
    COUNTRY_ORIGIN=https://blockallisto-country.nunrib-df6.workers.dev
COPY --from=build /app/backend/dist backend/dist
COPY --from=build /app/backend/scripts/host.mjs backend/scripts/host.mjs
COPY --from=build /app/frontend/dist frontend/dist
COPY --from=build /app/backend/wasm backend/wasm
USER node
EXPOSE 4000
HEALTHCHECK --interval=60s --timeout=5s --start-period=30s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||4000)+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "backend/scripts/host.mjs"]
