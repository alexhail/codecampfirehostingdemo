import * as THREE from 'three';

export class Tent {
  constructor(scene, position = new THREE.Vector3(-5, 0, -3)) {
    this.scene = scene;
    this.position = position;
    this.mesh = null;
    this.createTent();
  }

  createTent() {
    // Create tent container
    this.container = new THREE.Group();
    this.container.position.copy(this.position);
    this.container.rotation.y = Math.PI / 6; // Slight rotation

    // Tent materials
    const tentMaterial = new THREE.MeshStandardMaterial({
      color: 0x3A5729, // Forest green
      roughness: 0.8,
      side: THREE.DoubleSide
    });

    // Floor material
    const floorMaterial = new THREE.MeshStandardMaterial({
      color: 0x2B2B2B, // Dark gray
      roughness: 0.9,
      side: THREE.DoubleSide
    });

    // Tent dimensions
    const tentWidth = 3.5;
    const tentLength = 4;
    const tentHeight = 2.2;
    
    // Create tent floor
    const floorGeometry = new THREE.PlaneGeometry(tentWidth, tentLength);
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0.01; // Slightly above ground
    floor.receiveShadow = true;
    this.container.add(floor);
    
    // Create a simple triangular tent using a single extruded shape
    const tentShape = new THREE.Shape();
    tentShape.moveTo(-tentWidth/2, 0);
    tentShape.lineTo(0, tentHeight);
    tentShape.lineTo(tentWidth/2, 0);
    tentShape.lineTo(-tentWidth/2, 0);
    
    const extrudeSettings = {
      steps: 1,
      depth: tentLength,
      bevelEnabled: false
    };
    
    const tentGeometry = new THREE.ExtrudeGeometry(tentShape, extrudeSettings);
    const tent = new THREE.Mesh(tentGeometry, tentMaterial);
    tent.position.z = -tentLength/2;
    tent.castShadow = true;
    tent.receiveShadow = true;
    this.container.add(tent);
    
    this.scene.add(this.container);
    this.mesh = this.container;
  }

  getPosition() {
    return this.container.position.clone();
  }
} 