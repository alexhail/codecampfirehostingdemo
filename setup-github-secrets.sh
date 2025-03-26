#!/bin/bash

# Check if the Github CLI is installed
if ! command -v gh &> /dev/null; then
    echo "Error: Github CLI not found. Please install it first:"
    echo "https://cli.github.com/manual/installation"
    exit 1
fi

# Check if user is authenticated with GitHub CLI
if ! gh auth status &> /dev/null; then
    echo "You need to authenticate with GitHub CLI first. Run:"
    echo "gh auth login"
    exit 1
fi

# Get the GitHub repository name from the git remote
REPO=$(git remote get-url origin 2>/dev/null | sed -n 's/.*github.com[:\/]\(.*\)\.git/\1/p')

if [ -z "$REPO" ]; then
    echo "Error: Could not determine GitHub repository from git remote."
    echo "Please enter your GitHub repository in the format 'owner/repo':"
    read REPO
    
    if [ -z "$REPO" ]; then
        echo "Error: No repository provided. Exiting."
        exit 1
    fi
fi

echo "Setting up deployment secrets for repository: $REPO"
echo "Reading values from .env file..."

# Set deployment-related environment variables
if [ -f .env ]; then
    # Get NODE_ENV
    NODE_ENV=$(grep -E "^NODE_ENV=" .env | cut -d= -f2-)
    if [ -n "$NODE_ENV" ]; then
        echo "Setting secret: NODE_ENV"
        echo -n "$NODE_ENV" | gh secret set "NODE_ENV" -R "$REPO"
    else
        echo "Warning: NODE_ENV not found in .env file."
    fi

    # Get DEPLOY_PATH
    DEPLOY_PATH=$(grep -E "^DEPLOY_PATH=" .env | cut -d= -f2-)
    if [ -n "$DEPLOY_PATH" ]; then
        echo "Setting secret: DEPLOY_PATH"
        echo -n "$DEPLOY_PATH" | gh secret set "DEPLOY_PATH" -R "$REPO"
    else
        echo "Warning: DEPLOY_PATH not found in .env file."
    fi

    # Get SERVER_USER
    SERVER_USER=$(grep -E "^SERVER_USER=" .env | cut -d= -f2-)
    if [ -n "$SERVER_USER" ]; then
        echo "Setting secret: SERVER_USER"
        echo -n "$SERVER_USER" | gh secret set "SERVER_USER" -R "$REPO"
    else
        echo "Warning: SERVER_USER not found in .env file."
    fi
    
    # Get SERVER_IP
    SERVER_IP=$(grep -E "^SERVER_IP=" .env | cut -d= -f2-)
    if [ -n "$SERVER_IP" ]; then
        echo "Setting secret: SERVER_IP"
        echo -n "$SERVER_IP" | gh secret set "SERVER_IP" -R "$REPO"
    else
        echo "Warning: SERVER_IP not found in .env file."
    fi
    
    echo "✅ Deployment variables from .env added as GitHub secrets."
else
    echo "Error: .env file not found."
    exit 1
fi

# Display SSH key instructions with colorized output
echo ""
echo "📝 Almost done! Don't forget to set your SSH private key:"
echo -e "\033[1;36mgh secret set SSH_PRIVATE_KEY -R \"$REPO\" < ~/.ssh/id_rsa\033[0m"
echo ""
echo "🚀 After adding your SSH key, your deployment should be fully configured!" 