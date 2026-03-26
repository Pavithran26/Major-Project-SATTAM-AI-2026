import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'package:clerk_flutter/clerk_flutter.dart';
import 'homepage.dart';

const Color _emeraldPrimary = Color(0xFF059669); // emerald-600
const Color _greenAccent = Color(0xFF16A34A); // green-600

void main() {
  const app = MyApp();

  // clerk_flutter currently relies on path_provider storage that is not
  // available on web in this project setup.
  if (kIsWeb) {
    runApp(app);
    return;
  }

  runApp(
    ClerkAuth(
      config: ClerkAuthConfig(
        publishableKey: 'pk_test_d29ya2luZy1ob3VuZC02MS5jbGVyay5hY2NvdW50cy5kZXYk',
      ),
      child: app,
    ),
  );
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});
  @override
  Widget build(BuildContext context) {
    final scheme = ColorScheme.fromSeed(
      seedColor: _emeraldPrimary,
      primary: _emeraldPrimary,
      secondary: _greenAccent,
      brightness: Brightness.light,
    );

    return MaterialApp(
      title: 'Sattam AI',
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: scheme,
        scaffoldBackgroundColor: const Color(0xFFF0FDF4),
        appBarTheme: const AppBarTheme(
          backgroundColor: _emeraldPrimary,
          foregroundColor: Colors.white,
          centerTitle: true,
        ),
        elevatedButtonTheme: ElevatedButtonThemeData(
          style: ElevatedButton.styleFrom(
            backgroundColor: _emeraldPrimary,
            foregroundColor: Colors.white,
          ),
        ),
        filledButtonTheme: FilledButtonThemeData(
          style: FilledButton.styleFrom(
            backgroundColor: _emeraldPrimary,
            foregroundColor: Colors.white,
          ),
        ),
        outlinedButtonTheme: OutlinedButtonThemeData(
          style: OutlinedButton.styleFrom(
            foregroundColor: _emeraldPrimary,
            side: const BorderSide(color: _emeraldPrimary),
          ),
        ),
        progressIndicatorTheme: const ProgressIndicatorThemeData(
          color: _emeraldPrimary,
        ),
      ),
      home: const HomePage(),
    );
  }
}
