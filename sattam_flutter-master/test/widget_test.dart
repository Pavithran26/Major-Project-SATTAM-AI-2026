import 'package:flutter_test/flutter_test.dart';

import 'package:sattam_ai/main.dart';

void main() {
  testWidgets('Home page renders chat and auth actions', (
    WidgetTester tester,
  ) async {
    await tester.pumpWidget(const MyApp());

    expect(find.text('Tamil Nadu Legal AI Assistant'), findsOneWidget);
    expect(find.text('Please sign in with Clerk to continue.'), findsOneWidget);
    expect(find.text('Sign In / Sign Up'), findsOneWidget);
  });
}
