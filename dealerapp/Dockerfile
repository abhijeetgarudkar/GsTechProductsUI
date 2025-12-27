FROM nginx:alpine

# Copy frontend files
COPY . /usr/share/nginx/html

# Replace default nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80