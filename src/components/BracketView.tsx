import React, { useState } from 'react';
import {
  Trophy,
  PlayCircle,
  Clock,
  Sparkles,
  RotateCcw,
  RefreshCw,
  X
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Match, Team, Tournament, getStageRuleForMatch } from '../types/tournament.ts';

interface BracketViewProps {
  tournament: Tournament | null;
  matches: Match[];
  teams: Team[];
  onOpenScoreModal: (match: Match) => void;
  onRegenerateBracket: () => void;
}

export const BracketView: React.FC<BracketViewProps> = ({
  tournament,
  matches,
  teams,
  onOpenScoreModal,
  onRegenerateBracket,
}) => {
  const [showChampionModal, setShowChampionModal] = useState(false);

  const teamsMap = teams.reduce<Record<string, Team>>((acc, t) => {
    acc[t.id] = t;
    return acc;
  }, {});

  const playoffMatches = matches.filter((m) => m.stage === 'playoff');

  // Find final match
  const finalMatch = playoffMatches.find(
    (m) => m.roundName.includes('Chung Kết') && !m.isThirdPlace
  );
  const championTeam = finalMatch?.winnerId ? teamsMap[finalMatch.winnerId] : null;

  // Third place match
  const thirdPlaceMatch = playoffMatches.find((m) => m.isThirdPlace);
  const thirdPlaceTeam = thirdPlaceMatch?.winnerId ? teamsMap[thirdPlaceMatch.winnerId] : null;

  // Group playoff matches by roundIndex
  const roundsMap: Record<number, Match[]> = {};
  playoffMatches.forEach((m) => {
    if (m.isThirdPlace) return; // Render third place separately
    if (!roundsMap[m.roundIndex]) {
      roundsMap[m.roundIndex] = [];
    }
    roundsMap[m.roundIndex].push(m);
  });

  const sortedRoundIndexes = Object.keys(roundsMap)
    .map(Number)
    .sort((a, b) => a - b);

  // Trigger celebration confetti
  const triggerConfetti = () => {
    confetti({
      particleCount: 120,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#10B981', '#0284C7', '#F59E0B', '#10b981'],
    });
  };

  const getRoundTitle = (roundIdx: number, matchesInRound: Match[]) => {
    if (matchesInRound[0]?.roundName) {
      if (matchesInRound[0].roundName.includes('Chung Kết')) return 'Chung Kết Vô Địch';
      if (matchesInRound[0].roundName.includes('Bán Kết')) return 'Vòng Bán Kết';
      if (matchesInRound[0].roundName.includes('Tứ Kết')) return 'Vòng Tứ Kết';
      if (matchesInRound[0].roundName.includes('1/8')) return 'Vòng 1/8 (Vòng 16)';
    }
    return `Vòng ${roundIdx}`;
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Sơ Đồ Nhánh Đấu Playoff (Knockout Bracket)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Sơ đồ hình cây trực quan · Tự động đôn đội thắng vào vòng kế tiếp · Vinh danh Nhà Vô Địch
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {championTeam && (
            <button
              onClick={() => {
                setShowChampionModal(true);
                triggerConfetti();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-lg shadow-2xs transition-colors"
            >
              <Trophy className="w-3.5 h-3.5 text-amber-600" />
              <span>Vinh Danh Nhà Vô Địch</span>
            </button>
          )}

          <button
            onClick={onRegenerateBracket}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
            <span>Làm Mới Nhánh Playoff</span>
          </button>
        </div>
      </div>

      {/* Champion Banner if final is completed */}
      {championTeam && (
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-amber-50 via-yellow-50 to-emerald-50 border border-amber-300 p-5 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm">
              <Trophy className="w-8 h-8 text-white" />
            </div>
            <div>
              <span className="text-[11px] font-bold tracking-wider text-amber-800 uppercase block font-mono">
                NHÀ VÔ ĐỊCH GIẢI ĐẤU (CHAMPION)
              </span>
              <h3 className="text-xl font-extrabold text-slate-900">
                {championTeam.name}
              </h3>
              <p className="text-xs text-slate-600">
                {championTeam.player2
                  ? `${championTeam.player1} & ${championTeam.player2}`
                  : championTeam.player1}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setShowChampionModal(true);
              triggerConfetti();
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-lg shadow-sm transition-colors whitespace-nowrap"
          >
            <Sparkles className="w-4 h-4" />
            <span>Xem Lễ Trao Cúp</span>
          </button>
        </div>
      )}

      {/* Interactive Bracket Tree View */}
      {playoffMatches.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
          <Trophy className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h4 className="text-sm font-semibold text-slate-800">
            Chưa có nhánh đấu Playoff
          </h4>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Nhấn nút &ldquo;Cập Nhật Vào Nhánh Playoff&rdquo; từ tab Bảng Xếp Hạng hoặc tạo nhánh đấu trực tiếp.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs overflow-x-auto">
          <div className="flex items-stretch gap-12 min-w-[760px] pb-4">
            {sortedRoundIndexes.map((roundIdx, colIndex) => {
              const matchesInRound = roundsMap[roundIdx] || [];
              const roundTitle = getRoundTitle(roundIdx, matchesInRound);
              const isFinalRound = colIndex === sortedRoundIndexes.length - 1;

              return (
                <div
                  key={roundIdx}
                  className="flex-1 flex flex-col justify-around min-w-[240px] max-w-[280px]"
                >
                  {/* Round Header */}
                  <div className="text-center pb-4 mb-4 border-b border-slate-200">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                      {roundTitle}
                    </h3>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {matchesInRound.length} trận đấu
                    </span>
                  </div>

                  {/* Matches List in Round */}
                  <div className="space-y-8 my-auto">
                    {matchesInRound.map((match) => {
                      const t1 = match.team1Id ? teamsMap[match.team1Id] : null;
                      const t2 = match.team2Id ? teamsMap[match.team2Id] : null;
                      const isCompleted = match.status === 'completed';
                      const stageRule = tournament ? getStageRuleForMatch(match, tournament) : null;

                      return (
                        <div
                          key={match.id}
                          className={`relative rounded-xl border transition-all ${
                            isCompleted
                              ? 'border-slate-200 bg-white shadow-2xs'
                              : 'border-emerald-300/80 bg-slate-50/50 shadow-2xs'
                          }`}
                        >
                          {/* Match Info bar */}
                          <div className="flex items-center justify-between px-3 py-1.5 bg-slate-50 border-b border-slate-100 rounded-t-xl text-[10px] font-mono text-slate-500">
                            <div className="flex items-center gap-1.5 truncate">
                              <span className="font-semibold text-slate-700">
                                {match.roundName}
                              </span>
                              {stageRule && (
                                <span className="text-[9px] font-bold text-emerald-800 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200">
                                  {stageRule.pointsPerGame}p · {stageRule.matchFormat === 'best_of_1' ? 'Bo1' : stageRule.matchFormat === 'best_of_3' ? 'Bo3' : 'Bo5'}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <Clock className="w-2.5 h-2.5" />
                              <span>{match.scheduledTime}</span>
                              <span>·</span>
                              <span>{match.courtName}</span>
                            </div>
                          </div>

                          {/* Team 1 Slot */}
                          <div
                            className={`flex items-center justify-between p-2.5 ${
                              match.winnerId && match.winnerId === match.team1Id
                                ? 'bg-emerald-50/80 text-emerald-950 font-bold'
                                : 'text-slate-800'
                            }`}
                          >
                            <div className="truncate pr-2">
                              <div className="text-xs font-semibold truncate">
                                {t1 ? t1.name : (
                                  <span className="text-slate-400 italic">Chờ nhánh trước</span>
                                )}
                              </div>
                              {t1 && (
                                <div className="text-[10px] text-slate-500 font-normal truncate">
                                  {t1.player2 ? `${t1.player1} & ${t1.player2}` : t1.player1}
                                </div>
                              )}
                            </div>

                            {/* Scores for Team 1 */}
                            {match.scores && match.scores.length > 0 && (
                              <div className="flex items-center gap-1 shrink-0 font-mono text-xs font-bold tabular-nums">
                                {match.scores.map((sc, i) => (
                                  <span
                                    key={i}
                                    className={`px-1.5 py-0.5 rounded text-[11px] ${
                                      sc.team1Score > sc.team2Score
                                        ? 'bg-emerald-600 text-white'
                                        : 'bg-slate-100 text-slate-600'
                                    }`}
                                  >
                                    {sc.team1Score}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Divider */}
                          <div className="h-px bg-slate-100" />

                          {/* Team 2 Slot */}
                          <div
                            className={`flex items-center justify-between p-2.5 ${
                              match.winnerId && match.winnerId === match.team2Id
                                ? 'bg-emerald-50/80 text-emerald-950 font-bold'
                                : 'text-slate-800'
                            }`}
                          >
                            <div className="truncate pr-2">
                              <div className="text-xs font-semibold truncate">
                                {t2 ? t2.name : (
                                  <span className="text-slate-400 italic">Chờ nhánh trước</span>
                                )}
                              </div>
                              {t2 && (
                                <div className="text-[10px] text-slate-500 font-normal truncate">
                                  {t2.player2 ? `${t2.player1} & ${t2.player2}` : t2.player1}
                                </div>
                              )}
                            </div>

                            {/* Scores for Team 2 */}
                            {match.scores && match.scores.length > 0 && (
                              <div className="flex items-center gap-1 shrink-0 font-mono text-xs font-bold tabular-nums">
                                {match.scores.map((sc, i) => (
                                  <span
                                    key={i}
                                    className={`px-1.5 py-0.5 rounded text-[11px] ${
                                      sc.team2Score > sc.team1Score
                                        ? 'bg-emerald-600 text-white'
                                        : 'bg-slate-100 text-slate-600'
                                    }`}
                                  >
                                    {sc.team2Score}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Quick Score Action Button */}
                          <div className="p-1.5 bg-slate-50/50 rounded-b-xl border-t border-slate-100 flex items-center justify-end">
                            <button
                              onClick={() => onOpenScoreModal(match)}
                              disabled={!match.team1Id || !match.team2Id}
                              className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 disabled:opacity-40 transition-colors"
                            >
                              <PlayCircle className="w-3 h-3" />
                              <span>{isCompleted ? 'Sửa Tỷ Số' : 'Nhập Điểm'}</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Third Place Match Row */}
          {thirdPlaceMatch && (
            <div className="mt-8 pt-6 border-t border-slate-200 max-w-md mx-auto">
              <div className="text-center mb-3">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                  TRẬN TRANH HUY CHƯƠNG ĐỒNG (HẠNG 3)
                </span>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-2xs">
                <div className="flex items-center justify-between text-xs pb-2 mb-2 border-b border-slate-100 font-mono text-slate-500">
                  <span>Tranh Hạng 3</span>
                  <span>{thirdPlaceMatch.courtName} · {thirdPlaceMatch.scheduledTime}</span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className={`text-xs font-semibold ${thirdPlaceMatch.winnerId === thirdPlaceMatch.team1Id ? 'text-emerald-700 font-bold' : 'text-slate-800'}`}>
                    {thirdPlaceMatch.team1Id ? teamsMap[thirdPlaceMatch.team1Id]?.name : 'Thua Bán Kết 1'}
                  </span>
                  {thirdPlaceMatch.scores && (
                    <span className="font-mono text-xs font-bold text-slate-700">
                      {thirdPlaceMatch.scores.map(s => s.team1Score).join(' / ')}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className={`text-xs font-semibold ${thirdPlaceMatch.winnerId === thirdPlaceMatch.team2Id ? 'text-emerald-700 font-bold' : 'text-slate-800'}`}>
                    {thirdPlaceMatch.team2Id ? teamsMap[thirdPlaceMatch.team2Id]?.name : 'Thua Bán Kết 2'}
                  </span>
                  {thirdPlaceMatch.scores && (
                    <span className="font-mono text-xs font-bold text-slate-700">
                      {thirdPlaceMatch.scores.map(s => s.team2Score).join(' / ')}
                    </span>
                  )}
                </div>
                <div className="pt-2 mt-2 border-t border-slate-100 flex items-center justify-end">
                  <button
                    onClick={() => onOpenScoreModal(thirdPlaceMatch)}
                    className="flex items-center gap-1 text-xs text-emerald-700 font-semibold"
                  >
                    <PlayCircle className="w-3.5 h-3.5" />
                    <span>Nhập Tỷ Số</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Champion Trophy Celebration Modal */}
      {showChampionModal && championTeam && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-amber-300 max-w-md w-full p-6 text-center space-y-4 relative animate-in fade-in zoom-in-95">
            <button
              onClick={() => setShowChampionModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Generated Gold Trophy Photo */}
            <div className="w-36 h-36 mx-auto rounded-2xl overflow-hidden border-2 border-amber-300 shadow-md">
              <img
                src="/src/assets/images/pickleball_gold_trophy_1791855135099.jpg"
                alt="Cúp Vàng Vô Địch Pickleball"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>

            <div>
              <span className="text-xs font-bold font-mono tracking-widest text-amber-600 uppercase block mb-1">
                CHÚC MỪNG NHÀ VÔ ĐỊCH
              </span>
              <h3 className="text-2xl font-extrabold text-slate-900">
                {championTeam.name}
              </h3>
              <p className="text-sm text-slate-600 font-medium mt-1">
                {championTeam.player2
                  ? `${championTeam.player1} & ${championTeam.player2}`
                  : championTeam.player1}
              </p>
              <p className="text-xs text-slate-400 mt-2">
                Đã xuất sắc giành chiến thắng tại {tournament?.name}
              </p>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-center gap-3">
              <button
                onClick={triggerConfetti}
                className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-lg shadow-sm transition-colors"
              >
                <Sparkles className="w-4 h-4" />
                <span>Bắn Pháo Hoa Ăn Mừng</span>
              </button>
              <button
                onClick={() => setShowChampionModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
