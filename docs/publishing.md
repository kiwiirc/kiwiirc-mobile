# Publishing

## Android

Running `ns build android` will create an Android project under `platforms/android`. This project
can be opened in Android Studio and published in the Play Store [like any other Android app](http://developer.android.com/tools/publishing/publishing_overview.html).

You can also find more information on building a signed release `.apk` [here](https://docs.nativescript.org/tooling/publishing/publishing-android-apps).

## iOS

Running `ns prepare ios --release` will generate an Xcode project at `/platforms/ios/kiwiirc-app.xcworkspace`. You can open this project on Xcode and publish it [like any other iOS app](https://developer.apple.com/library/ios/documentation/IDEs/Conceptual/AppDistributionGuide/Introduction/Introduction.html).

You can find more information on the [NativeScript publishing guide for iOS](https://docs.nativescript.org/tooling/publishing/publishing-ios-apps).

## Publishing with fastlane

You can publish the app to the App Store (iOS) and Google Play (Android) with [fastlane](https://fastlane.tools/). For more options and/or troubleshooting, see this more complete [guide](https://nativescript.org/blog/automatic-nativescript-app-deployments-with-fastlane/).

### Install fastlane

(macOS only) Make sure you have the latest version of the Xcode command line tools installed:

```bash
xcode-select --install
```

Install _fastlane_ using

```
[sudo] gem install fastlane -NV
```

or alternatively using `brew cask install fastlane`.

More info on setting up the environment [here](https://docs.fastlane.tools/).

### .env

Create `dotenv`:

```bash
cd kiwiirc-app
cp .env.default.example .env.default
```

Update the variables inside `.env.default`.

### iOS (macOS only)

#### Set up `match`

`fastlane match` makes certificate and provision profile management much easier. More on `match` 
[here](https://docs.fastlane.tools/actions/match/). The basic steps are:

1.   `fastlane match init`

2.   Update the variables `GIT_URL`, `APP_IDENTIFIER`, `USERNAME`, and `MATCH_PASSWORD` 
     in `.env.default` accordingly.

3.   Set the apple developer username and password to the variables `FASTLANE_USER` and   
     `FASTLANE_PASSWORD`. It is recommended to create a new account for this purpose, without 2FA.

4.   Get the required certificates with `fastlane match`:

  ```bash
  cd kiwiirc-app
  fastlane ios certificates
  ```

#### Send to testflight

```bash
fastlane ios ship_testflight
```

### Android

#### Set up a Google Developers Service Account

See [here](https://docs.fastlane.tools/actions/upload_to_play_store/#setup) how to do that. Copy the json data to the `PLAYSTORE_JSON_KEY_DATA` variable in `.env.default`

#### Get the required keys and keystore

1.   See [here](https://developer.android.com/studio/publish/app-signing#generate-key) how to generate a keystore.

2.   Copy the keystore file to `fastlane/keys/mobile.keystore`.

3.   In `.env.default`, set the `KEYSTORE_PASSWORD`, `KEYSTORE_ALIAS`, and `KEYSTORE_ALIAS_PASSWORD` used to generate the `keystore`.

#### Add to Google Play alpha track (internal team)

```bash
fastlane android alpha
```

#### Add to Google Play beta track

```bash
fastlane android ship_playstore
```

### The workflow

1. Increment the version in `package.json`.

    Increment:

    - `version`: the app version number. If you change this, the app will go through the review
      process and may take a couple of days to update.
    - `versionNumber`: If you only update this, the new bundle will be approved immediately.

2. Run the fastlane commands:

    ```bash
    fastlane ios beta
    fastlane android beta
    ```
