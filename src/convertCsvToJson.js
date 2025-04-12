const fs = require('fs');

// Read the CSV file
const csvData = fs.readFileSync('./worldcities.csv', 'utf8');

// Parse CSV
function parseCSV(csvText) {
  const lines = csvText.split('\n');
  const headers = lines[0].split(',').map(header => 
    header.replace(/["]/g, '')  // Remove quotes from headers
  );
  
  return lines.slice(1).filter(line => line.trim() !== '').map(line => {
    // Split by comma, but respect quoted values
    const values = line.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g) || [];
    
    // Remove quotes and create object with headers as keys
    const city = {};
    headers.forEach((header, index) => {
      const value = values[index] ? values[index].replace(/["]/g, '') : '';
      city[header] = value;
    });
    
    return city;
  });
}

// Convert to JSON
const cities = parseCSV(csvData);

// Sort by population (descending) and take top 500
const topCities = cities
  .filter(city => city.population) // Ensure population exists
  .map(city => ({
    ...city,
    population: parseInt(city.population) || 0 // Convert to number
  }))
  .sort((a, b) => b.population - a.population)
  .slice(0, 500);

// Write JSON file
fs.writeFileSync('./cities.json', JSON.stringify(topCities, null, 2));

console.log(`Converted ${topCities.length} cities to JSON`);