import * as THREE from 'three';

export class Chair {
  constructor(scene) {
    this.scene = scene;
    this.mesh = null;
    this.createChair();
  }

  createChair() {
    // Create chair container
    this.container = new THREE.Group();
    this.container.position.set(2, 0, 4); // Position near the fire pit
    this.container.rotation.y = -Math.PI / 4; // Angle it toward the fire

    // Wood material for the chair
    const woodMaterial = new THREE.MeshStandardMaterial({
      color: 0x8B4513,
      roughness: 0.9,
    });

    // Fabric material for cushions or details
    const fabricMaterial = new THREE.MeshStandardMaterial({
      color: 0x556B2F, // Dark olive green
      roughness: 1,
    });

    // Chair seat
    const seatGeometry = new THREE.BoxGeometry(0.8, 0.05, 0.8);
    const seat = new THREE.Mesh(seatGeometry, woodMaterial);
    seat.position.y = 0.5; // Chair height
    seat.castShadow = true;
    seat.receiveShadow = true;
    this.container.add(seat);

    // Chair back
    const backGeometry = new THREE.BoxGeometry(0.8, 0.8, 0.05);
    const back = new THREE.Mesh(backGeometry, woodMaterial);
    back.position.set(0, 0.9, -0.4);
    back.castShadow = true;
    back.receiveShadow = true;
    this.container.add(back);

    // Chair legs
    const legGeometry = new THREE.BoxGeometry(0.05, 0.5, 0.05);
    
    // Create four legs
    const legPositions = [
      { x: 0.35, z: 0.35 },
      { x: 0.35, z: -0.35 },
      { x: -0.35, z: 0.35 },
      { x: -0.35, z: -0.35 }
    ];
    
    legPositions.forEach(pos => {
      const leg = new THREE.Mesh(legGeometry, woodMaterial);
      leg.position.set(pos.x, 0.25, pos.z);
      leg.castShadow = true;
      leg.receiveShadow = true;
      this.container.add(leg);
    });

    // Add a simple cushion on the seat
    const cushionGeometry = new THREE.BoxGeometry(0.7, 0.05, 0.7);
    const cushion = new THREE.Mesh(cushionGeometry, fabricMaterial);
    cushion.position.set(0, 0.53, 0);
    cushion.castShadow = true;
    this.container.add(cushion);

    this.scene.add(this.container);
    this.mesh = this.container;
  }

  getPosition() {
    return this.container.position.clone();
  }
} 