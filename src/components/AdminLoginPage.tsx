import React, { useState } from 'react';
import {
  Shield,
  Key,
  UserPlus,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Database,
  Trophy,
  Users,
  Lock,
  Sparkles,
  Copy,
  Check,
  Calendar,
  Layers
} from 'lucide-react';
import { MasterUser, Tenant, UserRole, UserPermission, ROLE_DEFAULT_PERMISSIONS } from '../types/tournament.ts';
import { MasterDb } from '../services/storage.ts';

interface AdminLoginPageProps {
  onLoginSuccess: (user: MasterUser) => void;
}

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({ onLoginSuccess }) => {
  const [activeTab, setActiveTab] = useState<'login' | 'provision'>('login');

  // Login form state - Tên đăng nhập admin là 'admin', mật khẩu mặc định 123
  const [loginEmail, setLoginEmail] = useState('admin');
  const [loginPassword, setLoginPassword] = useState('123');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  // Quick Account Provision state
  const [provFullName, setProvFullName] = useState('');
  const [provEmail, setProvEmail] = useState('');
  const [provPassword, setProvPassword] = useState('123');
  const [provRole, setProvRole] = useState<UserRole>('referee');
  const [provPermissions, setProvPermissions] = useState<UserPermission[]>([
    'input_scores',
    'print_scoresheet',
    'view_groups_brackets',
  ]);
  const [provDbMode, setProvDbMode] = useState<'assigned' | 'isolated'>('assigned');
  const [provTenantId, setProvTenantId] = useState<string>('tenant_thuduc');
  const [provNewOrgName, setProvNewOrgName] = useState('');
  const [provNotes, setProvNotes] = useState('Trọng tài điều hành trận đấu');
  const [provisionSuccessSlip, setProvisionSuccessSlip] = useState<MasterUser | null>(null);
  const [copiedSlip, setCopiedSlip] = useState(false);

  const existingTenants = MasterDb.getTenants();
  const existingUsers = MasterDb.getUsers();

  // Fast preset account selection
  const handleSelectPresetUser = (email: string) => {
    setLoginEmail(email);
    setLoginPassword('123');
    setErrorMessage('');
  };

  // Submit Login
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const res = MasterDb.login(loginEmail, loginPassword);
    if (res.success && res.user) {
      onLoginSuccess(res.user);
    } else {
      setErrorMessage(res.message || 'Email hoặc mật khẩu không chính xác.');
    }
  };

  // Preset Role Buttons for Provision Tab
  const applyProvPreset = (role: UserRole) => {
    setProvRole(role);
    if (role === 'referee') {
      setProvPermissions(['input_scores', 'print_scoresheet', 'view_groups_brackets']);
      setProvNotes('Trọng tài sân - Chỉ được quyền nhập tỷ số & in biên bản');
    } else if (role === 'viewer') {
      setProvPermissions(['view_groups_brackets', 'view_standings']);
      setProvNotes('Khách xem / Báo chí - Chỉ xem bảng đấu & BXH (Read-only)');
    } else if (role === 'coordinator') {
      setProvPermissions([
        'manage_teams_excel',
        'schedule_groups',
        'input_scores',
        'view_groups_brackets',
        'view_standings',
        'print_scoresheet',
      ]);
      setProvNotes('Điều phối viên - Nhập VĐV, bốc thăm & theo dõi tỷ số');
    } else if (role === 'organizer') {
      setProvPermissions([...ROLE_DEFAULT_PERMISSIONS.organizer]);
      setProvNotes('Trưởng BTC - Toàn quyền trong Tenant Database của giải');
      setProvDbMode('isolated');
    }
  };

  // Submit Account Provisioning
  const handleProvisionAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!provFullName.trim() || !provEmail.trim()) {
      alert('Vui lòng nhập đầy đủ họ tên và email.');
      return;
    }

    const res = MasterDb.createUser({
      fullName: provFullName.trim(),
      email: provEmail.trim(),
      password: provPassword.trim() || '123',
      role: provRole,
      permissions: provPermissions,
      currentTenantId: provDbMode === 'assigned' ? provTenantId : 'tenant_thuduc',
      dbAccessStatus: 'granted',
      dbAccessType: provDbMode === 'isolated' ? 'isolated_new' : 'assigned_existing',
      autoCreateIsolatedDb: provDbMode === 'isolated',
      newTenantOrgName: provNewOrgName.trim() || `${provFullName} Pickleball Tournament`,
      temporaryPin: '8866',
      notes: provNotes.trim(),
      plan: provRole === 'organizer' ? 'Pro' : 'Starter',
    });

    setProvisionSuccessSlip(res.user);
  };

  const handleCopySlip = () => {
    if (!provisionSuccessSlip) return;
    const assignedTenant = existingTenants.find((t) => t.id === provisionSuccessSlip.currentTenantId);
    const text = `PHIẾU CẤP TÀI KHOẢN PICKLEBALL PRO:
Họ tên: ${provisionSuccessSlip.fullName}
Email: ${provisionSuccessSlip.email}
Mật khẩu mặc định: ${provisionSuccessSlip.password || '123'}
Vai trò: ${provisionSuccessSlip.role.toUpperCase()}
Database: ${assignedTenant?.orgName || provisionSuccessSlip.currentTenantId}
Link đăng nhập: Hệ thống Master Server`;
    navigator.clipboard.writeText(text);
    setCopiedSlip(true);
    setTimeout(() => setCopiedSlip(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-slate-100 flex flex-col justify-between p-4 sm:p-6 lg:p-8">
      {/* Top Header Brand */}
      <div className="max-w-6xl w-full mx-auto flex items-center justify-between pb-6 border-b border-slate-700/60">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500 text-slate-950 font-black text-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
            PB
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
              <span>Pickleball Tournament Pro</span>
              <span className="text-[10px] font-mono uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded">
                Master Portal
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Cổng Đăng Nhập Quản Trị & Cấp Quyền Database Riêng (Multi-Tenant)
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-slate-400 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
          <Lock className="w-3.5 h-3.5 text-emerald-400" />
          <span>Mật khẩu mặc định: <strong className="text-emerald-300">123</strong></span>
        </div>
      </div>

      {/* Main Center Card Box */}
      <div className="max-w-4xl w-full mx-auto my-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Info Column */}
        <div className="lg:col-span-5 space-y-5">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-700/50 px-2.5 py-1 rounded-full">
              <Sparkles className="w-3.5 h-3.5" />
              Chuẩn Quốc Tế USA Pickleball & VPA
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
              Điều Hành Giải Đấu & Phân Quyền Trọng Tài
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Hệ thống quản lý giải đấu toàn diện với kiến trúc cơ sở dữ liệu riêng biệt cho từng ban tổ chức. Tự động hóa nhập danh sách Excel, bốc thăm chia bảng, tính điểm và sơ đồ loại trực tiếp.
            </p>
          </div>

          {/* Quick Credential Highlights */}
          <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200">
                THÔNG TIN TRUY CẬP HỆ THỐNG
              </span>
              <span className="text-[11px] font-mono font-bold text-emerald-400 bg-emerald-900/50 border border-emerald-700/50 px-2 py-0.5 rounded">
                PASS: 123
              </span>
            </div>

            <ul className="space-y-2 text-xs text-slate-300">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Mật khẩu mặc định: 123</strong> cho toàn bộ tài khoản Admin, Trọng tài, BTC và Khách xem.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Cấp tài khoản tức thì:</strong> Khởi tạo tài khoản mới, phân quyền chi tiết (chỉ nhập tỷ số, chỉ xem bảng) và gán Database riêng.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Database riêng (Isolated Schema):</strong> Mỗi ban tổ chức sở hữu một schema dữ liệu an toàn, không lo trùng lặp hay xung đột.
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Right Form Column: Login & Provision Switcher */}
        <div className="lg:col-span-7 bg-white text-slate-900 rounded-3xl shadow-2xl p-6 sm:p-8 border border-slate-200 space-y-5">
          {/* Top Toggle Tabs */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab('login')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'login'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Key className="w-3.5 h-3.5 text-emerald-600" />
              <span>Đăng Nhập Admin</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('provision')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'provision'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5 text-emerald-600" />
              <span>Cấp Tài Khoản Mới</span>
            </button>
          </div>

          {/* TAB 1: LOGIN FORM */}
          {activeTab === 'login' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Đăng Nhập Quản Trị Hệ Thống
                </h3>
                <p className="text-xs text-slate-500">
                  Nhập email hoặc tên tài khoản. Mật khẩu mặc định toàn hệ thống là{' '}
                  <strong className="text-emerald-700 font-mono">123</strong>.
                </p>
              </div>

              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-3.5 text-xs">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-slate-700">
                      Tên Đăng Nhập / Email *
                    </label>
                    <button
                      type="button"
                      onClick={() => setLoginEmail('admin')}
                      className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200"
                    >
                      Tên Admin: admin
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="admin"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium font-mono"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Tên đăng nhập quản trị viên là: <strong className="text-emerald-700 font-mono">admin</strong>
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-slate-700">
                      Mật Khẩu *
                    </label>
                    <button
                      type="button"
                      onClick={() => setLoginPassword('123')}
                      className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200"
                    >
                      Điền mật khẩu 123
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="123"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full px-3.5 py-2.5 pr-10 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono font-bold"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                    />
                    <span>Ghi nhớ phiên đăng nhập</span>
                  </label>
                  <span className="text-[11px] text-slate-500 font-mono">
                    Tài khoản: <strong>admin</strong> | Pass: <strong>123</strong>
                  </span>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold rounded-xl shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 text-sm"
                >
                  <span>Đăng Nhập Quản Trị (admin / 123)</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              {/* 1-Click Fast Accounts List */}
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block">
                  CHỌN TÀI KHOẢN MẪU ĐĂNG NHẬP NHANH (MẬT KHẨU: 123):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleSelectPresetUser('admin')}
                    className="p-2.5 rounded-xl border border-emerald-300 bg-emerald-50/30 hover:border-emerald-500 hover:bg-emerald-50 text-left transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900">👑 Super Admin</span>
                      <span className="text-[10px] font-mono text-emerald-700 font-bold bg-emerald-100 px-1.5 py-0.5 rounded">123</span>
                    </div>
                    <span className="text-[12px] text-emerald-900 font-mono font-bold block truncate mt-0.5">
                      admin
                    </span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">Tên đăng nhập: <strong>admin</strong> | Pass: <strong>123</strong></span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectPresetUser('btc.thuduc@pickleballvn.com')}
                    className="p-2.5 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/40 text-left transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900">🏆 Trưởng BTC Thủ Đức</span>
                      <span className="text-[10px] font-mono text-emerald-700 font-bold">123</span>
                    </div>
                    <span className="text-[11px] text-slate-500 font-mono block truncate">
                      btc.thuduc@pickleballvn.com
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Tenant DB Thủ Đức</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectPresetUser('referee.quang@pball.vn')}
                    className="p-2.5 rounded-xl border border-amber-200 bg-amber-50/30 hover:border-amber-400 hover:bg-amber-50 text-left transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-amber-950">🎾 Trọng Tài Sân</span>
                      <span className="text-[10px] font-mono text-amber-800 font-bold">123</span>
                    </div>
                    <span className="text-[11px] text-amber-800 font-mono block truncate">
                      referee.quang@pball.vn
                    </span>
                    <span className="text-[10px] text-amber-700 block mt-0.5">Chỉ nhập điểm & in phiếu</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectPresetUser('media@pickleballtoday.vn')}
                    className="p-2.5 rounded-xl border border-sky-200 bg-sky-50/30 hover:border-sky-400 hover:bg-sky-50 text-left transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-sky-950">👁️ Khách Xem / Báo Chí</span>
                      <span className="text-[10px] font-mono text-sky-800 font-bold">123</span>
                    </div>
                    <span className="text-[11px] text-sky-800 font-mono block truncate">
                      media@pickleballtoday.vn
                    </span>
                    <span className="text-[10px] text-sky-700 block mt-0.5">Chỉ xem bảng đấu & BXH</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PROVISION ACCOUNT DIRECTLY */}
          {activeTab === 'provision' && (
            <div className="space-y-4">
              {provisionSuccessSlip ? (
                <div className="space-y-4">
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3 text-emerald-900">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-sm">Đã Cấp Tài Khoản Thành Công!</h4>
                      <p className="text-xs text-emerald-800 mt-0.5">
                        Tài khoản đã được khởi tạo trong Master Database với mật khẩu mặc định <strong>123</strong>.
                      </p>
                    </div>
                  </div>

                  {/* Generated Slip */}
                  <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl p-4 font-mono text-xs space-y-2.5">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <span className="font-bold text-slate-900">PHIẾU CẤP TÀI KHOẢN MỚI</span>
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded">
                        MẬT KHẨU: 123
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-slate-700">
                      <div>
                        <span className="text-[10px] text-slate-400 block">HỌ VÀ TÊN</span>
                        <strong className="text-slate-900">{provisionSuccessSlip.fullName}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">EMAIL ĐĂNG NHẬP</span>
                        <strong className="text-emerald-700">{provisionSuccessSlip.email}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">MẬT KHẨU</span>
                        <strong className="text-slate-900">{provisionSuccessSlip.password || '123'}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">VAI TRÒ</span>
                        <strong className="text-slate-900">{provisionSuccessSlip.role.toUpperCase()}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-2">
                    <button
                      type="button"
                      onClick={handleCopySlip}
                      className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold"
                    >
                      {copiedSlip ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedSlip ? 'Đã Sao Chép!' : 'Sao Chép Thông Tin'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onLoginSuccess(provisionSuccessSlip)}
                      className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm"
                    >
                      <span>Vào Điều Hành Bằng Tài Khoản Này</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleProvisionAccount} className="space-y-3.5 text-xs">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">
                      Cấp Tài Khoản Mới & Phân Quyền
                    </h3>
                    <p className="text-xs text-slate-500">
                      Khởi tạo tài khoản cho Trọng tài, Điều phối viên hoặc Ban tổ chức mới. Mật khẩu mặc định là <strong>123</strong>.
                    </p>
                  </div>

                  {/* Preset Role Buttons */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button
                      type="button"
                      onClick={() => applyProvPreset('referee')}
                      className={`p-2 rounded-lg border text-left transition-colors ${
                        provRole === 'referee'
                          ? 'bg-amber-50 border-amber-300 font-bold text-amber-900'
                          : 'bg-slate-50 border-slate-200 text-slate-700'
                      }`}
                    >
                      <span className="text-xs block">🎾 Trọng Tài Sân</span>
                      <span className="text-[10px] text-slate-400 font-normal">Chỉ nhập điểm</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => applyProvPreset('viewer')}
                      className={`p-2 rounded-lg border text-left transition-colors ${
                        provRole === 'viewer'
                          ? 'bg-sky-50 border-sky-300 font-bold text-sky-900'
                          : 'bg-slate-50 border-slate-200 text-slate-700'
                      }`}
                    >
                      <span className="text-xs block">👁️ Khách Xem</span>
                      <span className="text-[10px] text-slate-400 font-normal">Chỉ xem bảng</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => applyProvPreset('coordinator')}
                      className={`p-2 rounded-lg border text-left transition-colors ${
                        provRole === 'coordinator'
                          ? 'bg-emerald-50 border-emerald-300 font-bold text-emerald-900'
                          : 'bg-slate-50 border-slate-200 text-slate-700'
                      }`}
                    >
                      <span className="text-xs block">📋 Điều Phối</span>
                      <span className="text-[10px] text-slate-400 font-normal">Lập lịch & VĐV</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => applyProvPreset('organizer')}
                      className={`p-2 rounded-lg border text-left transition-colors ${
                        provRole === 'organizer'
                          ? 'bg-purple-50 border-purple-300 font-bold text-purple-900'
                          : 'bg-slate-50 border-slate-200 text-slate-700'
                      }`}
                    >
                      <span className="text-xs block">🏆 Trưởng BTC</span>
                      <span className="text-[10px] text-slate-400 font-normal">Toàn quyền giải</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Họ & Tên Người Dùng *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="VD: Nguyễn Văn Nam (Trọng tài)"
                        value={provFullName}
                        onChange={(e) => setProvFullName(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Email Đăng Nhập *
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="nam.referee@pball.vn"
                        value={provEmail}
                        onChange={(e) => setProvEmail(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                      />
                    </div>
                  </div>

                  {/* Password block: Default 123 */}
                  <div className="p-3 bg-emerald-50/50 border border-emerald-200 rounded-xl flex items-center justify-between">
                    <div>
                      <label className="font-bold text-slate-800 block text-xs">
                        Mật Khẩu Cấp Phát (Mặc định: 123)
                      </label>
                      <span className="text-[10px] text-slate-500">
                        Người dùng sẽ dùng mật khẩu này để đăng nhập vào hệ thống
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={provPassword}
                        onChange={(e) => setProvPassword(e.target.value)}
                        className="w-20 px-2 py-1 bg-white border border-slate-200 rounded font-mono font-bold text-center text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => setProvPassword('123')}
                        className="px-2 py-1 bg-emerald-100 text-emerald-800 font-bold rounded text-[10px]"
                      >
                        Đặt 123
                      </button>
                    </div>
                  </div>

                  {/* Database Assignment */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <label className="font-bold text-slate-800 block text-xs">
                      PHƯƠNG THỨC CẤP DATABASE RIÊNG
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <label className="flex items-center gap-2 p-2 bg-white rounded border border-slate-200 cursor-pointer">
                        <input
                          type="radio"
                          name="provDb"
                          checked={provDbMode === 'assigned'}
                          onChange={() => setProvDbMode('assigned')}
                          className="text-emerald-600"
                        />
                        <span className="text-xs font-semibold">Gán DB có sẵn</span>
                      </label>
                      <label className="flex items-center gap-2 p-2 bg-white rounded border border-slate-200 cursor-pointer">
                        <input
                          type="radio"
                          name="provDb"
                          checked={provDbMode === 'isolated'}
                          onChange={() => setProvDbMode('isolated')}
                          className="text-emerald-600"
                        />
                        <span className="text-xs font-semibold">Tạo DB riêng mới</span>
                      </label>
                    </div>

                    {provDbMode === 'isolated' ? (
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          Tên CLB / Giải Đấu Mới *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="VD: CLB Pickleball Đồng Nai Open"
                          value={provNewOrgName}
                          onChange={(e) => setProvNewOrgName(e.target.value)}
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                        />
                      </div>
                    ) : (
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          Database Giải Đấu Gán Vào
                        </label>
                        <select
                          value={provTenantId}
                          onChange={(e) => setProvTenantId(e.target.value)}
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                        >
                          {existingTenants.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.orgName} ({t.schemaName})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-sm"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Cấp Tài Khoản & Tạo Phiếu Đăng Nhập</span>
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer Info */}
      <div className="max-w-6xl w-full mx-auto pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span>Hệ thống Quản Trị Giải Đấu Pickleball Pro</span>
          <span>·</span>
          <span>PostgreSQL Multi-Tenant Isolated DB</span>
        </div>
        <div>
          <span>Mật khẩu mặc định hệ thống: <strong className="text-emerald-400 font-mono">123</strong></span>
        </div>
      </div>
    </div>
  );
};
