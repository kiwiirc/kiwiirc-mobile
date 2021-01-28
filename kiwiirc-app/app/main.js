
import { startApp } from '@mobile/main';
import Logger from '@/libs/Logger';
import GlobalApi from '@mobile/libs/GlobalApi';

const log = Logger.namespace('main');
// Initialize global `kiwi`
let api = (global.kiwi = GlobalApi.singleton());

// in production, do not log to console.
if (TNS_ENV === 'production') {
    console.log = () => {};
} else {
    Logger.setLevel(2);
}

require('./plugins');

startApp();
