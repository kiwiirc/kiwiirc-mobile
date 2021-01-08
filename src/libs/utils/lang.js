'kiwi public';

import strftime from 'strftime';
import i18next from 'i18next';

// `localizedStrftime` function will be assigned a proper function after `init()`
// eslint-disable-next-line import/no-mutable-exports
let localizedStrftime = () => {
    throw new Error('strftime not initialized!');
};

export { init, localizedStrftime as strftime };

function init(deviceLanguage) {
    localizedStrftime = getLocalizedStrftime(deviceLanguage);
}

/**
 * get a localized strftime function
 */
function getLocalizedStrftime(deviceLanguage) {
    // try getting strftime localization from i18next
    let strftimeLocalization = i18next.t('strftime', {
        defaultValue: null,
        returnObjects: true,
    });

    // If `strftimeLocalization` is a string, then it is the json encoded object.
    // This way, we can add it to the .po files
    if (typeof strftimeLocalization === 'string') {
        strftimeLocalization = JSON.parse(strftimeLocalization);
    }

    // if found a localization for strftime, use that
    if (strftimeLocalization) {
        return strftime.localize(strftimeLocalization);
    }

    // else, try grabbing a strftime bundled localization
    const bundledLocaleId = getBundledLocale(deviceLanguage);
    if (bundledLocaleId) {
        return strftime.localizeByIdentifier(bundledLocaleId);
    }

    // return the default unlocalized function...
    return strftime;
}

/**
 * Tries matching the device language with the strftime bundled locales
 * @param {String} deviceLanguage Device language.
 */
function getBundledLocale(deviceLanguage) {
    const strftimeLocales = [
        'de_DE',
        'en_CA',
        'en_US',
        'es_MX',
        'fr_FR',
        'it_IT',
        'nl_NL',
        'pt_BR',
        'ru_RU',
        'tr_TR',
        'zh_CN',
    ];

    const deviceLanguageConv = deviceLanguage.replace('-', '_');

    let strftimeDeviceLocale = strftimeLocales.find(locale =>
        locale.toLocaleLowerCase().startsWith(deviceLanguageConv)
    );

    return strftimeDeviceLocale;
}
