import * as THREE from 'three';

export class Starfield {
  constructor(starCount = 1000, radius = 50) {
    this.starCount = starCount;
    this.radius = radius;
    this.mesh = this.createStarfield();
  }

  createStarfield() {
    // Create star particles
    const starsGeometry = new THREE.BufferGeometry();
    
    // Create positions array for stars
    const positions = new Float32Array(this.starCount * 3);
    const colors = new Float32Array(this.starCount * 3);
    const sizes = new Float32Array(this.starCount);
    
    // Create stars in a spherical pattern surrounding the scene
    for (let i = 0; i < this.starCount; i++) {
      // Random spherical coordinates
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      
      // Convert to cartesian coordinates
      const x = this.radius * Math.sin(phi) * Math.cos(theta);
      const y = this.radius * Math.sin(phi) * Math.sin(theta);
      const z = this.radius * Math.cos(phi);
      
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
      
      // Random star brightness/color (white to blue-ish)
      const brightness = 0.5 + Math.random() * 0.5;
      colors[i * 3] = brightness;
      colors[i * 3 + 1] = brightness;
      colors[i * 3 + 2] = brightness + Math.random() * 0.3; // Slightly more blue
      
      // Random star size
      sizes[i] = 0.5 + Math.random() * 3.0;
    }
    
    starsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    starsGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    starsGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    
    // Create material for the stars
    const starsMaterial = new THREE.PointsMaterial({
      size: 0.15,
      transparent: true,
      opacity: 1,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true
    });
    
    // Create the final starfield points
    return new THREE.Points(starsGeometry, starsMaterial);
  }

  // Method to update starfield rotation based on controls
  update(controls) {
    if (controls) {
      this.mesh.rotation.y = -controls.getAzimuthalAngle() * 0.3;
      this.mesh.rotation.x = -controls.getPolarAngle() * 0.2;
    }
  }

  // Helper method to add to scene
  addToScene(scene) {
    scene.add(this.mesh);
  }
}