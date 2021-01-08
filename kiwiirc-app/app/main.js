
import { startApp } from '@mobile/main';
import Logger from '@/libs/Logger';

const log = Logger.namespace('main');

// in production, do not log to console.
if (TNS_ENV === 'production') {
    console.log = () => {};
} else {
    Logger.setLevel(2);
}

startApp();