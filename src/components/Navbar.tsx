import React from 'react';
import {
  Database,
  Plus,
  Shield,
  Award,
  Calendar,
  Users,
  Trophy,
  UserCheck,
  Lock,
  UserPlus,
  LogOut,
  KeyRound,
} from 'lucide-react';
import { Tenant, MasterUser } from '../types/tournament.ts';
import { MasterDb } from '../services/storage.ts';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  activeTenant: Tenant;
  currentUser: MasterUser;
  onOpenTenantModal: () => void;
  onOpenNewTournamentModal: () => void;
  onOpenProvisionModal: () => void;
  onOpenChangePasswordModal?: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  activeTenant,
  currentUser,
  onOpenTenantModal,
  onOpenNewTournamentModal,
  onOpenProvisionModal,
  onOpenChangePasswordModal,
  onLogout,
}) => {
  const canManageTournaments = MasterDb.hasPermission(currentUser, 'manage_tournaments');

  const navItems = [
    { id: 'dashboard', label: 'Tổng Quan', icon: Shield },
    { id: 'teams', label: 'VĐV & Excel', icon: Users },
    { id: 'groups', label: 'Vòng Bảng & Lịch', icon: Calendar },
    { id: 'standings', label: 'Bảng Xếp Hạng', icon: Award },
    { id: 'bracket', label: 'Nhánh Playoff', icon: Trophy },
    { id: 'database', label: 'Tenant DB', icon: Database },
    { id: 'users', label: 'Phân Quyền', icon: UserCheck },
  ];

  const getRoleShortLabel = (role: string) => {
    switch (role) {
      case 'super_admin': return 'Admin';
      case 'organizer': return 'BTC';
      case 'coordinator': return 'Điều phối';
      case 'referee': return 'Trọng tài';
      case 'viewer': return 'Xem';
      default: return role;
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-6 h-16">
          {/* Zone 1: Single Brand Wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setActiveTab('dashboard')}
              className="flex items-center gap-2.5 text-left group"
            >
              <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
                PB
              </div>
              <div>
                <span className="text-base font-bold tracking-tight text-slate-900 group-hover:text-emerald-600 transition-colors whitespace-nowrap">
                  Pickleball Pro
                </span>
                <span className="hidden sm:inline-block text-[11px] text-slate-500 font-mono ml-2 border-l border-slate-200 pl-2">
                  Multi-Tenant & RBAC
                </span>
              </div>
            </button>
          </div>

          {/* Zone 2: Navigation Links (Single-Line, Whitespace-Nowrap) */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-1.5 text-sm font-medium text-slate-600">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'bg-slate-100 text-emerald-700 shadow-xs'
                      : 'hover:text-slate-900 hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Primary Action & Isolated Tenant Context */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Active User Session Pill */}
            <button
              onClick={() => setActiveTab('users')}
              title={`Đang đăng nhập: ${currentUser.fullName} (${currentUser.role})`}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 text-xs text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="max-w-[100px] truncate font-medium">{currentUser.fullName}</span>
              <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-200 px-1 rounded">
                {getRoleShortLabel(currentUser.role)}
              </span>
            </button>

            {/* Change Password button in Navbar */}
            {onOpenChangePasswordModal && (
              <button
                onClick={onOpenChangePasswordModal}
                title={`Đổi mật khẩu tài khoản (${currentUser.fullName})`}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-lg transition-colors whitespace-nowrap"
              >
                <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                <span className="hidden md:inline">Đổi Mật Khẩu</span>
              </button>
            )}

            {/* Tenant Selector Trigger */}
            <button
              onClick={onOpenTenantModal}
              title="Chuyển đổi hoặc quản lý Database riêng của Tenant"
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200/80 rounded-lg transition-colors whitespace-nowrap"
            >
              <Database className="w-3.5 h-3.5 text-emerald-600" />
              <span className="max-w-[110px] sm:max-w-[140px] truncate font-medium">
                {activeTenant.orgName}
              </span>
            </button>

            {/* Cấp Tài Khoản Button */}
            <button
              onClick={onOpenProvisionModal}
              title="Cấp tài khoản người dùng mới (Mật khẩu mặc định: 123)"
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition-colors whitespace-nowrap"
            >
              <UserPlus className="w-3.5 h-3.5 text-emerald-600" />
              <span>Cấp Tài Khoản</span>
            </button>

            {/* Primary Action Button */}
            <button
              onClick={onOpenNewTournamentModal}
              disabled={!canManageTournaments}
              title={canManageTournaments ? 'Tạo giải đấu mới' : 'Tài khoản không có quyền tạo giải'}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg shadow-sm transition-colors whitespace-nowrap ${
                canManageTournaments
                  ? 'text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800'
                  : 'text-slate-400 bg-slate-200 cursor-not-allowed'
              }`}
            >
              {canManageTournaments ? (
                <Plus className="w-3.5 h-3.5" />
              ) : (
                <Lock className="w-3.5 h-3.5" />
              )}
              <span>Tạo Giải Mới</span>
            </button>

            {/* Logout Button */}
            <button
              onClick={onLogout}
              title="Đăng xuất khỏi hệ thống về Trang Đăng Nhập"
              className="flex items-center gap-1 p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Sub-Bar */}
      <div className="lg:hidden flex items-center gap-1 px-4 py-2 border-t border-slate-100 overflow-x-auto bg-slate-50/50">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap ${
                isActive
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-600 hover:text-slate-900 bg-white border border-slate-200'
              }`}
            >
              <Icon className="w-3 h-3" />
              {item.label}
            </button>
          );
        })}
      </div>
    </header>
  );
};
