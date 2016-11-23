'use strict';

import welcome from './welcome';

if (NODE_ENV == 'dev') {
    debugger;
}

welcome('home');

exports.welcome = welcome;