# syntax=docker-mirror.liara.ir/docker/dockerfile:1
# ایمیج‌های پایه از میرور لیارا: https://liara.ir/mirrors/docker/

ARG DOCKER_MIRROR=docker-mirror.liara.ir
FROM ${DOCKER_MIRROR}/library/node:20-alpine AS base
# vips برای runtime — sharp از سورس به همین لینک می‌شود (نه باینری prebuilt x86-64-v2)
# بعضی هاست‌های لیارا CPU قدیمی دارند؛ prebuilt sharp + wasm SIMD آنجا fail می‌شود.
RUN apk add --no-cache libc6-compat openssl vips
WORKDIR /app

FROM base AS deps
# info = پیشرفت دیده می‌شود؛ verbose لاگ را غرق می‌کند و warn سکوت طولانی می‌سازد.
ARG NPM_LOGLEVEL=info
# binaries.prisma.sh از بعضی شبکه‌ها (از جمله ایران) قطع می‌شود.
# میرور npmmirror همان مسیر all_commits را دارد؛ postinstall موتورها را از اینجا می‌گیرد.
ARG PRISMA_ENGINES_MIRROR=https://registry.npmmirror.com/-/binary/prisma
ENV PRISMA_ENGINES_MIRROR=$PRISMA_ENGINES_MIRROR
ENV PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1
# میرور لیارا گاهی کند/قطع است — retry و timeout بلندتر
ENV npm_config_fetch_retries=5 \
    npm_config_fetch_retry_mintimeout=20000 \
    npm_config_fetch_retry_maxtimeout=120000 \
    npm_config_fetch_timeout=300000 \
    npm_config_maxsockets=8 \
    npm_config_progress=true \
    npm_config_fund=false \
    npm_config_audit=false
COPY package.json package-lock.json .npmrc ./
COPY scripts/install-git-hooks.mjs ./scripts/install-git-hooks.mjs
# لایهٔ جدا: فقط دانلود پکیج‌ها (بدون postinstall). اگر بیلد وسط باینری‌ها
# abort شود، این لایه کش می‌ماند و حلقهٔ «از صفر» شکسته می‌شود.
RUN --mount=type=cache,id=wibe-npm,target=/root/.npm,sharing=locked \
    echo "[deps] npm ci (ignore-scripts)…" && \
    npm ci --prefer-offline --ignore-scripts --no-audit --no-fund --loglevel ${NPM_LOGLEVEL} && \
    echo "[deps] npm ci done"

# باینری‌های لازم برای بیلد (sharp جداگانه از سورس rebuild می‌شود)
RUN echo "[deps] native postinstalls…" && \
    npm rebuild esbuild @sentry/cli unrs-resolver --loglevel ${NPM_LOGLEVEL} && \
    node node_modules/@prisma/engines/scripts/postinstall.js && \
    node node_modules/@prisma/client/scripts/postinstall.js && \
    echo "[deps] native postinstalls done"

# sharp prebuilt برای x86-64-v2 است؛ روی هاست قدیمی لود نمی‌شود.
# از سورس با libvips سیستمی و -march=x86-64 بساز تا روی CPUهای v1 هم کار کند.
RUN apk add --no-cache vips-dev fftw-dev build-base python3 \
  && SHARP_FORCE_GLOBAL_LIBVIPS=1 \
     npm_config_build_from_source=true \
     CFLAGS="-O2 -march=x86-64 -mtune=generic" \
     CXXFLAGS="-O2 -march=x86-64 -mtune=generic" \
     npm rebuild sharp --build-from-source --loglevel ${NPM_LOGLEVEL} \
  && apk del --no-network build-base python3 vips-dev fftw-dev || true

FROM base AS builder
ARG NPM_LOGLEVEL=info
ARG PRISMA_ENGINES_MIRROR=https://registry.npmmirror.com/-/binary/prisma
ENV PRISMA_ENGINES_MIRROR=$PRISMA_ENGINES_MIRROR
ENV PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1
ENV npm_config_fetch_retries=5 \
    npm_config_fetch_retry_mintimeout=20000 \
    npm_config_fetch_retry_maxtimeout=120000 \
    npm_config_fetch_timeout=300000 \
    npm_config_progress=true
# در بیلد/ران از libvips سیستمی استفاده کن — prebuilt @img/sharp-libvips-* را نادیده بگیر
ENV SHARP_FORCE_GLOBAL_LIBVIPS=1
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

# checksum/دانلود گاهی از binaries.prisma.sh قطع می‌شود؛ سه بار با میرور امتحان می‌کنیم.
RUN ok=0; \
    for i in 1 2 3; do \
      if npx --loglevel ${NPM_LOGLEVEL} prisma generate; then ok=1; break; fi; \
      echo "[prisma] generate failed (attempt $i), retrying…"; \
      sleep $((i * 3)); \
    done; \
    test "$ok" = 1
RUN npm run build --loglevel ${NPM_LOGLEVEL}

FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV NODE_OPTIONS=--max-http-header-size=16384
ENV SHARP_FORCE_GLOBAL_LIBVIPS=1

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
