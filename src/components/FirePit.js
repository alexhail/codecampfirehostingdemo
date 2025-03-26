import * as THREE from 'three';

export class FirePit {
  constructor(scene) {
    this.scene = scene;
    this.mesh = null;
    this.fireParticles = [];
    this.createFirePit();
    this.createFire();
  }

  createFirePit() {
    // Fire pit base (stones arranged in a circle)
    const stoneMaterial = new THREE.MeshStandardMaterial({
      color: 0x888888,
      roughness: 0.8,
    });

    // Create the fire pit container
    this.container = new THREE.Group();
    this.container.position.set(3, 0, 0); // Position it near the player start position

    // Create stones around the fire pit
    const stoneRadius = 0.3;
    const pitRadius = 1.2;
    const stoneCount = 10;
    
    for (let i = 0; i < stoneCount; i++) {
      const angle = (i / stoneCount) * Math.PI * 2;
      const stoneGeometry = new THREE.SphereGeometry(stoneRadius, 8, 6);
      const stone = new THREE.Mesh(stoneGeometry, stoneMaterial);
      
      stone.position.x = Math.cos(angle) * pitRadius;
      stone.position.z = Math.sin(angle) * pitRadius;
      stone.position.y = stoneRadius * 0.5;
      
      // Randomize stone shape a bit
      stone.scale.set(
        1 + Math.random() * 0.2,
        0.7 + Math.random() * 0.4,
        1 + Math.random() * 0.2
      );
      
      stone.rotation.y = Math.random() * Math.PI;
      stone.castShadow = true;
      stone.receiveShadow = true;
      
      this.container.add(stone);
    }

    // Add dirt/ash area in the center
    const groundGeometry = new THREE.CircleGeometry(pitRadius * 0.9, 32);
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x3a2a1a,
      roughness: 1,
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0.05;
    ground.receiveShadow = true;
    this.container.add(ground);

    // Add logs in fire pit (crossed pattern)
    const logGeometry = new THREE.CylinderGeometry(0.1, 0.1, 1.5, 8);
    const logMaterial = new THREE.MeshStandardMaterial({
      color: 0x8B4513,
      roughness: 0.9,
    });

    const log1 = new THREE.Mesh(logGeometry, logMaterial);
    log1.position.y = 0.2;
    log1.rotation.z = Math.PI / 4;
    log1.rotation.x = Math.PI / 6;
    log1.castShadow = true;
    this.container.add(log1);

    const log2 = new THREE.Mesh(logGeometry, logMaterial);
    log2.position.y = 0.2;
    log2.rotation.z = -Math.PI / 4;
    log2.rotation.x = -Math.PI / 6;
    log2.castShadow = true;
    this.container.add(log2);

    this.scene.add(this.container);
    this.mesh = this.container;
  }

  createFire() {
    // Add pointlight for fire illumination
    this.fireLight = new THREE.PointLight(0xff6600, 1.5, 5);
    this.fireLight.position.set(0, 0.5, 0);
    this.container.add(this.fireLight);

    // Create fire particles
    const particleCount = 20; // Further reduced particle count
    
    // Create flame material with more transparent edges
    const flameMaterial = new THREE.SpriteMaterial({
      map: this.createFlameTexture(),
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    
    // Create particles
    for (let i = 0; i < particleCount; i++) {
      const particle = new THREE.Sprite(flameMaterial.clone());
      
      // Randomize position within a much smaller area
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * 0.2; // Further reduced from 0.3 to 0.2
      particle.position.set(
        Math.cos(angle) * radius,
        0.2 + Math.random() * 0.6, // Reduced height range
        Math.sin(angle) * radius
      );
      
      // Even smaller sizes
      const size = 0.08 + Math.random() * 0.22; // Further reduced sizes
      particle.scale.set(size, size, size);
      
      // Almost no sideways movement
      particle.userData = {
        speed: 0.01 + Math.random() * 0.015,
        offsetX: Math.random() * 0.05 - 0.025, // Minimal sideways movement
        offsetZ: Math.random() * 0.05 - 0.025, // Minimal sideways movement
        scaleSpeed: 0.01 + Math.random() * 0.01,
        rotationSpeed: Math.random() * 0.02 - 0.01,
        initialY: particle.position.y,
        lifespan: 0.4 + Math.random() * 1.0, // Shorter lifespan
        age: 0
      };
      
      this.container.add(particle);
      this.fireParticles.push(particle);
    }
    
    // Add a few embers (small red particles) that stay very low
    const emberCount = 5;
    const emberMaterial = new THREE.SpriteMaterial({
      map: this.createEmberTexture(),
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    
    for (let i = 0; i < emberCount; i++) {
      const ember = new THREE.Sprite(emberMaterial.clone());
      
      // Position embers very low and central
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * 0.15;
      ember.position.set(
        Math.cos(angle) * radius,
        0.15 + Math.random() * 0.1, // Very low
        Math.sin(angle) * radius
      );
      
      // Tiny ember sizes
      const size = 0.05 + Math.random() * 0.08;
      ember.scale.set(size, size, size);
      
      ember.userData = {
        speed: 0.005 + Math.random() * 0.01, // Slow rising
        offsetX: Math.random() * 0.03 - 0.015, // Almost no sideways movement
        offsetZ: Math.random() * 0.03 - 0.015,
        initialY: ember.position.y,
        lifespan: 0.3 + Math.random() * 0.7, // Short lifespan
        age: 0
      };
      
      this.container.add(ember);
      this.fireParticles.push(ember);
    }
  }

  createFlameTexture() {
    // Create a canvas to draw the flame texture
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const context = canvas.getContext('2d');
    
    // Create a radial gradient for the flame
    const gradient = context.createRadialGradient(
      32, 32, 0,
      32, 32, 32
    );
    
    // Define colors for the flame with more transparent edges
    gradient.addColorStop(0, 'rgba(255, 255, 100, 1)');
    gradient.addColorStop(0.2, 'rgba(255, 155, 50, 0.9)');
    gradient.addColorStop(0.5, 'rgba(255, 50, 0, 0.6)');
    gradient.addColorStop(0.8, 'rgba(255, 0, 0, 0.3)');
    gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
    
    // Fill with gradient
    context.fillStyle = gradient;
    context.fillRect(0, 0, 64, 64);
    
    return new THREE.CanvasTexture(canvas);
  }
  
  createEmberTexture() {
    // Create a canvas for ember texture
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const context = canvas.getContext('2d');
    
    // Create a radial gradient for the ember
    const gradient = context.createRadialGradient(
      16, 16, 0,
      16, 16, 16
    );
    
    // Define colors for the ember (more red/orange)
    gradient.addColorStop(0, 'rgba(255, 180, 50, 1)');
    gradient.addColorStop(0.3, 'rgba(255, 100, 0, 0.8)');
    gradient.addColorStop(0.7, 'rgba(200, 0, 0, 0.5)');
    gradient.addColorStop(1, 'rgba(200, 0, 0, 0)');
    
    // Fill with gradient
    context.fillStyle = gradient;
    context.fillRect(0, 0, 32, 32);
    
    return new THREE.CanvasTexture(canvas);
  }

  update(deltaTime) {
    // Update fire particles
    for (let i = 0; i < this.fireParticles.length; i++) {
      const particle = this.fireParticles[i];
      const userData = particle.userData;
      
      // Update age
      userData.age += deltaTime;
      
      // If particle is too old, reset it
      if (userData.age > userData.lifespan) {
        // Reset position
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * 0.2; // Keep consistent with creation
        particle.position.set(
          Math.cos(angle) * radius,
          userData.initialY,
          Math.sin(angle) * radius
        );
        
        // Reset age
        userData.age = 0;
        
        // Reset size (based on whether it's a flame or ember)
        if (particle.scale.x > 0.1) {
          // It's a flame
          const size = 0.08 + Math.random() * 0.22;
          particle.scale.set(size, size, size);
        } else {
          // It's an ember
          const size = 0.05 + Math.random() * 0.08;
          particle.scale.set(size, size, size);
        }
        
        // Reset opacity
        particle.material.opacity = 1.0;
      } else {
        // Move upward
        particle.position.y += userData.speed;
        
        // Add some random horizontal movement (very limited)
        particle.position.x += userData.offsetX * Math.sin(userData.age * 5);
        particle.position.z += userData.offsetZ * Math.sin(userData.age * 5);
        
        // Calculate lifecycle progress (0 to 1)
        const lifecycle = userData.age / userData.lifespan;
        
        // Scale down as the particle moves up and ages
        particle.scale.multiplyScalar(0.99);
        
        // Make transparent as it ages
        particle.material.opacity = Math.max(0, 1 - lifecycle * 1.2);
      }
    }
    
    // Flicker fire light (more subtle)
    this.fireLight.intensity = 1.3 + Math.random() * 0.4;
  }

  getPosition() {
    return this.container.position.clone();
  }
} 