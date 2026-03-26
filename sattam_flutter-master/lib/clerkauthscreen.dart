import 'package:clerk_flutter/clerk_flutter.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';

enum ClerkAuthFlowMode { signIn, signOut }

class ClerkAuthScreen extends StatefulWidget {
  const ClerkAuthScreen({super.key, this.mode = ClerkAuthFlowMode.signIn});

  final ClerkAuthFlowMode mode;

  @override
  State<ClerkAuthScreen> createState() => _ClerkAuthScreenState();
}

class _ClerkAuthScreenState extends State<ClerkAuthScreen> {
  static const String _wallpaperAsset = 'assets/images/login_wallpaper.png';
  bool _handledResult = false;
  bool _triggeredSignOut = false;

  bool get _isSignOutFlow => widget.mode == ClerkAuthFlowMode.signOut;

  void _complete(bool value) {
    if (_handledResult) return;
    _handledResult = true;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      Navigator.of(context).pop(value);
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        fit: StackFit.expand,
        children: <Widget>[
          Image.asset(
            _wallpaperAsset,
            fit: BoxFit.cover,
            alignment: Alignment.topCenter,
          ),
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
                child: kIsWeb
                    ? const Text(
                        "Clerk native auth is disabled on web in this app configuration.",
                        textAlign: TextAlign.center,
                      )
                    : ClerkAuthBuilder(
                        signedInBuilder: (context, authState) {
                          if (!_isSignOutFlow) {
                            _complete(true);
                            return const Center(
                              child: CircularProgressIndicator(),
                            );
                          }

                          if (!_triggeredSignOut) {
                            _triggeredSignOut = true;
                            WidgetsBinding.instance.addPostFrameCallback((
                              _,
                            ) async {
                              if (!mounted) return;
                              try {
                                await authState.safelyCall(
                                  context,
                                  () => authState.signOut(),
                                );
                                _complete(true);
                              } catch (_) {
                                _complete(false);
                              }
                            });
                          }

                          return const Center(
                            child: CircularProgressIndicator(),
                          );
                        },
                        signedOutBuilder: (context, _) {
                          if (_isSignOutFlow) {
                            _complete(true);
                            return const Center(
                              child: CircularProgressIndicator(),
                            );
                          }
                          return const ClerkAuthentication();
                        },
                      ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
