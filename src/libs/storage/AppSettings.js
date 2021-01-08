'kiwi public';

import * as appSettings from 'tns-core-modules/application-settings';

export function get(name) {
    return new Promise((resolve) => {
        resolve(appSettings.getString(name));
    });
}

export function set(name, val) {
    return new Promise((resolve) => {
        if (val === null) {
            return resolve(appSettings.remove(name));
        }
        return resolve(appSettings.setString(name, val));
    });
}
