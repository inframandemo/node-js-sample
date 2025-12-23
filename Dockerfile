# Use a lightweight Node.js image
FROM node:18-alpine

# Set the working directory
WORKDIR /app

# Copy dependency definitions
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Heroku apps expect a PORT env var. We set a default for K8s.
ENV PORT=5000

# Document that we listen on port 5000
EXPOSE 5000

# Start the app
CMD ["node", "index.js"]
