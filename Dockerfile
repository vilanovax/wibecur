# syntax=docker-mirror.liara.ir/docker/dockerfile:1
# ایمیج‌های پایه از میرور لیارا: https://liara.ir/mirrors/docker/

ARG DOCKER_MIRROR=docker-mirror.liara.ir
FROM ${DOCKER_MIRROR}/library/node:20-alpine AS base
RUN apk add --no-cache libc6-compat openssl vips
WORKDIR /app

FROM base AS deps
ARG NPM_LOGLEVEL=verbose
COPY package.json package-lock.json .npmrc ./
RUN npm install --loglevel ${NPM_LOGLEVEL}

FROM base AS builder
ARG NPM_LOGLEVEL=verbose
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
# Turbopack معمولاً کم‌حافظه‌تر است؛ سقف heap برای بیلدهای سنگین
ENV NODE_OPTIONS=--max-old-space-size=4096

# فقط برای مرحله build (مقادیر واقعی در runtime از .env می‌آیند)
ARG NEXTAUTH_SECRET=docker-build-placeholder
ARG ENCRYPTION_KEY=docker-build-placeholder
ARG DATABASE_URL=postgresql://build:build@localhost:5432/build
ENV NEXTAUTH_SECRET=$NEXTAUTH_SECRET
ENV ENCRYPTION_KEY=$ENCRYPTION_KEY
ENV DATABASE_URL=$DATABASE_URL

# NEXT_PUBLIC_* در زمان build در bundle می‌روند
ARG NEXT_PUBLIC_APP_URL=""
ARG NEXT_PUBLIC_LIARA_IMAGE_MODE="same-origin"
ARG NEXT_PUBLIC_UMAMI_WEBSITE_ID=""
ARG NEXT_PUBLIC_UMAMI_SCRIPT_URL=""
ARG NEXT_PUBLIC_UMAMI_HOST_URL=""
ARG NEXT_PUBLIC_UMAMI_DOMAINS=""
ARG NEXT_PUBLIC_VERCEL=""
ARG BUILD_ID=build-docker

ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_LIARA_IMAGE_MODE=$NEXT_PUBLIC_LIARA_IMAGE_MODE
ENV NEXT_PUBLIC_UMAMI_WEBSITE_ID=$NEXT_PUBLIC_UMAMI_WEBSITE_ID
ENV NEXT_PUBLIC_UMAMI_SCRIPT_URL=$NEXT_PUBLIC_UMAMI_SCRIPT_URL
ENV NEXT_PUBLIC_UMAMI_HOST_URL=$NEXT_PUBLIC_UMAMI_HOST_URL
ENV NEXT_PUBLIC_UMAMI_DOMAINS=$NEXT_PUBLIC_UMAMI_DOMAINS
ENV NEXT_PUBLIC_VERCEL=$NEXT_PUBLIC_VERCEL
ENV BUILD_ID=$BUILD_ID

RUN npx --loglevel ${NPM_LOGLEVEL} prisma generate
RUN npm run build --loglevel ${NPM_LOGLEVEL}

FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV NODE_OPTIONS=--max-http-header-size=16384

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder /app/node_modules/sharp ./node_modules/sharp
COPY --from=builder /app/node_modules/@img ./node_modules/@img
COPY --from=builder /app/package.json ./package.json
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

USER nextjs
EXPOSE 3000

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "server.js"]
