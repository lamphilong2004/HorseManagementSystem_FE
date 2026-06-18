import {
  Role,
  adminUserFromDirect,
  extractList,
  horseFromDirect,
  inviteFromDirect,
  normalizeUser,
  predictionFromApi,
  raceFromApi,
  raceHorseFromEntry,
  tournamentFromApi
} from "./models";

export class ApiService {
  constructor(client) {
    this.client = client;
  }

  async login({ email, password }) {
    const response = await this.client.post("/auth/login", { email, password });
    const data = response.data || {};
    const session = {
      token: String(data.accessToken || ""),
      user: normalizeUser(data.user || {}, email)
    };
    this.client.setAccessToken(session.token);
    return session;
  }

  async register({ name, email, password, role = Role.spectator }) {
    await this.client.post("/auth/register", {
      email,
      password,
      fullName: name,
      role
    });
    return this.login({ email, password });
  }

  async getTournaments() {
    const response = await this.client.get("/tournaments");
    return extractList(response.data, "tournaments").map(tournamentFromApi);
  }

  async getRaces() {
    const response = await this.client.get("/races");
    return extractList(response.data, "races").map(raceFromApi);
  }

  async getHorses() {
    const response = await this.client.get("/horses/me");
    return extractList(response.data, null).map(horseFromDirect);
  }

  async getInvites() {
    const response = await this.client.get("/jockeys/me/invitations");
    return extractList(response.data, "invitations").map(inviteFromDirect);
  }

  async acceptInvitation(inviteId) {
    const response = await this.client.patch(`/jockeys/me/invitations/${inviteId}/accept`);
    return response.data;
  }

  async rejectInvitation(inviteId) {
    const response = await this.client.patch(`/jockeys/me/invitations/${inviteId}/reject`);
    return response.data;
  }

  async getJockeyRaces() {
    const response = await this.client.get("/jockeys/me/races");
    return extractList(response.data, null).map(raceFromApi);
  }

  async getPredictions() {
    const response = await this.client.get("/prediction/me/predictions");
    return extractList(response.data, "predictions").map(predictionFromApi);
  }

  async getAdminUsers() {
    const response = await this.client.get("/admin/users");
    return extractList(response.data, "data").map(adminUserFromDirect);
  }

  async updateUserRole(userId, role) {
    const response = await this.client.patch(`/admin/users/${userId}/role`, { role });
    return response.data;
  }

  async getRefereeRaces() {
    const response = await this.client.get("/referee/races");
    return extractList(response.data, null).map(raceFromApi);
  }

  async getRefereeRaceHorses(raceId) {
    const response = await this.client.get(`/referee/races/${raceId}/horses`);
    return extractList(response.data, "horses");
  }

  async createViolation(raceId, data) {
    const response = await this.client.post(`/referee/races/${raceId}/violations`, data);
    return response.data;
  }

  async confirmRaceResult(raceId, rankings, notes) {
    const response = await this.client.post(`/referee/races/${raceId}/confirm-result`, {
      rankings,
      notes
    });
    return response.data;
  }

  async checkRaceOpenForPrediction(raceId) {
    const response = await this.client.get(`/races/${raceId}/predictions/open`);
    return response.data || {};
  }

  async placePrediction({ raceId, horseId, betAmount, predictedPosition }) {
    const body = { horseId, betAmount };
    if (predictedPosition && predictedPosition > 0) {
      body.predictedPosition = predictedPosition;
    }
    const response = await this.client.post(`/prediction/races/${raceId}/predictions`, body);
    return response.data;
  }

  async closePredictions(raceId) {
    const response = await this.client.patch(`/prediction/admin/races/${raceId}/close`);
    return response.data;
  }

  async settlePredictions(raceId) {
    const response = await this.client.post(`/prediction/admin/races/${raceId}/settle`, {});
    return response.data;
  }

  async getRaceHorses(raceId) {
    const response = await this.client.get(`/races/${raceId}/horses`);
    return extractList(response.data, "horses").map(raceHorseFromEntry);
  }

  async getRaceResults(raceId) {
    const response = await this.client.get(`/results/races/${raceId}`);
    return response.data || {};
  }

  async getNotifications() {
    const response = await this.client.get("/prediction/me/notifications");
    const data = response.data;
    const list = data && typeof data === "object" ? data.notifications || data : data;
    return Array.isArray(list) ? list.filter((item) => item && typeof item === "object") : [];
  }

  async getTournamentLeaderboard(tournamentId) {
    const response = await this.client.get(`/tournaments/${tournamentId}/leaderboard`);
    return response.data || {};
  }
}
