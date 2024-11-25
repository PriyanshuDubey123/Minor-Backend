FROM ubuntu:focal

# Install necessary dependencies
RUN apt-get update && \
    apt-get install -y curl && \
    curl -sL https://deb.nodesource.com/setup_18.x | bash - && \
    apt-get update && \
    apt-get install -y nodejs ffmpeg

WORKDIR /live-streaming-service

# Install nodemon globally
RUN npm install -g nodemon

# Copy package.json and package-lock.json to the container
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose the port (if necessary for communication)
EXPOSE 5000

# Start the application with nodemon
CMD ["nodemon", "index.js"]
