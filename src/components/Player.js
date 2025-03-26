import * as THREE from 'three';

export class Player {
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;
    this.mesh = null;
    this.moveSpeed = 0.1;
    this.rotationSpeed = 0.05;
    this.keysPressed = {};
    this.velocity = new THREE.Vector3();
    this.direction = new THREE.Vector3();
    
    // Jump physics
    this.position = new THREE.Vector3(0, 0, 0);
    this.isJumping = false;
    this.jumpVelocity = 0;
    this.jumpStrength = 1.0; // Increased for super high jumps
    this.gravity = 0.008; // Reduced for slower falling
    this.floatFactor = 0.15; // Lower values = more floating
    this.canDoubleJump = false; // Allow for double jump
    this.doubleJumpStrength = 1.5; // Even stronger second jump
    
    // Collision detection
    this.playerCollider = new THREE.Box3();
    this.playerSize = new THREE.Vector3(1, 1.8, 1);
    this.groundLevel = 0; // Current ground level, changes when on platforms
    this.onPlatform = false;
    this.currentPlatform = null;
    
    // Camera controls
    this.cameraRotation = {
      horizontal: 0,
      vertical: 0
    };
    this.mouseSensitivity = 0.002;
    this.verticalLimit = Math.PI / 3; // Limit the vertical camera rotation
    this.isPointerLocked = false;
    
    // Interaction system
    this.interactionRaycaster = new THREE.Raycaster();
    this.interactableObjects = [];
    this.interactionDistance = 3; // Maximum distance for interaction
    this.currentInteractable = null;
    this.tooltipElement = document.getElementById('interaction-tooltip');
    
    // Camera settings
    this.cameraDistance = 10; // Default camera distance
    this.minCameraDistance = 3; // Minimum zoom distance
    this.maxCameraDistance = 15; // Maximum zoom distance
    this.cameraHeightDefault = 5; // Default camera height
    this.cameraHeightMin = 2; // Minimum camera height when zoomed in
    this.cameraLookHeight = 1; // Height to look at (player's head level)
    
    // Create player character
    this.createPlayer();
    
    // Setup key listeners and mouse wheel for zoom
    this.setupEventListeners();
    
    // Request pointer lock on next click
    this.pointerLockRequested = true;
    this.lockPointer();
  }

  setupEventListeners() {
    // Key down event
    document.addEventListener('keydown', (event) => {
      this.keysPressed[event.key.toLowerCase()] = true;
      
      // Check for interaction key (E)
      if (event.key.toLowerCase() === 'e' && this.currentInteractable) {
        this.interact(this.currentInteractable);
      }
      
      // Check for jump key (SPACE)
      if (event.key === ' ') {
        if (!this.isJumping) {
          this.jump();
        } else if (this.canDoubleJump) {
          this.doubleJump();
        }
      }
    });

    // Key up event
    document.addEventListener('keyup', (event) => {
      this.keysPressed[event.key.toLowerCase()] = false;
    });
    
    // Mouse wheel for zooming
    document.addEventListener('wheel', (event) => {
      // Determine zoom direction (positive = zoom out, negative = zoom in)
      const zoomFactor = 0.5; // Adjust sensitivity
      this.cameraDistance += event.deltaY * 0.01 * zoomFactor;
      
      // Clamp to min/max values
      this.cameraDistance = Math.max(this.minCameraDistance, 
                             Math.min(this.maxCameraDistance, this.cameraDistance));
    });
    
    // Mouse move for camera rotation
    document.addEventListener('mousemove', (event) => {
      if (this.isPointerLocked) {
        // Update camera rotation based on mouse movement
        this.cameraRotation.horizontal -= event.movementX * this.mouseSensitivity;
        // Invert the vertical movement to make it intuitive (mouse up = camera up)
        this.cameraRotation.vertical += event.movementY * this.mouseSensitivity;
        
        // Clamp vertical rotation to prevent camera flipping
        this.cameraRotation.vertical = Math.max(
          -this.verticalLimit,
          Math.min(this.verticalLimit, this.cameraRotation.vertical)
        );
      }
    });
    
    // Track pointer lock state
    document.addEventListener('pointerlockchange', () => {
      // Check which element is locked
      this.isPointerLocked = document.pointerLockElement === document.body ||
                            document.pointerLockElement === document.querySelector('canvas');
      
      console.log("Pointer lock changed. Locked:", this.isPointerLocked);
    });
    
    // Handle pointer lock error
    document.addEventListener('pointerlockerror', (e) => {
      console.error('Pointer lock failed', e);
      this.isPointerLocked = false;
    });
    
    // Capture clicks to request pointer lock on user interaction
    document.addEventListener('click', () => {
      if (!this.isPointerLocked) {
        this.lockPointer();
      } else if (this.currentInteractable) {
        // If we're locked and looking at an interactable, interact with it
        this.interact(this.currentInteractable);
      }
    });
  }
  
  // Register an object as interactable
  registerInteractable(object, interactionData) {
    if (!object) {
      console.warn('Attempted to register null object as interactable');
      return null;
    }
    
    if (!object.userData) {
      object.userData = {};
    }
    
    // Store interaction data in the object's userData
    object.userData.isInteractable = true;
    object.userData.interactionName = interactionData.name || 'Object';
    object.userData.interactionAction = interactionData.action || 'Use';
    object.userData.onInteract = interactionData.onInteract || (() => {
      console.log(`Interacted with ${object.userData.interactionName}`);
    });
    
    // Add to our list of interactable objects
    this.interactableObjects.push(object);
    console.log(`Registered interactable: ${object.userData.interactionName}`);
    
    return object; // Return for chaining
  }
  
  // Remove an object from interactables
  unregisterInteractable(object) {
    const index = this.interactableObjects.indexOf(object);
    if (index >= 0) {
      this.interactableObjects.splice(index, 1);
      if (object.userData) {
        object.userData.isInteractable = false;
      }
    }
  }
  
  jump() {
    if (!this.isJumping) {
      this.isJumping = true;
      this.jumpVelocity = this.jumpStrength;
      this.canDoubleJump = true; // Enable double jump after first jump
      console.log("Super jump activated!");
    }
  }
  
  doubleJump() {
    // Reset upward velocity with even greater strength
    this.jumpVelocity = this.doubleJumpStrength;
    this.canDoubleJump = false; // Disable double jump until landing
    console.log("Double jump boost activated!");
  }
  
  lockPointer() {
    try {
      // Use renderer's domElement instead of document.body
      const canvas = document.querySelector('canvas');
      if (canvas && !this.isPointerLocked) {
        canvas.requestPointerLock();
      }
    } catch (e) {
      console.error("Failed to lock pointer", e);
    }
  }
  
  interact(interactable) {
    if (interactable && interactable.userData && interactable.userData.onInteract) {
      console.log(`Interacting with ${interactable.userData.interactionName}`);
      interactable.userData.onInteract(interactable);
    }
  }
  
  showTooltip(interactable) {
    if (!this.tooltipElement || !interactable) return;
    
    const actionText = interactable.userData.interactionAction || 'Use';
    const objectName = interactable.userData.interactionName || 'Object';
    
    // Update tooltip text
    this.tooltipElement.innerHTML = `Press <span class="key-hint">E</span> to ${actionText} ${objectName}`;
    this.tooltipElement.classList.add('visible');
  }
  
  hideTooltip() {
    if (!this.tooltipElement) return;
    this.tooltipElement.classList.remove('visible');
  }

  createPlayer() {
    // Create player container
    this.container = new THREE.Group();
    this.container.position.set(0, 0, 0);
    
    // Simple player model (will be replaced with better model later)
    const bodyGeometry = new THREE.CylinderGeometry(0.5, 0.5, 1.8, 32);
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x1a75ff });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.9; // Half height to position bottom at ground level
    body.castShadow = true;
    body.receiveShadow = true;
    
    // Add a simple head
    const headGeometry = new THREE.SphereGeometry(0.3, 32, 32);
    const headMaterial = new THREE.MeshStandardMaterial({ color: 0xffcc99 });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 1.9; // Position on top of body
    head.castShadow = true;
    
    // Add limbs
    const limbMaterial = new THREE.MeshStandardMaterial({ color: 0x3366cc });
    
    // Arms
    const armGeometry = new THREE.BoxGeometry(0.2, 0.6, 0.2);
    
    const leftArm = new THREE.Mesh(armGeometry, limbMaterial);
    leftArm.position.set(0.6, 1.1, 0);
    leftArm.castShadow = true;
    
    const rightArm = new THREE.Mesh(armGeometry, limbMaterial);
    rightArm.position.set(-0.6, 1.1, 0);
    rightArm.castShadow = true;
    
    // Put everything together
    this.container.add(body);
    this.container.add(head);
    this.container.add(leftArm);
    this.container.add(rightArm);
    
    // Add player to scene
    this.scene.add(this.container);
    this.mesh = this.container;
  }

  update() {
    // Handle movement based on keys pressed
    const moveForward = this.keysPressed['w'] || false;
    const moveBackward = this.keysPressed['s'] || false;
    const moveLeft = this.keysPressed['a'] || false;
    const moveRight = this.keysPressed['d'] || false;

    // Calculate movement direction relative to camera orientation
    const cameraDirection = new THREE.Vector3();
    this.camera.getWorldDirection(cameraDirection);
    cameraDirection.y = 0; // Keep movement on the horizontal plane
    cameraDirection.normalize();
    
    // Calculate right vector (perpendicular to camera direction)
    const cameraRight = new THREE.Vector3(1, 0, 0);
    cameraRight.applyQuaternion(this.camera.quaternion);
    cameraRight.y = 0; // Keep movement on the horizontal plane
    cameraRight.normalize();
    
    // Reset movement direction
    this.direction.set(0, 0, 0);
    
    // Apply directional movement based on camera orientation
    if (moveForward) this.direction.add(cameraDirection);
    if (moveBackward) this.direction.sub(cameraDirection);
    if (moveLeft) this.direction.sub(cameraRight);
    if (moveRight) this.direction.add(cameraRight);
    
    // Store old position for collision resolution
    const oldPosition = this.container.position.clone();
    
    // Normalize the direction if there's movement
    if (this.direction.lengthSq() > 0) {
      this.direction.normalize();
      
      // Apply movement speed
      this.velocity.copy(this.direction).multiplyScalar(this.moveSpeed);
      
      // Update position
      this.container.position.x += this.velocity.x;
      this.container.position.z += this.velocity.z;
      
      // Rotate player to face movement direction
      const angle = Math.atan2(this.direction.x, this.direction.z);
      this.container.rotation.y = THREE.MathUtils.lerp(
        this.container.rotation.y,
        angle,
        0.2 // Rotation speed
      );
    }
    
    // Update jump physics
    this.updateJump();
    
    // Check for collisions
    this.checkCollisions();
    
    // Update camera based on mouse movement
    this.updateCamera();
    
    // Check for nearby interactable objects only if we have interactables
    if (this.interactableObjects.length > 0) {
      this.checkInteractions();
    }
  }
  
  checkInteractions() {
    if (!this.camera) {
      console.warn('Camera not available for raycasting');
      return;
    }
    
    // Create a ray from the camera pointing forward
    const direction = new THREE.Vector3(0, 0, -1);
    direction.applyQuaternion(this.camera.quaternion);
    
    this.interactionRaycaster.set(this.camera.position, direction);
    
    try {
      // Check for intersections with interactable objects
      const intersects = this.interactionRaycaster.intersectObjects(this.interactableObjects, true);
      
      // Filter intersections by distance
      const validIntersects = intersects.filter(intersection => 
        intersection.distance <= this.interactionDistance
      );
      
      // If we have valid intersections
      if (validIntersects.length > 0) {
        // Get the closest intersection
        const closestIntersect = validIntersects[0];
        
        // Find the root object that has the interactable userData
        let interactableObject = closestIntersect.object;
        while (interactableObject && (!interactableObject.userData || !interactableObject.userData.isInteractable)) {
          interactableObject = interactableObject.parent;
        }
        
        // If we found an interactable
        if (interactableObject && interactableObject.userData && interactableObject.userData.isInteractable) {
          // If it's different from current, update tooltip
          if (this.currentInteractable !== interactableObject) {
            this.currentInteractable = interactableObject;
            this.showTooltip(interactableObject);
          }
          return;
        }
      }
      
      // If we got here, we're not looking at an interactable
      if (this.currentInteractable) {
        this.currentInteractable = null;
        this.hideTooltip();
      }
    } catch (error) {
      console.error("Error in checkInteractions:", error);
    }
  }
  
  checkCollisions() {
    // Skip if there are no collidable objects
    if (!window.collidableObjects || window.collidableObjects.length === 0) {
      return;
    }
    
    // Update the player's collision box
    this.updatePlayerCollider();
    
    // Reset platform state
    const wasOnPlatform = this.onPlatform;
    this.onPlatform = false;
    this.currentPlatform = null;
    
    // Check collision with each collidable object
    for (const object of window.collidableObjects) {
      if (!object.userData || !object.userData.isCollidable || !object.userData.collisionBox) {
        continue;
      }
      
      // Check collision
      if (this.playerCollider.intersectsBox(object.userData.collisionBox)) {
        // Handle collision based on object type
        if (object.userData.type === 'platform') {
          this.handlePlatformCollision(object);
        } else if (object.userData.type === 'mountain') {
          this.handleMountainCollision(object);
        }
      }
    }
    
    // If we were on a platform but now we're not, start falling
    if (wasOnPlatform && !this.onPlatform && !this.isJumping) {
      this.isJumping = true;
      this.jumpVelocity = 0; // Start with no upward velocity
    }
  }
  
  updatePlayerCollider() {
    // Calculate the player's bounding box
    this.playerCollider.setFromCenterAndSize(
      new THREE.Vector3(
        this.container.position.x,
        this.container.position.y + this.playerSize.y / 2,
        this.container.position.z
      ),
      this.playerSize
    );
  }
  
  handlePlatformCollision(platform) {
    // Get platform dimensions from its bounding box (which updates with platform movement)
    const platformBox = platform.userData.collisionBox;
    const platformMin = platformBox.min;
    const platformMax = platformBox.max;
    
    // Get player's position
    const playerMin = this.playerCollider.min;
    const playerMax = this.playerCollider.max;
    const playerPos = this.container.position;
    
    // Check if player is above the platform (with a bit more tolerance)
    if (playerMin.y <= platformMax.y && playerPos.y >= platformMax.y - 0.3) {
      // Player is standing on the platform
      this.onPlatform = true;
      this.currentPlatform = platform;
      this.groundLevel = platformMax.y;
      
      // Snap player to platform top
      if (this.isJumping && this.jumpVelocity <= 0) {
        this.container.position.y = this.groundLevel;
        this.isJumping = false;
        this.jumpVelocity = 0;
        this.canDoubleJump = false;
      } else if (!this.isJumping) {
        // Even if not jumping, ensure player stays attached to platform
        this.container.position.y = this.groundLevel;
      }
      
      // Move with the platform if it's moving
      if (platform.userData.lastPosition) {
        const deltaY = platformMax.y - platform.userData.lastPosition.y;
        // Apply vertical movement from platform
        if (Math.abs(deltaY) > 0.001) {
          this.container.position.y += deltaY;
        }
      }
      
      // Store platform's current position for next frame
      if (!platform.userData.lastPosition) {
        platform.userData.lastPosition = new THREE.Vector3();
      }
      platform.userData.lastPosition.y = platformMax.y;
    } else {
      // Handle side collision (basic push back)
      const overlap = new THREE.Vector3();
      
      // X-axis overlap
      if (playerPos.x > platformMin.x && playerPos.x < platformMax.x) {
        const leftOverlap = playerMax.x - platformMin.x;
        const rightOverlap = platformMax.x - playerMin.x;
        
        if (leftOverlap < rightOverlap) {
          // Collision on left
          playerPos.x -= leftOverlap + 0.05;
        } else {
          // Collision on right
          playerPos.x += rightOverlap + 0.05;
        }
      }
      
      // Z-axis overlap
      if (playerPos.z > platformMin.z && playerPos.z < platformMax.z) {
        const frontOverlap = playerMax.z - platformMin.z;
        const backOverlap = platformMax.z - playerMin.z;
        
        if (frontOverlap < backOverlap) {
          // Collision on front
          playerPos.z -= frontOverlap + 0.05;
        } else {
          // Collision on back
          playerPos.z += backOverlap + 0.05;
        }
      }
    }
  }
  
  handleMountainCollision(mountain) {
    // Simple collision response - push player away from mountain
    const mountainBox = mountain.userData.collisionBox;
    const mountainCenter = new THREE.Vector3();
    mountainBox.getCenter(mountainCenter);
    
    // Get direction from mountain to player
    const pushDirection = new THREE.Vector3();
    pushDirection.subVectors(this.container.position, mountainCenter).normalize();
    
    // Push player away
    this.container.position.x += pushDirection.x * 0.5;
    this.container.position.z += pushDirection.z * 0.5;
  }

  updateCamera() {
    // Create a pivot point at the player's position
    const playerPosition = this.container.position.clone();
    playerPosition.y += this.cameraLookHeight; // Offset to camera look height
    
    // Position camera based on camera rotation angles
    const cameraPosition = new THREE.Vector3();
    cameraPosition.x = Math.sin(this.cameraRotation.horizontal) * Math.cos(this.cameraRotation.vertical);
    cameraPosition.z = Math.cos(this.cameraRotation.horizontal) * Math.cos(this.cameraRotation.vertical);
    cameraPosition.y = Math.sin(this.cameraRotation.vertical);
    
    // Scale by camera distance and add player position
    cameraPosition.multiplyScalar(this.cameraDistance);
    cameraPosition.add(playerPosition);
    
    // Update camera position
    this.camera.position.lerp(cameraPosition, 0.1);
    
    // Make camera look at player
    this.camera.lookAt(playerPosition);
  }

  getPosition() {
    return this.container.position.clone();
  }

  updateJump() {
    if (this.isJumping) {
      // Apply gravity with float factor
      // When going up, apply normal gravity. When coming down, apply reduced gravity for floating effect
      const gravityToApply = this.jumpVelocity > 0 ? this.gravity : this.gravity * this.floatFactor;
      this.jumpVelocity -= gravityToApply;
      
      this.container.position.y += this.jumpVelocity;
      
      // Check if we've landed on the ground or a platform
      if (this.onPlatform) {
        // Landing on a platform is handled in handlePlatformCollision
      } else if (this.container.position.y <= 0) {
        // Landing on the ground
        this.isJumping = false;
        this.container.position.y = 0;
        this.jumpVelocity = 0;
        this.canDoubleJump = false; // Reset double jump on landing
        this.groundLevel = 0;
      }
    }
  }
} 