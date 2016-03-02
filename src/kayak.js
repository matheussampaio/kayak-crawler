import co from 'co';
import Nightmare from 'Nightmare';

require(`nightmare-evaluate-async`)(Nightmare);

export default class Kayak {
  constructor(fromAirport, toAirport) {
    this.fromAirport = fromAirport;
    this.toAirport = toAirport;
    this.browser = new Nightmare({
      show: process.env.DEBUG,
      dock: process.env.DEBUG,
      waitTimeout: 20000
    });
  }

  getSearchURL(departDate, returnDate) {
    return [
      `https://www.kayak.com/flights/`,
      `${this.fromAirport},nearby-${this.toAirport},nearby/`,
      `${departDate}-flexible/`,
      `${returnDate}-flexible`
    ].join(``);
  }

  end() {
    return this.browser.end();
  }

  search(departDate, returnDate) {
    const vm = this;

    return co(function* () {
      const searchURL = vm.getSearchURL(departDate, returnDate);

      yield vm.browser.goto(searchURL);
      yield vm.browser.wait(`#progressDiv`);
      yield vm.browser.inject(`js`, `./node_modules/jquery/dist/jquery.min.js`);
      yield vm.browser.evaluateAsync((next) => {
        waitProgress();

        function waitProgress() {
          if ($(`#progressDiv`).is(`:visible`)) {
            setTimeout(waitProgress, 500);
          } else {
            next();
          }
        }
      });
      return yield vm.browser.evaluate(() => {
        const prices = $(`#flexmatrixcontent .data > a`)
          .text()
          .trim()
          .split(` `)
          .map(elem => parseInt(elem.replace(`\n`, ``).replace(`$`, ``), 10));

        return prices;
      });
    });
  }
}
