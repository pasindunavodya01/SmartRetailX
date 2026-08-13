FROM node:22-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install --ignore-scripts

COPY prisma ./prisma
COPY prisma.config.ts ./

RUN npx prisma generate

COPY src ./src

EXPOSE 3004

CMD ["sh", "-c", "npx prisma migrate deploy && node src/server.js"]
