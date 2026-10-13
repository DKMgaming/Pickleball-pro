import React, { useState } from 'react';
import {
  X,
  Trophy,
  Settings,
  Calendar,
  MapPin,
  Layers,
  Sparkles,
  CheckCircle2,
  Sliders,
  ShieldAlert,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import {
  Tournament,
  TournamentCategory,
  TournamentFormat,
  TournamentStageRules,
  DEFAULT_STAGE_RULES,
  MatchFormatOption,
  PointsPerGameOption,
  MasterUser,
  Tenant
} from '../types/tournament.ts';

interface TournamentConfigModalProps {
  currentTournament: Tournament | null;
  currentUser?: MasterUser;
  activeTenant?: Tenant;
  onClose: () => void;
  onSaveTournament: (tournament: Tournament) => void;
  onDeleteTournament?: (tournamentId: string) => void;
}

export const TournamentConfigModal: React.FC<TournamentConfigModalProps> = ({
  currentTournament,
  currentUser,
  activeTenant,
  onClose,
  onSaveTournament,
  onDeleteTournament,
}) => {
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const isOwner =
    !currentTournament ||
    !currentUser ||
    currentUser.role === 'super_admin' ||
    (currentUser.role === 'organizer' &&
      (!currentTournament.creatorId ||
        currentTournament.creatorId === currentUser.id ||
        activeTenant?.userId === currentUser.id));

  const canDelete =
    Boolean(currentTournament) &&
    Boolean(onDeleteTournament) &&
    isOwner;

  const [name, setName] = useState(
    currentTournament?.name || 'Giải Pickleball Vô Địch Mở Rộng 2026'
  );
  const [description, setDescription] = useState(
    currentTournament?.description ||
      'Giải đấu phong trào và bán chuyên chuẩn USA Pickleball / VPA 2026.'
  );
  const [category, setCategory] = useState<TournamentCategory>(
    currentTournament?.category || 'doubles_men'
  );
  const [format, setFormat] = useState<TournamentFormat>(
    currentTournament?.format || 'combined'
  );
  const [courtsCount, setCourtsCount] = useState<number>(
    currentTournament?.courtsCount || 4
  );
  const [groupsCount, setGroupsCount] = useState<number>(
    currentTournament?.groupsCount || 2
  );
  const [qualifyPerGroup, setQualifyPerGroup] = useState<number>(
    currentTournament?.qualifyPerGroup || 2
  );
  const [location, setLocation] = useState(
    currentTournament?.location || 'Cụm Sân Pickleball Thể Thao'
  );
  const [startDate, setStartDate] = useState(
    currentTournament?.startDate || new Date().toISOString().slice(0, 10)
  );

  // Stage-specific rules state
  const [stageRules, setStageRules] = useState<TournamentStageRules>(
    currentTournament?.stageRules || { ...DEFAULT_STAGE_RULES }
  );

  // Preset Handlers
  const applyPresetVPAStandard = () => {
    setStageRules({
      group: { matchFormat: 'best_of_1', pointsPerGame: 11, winByTwo: true },
      roundOf16: { matchFormat: 'best_of_1', pointsPerGame: 15, winByTwo: true },
      quarterFinals: { matchFormat: 'best_of_3', pointsPerGame: 11, winByTwo: true },
      semiFinals: { matchFormat: 'best_of_3', pointsPerGame: 11, winByTwo: true },
      finals: { matchFormat: 'best_of_3', pointsPerGame: 11, winByTwo: true },
    });
  };

  const applyPresetProAllBo3 = () => {
    setStageRules({
      group: { matchFormat: 'best_of_3', pointsPerGame: 11, winByTwo: true },
      roundOf16: { matchFormat: 'best_of_3', pointsPerGame: 11, winByTwo: true },
      quarterFinals: { matchFormat: 'best_of_3', pointsPerGame: 11, winByTwo: true },
      semiFinals: { matchFormat: 'best_of_3', pointsPerGame: 11, winByTwo: true },
      finals: { matchFormat: 'best_of_3', pointsPerGame: 11, winByTwo: true },
    });
  };

  const applyPresetGrandFinals15 = () => {
    setStageRules({
      group: { matchFormat: 'best_of_1', pointsPerGame: 11, winByTwo: true },
      roundOf16: { matchFormat: 'best_of_1', pointsPerGame: 15, winByTwo: true },
      quarterFinals: { matchFormat: 'best_of_3', pointsPerGame: 11, winByTwo: true },
      semiFinals: { matchFormat: 'best_of_3', pointsPerGame: 11, winByTwo: true },
      finals: { matchFormat: 'best_of_3', pointsPerGame: 15, winByTwo: true },
    });
  };

  const handleStageChange = (
    stageKey: keyof TournamentStageRules,
    field: 'matchFormat' | 'pointsPerGame' | 'winByTwo',
    value: unknown
  ) => {
    setStageRules((prev) => ({
      ...prev,
      [stageKey]: {
        ...prev[stageKey],
        [field]: value,
      },
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const tournamentData: Tournament = {
      id: currentTournament?.id || `tour_${Date.now()}`,
      name: name.trim(),
      description: description.trim(),
      category,
      format,
      status: currentTournament?.status || 'in_progress',
      courtsCount,
      groupsCount,
      qualifyPerGroup,
      // Global fallbacks aligned with finals/group
      matchFormat: stageRules.group.matchFormat,
      pointsPerGame: stageRules.group.pointsPerGame,
      winByTwo: stageRules.group.winByTwo,
      stageRules,
      pointsPerWin: 3,
      pointsPerLoss: 0,
      location: location.trim(),
      startDate,
      createdAt: currentTournament?.createdAt || new Date().toISOString(),
      creatorId: currentTournament?.creatorId || currentUser?.id,
      creatorName: currentTournament?.creatorName || currentUser?.fullName,
    };

    onSaveTournament(tournamentData);
    onClose();
  };

  const stagesList: {
    key: keyof TournamentStageRules;
    title: string;
    description: string;
    badge: string;
  }[] = [
    {
      key: 'group',
      title: 'Vòng Bảng (Round Robin)',
      description: 'Giai đoạn chia bảng đấu vòng tròn tính điểm',
      badge: 'VÒNG BẢNG',
    },
    {
      key: 'roundOf16',
      title: 'Vòng 1/16 & 1/8 (Knockout)',
      description: 'Vòng đấu loại trực tiếp đầu tiên cho các đội vượt qua vòng bảng',
      badge: '1/16 & 1/8',
    },
    {
      key: 'quarterFinals',
      title: 'Vòng Tứ Kết (Quarter-Finals)',
      description: '8 đội xuất sắc tranh 4 vé vào bán kết',
      badge: 'TỨ KẾT',
    },
    {
      key: 'semiFinals',
      title: 'Vòng Bán Kết (Semi-Finals)',
      description: '4 đội mạnh nhất tranh vé vào chung kết cúp vàng',
      badge: 'BÁN KẾT',
    },
    {
      key: 'finals',
      title: 'Chung Kết & Tranh Hạng 3 (Finals & Bronze)',
      description: 'Trận tranh cúp vô địch và huy chương đồng',
      badge: 'CHUNG KẾT',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full p-6 space-y-6 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Trophy className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {currentTournament ? 'Thiết Lập Giải Đấu & Quy Tắc Điểm Số' : 'Khởi Tạo Giải Đấu Mới'}
              </h3>
              <p className="text-xs text-slate-500 font-mono">
                Cấu hình chi tiết số điểm từng hiệp theo từng vòng đấu
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Creator & Permissions Status Banner */}
        {currentTournament && (
          <div
            className={`p-3 rounded-xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
              isOwner
                ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                : 'bg-amber-50/80 border-amber-200 text-amber-950'
            }`}
          >
            <div className="flex items-center gap-2">
              <Trophy className={`w-4 h-4 shrink-0 ${isOwner ? 'text-emerald-600' : 'text-amber-600'}`} />
              <div>
                <span className="text-slate-600">Người tạo giải:</span>{' '}
                <strong className="font-semibold text-slate-900">
                  {currentTournament.creatorName || activeTenant?.orgName || 'Trưởng BTC'}
                </strong>
                {currentTournament.creatorId && currentUser?.id === currentTournament.creatorId && (
                  <span className="ml-1.5 text-[10px] font-mono text-emerald-700 bg-emerald-100/80 px-1 rounded font-bold">
                    DO BẠN TẠO
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1.5 self-start sm:self-auto">
              {isOwner ? (
                <span className="text-[11px] font-bold text-emerald-800 bg-white px-2 py-0.5 rounded border border-emerald-200 shadow-2xs">
                  ✅ Quyền Trưởng BTC: Toàn quyền sửa & xóa giải
                </span>
              ) : (
                <span className="text-[11px] font-bold text-amber-800 bg-white px-2 py-0.5 rounded border border-amber-200 shadow-2xs">
                  ⚠️ Chỉ xem (Chỉ người tạo giải mới có quyền sửa/xóa)
                </span>
              )}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 text-xs">
          {/* Section 1: General Info */}
          <div className="space-y-3.5">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
              <span>1. THÔNG TIN CHUNG GIẢI ĐẤU</span>
            </h4>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Tên Giải Đấu *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Mô Tả & Thông Tin Giải
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nội Dung Thi Đấu *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as TournamentCategory)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                >
                  <option value="doubles_men">Đôi Nam (Men&apos;s Doubles)</option>
                  <option value="doubles_women">Đôi Nữ (Women&apos;s Doubles)</option>
                  <option value="doubles_mixed">Đôi Nam Nữ (Mixed Doubles)</option>
                  <option value="singles_men">Đơn Nam (Men&apos;s Singles)</option>
                  <option value="singles_women">Đơn Nữ (Women&apos;s Singles)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Thể Thức Toàn Giải *
                </label>
                <select
                  value={format}
                  onChange={(e) => setFormat(e.target.value as TournamentFormat)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-medium"
                >
                  <option value="combined">Kết Hợp (Vòng Bảng + Playoff Knockout)</option>
                  <option value="round_robin">Vòng Bảng Vòng Tròn (Round Robin)</option>
                  <option value="knockout">Đấu Loại Trực Tiếp (Knockout Playoff)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Số Bảng Đấu (Vòng Bảng)
                </label>
                <select
                  value={groupsCount}
                  onChange={(e) => setGroupsCount(parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                >
                  <option value={1}>1 Bảng</option>
                  <option value={2}>2 Bảng (A, B)</option>
                  <option value={4}>4 Bảng (A, B, C, D)</option>
                  <option value={8}>8 Bảng (A tới H)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Vé Vào Playoff / Bảng
                </label>
                <select
                  value={qualifyPerGroup}
                  onChange={(e) => setQualifyPerGroup(parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                >
                  <option value={1}>Top 1 (Chỉ Nhất Bảng)</option>
                  <option value={2}>Top 2 (Nhất & Nhì Bảng)</option>
                  <option value={4}>Top 4 (Nhất, Nhì, Ba, Tư)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Số Sân Thi Đấu Cụm
                </label>
                <input
                  type="number"
                  min="1"
                  max="16"
                  value={courtsCount}
                  onChange={(e) => setCourtsCount(parseInt(e.target.value, 10) || 1)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Địa Điểm Thi Đấu
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Ngày Khởi Tranh
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Dedicated Stage-Specific Rules */}
          <div className="space-y-4 pt-4 border-t border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-emerald-600" />
                  <span>2. THIẾT LẬP QUY TẮC ĐIỂM SỐ TỪNG VÒNG ĐẤU</span>
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Tùy chỉnh số hiệp (Bo1 / Bo3 / Bo5) và điểm mỗi hiệp (11, 15, 21) cho từng vòng
                </p>
              </div>

              {/* Quick Presets */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={applyPresetVPAStandard}
                  className="px-2.5 py-1 text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
                  title="Vòng bảng 11p, 1/16 15p, Tứ kết/Bán kết/Chung kết Bo3 11p"
                >
                  Mẫu Chuẩn VPA
                </button>
                <button
                  type="button"
                  onClick={applyPresetGrandFinals15}
                  className="px-2.5 py-1 text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
                  title="Chung kết Bo3 chạm 15 điểm"
                >
                  Chung Kết 15p
                </button>
                <button
                  type="button"
                  onClick={applyPresetProAllBo3}
                  className="px-2.5 py-1 text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
                  title="Tất cả các vòng đấu đều Bo3 chạm 11 điểm"
                >
                  Toàn Giải Bo3
                </button>
              </div>
            </div>

            {/* Stage Rule Cards Table */}
            <div className="space-y-2.5">
              {stagesList.map((stage) => {
                const config = stageRules[stage.key];
                return (
                  <div
                    key={stage.key}
                    className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/80 hover:border-slate-300 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-200/60">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-white border border-slate-200 text-emerald-800">
                          {stage.badge}
                        </span>
                        <div>
                          <span className="font-bold text-slate-900 text-xs block">
                            {stage.title}
                          </span>
                          <span className="text-[11px] text-slate-500 font-normal">
                            {stage.description}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                      {/* Match Format */}
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Thể thức hiệp đấu
                        </label>
                        <select
                          value={config.matchFormat}
                          onChange={(e) =>
                            handleStageChange(
                              stage.key,
                              'matchFormat',
                              e.target.value as MatchFormatOption
                            )
                          }
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium"
                        >
                          <option value="best_of_1">1 Hiệp Duy Nhất (Bo1)</option>
                          <option value="best_of_3">3 Hiệp Thắng 2 (Bo3)</option>
                          <option value="best_of_5">5 Hiệp Thắng 3 (Bo5)</option>
                        </select>
                      </div>

                      {/* Points per Game */}
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Điểm mỗi hiệp (Chạm)
                        </label>
                        <select
                          value={config.pointsPerGame}
                          onChange={(e) =>
                            handleStageChange(
                              stage.key,
                              'pointsPerGame',
                              parseInt(e.target.value, 10) as PointsPerGameOption
                            )
                          }
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold"
                        >
                          <option value={11}>11 Điểm (Chuẩn QT)</option>
                          <option value={15}>15 Điểm</option>
                          <option value={21}>21 Điểm</option>
                        </select>
                      </div>

                      {/* Win By Two */}
                      <div className="sm:pt-4">
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={config.winByTwo}
                            onChange={(e) =>
                              handleStageChange(stage.key, 'winByTwo', e.target.checked)
                            }
                            className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                          />
                          <span className="text-xs font-medium text-slate-700">
                            Cách 2 điểm (Deuce)
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Footer */}
          <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <div>
              {canDelete && (
                showConfirmDelete ? (
                  <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 p-1.5 rounded-lg">
                    <span className="text-[11px] font-bold text-rose-800">Xóa giải đấu này?</span>
                    <button
                      type="button"
                      onClick={() => {
                        if (currentTournament && onDeleteTournament) {
                          onDeleteTournament(currentTournament.id);
                          onClose();
                        }
                      }}
                      className="px-2.5 py-1 text-[11px] font-bold text-white bg-rose-600 hover:bg-rose-700 rounded transition-colors"
                    >
                      Xác Nhận Xóa
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowConfirmDelete(false)}
                      className="px-2 py-1 text-[11px] text-slate-600 hover:bg-slate-200 rounded"
                    >
                      Hủy
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowConfirmDelete(true)}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors"
                    title="Trưởng BTC có quyền xóa giải đấu do mình tạo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Xóa Giải Đấu</span>
                  </button>
                )
              )}
            </div>

            <div className="flex items-center gap-2.5 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={!isOwner}
                title={isOwner ? 'Lưu thiết lập' : 'Bạn không phải người tạo giải nên không có quyền sửa'}
                className={`px-5 py-2 text-xs font-semibold rounded-lg shadow-sm transition-colors ${
                  isOwner
                    ? 'text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800'
                    : 'text-slate-400 bg-slate-200 cursor-not-allowed'
                }`}
              >
                {currentTournament ? 'Lưu Thay Đổi Giải Đấu' : 'Tạo Giải Đấu Mới'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
