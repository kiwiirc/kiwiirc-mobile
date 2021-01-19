# Running and debugging

## Running

### Android

You can run the app in:
- A virtual device created through the [AVD manager](https://developer.android.com/studio/run/managing-avds)
- A real Android device connected through USB, with developer mode and USB debugging enabled

The command `ns devices android --available-devices` will list the available devices. You can
select a specific devce with `ns run android --device=<Image Identifier>`.

### iOS

You can run the app in:
- A simulator installed through Xcode > Preferences > Components;
- A real iOS device connected through USB. You will need an [iOS developer account](https://developer.apple.com/).

The command `ns devices ios --available-devices` will list the available devices. You can
select a specific devce with `ns run ios --device=<Image Identifier>`.

## Debugging

To run the app in debug mode, use the command:

```bash
ns debug android|ios
```

### Chrome devtools

The debug command will output extra logging and a link that you can open in Chrome (or Chrome-based) browser 
to debug JavaScript (with breakpoints, step debugging, inspecting variables, etc.), use the JavaScript console,
inspect the NativeScript component tree, and see network requests.

### Vue devtools

You can also use [Vue devtools standalone client](https://github.com/vuejs/vue-devtools). To activate it:

1. Install the [Vue devtools standalone client](https://github.com/vuejs/vue-devtools/blob/dev/packages/shell-electron/README.md)
and open it.

  ```bash
  npm install -g @vue/devtools

  vue-devtools
  ```

2. Change the `host` in [`main.js`](https://github.com/kiwiirc/kiwiirc-mobile/blob/62e73a3f4165622ae85f25e726cdfe34c7f3b392/src/main.js#L79)
to your computer's IP address:

```javascript
Vue.use(VueDevtools, { host: '192.168.1.211' });
```

3. Run the app in debug mode

```bash
ns debug android|ios
```

With Vue devtools you can see the Vue component tree, events and component renderings.