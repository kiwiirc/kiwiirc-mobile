const { resolve } = require('path');
const fs = require('fs');
const fse = require('fs-extra');

const webpack = require('webpack');
const nsWebpack = require('@nativescript/webpack');
const CopyWebpackPlugin = require('copy-webpack-plugin');

const packageJson = require('./package.json');

const webpackConfig = require('./webpack.config');

module.exports = (env) => {
    // Here you can modify env before passing them to the default config
    const config = webpackConfig(env);

    const { appPath = 'app' } = env;

    const platform = env && ((env.android && 'android') || (env.ios && 'ios'));

    const projectRoot = __dirname;
    const appFullPath = resolve(projectRoot, appPath);
    const webDir = resolve(projectRoot, '../kiwiirc');
    const mobileDir = resolve(projectRoot, '..');

    const dist = resolve(
        projectRoot,
        nsWebpack.getAppPath(platform, projectRoot)
    );

    // make sure the translation files are included in the final bundle. They are
    // required dynamically
    config.externals.push((context, request, callback) => {
        if (/assets[\/\\]locales$/i.test(context)) {
            return callback(null, './assets/locales/' + request);
        }
        if (/assets[\/\\]mobile-locales$/i.test(context)) {
            return callback(null, './assets/mobile-locales/' + request);
        }
        callback();
    });

    // add platform specific scss
    config.resolve.extensions = [
        '.vue',
        '.ts',
        '.js',
        `.${platform}.scss`,
        '.scss',
        '.css',
    ];

    // add import alias to the web code
    config.resolve.alias = Object.assign(config.resolve.alias, {
        '@': resolve(webDir, 'src/'),
        '@app': appFullPath,
        '@web': resolve(webDir, 'src/'),
        '@mobile': resolve(mobileDir, 'src/'),
        '@webstatic': resolve(webDir, 'static/'),
    });

    // required for the plugin module replacement feature
    config.resolveLoader.modules = ['node_modules', resolve(projectRoot)];

    // required for the plugin module replacement feature
    config.optimization.providedExports = false;

    // config.modules
    // replace the .js rule
    config.module.rules = config.module.rules.filter(
        (rule) => String(rule.test) !== String(/\.js$/)
    );
    config.module.rules.push({
        test: /\.js$/,
        use: [{ loader: 'exports-loader' }, { loader: 'babel-loader' }],
    });

    // avoid loading ServerConnection.js
    config.module.rules.push({
        test: resolve(webDir, 'src/libs/ServerConnection.js'),
        loader: 'null-loader',
    });

    // config.plugins
    config.plugins.push(
        // fix irc framework import
        new webpack.NormalModuleReplacementPlugin(
            /irc-framework[\/\\]src[\/\\]transports[\/\\]default/,
            'default_browser.js'
        ),
        new webpack.NormalModuleReplacementPlugin(
            /@[\/\\]libs[\/\\]ThemeManager/,
            mobileDir + '/src/libs/ThemeManager'
        ),
        new webpack.DefinePlugin({
            'process.version': "''",
            'window.console': 'console',
        }),
        new webpack.IgnorePlugin({resourceRegExp: /assets\/plugins/}),
    );

    // copy kiwiirc-mobile assets and fonts
    addCopyToConfig(config, `${mobileDir}/src/assets`, `${dist}/assets/`);
    addCopyToConfig(config, `${mobileDir}/src/fonts`, `${dist}/fonts/`);

    const locales = require(`${webDir}/build/webpack/locales.js`);
    console.log('Translating languages...');
    return locales
        .createJsonFiles()
        .then(() => {
            console.log('Done!');
            console.log('Copying locales...');
            const localesDir = resolve(mobileDir, 'src/assets/locales/');
            fse.ensureDirSync(localesDir);
            fse.copySync(resolve(webDir, 'static/locales/'), localesDir);
            console.log('Done!');
        })
        .then(() => {
            console.log('Done!');

            return config;
        });
};

function addCopyToConfig(config, from, to) {
    config.plugins.push(
        new CopyWebpackPlugin([
            {
                from: from,
                to: to,
                force: true,
            },
        ])
    );
}
