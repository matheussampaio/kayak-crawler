# Kayak Crawler
Search flight tickets at [Kayak](https://www.kayak.com).


## Requirements
- Node v8.2.1 or compatible.


## How to install:
`cd` to the project folder and execute `npm install`.


## How to execute:
Create a file `.env` with something like this:
```
// IATA 3-Letter Codes
// http://www.nationsonline.org/oneworld/IATA_Codes/IATA_Code_A.htm
FROM_AIRPORT=JPA
TO_AIRPORT=GDL

// if you want, you can remove some airports
FILTER_AIRPORT=MIA,DFW

// YYYY-MM-DD
DEPART_DATE=2017-08-30
RETURN_DATE=2017-09-30

// 1 ~ 20
ITERATE_DEPARTURE_WEEK=2
ITERATE_RETURN_WEEK=2

// One of those or nothing for USD
// AUD, BGN, BRL, CAD, CHF, CNY, CZK, DKK,
// GBP, HKD, HRK, HUF, IDR, ILS, INR, JPY,
// KRW, MXN, MYR, NOK, NZD, PHP, PLN, RON,
// RUB, SEK, SGD, THB, TRY, ZAR, EUR
CURRENCY=BRL

// Set to true if you want to see some action
SHOW_BROWSER=false

// Control how fast we can crawl
CONCURRENCY=2
```

You can also override/set parameters with env variables:
```shell
$ FROM_AIRPORT=JPA TO_AIRPORT=GDL FILTER_AIRPORT=MIA,DFW DEPART_DATE=2017-08-30 RETURN_DATE=2017-09-30 ITERATE_DEPARTURE_WEEK=2 ITERATE_RETURN_WEEK=2 CURRENCY=BRL npm start
```


## License
MIT.
