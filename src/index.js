#! /usr/bin/env node

require(`babel-polyfill`);
require(`date-utils`);

import co from 'co';
import Kayak from './kayak';

const QUANTITY_MONTH_DEPART = 4;
const QUANTITY_MONTH_RETURN = 40;
const allPrices = [];

main();

function main() {
  search({
    fromAirport: `CHI`,
    toAirport: `JPA`,
    departDate: `2016-05-04`,
    returnDate: `2016-05-11`
  })
  .then(() => {
    const result = getBestPrice();
    console.log([
      `BEST PRICE: ${result.lowerPriceDepartDate} -> ${result.lowerPriceReturnDate}:`,
      `  $${result.lowerPriceValue}`
    ].join(``));
  })
  .catch(error => {
    console.error(error.stack ? error.stack : error);
  });
}

function search({ fromAirport, toAirport, departDate, returnDate }) {
  const kayak = new Kayak(fromAirport, toAirport);

  return co(function* () {
    for (let i = 0; i < QUANTITY_MONTH_DEPART; i++) {
      const tempDepartDate = getNextDate(departDate, i);

      for (let k = 0; k < QUANTITY_MONTH_RETURN - i; k++) {
        const tempReturnDate = getNextDate(returnDate, k + i);

        const prices = yield kayak.search(tempDepartDate, tempReturnDate);

        allPrices.push({
          prices,
          departDate,
          returnDate
        });

        const temp = Math.min.apply(Math, prices);
        console.log(`${tempDepartDate}->${tempReturnDate}: $${temp}`);
      }
    }

    yield kayak.end();
  });
}

function getBestPrice() {
  let lowerPriceValue = Number.MAX_VALUE;
  let lowerPriceDepartDate = ``;
  let lowerPriceReturnDate = ``;

  for (let i = 0; i < allPrices.length; i++) {
    const temp = Math.min.apply(Math, allPrices[i].prices);

    // console.log(`returnDate: ${allPrices[i].returnDate}`);
    // console.log(`prices.length: ${allPrices[i].prices.length}`);
    // console.log(`prices.min: ${temp}`);

    if (temp <= lowerPriceValue) {
      lowerPriceValue = temp;
      lowerPriceDepartDate = allPrices[i].departDate;
      lowerPriceReturnDate = allPrices[i].returnDate;
    }
  }

  return { lowerPriceDepartDate, lowerPriceReturnDate, lowerPriceValue };
}

function getNextDate(str, times = 1) {
  return new Date(str).add({ days: (7 * times) + 1 }).toFormat(`YYYY-MM-DD`);
}
