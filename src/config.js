const debug = require('debug')('kayak');

require('dotenv').config();

const config = {
    FROM_AIRPORT: process.env.FROM_AIRPORT,
    TO_AIRPORT: process.env.TO_AIRPORT,
    FILTER_AIRPORT: process.env.FILTER_AIRPORT,
    DEPART_DATE: process.env.DEPART_DATE,
    RETURN_DATE: process.env.RETURN_DATE,
    ITERATE_DEPARTURE_WEEK: process.env.ITERATE_DEPARTURE_WEEK,
    ITERATE_RETURN_WEEK: process.env.ITERATE_RETURN_WEEK,
    CURRENCY: process.env.CURRENCY ? process.env.CURRENCY.toUpperCase() : 'USD',
    SHOW_BROWSER: process.env.SHOW_BROWSER || false,
    CONCURRENCY: process.env.CONCURRENCY || 1,
};

debug('CONFIG', config);

module.exports = config;
