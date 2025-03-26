import * as THREE from 'three';

export class Table {
  constructor(scene) {
    this.scene = scene;
    this.mesh = null;
    this.createTable();
  }

  createTable() {
    // Create table container
    this.container = new THREE.Group();
    this.container.position.set(-3, 0, 2); // Position it to the side of the camp

    // Wood material for the table
    const woodMaterial = new THREE.MeshStandardMaterial({
      color: 0x8B4513,
      roughness: 0.8,
      metalness: 0.1
    });

    // Table top
    const tableTopGeometry = new THREE.BoxGeometry(2, 0.1, 1.2);
    const tableTop = new THREE.Mesh(tableTopGeometry, woodMaterial);
    tableTop.position.y = 0.8; // Standard table height
    tableTop.castShadow = true;
    tableTop.receiveShadow = true;
    this.container.add(tableTop);

    // Table legs
    const legGeometry = new THREE.BoxGeometry(0.1, 0.8, 0.1);
    
    // Create four legs
    const legPositions = [
      { x: 0.85, z: 0.5 },
      { x: 0.85, z: -0.5 },
      { x: -0.85, z: 0.5 },
      { x: -0.85, z: -0.5 }
    ];
    
    legPositions.forEach(pos => {
      const leg = new THREE.Mesh(legGeometry, woodMaterial);
      leg.position.set(pos.x, 0.4, pos.z); // Position the leg
      leg.castShadow = true;
      leg.receiveShadow = true;
      this.container.add(leg);
    });

    // Add laptop on the table
    this.createLaptop();

    // Add a simple map/paper
    const mapGeometry = new THREE.BoxGeometry(0.4, 0.01, 0.3);
    const mapMaterial = new THREE.MeshStandardMaterial({ color: 0xF5F5DC });
    const map = new THREE.Mesh(mapGeometry, mapMaterial);
    map.position.set(-0.3, 0.86, 0);
    map.rotation.z = 0.1;
    map.castShadow = true;
    this.container.add(map);

    this.scene.add(this.container);
    this.mesh = this.container;
  }

  createLaptop() {
    // Laptop group
    const laptop = new THREE.Group();
    laptop.position.set(0.3, 0.85, -0.1);
    laptop.rotation.y = -Math.PI / 6; // Angle it slightly
    
    // Laptop base material (silver/aluminum look)
    const laptopBaseMaterial = new THREE.MeshStandardMaterial({
      color: 0xD0D0D0,
      metalness: 0.5,
      roughness: 0.2
    });
    
    // Laptop screen material (black when off)
    const laptopScreenMaterial = new THREE.MeshStandardMaterial({
      color: 0x111111,
      metalness: 0.1,
      roughness: 0.2
    });
    
    // Screen content material (blue-ish light)
    const screenContentMaterial = new THREE.MeshBasicMaterial({
      color: 0x3E7BE0,
      transparent: true,
      opacity: 0.9
    });
    
    // Laptop base/bottom
    const baseWidth = 0.6;
    const baseDepth = 0.4;
    const baseHeight = 0.02;
    const baseGeometry = new THREE.BoxGeometry(baseWidth, baseHeight, baseDepth);
    const base = new THREE.Mesh(baseGeometry, laptopBaseMaterial);
    laptop.add(base);
    
    // Laptop keyboard area (slightly recessed)
    const keyboardGeometry = new THREE.BoxGeometry(baseWidth * 0.9, 0.01, baseDepth * 0.7);
    const keyboard = new THREE.Mesh(keyboardGeometry, laptopBaseMaterial);
    keyboard.position.set(0, baseHeight / 2 + 0.005, -baseDepth * 0.1);
    laptop.add(keyboard);
    
    // Laptop screen
    const screenWidth = baseWidth;
    const screenHeight = 0.4;
    const screenDepth = 0.01;
    const screenGeometry = new THREE.BoxGeometry(screenWidth, screenHeight, screenDepth);
    const screen = new THREE.Mesh(screenGeometry, laptopBaseMaterial);
    
    // Position the screen and rotate it to be open
    screen.position.set(0, baseHeight / 2 + screenHeight / 2, -baseDepth / 2);
    screen.rotation.x = -Math.PI / 5; // Open at an angle
    laptop.add(screen);
    
    // Add screen display (front face of screen)
    const displayWidth = screenWidth * 0.85;
    const displayHeight = screenHeight * 0.85;
    const displayGeometry = new THREE.PlaneGeometry(displayWidth, displayHeight);
    const display = new THREE.Mesh(displayGeometry, laptopScreenMaterial);
    display.position.set(0, 0, screenDepth / 2 + 0.001);
    display.rotation.x = Math.PI; // Flip to face outward
    screen.add(display);
    
    // Add screen content (text editor or code)
    const contentGeometry = new THREE.PlaneGeometry(displayWidth * 0.9, displayHeight * 0.8);
    const content = new THREE.Mesh(contentGeometry, screenContentMaterial);
    content.position.set(0, 0, 0.001);
    display.add(content);
    
    // Add the laptop to the table
    this.container.add(laptop);
    
    // Add a simple pulsing glow to simulate the laptop being on
    this.laptop = laptop;
    this.screenDisplay = display;
  }

  update(time) {
    if (this.laptop) {
      // Make the screen pulse slightly to simulate activity
      const pulse = Math.sin(time * 2) * 0.1 + 0.9;
      
      if (this.screenDisplay.material) {
        this.screenDisplay.material.emissive = new THREE.Color(0x101822);
        this.screenDisplay.material.emissiveIntensity = pulse;
      }
    }
  }

  getPosition() {
    return this.container.position.clone();
  }
} 