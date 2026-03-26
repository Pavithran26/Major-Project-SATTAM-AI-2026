import 'package:flutter/material.dart';

import 'app_session.dart';
import 'chat_service.dart';

class ChatScreen extends StatefulWidget {
  const ChatScreen({super.key, this.category, this.initialLanguage = 'en'});

  final String? category;
  final String initialLanguage;

  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  final TextEditingController _controller = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  final ChatService _chatService = ChatService();
  final List<_UiMessage> _messages = <_UiMessage>[];
  static final RegExp _tamilScriptRegex = RegExp(r'[\u0B80-\u0BFF]');

  late String _language;
  String? _sessionId;
  bool _isLoading = false;
  bool _isHistoryOpen = false;
  bool _isHistoryLoading = false;
  List<ChatSessionSummary> _historySessions = <ChatSessionSummary>[];

  @override
  void initState() {
    super.initState();
    _language = widget.initialLanguage.toLowerCase().startsWith('ta')
        ? 'ta'
        : 'en';
    _messages.add(_welcomeMessage());
  }

  @override
  void dispose() {
    _controller.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  bool get _isTamil => _language == 'ta';

  String _tx(String en, String ta) => _isTamil ? ta : en;

  _UiMessage _welcomeMessage() {
    final text = _isTamil
        ? 'வணக்கம்! நான் உங்கள் தமிழ்நாடு சட்ட உதவியாளர். ${widget.category != null ? "${widget.category} குறித்து " : ""}உங்கள் சட்ட நிலைமையை விரிவாக எழுதுங்கள்.'
        : "Hello! I'm your Tamil Nadu Legal Assistant. ${widget.category != null ? "I can help with ${widget.category}. " : ''}Please describe your legal issue in detail.";
    return _UiMessage(
      id: 'welcome-${DateTime.now().millisecondsSinceEpoch}',
      content: text,
      isUser: false,
      timestamp: DateTime.now(),
    );
  }

  void _setLanguage(String nextLanguage) {
    final safe = nextLanguage.toLowerCase().startsWith('ta') ? 'ta' : 'en';
    if (safe == _language) return;
    setState(() {
      _language = safe;
      if (_messages.length == 1 && _messages.first.id.startsWith('welcome-')) {
        _messages[0] = _welcomeMessage();
      }
    });
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!_scrollController.hasClients) return;
      _scrollController.animateTo(
        _scrollController.position.maxScrollExtent,
        duration: const Duration(milliseconds: 220),
        curve: Curves.easeOut,
      );
    });
  }

  bool _shouldHideReferences(String answer) {
    final text = answer.toLowerCase();
    return text.contains('quota is exceeded') ||
        text.contains('llm quota') ||
        text.contains('ai generation is currently unavailable') ||
        text.contains('api key is invalid or unauthorized') ||
        text.contains('missing api key') ||
        text.contains('unauthorized') ||
        text.contains('billing/quota') ||
        text.contains('api key செல்லுபடியாக இல்லை');
  }

  List<_UiReference> _toReferences(List<String> sources) {
    final seen = <String>{};
    final sanitized = <String>[];
    final pdfRegex = RegExp(
      r'(^|[\\/])[^\\/\s]+\.pdf($|[?#\s])',
      caseSensitive: false,
    );

    for (final raw in sources) {
      final value = raw.replaceAll(RegExp(r'\s+'), ' ').trim();
      if (value.isEmpty || pdfRegex.hasMatch(value)) continue;
      final key = value.toLowerCase();
      if (!seen.add(key)) continue;
      sanitized.add(value);
      if (sanitized.length >= 5) break;
    }

    return sanitized.asMap().entries.map((entry) {
      final source = entry.value;
      final isUrl =
          source.startsWith('http://') || source.startsWith('https://');
      final title = isUrl
          ? _tx('Reference ${entry.key + 1}', 'குறிப்பு ${entry.key + 1}')
          : (source.length > 180 ? '${source.substring(0, 177)}...' : source);
      return _UiReference(
        title: title,
        source: source,
        type: isUrl ? 'Link' : _tx('Excerpt', 'உள்ளடக்கம்'),
      );
    }).toList();
  }

  String _effectiveLanguageForPrompt(String prompt) {
    if (_tamilScriptRegex.hasMatch(prompt)) {
      return 'ta';
    }
    return _language;
  }

  Future<void> _send() async {
    final prompt = _controller.text.trim();
    if (prompt.isEmpty || _isLoading) return;
    final effectiveLanguage = _effectiveLanguageForPrompt(prompt);

    setState(() {
      _messages.add(
        _UiMessage(
          id: DateTime.now().microsecondsSinceEpoch.toString(),
          content: prompt,
          isUser: true,
          timestamp: DateTime.now(),
        ),
      );
      _controller.clear();
      _isLoading = true;
    });
    _scrollToBottom();

    try {
      final result = await _chatService.sendMessage(
        prompt,
        language: effectiveLanguage,
        sessionId: _sessionId,
      );
      final hide = _shouldHideReferences(result.answer);
      final refs = hide ? <_UiReference>[] : _toReferences(result.sources);

      setState(() {
        _sessionId = result.sessionId ?? _sessionId;
        _messages.add(
          _UiMessage(
            id: (DateTime.now().microsecondsSinceEpoch + 1).toString(),
            content: result.answer.isEmpty
                ? _tx(
                    'No answer was returned from backend.',
                    'பின்தளத்திலிருந்து பதில் கிடைக்கவில்லை.',
                  )
                : result.answer,
            isUser: false,
            timestamp: DateTime.now(),
            references: refs,
          ),
        );
      });
    } catch (_) {
      setState(() {
        _messages.add(
          _UiMessage(
            id: (DateTime.now().microsecondsSinceEpoch + 1).toString(),
            content: _tx(
              'The backend is unavailable or returned an error. Please try again.',
              'பின்தள சேவையில் பிழை ஏற்பட்டது. தயவுசெய்து மீண்டும் முயற்சிக்கவும்.',
            ),
            isUser: false,
            timestamp: DateTime.now(),
          ),
        );
      });
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
      _scrollToBottom();
    }
  }

  Future<void> _fetchSessions() async {
    setState(() {
      _isHistoryLoading = true;
    });
    try {
      final sessions = await _chatService.fetchSessions(limit: 30);
      if (!mounted) return;
      setState(() {
        _historySessions = sessions;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _historySessions = <ChatSessionSummary>[];
      });
    } finally {
      if (mounted) {
        setState(() {
          _isHistoryLoading = false;
        });
      }
    }
  }

  Future<void> _toggleHistory() async {
    final next = !_isHistoryOpen;
    setState(() {
      _isHistoryOpen = next;
    });
    if (next) {
      await _fetchSessions();
    }
  }

  Future<void> _loadSession(String sessionId) async {
    setState(() {
      _isHistoryLoading = true;
    });
    try {
      final history = await _chatService.fetchSessionHistory(sessionId);
      final mapped = history.messages.map((item) {
        final isUser = item.role == 'user';
        final refs = (!isUser && !_shouldHideReferences(item.content))
            ? _toReferences(item.sources)
            : <_UiReference>[];
        return _UiMessage(
          id: '${history.sessionId}-${item.createdAt.microsecondsSinceEpoch}-${item.role}',
          content: item.content,
          isUser: isUser,
          timestamp: item.createdAt,
          references: refs,
        );
      }).toList();

      if (!mounted) return;
      setState(() {
        _sessionId = history.sessionId;
        _isHistoryOpen = false;
        _messages
          ..clear()
          ..addAll(mapped.isEmpty ? <_UiMessage>[_welcomeMessage()] : mapped);
      });
      _scrollToBottom();
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _messages.add(
          _UiMessage(
            id: 'history-error-${DateTime.now().millisecondsSinceEpoch}',
            content: _tx(
              'Could not load that conversation history.',
              'அந்த உரையாடல் வரலாற்றை ஏற்ற முடியவில்லை.',
            ),
            isUser: false,
            timestamp: DateTime.now(),
          ),
        );
      });
    } finally {
      if (mounted) {
        setState(() {
          _isHistoryLoading = false;
        });
      }
    }
  }

  void _newConversation() {
    setState(() {
      _sessionId = null;
      _isHistoryOpen = false;
      _messages
        ..clear()
        ..add(_welcomeMessage());
    });
  }

  String _formatTime(DateTime time) {
    final hh = time.hour.toString().padLeft(2, '0');
    final mm = time.minute.toString().padLeft(2, '0');
    return '$hh:$mm';
  }

  @override
  Widget build(BuildContext context) {
    if (!AppSession.isSignedIn.value) {
      return Scaffold(
        appBar: AppBar(title: const Text('Sattam AI Chat')),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Text(
              _tx(
                'Please sign in first to access Legal Chat.',
                'சட்ட அரட்டையை அணுக முதலில் உள்நுழையவும்.',
              ),
              textAlign: TextAlign.center,
            ),
          ),
        ),
      );
    }

    final quickSuggestions = <String>[
      _tx('Property dispute resolution', 'சொத்து விவகார தீர்வு'),
      _tx('Police complaint procedure', 'போலீஸ் புகார் நடைமுறை'),
      _tx('Legal aid eligibility', 'சட்ட உதவி தகுதி'),
      _tx('Court fee structure', 'நீதிமன்ற கட்டண அமைப்பு'),
    ];

    return Scaffold(
      backgroundColor: const Color(0xFFF9FAFB),
      body: SafeArea(
        child: Column(
          children: <Widget>[
            Container(
              padding: const EdgeInsets.fromLTRB(10, 10, 10, 8),
              decoration: const BoxDecoration(
                color: Colors.white,
                border: Border(bottom: BorderSide(color: Color(0xFFE5E7EB))),
              ),
              child: Column(
                children: <Widget>[
                  Row(
                    children: <Widget>[
                      IconButton(
                        onPressed: () => Navigator.of(context).pop(),
                        icon: const Icon(Icons.arrow_back),
                      ),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: <Widget>[
                            Text(
                              _tx(
                                'Legal Assistant Chat',
                                'சட்ட உதவியாளர் அரட்டை',
                              ),
                              style: const TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                            if ((widget.category ?? '').trim().isNotEmpty)
                              Text(
                                _tx(
                                  'Category: ${widget.category}',
                                  'வகை: ${widget.category}',
                                ),
                                style: const TextStyle(
                                  fontSize: 12,
                                  color: Color(0xFF047857),
                                ),
                              ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    crossAxisAlignment: WrapCrossAlignment.center,
                    children: <Widget>[
                      OutlinedButton.icon(
                        onPressed: _newConversation,
                        icon: const Icon(Icons.add_circle_outline, size: 16),
                        label: Text(_tx('New', 'புது')),
                      ),
                      OutlinedButton.icon(
                        onPressed: _toggleHistory,
                        icon: const Icon(Icons.history, size: 16),
                        label: Text(_tx('History', 'வரலாறு')),
                      ),
                      SegmentedButton<String>(
                        segments: const <ButtonSegment<String>>[
                          ButtonSegment<String>(
                            value: 'en',
                            label: Text('English'),
                          ),
                          ButtonSegment<String>(
                            value: 'ta',
                            label: Text('தமிழ்'),
                          ),
                        ],
                        selected: <String>{_language},
                        onSelectionChanged: (set) => _setLanguage(set.first),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            if (_isHistoryOpen)
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(10),
                color: Colors.white,
                child: _isHistoryLoading
                    ? Text(
                        _tx('Loading history...', 'வரலாறு ஏற்றப்படுகிறது...'),
                      )
                    : _historySessions.isEmpty
                    ? Text(
                        _tx(
                          'No saved conversations yet.',
                          'சேமிக்கப்பட்ட உரையாடல்கள் இல்லை.',
                        ),
                      )
                    : ConstrainedBox(
                        constraints: const BoxConstraints(maxHeight: 190),
                        child: ListView.builder(
                          itemCount: _historySessions.length,
                          itemBuilder: (context, index) {
                            final session = _historySessions[index];
                            return ListTile(
                              dense: true,
                              contentPadding: const EdgeInsets.symmetric(
                                horizontal: 6,
                              ),
                              title: Text(
                                session.title,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                              subtitle: Text(
                                '${_formatTime(session.updatedAt)} • ${session.messageCount} ${_tx('messages', 'செய்திகள்')}',
                              ),
                              onTap: () => _loadSession(session.sessionId),
                            );
                          },
                        ),
                      ),
              ),
            Expanded(
              child: ListView.builder(
                controller: _scrollController,
                padding: const EdgeInsets.fromLTRB(10, 10, 10, 8),
                itemCount: _messages.length + (_isLoading ? 1 : 0),
                itemBuilder: (context, index) {
                  if (_isLoading && index == _messages.length) {
                    return Align(
                      alignment: Alignment.centerLeft,
                      child: Container(
                        margin: const EdgeInsets.only(bottom: 8),
                        padding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 10,
                        ),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          border: Border.all(color: const Color(0xFFE5E7EB)),
                          borderRadius: BorderRadius.circular(14),
                        ),
                        child: Text(
                          _tx('AI is thinking...', 'AI யோசிக்கிறது...'),
                        ),
                      ),
                    );
                  }

                  final msg = _messages[index];
                  return Align(
                    alignment: msg.isUser
                        ? Alignment.centerRight
                        : Alignment.centerLeft,
                    child: Container(
                      margin: const EdgeInsets.only(bottom: 8),
                      padding: const EdgeInsets.all(10),
                      constraints: BoxConstraints(
                        maxWidth: MediaQuery.sizeOf(context).width * 0.88,
                      ),
                      decoration: BoxDecoration(
                        color: msg.isUser
                            ? const Color(0xFFD1FAE5)
                            : Colors.white,
                        border: Border.all(color: const Color(0xFFE5E7EB)),
                        borderRadius: BorderRadius.circular(14),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: <Widget>[
                          Text(
                            msg.content,
                            style: const TextStyle(fontSize: 14, height: 1.38),
                          ),
                          if (!msg.isUser &&
                              msg.references.isNotEmpty) ...<Widget>[
                            const SizedBox(height: 8),
                            const Divider(height: 1),
                            const SizedBox(height: 8),
                            Text(
                              _tx('References', 'குறிப்புகள்'),
                              style: const TextStyle(
                                fontWeight: FontWeight.w700,
                                fontSize: 12.5,
                              ),
                            ),
                            const SizedBox(height: 6),
                            ...msg.references.map(
                              (ref) => Padding(
                                padding: const EdgeInsets.only(bottom: 4),
                                child: Text(
                                  '• ${ref.title}',
                                  style: const TextStyle(fontSize: 12.5),
                                ),
                              ),
                            ),
                          ],
                          const SizedBox(height: 4),
                          Align(
                            alignment: Alignment.centerRight,
                            child: Text(
                              _formatTime(msg.timestamp),
                              style: const TextStyle(
                                color: Color(0xFF6B7280),
                                fontSize: 11,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),
            ),
            Container(
              decoration: const BoxDecoration(
                color: Colors.white,
                border: Border(top: BorderSide(color: Color(0xFFE5E7EB))),
              ),
              padding: const EdgeInsets.fromLTRB(10, 8, 10, 10),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: <Widget>[
                  Row(
                    children: <Widget>[
                      Expanded(
                        child: TextField(
                          controller: _controller,
                          minLines: 1,
                          maxLines: 4,
                          textInputAction: TextInputAction.send,
                          onSubmitted: (_) => _send(),
                          decoration: InputDecoration(
                            hintText: _tx(
                              'Describe your legal situation here...',
                              'உங்கள் சட்ட நிலைமையை இங்கே விவரிக்கவும்...',
                            ),
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                            isDense: true,
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      IconButton.filled(
                        onPressed: _isLoading ? null : _send,
                        icon: const Icon(Icons.send),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(
                    _tx('Quick suggestions:', 'விரைவு பரிந்துரைகள்:'),
                    style: const TextStyle(
                      fontSize: 12,
                      color: Color(0xFF6B7280),
                    ),
                  ),
                  const SizedBox(height: 6),
                  Wrap(
                    spacing: 6,
                    runSpacing: 6,
                    children: quickSuggestions
                        .map(
                          (item) => ActionChip(
                            label: Text(item),
                            onPressed: () => _controller.text = item,
                          ),
                        )
                        .toList(),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _UiMessage {
  _UiMessage({
    required this.id,
    required this.content,
    required this.isUser,
    required this.timestamp,
    this.references = const <_UiReference>[],
  });

  final String id;
  final String content;
  final bool isUser;
  final DateTime timestamp;
  final List<_UiReference> references;
}

class _UiReference {
  _UiReference({required this.title, required this.source, required this.type});

  final String title;
  final String source;
  final String type;
}
