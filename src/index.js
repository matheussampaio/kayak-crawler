#! /usr/bin/env node

require('date-utils');

const _ = require('lodash');
const fetch = require('node-fetch');

const Kayak = require('./kayak');
const CONFIG = require('./config');

const allPrices = [];

main().catch((error) => {
    console.error(error);
});

async function main() {
    const kayak = new Kayak();

    CONFIG.RATE = await getCurrencyRate();

    if (CONFIG.CURRENCY !== 'USD') {
        console.log(`Rate ${CONFIG.CURRENCY} to USD: ${CONFIG.RATE}`);
    }

    console.log(`Searching flights from ${CONFIG.FROM_AIRPORT} to ${CONFIG.TO_AIRPORT}`);

    try {
        await search({ kayak });
    } catch (error) {
        console.error(error.stack ? error.stack : error);
    } finally {
        await kayak.end();
    }

    const bestTicket = getLowerstPrice();

    const url = Kayak.getUrl({
        departDate: bestTicket.departDate,
        returnDate: bestTicket.returnDate
    });

    const output = `

BEST PRICE: ${bestTicket.departDate} -> ${bestTicket.returnDate} [ ${url} ]:
    ${CONFIG.CURRENCY} $ ${bestTicket.price.toFixed(2)}
`;

    console.log(output);
}

async function getCurrencyRate() {
    if (CONFIG.CURRENCY === 'USD') {
        return 1;
    }

    try {
        const response = await fetch('http://api.fixer.io/latest?base=USD');
        const exchangesRates = await response.json();

        if (exchangesRates != null
            || exchangesRates.rates != null
            || exchangesRates.rates[CONFIG.CURRENCY] != null) {
            return exchangesRates.rates[CONFIG.CURRENCY];
        }

    } catch (error) {
        return 1;
    }

    return 1;
}

async function search({ kayak }) {
    const dates = [];

    for (let i = 0; i < CONFIG.ITERATE_DEPARTURE_WEEK; i++) {
        const departDate = getNextDate(CONFIG.DEPART_DATE, i);

        for (let k = 0; k < CONFIG.ITERATE_RETURN_WEEK - i; k++) {
            const returnDate = getNextDate(CONFIG.RETURN_DATE, k + i);

            dates.push({ departDate, returnDate });
        }
    }

    while (dates.length) {
        const splice = dates.splice(0, CONFIG.CONCURRENCY);

        const promises = splice.map(item => kayak.search(item.departDate, item.returnDate));

        const tickets = await Promise.all(promises);

        allPrices.push(...tickets);
    }

                //
            // const prices = await kayak.search(tempDepartDate, tempReturnDate);
            //
            // allPrices.push({
            //     prices,
            //     departDate: tempDepartDate,
            //     returnDate: tempReturnDate
            // });
            //
            // const temp = Math.min.apply(Math, prices) * CONFIG.RATE;
            //
            // console.log(`${tempDepartDate} -> ${tempReturnDate}: ${CONFIG.CURRENCY} $${temp.toFixed(2)}`);
}

function getLowerstPrice() {
    let best = {
        price: Number.MAX_VALUE,
        departDate: '',
        returnDate: ''
    };

    for (let i = 0; i < allPrices.length; i++) {
        const price = Math.min.apply(Math, allPrices[i].prices);

        if (price <= best.price) {
            best = {
                price,
                departDate: allPrices[i].departDate,
                returnDate: allPrices[i].returnDate
            };
        }
    }

    return best;
}

function getNextDate(str, times = 1) {
    return new Date(str).add({ days: (7 * times) + 1 }).toFormat('YYYY-MM-DD');
}
