# Use the official Node.js 20 image as the base
FROM node:20

# Install ffmpeg
RUN apt-get update && apt-get install -y ffmpeg

# Set the working directory inside the container
WORKDIR /transcoder

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose the port (if necessary for communication)
EXPOSE 4000

# Start the transcoding service
CMD ["npm", "start"]
