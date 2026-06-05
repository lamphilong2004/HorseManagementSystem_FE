import 'dart:convert';

enum Role {
  admin('ADMIN'),
  owner('OWNER'),
  jockey('JOCKEY'),
  referee('REFEREE'),
  spectator('SPECTATOR');

  const Role(this.value);

  final String value;

  static Role fromString(Object? value) {
    final normalized = value?.toString().toUpperCase();
    return Role.values.firstWhere(
      (role) => role.value == normalized,
      orElse: () => Role.spectator,
    );
  }
}

class User {
  const User({
    required this.id,
    required this.name,
    required this.role,
    this.email,
  });

  final String id;
  final String name;
  final Role role;
  final String? email;

  Map<String, dynamic> toJson() => {
    'id': id,
    'name': name,
    'role': role.value,
    if (email != null) 'email': email,
  };

  factory User.fromJson(Map<String, dynamic> json) => User(
    id: _stringValue(json['id']),
    name: _stringValue(json['name']),
    role: Role.fromString(json['role']),
    email: json['email']?.toString(),
  );
}

class Session {
  const Session({required this.token, required this.user});

  final String token;
  final User user;

  Map<String, dynamic> toJson() => {'token': token, 'user': user.toJson()};

  String encode() => jsonEncode(toJson());

  factory Session.fromJson(Map<String, dynamic> json) => Session(
    token: _stringValue(json['token']),
    user: User.fromJson(Map<String, dynamic>.from(json['user'] as Map)),
  );
}

class Tournament {
  const Tournament({
    required this.id,
    required this.name,
    required this.location,
    required this.startDate,
    required this.endDate,
  });

  final String id;
  final String name;
  final String location;
  final String startDate;
  final String endDate;

  factory Tournament.fromApi(Map<String, dynamic> json) => Tournament(
    id: _stringValue(json['_id']),
    name: _stringValue(json['name']),
    location: _stringValue(json['venue'] ?? json['location']),
    startDate: _dateOnly(json['startDate']),
    endDate: _dateOnly(json['endDate']),
  );
}

class Race {
  const Race({
    required this.id,
    required this.tournamentId,
    required this.name,
    required this.scheduledAt,
    required this.status,
  });

  final String id;
  final String tournamentId;
  final String name;
  final String scheduledAt;
  final String status;

  factory Race.fromApi(Map<String, dynamic> json) {
    final tournament = json['tournamentId'];
    return Race(
      id: _stringValue(json['_id'] ?? json['id']),
      tournamentId: tournament is Map<String, dynamic>
          ? _stringValue(tournament['_id'])
          : _stringValue(tournament),
      name: _stringValue(json['name']),
      scheduledAt: _stringValue(json['scheduledAt']),
      status: _stringValue(json['status']),
    );
  }

  factory Race.fromDirect(Map<String, dynamic> json) {
    final tournament = json['tournamentId'];
    return Race(
      id: _stringValue(json['_id'] ?? json['id']),
      tournamentId: tournament is Map<String, dynamic>
          ? _stringValue(tournament['_id'] ?? tournament['id'])
          : _stringValue(tournament),
      name: _stringValue(json['name']),
      scheduledAt: _stringValue(json['scheduledAt']),
      status: _stringValue(json['status']),
    );
  }
}

class Horse {
  const Horse({required this.id, required this.name, required this.ownerId});

  final String id;
  final String name;
  final String ownerId;

  factory Horse.fromDirect(Map<String, dynamic> json) => Horse(
    id: _stringValue(json['_id'] ?? json['id']),
    name: _stringValue(json['name']),
    ownerId: _stringValue(json['ownerId']),
  );
}

class Invite {
  const Invite({
    required this.id,
    required this.horseId,
    required this.horseName,
    required this.status,
  });

  final String id;
  final String horseId;
  final String horseName;
  final String status;

  factory Invite.fromDirect(Map<String, dynamic> json) {
    final horse = json['horseId'];
    return Invite(
      id: _stringValue(json['_id'] ?? json['id']),
      horseId: horse is Map<String, dynamic>
          ? _stringValue(horse['_id'] ?? horse['id'])
          : _stringValue(horse),
      horseName: horse is Map<String, dynamic>
          ? _stringValue(horse['name'])
          : _stringValue(json['horseName'] ?? horse),
      status: _stringValue(json['status']),
    );
  }
}

class Prediction {
  const Prediction({
    required this.id,
    required this.raceId,
    required this.pickedHorseName,
    required this.status,
    this.betAmount,
    this.raceName,
  });

  final String id;
  final String raceId;
  final String pickedHorseName;
  final String status;
  final num? betAmount;
  final String? raceName;

  factory Prediction.fromApi(Map<String, dynamic> json) {
    final race = json['raceId'];
    final horse = json['horseId'];
    final apiStatus = _stringValue(json['status']);
    final mappedStatus = apiStatus == 'OPEN' || apiStatus == 'CLOSED'
        ? 'PENDING'
        : apiStatus;

    return Prediction(
      id: _stringValue(json['_id'] ?? json['id']),
      raceId: race is Map<String, dynamic>
          ? _stringValue(race['_id'])
          : _stringValue(race),
      pickedHorseName: horse is Map<String, dynamic>
          ? _stringValue(horse['name'])
          : '',
      status: mappedStatus,
      betAmount: json['betAmount'] is num ? json['betAmount'] as num : null,
      raceName: race is Map<String, dynamic> ? _stringValue(race['name']) : '',
    );
  }
}

class RaceHorse {
  const RaceHorse({required this.id, required this.name});

  final String id;
  final String name;

  factory RaceHorse.fromRaceEntry(Map<String, dynamic> json) {
    final horse = json['horse'];
    final horseId = json['horseId'];
    return RaceHorse(
      id: horse is Map<String, dynamic>
          ? _stringValue(horse['_id'])
          : horseId is Map<String, dynamic>
          ? _stringValue(horseId['_id'])
          : '',
      name: horse is Map<String, dynamic>
          ? _stringValue(horse['name'])
          : horseId is Map<String, dynamic>
          ? _stringValue(horseId['name'])
          : '',
    );
  }
}

class AdminUser {
  const AdminUser({required this.id, required this.name, required this.role});

  final String id;
  final String name;
  final Role role;

  factory AdminUser.fromDirect(Map<String, dynamic> json) => AdminUser(
    id: _stringValue(json['userId'] ?? json['_id'] ?? json['id']),
    name: _stringValue(json['fullName'] ?? json['name']),
    role: Role.fromString(json['role']),
  );
}

String _dateOnly(Object? value) {
  final text = _stringValue(value);
  return text.contains('T') ? text.split('T').first : text;
}

String _stringValue(Object? value) => value?.toString() ?? '';
