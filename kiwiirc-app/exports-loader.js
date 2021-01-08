const path = require('path');

const entry = 'global._kiwi_exports';
const mobileEntry = 'global._kiwi_exports.mobile';

function accesorString(value, entry) {
    const childProperties = value.split('.');
    let propertyString = entry;
    let result = '';

    for (let i = 0; i < childProperties.length; i++) {
        if (i > 0) result += `if(!${propertyString}) ${propertyString} = {};\n`;
        propertyString += `[${JSON.stringify(childProperties[i])}]`;
    }

    return result;
}

module.exports = function(source) {
    if (source.indexOf("'kiwi public'") === -1) {
        return source;
    }

    let resource = this.resourcePath;
    let isMobile = false;

    let detectSrc = path.sep + 'kiwiirc' + path.sep + 'src' + path.sep;
    let pos = resource.lastIndexOf(detectSrc);

    if (pos === -1) {
        detectSrc = path.sep + 'kiwiirc-mobile' + path.sep + 'src' + path.sep;
        pos = resource.lastIndexOf(detectSrc);

        if (pos === -1) {
            return source;
        }

        isMobile = true;
    }

    let a = '\r\n';
    a += `${entry} = ${entry} || {};\r\n`;

    if (isMobile) {
        a += `${mobileEntry} = ${mobileEntry} || {};\r\n`;
    }

    resource = resource.substr(pos + detectSrc.length);
    resource = resource.split(path.sep).join('.');
    resource = resource.replace(/\.(vue|js)$/, '');

    a += accesorString(resource, isMobile ? mobileEntry : entry);
    a += `\r\n${
        isMobile ? mobileEntry : entry
    }.${resource} = __webpack_exports__.default ? __webpack_exports__.default : __webpack_exports__;\r\n`;

    source += a;

    return source;
};
