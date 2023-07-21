const fs = require('fs');
const csv = require('csv-parser');

const inputFile = 'data/restaurants.csv'; // Replace with the path to your CSV file
const outputFile = 'data/restaurants.js'; // Replace with the desired path for the JavaScript export file

const rows = [];

fs.createReadStream(inputFile)
  .pipe(csv())
  .on('data', (row) => {
    const formattedRow = [
      row.Name,
      row.Address,
      row.Location,
      row.Price,
      row.Cuisine,
      parseFloat(row.Longitude),
      parseFloat(row.Latitude),
      row.PhoneNumber,
      row.Url,
      row.WebsiteUrl,
      row.Award,
      row.FacilitiesAndServices
    ];
    rows.push(formattedRow);
  })
  .on('end', () => {
    const output = `export default ${JSON.stringify(rows, null, 2)};`;

    fs.writeFile(outputFile, output, (err) => {
      if (err) throw err;
      console.log(`Data has been converted and saved to ${outputFile}`);
    });
  });
