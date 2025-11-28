const fs = require("fs");

const city = JSON.parse(fs.readFileSync("./city.json").toString());
const country = JSON.parse(fs.readFileSync("./country.json").toString());
console.log(city);
console.log(country);
const output = country.map((element) => {
  return {
    ...element,
    city: city.find((iterator) => iterator.country === element.name)?.city,
  };
});

fs.writeFileSync("./country-out.json", JSON.stringify(output));
