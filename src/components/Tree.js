import * as THREE from 'three';

export class Tree {
  constructor(scene, position = new THREE.Vector3(0, 0, 0), scale = 1) {
    this.scene = scene;
    this.position = position;
    this.scale = scale;
    this.mesh = null;
    this.createTree();
  }

  createTree() {
    // Create tree container
    this.container = new THREE.Group();
    this.container.position.copy(this.position);
    
    // Randomize rotation for variety
    this.container.rotation.y = Math.random() * Math.PI * 2;
    
    // Scale the tree
    this.container.scale.set(this.scale, this.scale, this.scale);

    // Trunk material
    const trunkMaterial = new THREE.MeshStandardMaterial({
      color: 0x8B4513, // Brown
      roughness: 0.9,
    });

    // Leaves material
    const leavesMaterial = new THREE.MeshStandardMaterial({
      color: 0x228B22, // Forest green
      roughness: 0.8,
    });

    // Create trunk
    const trunkGeometry = new THREE.CylinderGeometry(0.2, 0.3, 2, 8);
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.y = 1; // Half height to place bottom at ground level
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    this.container.add(trunk);

    // Create leaves (multiple cones for a pine tree or sphere for a deciduous tree)
    // Let's make a pine tree with layered cones
    const leavesLayers = 4;
    const baseRadius = 1.2;
    const topRadius = 0.1;
    const height = 3;
    
    for (let i = 0; i < leavesLayers; i++) {
      const layerHeight = height * (0.5 + i * 0.2);
      const layerRadius = baseRadius * (1 - i * 0.2);
      const layerPosition = 2 + i * height * 0.25;
      
      const coneGeometry = new THREE.ConeGeometry(layerRadius, layerHeight, 8);
      const cone = new THREE.Mesh(coneGeometry, leavesMaterial);
      cone.position.y = layerPosition;
      cone.castShadow = true;
      
      this.container.add(cone);
    }

    // Add some randomness to the tree shape
    this.container.children.forEach(child => {
      if (child !== trunk) {
        // Add slight random variations to the foliage
        child.scale.x *= 0.9 + Math.random() * 0.2;
        child.scale.z *= 0.9 + Math.random() * 0.2;
        child.rotation.y = Math.random() * 0.2;
      }
    });

    this.scene.add(this.container);
    this.mesh = this.container;
  }

  getPosition() {
    return this.container.position.clone();
  }
} 