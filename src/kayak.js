const Nightmare = require('nightmare');

class Kayak {
  constructor(fromAirport, toAirport) {
    this.fromAirport = fromAirport;
    this.toAirport = toAirport;
    this.browser = Nightmare({
        show: process.env.DEBUG,
        dock: process.env.DEBUG,
        waitTimeout: 20000
    });
  }

  end() {
    return this.browser.end();
  }

  static getUrl({ departDate, returnDate, fromAirport, toAirport }) {
      return [
          'https://www.kayak.com/flights/',
          `${fromAirport},nearby-${toAirport},nearby/`,
          `${departDate}-flexible/`,
          `${returnDate}-flexible`
      ].join('');
  }

  search(departDate, returnDate) {
    const searchURL = Kayak.getUrl({
        departDate,
        returnDate,
        fromAirport: this.fromAirport,
        toAirport: this.toAirport
    });

    return this.browser.goto(searchURL)
        .wait('.Common-Results-ProgressBar.Hidden')
        .evaluate(() => {
            const docs = document.getElementsByClassName('lowest');

            const prices = [];

            for (let i = 0; i < docs.length; i++) {
                const element = docs[i];

                const txt = element.textContent
                        .replace('R$', '')
                        .replace('$', '')
                        .trim();

                const price = parseInt(txt, 10);

                if (!price) {
                    return Promise.reject(`Failed to parse Integer: ${txt}`);
                }

                prices.push(price);
            }

            return prices;
        })
  }
}

module.exports = Kayak;
