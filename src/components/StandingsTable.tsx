import React, { useState } from 'react';
import {
  Award,
  FileSpreadsheet,
  HelpCircle,
  TrendingUp,
  CheckCircle2,
  Info
} from 'lucide-react';
import { Group, Match, Standing, Team, Tournament } from '../types/tournament.ts';
import { BracketService } from '../services/bracketService.ts';
import { ExcelService } from '../services/excelService.ts';

interface StandingsTableProps {
  tournament: Tournament | null;
  groups: Group[];
  matches: Match[];
  teams: Team[];
  onGeneratePlayoffFromStandings?: (qualifiedTeams: { teamId: string; groupRank: string }[]) => void;
}

export const StandingsTable: React.FC<StandingsTableProps> = ({
  tournament,
  groups,
  matches,
  teams,
  onGeneratePlayoffFromStandings,
}) => {
  const [selectedGroup, setSelectedGroup] = useState<string>(
    groups[0]?.id || 'all'
  );
  const [showRulesExplanation, setShowRulesExplanation] = useState(false);

  const teamsMap = teams.reduce<Record<string, Team>>((acc, t) => {
    acc[t.id] = t;
    return acc;
  }, {});

  // Compute standings for all groups
  const standingsByGroup: Record<string, Standing[]> = {};
  const allStandings: Standing[] = [];

  groups.forEach((g) => {
    const list = BracketService.calculateGroupStandings(
      g,
      matches,
      teamsMap,
      tournament?.qualifyPerGroup || 2
    );
    standingsByGroup[g.id] = list;
    allStandings.push(...list);
  });

  // Calculate qualified teams for Playoff
  const qualifiedTeamsForPlayoff: { teamId: string; groupRank: string }[] = [];
  groups.forEach((g) => {
    const groupStandings = standingsByGroup[g.id] || [];
    const topTeams = groupStandings.slice(0, tournament?.qualifyPerGroup || 2);
    topTeams.forEach((team) => {
      qualifiedTeamsForPlayoff.push({
        teamId: team.teamId,
        groupRank: `${g.name} (#${team.rank})`,
      });
    });
  });

  const exportStandingsToExcel = () => {
    if (!tournament) return;
    ExcelService.exportStandings(allStandings, tournament.name);
  };

  const currentDisplayGroups =
    selectedGroup === 'all'
      ? groups
      : groups.filter((g) => g.id === selectedGroup);

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Bảng Xếp Hạng Vòng Bảng (Official Standings)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Quy tắc: Thắng 3 điểm · Xếp hạng: Tổng điểm ➔ Hiệu số Game ➔ Đối đầu trực tiếp ➔ Hiệu số Quả
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Rules Explanation Toggle */}
          <button
            onClick={() => setShowRulesExplanation(!showRulesExplanation)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs transition-colors"
          >
            <HelpCircle className="w-3.5 h-3.5 text-sky-600" />
            <span>Tiêu Chí Xếp Hạng</span>
          </button>

          {/* Export to Excel */}
          <button
            onClick={exportStandingsToExcel}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Xuất BXH (.xlsx)</span>
          </button>

          {/* Playoff Generation Action from Top Teams */}
          {onGeneratePlayoffFromStandings && tournament?.format === 'combined' && (
            <button
              onClick={() => onGeneratePlayoffFromStandings(qualifiedTeamsForPlayoff)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-2xs transition-colors"
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Cập Nhật Vào Nhánh Playoff</span>
            </button>
          )}
        </div>
      </div>

      {/* Official Tie-Breaking Rules Modal / Card */}
      {showRulesExplanation && (
        <div className="bg-sky-50/70 border border-sky-200 rounded-xl p-5 text-xs text-sky-950 space-y-2.5">
          <div className="flex items-center gap-2 font-bold text-sky-900 text-sm">
            <Info className="w-4 h-4 text-sky-600" />
            <span>Quy Tắc Tính Điểm & Xếp Hạng Chuẩn USA/VPA Pickleball 2026:</span>
          </div>
          <ol className="list-decimal pl-5 space-y-1.5 leading-relaxed text-slate-700">
            <li>
              <strong>Quy tắc điểm trận đấu:</strong> Đội thắng nhận <strong>3 điểm</strong>, đội thua nhận <strong>0 điểm</strong>.
            </li>
            <li>
              <strong>Tiêu chí 1 - Tổng điểm số (Points):</strong> Đội có tổng số điểm tích lũy nhiều hơn sẽ xếp trên.
            </li>
            <li>
              <strong>Tiêu chí 2 - Hiệu số bàn thắng/thua (Game Difference):</strong> Tổng số hiệp thắng trừ tổng số hiệp thua (GD = GW - GL).
            </li>
            <li>
              <strong>Tiêu chí 3 - Đối đầu trực tiếp (Head-to-Head):</strong> Nếu hai đội bằng điểm và bằng hiệu số hiệp, ưu tiên đội thắng trong trận đối đầu trực tiếp giữa hai đội đó.
            </li>
            <li>
              <strong>Tiêu chí 4 - Hiệu số quả thi đấu (Point Difference):</strong> Tổng số quả (điểm) ghi được trừ tổng số quả để thua (PD = PF - PA).
            </li>
            <li>
              <strong>Suất đi tiếp vào Playoff:</strong> Top <strong>{tournament?.qualifyPerGroup || 2}</strong> đội dẫn đầu mỗi bảng (Hạng 1 & 2) nhận vé chính thức vào vòng đấu loại trực tiếp.
            </li>
          </ol>
        </div>
      )}

      {/* Filter by Group Tabs */}
      {groups.length > 1 && (
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg max-w-fit">
          <button
            onClick={() => setSelectedGroup('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              selectedGroup === 'all'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tất Cả Các Bảng
          </button>
          {groups.map((g) => (
            <button
              key={g.id}
              onClick={() => setSelectedGroup(g.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                selectedGroup === g.id
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {g.name}
            </button>
          ))}
        </div>
      )}

      {/* Tables for each group */}
      {currentDisplayGroups.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
          <Award className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h4 className="text-sm font-semibold text-slate-800">Chưa có bảng đấu nào</h4>
          <p className="text-xs text-slate-500 mt-1">
            Vào tab &ldquo;Vòng Bảng & Lập Lịch&rdquo; để bốc thăm chia bảng trước khi xem bảng xếp hạng.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {currentDisplayGroups.map((group) => {
            const list = standingsByGroup[group.id] || [];
            return (
              <div
                key={group.id}
                className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden"
              >
                {/* Group Table Header */}
                <div className="p-4 bg-slate-50/60 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <h3 className="text-sm font-bold text-slate-900">{group.name}</h3>
                    <span className="text-xs text-slate-500 font-mono">
                      ({list.length} đội thi đấu)
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[11px] font-semibold">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Top {tournament?.qualifyPerGroup || 2} vào Playoff
                    </span>
                  </div>
                </div>

                {/* Table Data */}
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead className="bg-slate-50/40 text-slate-600 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="px-3.5 py-3 text-center w-12">Hạng</th>
                        <th className="px-4 py-3">Đội Thi Đấu</th>
                        <th className="px-3.5 py-3 text-center">Trận (P)</th>
                        <th className="px-3.5 py-3 text-center">Thắng (W)</th>
                        <th className="px-3.5 py-3 text-center">Thua (L)</th>
                        <th className="px-3.5 py-3 text-center">Hiệp (GW-GL)</th>
                        <th className="px-3.5 py-3 text-center">Hiệu Số Hiệp</th>
                        <th className="px-3.5 py-3 text-center">Quả (PF-PA)</th>
                        <th className="px-3.5 py-3 text-center">Hiệu Số Quả</th>
                        <th className="px-4 py-3 text-center font-bold text-slate-900 bg-slate-100/50">
                          Điểm (Pts)
                        </th>
                        <th className="px-3.5 py-3 text-center">Trạng Thái</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {list.map((row) => (
                        <tr
                          key={row.teamId}
                          className={`hover:bg-slate-50/80 transition-colors ${
                            row.isQualified ? 'bg-emerald-50/20' : ''
                          }`}
                        >
                          {/* Rank */}
                          <td className="px-3.5 py-3 text-center font-mono font-bold">
                            <span
                              className={`inline-block w-6 h-6 leading-6 rounded-full text-xs ${
                                row.rank === 1
                                  ? 'bg-amber-100 text-amber-800 font-bold border border-amber-300'
                                  : row.rank === 2
                                  ? 'bg-slate-200 text-slate-800 font-bold'
                                  : 'text-slate-500'
                              }`}
                            >
                              {row.rank}
                            </span>
                          </td>

                          {/* Team & Players */}
                          <td className="px-4 py-3">
                            <div className="font-semibold text-slate-900 truncate">
                              {row.teamName}
                            </div>
                            <div className="text-[11px] text-slate-500 truncate">
                              {row.playerNames}
                            </div>
                          </td>

                          {/* P */}
                          <td className="px-3.5 py-3 text-center font-mono tabular-nums text-slate-700">
                            {row.played}
                          </td>

                          {/* W */}
                          <td className="px-3.5 py-3 text-center font-mono tabular-nums text-emerald-700 font-bold">
                            {row.won}
                          </td>

                          {/* L */}
                          <td className="px-3.5 py-3 text-center font-mono tabular-nums text-slate-500">
                            {row.lost}
                          </td>

                          {/* GW - GL */}
                          <td className="px-3.5 py-3 text-center font-mono tabular-nums text-slate-600">
                            {row.gamesWon}-{row.gamesLost}
                          </td>

                          {/* Game Diff */}
                          <td className="px-3.5 py-3 text-center font-mono tabular-nums font-semibold">
                            <span
                              className={
                                row.gameDiff > 0
                                  ? 'text-emerald-600'
                                  : row.gameDiff < 0
                                  ? 'text-rose-600'
                                  : 'text-slate-500'
                              }
                            >
                              {row.gameDiff > 0 ? `+${row.gameDiff}` : row.gameDiff}
                            </span>
                          </td>

                          {/* PF - PA */}
                          <td className="px-3.5 py-3 text-center font-mono tabular-nums text-slate-600">
                            {row.pointsWon}-{row.pointsLost}
                          </td>

                          {/* Point Diff */}
                          <td className="px-3.5 py-3 text-center font-mono tabular-nums font-semibold">
                            <span
                              className={
                                row.pointDiff > 0
                                  ? 'text-emerald-600'
                                  : row.pointDiff < 0
                                  ? 'text-rose-600'
                                  : 'text-slate-500'
                              }
                            >
                              {row.pointDiff > 0 ? `+${row.pointDiff}` : row.pointDiff}
                            </span>
                          </td>

                          {/* Total Points */}
                          <td className="px-4 py-3 text-center font-mono font-extrabold text-sm text-emerald-700 bg-slate-50/70 tabular-nums">
                            {row.totalPoints}
                          </td>

                          {/* Qualification Status */}
                          <td className="px-3.5 py-3 text-center">
                            {row.isQualified ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                Vào Playoff
                              </span>
                            ) : (
                              <span className="text-[11px] text-slate-400 font-mono">
                                Vòng bảng
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
