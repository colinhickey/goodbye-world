import * as THREE from 'three';

export class GlobeGlow {
  constructor(globeRadius = 2.5) {
    this.globeRadius = globeRadius;
    this.glowMesh = this.createGlowEffect();
    this.atmosphereMesh = this.createAtmosphereEffect();
  }

  createGlowEffect() {
    // Create a slightly larger sphere for the glow effect
    const glowGeometry = new THREE.SphereGeometry(this.globeRadius - 0.1, 64, 64);
    
    // Create custom material for the glow effect
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0x0077ff,  // Blue color
      transparent: true,
      opacity: 0.25,
      side: THREE.BackSide, // Render only the inside of the sphere
    });
    
    return new THREE.Mesh(glowGeometry, glowMaterial);
  }

  createAtmosphereEffect() {
    // Add atmospheric scatter effect with second glow layer
    return new THREE.Mesh(
      new THREE.SphereGeometry(this.globeRadius + 0.1, 64, 64),
      new THREE.MeshBasicMaterial({
        color: 0x00ffff,
        transparent: true,
        opacity: 0.1,
        side: THREE.FrontSide
      })
    );
  }

  // Method to create a more realistic atmospheric rim glow effect
  createAtmosphericRimGlow() {
    // Create a slightly larger sphere for the atmosphere effect
    const atmosphereGeometry = new THREE.SphereGeometry(this.globeRadius + 0.05, 64, 64);
    
    // Custom shader material that only shows glow at the edges (rim lighting)
    const atmosphereMaterial = new THREE.ShaderMaterial({
      uniforms: {
        glowColor: { value: new THREE.Color(0x3388ff) },
        rimPower: { value: 4.0 } // Controls how quickly the glow fades
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vViewPosition;
        
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          vViewPosition = -mvPosition.xyz;
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform vec3 glowColor;
        uniform float rimPower;
        
        varying vec3 vNormal;
        varying vec3 vViewPosition;
        
        void main() {
          vec3 normal = normalize(vNormal);
          vec3 viewDir = normalize(vViewPosition);
          float rim = 1.0 - max(dot(viewDir, normal), 0.0);
          rim = pow(rim, rimPower);
          
          gl_FragColor = vec4(glowColor, rim * 0.7);
        }
      `,
      transparent: true,
      side: THREE.FrontSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    
    return new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
  }

  // Method to add both glow effects to scene
  addToScene(scene) {
    scene.add(this.glowMesh);
    scene.add(this.atmosphereMesh);
    return this; // For method chaining
  }

  // Method to remove both glow effects from scene
  removeFromScene(scene) {
    scene.remove(this.glowMesh);
    scene.remove(this.atmosphereMesh);
    return this; // For method chaining
  }

  // Use rim glow instead of the default glow
  useRimGlow(scene) {
    // Remove current effects
    this.removeFromScene(scene);

    // Replace with rim glow
    this.glowMesh = this.createAtmosphericRimGlow();
    
    // Add to scene
    scene.add(this.glowMesh);
    return this;
  }
}