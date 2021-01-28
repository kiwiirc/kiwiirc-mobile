# Plugins

> Note: This is a living and breathing document. It is still changing and being completed.

This document briefly outlines how to create, register and make use of plugins. Plugins are the best way to extend
and customise the KiwiIRC mobile app, while keeping the core code intact. This makes it easier to update the core
code with the latest features and bug fixed in your custom app.

There are two types of plugins:

- Single-file `.js`: Easier to create. Your plugin has to live in a single javascript file.

- NPM dependency: The plugin is a npm package that can have multiple files. This way allows
adding [NativeScript plugins](http://market.nativescript.org/) and other resources.

## Single-file plugins

> You can bundle a multiple file project in a single file with webpack and use that. See 
[this example](https://github.com/H7-25/ns-kiwi-plugin-avatar).

To add a single-file plugin to the [App Project](../README.md#App-Projects), follow the steps:

1. Copy the `.js` to `app/assets/plugins` folder (e.g. `app/assets/plugins/my-plugin.js`);

2. Add the plugin in `app/assets/config.json`, like so:
  ```json
  {
      ...
      "plugins": [
          { "name": "my-plugin", "url": "./assets/plugins/my-plugin.js"}
      ],
      ... 
  }
  ```

## NPM dependency plugins

These Kiwi mobile plugins are [NativeScript plugins](https://docs.nativescript.org/plugins/plugin-reference). 
This means that they must follow the [NativeScript plugin requirements](https://docs.nativescript.org/plugins/plugin-reference#create-a-plugin).

Use the [kiwiirc-mobile-plugin-sample](https://github.com/kiwiirc/kiwiirc-mobile-plugin-sample) as a starting point.

1. Download the repo as a [.zip file](https://github.com/kiwiirc/kiwiirc-mobile-plugin-sample/archive/master.zip);

2. Change the name of the package in `src/package.json` (e.g. `my-kiwi-plugin`);

3. Add the plugin as a local dependency:
    ```bash
    yarn add <path to plugin 'src' folder>/my-kiwi-plugin
    ```

  > See other options to install NativeScript plugins [here](https://docs.nativescript.org/plugins/plugin-reference#install-a-plugin).

4. `require()` the plugin in the App Project's `app/plugins.js``:
    ```js
    // require npm plugins:
    require('my-kiwi-plugin');
    ```

### Plugin resources
NPM plugins can include a `platforms` directory. This directory holds resource files similar to the `app/App_Resources` directory. 
Check the [sample plugin project](https://github.com/kiwiirc/kiwiirc-mobile-plugin-sample) to see the expected folder structure.
This directory is used for image resources (see how to use them [here](https://docs.nativescript.org/ui/image-resources)). These can be accessed for example with `background: url('res://my_img')'`.

## Creating a plugin

Inside the main `.js` file (`src/index.js` for npm plugins), you must register a plugin using the 
`kiwi.plugin()` call, such as:

```js
kiwi.plugin('plugin_name', function(kiwi, log) {
    // Plugin code here
});
```

Your plugin function will be called once mobile app has been loaded and ready to start. You can listen for events and use any of the below API in your plugin.

As a very simple example, this plugin will listen for any new networks being created and set the default server address to `irc.freenode.net`:

```js
kiwi.plugin('my_plugin', function(kiwi) {
    kiwi.on('network.new', function(event) {
        event.network.connection.server = 'irc.freenode.net';
        event.network.connection.port = 6667;
    });
});
```

## API

### kiwi.*

The main API interface
`kiwi` is a global object that 

| Property | Description |
| --- | --- |
| `.version` | The app version (set in `package.json`) |
| `.Vue` | A Vuejs global instance |
| `.i18n` | Access to the app's translation module ([i18next](https://www.i18next.com/)) |
| `.JSON5` | Expose JSON5 so that plugins can use the same config format |
| `.state` | The Kiwi internal application state. Described [below](#kiwistate) |
| `.plugin(pluginName, fn)` | Create a new plugin |
| `.addUi(type, component, props)` | Add a UI component. Described [bellow](#addUI) |
| `.addStartup(name, startupObject)` | Add a new startup screen. Described [bellow](#addStartup) |
| `.replaceModule(module, new_module)` | Replace a module or component. Described [bellow](#replaceModule) |
| `.require(module)` | Get a Kiwi internal module instance |
| `.on(eventName, fn)` | Listen for an application [event](#event-bus) |
| `.once(eventName, fn)` | Listen for an application [event](#event-bus) one time only |
| `.off(eventName, fn)` | Stop listening for an application [event](#event-bus) |
| `.emit(eventName, arg1, arg2)` | Emit an event on the application ](#event-bus)event bus](#event-bus) |

#### kiwi.addUI

You can add components to:
- `'input_top'`: above the input box with the full width of the screen.
- `'input_tool'`: on the right hand side of the input box. Use it to add buttons to send files, for instance.
- `browser`: the top left corner of the `StateBrowser` (main window).

Example:

```js
import HelloMessage from './components/HelloMessage';

// Add component above the input
kiwi.addUi(
    'input_top',  // or 'input_tool', 'browser'
    HelloMessage, // component
    { state: kiwi.state } // props
);
```

#### kiwi.addStartup

Adds a startup method. Use it to implement custom login or registration methods.

```js
kiwi.addStartup('MyStartup', startup);
```

**`kiwi.addStartup(name: string, startup: StartupInstance)`**  
  - `name`: name of the startup method. Set the name in `app/assets/config.json`:
    ```json
    { ...
    "startupScreen": "MyStartup",
    ...}
    ```
  - `startup`: startup instance. An object with:
    - `constructor(state, log)`: constructor called with the [app state](#kiwistate) and a logger.
    - `startup(vueInstance: VueComponent): Promise`: the startup method.
      - `vueInstance`: reference to the loading screen component. Use it to navigate to a login screen (e.g. `vueInstance.$navigateTo()` or `vueInstance.$showModal()`);
      - Returns: `Promise` that when resolved means that the login was successful (app continues to the main screen), when rejected shows the message in an error screen;
    - `logout(): Promise`: function called before the app does the actual log out. Use it for extra clean up tasks in an external service, for instance.
      - Returns: `Promise` that when resolved means that the logout can continue, when rejected the logout process stops and the app navigates back to the previous state in the main screen.


#### kiwi.replaceModule

Replaces a core module (`.js` or `.vue` file) with a custom implementation. Basically, swaps a file in the core code 
(`kiwirc-mobile` and `kiwirc-mobile/kiwiirc`) with another one.

Example:
```js
kiwi.replaceModule('mobile/components/UserSettings', require('./UserSettings').default);
```

**`kiwi.replaceModule(moduleName: string, newModule: Object)`**
  - `moduleName`: path to the module to be replaced. If replacing a module in `kiwiirc-mobile`, prefix the path with `mobile/`.
  - `newModule`: new module replacing the `moduleName`


### kiwi.state.*
The Kiwi internal application state. The entire application uses this interface to modify state such as adding or removing networks, adding buffers / messages / users, getting the active network or buffer.

```js
exportState(includeBuffers)
importState(stateStr)
resetState()

setting(name, val)
getSetting(name)
setSetting(name, newVal)

getActiveNetwork()
getNetwork(networkid)
getNetworkFromAddress(netAddr)
addNetwork(name, nick, serverInfo)
removeNetwork(networkid)

getActiveBuffer()
setActiveBuffer(networkid, bufferName)
openLastActiveBuffer()
updateBufferLastRead(networkid, bufferName)
getOrAddBufferByName(networkid, bufferName)
getBufferByName(networkid, bufferName)
addBuffer(networkid, bufferName)
removeBuffer(buffer)

addMessage(buffer, message)
getMessages(buffer)

getUser(networkid, nick, usersArr_)
usersTransaction(networkid, fn)
addUser(networkid, user, usersArr_)
removeUser(networkid, user)
addMultipleUsersToBuffer(buffer, newUsers)
addUserToBuffer(buffer, user, modes)
removeUserFromBuffer(buffer, nick)
getBuffersWithUser(networkid, nick)
changeUserNick(networkid, oldNick, newNick)

getStartups()
```

### Event bus
This is the main event bus for the application. Events are emitted by many places and some allow you to emit your own so that you can interact with Kiwi.

These events can be listened for via `kiwi.on('event.name', function() {})`. For events marked that they can be fired from plugins, you can do so via `kiwi.emit('event.name', arg1, arg2)`.

| Name | Arguments | Can be fired from plugins | Description |
| --- | --- | --- | --- |
| `app.suspended` | | No | Called when the app goes to the background |
| `app.resumed` | | No | Called when the app returns from background |
| `ui.active_buffer` | buffer | yes | Show a buffer page |
| `server.open` | network, openTab | yes | Show the settings for a given network |
| `input.raw` | rawText | yes | Simulate user input |
| `userbox.show` | user, props | yes | Open the user information panel for the given user |
| `irc.raw` | command, event, network | no | Raw IRC message from the IRC server |
| `irc.raw.[command]` | command, event, network | no | A raw IRC message from the IRC server |
| `irc.[command]` | event, network, ircEventObj | no | A parsed IRC event from the IRC library |
| `network.new` | eventObj | no | A new network has been added |
| `network.removed` | eventObj | no | A network has been deleted |
| `network.connecting` | eventObj | no | A network connection is about to start |
| `buffer.new` | eventObj | no | A new buffer has been added |
| `buffer.close` | eventObj | no | A buffer has been closed |
| `message.render` | eventObj | no | A message is about to be rendered |
