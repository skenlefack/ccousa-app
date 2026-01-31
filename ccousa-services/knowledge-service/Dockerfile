FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:20-alpine AS production
WORKDIR /app
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
RUN mkdir -p /app/documents && chown -R nodejs:nodejs /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
USER nodejs
EXPOSE 3005
HEALTHCHECK --interval=30s --timeout=10s --retries=3 CMD wget --spider http://localhost:3005/health || exit 1
CMD ["node", "dist/index.js"]
