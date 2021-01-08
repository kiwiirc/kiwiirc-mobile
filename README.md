# Kiwi IRC - mobile IRC client

An open source IRC client for iOS and Android built using [NativeScript-Vue](http://nativescript-vue.org/).

- Always connected with with [kiwiBnc](https://github.com/kiwiirc/kiwibnc)
- Full message history

## Getting started

### Prerequisites

- [Nodejs](https://nodejs.org/)
- [yarn](https://yarnpkg.com/)
- A full [NativeScript environment](https://nativescript-vue.org/en/docs/getting-started/installation/)

### Building

1. Clone this repository

```bash
git clone https://github.com/kiwiirc/kiwiirc-mobile/
cd kiwiirc-mobile
```

2. Run setup (inits git submodules)

```bash
yarn setup
```

3. Run the app

```bash
cd kiwiirc-app
ns run ios|android
```

### Deploying

Fastlane is supported to automate the deployment of iOS and Android apps to app stores.  More on this [here](./docs/deploying_with_fastlane.md))

Other deployment methods are available for both [Android](https://docs.nativescript.org/tooling/publishing/publishing-android-apps) and [iOS](https://docs.nativescript.org/tooling/publishing/publishing-ios-apps).

## Repository structure
- `kiwiirc/` - Shared source with the core [`KiwiIRC`](https://github.com/kiwiirc/kiwiirc) project (see [here](./docs/updating_kiwiirc.md) how to update this)
- `kiwiirc-app/` - The default [App Project](#App-Project) for Kiwi IRC
- `src/` - The main mobile application source

## App Projects

An App Project is a [NativeScript](https://www.nativescript.com) project that contains all your custom mobile app assets and meta data. This includes important things such as your mobile application ID, name, icons and logos amongst other iOS and Android specific details. The default Kiwi IRC App Project is under `kiwiirc-app/`.

Custom Kiwi IRC code to extend the application belong in [plugins](#Plugins).

App Project structure:
- `App_Resources/` (More about this [here](https://docs.nativescript.org/core-concepts/project-structure-app#appapp_resources)). This includes:
	- Image resources (see [here](https://docs.nativescript.org/ui/image-resources))
	- Android `AndroidManifest.xml` for gradle configurations, etc
	- iOS `Info.plist` for build configurations and other metadata files
- `package.json` For your application ID and extra Kiwi [plugins](#Plugins) to extend the app
- `.env.default` (optional) containing fastlane deployment configuration ([more on this](./docs/deploying.md))

### Customising the App Project

Create a new App Project by copying `kiwiirc-app` to a new folder. You must then always change the following:

- `App_Resources/`
  - icons and splash screen images;
  - `iOS/Info.plist` (CFBundleDisplayName)
  - `Android/src/main/res/values[-21]?/strings.xml` (app name);
  - `Android/src/main/res/values[-21]?/colors.xml`;
- `package.json` (nativescript.id, name);
- `app/app.scss` (theme, other style overrides);
- `app/assets/config.json` (Irc connection, plugins, etc.). By default, the app will use the bouncer `betabnc.irc.com`. This is only temporary. A custom app bundle should use another bouncer provider.

The main entry point for the application is `app/main.js`. While you may modify this, it is advised to use [plugins](#Plugins) instead to customise your Kiwi IRC App Project.

## Plugins

Plugins let you customise the Kiwi IRC mobile app without modifying the core project source. They use the same API as the kiwi web client which can be found [here](https://github.com/kiwiirc/kiwiirc/wiki/Plugins#api).

Installing a plugin is a simple `yarn add ns-kiwi-plugin-*` command away and adding it to your App Project `app/config.json` file. Plugins added to this config file will be loaded at startup. You can find more information on creating plugins in the example plugin [here](https://github.com/kiwiirc/ns-kiwi-plugin-sample).
