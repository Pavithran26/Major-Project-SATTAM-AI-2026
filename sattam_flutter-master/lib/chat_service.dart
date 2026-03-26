import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;

class ChatResult {
  ChatResult({required this.answer, required this.sources, this.sessionId});

  final String answer;
  final List<String> sources;
  final String? sessionId;
}

class ChatSessionSummary {
  ChatSessionSummary({
    required this.sessionId,
    required this.title,
    required this.createdAt,
    required this.updatedAt,
    required this.messageCount,
  });

  final String sessionId;
  final String title;
  final DateTime createdAt;
  final DateTime updatedAt;
  final int messageCount;

  factory ChatSessionSummary.fromJson(Map<String, dynamic> json) {
    return ChatSessionSummary(
      sessionId: (json['session_id'] ?? '').toString(),
      title: (json['title'] ?? 'New Conversation').toString(),
      createdAt:
          DateTime.tryParse((json['created_at'] ?? '').toString()) ??
          DateTime.now(),
      updatedAt:
          DateTime.tryParse((json['updated_at'] ?? '').toString()) ??
          DateTime.now(),
      messageCount: (json['message_count'] is int)
          ? (json['message_count'] as int)
          : int.tryParse((json['message_count'] ?? '').toString()) ?? 0,
    );
  }
}

class ChatHistoryMessage {
  ChatHistoryMessage({
    required this.role,
    required this.content,
    required this.language,
    required this.sources,
    required this.createdAt,
  });

  final String role;
  final String content;
  final String language;
  final List<String> sources;
  final DateTime createdAt;

  factory ChatHistoryMessage.fromJson(Map<String, dynamic> json) {
    final rawSources = json['sources'];
    final parsedSources = rawSources is List
        ? rawSources.map((item) => item.toString()).toList()
        : <String>[];

    return ChatHistoryMessage(
      role: (json['role'] ?? 'assistant').toString(),
      content: (json['content'] ?? '').toString(),
      language: (json['language'] ?? 'en').toString(),
      sources: parsedSources,
      createdAt:
          DateTime.tryParse((json['created_at'] ?? '').toString()) ??
          DateTime.now(),
    );
  }
}

class ChatHistoryResponse {
  ChatHistoryResponse({
    required this.sessionId,
    required this.title,
    required this.createdAt,
    required this.updatedAt,
    required this.messages,
  });

  final String sessionId;
  final String title;
  final DateTime createdAt;
  final DateTime updatedAt;
  final List<ChatHistoryMessage> messages;

  factory ChatHistoryResponse.fromJson(Map<String, dynamic> json) {
    final rawMessages = json['messages'];
    final messages = rawMessages is List
        ? rawMessages
              .whereType<Map>()
              .map(
                (item) => ChatHistoryMessage.fromJson(
                  item.map((key, value) => MapEntry(key.toString(), value)),
                ),
              )
              .toList()
        : <ChatHistoryMessage>[];

    return ChatHistoryResponse(
      sessionId: (json['session_id'] ?? '').toString(),
      title: (json['title'] ?? 'New Conversation').toString(),
      createdAt:
          DateTime.tryParse((json['created_at'] ?? '').toString()) ??
          DateTime.now(),
      updatedAt:
          DateTime.tryParse((json['updated_at'] ?? '').toString()) ??
          DateTime.now(),
      messages: messages,
    );
  }
}

class CategoryStudy {
  CategoryStudy({
    required this.id,
    required this.titleEn,
    required this.titleTa,
    required this.descriptionEn,
    required this.descriptionTa,
    required this.overview,
    required this.learnPoints,
    required this.references,
    required this.sourceCount,
    required this.sourceType,
  });

  final int id;
  final String titleEn;
  final String titleTa;
  final String descriptionEn;
  final String descriptionTa;
  final String overview;
  final List<String> learnPoints;
  final List<String> references;
  final int sourceCount;
  final String sourceType;

  factory CategoryStudy.fromJson(Map<String, dynamic> json) {
    final rawLearn = json['learn_points'];
    final rawReferences = json['references'];

    return CategoryStudy(
      id: (json['id'] is int)
          ? (json['id'] as int)
          : int.tryParse((json['id'] ?? '').toString()) ?? 0,
      titleEn: (json['title_en'] ?? '').toString(),
      titleTa: (json['title_ta'] ?? '').toString(),
      descriptionEn: (json['description_en'] ?? '').toString(),
      descriptionTa: (json['description_ta'] ?? '').toString(),
      overview: (json['overview'] ?? '').toString(),
      learnPoints: rawLearn is List
          ? rawLearn.map((item) => item.toString()).toList()
          : <String>[],
      references: rawReferences is List
          ? rawReferences.map((item) => item.toString()).toList()
          : <String>[],
      sourceCount: (json['source_count'] is int)
          ? (json['source_count'] as int)
          : int.tryParse((json['source_count'] ?? '').toString()) ?? 0,
      sourceType: (json['source_type'] ?? '').toString(),
    );
  }
}

class ChatService {
  static const String _envBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: '',
  );

  static const String _sessionsEndpoint = '/api/v1/chat/sessions';
  static const String _historyEndpointPrefix = '/api/v1/chat/history/';
  static const String _categoryStudyEndpoint = '/api/v1/categories/study';

  static List<String> get _candidateBaseUrls {
    if (_envBaseUrl.isNotEmpty) {
      return <String>[_envBaseUrl];
    }

    if (kIsWeb) {
      return const <String>['http://127.0.0.1:8000'];
    }

    if (defaultTargetPlatform == TargetPlatform.android) {
      return const <String>[
        'http://127.0.0.1:8000',
        'http://192.168.161.92:8000',
        'http://10.0.2.2:8000',
      ];
    }

    return const <String>['http://127.0.0.1:8000'];
  }

  static bool _isNetworkError(Object error) {
    if (error is TimeoutException || error is SocketException) return true;
    final text = error.toString().toLowerCase();
    return text.contains('socketexception') ||
        text.contains('connection timed out') ||
        text.contains('failed host lookup') ||
        text.contains('connection refused');
  }

  static String _networkHelp(List<Uri> attempts) {
    final attemptedOrigins = attempts.map((uri) => uri.origin).join(', ');
    return 'Phone cannot reach backend. Attempted: $attemptedOrigins. '
        'Check firewall/LAN or use USB reverse: '
        '`adb reverse tcp:8000 tcp:8000`.';
  }

  static String _normalizeBaseUrl(String value) {
    final trimmed = value.trim();
    if (trimmed.endsWith('/')) {
      return trimmed.substring(0, trimmed.length - 1);
    }
    return trimmed;
  }

  static Uri _buildUri(
    String baseUrl,
    String endpoint, {
    Map<String, String>? queryParameters,
  }) {
    final normalizedBase = _normalizeBaseUrl(baseUrl);
    final normalizedEndpoint = endpoint.startsWith('/')
        ? endpoint
        : '/$endpoint';
    final uri = Uri.parse(
      '$normalizedBase$normalizedEndpoint',
    ).replace(queryParameters: queryParameters);
    return uri;
  }

  static bool _isPdfLikeSource(String value) {
    final regex = RegExp(
      r'(^|[\\/])[^\\/\s]+\.pdf($|[?#\s])',
      caseSensitive: false,
    );
    return regex.hasMatch(value.trim());
  }

  static bool _shouldHideSourcesForAnswer(String answer) {
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

  Future<http.Response> _requestWithFallback({
    required String endpoint,
    required String method,
    Map<String, dynamic>? body,
    Map<String, String>? queryParameters,
    Duration timeout = const Duration(seconds: 45),
  }) async {
    final attemptedUris = <Uri>[];
    Object? lastNetworkError;

    for (final baseUrl in _candidateBaseUrls) {
      final uri = _buildUri(
        baseUrl,
        endpoint,
        queryParameters: queryParameters,
      );
      attemptedUris.add(uri);
      if (kDebugMode) {
        debugPrint('[ChatService] $method $uri');
      }

      try {
        late final http.Response response;
        if (method == 'POST') {
          response = await http
              .post(
                uri,
                headers: const <String, String>{
                  'Content-Type': 'application/json',
                },
                body: jsonEncode(body ?? const <String, dynamic>{}),
              )
              .timeout(timeout);
        } else {
          response = await http.get(uri).timeout(timeout);
        }
        return response;
      } catch (error) {
        if (_isNetworkError(error)) {
          lastNetworkError = error;
          continue;
        }
        rethrow;
      }
    }

    if (lastNetworkError != null) {
      throw Exception('Network error. ${_networkHelp(attemptedUris)}');
    }

    throw Exception('Request failed before a response was received.');
  }

  Future<ChatResult> sendMessage(
    String message, {
    String language = 'en',
    String? sessionId,
  }) async {
    final endpoint = language == 'ta'
        ? '/api/v1/chat/tamil-query'
        : '/api/v1/chat/query';

    final response = await _requestWithFallback(
      endpoint: endpoint,
      method: 'POST',
      body: <String, dynamic>{
        'message': message,
        'language': language,
        if (sessionId != null && sessionId.trim().isNotEmpty)
          'session_id': sessionId.trim(),
      },
    );

    if (response.statusCode >= 400) {
      throw Exception(
        'Request failed (${response.statusCode}): ${response.body}',
      );
    }

    final payload = jsonDecode(response.body) as Map<String, dynamic>;
    final answer = (payload['answer'] ?? payload['response'] ?? '').toString();
    final rawSources = payload['sources'];
    final parsedSources = rawSources is List
        ? rawSources
              .map(
                (item) =>
                    item.toString().replaceAll(RegExp(r'\s+'), ' ').trim(),
              )
              .where((item) => item.isNotEmpty && !_isPdfLikeSource(item))
              .toList()
        : <String>[];
    final sources = _shouldHideSourcesForAnswer(answer)
        ? <String>[]
        : parsedSources;

    return ChatResult(
      answer: answer,
      sources: sources,
      sessionId: (payload['session_id'] ?? '').toString().trim().isEmpty
          ? null
          : payload['session_id'].toString(),
    );
  }

  Future<List<ChatSessionSummary>> fetchSessions({int limit = 30}) async {
    final safeLimit = limit.clamp(1, 100).toString();
    final response = await _requestWithFallback(
      endpoint: _sessionsEndpoint,
      method: 'GET',
      queryParameters: <String, String>{'limit': safeLimit},
    );

    if (response.statusCode >= 400) {
      throw Exception(
        'Session list failed (${response.statusCode}): ${response.body}',
      );
    }

    final payload = jsonDecode(response.body);
    if (payload is! List) {
      return <ChatSessionSummary>[];
    }

    return payload
        .whereType<Map>()
        .map(
          (item) => ChatSessionSummary.fromJson(
            item.map((key, value) => MapEntry(key.toString(), value)),
          ),
        )
        .toList();
  }

  Future<ChatHistoryResponse> fetchSessionHistory(String sessionId) async {
    final trimmed = sessionId.trim();
    if (trimmed.isEmpty) {
      throw Exception('Session id is required.');
    }

    final response = await _requestWithFallback(
      endpoint: '$_historyEndpointPrefix$trimmed',
      method: 'GET',
    );

    if (response.statusCode >= 400) {
      throw Exception(
        'Session history failed (${response.statusCode}): ${response.body}',
      );
    }

    final payload = jsonDecode(response.body);
    if (payload is! Map) {
      throw Exception('Invalid session history response format.');
    }

    return ChatHistoryResponse.fromJson(
      payload.map((key, value) => MapEntry(key.toString(), value)),
    );
  }

  Future<List<CategoryStudy>> fetchCategoryStudy({
    String language = 'en',
    int k = 8,
  }) async {
    final safeK = k.clamp(3, 20).toString();
    final safeLanguage = language.toLowerCase().startsWith('ta') ? 'ta' : 'en';

    final response = await _requestWithFallback(
      endpoint: _categoryStudyEndpoint,
      method: 'GET',
      queryParameters: <String, String>{'language': safeLanguage, 'k': safeK},
    );

    if (response.statusCode >= 400) {
      throw Exception(
        'Category study failed (${response.statusCode}): ${response.body}',
      );
    }

    final payload = jsonDecode(response.body);
    if (payload is! List) {
      return <CategoryStudy>[];
    }

    return payload
        .whereType<Map>()
        .map(
          (item) => CategoryStudy.fromJson(
            item.map((key, value) => MapEntry(key.toString(), value)),
          ),
        )
        .toList();
  }
}
