FROM node:22-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci --omit=dev

COPY prisma ./prisma
COPY prisma.config.ts ./
COPY src ./src

EXPOSE 3002

CMD ["node", "src/server.js"]
