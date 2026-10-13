import React from 'react';
import {
  Trophy,
  Users,
  Calendar,
  Layers,
  ArrowRight,
  Printer,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  MapPin,
  PlayCircle,
  Edit3,
  Trash2,
  Plus,
  ShieldCheck
} from 'lucide-react';
import { Tournament, Team, Match, Tenant, MasterUser } from '../types/tournament.ts';

interface DashboardOverviewProps {
  tournament: Tournament | null;
  teams: Team[];
  matches: Match[];
  activeTenant: Tenant;
  currentUser: MasterUser;
  onNavigateTab: (tab: string) => void;
  onOpenScoreModal: (match: Match) => void;
  onOpenPrintModal: () => void;
  onOpenEditTournamentModal?: () => void;
  onOpenDeleteTournamentModal?: () => void;
  onOpenNewTournamentModal?: () => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  tournament,
  teams,
  matches,
  activeTenant,
  currentUser,
  onNavigateTab,
  onOpenScoreModal,
  onOpenPrintModal,
  onOpenEditTournamentModal,
  onOpenDeleteTournamentModal,
  onOpenNewTournamentModal,
}) => {
  if (!tournament) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-12 text-center max-w-xl mx-auto my-12">
        <Trophy className="w-12 h-12 text-emerald-600 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-slate-900 mb-2">Chưa có giải đấu nào được kích hoạt</h3>
        <p className="text-sm text-slate-500 mb-6">
          Tạo giải đấu đầu tiên cho tổ chức {activeTenant.orgName} để bắt đầu thiết lập bảng đấu và lập lịch.
        </p>
        <button
          onClick={onOpenNewTournamentModal || (() => onNavigateTab('teams'))}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors inline-flex items-center gap-1.5 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo Giải Đấu Mới (Quyền BTC)</span>
        </button>
      </div>
    );
  }

  const isOwner =
    currentUser.role === 'super_admin' ||
    (currentUser.role === 'organizer' &&
      (!tournament.creatorId ||
        tournament.creatorId === currentUser.id ||
        activeTenant.userId === currentUser.id));

  const completedMatches = matches.filter((m) => m.status === 'completed');
  const inProgressMatches = matches.filter((m) => m.status === 'in_progress');
  const totalMatches = matches.length;
  const progressPercent = totalMatches > 0 ? Math.round((completedMatches.length / totalMatches) * 100) : 0;

  // Active or upcoming high-profile match
  const liveOrNextMatch = inProgressMatches[0] || matches.find((m) => m.status === 'scheduled');

  const teamsMap = teams.reduce<Record<string, Team>>((acc, t) => {
    acc[t.id] = t;
    return acc;
  }, {});

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'doubles_men': return 'Đôi nam';
      case 'doubles_women': return 'Đôi nữ';
      case 'doubles_mixed': return 'Đôi nam nữ';
      case 'singles_men': return 'Đơn nam';
      case 'singles_women': return 'Đơn nữ';
      default: return cat;
    }
  };

  return (
    <div className="space-y-6">
      {/* Hero Visual Section */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 text-white shadow-sm">
        <div className="absolute inset-0">
          <img
            src="/src/assets/images/pickleball_court_hero_1791855134801.jpg"
            alt="Sân thi đấu Pickleball"
            className="w-full h-full object-cover opacity-35"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-900/80 to-transparent" />
        </div>

        <div className="relative z-10 p-6 sm:p-8 lg:p-10 max-w-4xl">
          {/* Action Row for Tournament Creator / BTC */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-emerald-400 tracking-wide">
              <span>{activeTenant.orgName}</span>
              <span aria-hidden="true">·</span>
              <span>{getCategoryLabel(tournament.category)}</span>
              <span aria-hidden="true">·</span>
              <span className="text-slate-300 font-mono text-[11px]">
                Tạo bởi: <strong className="text-white">{tournament.creatorName || activeTenant.orgName}</strong>
              </span>
              {isOwner && (
                <span className="text-[10px] font-mono text-emerald-300 bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-500/40 font-bold">
                  BẠN TẠO
                </span>
              )}
            </div>

            {/* Quick Organizer Controls */}
            <div className="flex items-center gap-2 self-start sm:self-auto">
              {onOpenEditTournamentModal && (
                <button
                  onClick={onOpenEditTournamentModal}
                  disabled={!isOwner}
                  title={
                    isOwner
                      ? 'Sửa thông tin giải đấu và thiết lập điểm các hiệp'
                      : 'Chỉ Trưởng Ban Tổ Chức (BTC) tạo giải mới có quyền sửa'
                  }
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold backdrop-blur-xs transition-all ${
                    isOwner
                      ? 'bg-white/15 hover:bg-white/25 text-white border border-white/20 hover:border-white/40 shadow-xs'
                      : 'bg-white/5 text-slate-500 border border-white/5 cursor-not-allowed opacity-60'
                  }`}
                >
                  <Edit3 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Sửa Thông Tin Giải</span>
                </button>
              )}

              {onOpenDeleteTournamentModal && (
                <button
                  onClick={onOpenDeleteTournamentModal}
                  disabled={!isOwner}
                  title={
                    isOwner
                      ? 'Xóa giải đấu do bạn tạo khỏi Database'
                      : 'Chỉ Trưởng Ban Tổ Chức (BTC) tạo giải mới có quyền xóa'
                  }
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold backdrop-blur-xs transition-all ${
                    isOwner
                      ? 'bg-rose-500/20 hover:bg-rose-500/35 text-rose-200 border border-rose-500/40 hover:border-rose-500/60 shadow-xs'
                      : 'bg-white/5 text-slate-500 border border-white/5 cursor-not-allowed opacity-60'
                  }`}
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                  <span>Xóa Giải Đấu</span>
                </button>
              )}
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white mb-3 text-balance">
            {tournament.name}
          </h1>

          <p className="text-sm text-slate-300 mb-6 leading-relaxed line-clamp-2 max-w-2xl">
            {tournament.description}
          </p>

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300">
            <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-xs px-3 py-1.5 rounded-lg border border-white/10">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              <span>{tournament.location || 'Sân Trung Tâm'}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-xs px-3 py-1.5 rounded-lg border border-white/10 font-mono">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              <span>Khởi tranh: {tournament.startDate}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-xs px-3 py-1.5 rounded-lg border border-white/10">
              <Layers className="w-3.5 h-3.5 text-emerald-400" />
              <span>{tournament.courtsCount} Sân thi đấu đồng thời</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4-Column KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Đội Tham Gia</span>
            <Users className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
            {teams.length} <span className="text-xs font-normal text-slate-500 font-sans">đội</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {tournament.category.includes('doubles') ? `${teams.length * 2} VĐV chính thức` : `${teams.length} VĐV đơn`}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Tiến Độ Giải Đấu</span>
            <CheckCircle2 className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
            {completedMatches.length}/{totalMatches}
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
            <div
              className="bg-emerald-500 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Quy Tắc Điểm Từng Vòng</span>
            <Trophy className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xs font-bold text-slate-900 truncate" title={`Bảng: ${tournament.stageRules?.group.pointsPerGame || 11}p | CK: ${tournament.stageRules?.finals.pointsPerGame || 11}p`}>
            {tournament.stageRules?.group.matchFormat === 'best_of_1' ? 'Bảng Bo1' : 'Bảng Bo3'} ({tournament.stageRules?.group.pointsPerGame || 11}p) ➔ CK {tournament.stageRules?.finals.matchFormat === 'best_of_1' ? 'Bo1' : 'Bo3'} ({tournament.stageRules?.finals.pointsPerGame || 11}p)
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-mono">
            {tournament.format === 'combined' ? 'Vòng Bảng + Playoff' : tournament.format === 'round_robin' ? 'Vòng Bảng' : 'Playoff Trực Tiếp'}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Database Tenant</span>
            <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
              ISOLATED
            </span>
          </div>
          <div className="text-xs font-mono font-semibold text-slate-800 truncate" title={activeTenant.schemaName}>
            {activeTenant.schemaName}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Môi trường DB riêng biệt của BTC
          </div>
        </div>
      </div>

      {/* Featured Match & Quick Workflows */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Spotlight Live / Next Match Card */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <h3 className="text-sm font-bold text-slate-900">
                  {liveOrNextMatch?.stage === 'playoff' ? 'Tâm Điểm Vòng Playoff' : 'Trận Đấu Nổi Bật Tiếp Theo'}
                </h3>
              </div>
              <span className="text-xs font-medium text-slate-500 font-mono">
                {liveOrNextMatch?.courtName} · {liveOrNextMatch?.scheduledTime}
              </span>
            </div>

            {liveOrNextMatch ? (
              <div className="py-3">
                <div className="grid grid-cols-5 items-center gap-3 text-center">
                  {/* Team 1 */}
                  <div className="col-span-2 text-left">
                    <span className="text-xs font-mono text-slate-400 block mb-1">
                      {liveOrNextMatch.team1Id ? teamsMap[liveOrNextMatch.team1Id]?.code : 'Đội 1'}
                    </span>
                    <h4 className="text-base font-bold text-slate-900 truncate">
                      {liveOrNextMatch.team1Id ? teamsMap[liveOrNextMatch.team1Id]?.name : 'Chờ xác định'}
                    </h4>
                    <p className="text-xs text-slate-500 truncate">
                      {liveOrNextMatch.team1Id
                        ? teamsMap[liveOrNextMatch.team1Id]?.player2
                          ? `${teamsMap[liveOrNextMatch.team1Id]?.player1} & ${teamsMap[liveOrNextMatch.team1Id]?.player2}`
                          : teamsMap[liveOrNextMatch.team1Id]?.player1
                        : 'VĐV đang thi đấu'}
                    </p>
                  </div>

                  {/* VS / Score */}
                  <div className="col-span-1 flex flex-col items-center justify-center">
                    {liveOrNextMatch.scores && liveOrNextMatch.scores.length > 0 ? (
                      <div className="space-y-1">
                        {liveOrNextMatch.scores.map((sc, idx) => (
                          <div
                            key={idx}
                            className="text-xs font-mono font-bold bg-slate-100 px-2 py-0.5 rounded border border-slate-200 tabular-nums text-slate-800"
                          >
                            {sc.team1Score} - {sc.team2Score}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded">
                        VS
                      </span>
                    )}
                    <span className="text-[10px] text-slate-400 mt-1 font-mono">{liveOrNextMatch.roundName}</span>
                  </div>

                  {/* Team 2 */}
                  <div className="col-span-2 text-right">
                    <span className="text-xs font-mono text-slate-400 block mb-1">
                      {liveOrNextMatch.team2Id ? teamsMap[liveOrNextMatch.team2Id]?.code : 'Đội 2'}
                    </span>
                    <h4 className="text-base font-bold text-slate-900 truncate">
                      {liveOrNextMatch.team2Id ? teamsMap[liveOrNextMatch.team2Id]?.name : 'Chờ xác định'}
                    </h4>
                    <p className="text-xs text-slate-500 truncate">
                      {liveOrNextMatch.team2Id
                        ? teamsMap[liveOrNextMatch.team2Id]?.player2
                          ? `${teamsMap[liveOrNextMatch.team2Id]?.player1} & ${teamsMap[liveOrNextMatch.team2Id]?.player2}`
                          : teamsMap[liveOrNextMatch.team2Id]?.player1
                        : 'VĐV đang thi đấu'}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500 py-6 text-center">Tất cả các trận đấu đã hoàn tất.</p>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 mt-4">
            <span className="text-xs text-slate-500">
              {liveOrNextMatch?.status === 'in_progress' ? 'Trận đấu đang diễn ra trên sân' : 'Sẵn sàng ghi điểm trực tiếp'}
            </span>
            <div className="flex items-center gap-2">
              {liveOrNextMatch && (
                <button
                  onClick={() => onOpenScoreModal(liveOrNextMatch)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors"
                >
                  <PlayCircle className="w-3.5 h-3.5" />
                  <span>Nhập Tỷ Số Trận</span>
                </button>
              )}
              <button
                onClick={() => onNavigateTab('groups')}
                className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition-colors"
              >
                <span>Xem Toàn Bộ Lịch</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        {/* Quick Actions Panel */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">Thao Tác Nhanh BTC</h3>
            <p className="text-xs text-slate-500 mb-4">Các tính năng vận hành giải tự động hóa</p>

            <div className="space-y-2">
              <button
                onClick={() => onNavigateTab('teams')}
                className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:border-slate-200 hover:bg-slate-50 text-left transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-800 group-hover:text-emerald-700">
                      Tải Lên File Excel VĐV
                    </div>
                    <div className="text-[11px] text-slate-400">Kiểm tra trùng lặp & nhập tự động</div>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700" />
              </button>

              <button
                onClick={() => onNavigateTab('groups')}
                className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:border-slate-200 hover:bg-slate-50 text-left transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-800 group-hover:text-sky-700">
                      Bốc Thăm & Lập Lịch
                    </div>
                    <div className="text-[11px] text-slate-400">Thuật toán chia vòng tròn theo sân</div>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700" />
              </button>

              <button
                onClick={() => onNavigateTab('bracket')}
                className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:border-slate-200 hover:bg-slate-50 text-left transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                    <Trophy className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-800 group-hover:text-amber-700">
                      Sơ Đồ Nhánh Playoff
                    </div>
                    <div className="text-[11px] text-slate-400">Tự động lấy Nhất/Nhì bảng vào đấu</div>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700" />
              </button>
            </div>
          </div>

          <div className="pt-4 mt-2 border-t border-slate-100">
            <button
              onClick={onOpenPrintModal}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>In Phiếu Điểm Trọng Tài Chuẩn A4</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
