#!/bin/bash

# Configuration - Edit these values
# Read the .env file for these values
SERVER_IP=$(grep -E "^SERVER_IP=" .env | cut -d= -f2-)
SERVER_USER=$(grep -E "^SERVER_USER=" .env | cut -d= -f2-)
DEPLOY_PATH=$(grep -E "^DEPLOY_PATH=" .env | cut -d= -f2-)
DOMAIN=$(grep -E "^DOMAIN=" .env | cut -d= -f2-)

# Create SSL setup script
create_ssl_script() {
  cat > setup_ssl.sh << 'EOL'
#!/bin/bash
# Script to set up SSL with Certbot

# Get parameters
DOMAIN=$1
DEPLOY_PATH=$2

# Install Certbot with proper plugins
install_certbot() {
  echo "Installing Certbot and required plugins..."
  if command -v apt-get > /dev/null; then
    sudo apt-get update
    sudo apt-get install -y software-properties-common
    sudo add-apt-repository -y ppa:certbot/certbot || echo "PPA not needed"
    sudo apt-get update
    sudo apt-get install -y certbot python3-certbot-nginx nginx-full
  elif command -v yum > /dev/null; then
    sudo yum install -y epel-release
    sudo yum install -y certbot python3-certbot-nginx
  elif command -v dnf > /dev/null; then
    sudo dnf install -y epel-release
    sudo dnf install -y certbot python3-certbot-nginx
  else
    echo "Could not install Certbot - package manager not recognized"
    return 1
  fi
  
  # Verify installation
  if command -v certbot > /dev/null; then
    echo "Certbot installed successfully"
    echo "Available plugins:"
    certbot plugins
    return 0
  else
    echo "Certbot installation failed"
    return 1
  fi
}

# Check for and stop Apache if it's running on port 80
check_apache() {
  if command -v lsof > /dev/null && sudo lsof -i:80 | grep apache; then
    echo "Apache detected on port 80, stopping service..."
    if command -v systemctl > /dev/null; then
      sudo systemctl stop apache2 || sudo systemctl stop httpd
      sudo systemctl disable apache2 || sudo systemctl disable httpd
      echo "Apache stopped and disabled"
    elif command -v service > /dev/null; then
      sudo service apache2 stop || sudo service httpd stop
      echo "Apache stopped"
    fi
  fi
}

# Get SSL certificate with Certbot
get_certificate() {
  echo "Obtaining SSL certificate for $DOMAIN"
  
  # Try with nginx plugin first
  if certbot plugins | grep -q 'nginx'; then
    echo "Using Nginx plugin method"
    sudo certbot --nginx --non-interactive --agree-tos --redirect \
      --domain "$DOMAIN" --domain "www.$DOMAIN" \
      --email "admin@$DOMAIN" || NGINX_PLUGIN_FAILED=true
  fi
  
  # If nginx plugin failed, try webroot method
  if [ "$NGINX_PLUGIN_FAILED" = true ] || ! certbot plugins | grep -q 'nginx'; then
    echo "Using webroot method"
    sudo mkdir -p "$DEPLOY_PATH/.well-known"
    sudo certbot certonly --webroot --non-interactive --agree-tos \
      --webroot-path "$DEPLOY_PATH" \
      --domain "$DOMAIN" --domain "www.$DOMAIN" \
      --email "admin@$DOMAIN" || return 1
      
    # If certificates were obtained, create manual SSL config
    if [ -d "/etc/letsencrypt/live/$DOMAIN" ]; then
      echo "Creating SSL Nginx configuration"
      cat > /tmp/ssl_config.conf << EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    location / {
        return 301 https://\$host\$request_uri;
    }
}

server {
    listen 443 ssl;
    server_name $DOMAIN www.$DOMAIN;
    
    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    
    root $DEPLOY_PATH/dist;
    index index.html;
    
    location / {
        try_files \$uri \$uri/ /index.html;
    }
    
    location ~* \\.(jpg|jpeg|png|gif|ico|css|js|glb|gltf)\$ {
        expires 1y;
        add_header Cache-Control "public, max-age=31536000";
        access_log off;
    }
    
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options nosniff;
    add_header X-Frame-Options SAMEORIGIN;
    add_header X-XSS-Protection "1; mode=block";
    add_header Referrer-Policy strict-origin-when-cross-origin;
}
EOF
      if [ -d /etc/nginx/sites-available ]; then
        sudo cp /tmp/ssl_config.conf /etc/nginx/sites-available/campfire-demo
        sudo ln -sf /etc/nginx/sites-available/campfire-demo /etc/nginx/sites-enabled/
      elif [ -d /etc/nginx/conf.d ]; then
        sudo cp /tmp/ssl_config.conf /etc/nginx/conf.d/campfire-demo.conf
      fi
      rm /tmp/ssl_config.conf
    fi
  fi
  
  # Set up auto-renewal
  echo "Setting up certificate auto-renewal"
  echo "0 3 * * * /usr/bin/certbot renew --quiet" | sudo tee /etc/cron.d/certbot-renewal
  sudo chmod 644 /etc/cron.d/certbot-renewal
  
  return 0
}

# Main execution
check_apache
install_certbot
if [ $? -eq 0 ]; then
  get_certificate 
  # Reload nginx to apply changes
  sudo nginx -t && sudo systemctl reload nginx || sudo service nginx reload
  echo "SSL setup complete"
else
  echo "SSL setup failed, continuing with HTTP only"
fi
EOL
}

# Create nginx configuration
create_nginx_config() {
  cat > nginx.conf.production << 'EOL'
server {
    # Listen on both standard and alternative ports
    listen 80;
    listen 8080; # Alternative port in case 80 is already in use
    
    # Domain names this server should respond to
    server_name codecampfirehostingdemo.com www.codecampfirehostingdemo.com 138.197.75.6;

    # Root directory where the files are located
    root /var/www/campfire-demo/dist;
    index index.html;

    # For SPA routing - redirect all non-file requests to index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Optimize asset caching
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|glb|gltf)$ {
        expires 1y;
        add_header Cache-Control "public, max-age=31536000";
        access_log off;
    }

    # Disable access to hidden files
    location ~ /\.(?!well-known) {
        deny all;
    }

    # Gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options nosniff;
    add_header X-Frame-Options SAMEORIGIN;
    add_header X-XSS-Protection "1; mode=block";
    add_header Referrer-Policy strict-origin-when-cross-origin;
}
EOL
}

# Generate known hosts
generate_known_hosts() {
  if [ ! -f ~/.ssh/known_hosts ] || ! grep -q "$SERVER_IP" ~/.ssh/known_hosts; then
    echo "Generating SSH known hosts..."
    ssh-keyscan -H "$SERVER_IP" >> ~/.ssh/known_hosts
  else
    echo "SSH known hosts already configured"
  fi
}

# Create setup script
create_setup_script() {
  cat > remote_setup.sh << 'EOL'
#!/bin/bash
# This script sets up the deployment server

# Install Nginx if it's not installed
if ! command -v nginx > /dev/null; then
  echo "Nginx not found. Installing..."
  if command -v apt-get > /dev/null; then
    sudo apt-get update
    sudo apt-get install -y nginx
  elif command -v yum > /dev/null; then
    sudo yum install -y nginx
  elif command -v dnf > /dev/null; then
    sudo dnf install -y nginx
  else
    echo "Could not install Nginx automatically."
    exit 1
  fi
fi

# Create deployment directory
DEPLOY_PATH="$1"
mkdir -p "$DEPLOY_PATH"

# Configure Nginx
if [ -d /etc/nginx/sites-available ]; then
  echo "Using sites-available/sites-enabled structure..."
  if [ -f nginx.conf.production ]; then
    sudo cp nginx.conf.production /etc/nginx/sites-available/campfire-demo
    sudo ln -sf /etc/nginx/sites-available/campfire-demo /etc/nginx/sites-enabled/
  fi
elif [ -d /etc/nginx/conf.d ]; then
  echo "Using conf.d structure..."
  if [ -f nginx.conf.production ]; then
    sudo cp nginx.conf.production /etc/nginx/conf.d/campfire-demo.conf
  fi
else
  echo "Could not determine Nginx configuration directory."
fi

# Execute SSL setup if script exists
if [ -f setup_ssl.sh ]; then
  echo "Setting up SSL..."
  chmod +x setup_ssl.sh
  ./setup_ssl.sh "$2" "$1"
fi

# Reload Nginx if it's running
if sudo systemctl is-active nginx >/dev/null 2>&1; then
  sudo systemctl reload nginx || sudo service nginx reload
  echo "Nginx configuration applied successfully!"
else
  sudo systemctl start nginx || sudo service nginx start
  echo "Nginx started successfully!"
fi

echo "Server setup completed!"
EOL
}

# Main script execution

echo "Setting up deployment server at $SERVER_IP..."

# Create necessary files
create_ssl_script
create_nginx_config
create_setup_script
generate_known_hosts

# Make scripts executable
chmod +x remote_setup.sh

# Copy files to server
echo "Copying setup files to server..."
scp nginx.conf.production setup_ssl.sh remote_setup.sh "$SERVER_USER@$SERVER_IP:~/"

# Execute setup script on server
echo "Executing setup script on server..."
ssh "$SERVER_USER@$SERVER_IP" "cd ~/ && chmod +x remote_setup.sh && ./remote_setup.sh $DEPLOY_PATH $DOMAIN"

# Clean up local files
echo "Cleaning up local files..."
rm nginx.conf.production setup_ssl.sh remote_setup.sh

echo "Server setup completed! Your deployment server is now ready."
echo "The GitHub Actions workflow will now be able to deploy directly without additional setup." 