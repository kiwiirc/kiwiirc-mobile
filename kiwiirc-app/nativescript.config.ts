import { NativeScriptConfig } from '@nativescript/core'

export default {
  id: 'com.example.kiwiircapp',
  appResourcesPath: 'app/App_Resources',
  android: {
    v8Flags: '--expose_gc',
    markingMode: 'none',
  },
  webpackConfigPath: './kiwi-custom.webpack.config.js',
  appPath: 'app',
} as NativeScriptConfig
