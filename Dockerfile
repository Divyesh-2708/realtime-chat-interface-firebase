# Stage 1 : Build the Angular app

# Use the official Node.js image as the base image
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package.json package-lock.json and install dependencies
COPY package*.json
RUN npm install 

# Copy entire project 
COPY ..
# 
RUN npm build --configuration production 

#Stage 2 : Serve app 
FROM nginx:alpine

# Copy custom NGINX config (optional, see below)    
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Remove default html and copy Angular dist
RUN rm -rf /usr/share/nginx/html/*
COPY --from=builder /app/dist/browser /usr/share/nginx/html

EXPOSE 80

# Start Nginx to serve the Angular app
CMD ["nginx", "-g", "daemon off;"]