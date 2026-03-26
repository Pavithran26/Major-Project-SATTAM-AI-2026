import 'package:flutter/material.dart';

import 'app_session.dart';
import 'chat_screen.dart';
import 'chat_service.dart';
import 'clerkauthscreen.dart';

class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  final ChatService _chatService = ChatService();

  bool _isSignedIn = false;
  String _language = 'en';
  bool _isStudyLoading = false;
  String? _studyError;
  Map<int, CategoryStudy> _studyById = <int, CategoryStudy>{};

  @override
  void initState() {
    super.initState();
    _isSignedIn = AppSession.isSignedIn.value;
    AppSession.isSignedIn.addListener(_onSessionChanged);
    if (_isSignedIn) {
      _fetchCategoryStudy();
    }
  }

  @override
  void dispose() {
    AppSession.isSignedIn.removeListener(_onSessionChanged);
    super.dispose();
  }

  void _onSessionChanged() {
    if (!mounted) return;
    setState(() {
      _isSignedIn = AppSession.isSignedIn.value;
    });
    if (_isSignedIn && _studyById.isEmpty && !_isStudyLoading) {
      _fetchCategoryStudy();
    }
  }

  bool get _isTamil => _language == 'ta';

  String _tx(String en, String ta) => _isTamil ? ta : en;

  Future<void> _fetchCategoryStudy() async {
    setState(() {
      _isStudyLoading = true;
      _studyError = null;
    });

    try {
      final list = await _chatService.fetchCategoryStudy(
        language: _language,
        k: 8,
      );
      if (!mounted) return;
      final mapped = <int, CategoryStudy>{};
      for (final item in list) {
        mapped[item.id] = item;
      }
      setState(() {
        _studyById = mapped;
      });
    } catch (error) {
      if (!mounted) return;
      setState(() {
        _studyById = <int, CategoryStudy>{};
        _studyError = error.toString();
      });
    } finally {
      if (mounted) {
        setState(() {
          _isStudyLoading = false;
        });
      }
    }
  }

  Future<bool> _openSignIn() async {
    final didSignIn = await Navigator.of(context).push<bool>(
      MaterialPageRoute(
        builder: (context) =>
            const ClerkAuthScreen(mode: ClerkAuthFlowMode.signIn),
      ),
    );
    if (!context.mounted || didSignIn != true) {
      return false;
    }
    AppSession.isSignedIn.value = true;
    return true;
  }

  Future<void> _openSignOut() async {
    final didSignOut = await Navigator.of(context).push<bool>(
      MaterialPageRoute(
        builder: (context) =>
            const ClerkAuthScreen(mode: ClerkAuthFlowMode.signOut),
      ),
    );
    if (!context.mounted || didSignOut != true) {
      return;
    }

    AppSession.isSignedIn.value = false;
    setState(() {
      _studyById = <int, CategoryStudy>{};
      _studyError = null;
    });
  }

  Future<bool> _ensureSignedIn() async {
    if (_isSignedIn) return true;
    return _openSignIn();
  }

  void _setLanguage(String value) {
    final next = value.toLowerCase().startsWith('ta') ? 'ta' : 'en';
    if (next == _language) return;
    setState(() {
      _language = next;
    });
    _fetchCategoryStudy();
  }

  Future<void> _openChat({String? category}) async {
    final ok = await _ensureSignedIn();
    if (!mounted || !ok) return;

    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (context) =>
            ChatScreen(category: category, initialLanguage: _language),
      ),
    );
  }

  Widget _buildStudyStatusBanner() {
    if (_isStudyLoading) {
      return Container(
        margin: const EdgeInsets.only(top: 8),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: const Color(0xFFECFDF5),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: const Color(0xFFA7F3D0)),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: <Widget>[
            const SizedBox(
              width: 14,
              height: 14,
              child: CircularProgressIndicator(strokeWidth: 2),
            ),
            const SizedBox(width: 8),
            Flexible(
              child: Text(
                _tx(
                  'Loading branch study details from legal database...',
                  'சட்ட தரவுத்தளத்திலிருந்து பிரிவு தகவல் ஏற்றப்படுகிறது...',
                ),
                style: const TextStyle(
                  color: Color(0xFF047857),
                  fontSize: 12.5,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ],
        ),
      );
    }

    if (_studyError != null) {
      return Container(
        margin: const EdgeInsets.only(top: 8),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: const Color(0xFFFFFBEB),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: const Color(0xFFFDE68A)),
        ),
        child: Text(
          _tx(
            'Live DB details unavailable now. Showing fallback notes.',
            'தற்போது தரவுத்தள தகவல் கிடைக்கவில்லை. மாற்று குறிப்புகள் காட்டப்படுகின்றன.',
          ),
          style: const TextStyle(
            color: Color(0xFF92400E),
            fontSize: 12.5,
            fontWeight: FontWeight.w600,
          ),
        ),
      );
    }

    return const SizedBox.shrink();
  }

  Widget _buildAuthGate() {
    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: <Color>[
            Color(0xFFECFDF5),
            Color(0xFFF0FDF4),
            Color(0xFFFFFFFF),
          ],
        ),
      ),
      child: SafeArea(
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 560),
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: const Color(0xFFE5E7EB)),
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: <Widget>[
                    Text(
                      _tx(
                        'Tamil Nadu Legal AI Assistant',
                        'தமிழ்நாடு சட்ட AI உதவியாளர்',
                      ),
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.w800,
                        color: Color(0xFF111827),
                      ),
                    ),
                    const SizedBox(height: 10),
                    Text(
                      _tx(
                        'Please sign in with Clerk to continue.',
                        'தொடர கிளார்க் மூலம் உள்நுழையவும்.',
                      ),
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                        fontSize: 14,
                        color: Color(0xFF4B5563),
                      ),
                    ),
                    const SizedBox(height: 18),
                    ElevatedButton.icon(
                      onPressed: _openSignIn,
                      icon: const Icon(Icons.login),
                      label: Text(_tx('Sign In / Sign Up', 'உள்நுழை / பதிவு')),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  void _openBranch(_Branch branch) {
    final study = _studyById[branch.id];
    final overview = (study?.overview ?? '').trim().isNotEmpty
        ? study!.overview
        : _tx(
            'This section helps you study legal basics and practical process guidance.',
            'இந்த பகுதி சட்ட அடிப்படைகள் மற்றும் நடைமுறை வழிகாட்டல்களைப் படிக்க உதவும்.',
          );
    final learn = (study?.learnPoints ?? <String>[])
        .where((item) => item.trim().isNotEmpty)
        .take(3)
        .toList();
    final refs = (study?.references ?? <String>[])
        .map((item) => item.replaceAll(RegExp(r'\s+'), ' ').trim())
        .where(
          (item) => item.isNotEmpty && !item.toLowerCase().endsWith('.pdf'),
        )
        .take(4)
        .toList();

    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      backgroundColor: Colors.white,
      builder: (context) {
        return SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                Row(
                  children: <Widget>[
                    Icon(branch.icon, color: const Color(0xFF047857)),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        _isTamil ? branch.titleTa : branch.titleEn,
                        style: const TextStyle(
                          fontSize: 21,
                          fontWeight: FontWeight.w800,
                          color: Color(0xFF111827),
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                Text(
                  _isTamil ? branch.descTa : branch.descEn,
                  style: const TextStyle(
                    color: Color(0xFF4B5563),
                    fontSize: 13,
                  ),
                ),
                const SizedBox(height: 10),
                Text(
                  overview,
                  style: const TextStyle(
                    color: Color(0xFF374151),
                    fontSize: 14,
                    height: 1.42,
                  ),
                ),
                if (study != null) ...<Widget>[
                  const SizedBox(height: 8),
                  Text(
                    _tx(
                      'Data source: Indexed legal DB (${study.sourceCount} matched chunks)',
                      'தரவு மூலம்: சட்ட தரவுத்தளம் (${study.sourceCount} பொருந்திய பகுதிகள்)',
                    ),
                    style: const TextStyle(
                      color: Color(0xFF047857),
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
                const SizedBox(height: 14),
                Text(
                  _tx('What To Study', 'படிக்க வேண்டிய முக்கிய அம்சங்கள்'),
                  style: const TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 6),
                ...((learn.isNotEmpty)
                        ? learn
                        : <String>[
                            _tx(
                              'Understand key rights and procedures in this branch.',
                              'இந்த பிரிவின் முக்கிய உரிமைகள் மற்றும் நடைமுறைகளைப் புரிந்துகொள்ளுங்கள்.',
                            ),
                            _tx(
                              'Prepare document checklist before filing.',
                              'மனுத் தாக்கலுக்கு முன் ஆவணப் பட்டியலைத் தயாரிக்கவும்.',
                            ),
                            _tx(
                              'Know where and how to escalate your issue.',
                              'உங்கள் பிரச்சினையை எங்கு, எப்படி மேல்முறையீடு செய்வது என்பதை அறியுங்கள்.',
                            ),
                          ])
                    .map(
                      (item) => Padding(
                        padding: const EdgeInsets.only(bottom: 5),
                        child: Text(
                          '• $item',
                          style: const TextStyle(fontSize: 13.5),
                        ),
                      ),
                    ),
                const SizedBox(height: 10),
                Text(
                  _tx(
                    'Acts / Process References',
                    'சட்ட / நடைமுறை குறிப்புகள்',
                  ),
                  style: const TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 6),
                ...((refs.isNotEmpty)
                        ? refs
                        : <String>[
                            _tx(
                              'Relevant Tamil Nadu legal process notes',
                              'தொடர்புடைய தமிழ்நாடு சட்ட நடைமுறை குறிப்புகள்',
                            ),
                          ])
                    .map(
                      (item) => Padding(
                        padding: const EdgeInsets.only(bottom: 5),
                        child: Text(
                          '• $item',
                          style: const TextStyle(fontSize: 13.5),
                        ),
                      ),
                    ),
                const SizedBox(height: 14),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    onPressed: () {
                      Navigator.of(context).pop();
                      _openChat(
                        category: _isTamil ? branch.titleTa : branch.titleEn,
                      );
                    },
                    icon: const Icon(Icons.chat_bubble_outline),
                    label: Text(
                      _tx(
                        'Go To Start Conversation',
                        'Start Conversation-க்கு செல்லவும்',
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    if (!_isSignedIn) {
      return Scaffold(body: _buildAuthGate());
    }

    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: <Color>[
              Color(0xFFECFDF5),
              Color(0xFFF0FDF4),
              Color(0xFFFFFFFF),
            ],
          ),
        ),
        child: SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
            child: Center(
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 1200),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: <Widget>[
                    LayoutBuilder(
                      builder: (context, constraints) {
                        final compact = constraints.maxWidth < 860;
                        final controls = <Widget>[
                          Chip(
                            label: Text(_tx('Signed In', 'உள்நுழைந்தது')),
                            avatar: const Icon(Icons.verified_user, size: 16),
                          ),
                          OutlinedButton.icon(
                            onPressed: _openSignOut,
                            icon: const Icon(Icons.logout),
                            label: Text(_tx('Sign Out', 'வெளியேறு')),
                          ),
                          SegmentedButton<String>(
                            segments: const <ButtonSegment<String>>[
                              ButtonSegment<String>(
                                value: 'en',
                                label: Text('EN'),
                              ),
                              ButtonSegment<String>(
                                value: 'ta',
                                label: Text('TA'),
                              ),
                            ],
                            selected: <String>{_language},
                            onSelectionChanged: (set) =>
                                _setLanguage(set.first),
                          ),
                        ];

                        if (compact) {
                          return Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: <Widget>[
                              Text(
                                _tx(
                                  'Tamil Nadu Legal AI Assistant',
                                  'தமிழ்நாடு சட்ட AI உதவியாளர்',
                                ),
                                style: const TextStyle(
                                  fontSize: 22,
                                  fontWeight: FontWeight.w800,
                                ),
                              ),
                              const SizedBox(height: 10),
                              Wrap(
                                spacing: 8,
                                runSpacing: 8,
                                children: controls,
                              ),
                            ],
                          );
                        }

                        return Row(
                          children: <Widget>[
                            Expanded(
                              child: Text(
                                _tx(
                                  'Tamil Nadu Legal AI Assistant',
                                  'தமிழ்நாடு சட்ட AI உதவியாளர்',
                                ),
                                style: const TextStyle(
                                  fontSize: 22,
                                  fontWeight: FontWeight.w800,
                                ),
                              ),
                            ),
                            ...controls.expand(
                              (widget) => <Widget>[
                                widget,
                                const SizedBox(width: 8),
                              ],
                            ),
                          ]..removeLast(),
                        );
                      },
                    ),
                    const SizedBox(height: 16),
                    Container(
                      padding: const EdgeInsets.fromLTRB(18, 18, 18, 18),
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                          colors: <Color>[Color(0xFFFFFFFF), Color(0xFFF0FDF4)],
                        ),
                        borderRadius: BorderRadius.circular(18),
                        border: Border.all(color: const Color(0xFFD1FAE5)),
                        boxShadow: const <BoxShadow>[
                          BoxShadow(
                            color: Color(0x10000000),
                            blurRadius: 14,
                            offset: Offset(0, 8),
                          ),
                        ],
                      ),
                      child: Column(
                        children: <Widget>[
                          Text(
                            _tx(
                              'Get instant guidance on Tamil Nadu laws, acts, and legal procedures.',
                              'தமிழ்நாடு சட்டங்கள் மற்றும் நடைமுறைகள் குறித்த உடனடி வழிகாட்டலைப் பெறுங்கள்.',
                            ),
                            textAlign: TextAlign.center,
                            style: const TextStyle(
                              fontSize: 16,
                              color: Color(0xFF374151),
                              height: 1.35,
                            ),
                          ),
                          const SizedBox(height: 14),
                          ElevatedButton.icon(
                            onPressed: _openChat,
                            style: ElevatedButton.styleFrom(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 18,
                                vertical: 12,
                              ),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12),
                              ),
                            ),
                            icon: const Icon(Icons.chat),
                            label: Text(
                              _tx(
                                'Start Conversation',
                                'உரையாடலைத் தொடங்கவும்',
                              ),
                            ),
                          ),
                          _buildStudyStatusBanner(),
                        ],
                      ),
                    ),
                    const SizedBox(height: 20),
                    Text(
                      _tx(
                        'Browse 12 Legal Branches',
                        '12 சட்ட பிரிவுகளை உலாவு',
                      ),
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                        fontSize: 26,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    const SizedBox(height: 12),
                    LayoutBuilder(
                      builder: (context, constraints) {
                        int columns = 1;
                        if (constraints.maxWidth >= 1100) {
                          columns = 4;
                        } else if (constraints.maxWidth >= 840) {
                          columns = 3;
                        } else if (constraints.maxWidth >= 560) {
                          columns = 2;
                        }
                        return GridView.builder(
                          shrinkWrap: true,
                          physics: const NeverScrollableScrollPhysics(),
                          itemCount: _branches.length,
                          gridDelegate:
                              SliverGridDelegateWithFixedCrossAxisCount(
                                crossAxisCount: columns,
                                mainAxisSpacing: 12,
                                crossAxisSpacing: 12,
                                childAspectRatio: columns == 1 ? 2.2 : 1.25,
                              ),
                          itemBuilder: (context, index) {
                            final branch = _branches[index];
                            return InkWell(
                              onTap: () => _openBranch(branch),
                              borderRadius: BorderRadius.circular(14),
                              child: Ink(
                                padding: const EdgeInsets.all(14),
                                decoration: BoxDecoration(
                                  color: Colors.white,
                                  borderRadius: BorderRadius.circular(14),
                                  border: Border.all(
                                    color: const Color(0xFFE5E7EB),
                                  ),
                                  boxShadow: const <BoxShadow>[
                                    BoxShadow(
                                      color: Color(0x0D000000),
                                      blurRadius: 8,
                                      offset: Offset(0, 4),
                                    ),
                                  ],
                                ),
                                child: Row(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: <Widget>[
                                    Container(
                                      width: 40,
                                      height: 40,
                                      decoration: BoxDecoration(
                                        gradient: const LinearGradient(
                                          begin: Alignment.topLeft,
                                          end: Alignment.bottomRight,
                                          colors: <Color>[
                                            Color(0xFFD1FAE5),
                                            Color(0xFFA7F3D0),
                                          ],
                                        ),
                                        borderRadius: BorderRadius.circular(10),
                                      ),
                                      child: Icon(
                                        branch.icon,
                                        color: const Color(0xFF047857),
                                        size: 22,
                                      ),
                                    ),
                                    const SizedBox(width: 10),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment:
                                            CrossAxisAlignment.start,
                                        children: <Widget>[
                                          Text(
                                            _isTamil
                                                ? branch.titleTa
                                                : branch.titleEn,
                                            style: const TextStyle(
                                              fontSize: 14.5,
                                              fontWeight: FontWeight.w700,
                                            ),
                                          ),
                                          const SizedBox(height: 6),
                                          Text(
                                            _isTamil
                                                ? branch.descTa
                                                : branch.descEn,
                                            style: const TextStyle(
                                              color: Color(0xFF4B5563),
                                              fontSize: 12.5,
                                              height: 1.3,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            );
                          },
                        );
                      },
                    ),
                    const SizedBox(height: 18),
                    Container(
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: const Color(0xFFFFFBEB),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: const Color(0xFFFDE68A)),
                      ),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: <Widget>[
                          const Padding(
                            padding: EdgeInsets.only(top: 1),
                            child: Icon(
                              Icons.info_outline,
                              size: 16,
                              color: Color(0xFF92400E),
                            ),
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              _tx(
                                'Disclaimer: This assistant provides legal information based on Tamil Nadu laws.',
                                'மறுப்பு: இந்த உதவியாளர் தமிழ்நாடு சட்ட அடிப்படையிலான தகவலை வழங்குகிறது.',
                              ),
                              style: const TextStyle(
                                color: Color(0xFF92400E),
                                fontSize: 12.5,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _Branch {
  const _Branch({
    required this.id,
    required this.icon,
    required this.titleEn,
    required this.titleTa,
    required this.descEn,
    required this.descTa,
  });

  final int id;
  final IconData icon;
  final String titleEn;
  final String titleTa;
  final String descEn;
  final String descTa;
}

const List<_Branch> _branches = <_Branch>[
  _Branch(
    id: 1,
    icon: Icons.home_outlined,
    titleEn: 'Property & Land Laws',
    titleTa: 'சொத்து & நிலச் சட்டங்கள்',
    descEn: 'Land disputes, property registration, tenant rights',
    descTa: 'நில விவகாரங்கள், சொத்து பதிவு, குடியிருப்பாளர் உரிமைகள்',
  ),
  _Branch(
    id: 2,
    icon: Icons.directions_car_outlined,
    titleEn: 'Accident & Motor Vehicle',
    titleTa: 'விபத்து & மோட்டார் வாகனம்',
    descEn: 'Road accidents, insurance claims, traffic violations',
    descTa: 'சாலை விபத்துகள், காப்பீட்டு கோரிக்கைகள், போக்குவரத்து மீறல்கள்',
  ),
  _Branch(
    id: 3,
    icon: Icons.work_outline,
    titleEn: 'Employment & Labor',
    titleTa: 'வேலைவாய்ப்பு & தொழிலாளர்',
    descEn: 'Workplace rights, wages, termination disputes',
    descTa: 'பணியிட உரிமைகள், ஊதியங்கள், பணிநீக்கம் விவகாரங்கள்',
  ),
  _Branch(
    id: 4,
    icon: Icons.favorite_border,
    titleEn: 'Family & Marriage',
    titleTa: 'குடும்பம் & திருமணம்',
    descEn: 'Divorce, maintenance, child custody, inheritance',
    descTa: 'விவாகரத்து, பராமரிப்பு, குழந்தை வளர்ப்பு, பாரம்பரியம்',
  ),
  _Branch(
    id: 5,
    icon: Icons.gavel_outlined,
    titleEn: 'Civil Disputes',
    titleTa: 'சிவில் வழக்குகள்',
    descEn: 'Consumer complaints, contract issues, monetary disputes',
    descTa: 'நுகர்வோர் புகார்கள், ஒப்பந்த பிரச்சனைகள், பண விவகாரங்கள்',
  ),
  _Branch(
    id: 6,
    icon: Icons.shield_outlined,
    titleEn: 'Criminal Laws',
    titleTa: 'குற்றவியல் சட்டங்கள்',
    descEn: 'FIR procedures, bail, court proceedings',
    descTa: 'FIR நடைமுறைகள், ஜாமீன், நீதிமன்ற நடைமுறைகள்',
  ),
  _Branch(
    id: 7,
    icon: Icons.menu_book_outlined,
    titleEn: 'Education Rights',
    titleTa: 'கல்வி உரிமைகள்',
    descEn: 'Admission issues, reservation policies, fee structure',
    descTa: 'சேர்க்கை பிரச்சனைகள், இடஒதுக்கீடு கொள்கைகள், கட்டண அமைப்பு',
  ),
  _Branch(
    id: 8,
    icon: Icons.account_balance_outlined,
    titleEn: 'Government Schemes',
    titleTa: 'அரசு திட்டங்கள்',
    descEn: 'TN welfare schemes, subsidies, application procedures',
    descTa: 'தமிழ்நாடு நலத்திட்டங்கள், மானியங்கள், விண்ணப்ப நடைமுறைகள்',
  ),
  _Branch(
    id: 9,
    icon: Icons.description_outlined,
    titleEn: 'RTI & Official Matters',
    titleTa: 'RTI & அதிகாரப்பூர்வ விஷயங்கள்',
    descEn: 'Right to Information, official document procedures',
    descTa: 'தகவல் அறியும் உரிமை, அதிகாரப்பூர்வ ஆவண நடைமுறைகள்',
  ),
  _Branch(
    id: 10,
    icon: Icons.group_outlined,
    titleEn: 'Women & Child Rights',
    titleTa: 'பெண்கள் & குழந்தை உரிமைகள்',
    descEn: 'Protection laws, harassment, child welfare',
    descTa: 'பாதுகாப்பு சட்டங்கள், துன்புறுத்தல், குழந்தை நலன்',
  ),
  _Branch(
    id: 11,
    icon: Icons.school_outlined,
    titleEn: 'Professional Regulations',
    titleTa: 'தொழில்முறை விதிமுறைகள்',
    descEn: 'Medical, legal, engineering professional conduct',
    descTa: 'மருத்துவ, சட்ட, பொறியியல் தொழில்முறை நடத்தை',
  ),
  _Branch(
    id: 12,
    icon: Icons.security_outlined,
    titleEn: 'Cyber & Digital Laws',
    titleTa: 'சைபர் & டிஜிட்டல் சட்டங்கள்',
    descEn: 'Online fraud, data privacy, digital signatures',
    descTa: 'ஆன்லைன் மோசடி, தரவு தனியுரிமை, டிஜிட்டல் கையொப்பங்கள்',
  ),
];
