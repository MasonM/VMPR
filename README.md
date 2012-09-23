Overview
--------
VMPR (Virgin Mobile PIN Randomizer) is a script for Virgin Mobile customers to use that changes their account PIN to a random number every few minutes. Doing this mitigates the risks posed by [Virgin Mobile's extremely insecure password system](http://kev.inburke.com/kevin/open-season-on-virgin-mobile-customer-data/) in a few ways:

 * Any attempt to brute force your PIN won't get far before it changes.
 * If Virgin Mobile's support or e-mail system gets compromised somehow, your PIN will probably have changed before it can be used. This is a concern because Virgin Mobile requires customers to include their PIN in all support correspondence, even insecure channels like e-mail. 
 * Similarly, if Virgin Mobile's account database is leaked, your PIN will almost certainly have changed before someone malicious can do anything with it.

Though Virgin Mobile has made some minor efforts to address their security issues, they haven't done enough. Until Virgin Mobile starts taking security seriously, it's a good idea for customers to be vigilant (or switch to a different carrier).

Features
--------
 * Runs on Linux, Windows, and Mac OS X.
 * Simple HTA-based GUI for Windows users.
 * Configurable frequency of PIN changes (defaults to every 3 minutes).
 * Can be configured to append new PINs to a file. Defaults to echoing them to stdout.
 * Since Virgin Mobile helpfully sends you a text every time your PIN changes, you can find out if it's working by simply checking your messages.

Instructions
------------
VMPR depends on [CasperJS 1.0.0-RC1](http://casperjs.org)(included as a submodule) and [PhantomJS 1.6.1](http://phantomjs.org/download.html). The [Downloads page](https://bitbucket.org/MasonM/vmpr/downloads) has standalone packages for Linux, Windows, and Mac OS X that include both these dependencies. Windows users should run the "vmpr.hta" script to launch the GUI, while Linux and OS X users should run the "vmpr.sh" script for the command-line interface.
