import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Starfield } from './modules/starfield.js';
import { GlobeGlow } from './modules/globeglow.js';

// Create button group container
const buttonContainer = document.createElement('div');
buttonContainer.style.position = 'absolute';
buttonContainer.style.top = '20px';
buttonContainer.style.left = '50%';
buttonContainer.style.transform = 'translateX(-50%)';
buttonContainer.style.zIndex = '1000';
buttonContainer.style.display = 'flex';
buttonContainer.style.borderRadius = '4px';
buttonContainer.style.overflow = 'hidden';
buttonContainer.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
document.body.appendChild(buttonContainer);

// Create size selection buttons
const sizes = ['Small', 'Medium', 'Large'];
let selectedSize = 'Medium'; // Default selection

sizes.forEach(size => {
  const button = document.createElement('button');
  button.textContent = size;
  button.id = `size-${size.toLowerCase()}`;
  button.style.padding = '8px 16px';
  button.style.border = 'none';
  button.style.background = size === selectedSize ? '#4285f4' : '#f1f1f1';
  button.style.color = size === selectedSize ? 'white' : '#333';
  button.style.cursor = 'pointer';
  button.style.fontFamily = 'Arial, sans-serif';
  button.style.transition = 'all 0.3s ease';
  
  button.addEventListener('click', () => {
    // Skip if already active
    if (size === selectedSize) return;
    
    // Update button styles
    sizes.forEach(s => {
      const btn = document.getElementById(`size-${s.toLowerCase()}`);
      btn.style.background = s === size ? '#4285f4' : '#f1f1f1';
      btn.style.color = s === size ? 'white' : '#333';
    });
    
    // Store the new selection
    selectedSize = size;
    console.log(`Selected size: ${selectedSize}`);
    
    // The actual functionality will be added in the next step
  });
  
  buttonContainer.appendChild(button);
});

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.setAnimationLoop( animate );
document.body.appendChild( renderer.domElement );

// Add orbit controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; // Add smooth damping effect
controls.dampingFactor = 0.05;
controls.minDistance = 3.5; // Prevent zooming too close
controls.maxDistance = 10; // Prevent zooming too far out

// Create tooltip element
const tooltip = document.createElement('div');
tooltip.style.position = 'absolute';
tooltip.style.padding = '10px';
tooltip.style.background = 'rgba(0,0,0,0.7)';
tooltip.style.color = 'white';
tooltip.style.borderRadius = '5px';
tooltip.style.fontSize = '14px';
tooltip.style.pointerEvents = 'none'; // Prevent tooltip from blocking mouse events
tooltip.style.display = 'none';
document.body.appendChild(tooltip);

// Setup raycaster for tooltip interaction
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Store mouse position for tooltip placement
let mouseX = 0;
let mouseY = 0;

// Create and add starfield using the new module
const starfield = new Starfield(1000, 50);
starfield.addToScene(scene);

// Load Earth texture
const textureLoader = new THREE.TextureLoader();
const earthTexture = textureLoader.load('/assets/earth.jpg');

// Create globe geometry and material
const globeGeometry = new THREE.SphereGeometry(2.5, 64, 64); // radius, widthSegments, heightSegments
const globeMaterial = new THREE.MeshBasicMaterial({ 
  map: earthTexture 
});
const globe = new THREE.Mesh(globeGeometry, globeMaterial);
scene.add(globe);

// Create and add glow effect using the new module
const globeGlow = new GlobeGlow(2.5); // Pass the same radius as the globe
globeGlow.addToScene(scene);

globeGlow.useRimGlow(scene); // Use rim glow instead

// Store all markers for raycasting
const markers = [];

// Load city data from JSON file
fetch('/assets/cities.json')
  .then(response => response.json())
  .then(cities => {
    // Add markers for each city
    cities.forEach(city => addCityMarker(city));
  })
  .catch(error => console.error('Error loading city data:', error));

// Function to convert lat/long to 3D position
function latLongToVector3(lat, long, radius) {
  // Fixed formula with 90 instead of 83
  const phi = (90 - parseFloat(lat)) * (Math.PI / 180);
  const theta = (parseFloat(long) + 180) * (Math.PI / 180);
  
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = (radius * Math.sin(phi) * Math.sin(theta));
  const y = (radius * Math.cos(phi));
  
  return new THREE.Vector3(x, y, z);
}

// Function to add a city marker
function addCityMarker(city) {
  // Create a small sphere for the marker
  const markerGeometry = new THREE.SphereGeometry(0.03, 16, 16);
  const markerMaterial = new THREE.MeshBasicMaterial({ color: 0xff3388 });
  const marker = new THREE.Mesh(markerGeometry, markerMaterial);
  
  // Position the marker based on lat/long
  const position = latLongToVector3(city.lat, city.lng, 2.51); // Using lat/lng from CSV
  marker.position.copy(position);
  
  // Store city data with the marker for the tooltip
  marker.userData = {
    city: city.city,
    country: city.country,
    population: parseInt(city.population),
    latitude: city.lat,
    longitude: city.lng
  };
  
  // Add marker to the markers array for raycasting
  markers.push(marker);
  
  globe.add(marker); // Add marker as a child of the globe so it rotates with it
}

// Track mouse position for raycasting
window.addEventListener('mousemove', (event) => {
  // Calculate mouse position in normalized device coordinates (-1 to +1)
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  
  // Store actual mouse coordinates for tooltip positioning
  mouseX = event.clientX;
  mouseY = event.clientY;
});

camera.position.z = 5;

// Store reference to any currently displayed region circle
let regionCircle = null;
let populationSummary = null;

// Define radius values for each size in kilometers
const radiusValues = {
  'Small': 100,
  'Medium': 500,
  'Large': 1000
};

// Add double-click event listener
renderer.domElement.addEventListener('dblclick', (event) => {
  // Calculate mouse position in normalized device coordinates
  const mouseX = (event.clientX / window.innerWidth) * 2 - 1;
  const mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
  
  // Create raycaster for detecting globe intersection
  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), camera);
  
  // Check for intersection with the globe
  const intersects = raycaster.intersectObject(globe);
  
  if (intersects.length > 0) {
    // Get intersection point on the globe
    const intersectionPoint = intersects[0].point;
    
    // Remove existing circle if present
    if (regionCircle) {
      globe.remove(regionCircle);
      regionCircle = null;
    }
    
    // Remove existing population summary if present
    if (populationSummary) {
      document.body.removeChild(populationSummary);
      populationSummary = null;
    }
    
    // Get radius based on selected size
    const radiusKm = radiusValues[selectedSize];
    
    // Convert km to globe units (globe radius is 2.5 units)
    // Earth's real radius is ~6371 km, so scale accordingly
    const globeRadiusRatio = 2.5 / 6371;
    const circleRadius = radiusKm * globeRadiusRatio;
    
    // Create a circle to visualize the selected area using a RingGeometry instead
    const circleGeometry = new THREE.RingGeometry(circleRadius * 0.9, circleRadius, 64);
    const circleMaterial = new THREE.MeshBasicMaterial({ 
      color: 0xff2200,
      opacity: 0.8,
      transparent: true,
      side: THREE.DoubleSide,
      depthTest: false,  // This is important - ignore depth testing
      depthWrite: false  // Don't write to depth buffer
    });
    
    regionCircle = new THREE.Mesh(circleGeometry, circleMaterial);
    
    // Position the circle at the intersection point
    regionCircle.position.copy(intersectionPoint);
    
    // Orient the circle to face outward from the globe center
    regionCircle.lookAt(new THREE.Vector3(0, 0, 0));
    
    // Move it further out from the globe surface to clear the glow
    const direction = intersectionPoint.clone().normalize();
    regionCircle.position.copy(intersectionPoint.clone().add(direction.multiplyScalar(0.05)));
    
    globe.add(regionCircle);
    
    // Calculate which cities are within this radius
    const citiesInRadius = findCitiesInRadius(intersectionPoint, circleRadius);
    
    // Sum population
    const totalPopulation = citiesInRadius.reduce((sum, city) => {
      return sum + (city.userData.population || 0);
    }, 0);
    
    // Create a population summary element
    populationSummary = document.createElement('div');
    populationSummary.style.position = 'absolute';
    populationSummary.style.bottom = '20px';
    populationSummary.style.left = '50%';
    populationSummary.style.transform = 'translateX(-50%)';
    populationSummary.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    populationSummary.style.color = 'white';
    populationSummary.style.padding = '15px';
    populationSummary.style.borderRadius = '5px';
    populationSummary.style.fontFamily = 'Arial, sans-serif';
    populationSummary.style.zIndex = '1000';
    
    populationSummary.innerHTML = `
      <h3 style="margin: 0 0 10px 0;">${selectedSize} Impact Area</h3>
      <p style="margin: 0 0 5px 0;">Radius: ${radiusKm} km</p>
      <p style="margin: 0 0 5px 0;">Cities: ${citiesInRadius.length}</p>
      <p style="margin: 0;">Total Population: ${totalPopulation.toLocaleString()}</p>
    `;
    
    document.body.appendChild(populationSummary);
  }
});

// Function to find cities within a radius
function findCitiesInRadius(center, radius) {
  return markers.filter(marker => {
    return marker.position.distanceTo(center) <= radius;
  });
}

function animate() {
  // Update controls
  controls.update();
  
  // Update starfield rotation - now using the starfield class method
  starfield.update(controls);
  
  // Check for marker intersections
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(markers);
  
  if (intersects.length > 0) {
    const intersection = intersects[0];
    const marker = intersection.object;
    const city = marker.userData;
    
    // Update tooltip content
    tooltip.innerHTML = `
      <strong>${city.city}</strong><br>
      ${city.country}<br>
      Population: ${city.population.toLocaleString()}
    `;
    
    // Position tooltip near mouse using stored coordinates
    tooltip.style.left = (mouseX + 15) + 'px';
    tooltip.style.top = (mouseY + 15) + 'px';
    tooltip.style.display = 'block';
  } else {
    // Hide tooltip when not hovering over a marker
    tooltip.style.display = 'none';
  }
  
  // Optional auto-rotation (can be commented out)
  // globe.rotation.y += 0.001;
  
  renderer.render(scene, camera);
}

// Handle window resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

window.addEventListener('resize', () => {
  if (populationSummary) {
    populationSummary.style.bottom = '20px';
    populationSummary.style.left = '50%';
  }
});