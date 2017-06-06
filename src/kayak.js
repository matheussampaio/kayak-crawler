const Nightmare = require('nightmare');
const debug = require('debug')('kayak');

class Kayak {
  constructor(fromAirport, toAirport) {
    this.fromAirport = fromAirport;
    this.toAirport = toAirport;
    this.browser = Nightmare({
        show: process.env.SHOW_BROWSER,
        dock: process.env.SHOW_BROWSER,
        webPreferences: {
            webSecurity: false,
            allowRunningInsecureContent: true
        }
        // waitTimeout: 1000 * 60
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

    async handleCaptcha() {
        debug('maybe google captcha?');

        await this.browser.inject('js', './node_modules/jquery/dist/jquery.min.js');

        while (true) {
            await this.browser.wait(10000);

            const positions = await this.browser.evaluate(() => {
                const tds = [];
                const buttons = [];

                $('iframe[title="recaptcha challenge"]')
                    .contents()
                    .find('table tbody td')
                    .map((i, td) => {
                        const rect = td.getBoundingClientRect();

                        const x = rect.left + ((rect.right - rect.left) / 2);
                        const y = rect.top + ((rect.bottom - rect.top) / 2);

                        tds.push([ x, y ]);
                    });

                $('iframe[title="recaptcha challenge"]')
                    .contents()
                    .find('.verify-button-holder')
                    .map((i, btn) => {
                        const rect = btn.getBoundingClientRect();

                        const x = rect.left + ((rect.right - rect.left) / 2);
                        const y = rect.top + ((rect.bottom - rect.top) / 2);

                        buttons.push([ x, y ]);
                    });;

                return [ tds, buttons ];
            });

            console.log(positions.tds);
            console.log(positions.buttons);
        }

        await this.browser.screenshot('./captcha.png');

        process.exit(1);
    }

  async search(departDate, returnDate) {
    const searchURL = Kayak.getUrl({
        departDate,
        returnDate,
        fromAirport: this.fromAirport,
        toAirport: this.toAirport
    });

    try {
        await this.browser.goto(searchURL);

        const url = await this.browser.url();

        console.log({ url });

        if (url.indexOf('bots') !== -1 || url.indexOf('security') !== -1) {
            await this.handleCaptcha();
        }
    } catch (error) {
        if (error.code === -3) {
            await this.handleCaptcha();
        }
    }



    await this.browser.wait('.Common-Results-ProgressBar.Hidden');

    const prices = await this.browser.evaluate(() => {
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
    });

    await this.browser.wait(3000);

    return Promise.resolve(prices);
  }
}

module.exports = Kayak;
