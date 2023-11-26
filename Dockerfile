FROM node:16.16.0

RUN apt-get update && apt-get install ffmpeg -y

WORKDIR /app

COPY package*.json ./

# Install app dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose the port your Express app listens on (change it if necessary)
EXPOSE 3500

# Start the Express app
CMD [ "npm", "run", "server:production" ]
