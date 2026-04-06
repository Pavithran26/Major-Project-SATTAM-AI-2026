import 'package:flutter/foundation.dart';
import 'package:firebase_auth/firebase_auth.dart';

class AppSession {
  static final ValueNotifier<bool> isSignedIn = ValueNotifier<bool>(false);
  static bool _isBound = false;

  static void bindFirebaseAuth(FirebaseAuth auth) {
    if (_isBound) return;
    _isBound = true;
    isSignedIn.value = auth.currentUser != null;
    auth.authStateChanges().listen((user) {
      isSignedIn.value = user != null;
    });
  }
}
