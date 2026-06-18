export const Role = {
  admin: "ADMIN",
  owner: "OWNER",
  jockey: "JOCKEY",
  referee: "REFEREE",
  spectator: "SPECTATOR"
};

export const roleValues = [Role.admin, Role.owner, Role.jockey, Role.referee, Role.spectator];

export function roleFromString(value) {
  const normalized = String(value || "").toUpperCase();
  if (normalized.includes("ADMIN")) return Role.admin;
  if (normalized.includes("OWNER")) return Role.owner;
  if (normalized.includes("JOCKEY") || normalized.includes("JOKEY")) return Role.jockey;
  if (normalized.includes("REFEREE")) return Role.referee;
  return Role.spectator;
}

export function normalizeUser(json = {}, fallbackEmail = "") {
  return {
    id: stringValue(json.userId ?? json.id ?? json._id),
    name: stringValue(json.fullName ?? json.name),
    role: roleFromString(json.role),
    email: json.email ? String(json.email) : fallbackEmail || undefined
  };
}

export function normalizeSession(json = {}) {
  return {
    token: stringValue(json.token ?? json.accessToken),
    user: normalizeUser(json.user || {})
  };
}

export function tournamentFromApi(json = {}) {
  return {
    id: stringValue(json._id ?? json.id),
    name: stringValue(json.name),
    location: stringValue(json.venue ?? json.location),
    startDate: dateOnly(json.startDate),
    endDate: dateOnly(json.endDate)
  };
}

export function raceFromApi(json = {}) {
  const tournament = json.tournamentId;
  return {
    id: stringValue(json._id ?? json.id),
    tournamentId:
      tournament && typeof tournament === "object"
        ? stringValue(tournament._id ?? tournament.id)
        : stringValue(tournament),
    name: stringValue(json.name),
    scheduledAt: stringValue(json.scheduledAt),
    status: stringValue(json.status)
  };
}

export function horseFromDirect(json = {}) {
  return {
    id: stringValue(json._id ?? json.id),
    name: stringValue(json.name),
    ownerId: stringValue(json.ownerId)
  };
}

export function inviteFromDirect(json = {}) {
  const horse = json.horseId;
  const horseObj = horse && typeof horse === "object" ? horse : null;
  return {
    id: stringValue(json._id ?? json.id),
    horseId: horseObj ? stringValue(horseObj._id ?? horseObj.id) : stringValue(horse),
    horseName: horseObj ? stringValue(horseObj.name) : stringValue(json.horseName ?? horse),
    status: stringValue(json.status)
  };
}

export function predictionFromApi(json = {}) {
  const race = json.raceId;
  const horse = json.horseId;
  const apiStatus = stringValue(json.status);
  const mappedStatus = apiStatus === "OPEN" || apiStatus === "CLOSED" ? "PENDING" : apiStatus;
  return {
    id: stringValue(json._id ?? json.id),
    raceId: race && typeof race === "object" ? stringValue(race._id ?? race.id) : stringValue(race),
    pickedHorseName: horse && typeof horse === "object" ? stringValue(horse.name) : "",
    status: mappedStatus,
    betAmount: typeof json.betAmount === "number" ? json.betAmount : null,
    raceName: race && typeof race === "object" ? stringValue(race.name) : ""
  };
}

export function raceHorseFromEntry(json = {}) {
  const horse = json.horse;
  const horseId = json.horseId;
  const horseObj = horse && typeof horse === "object" ? horse : null;
  const horseIdObj = horseId && typeof horseId === "object" ? horseId : null;
  return {
    id: horseObj ? stringValue(horseObj._id ?? horseObj.id) : horseIdObj ? stringValue(horseIdObj._id ?? horseIdObj.id) : "",
    name: horseObj ? stringValue(horseObj.name) : horseIdObj ? stringValue(horseIdObj.name) : ""
  };
}

export function adminUserFromDirect(json = {}) {
  return {
    id: stringValue(json.userId ?? json._id ?? json.id),
    name: stringValue(json.fullName ?? json.name),
    role: roleFromString(json.role)
  };
}

export function extractList(data, envelopeKey) {
  const raw = data && !Array.isArray(data) && envelopeKey ? data[envelopeKey] ?? data : data;
  if (!Array.isArray(raw)) return [];
  return raw.filter((item) => item && typeof item === "object");
}

export function dateOnly(value) {
  const text = stringValue(value);
  return text.includes("T") ? text.split("T")[0] : text;
}

export function stringValue(value) {
  return value === null || value === undefined ? "" : String(value);
}
