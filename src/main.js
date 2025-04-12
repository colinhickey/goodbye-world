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

// Mobile device detection
const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

// Configure orbit controls based on device
if (isMobile) {
  // Enable touch rotation
  controls.enableZoom = true;
  controls.enablePan = false;
  controls.rotateSpeed = 0.5; // Slower rotation for more control on mobile
  controls.enableDamping = true;
  controls.dampingFactor = 0.1; // More damping for smoother mobile experience
  
  // Make buttons larger for touch targets
  sizes.forEach(size => {
    const btn = document.getElementById(`size-${size.toLowerCase()}`);
    btn.style.padding = '12px 20px';
    btn.style.fontSize = '16px';
  });
  
  // Add a message about double tap for mobile users
  const mobileHint = document.createElement('div');
  mobileHint.style.position = 'absolute';
  mobileHint.style.top = '70px';
  mobileHint.style.left = '50%';
  mobileHint.style.transform = 'translateX(-50%)';
  mobileHint.style.backgroundColor = 'rgba(0,0,0,0.7)';
  mobileHint.style.color = 'white';
  mobileHint.style.padding = '10px';
  mobileHint.style.borderRadius = '5px';
  mobileHint.style.fontFamily = 'Arial, sans-serif';
  mobileHint.style.fontSize = '14px';
  mobileHint.style.zIndex = '1000';
  mobileHint.style.textAlign = 'center';
  mobileHint.textContent = 'Double-tap to select an area';
  document.body.appendChild(mobileHint);
  
  // Auto-hide the hint after 5 seconds
  setTimeout(() => {
    mobileHint.style.opacity = '0';
    mobileHint.style.transition = 'opacity 1s ease';
    
    // Remove from DOM after fade out
    setTimeout(() => {
      document.body.removeChild(mobileHint);
    }, 1000);
  }, 5000);
} else {
  // Desktop settings
  controls.rotateSpeed = 1.0;
}

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
const earthTexture = textureLoader.load(import.meta.env.BASE_URL + '/assets/earth.jpg');

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
fetch(import.meta.env.BASE_URL + '/assets/cities.json')
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
window.removeEventListener('mousemove', mouseMoveHandler); // Remove existing handler if any

// Define the handler function
function mouseMoveHandler(event) {
  // Calculate mouse position in normalized device coordinates (-1 to +1)
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  
  // Store actual mouse coordinates for tooltip positioning
  mouseX = event.clientX;
  mouseY = event.clientY;
}

// Add it back for mouse events
window.addEventListener('mousemove', mouseMoveHandler);

// Add touch move handler for mobile
if (isMobile) {
  renderer.domElement.addEventListener('touchmove', (event) => {
    // Prevent default to avoid scrolling while trying to interact
    event.preventDefault();
    
    const touch = event.touches[0];
    
    // Calculate touch position in normalized device coordinates (-1 to +1)
    mouse.x = (touch.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(touch.clientY / window.innerHeight) * 2 + 1;
    
    // Store actual touch coordinates for tooltip positioning
    mouseX = touch.clientX;
    mouseY = touch.clientY;
  });
}

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

// Variables for double tap detection
let lastTap = 0;
let touchTimeout;

// Track if the user is dragging (to prevent selection when rotating)
let isDragging = false;
controls.addEventListener('start', () => {
  isDragging = true;
});
controls.addEventListener('end', () => {
  setTimeout(() => {
    isDragging = false;
  }, 300); // Small delay to ensure click doesn't trigger immediately after drag
});

// Handle mouse double click (desktop)
renderer.domElement.addEventListener('dblclick', (event) => {
  handleAreaSelection(event.clientX, event.clientY);
});

// Handle touch events for mobile
renderer.domElement.addEventListener('touchstart', (event) => {
  // Prevent default to avoid scrolling
  event.preventDefault();
  
  const now = new Date().getTime();
  const timeDiff = now - lastTap;
  
  // Detect double tap
  if (timeDiff < 300 && timeDiff > 0 && !isDragging) {
    clearTimeout(touchTimeout);
    
    // Use the first touch point
    const touch = event.touches[0];
    handleAreaSelection(touch.clientX, touch.clientY);
  } else {
    // Single tap - wait briefly to see if it's a double tap
    touchTimeout = setTimeout(function() {
      // It was a single tap - do nothing
    }, 300);
  }
  
  lastTap = now;
});

// Shared function for area selection (used by both mouse and touch)
function handleAreaSelection(clientX, clientY) {
  // Calculate mouse position in normalized device coordinates
  const normalizedX = (clientX / window.innerWidth) * 2 - 1;
  const normalizedY = -(clientY / window.innerHeight) * 2 + 1;
  
  // Create raycaster for detecting globe intersection
  const selectionRaycaster = new THREE.Raycaster();
  selectionRaycaster.setFromCamera(new THREE.Vector2(normalizedX, normalizedY), camera);
  
  // Check for intersection with the globe
  const intersects = selectionRaycaster.intersectObject(globe);
  
  // Rest of your existing selection code
  if (intersects.length > 0) {
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
    
    // Convert km to globe units
    const globeRadiusRatio = 2.5 / 6371;
    const circleRadius = radiusKm * globeRadiusRatio;
    
    // Create a circle to visualize the selected area
    const circleGeometry = new THREE.RingGeometry(circleRadius * 0.9, circleRadius, 64);
    const circleMaterial = new THREE.MeshBasicMaterial({ 
      color: 0xff2200,
      opacity: 0.8,
      transparent: true,
      side: THREE.DoubleSide,
      depthTest: false,
      depthWrite: false
    });
    
    regionCircle = new THREE.Mesh(circleGeometry, circleMaterial);
    
    // Position and orient the circle
    regionCircle.position.copy(intersectionPoint);
    regionCircle.lookAt(new THREE.Vector3(0, 0, 0));
    
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
    populationSummary.style.maxWidth = isMobile ? '90%' : '400px';
    populationSummary.style.textAlign = 'center';
    
    populationSummary.innerHTML = `
      <h3 style="margin: 0 0 10px 0;">${selectedSize} Impact Area</h3>
      <p style="margin: 0 0 5px 0;">Radius: ${radiusKm} km</p>
      <p style="margin: 0 0 5px 0;">Cities: ${citiesInRadius.length}</p>
      <p style="margin: 0;">Total Population: ${totalPopulation.toLocaleString()}</p>
    `;
    
    document.body.appendChild(populationSummary);
  }
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