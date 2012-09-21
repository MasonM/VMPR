/*!
 * VMPR (Virgin-Mobile PIN Randomizer) is a simple script to change a Virgin
 * Mobile account PIN to a random number at set time intervals.
 *
 * Repository:    http://bitbucket.org/MasonM/vmpr
 *
 * Copyright (c) 2012 Mason Malone
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included
 * in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
 * OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
 * THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 *
 */

function generatePin() {
    var buffer = new Uint32Array([1]);
    crypto.getRandomValues(buffer);
    var newPin = String(buffer[0]).substring(0, 6);

    // check if PIN satisfies Virgin's requirements (no 3 identical #s in a row and no 3 sequential #s)
    var sameCount = 0, seqCount = 0, curDigit, lastDigit;
    for (var i = 0; i < newPin.length; i++) {
        curDigit = newPin[i];

        if (curDigit === lastDigit) sameCount++;
        else sameCount = 0;

        if (Number(curDigit) === Number(lastDigit) + 1) seqCount++;
        else seqCount = 0;

        if (seqCount === 2 || sameCount === 2) {
            // broke a requirement; recurse and try again
            return generatePin();
        }
        lastDigit = curDigit;
    }

    return newPin;
}

function randomBetween(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}

function usage() {
    var usageText = "\
Usage: phantomjs vmpr.js PHONE PIN [OPTION]\n\n\
Options:\n\
   --frequency\tFrequency in seconds to change PIN. Defaults to 360 (5 minutes).\n\
   --verbose\tPrint debugging information.\n\
   --fuzz\tTime fuzz factor in seconds for varying the frequency to avoid bot detection.\n\
         \tDefaults to 10 seconds.\n\
Example: casperjs vmpr.js 2222222222 11111 --frequency=1020 --fuzz=20";
    casper.echo(usageText).exit(1);
}

var fs = require('fs');

phantom.casperPath = 'casperjs';
phantom.injectJs(phantom.casperPath + fs.separator + 'bin' + fs.separator + 'bootstrap.js');

var casper = require("casper").create({
    verbose: true,
    logLevel: "error"
});

if (casper.cli.has("help") || !casper.cli.has(0) || !casper.cli.has(1)) {
    usage();
}

var pinChangeUrl = "https://www1.virginmobileusa.com/myaccount/home.do?o=/myaccount/prepareAccountSettings.do",
    verbose = casper.cli.has('verbose'),
    phoneNum = casper.cli.get(0),
    frequency = casper.cli.get('frequency'),
    fuzz = casper.cli.get('fuzz'),
    pin = casper.cli.get(1);

if (verbose) casper.options['logLevel'] = "debug";
if (!fuzz) fuzz = 10
if (!frequency) frequency = 60 * 5;

casper.verboseEcho = function(msg) {
    if (!verbose) return;
    this.echo(msg);
};

casper.changePinLoop = function changePin() {
    this.verboseEcho('Got to account page. url = ' + this.getCurrentUrl() + ', title = ' + this.getTitle());
    this.waitForSelector('#cboxIframe', null, function() {
        this.die("Timeout waiting for PIN change iframe to appear.", 1);
    });
    //anti-bot-detection
    this.wait(randomBetween(500, 1500));
    this.then(function() {
        pin = generatePin();
        this.echo(pin);
        this.verboseEcho("Submitting form");
        // this is needed because the form to change the PIN is in an iframe,
        // which casper.fill() can't get to
        this.evaluate(function(newPin) {
            var form = jQuery('#cboxIframe').contents().find('#vkeyForm');
            form.find('#newVkey').val(newPin);
            form.find('#confirmVkey').val(newPin);
            form.submit();
        }, { newPin: pin });
    });
    this.then(function() {
        this.verboseEcho('Submitted form. url = ' + this.getCurrentUrl() + ', title = ' + this.getTitle());
        var sleepTime = randomBetween(frequency - fuzz, frequency + fuzz);
        this.verboseEcho("Sleeping for " + sleepTime + " seconds");
        this.wait(sleepTime * 1000);
    });
    this.thenOpen(pinChangeUrl);
    this.then(this.changePinLoop);
}

casper
    .start(pinChangeUrl)
    .userAgent('Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.1 (KHTML, like Gecko) Chrome/22.0.1207.1 Safari/537.1')
    .wait(randomBetween(500, 1500))
    .then(function login() {
        //anti-bot-detection
        this.verboseEcho("Submitting login form");
        this.fill('.login_form', {
            "min": phoneNum,
            "vkey": pin
        }, true);
    })
    .then(function check() {
        if (this.exists(".login_form .error")) {
            this.die("Got error logging in: " + this.fetchText(".login_form .error"), 1);
        }
        if (this.getCurrentUrl() !== pinChangeUrl) {
            this.die("Got sent to an unexpected page: " + this.getCurrentUrl(), 1);
        }
    })
    .then(casper.changePinLoop)
    .run();
