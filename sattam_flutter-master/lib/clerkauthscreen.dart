import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';

enum FirebaseAuthFlowMode { signIn, signOut }

class FirebaseAuthScreen extends StatefulWidget {
  const FirebaseAuthScreen({super.key, this.mode = FirebaseAuthFlowMode.signIn});

  final FirebaseAuthFlowMode mode;

  @override
  State<FirebaseAuthScreen> createState() => _FirebaseAuthScreenState();
}

class _FirebaseAuthScreenState extends State<FirebaseAuthScreen> {
  static const String _wallpaperAsset = 'assets/images/login_wallpaper.png';
  final FirebaseAuth _firebaseAuth = FirebaseAuth.instance;
  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();
  bool _isSignUp = false;
  bool _isLoading = false;
  String? _error;

  bool get _isSignOutFlow => widget.mode == FirebaseAuthFlowMode.signOut;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final email = _emailController.text.trim();
    final password = _passwordController.text;
    if (email.isEmpty || password.isEmpty) return;

    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      if (_isSignUp) {
        await _firebaseAuth.createUserWithEmailAndPassword(
          email: email,
          password: password,
        );
      } else {
        await _firebaseAuth.signInWithEmailAndPassword(
          email: email,
          password: password,
        );
      }
      if (!mounted) return;
      Navigator.of(context).pop(true);
    } on FirebaseAuthException catch (e) {
      setState(() {
        _error = e.message ?? 'Authentication failed.';
      });
    } catch (_) {
      setState(() {
        _error = 'Authentication failed.';
      });
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _doSignOut() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });
    try {
      await _firebaseAuth.signOut();
      if (!mounted) return;
      Navigator.of(context).pop(true);
    } catch (_) {
      setState(() {
        _error = 'Sign out failed.';
      });
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isSignOutFlow) {
      WidgetsBinding.instance.addPostFrameCallback((_) => _doSignOut());
    }

    return Scaffold(
      body: Stack(
        fit: StackFit.expand,
        children: <Widget>[
          Image.asset(_wallpaperAsset, fit: BoxFit.cover, alignment: Alignment.topCenter),
          Container(color: const Color(0x70000000)),
          SafeArea(
            child: Center(
              child: Container(
                constraints: const BoxConstraints(maxWidth: 480),
                margin: const EdgeInsets.all(16),
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: const Color(0xE6FFFFFF),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: _isSignOutFlow
                    ? Column(
                        mainAxisSize: MainAxisSize.min,
                        children: <Widget>[
                          const CircularProgressIndicator(),
                          const SizedBox(height: 10),
                          Text(_isLoading ? 'Signing out...' : 'Preparing sign out...'),
                          if (_error != null) ...<Widget>[
                            const SizedBox(height: 10),
                            Text(_error!, style: const TextStyle(color: Colors.red)),
                          ],
                        ],
                      )
                    : Column(
                        mainAxisSize: MainAxisSize.min,
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: <Widget>[
                          Text(
                            _isSignUp ? 'Create account' : 'Sign in',
                            textAlign: TextAlign.center,
                            style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w700),
                          ),
                          const SizedBox(height: 14),
                          TextField(
                            controller: _emailController,
                            keyboardType: TextInputType.emailAddress,
                            decoration: const InputDecoration(
                              labelText: 'Email',
                              border: OutlineInputBorder(),
                            ),
                          ),
                          const SizedBox(height: 12),
                          TextField(
                            controller: _passwordController,
                            obscureText: true,
                            decoration: const InputDecoration(
                              labelText: 'Password',
                              border: OutlineInputBorder(),
                            ),
                          ),
                          if (_error != null) ...<Widget>[
                            const SizedBox(height: 10),
                            Text(_error!, style: const TextStyle(color: Colors.red)),
                          ],
                          const SizedBox(height: 12),
                          FilledButton(
                            onPressed: _isLoading ? null : _submit,
                            child: Text(_isLoading ? 'Please wait...' : (_isSignUp ? 'Sign Up' : 'Sign In')),
                          ),
                          TextButton(
                            onPressed: _isLoading
                                ? null
                                : () => setState(() {
                                      _isSignUp = !_isSignUp;
                                      _error = null;
                                    }),
                            child: Text(_isSignUp ? 'Already have an account? Sign in' : 'Need an account? Sign up'),
                          ),
                        ],
                      ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
