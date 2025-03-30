FROM node:18-slim

# Create app directory
WORKDIR /app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Bundle app source
COPY . .

# Expose the port the app runs on
EXPOSE 8080

# Define the command to run your app
CMD ["node", "server.js"]
