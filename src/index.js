#! /usr/bin/env node

require('date-utils');
require('dotenv').config();

const fetch = require('node-fetch');

const Kayak = require('./kayak');

const allPrices = [];

main();

async function main() {
    const params = {
        fromAirport: process.env.FROM_AIRPORT,
        toAirport: process.env.TO_AIRPORT,
        departDate: process.env.DEPART_DATE,
        returnDate: process.env.RETURN_DATE
    };

    console.log(`Searching flights from ${params.fromAirport} to ${params.toAirport}`);

    try {
        await search(params);

        const response = await fetch('http://api.fixer.io/latest?base=USD');
        const exchangesRates = await response.json();

        const result = getBestPrice();

        const url = Kayak.getUrl({
            departDate: result.lowerPriceDepartDate,
            returnDate: result.lowerPriceReturnDate,
            fromAirport: params.fromAirport,
            toAirport: params.toAirport
        });

        const text = [
            `BEST PRICE: ${result.lowerPriceDepartDate} -> ${result.lowerPriceReturnDate} [ ${url} ]:`,
            `    USD$${result.lowerPriceValue.toFixed(2)}`,
        ]

        if (process.env.CURRENCY && exchangesRates.rates[process.env.CURRENCY]) {
            const value = result.lowerPriceValue * exchangesRates.rates[process.env.CURRENCY];
            text.push(`    ${process.env.CURRENCY}$${value.toFixed(2)}`);
        }

        console.log(text.join('\n'));
    } catch (error) {
        console.error(error.stack ? error.stack : error);
    }
}

async function search({ fromAirport, toAirport, departDate, returnDate }) {
    const kayak = new Kayak(fromAirport, toAirport);

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

            console.log(`${tempDepartDate}->${tempReturnDate}: USD$${temp.toFixed(2)}`);
        }
    }

    return await kayak.end();
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
