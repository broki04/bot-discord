FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci
COPY . .

RUN npm run build

# ===========================

FROM node:20-alpine
WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

RUN npm ci --only=production && npm cache clean --force

RUN mkdir -p /app/data && chown -R node:node /app/data
USER node

CMD ["npm", "start"]