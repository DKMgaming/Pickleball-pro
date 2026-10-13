import React, { useState } from 'react';
import { X, Trophy, CheckCircle2, ShieldCheck, Info } from 'lucide-react';
import { Match, Team, Tournament, GameScore, getStageRuleForMatch } from '../types/tournament.ts';

interface ScoreInputModalProps {
  match: Match | null;
  tournament: Tournament;
  teamsMap: Record<string, Team>;
  onClose: () => void;
  onSaveScore: (
    matchId: string,
    scores: GameScore[],
    winnerId: string | null,
    status: 'scheduled' | 'in_progress' | 'completed'
  ) => void;
}

export const ScoreInputModal: React.FC<ScoreInputModalProps> = ({
  match,
  tournament,
  teamsMap,
  onClose,
  onSaveScore,
}) => {
  if (!match) return null;

  const team1 = match.team1Id ? teamsMap[match.team1Id] : null;
  const team2 = match.team2Id ? teamsMap[match.team2Id] : null;

  // Retrieve exact rule configured specifically for this tournament stage!
  const stageRule = getStageRuleForMatch(match, tournament);
  const targetScore = stageRule.pointsPerGame; // 11, 15, 21
  const isBestOfThree = stageRule.matchFormat === 'best_of_3';
  const isBestOfFive = stageRule.matchFormat === 'best_of_5';
  const isBestOfOne = stageRule.matchFormat === 'best_of_1';
  const winTarget = isBestOfFive ? 3 : isBestOfThree ? 2 : 1;
  const winByTwo = stageRule.winByTwo;

  // Initialize scores for up to 5 games
  const [g1T1, setG1T1] = useState<number>(match.scores[0]?.team1Score ?? 0);
  const [g1T2, setG1T2] = useState<number>(match.scores[0]?.team2Score ?? 0);

  const [g2T1, setG2T1] = useState<number>(match.scores[1]?.team1Score ?? 0);
  const [g2T2, setG2T2] = useState<number>(match.scores[1]?.team2Score ?? 0);

  const [g3T1, setG3T1] = useState<number>(match.scores[2]?.team1Score ?? 0);
  const [g3T2, setG3T2] = useState<number>(match.scores[2]?.team2Score ?? 0);

  const [g4T1, setG4T1] = useState<number>(match.scores[3]?.team1Score ?? 0);
  const [g4T2, setG4T2] = useState<number>(match.scores[3]?.team2Score ?? 0);

  const [g5T1, setG5T1] = useState<number>(match.scores[4]?.team1Score ?? 0);
  const [g5T2, setG5T2] = useState<number>(match.scores[4]?.team2Score ?? 0);

  // Validate a single game according to this stage's rule (targetScore, win by 2)
  const validateGame = (s1: number, s2: number): { valid: boolean; winner: 1 | 2 | null } => {
    if (s1 === 0 && s2 === 0) return { valid: true, winner: null };
    const max = Math.max(s1, s2);
    const diff = Math.abs(s1 - s2);

    if (max < targetScore) {
      return { valid: false, winner: null };
    }

    if (winByTwo && diff < 2) {
      return { valid: false, winner: null };
    }

    return { valid: true, winner: s1 > s2 ? 1 : 2 };
  };

  // Compute game wins
  const g1Res = validateGame(g1T1, g1T2);
  const g2Res = validateGame(g2T1, g2T2);
  const g3Res = validateGame(g3T1, g3T2);
  const g4Res = validateGame(g4T1, g4T2);
  const g5Res = validateGame(g5T1, g5T2);

  let t1GamesWon = 0;
  let t2GamesWon = 0;

  if (g1Res.winner === 1) t1GamesWon++;
  if (g1Res.winner === 2) t2GamesWon++;

  if (!isBestOfOne) {
    if (g2Res.winner === 1) t1GamesWon++;
    if (g2Res.winner === 2) t2GamesWon++;

    if (t1GamesWon < winTarget && t2GamesWon < winTarget) {
      if (g3Res.winner === 1) t1GamesWon++;
      if (g3Res.winner === 2) t2GamesWon++;
    }

    if (isBestOfFive) {
      if (t1GamesWon < winTarget && t2GamesWon < winTarget) {
        if (g4Res.winner === 1) t1GamesWon++;
        if (g4Res.winner === 2) t2GamesWon++;
      }
      if (t1GamesWon < winTarget && t2GamesWon < winTarget) {
        if (g5Res.winner === 1) t1GamesWon++;
        if (g5Res.winner === 2) t2GamesWon++;
      }
    }
  }

  const determinedWinnerId =
    t1GamesWon >= winTarget
      ? match.team1Id
      : t2GamesWon >= winTarget
      ? match.team2Id
      : null;

  const handleSave = () => {
    if (!match.team1Id || !match.team2Id) {
      alert('Trận đấu chưa xác định đủ hai đội thi đấu.');
      return;
    }

    const scoresList: GameScore[] = [];

    // Game 1
    if (g1T1 > 0 || g1T2 > 0) {
      scoresList.push({ gameNumber: 1, team1Score: g1T1, team2Score: g1T2 });
    }

    // Game 2 & 3
    if (!isBestOfOne) {
      if (g2T1 > 0 || g2T2 > 0) {
        scoresList.push({ gameNumber: 2, team1Score: g2T1, team2Score: g2T2 });
      }
      if (g3T1 > 0 || g3T2 > 0) {
        scoresList.push({ gameNumber: 3, team1Score: g3T1, team2Score: g3T2 });
      }
    }

    // Game 4 & 5
    if (isBestOfFive) {
      if (g4T1 > 0 || g4T2 > 0) {
        scoresList.push({ gameNumber: 4, team1Score: g4T1, team2Score: g4T2 });
      }
      if (g5T1 > 0 || g5T2 > 0) {
        scoresList.push({ gameNumber: 5, team1Score: g5T1, team2Score: g5T2 });
      }
    }

    const status = determinedWinnerId ? 'completed' : 'in_progress';
    onSaveScore(match.id, scoresList, determinedWinnerId, status);
    onClose();
  };

  const getFormatLabel = () => {
    if (isBestOfOne) return '1 Hiệp Duy Nhất (Bo1)';
    if (isBestOfThree) return '3 Hiệp Thắng 2 (Bo2/3)';
    return '5 Hiệp Thắng 3 (Bo5)';
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <span className="text-xs font-mono text-emerald-700 font-bold uppercase">
              {match.stage === 'group' ? 'VÒNG BẢNG' : 'VÒNG PLAYOFF'} · {match.roundName}
            </span>
            <h3 className="text-base font-bold text-slate-900">
              Ghi Tỷ Số Trận Đấu #{match.matchNumber}
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stage-Specific Rule Notification Card */}
        <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs text-emerald-950 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <div>
              <span className="font-bold text-emerald-900 block">
                Quy Tắc Điểm Vòng: {match.roundName}
              </span>
              <span className="text-[11px] text-emerald-800">
                Chạm {targetScore} điểm {winByTwo ? '(Cách 2 điểm)' : ''} · {getFormatLabel()}
              </span>
            </div>
          </div>
          <span className="font-mono text-xs font-bold text-emerald-800 bg-white px-2 py-1 rounded border border-emerald-200 shrink-0">
            CẦN THẮNG {winTarget} HIỆP
          </span>
        </div>

        {/* Teams Matchup Header */}
        <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
          <div className={`p-2 rounded-lg ${determinedWinnerId === match.team1Id ? 'bg-emerald-100/70 border border-emerald-300' : ''}`}>
            <span className="text-[11px] font-mono text-slate-400 block mb-0.5">
              ĐỘI 1 ({team1?.code || '—'})
            </span>
            <div className="font-bold text-slate-900 text-sm truncate">
              {team1?.name || 'Chờ xác định'}
            </div>
            <div className="text-xs text-slate-500 truncate">
              {team1?.player2 ? `${team1.player1} & ${team1.player2}` : team1?.player1}
            </div>
            {determinedWinnerId === match.team1Id && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 mt-1">
                <Trophy className="w-3 h-3" /> Thắng trận ({t1GamesWon}-{t2GamesWon})
              </span>
            )}
          </div>

          <div className={`p-2 rounded-lg text-right ${determinedWinnerId === match.team2Id ? 'bg-emerald-100/70 border border-emerald-300' : ''}`}>
            <span className="text-[11px] font-mono text-slate-400 block mb-0.5">
              ĐỘI 2 ({team2?.code || '—'})
            </span>
            <div className="font-bold text-slate-900 text-sm truncate">
              {team2?.name || 'Chờ xác định'}
            </div>
            <div className="text-xs text-slate-500 truncate">
              {team2?.player2 ? `${team2.player1} & ${team2.player2}` : team2?.player1}
            </div>
            {determinedWinnerId === match.team2Id && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 mt-1">
                <Trophy className="w-3 h-3" /> Thắng trận ({t2GamesWon}-{t1GamesWon})
              </span>
            )}
          </div>
        </div>

        {/* Score Inputs Form */}
        <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
          {/* Game 1 */}
          <div className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl">
            <div>
              <span className="text-xs font-bold text-slate-800 block">Hiệp 1 (Game 1)</span>
              <span className="text-[10px] text-slate-400 font-mono">Chạm {targetScore}</span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min="0"
                max="40"
                value={g1T1}
                onChange={(e) => setG1T1(parseInt(e.target.value, 10) || 0)}
                className="w-14 text-center py-1.5 font-mono text-sm font-bold bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <span className="text-slate-400 font-bold">-</span>
              <input
                type="number"
                min="0"
                max="40"
                value={g1T2}
                onChange={(e) => setG1T2(parseInt(e.target.value, 10) || 0)}
                className="w-14 text-center py-1.5 font-mono text-sm font-bold bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Game 2 */}
          {!isBestOfOne && (
            <div className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl">
              <div>
                <span className="text-xs font-bold text-slate-800 block">Hiệp 2 (Game 2)</span>
                <span className="text-[10px] text-slate-400 font-mono">Chạm {targetScore}</span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="0"
                  max="40"
                  value={g2T1}
                  onChange={(e) => setG2T1(parseInt(e.target.value, 10) || 0)}
                  className="w-14 text-center py-1.5 font-mono text-sm font-bold bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <span className="text-slate-400 font-bold">-</span>
                <input
                  type="number"
                  min="0"
                  max="40"
                  value={g2T2}
                  onChange={(e) => setG2T2(parseInt(e.target.value, 10) || 0)}
                  className="w-14 text-center py-1.5 font-mono text-sm font-bold bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          )}

          {/* Game 3 (Deciding Game for Bo3) */}
          {!isBestOfOne && (
            <div className={`flex items-center justify-between p-3 bg-white border rounded-xl ${
              t1GamesWon === 1 && t2GamesWon === 1 ? 'border-amber-400 bg-amber-50/20' : 'border-slate-200 opacity-75'
            }`}>
              <div>
                <span className="text-xs font-bold text-slate-800 block">Hiệp 3 (Game 3)</span>
                <span className="text-[10px] text-slate-400 font-mono">Quyết định khi hòa 1-1</span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="0"
                  max="40"
                  value={g3T1}
                  onChange={(e) => setG3T1(parseInt(e.target.value, 10) || 0)}
                  className="w-14 text-center py-1.5 font-mono text-sm font-bold bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <span className="text-slate-400 font-bold">-</span>
                <input
                  type="number"
                  min="0"
                  max="40"
                  value={g3T2}
                  onChange={(e) => setG3T2(parseInt(e.target.value, 10) || 0)}
                  className="w-14 text-center py-1.5 font-mono text-sm font-bold bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          )}

          {/* Game 4 & 5 if Best of 5 */}
          {isBestOfFive && (
            <>
              <div className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Hiệp 4 (Game 4)</span>
                  <span className="text-[10px] text-slate-400 font-mono">Chạm {targetScore}</span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="0"
                    max="40"
                    value={g4T1}
                    onChange={(e) => setG4T1(parseInt(e.target.value, 10) || 0)}
                    className="w-14 text-center py-1.5 font-mono text-sm font-bold bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="text-slate-400 font-bold">-</span>
                  <input
                    type="number"
                    min="0"
                    max="40"
                    value={g4T2}
                    onChange={(e) => setG4T2(parseInt(e.target.value, 10) || 0)}
                    className="w-14 text-center py-1.5 font-mono text-sm font-bold bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Hiệp 5 (Game 5 Quyết Định)</span>
                  <span className="text-[10px] text-slate-400 font-mono">Chạm {targetScore}</span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="0"
                    max="40"
                    value={g5T1}
                    onChange={(e) => setG5T1(parseInt(e.target.value, 10) || 0)}
                    className="w-14 text-center py-1.5 font-mono text-sm font-bold bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="text-slate-400 font-bold">-</span>
                  <input
                    type="number"
                    min="0"
                    max="40"
                    value={g5T2}
                    onChange={(e) => setG5T2(parseInt(e.target.value, 10) || 0)}
                    className="w-14 text-center py-1.5 font-mono text-sm font-bold bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Actions Footer */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            {determinedWinnerId ? (
              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Đã xác định người thắng ({t1GamesWon}-{t2GamesWon})
              </span>
            ) : (
              <span className="text-slate-400">Chưa đủ điểm thắng trận</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Hủy
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-lg shadow-sm transition-colors"
            >
              Lưu Kết Quả Trận
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
