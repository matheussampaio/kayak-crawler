import co from 'co';
import Nightmare from 'nightmare';

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

      let count = 0;
      let isVisible = true;
      do {
        count++;

        yield vm.browser.wait(1000);

        isVisible = yield vm.browser.evaluate(() => {
          return $(`#progressDiv`).is(`:visible`);
        });
      } while (isVisible && count < 30);

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
