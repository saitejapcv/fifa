/**
 * FIFA 2026 Smart Stadium - Football API Client (Football-Data.org)
 * Manages key storage, API fetch requests, and local offline fallbacks.
 */

(() => {
  'use strict';

  const FOOTBALL_KEY_STORAGE_KEY = 'fifa2026.footballApiKey';

  const getApiKey = () => localStorage.getItem(FOOTBALL_KEY_STORAGE_KEY) || '';

  const FootballClient = {
    keyName: FOOTBALL_KEY_STORAGE_KEY,

    hasApiKey() {
      return Boolean(getApiKey());
    },

    saveApiKey(rawKey) {
      const key = String(rawKey || '').trim();
      if (!/^[A-Za-z0-9]{15,}$/.test(key)) {
        throw new Error('Enter a valid Football-Data.org API token.');
      }
      localStorage.setItem(FOOTBALL_KEY_STORAGE_KEY, key);
      return true;
    },

    clearApiKey() {
      localStorage.removeItem(FOOTBALL_KEY_STORAGE_KEY);
    },

    /**
     * Fetch Live & Future matches.
     */
    async getMatches() {
      if (!this.hasApiKey()) {
        return this.getFallbackMatches();
      }

      try {
        const response = await fetch('https://api.football-data.org/v4/matches', {
          headers: { 'X-Auth-Token': getApiKey() }
        });
        if (!response.ok) throw new Error(`API returned HTTP ${response.status}`);
        const data = await response.json();
        return this.parseAPIMatches(data);
      } catch (err) {
        console.warn('Football API matches fetch failed, using fallback:', err);
        return this.getFallbackMatches();
      }
    },

    /**
     * Fetch World Cup Schedule.
     */
    async getSchedule() {
      if (!this.hasApiKey()) {
        return this.getFallbackSchedule();
      }

      try {
        const response = await fetch('https://api.football-data.org/v4/competitions/WC/matches', {
          headers: { 'X-Auth-Token': getApiKey() }
        });
        if (!response.ok) throw new Error(`API returned HTTP ${response.status}`);
        const data = await response.json();
        return this.parseAPIMatches(data);
      } catch (err) {
        console.warn('Football API schedule fetch failed, using fallback:', err);
        return this.getFallbackSchedule();
      }
    },

    /**
     * Fetch players in the squad/team.
     */
    async getTeamSquad(teamId) {
      if (!this.hasApiKey()) {
        return this.getFallbackSquad(teamId);
      }

      try {
        const response = await fetch(`https://api.football-data.org/v4/teams/${teamId}`, {
          headers: { 'X-Auth-Token': getApiKey() }
        });
        if (!response.ok) throw new Error(`API returned HTTP ${response.status}`);
        const data = await response.json();
        return this.parseAPISquad(data);
      } catch (err) {
        console.warn(`Football API squad fetch for team ${teamId} failed, using fallback:`, err);
        return this.getFallbackSquad(teamId);
      }
    },

    // --- Parser Helpers ---

    parseAPIMatches(data) {
      const matches = data.matches || [];
      return matches.map(match => ({
        id: match.id,
        competition: match.competition?.name || 'World Cup',
        status: match.status,
        stage: match.stage,
        group: match.group,
        homeTeam: { id: match.homeTeam.id, name: match.homeTeam.name, shortName: match.homeTeam.shortName, crest: match.homeTeam.crest },
        awayTeam: { id: match.awayTeam.id, name: match.awayTeam.name, shortName: match.awayTeam.shortName, crest: match.awayTeam.crest },
        score: {
          fullTime: { home: match.score?.fullTime?.home ?? 0, away: match.score?.fullTime?.away ?? 0 }
        },
        utcDate: match.utcDate
      }));
    },

    parseAPISquad(data) {
      return {
        name: data.name,
        crest: data.crest,
        founded: data.founded,
        venue: data.venue,
        squad: (data.squad || []).map(player => ({
          id: player.id,
          name: player.name,
          position: player.position,
          dateOfBirth: player.dateOfBirth,
          nationality: player.nationality
        }))
      };
    },

    // --- Baseline Fallbacks ---

    getFallbackMatches() {
      return [
        { id: 100, competition: 'World Cup', homeTeam: { id: 757, name: 'USA' }, awayTeam: { id: 759, name: 'Germany' }, score: { fullTime: { home: 2, away: 1 } }, utcDate: new Date().toISOString() },
        { id: 101, competition: 'World Cup', homeTeam: { id: 760, name: 'Mexico' }, awayTeam: { id: 762, name: 'Brazil' }, score: { fullTime: { home: 0, away: 0 } }, utcDate: new Date(Date.now() + 3600000).toISOString() },
        { id: 102, competition: 'World Cup', homeTeam: { id: 763, name: 'Canada' }, awayTeam: { id: 765, name: 'Argentina' }, score: { fullTime: { home: 1, away: 3 } }, utcDate: new Date(Date.now() - 7200000).toISOString() }
      ];
    },

    getFallbackSchedule() {
      return [
        { id: 201, competition: 'World Cup', homeTeam: { id: 757, name: 'USA' }, awayTeam: { id: 759, name: 'Germany' }, utcDate: new Date().toISOString() },
        { id: 202, competition: 'World Cup', homeTeam: { id: 760, name: 'Mexico' }, awayTeam: { id: 762, name: 'Brazil' }, utcDate: new Date(Date.now() + 86400000).toISOString() },
        { id: 203, competition: 'World Cup', homeTeam: { id: 763, name: 'Canada' }, awayTeam: { id: 765, name: 'Argentina' }, utcDate: new Date(Date.now() + 172800000).toISOString() }
      ];
    },

    getFallbackSquad(teamId) {
      // Return a standard mock squad based on teamId or fallback
      const squads = {
        757: {
          name: 'USA',
          squad: [
            { name: 'Christian Pulisic', position: 'Forward', nationality: 'USA' },
            { name: 'Weston McKennie', position: 'Midfielder', nationality: 'USA' },
            { name: 'Tyler Adams', position: 'Midfielder', nationality: 'USA' },
            { name: 'Matt Turner', position: 'Goalkeeper', nationality: 'USA' }
          ]
        },
        759: {
          name: 'Germany',
          squad: [
            { name: 'Kai Havertz', position: 'Forward', nationality: 'German' },
            { name: 'Jamal Musiala', position: 'Midfielder', nationality: 'German' },
            { name: 'Florian Wirtz', position: 'Midfielder', nationality: 'German' },
            { name: 'Manuel Neuer', position: 'Goalkeeper', nationality: 'German' }
          ]
        }
      };
      return squads[teamId] || {
        name: 'FC Roster',
        squad: [
          { name: 'Lionel Messi', position: 'Forward', nationality: 'Argentina' },
          { name: 'Kylian Mbappe', position: 'Forward', nationality: 'France' },
          { name: 'Luka Modric', position: 'Midfielder', nationality: 'Croatia' }
        ]
      };
    }
  };

  window.FootballClient = FootballClient;
})();
