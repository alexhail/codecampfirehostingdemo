# Campfire 3D Demo

An immersive 3D campground simulation created with Three.js and JavaScript.

## Features

- 3D interactive campground environment with day/night atmosphere
- Player character with full movement and physics controls
- Interactive objects with tooltip system
- Third-person camera with zoom and rotation
- Advanced environment features:
  - Animated fire pit with particles
  - Interactive furniture and objects
  - Campground objects (tents, chairs, table with laptop)
  - Dense forest with hundreds of trees
  - Distant mountain ranges
  - Floating platform obstacle course
  - Giant floating text billboard
  - Collision detection system

## How to Run

1. Clone this repository
2. Install dependencies:
```
npm install
```
3. Run the development server:
```
npm run dev
```
4. Open the local server link displayed in the terminal

## Controls

- **WASD** - Move the player character
- **Mouse** - Look around (pointer is automatically locked)
- **Space** - Jump (press again mid-air for double jump!)
- **E** - Interact with objects
- **Mouse Wheel** - Zoom camera in/out

## Gameplay Features

- **Super Jump Physics**: Experience low-gravity jumping with a float effect
- **Collision Detection**: Realistic collisions with platforms and other objects
- **Interaction System**: Approach objects to see interaction tooltips
- **Platforming Challenge**: Navigate the floating platforms for a parkour experience
- **Mountain Exploration**: Explore the surrounding mountains and dense forests

## Technology Stack

- Three.js - 3D graphics library
- JavaScript - Programming language
- Vite - Development server and bundler

## Recent Improvements

- Added mouse-based camera controls with automatic pointer lock
- Implemented an interaction system with contextual tooltips
- Developed a physics system with realistic jumping and collision
- Created a floating platform obstacle course with emissive materials
- Added mountain collision detection for environment boundaries 

## Deployment

This project uses a two-step deployment process:

1. **Server Setup** (one-time operation)
2. **Continuous Deployment** via GitHub Actions

### Server Setup

The repository includes a `setup-deployment-server.sh` script that prepares your server for deployment:

```bash
# Edit the script configuration section first
nano setup-deployment-server.sh

# Run the script
./setup-deployment-server.sh
```

The server setup script:
- Installs and configures Nginx web server
- Sets up SSL certificates with Certbot
- Handles domain configuration
- Resolves conflicts with Apache if it's running
- Creates the necessary directory structure
- Sets up automatic SSL certificate renewal

### GitHub Actions Deployment

Once the server is set up, the GitHub Actions workflow handles continuous deployment:

1. When code is pushed to the master branch, it automatically:
   - Builds the project
   - Packages the build output
   - Deploys it to your server

2. The workflow is configured to use the following GitHub secrets:
   - `SSH_PRIVATE_KEY` - Private SSH key for connecting to your server
   - `SERVER_USER` - Username for SSH login to your server
   - `DEPLOY_PATH` - Full path to the deployment directory on the server
   - `SERVER_IP` - IP address of your server

### Setting Up GitHub Secrets

Use the included `setup-github-secrets.sh` script to configure your GitHub secrets:

```bash
# Install GitHub CLI first if you don't have it
# On Windows: winget install GitHub.cli
# Then authenticate
gh auth login

# Run the script to set up secrets
./setup-github-secrets.sh
```

### Manual Deployment

You can also manually trigger a deployment from the GitHub Actions tab by clicking "Run workflow" on the "Deploy to DigitalOcean" workflow.
