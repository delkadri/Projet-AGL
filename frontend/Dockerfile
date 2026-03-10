FROM node:22-alpine

WORKDIR /app

# deps d’abord (cache docker)
COPY package.json package-lock.json ./
RUN npm ci

# code
COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "3000"]