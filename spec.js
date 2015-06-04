describe('kayak crawler', function () {
    var months = ['Janeiro', 'Fevereiro', 'Maio', 'Abril', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    var EC = protractor.ExpectedConditions;
    var mPrices = [
        [], // 0th row
        [], // 1th row
        [], // 2th row
        [], // 3th row
        [], // 4th row
        [], // 5th row
        []  // 6th row
    ];

    function initSearch (monthReturn, dayReturn) {
        it('should load the site', function () {
            browser.ignoreSynchronization = true;
            browser.driver.manage().deleteAllCookies();
            browser.get('https://www.kayak.com.br/flights/');
        });

        it('should put origin and destination', function () {
            element(by.id('origin')).sendKeys('  JPA').then(function () {
                browser.sleep(1000);
                element(by.id('destination')).sendKeys('CHI');
                browser.sleep(1000);
            });

            EC.textToBePresentInElement(element(by.id('origin')), 'JPA1');
            EC.textToBePresentInElement(element(by.id('destination')), 'CHI');
        });

        it('should set flexible dates', function() {
            element(by.id('moreOptionsLink')).click();

            browser.sleep(1000);

            element(by.id('datesPlusMinusThree-label')).click();

            browser.sleep(1000);
        });

        it('should put depart date', function () {
            var datePicker = element(by.css('.r9-datepicker-month-first'));
            var dateInput = element(by.id('travel_dates-start-wrapper'));

            datePicker.isPresent().then(function (value) {
                if (!value) {
                    dateInput.click();
                }
            });

            browser.wait(EC.visibilityOf(datePicker), 5000, "Datepicker not visibly");

            datePicker.
                element(by.css('.r9-datepicker-month-name')).
                getText().then(function (text) {
                    var index = months.indexOf(text);
                    var targetMonth = months.indexOf('Agosto');

                    if (index > targetMonth) {
                        for (var i = 0; i < index - targetMonth; i++) {
                            element(by.css('.r9-datepicker-switch-month[title="Ante"]')).click();
                        };
                    } else if (index < targetMonth) {
                        for (var i = index; i < targetMonth; i++) {
                            element(by.css('.r9-datepicker-switch-month[title="Seguinte"]')).click();
                        };
                    }
                });

            browser.sleep(1000);

            element(by.css('.r9-datepicker-month-first')).
                all(by.css('.r9-datepicker-item>span')).
                filter(function (elem, index) {
                    return elem.getText().then(function (text) {
                        return text === '5';
                    });
                }).then(function(filteredElements) {
                    filteredElements[0].click();
                });

            browser.sleep(1000);
        });

        repeatSearch(monthReturn, dayReturn);
    }

    function repeatSearch (monthReturn, dayReturn) {
        it('should put return date', function () {
            // var monthReturn = monthReturn ? monthReturn : 'Agosto';
            // var dayReturn = dayReturn ? dayReturn : '24';
            var datePicker = element(by.css('.r9-datepicker-month-first'));
            var dateInput = element(by.id('travel_dates-end-wrapper'));
            var searchAgainView = element(by.css('.inlineSearchAgainView'));

            searchAgainView.isPresent().then(function (value) {
                if (value) {
                    searchAgainView.click();
                }
            });

            datePicker.isPresent().then(function (value) {
                if (!value) {
                    dateInput.click();
                }
            });

            browser.wait(EC.visibilityOf(datePicker), 5000, "Datepicker not visibly");

            datePicker.
                element(by.css('.r9-datepicker-month-name')).
                getText().then(function (text) {
                    var index = months.indexOf(text);
                    var targetMonth = months.indexOf(monthReturn);

                    if (index > targetMonth) {
                        for (var i = 0; i < index - targetMonth; i++) {
                            element(by.css('.r9-datepicker-switch-month[title="Ante"]')).click();
                        };
                    } else if (index < targetMonth) {
                        for (var i = index; i < targetMonth; i++) {
                            element(by.css('.r9-datepicker-switch-month[title="Seguinte"]')).click();
                        };
                    }
                });

            browser.sleep(1000);

            element(by.css('.r9-datepicker-month-first')).
                all(by.css('.r9-datepicker-item>span')).
                filter(function (elem, index) {
                    return elem.getText().then(function (text) {
                        return text === dayReturn;
                    });
                }).then(function(filteredElements) {
                    filteredElements[0].click();
                });

            browser.sleep(1000);
        });

        it('should search the flights', function() {
            var firstSearchButton = element(by.id('fdimgbutton'))

            firstSearchButton.isPresent().then(function (value) {
                if (value) {
                    firstSearchButton.click();
                } else {
                    element.all(by.css('button.ui-button.finalFormField[type="submit"]')).first().click()
                }
            });

            browser.sleep(1000);
        });

        it('should wait to load flights', function() {
            var progress = element(by.id('progressDiv'));
            var progressFinish = EC.invisibilityOf(progress);

            browser.wait(progressFinish, 60000);
        });

        it('should copy the data', function() {
            element(by.id('flexmatrixcontent')).
                all(by.css('.data>a')).
                map(function (elem) {
                    return elem.getText();
                }).
                then(function (prices) {
                    for (var i = 0; i < 7; i++) {
                        mPrices[i].push(prices.slice(i * 7, (i * 7) + 7));
                        console.log(mPrices[i]);
                    };
                });
        });
    }

    initSearch('Agosto', '12');
    repeatSearch('Agosto', '19');

    it('should wait 5 seconds', function() {
        browser.sleep(5000);
    });
});

