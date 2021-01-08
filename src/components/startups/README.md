# App load

This document provides a high level view on the mechanisms in place when an app loads.

## The App Loading steps

The app loading sequence goes as follows:

1. Start with `main.js`

    Entry point of the App. Starts running while the App shows the launchscreen. In NativeScript, we
    need to navigate to the next screen ASAP, otherwise it may crash on Android. After the bare
    minimum initialisation, it starts rendering the `LoaderPage`.

2. Opens `startups/LoaderPage.vue`

    This page shows the loading screen animation while everything is sets up. The `startupApp()`
    method contains a chain of promises with the steps:

    - `initApp()` to initialise a bunch of things. (step 3)
    - Perform logout functions if this screen is open after a logout. (step 4)
    - Load the correct startup module and execute its `startup()` function. (step 5)
    - Sets the correct active buffer to be shown by `App.vue`. (step 6)
    - Navigates to `App.vue`.

    These steps will be detailed below.

3. Run initialisation code from `libs/initialiser.js`

    `initApp()` is function in `initialiser.js`.
    This file contains a lot of initialisation code, as you can see in the `initApp()` function:

    ```js
    export function initApp() {
        // Check if the app is already initialised, skips if it is.
        if (initialised) {
            log('already initialised.');
            return Promise.resolve(state);
        }

        return updateConfig() // loads the config (see bellow)
            .then(initState) // load the persisted state, creates the $state mixin
            .then(initPlugins) // inits the plugin system and loads plugins
            .then(initLocales) // loads the needed localization files
            .then(initThemes) // loads the theme system
            .then(initInputCommands) // inits the input commands handler
            .then(initSuspendResumeWatcher) // creates listeners for suspend/resume events
            .then(initConnectionWatcher) // creates listeners for internet connection events
            .then(initSound) // initialises sound and vibration
            .then(initMediaViewer) // initialises an in-app browser available to all the app
            .then(() => {
                initialised = true;
            })
            .then(() => state);
    }
    ```

    - `updateConfig()`
        1. Loads the config from `config.json`
        2. if the setting `appSettings.configUrl` in `config.json` is present:
            - fetches this config
            - merges it with the default `config.json`
            - caches this new config, so it will be used from now on even if it fails getting a
              new one

4. Perform a `logout()`, if needed.

    This step will run if we are navigating back from the `App.vue` after a logout. This step will
    allow startup modules to run additional logout code. More on startup modules below.

    If the logout fails (i.e. `logout()` throws an error), then the app displays and error message
    and returns to `App.vue`.

5. Run `startup()`

    The app ships with 2 startups modules:

    - Welcome: the default welcome startup (`startups/KiwiBnc`)
    - KiwiBnc: startup with the KiwiBnc login (`startups/KiwiBnc`)

    Plugins can provide startup modules too (see `addStartup()` in `GlobalApi`).

6. Set the correct active buffer

We set the correct active buffer before navigating to `App.vue` to avoid navigation jumps as soon
as the `App.vue` opens.

The active buffer can be set in two moments:

-   When the user opens a buffer, so that the next time the app opens it will return to that last
    open buffer. This is set in the `navigateToBuffer()` method in `App.vue`;
-   When the user taps a push notification that will open the app. In this set in the push
    notification listener in `initFirebase()` at `initialiser.js`.

## Startup Plugins

Startup modules have a very simple interface:

-   `startup(vueInstance)`: function called on startup to perform the login.

    -   Arguments:
        -   `vueInstance`: a NativeScript-Vue instance, so we can perform navigation.
    -   Returns: `Promise` that resolves when the startup finishes.

    By returning a promise, we make sure the `LoaderPage` waits for the startup to complete. This
    also allows that a startup makes an "auto-login" without leaving the `LoaderPage`. If the
    startup needs show some UI, then it will use `vueInstance.$showModal()` because opening a modal
    allows us to wait for their result.

-   `logout()` (optional)
    -   Returns: `Promise` that resolves when the logout finishes. If rejected, the logout process
        is interrupted and the UI returns to `App.vue`.

This method allows startup modules to run cleanup functions.
