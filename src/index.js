#! /usr/bin/env node

require(`babel-polyfill`);

import co from 'co';
import Nightmare from 'nightmare';

main();

function main() {
  // always check for updates
  search({
    fromAirport: `CHI`,
    toAirport: `JPA`,
    departDate: `2016-05-04`,
    returnDate: `2016-05-18`
  });
}

function getSearchURL({ fromAirport, toAirport, departDate, returnDate }) {
  return `https://www.kayak.com/flights/${fromAirport},nearby-${toAirport},nearby/${departDate}-flexible/${returnDate}-flexible`;
}

function search({ fromAirport, toAirport, departDate, returnDate }) {
  const browser = new Nightmare({
    show: process.env.DEBUG,
    dock: true
  });

  const searchURL = getSearchURL({ fromAirport, toAirport, departDate, returnDate });

  return co.wrap(function* submitGenerator() {
    // Load Page
    yield browser.goto(searchURL);

    // // Check if must close Dialog
    // const popupVisible = yield browser.visible(`r9-dialog-closeButton r9-icon-x  tighter`);
    //
    // if (popupVisible) {
    //   console.log(`closing popup`);
    //   yield browser.click(`r9-dialog-closeButton r9-icon-x  tighter`);
    // } else {
    //   console.log(`popup didn't show.`);
    // }

    // Wait the search finish
    let progressDiv = yield browser.visible(`#progressDiv`);

    while (progressDiv) {
      yield browser.wait(1000);
      progressDiv = yield browser.visible(`#progressDiv`);
    }
    console.log(`Progress Finished`);

    // Get Prices
    yield browser.inject(`js`, `./dist/jquery.min.js`);

    const prices = yield browser.evaluate(() => {
      return $(`#flexmatrixcontent .data > a`)
        .text()
        .trim()
        .split(` `)
        .map(elem => {
          return parseInt(elem.replace(`\n`, ``).replace(`$`, ``), 10);
        });
    });

    console.log(prices);

    yield browser.wait(5000);

    // return yield browser.end();
  })()
  .catch(error => {
    console.error(error.stack ? error.stack : error);
  });
}
