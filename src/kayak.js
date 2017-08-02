const _ = require('lodash');
const Nightmare = require('nightmare');
const debug = require('debug')('kayak');

const CONFIG = require('./config');

class Kayak {
    constructor() {
        this.browsers = [];
        this.freeBrowsers = {};
        this.first = true;

        for (let i = 0; i < CONFIG.CONCURRENCY; i++) {
            this.browsers.push(Nightmare({
                // waitTimeout: 1000 * 60,
                show: CONFIG.SHOW_BROWSER,
                dock: CONFIG.SHOW_BROWSER,
                webPreferences: {
                    webSecurity: false,
                    allowRunningInsecureContent: true
                }
            }));

            this.freeBrowsers[i] = true;
        }
    }

    end() {
        return Promise.all(this.browsers.map(browser => browser.end()));
    }

    getFreeBrowser() {
        for (let i = 0; i < this.browsers.length; i++) {
            if (this.freeBrowsers[i]) {
                this.freeBrowsers[i] = false;

                return i;
            }
        }

        return -1;
    }

    static getUrl({ departDate, returnDate }) {
        return [
            'https://www.kayak.com/flights/',
            `${CONFIG.FROM_AIRPORT},nearby-${CONFIG.TO_AIRPORT},nearby/`,
            `${departDate}-flexible/`,
            `${returnDate}-flexible`,
            CONFIG.FILTER_AIRPORT ? `?fs=layoverair=-${CONFIG.FILTER_AIRPORT}` : ''
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
        const searchURL = Kayak.getUrl({ departDate, returnDate });

        const browserIndex = this.getFreeBrowser();

        if (browserIndex === -1) {
            return Promise.reject('No free browser');
        }

        const browser = this.browsers[browserIndex];

        try {
            await browser.goto(searchURL);

            const url = await browser.url();

            // check if we're blocked by captcha
            if (url.indexOf('bots') !== -1 || url.indexOf('security') !== -1) {
                await this.handleCaptcha();
            }

        // something went wrong, maybe captcha?
        } catch (error) {
            if (error.code === -3) {
                await this.handleCaptcha();
            }
        }

        await browser.wait('.Common-Results-ProgressBar.Hidden');

        const rawPrices = await browser.evaluate(() => {
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

        const prices = rawPrices.map(price => (price * CONFIG.RATE).toFixed(2));

        await browser.wait(3000);

        this.freeBrowsers[browserIndex] = true;

        if (this.first) {
            this.first = false;
        } else {
            process.stdout.write(`, `);
        }

        process.stdout.write(`$${_.min(prices)}`);

        return { departDate, returnDate, prices };
    }
}

module.exports = Kayak;
