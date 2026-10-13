import React, { useState } from 'react';
import {
  Shuffle,
  Calendar,
  Layers,
  Clock,
  PlayCircle,
  FileSpreadsheet,
  CheckCircle2
} from 'lucide-react';
import { Group, Match, Team, Tournament } from '../types/tournament.ts';
import { BracketService } from '../services/bracketService.ts';
import { ExcelService } from '../services/excelService.ts';

interface GroupsSchedulerProps {
  tournament: Tournament | null;
  groups: Group[];
  matches: Match[];
  teams: Team[];
  onUpdateGroupsAndMatches: (groups: Group[], matches: Match[]) => void;
  onOpenScoreModal: (match: Match) => void;
}

export const GroupsScheduler: React.FC<GroupsSchedulerProps> = ({
  tournament,
  groups,
  matches,
  teams,
  onUpdateGroupsAndMatches,
  onOpenScoreModal,
}) => {
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string>('all');
  const [drawMethod, setDrawMethod] = useState<'seeded' | 'random'>('seeded');
  const [groupsCountSelect, setGroupsCountSelect] = useState<number>(
    tournament?.groupsCount || 2
  );
  const [showDrawConfig, setShowDrawConfig] = useState(false);

  const teamsMap = teams.reduce<Record<string, Team>>((acc, t) => {
    acc[t.id] = t;
    return acc;
  }, {});

  // Trigger automated draw & round-robin schedule generation
  const handleGenerateGroupsAndSchedule = () => {
    if (!tournament) return;
    if (teams.length < 2) {
      alert('Cần có ít nhất 2 đội thi đấu để chia bảng.');
      return;
    }

    const { groups: newGroups } = BracketService.drawGroups(
      teams,
      tournament.id,
      groupsCountSelect,
      drawMethod
    );

    const roundRobinMatches = BracketService.generateRoundRobinSchedule(
      tournament,
      newGroups,
      tournament.courtsCount
    );

    // Keep playoff matches if any, or initialize only group stage
    const existingPlayoff = matches.filter((m) => m.stage === 'playoff');
    onUpdateGroupsAndMatches(newGroups, [...roundRobinMatches, ...existingPlayoff]);
    setShowDrawConfig(false);
  };

  const groupMatches = matches.filter((m) => m.stage === 'group');

  const filteredMatches = groupMatches.filter((m) => {
    if (selectedGroupFilter === 'all') return true;
    return m.groupId === selectedGroupFilter;
  });

  return (
    <div className="space-y-6">
      {/* Top action header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Vòng Bảng & Lập Lịch Thi Đấu (Round Robin)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Thuật toán xoay vòng tròn chuẩn quốc tế · Tự động chia sân & khung giờ thi đấu
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Export schedule to Excel */}
          <button
            onClick={() =>
              ExcelService.exportSchedule(
                groupMatches,
                teamsMap,
                tournament?.name || 'Pickleball'
              )
            }
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Xuất Lịch (.xlsx)</span>
          </button>

          {/* Toggle Draw Configuration */}
          <button
            onClick={() => setShowDrawConfig(!showDrawConfig)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-2xs transition-colors"
          >
            <Shuffle className="w-3.5 h-3.5" />
            <span>Bốc Thăm & Tạo Lịch</span>
          </button>
        </div>
      </div>

      {/* Auto Draw Configuration Panel */}
      {showDrawConfig && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 tracking-wide">
              CẤU HÌNH THUẬT TOÁN CHIA BẢNG & LẬP LỊCH
            </h3>
            <span className="text-[11px] text-slate-500 font-mono">
              Tổng số đội: {teams.length}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Số lượng bảng đấu
              </label>
              <select
                value={groupsCountSelect}
                onChange={(e) => setGroupsCountSelect(parseInt(e.target.value, 10))}
                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-mono"
              >
                <option value={1}>1 Bảng (Đấu vòng tròn tất cả)</option>
                <option value={2}>2 Bảng (Bảng A, B)</option>
                <option value={4}>4 Bảng (Bảng A, B, C, D)</option>
                <option value={8}>8 Bảng (Bảng A tới H)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Thuật toán phân bổ đội
              </label>
              <select
                value={drawMethod}
                onChange={(e) =>
                  setDrawMethod(e.target.value as 'seeded' | 'random')
                }
                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
              >
                <option value="seeded">Theo Hạt Giống (Rải đều hạt giống)</option>
                <option value="random">Bốc Thăm Ngẫu Nhiên (Random Draw)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Số sân thi đấu
              </label>
              <div className="px-3 py-1.5 text-xs bg-slate-100 border border-slate-200 rounded-lg text-slate-700 font-mono">
                {tournament?.courtsCount || 4} Sân (Từ thiết lập giải)
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
            <button
              onClick={() => setShowDrawConfig(false)}
              className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Đóng
            </button>
            <button
              onClick={handleGenerateGroupsAndSchedule}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors"
            >
              <Shuffle className="w-3.5 h-3.5" />
              <span>Tiến Hành Chia Bảng & Sinh Lịch</span>
            </button>
          </div>
        </div>
      )}

      {/* Groups visual breakdown */}
      {groups.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {groups.map((group) => (
            <div
              key={group.id}
              className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs"
            >
              <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-900">{group.name}</span>
                <span className="text-[11px] font-mono text-slate-500">
                  {group.teamIds.length} đội
                </span>
              </div>
              <ul className="space-y-1.5">
                {group.teamIds.map((tId, idx) => {
                  const team = teamsMap[tId];
                  return (
                    <li
                      key={tId}
                      className="flex items-center justify-between text-xs py-1 px-2 rounded-md bg-slate-50 border border-slate-100"
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="font-mono text-slate-400 text-[10px]">
                          {idx + 1}.
                        </span>
                        <span className="font-semibold text-slate-800 truncate">
                          {team ? team.name : 'Vô danh'}
                        </span>
                      </div>
                      {team?.seed && (
                        <span className="text-[10px] font-mono text-amber-700 font-bold bg-amber-50 px-1 rounded">
                          #{team.seed}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      )}

      {/* Filter by Group Tabs */}
      {groups.length > 0 && (
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg max-w-fit">
          <button
            onClick={() => setSelectedGroupFilter('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              selectedGroupFilter === 'all'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tất Cả Các Bảng ({groupMatches.length} trận)
          </button>
          {groups.map((g) => (
            <button
              key={g.id}
              onClick={() => setSelectedGroupFilter(g.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                selectedGroupFilter === g.id
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {g.name}
            </button>
          ))}
        </div>
      )}

      {/* Matches Grid */}
      {filteredMatches.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
          <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h4 className="text-sm font-semibold text-slate-800">
            Chưa có lịch thi đấu vòng bảng
          </h4>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Nhấn nút &ldquo;Bốc Thăm & Tạo Lịch&rdquo; ở trên để tự động chia bảng và sinh lịch thi đấu theo thuật toán.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMatches.map((match) => {
            const team1 = match.team1Id ? teamsMap[match.team1Id] : null;
            const team2 = match.team2Id ? teamsMap[match.team2Id] : null;
            const isCompleted = match.status === 'completed';
            const isLive = match.status === 'in_progress';

            return (
              <div
                key={match.id}
                className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors"
              >
                <div>
                  {/* Match metadata top */}
                  <div className="flex items-center justify-between text-xs text-slate-500 pb-2 mb-3 border-b border-slate-100 font-mono">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="font-bold text-slate-700">Trận #{match.matchNumber}</span>
                      <span aria-hidden="true">·</span>
                      <span>{match.roundName}</span>
                      {tournament?.stageRules?.group && (
                        <span className="text-[10px] font-mono text-emerald-800 bg-emerald-50 px-1 rounded border border-emerald-200">
                          {tournament.stageRules.group.pointsPerGame}p · {tournament.stageRules.group.matchFormat === 'best_of_1' ? 'Bo1' : 'Bo3'}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{match.scheduledTime}</span>
                      <span aria-hidden="true">·</span>
                      <span>{match.courtName}</span>
                    </div>
                  </div>

                  {/* Team 1 Row */}
                  <div
                    className={`flex items-center justify-between py-1.5 px-2 rounded-md ${
                      match.winnerId === match.team1Id
                        ? 'bg-emerald-50/70 font-bold text-slate-900'
                        : 'text-slate-700'
                    }`}
                  >
                    <div className="truncate pr-2">
                      <span className="text-xs font-semibold truncate block">
                        {team1 ? team1.name : 'Chờ xác định'}
                      </span>
                      <span className="text-[11px] text-slate-500 font-normal truncate block">
                        {team1?.player2 ? `${team1.player1} & ${team1.player2}` : team1?.player1}
                      </span>
                    </div>
                    {match.scores && match.scores.length > 0 && (
                      <div className="flex items-center gap-1.5 shrink-0 font-mono text-xs font-bold tabular-nums">
                        {match.scores.map((s, i) => (
                          <span
                            key={i}
                            className={`px-1.5 py-0.5 rounded ${
                              s.team1Score > s.team2Score
                                ? 'bg-emerald-600 text-white'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {s.team1Score}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Team 2 Row */}
                  <div
                    className={`flex items-center justify-between py-1.5 px-2 rounded-md mt-1 ${
                      match.winnerId === match.team2Id
                        ? 'bg-emerald-50/70 font-bold text-slate-900'
                        : 'text-slate-700'
                    }`}
                  >
                    <div className="truncate pr-2">
                      <span className="text-xs font-semibold truncate block">
                        {team2 ? team2.name : 'Chờ xác định'}
                      </span>
                      <span className="text-[11px] text-slate-500 font-normal truncate block">
                        {team2?.player2 ? `${team2.player1} & ${team2.player2}` : team2?.player1}
                      </span>
                    </div>
                    {match.scores && match.scores.length > 0 && (
                      <div className="flex items-center gap-1.5 shrink-0 font-mono text-xs font-bold tabular-nums">
                        {match.scores.map((s, i) => (
                          <span
                            key={i}
                            className={`px-1.5 py-0.5 rounded ${
                              s.team2Score > s.team1Score
                                ? 'bg-emerald-600 text-white'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {s.team2Score}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer action */}
                <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="text-[11px]">
                    {isCompleted ? (
                      <span className="text-emerald-600 font-medium flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Đã xong
                      </span>
                    ) : isLive ? (
                      <span className="text-amber-600 font-medium">Đang đấu</span>
                    ) : (
                      <span className="text-slate-400">Chưa bắt đầu</span>
                    )}
                  </div>

                  <button
                    onClick={() => onOpenScoreModal(match)}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-md transition-colors"
                  >
                    <PlayCircle className="w-3.5 h-3.5" />
                    <span>{isCompleted ? 'Sửa Tỷ Số' : 'Ghi Điểm'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
