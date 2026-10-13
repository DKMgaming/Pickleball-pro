/**
 * Pickleball Tournament Algorithm Service
 * 1. Round-Robin Scheduling & Group Drawing
 * 2. Official Standings Calculation with USA/VPA Pickleball Tie-Breaking Rules:
 *    - Priority 1: Total Points (Thắng = 3, Thua = 0)
 *    - Priority 2: Game Difference (Games won - Games lost)
 *    - Priority 3: Head-to-Head result between tied teams
 *    - Priority 4: Point Difference (Points won - Points lost)
 * 3. Playoff / Knockout Bracket Generation & Advancement
 */

import {
  Team,
  Group,
  Match,
  Standing,
  Tournament,
} from '../types/tournament.ts';

export const BracketService = {
  /**
   * Distribute teams into groups (Seeded or Random)
   */
  drawGroups(
    teams: Team[],
    tournamentId: string,
    groupsCount: number,
    method: 'seeded' | 'random' = 'seeded'
  ): { groups: Group[]; updatedTeams: Team[] } {
    const groupLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    const groups: Group[] = Array.from({ length: groupsCount }, (_, i) => ({
      id: `group_${groupLetters[i].toLowerCase()}`,
      tournamentId,
      name: `Bảng ${groupLetters[i]}`,
      teamIds: [],
    }));

    const sortedTeams = [...teams];
    if (method === 'random') {
      // Fisher-Yates shuffle
      for (let i = sortedTeams.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [sortedTeams[i], sortedTeams[j]] = [sortedTeams[j], sortedTeams[i]];
      }
    } else {
      // Seeded: Seeded teams first, then non-seeded
      sortedTeams.sort((a, b) => {
        if (a.seed && b.seed) return a.seed - b.seed;
        if (a.seed) return -1;
        if (b.seed) return 1;
        return 0;
      });
    }

    // Snake or round-robin distribution into groups
    sortedTeams.forEach((team, index) => {
      const groupIndex = index % groupsCount;
      groups[groupIndex].teamIds.push(team.id);
    });

    return { groups, updatedTeams: sortedTeams };
  },

  /**
   * Generate Round-Robin schedule using circle algorithm
   */
  generateRoundRobinSchedule(
    tournament: Tournament,
    groups: Group[],
    courtsCount: number,
    startHour = 8,
    startMinute = 0,
    matchDurationMin = 45
  ): Match[] {
    const matches: Match[] = [];
    let matchCounter = 1;

    // Time helper
    const getTimeString = (totalMinutes: number): string => {
      const hours = Math.floor(totalMinutes / 60);
      const mins = totalMinutes % 60;
      return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
    };

    let currentTimeMinutes = startHour * 60 + startMinute;
    let courtCursor = 1;

    groups.forEach((group) => {
      const teamList = [...group.teamIds];
      if (teamList.length % 2 !== 0) {
        teamList.push('BYE'); // Dummy for odd number of teams
      }

      const numTeams = teamList.length;
      const rounds = numTeams - 1;
      const half = numTeams / 2;

      // Circle algorithm
      const teamsCopy = [...teamList];

      for (let round = 0; round < rounds; round++) {
        for (let i = 0; i < half; i++) {
          const t1 = teamsCopy[i];
          const t2 = teamsCopy[numTeams - 1 - i];

          // Skip BYE match
          if (t1 === 'BYE' || t2 === 'BYE') continue;

          const courtName = `Sân ${courtCursor}${courtCursor === 1 ? ' (Center)' : ''}`;
          courtCursor = courtCursor >= courtsCount ? 1 : courtCursor + 1;

          matches.push({
            id: `m_${group.id}_r${round + 1}_${matchCounter}`,
            tournamentId: tournament.id,
            stage: 'group',
            groupId: group.id,
            roundName: `Lượt ${round + 1}`,
            roundIndex: round + 1,
            matchNumber: matchCounter++,
            team1Id: t1,
            team2Id: t2,
            status: 'scheduled',
            courtName,
            scheduledTime: getTimeString(currentTimeMinutes),
            scores: [],
            winnerId: null,
          });

          // Increment time when courts fill up
          if (courtCursor === 1) {
            currentTimeMinutes += matchDurationMin;
          }
        }

        // Rotate circle (keep first element fixed)
        const first = teamsCopy[0];
        const rest = teamsCopy.slice(1);
        const last = rest.pop()!;
        rest.unshift(last);
        teamsCopy.splice(0, teamsCopy.length, first, ...rest);
      }
    });

    return matches;
  },

  /**
   * Calculate Official Standings for a specific group
   * Implements strict tie-breaking rules:
   * 1. Total Points (Thắng = 3, Thua = 0)
   * 2. Game Difference (Games won - Games lost)
   * 3. Head-to-Head between tied teams
   * 4. Point Difference (Points won - Points lost)
   */
  calculateGroupStandings(
    group: Group,
    matches: Match[],
    teamsMap: Record<string, Team>,
    qualifyPerGroup = 2
  ): Standing[] {
    const groupMatches = matches.filter(
      (m) => m.stage === 'group' && m.groupId === group.id && m.status === 'completed'
    );

    // Initial stats table
    const stats: Record<string, Standing> = {};

    group.teamIds.forEach((tId) => {
      const team = teamsMap[tId];
      stats[tId] = {
        teamId: tId,
        teamName: team ? team.name : 'Vô danh',
        playerNames: team
          ? team.player2
            ? `${team.player1} & ${team.player2}`
            : team.player1
          : '',
        groupId: group.name,
        played: 0,
        won: 0,
        lost: 0,
        gamesWon: 0,
        gamesLost: 0,
        pointsWon: 0,
        pointsLost: 0,
        gameDiff: 0,
        pointDiff: 0,
        totalPoints: 0,
        rank: 0,
        isQualified: false,
      };
    });

    // Accumulate match results
    groupMatches.forEach((m) => {
      if (!m.team1Id || !m.team2Id || !stats[m.team1Id] || !stats[m.team2Id]) return;

      const s1 = stats[m.team1Id];
      const s2 = stats[m.team2Id];

      s1.played += 1;
      s2.played += 1;

      let g1Won = 0;
      let g2Won = 0;
      let p1Won = 0;
      let p2Won = 0;

      m.scores.forEach((sc) => {
        p1Won += sc.team1Score;
        p2Won += sc.team2Score;
        if (sc.team1Score > sc.team2Score) {
          g1Won += 1;
        } else if (sc.team2Score > sc.team1Score) {
          g2Won += 1;
        }
      });

      s1.gamesWon += g1Won;
      s1.gamesLost += g2Won;
      s1.pointsWon += p1Won;
      s1.pointsLost += p2Won;

      s2.gamesWon += g2Won;
      s2.gamesLost += g1Won;
      s2.pointsWon += p2Won;
      s2.pointsLost += p1Won;

      if (m.winnerId === m.team1Id) {
        s1.won += 1;
        s1.totalPoints += 3;
        s2.lost += 1;
      } else if (m.winnerId === m.team2Id) {
        s2.won += 1;
        s2.totalPoints += 3;
        s1.lost += 1;
      }
    });

    // Calculate diffs
    const standingsList = Object.values(stats).map((s) => ({
      ...s,
      gameDiff: s.gamesWon - s.gamesLost,
      pointDiff: s.pointsWon - s.pointsLost,
    }));

    // Multi-criteria sorting with Head-to-Head resolution
    standingsList.sort((a, b) => {
      // Criterion 1: Total Points (Thắng = 3, Thua = 0)
      if (b.totalPoints !== a.totalPoints) {
        return b.totalPoints - a.totalPoints;
      }

      // Criterion 2: Game Difference (Hiệu số Game)
      if (b.gameDiff !== a.gameDiff) {
        return b.gameDiff - a.gameDiff;
      }

      // Criterion 3: Head-to-Head match between a and b
      const directMatch = groupMatches.find(
        (m) =>
          (m.team1Id === a.teamId && m.team2Id === b.teamId) ||
          (m.team1Id === b.teamId && m.team2Id === a.teamId)
      );

      if (directMatch && directMatch.winnerId) {
        if (directMatch.winnerId === a.teamId) return -1;
        if (directMatch.winnerId === b.teamId) return 1;
      }

      // Criterion 4: Point Difference (Hiệu số quả / điểm)
      if (b.pointDiff !== a.pointDiff) {
        return b.pointDiff - a.pointDiff;
      }

      // Criterion 5: Total points scored
      return b.pointsWon - a.pointsWon;
    });

    // Assign rank & qualified status
    return standingsList.map((item, idx) => ({
      ...item,
      rank: idx + 1,
      isQualified: idx < qualifyPerGroup,
    }));
  },

  /**
   * Generate Playoff Knockout Bracket from Group stage winners or registered teams
   */
  generatePlayoffBracket(
    tournament: Tournament,
    qualifiedTeams: { teamId: string; groupRank: string }[],
    startingMatchNum = 20
  ): Match[] {
    const matches: Match[] = [];
    const count = qualifiedTeams.length;

    if (count <= 2) {
      // Just a final match
      matches.push({
        id: `m_playoff_final`,
        tournamentId: tournament.id,
        stage: 'playoff',
        roundName: 'Chung Kết Vô Địch',
        roundIndex: 1,
        matchNumber: startingMatchNum,
        team1Id: qualifiedTeams[0]?.teamId || null,
        team2Id: qualifiedTeams[1]?.teamId || null,
        status: 'scheduled',
        courtName: 'Sân 1 (Center)',
        scheduledTime: '15:00',
        scores: [],
        winnerId: null,
      });
      return matches;
    }

    if (count === 4) {
      // Semi-finals + Finals + Bronze
      // Semi 1: Team 0 vs Team 3 (e.g. Nhất A vs Nhì B)
      // Semi 2: Team 2 vs Team 1 (e.g. Nhất B vs Nhì A)
      const semi1Id = 'm_playoff_semi_01';
      const semi2Id = 'm_playoff_semi_02';
      const finalId = 'm_playoff_final';
      const thirdPlaceId = 'm_playoff_third';

      matches.push({
        id: semi1Id,
        tournamentId: tournament.id,
        stage: 'playoff',
        roundName: 'Bán Kết 1',
        roundIndex: 1,
        matchNumber: startingMatchNum,
        team1Id: qualifiedTeams[0]?.teamId || null,
        team2Id: qualifiedTeams[3]?.teamId || null,
        status: 'scheduled',
        courtName: 'Sân 1 (Center)',
        scheduledTime: '11:00',
        scores: [],
        winnerId: null,
        nextMatchId: finalId,
        nextSlotIndex: 1,
      });

      matches.push({
        id: semi2Id,
        tournamentId: tournament.id,
        stage: 'playoff',
        roundName: 'Bán Kết 2',
        roundIndex: 1,
        matchNumber: startingMatchNum + 1,
        team1Id: qualifiedTeams[2]?.teamId || null,
        team2Id: qualifiedTeams[1]?.teamId || null,
        status: 'scheduled',
        courtName: 'Sân 2',
        scheduledTime: '11:00',
        scores: [],
        winnerId: null,
        nextMatchId: finalId,
        nextSlotIndex: 2,
      });

      matches.push({
        id: thirdPlaceId,
        tournamentId: tournament.id,
        stage: 'playoff',
        roundName: 'Tranh Hạng 3',
        roundIndex: 2,
        matchNumber: startingMatchNum + 2,
        team1Id: null,
        team2Id: null,
        status: 'scheduled',
        courtName: 'Sân 2',
        scheduledTime: '13:30',
        scores: [],
        winnerId: null,
        isThirdPlace: true,
      });

      matches.push({
        id: finalId,
        tournamentId: tournament.id,
        stage: 'playoff',
        roundName: 'Chung Kết Vô Địch',
        roundIndex: 2,
        matchNumber: startingMatchNum + 3,
        team1Id: null,
        team2Id: null,
        status: 'scheduled',
        courtName: 'Sân 1 (Center)',
        scheduledTime: '14:30',
        scores: [],
        winnerId: null,
      });

      return matches;
    }

    if (count >= 8) {
      // 8 Teams: Quarter-finals -> Semi-finals -> Finals
      const qf1 = 'm_playoff_qf_01';
      const qf2 = 'm_playoff_qf_02';
      const qf3 = 'm_playoff_qf_03';
      const qf4 = 'm_playoff_qf_04';
      const sf1 = 'm_playoff_sf_01';
      const sf2 = 'm_playoff_sf_02';
      const final = 'm_playoff_final';
      const bronze = 'm_playoff_bronze';

      let mNum = startingMatchNum;

      // 4 Quarterfinals
      matches.push({
        id: qf1,
        tournamentId: tournament.id,
        stage: 'playoff',
        roundName: 'Tứ Kết 1',
        roundIndex: 1,
        matchNumber: mNum++,
        team1Id: qualifiedTeams[0]?.teamId || null,
        team2Id: qualifiedTeams[7]?.teamId || null,
        status: 'scheduled',
        courtName: 'Sân 1',
        scheduledTime: '09:00',
        scores: [],
        winnerId: null,
        nextMatchId: sf1,
        nextSlotIndex: 1,
      });

      matches.push({
        id: qf2,
        tournamentId: tournament.id,
        stage: 'playoff',
        roundName: 'Tứ Kết 2',
        roundIndex: 1,
        matchNumber: mNum++,
        team1Id: qualifiedTeams[3]?.teamId || null,
        team2Id: qualifiedTeams[4]?.teamId || null,
        status: 'scheduled',
        courtName: 'Sân 2',
        scheduledTime: '09:00',
        scores: [],
        winnerId: null,
        nextMatchId: sf1,
        nextSlotIndex: 2,
      });

      matches.push({
        id: qf3,
        tournamentId: tournament.id,
        stage: 'playoff',
        roundName: 'Tứ Kết 3',
        roundIndex: 1,
        matchNumber: mNum++,
        team1Id: qualifiedTeams[1]?.teamId || null,
        team2Id: qualifiedTeams[6]?.teamId || null,
        status: 'scheduled',
        courtName: 'Sân 3',
        scheduledTime: '09:00',
        scores: [],
        winnerId: null,
        nextMatchId: sf2,
        nextSlotIndex: 1,
      });

      matches.push({
        id: qf4,
        tournamentId: tournament.id,
        stage: 'playoff',
        roundName: 'Tứ Kết 4',
        roundIndex: 1,
        matchNumber: mNum++,
        team1Id: qualifiedTeams[2]?.teamId || null,
        team2Id: qualifiedTeams[5]?.teamId || null,
        status: 'scheduled',
        courtName: 'Sân 4',
        scheduledTime: '09:00',
        scores: [],
        winnerId: null,
        nextMatchId: sf2,
        nextSlotIndex: 2,
      });

      // Semi-finals
      matches.push({
        id: sf1,
        tournamentId: tournament.id,
        stage: 'playoff',
        roundName: 'Bán Kết 1',
        roundIndex: 2,
        matchNumber: mNum++,
        team1Id: null,
        team2Id: null,
        status: 'scheduled',
        courtName: 'Sân 1 (Center)',
        scheduledTime: '11:00',
        scores: [],
        winnerId: null,
        nextMatchId: final,
        nextSlotIndex: 1,
      });

      matches.push({
        id: sf2,
        tournamentId: tournament.id,
        stage: 'playoff',
        roundName: 'Bán Kết 2',
        roundIndex: 2,
        matchNumber: mNum++,
        team1Id: null,
        team2Id: null,
        status: 'scheduled',
        courtName: 'Sân 2',
        scheduledTime: '11:00',
        scores: [],
        winnerId: null,
        nextMatchId: final,
        nextSlotIndex: 2,
      });

      // Tranh hạng 3
      matches.push({
        id: bronze,
        tournamentId: tournament.id,
        stage: 'playoff',
        roundName: 'Tranh Hạng 3',
        roundIndex: 3,
        matchNumber: mNum++,
        team1Id: null,
        team2Id: null,
        status: 'scheduled',
        courtName: 'Sân 2',
        scheduledTime: '13:30',
        scores: [],
        winnerId: null,
        isThirdPlace: true,
      });

      // Chung Kết
      matches.push({
        id: final,
        tournamentId: tournament.id,
        stage: 'playoff',
        roundName: 'Chung Kết Vô Địch',
        roundIndex: 3,
        matchNumber: mNum++,
        team1Id: null,
        team2Id: null,
        status: 'scheduled',
        courtName: 'Sân 1 (Center)',
        scheduledTime: '15:00',
        scores: [],
        winnerId: null,
      });

      return matches;
    }

    return matches;
  },

  /**
   * Determine match winner from game scores
   */
  evaluateMatchWinner(
    scores: { gameNumber: number; team1Score: number; team2Score: number }[],
    team1Id: string,
    team2Id: string,
    matchFormat: 'best_of_1' | 'best_of_3'
  ): { winnerId: string | null; isFinished: boolean } {
    let t1Wins = 0;
    let t2Wins = 0;

    scores.forEach((s) => {
      if (s.team1Score > s.team2Score) {
        t1Wins++;
      } else if (s.team2Score > s.team1Score) {
        t2Wins++;
      }
    });

    const winTarget = matchFormat === 'best_of_1' ? 1 : 2;

    if (t1Wins >= winTarget) {
      return { winnerId: team1Id, isFinished: true };
    }
    if (t2Wins >= winTarget) {
      return { winnerId: team2Id, isFinished: true };
    }

    return { winnerId: null, isFinished: false };
  },
};
