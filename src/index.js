#! /usr/bin/env node

require('date-utils');
require('dotenv').config();

const fetch = require('node-fetch');

const Kayak = require('./kayak');

const allPrices = [];

main();

async function main() {
    const fromAirport = process.env.FROM_AIRPORT;
    const toAirport = process.env.TO_AIRPORT;
    const departDate = process.env.DEPART_DATE;
    const returnDate = process.env.RETURN_DATE;

    const kayak = new Kayak(fromAirport, toAirport);

    console.log(`Searching flights from ${fromAirport} to ${toAirport}`);

    try {
        await search({ kayak, departDate, returnDate });

        const response = await fetch('http://api.fixer.io/latest?base=USD');
        const exchangesRates = await response.json();

        const result = getBestPrice();

        const url = Kayak.getUrl({
            toAirport,
            fromAirport,
            departDate: result.lowerPriceDepartDate,
            returnDate: result.lowerPriceReturnDate
        });

        const text = [
            `\n\nBEST PRICE: ${result.lowerPriceDepartDate} -> ${result.lowerPriceReturnDate} [ ${url} ]:`,
            `    USD $ ${result.lowerPriceValue.toFixed(2)}`,
        ]

        if (process.env.CURRENCY && exchangesRates.rates[process.env.CURRENCY]) {
            const value = result.lowerPriceValue * exchangesRates.rates[process.env.CURRENCY];
            text.push(`    ${process.env.CURRENCY} $ ${value.toFixed(2)}`);
        }

        console.log(text.join('\n'));
    } catch (error) {
        console.error(error.stack ? error.stack : error);
    }

    return await kayak.end();
}

async function search({ kayak, departDate, returnDate }) {
    for (let i = 0; i < process.env.QUANTITY_MONTH_DEPART; i++) {
        const tempDepartDate = getNextDate(departDate, i);

        for (let k = 0; k < process.env.QUANTITY_MONTH_RETURN - i; k++) {
            const tempReturnDate = getNextDate(returnDate, k + i);

            const prices = await kayak.search(tempDepartDate, tempReturnDate);

            allPrices.push({
                prices,
                departDate,
                returnDate
            });

            const temp = Math.min.apply(Math, prices);

            console.log(`${tempDepartDate} -> ${tempReturnDate}: USD$${temp.toFixed(2)}`);
        }
    }
}

function getBestPrice() {
    let lowerPriceValue = Number.MAX_VALUE;
    let lowerPriceDepartDate = '';
    let lowerPriceReturnDate = '';

    for (let i = 0; i < allPrices.length; i++) {
        const temp = Math.min.apply(Math, allPrices[i].prices);

        if (temp <= lowerPriceValue) {
            lowerPriceValue = temp;
            lowerPriceDepartDate = allPrices[i].departDate;
            lowerPriceReturnDate = allPrices[i].returnDate;
        }
    }

    return { lowerPriceDepartDate, lowerPriceReturnDate, lowerPriceValue };
}

function getNextDate(str, times = 1) {
    return new Date(str)
        .add({
            days: (7 * times) + 1
        })
        .toFormat('YYYY-MM-DD');
}
