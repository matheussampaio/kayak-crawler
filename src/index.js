#! /usr/bin/env node

require(`babel-polyfill`);
require(`date-utils`);

import co from 'co';
import Nightmare from 'nightmare';

main();

function main() {
  // always check for updates
  search({
    fromAirport: `CHI`,
    toAirport: `SAO`,
    departDate: `2016-05-04`,
    returnDate: `2016-05-04`
  });
}

function search({ fromAirport, toAirport, departDate, returnDate }) {
  const browser = new Nightmare({
    show: process.env.DEBUG
  });

  let lowerPriceValue = Number.MAX_VALUE;
  let lowerPriceDate = ``;

  return co.wrap(function* submitGenerator() {
    console.log(`Starting search...`);

    for (let i = 0; i < 40; i++) {
      returnDate = getNextDate(returnDate);
      const searchURL = getSearchURL({ fromAirport, toAirport, departDate, returnDate });

      // Load Page
      yield browser.goto(searchURL);

      // yield closeDialog(browser);

      yield waitSearchFinish(browser);

      // Get Prices
      const prices = yield getPrices(browser);

      const temp = Math.min.apply(Math, prices);

      console.log(`${returnDate}: $${temp}`);

      if (temp <= lowerPriceValue) {
        lowerPriceValue = temp;
        lowerPriceDate = returnDate;
      }
    }

    console.log(`\n\nThe best price is: ${lowerPriceDate} -> $${lowerPriceValue}`);

    return yield browser.end();
  })()
  .catch(error => {
    console.error(error.stack ? error.stack : error);
  });
}

function waitSearchFinish(browser) {
  return co(function* () {
    // Wait the search finish
    let progressDiv = yield browser.visible(`#progressDiv`);

    while (progressDiv) {
      yield browser.wait(1000);
      progressDiv = yield browser.visible(`#progressDiv`);
    }
  });
}

function getPrices(browser) {
  return co(function* () {
    yield browser.inject(`js`, `./node_modules/jquery/dist/jquery.min.js`);

    const prices = yield browser.evaluate(() => {
      return $(`#flexmatrixcontent .data > a`)
        .text()
        .trim()
        .split(` `)
        .map(elem => parseInt(elem.replace(`\n`, ``).replace(`$`, ``), 10));
    });

    return yield prices;
  });
}

//
// function closeDialog(browser) {
//   return co(function* () {
//     // Check if must close Dialog
//     const popupVisible = yield browser.visible(`r9-dialog-closeButton r9-icon-x  tighter`);
//
//     if (popupVisible) {
//       console.log(`closing popup`);
//       yield browser.click(`r9-dialog-closeButton r9-icon-x  tighter`);
//     } else {
//       console.log(`popup didn't show.`);
//     }
//   });
// }

function getSearchURL({ fromAirport, toAirport, departDate, returnDate }) {
  return [
    `https://www.kayak.com/flights/`,
    `${fromAirport},nearby-${toAirport},nearby/`,
    `${departDate}-flexible/`,
    `${returnDate}-flexible`
  ].join(``);
}

function getNextDate(str) {
  return new Date(str).add({ days: 8 }).toFormat(`YYYY-MM-DD`);
}
