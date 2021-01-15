'kiwi public';

import { ApplicationSettings } from '@nativescript/core';

export function get(name) {
    return new Promise((resolve) => {
        resolve(ApplicationSettings.getString(name));
    });
}

export function set(name, val) {
    return new Promise((resolve) => {
        if (val === null) {
            return resolve(ApplicationSettings.remove(name));
        }
        return resolve(ApplicationSettings.setString(name, val));
    });
}
