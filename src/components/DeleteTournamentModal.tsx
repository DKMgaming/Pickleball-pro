import React from 'react';
import {
  AlertTriangle,
  X,
  Trash2,
  Trophy,
  Users,
  Calendar,
  Layers,
  ShieldAlert,
  Database
} from 'lucide-react';
import { Tournament, Tenant, MasterUser } from '../types/tournament.ts';

interface DeleteTournamentModalProps {
  isOpen: boolean;
  tournament: Tournament | null;
  activeTenant: Tenant;
  currentUser: MasterUser;
  teamsCount: number;
  matchesCount: number;
  onClose: () => void;
  onConfirmDelete: (tournamentId: string) => void;
}

export const DeleteTournamentModal: React.FC<DeleteTournamentModalProps> = ({
  isOpen,
  tournament,
  activeTenant,
  currentUser,
  teamsCount,
  matchesCount,
  onClose,
  onConfirmDelete,
}) => {
  if (!isOpen || !tournament) return null;

  const isCreatorOrAdmin =
    currentUser.role === 'super_admin' ||
    (currentUser.role === 'organizer' &&
      (!tournament.creatorId ||
        tournament.creatorId === currentUser.id ||
        activeTenant.userId === currentUser.id));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header with destructive warning theme */}
        <div className="bg-gradient-to-r from-rose-50 to-orange-50 border-b border-rose-100 p-5 flex items-start gap-4">
          <div className="w-11 h-11 rounded-xl bg-rose-100 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0 shadow-xs">
            <AlertTriangle className="w-6 h-6" />
          </div>

          <div className="flex-1">
            <h3 className="text-base font-bold text-slate-900">
              Xác Nhận Xóa Giải Đấu
            </h3>
            <p className="text-xs text-rose-800 mt-0.5">
              Quyền của Trưởng Ban Tổ Chức (BTC) & Super Admin
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-white/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Tournament Preview Card */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-emerald-600 shrink-0" />
              <h4 className="font-bold text-sm text-slate-900 truncate">
                {tournament.name}
              </h4>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 pt-1 border-t border-slate-200/60 font-mono">
              <div className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-slate-400" />
                <span>{teamsCount} Đội thi đấu</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>{matchesCount} Trận đấu</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-emerald-600" />
                <span className="truncate">{activeTenant.orgName}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400">Tạo bởi:</span>
                <span className="font-semibold text-slate-800 truncate">
                  {tournament.creatorName || 'Trưởng BTC'}
                </span>
              </div>
            </div>
          </div>

          {/* Authorization Check */}
          {!isCreatorOrAdmin ? (
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-amber-950">
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Không có quyền xóa giải đấu này!</span>
              </div>
              <p className="text-amber-800 leading-relaxed">
                Giải đấu này do &ldquo;{tournament.creatorName || 'Trưởng BTC khác'}&rdquo; khởi tạo. Theo quy định, chỉ Trưởng Ban Tổ Chức (BTC) tạo giải đấu này hoặc Super Admin mới có quyền xóa.
              </p>
            </div>
          ) : (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 space-y-1.5">
              <div className="font-bold flex items-center gap-1.5 text-rose-950">
                <Trash2 className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Cảnh báo dữ liệu quan trọng:</span>
              </div>
              <p className="text-rose-800 leading-relaxed">
                Khi xóa giải đấu, toàn bộ dữ liệu gồm: danh sách VĐV, bốc thăm bảng đấu, lịch thi đấu và kết quả tỷ số của giải sẽ bị <strong>xóa vĩnh viễn</strong> khỏi database của <strong>{activeTenant.orgName}</strong>. Thao tác này không thể hoàn tác.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-xl transition-colors"
          >
            Đóng / Hủy
          </button>

          {isCreatorOrAdmin && (
            <button
              type="button"
              onClick={() => {
                onConfirmDelete(tournament.id);
                onClose();
              }}
              className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 rounded-xl shadow-sm transition-all flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Xác Nhận Xóa Vĩnh Viễn</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
