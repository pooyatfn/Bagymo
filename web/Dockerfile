FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --legacy-peer-deps

FROM deps AS builder
WORKDIR /app
COPY . .
# NEXT_PUBLIC_* values are inlined at build time
ARG NEXT_PUBLIC_API_URL=http://localhost:8000
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
# optional contact details shown on /contact
ARG NEXT_PUBLIC_SUPPORT_PHONE=
ARG NEXT_PUBLIC_SUPPORT_EMAIL=
ENV NEXT_PUBLIC_SUPPORT_PHONE=$NEXT_PUBLIC_SUPPORT_PHONE NEXT_PUBLIC_SUPPORT_EMAIL=$NEXT_PUBLIC_SUPPORT_EMAIL
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
# public/ is optional in the repo; make sure it exists for the runner stage
RUN mkdir -p public && npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000
CMD ["node", "node_modules/next/dist/bin/next", "start"]
