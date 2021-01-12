# Kiwi IRC - mobile IRC client

An open source IRC client for iOS and Android built using [NativeScript-Vue](http://nativescript-vue.org/).

- Always connected with with [kiwiBnc](https://github.com/kiwiirc/kiwibnc)
- Full message history
- Themeable
- Customiseable through the plugin system

## Getting started

### Prerequisites

- [Nodejs](https://nodejs.org/)
- [yarn](https://yarnpkg.com/)
- NativeScript CLI
  ```bash
  npm install -g nativescript
  ```
- Setup for [macOS (iOS and Android development)](https://docs.nativescript.org/start/ns-setup-os-x)
- Setup for [Windows (Android development)](https://docs.nativescript.org/start/ns-setup-win)
- Setup for [Linux (Android development)](https://docs.nativescript.org/start/ns-setup-linux)

To check the NativeScript environment, run the NativeScript CLI command:

```bash
ns doctor
```

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
ns run android|ios
```

If all goes well, NativeScript will build and open the app on a connected 
device or simulator.

More info on [running](./docs/running.md#Running) and [debugging](./docs/running.md#Debugging) the app [here](./docs/running.md).

See [here](./docs/publishing.md) how to build the app for release and how to publish to Google Play (Android) and App Store (iOS).

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
- `app/assets/config.json` (Irc connection, plugins, etc.). By default, the app will use the 
bouncer `betabnc.irc.com`. You can costumise the BNC server in the `startupOptions` parameter.

The main entry point for the application is `app/main.js`. While you may modify this, it is advised to use [plugins](#Plugins) instead to customise your Kiwi IRC App Project.

## Plugins

Plugins let you customise the Kiwi IRC mobile app without modifying the core project source. They use the same API as the kiwi web client which can be found [here](https://github.com/kiwiirc/kiwiirc/wiki/Plugins#api).

Installing a plugin is a simple `yarn add ns-kiwi-plugin-*` command away and adding it to your App Project `app/config.json` file. Plugins added to this config file will be loaded at startup. You can find more information on creating plugins in the example plugin [here](https://github.com/kiwiirc/ns-kiwi-plugin-sample).
