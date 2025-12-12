FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production
# Install docker-cli for sibling container spawning
RUN apk add --no-cache docker-cli

COPY . .
# Create temp directory for code execution
RUN mkdir -p /app/temp && chmod 777 /app/temp

EXPOSE 5000

CMD ["npm", "start"]
