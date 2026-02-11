# Interactive 3D Globe Visualization with meteor impact stats 

An interactive 3D globe visualization showing major cities around the world with population data, built using Three.js. Double click to see the impact of a meteor strike. 

[Demo running as a GitHub Page](https://colinhickey.github.io/goodbye-world/)

## Features

- **Interactive 3D Earth Globe**: Navigable Earth with texturing
- **City Population Data**: Displays major cities around the world with population information
- **Population Tooltips**: (Desktop) Hover over city markers to see city name, country, and population
- **Region Selection**: Double-click anywhere on the globe to select a circular region (nominal meteor impact zone!) 
- **Population Analysis**: View the total population within the selected region
- **Adjustable Selection Size**: Choose between Small (100km), Medium (500km), and Large (1000km) selection radii
- **Atmospheric Effects**: Realistic atmospheric glow around the Earth's edges
- **Responsive Design**: Adapts to different screen sizes
- **Dynamic Starfield Background**: Stars that move as you navigate for an immersive experience

## Technologies Used

- **Three.js**: For 3D rendering and scene management
- **JavaScript ES6+**: Core programming language
- **OrbitControls**: For camera navigation
- **WebGL**: Hardware-accelerated graphics rendering
- **CSS3**: Styling for UI elements
- **JSON/CSV**: Data handling for city information

## Getting Started

### Prerequisites

- A modern web browser with WebGL support (Chrome, Firefox, Safari, Edge)
- Basic web server to serve the files (due to CORS restrictions when loading textures)

### Installation

1. Clone this repository:

git clone https://github.com/colinhickey/goodbye-world.git cd goodbye-world


2. Start a local development server:

npm run dev


3. Open your browser and navigate to `http://localhost:5000` (or whatever port your server is using)

4. Publish to github pages:
-create dist folder:
npm run build
-publish build to github pages:
npm run deploy

## Usage

- **Navigate**: Click and drag to rotate the globe, scroll to zoom
- **View City Info**: Hover over any city marker to see details
- **Select Region**: Double-click anywhere on the globe to select a region
- **Change Selection Size**: Click the Small/Medium/Large buttons at the top to change selection radius
- **Reset View**: Refresh the page to reset the visualization

## Data Source

The city data is loaded from a JSON file generated from the WorldCities dataset, containing information about cities around the world including:
- City name
- Country
- Geographical coordinates (latitude and longitude)
- Population figures

## Project Structure

globe-visualization/ 
├── index.html # Main HTML file 
├── main.js # Core application code 
├── public/ # Assets directory 
│ 
├── earth.jpg # Earth texture map 
│ 
└── cities.json # City data 
└── README.md # Project documentation