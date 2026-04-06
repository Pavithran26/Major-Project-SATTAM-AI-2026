import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/foundation.dart' show defaultTargetPlatform, kIsWeb, TargetPlatform;

class DefaultFirebaseOptions {
  static FirebaseOptions get currentPlatform {
    if (kIsWeb) {
      return web;
    }

    switch (defaultTargetPlatform) {
      case TargetPlatform.android:
        return android;
      case TargetPlatform.iOS:
        return ios;
      case TargetPlatform.macOS:
        return macos;
      case TargetPlatform.windows:
        return windows;
      case TargetPlatform.linux:
        return linux;
      default:
        throw UnsupportedError('DefaultFirebaseOptions are not supported for this platform.');
    }
  }

  static const FirebaseOptions web = FirebaseOptions(
    apiKey: 'AIzaSyCzhIBFieUphQjF8cOir5_acZHobc4WxLg',
    authDomain: 'sattam-ai-57938.firebaseapp.com',
    projectId: 'sattam-ai-57938',
    storageBucket: 'sattam-ai-57938.firebasestorage.app',
    messagingSenderId: '930621796365',
    appId: '1:930621796365:web:bff540b361beffb4756544',
    measurementId: 'G-JLZG7MM4XD',
  );

  // Placeholder mobile/desktop app IDs. Replace with platform-specific IDs if you create native Firebase apps.
  static const FirebaseOptions android = FirebaseOptions(
    apiKey: 'AIzaSyCzhIBFieUphQjF8cOir5_acZHobc4WxLg',
    appId: '1:930621796365:android:replace-with-android-app-id',
    messagingSenderId: '930621796365',
    projectId: 'sattam-ai-57938',
    storageBucket: 'sattam-ai-57938.firebasestorage.app',
  );

  static const FirebaseOptions ios = FirebaseOptions(
    apiKey: 'AIzaSyCzhIBFieUphQjF8cOir5_acZHobc4WxLg',
    appId: '1:930621796365:ios:replace-with-ios-app-id',
    messagingSenderId: '930621796365',
    projectId: 'sattam-ai-57938',
    storageBucket: 'sattam-ai-57938.firebasestorage.app',
    iosBundleId: 'com.example.sattamAi',
  );

  static const FirebaseOptions macos = FirebaseOptions(
    apiKey: 'AIzaSyCzhIBFieUphQjF8cOir5_acZHobc4WxLg',
    appId: '1:930621796365:ios:replace-with-macos-app-id',
    messagingSenderId: '930621796365',
    projectId: 'sattam-ai-57938',
    storageBucket: 'sattam-ai-57938.firebasestorage.app',
    iosBundleId: 'com.example.sattamAi',
  );

  static const FirebaseOptions windows = FirebaseOptions(
    apiKey: 'AIzaSyCzhIBFieUphQjF8cOir5_acZHobc4WxLg',
    appId: '1:930621796365:web:bff540b361beffb4756544',
    messagingSenderId: '930621796365',
    projectId: 'sattam-ai-57938',
    storageBucket: 'sattam-ai-57938.firebasestorage.app',
  );

  static const FirebaseOptions linux = FirebaseOptions(
    apiKey: 'AIzaSyCzhIBFieUphQjF8cOir5_acZHobc4WxLg',
    appId: '1:930621796365:web:bff540b361beffb4756544',
    messagingSenderId: '930621796365',
    projectId: 'sattam-ai-57938',
    storageBucket: 'sattam-ai-57938.firebasestorage.app',
  );
}
