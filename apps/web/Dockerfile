FROM node:20-alpine

WORKDIR /app/apps/web

COPY apps/web/package.json ./
COPY apps/web/package-lock.json ./
RUN npm install

COPY apps/web ./

EXPOSE 3000

CMD ["npm", "run", "dev"]
