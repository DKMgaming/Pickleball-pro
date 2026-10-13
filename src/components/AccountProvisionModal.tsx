import React, { useState } from 'react';
import {
  X,
  UserPlus,
  Key,
  Shield,
  CheckCircle2,
  Copy,
  Printer,
  Sparkles,
  Database,
  ArrowRight,
  Eye,
  EyeOff,
  Clock,
  Layers,
  Check
} from 'lucide-react';
import { MasterUser, Tenant, UserRole, UserPermission, ROLE_DEFAULT_PERMISSIONS } from '../types/tournament.ts';
import { MasterDb } from '../services/storage.ts';

interface AccountProvisionModalProps {
  activeTenant: Tenant;
  onClose: () => void;
  onAccountProvisioned?: (newUser: MasterUser) => void;
  onSwitchUser?: (userId: string) => void;
}

export const AccountProvisionModal: React.FC<AccountProvisionModalProps> = ({
  activeTenant,
  onClose,
  onAccountProvisioned,
  onSwitchUser,
}) => {
  const [tenants] = useState<Tenant[]>(() => MasterDb.getTenants());

  // Form states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('123');
  const [temporaryPin, setTemporaryPin] = useState('8866');
  const [role, setRole] = useState<UserRole>('referee');
  const [notes, setNotes] = useState('Trọng tài điều hành sân đấu');
  const [plan, setPlan] = useState<'Starter' | 'Pro' | 'Enterprise'>('Starter');
  const [selectedTenantId, setSelectedTenantId] = useState<string>(activeTenant.id);
  const [dbAccessStatus, setDbAccessStatus] = useState<'granted' | 'pending'>('granted');
  const [dbAccessType, setDbAccessType] = useState<'assigned_existing' | 'isolated_new'>('assigned_existing');
  const [newOrgName, setNewOrgName] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Selected permissions (Default to Referee: only score entry + print score sheet)
  const [permissions, setPermissions] = useState<UserPermission[]>([
    'input_scores',
    'print_scoresheet',
    'view_groups_brackets',
  ]);

  // Success result slip state
  const [provisionedUser, setProvisionedUser] = useState<MasterUser | null>(null);
  const [copiedSlip, setCopiedSlip] = useState(false);

  // Presets
  const applyPresetReferee = () => {
    setRole('referee');
    setPermissions(['input_scores', 'print_scoresheet', 'view_groups_brackets']);
    setNotes('Trọng tài sân - Chỉ được quyền nhập tỷ số & in biên bản A4');
  };

  const applyPresetViewer = () => {
    setRole('viewer');
    setPermissions(['view_groups_brackets', 'view_standings']);
    setNotes('Khách xem / Báo chí - Chỉ xem bảng đấu & BXH (Read-only)');
  };

  const applyPresetCoordinator = () => {
    setRole('coordinator');
    setPermissions([
      'manage_teams_excel',
      'schedule_groups',
      'input_scores',
      'view_groups_brackets',
      'view_standings',
      'print_scoresheet',
    ]);
    setNotes('Điều phối viên giải đấu - Nhập VĐV, bốc thăm & theo dõi trận đấu');
  };

  const applyPresetOrganizer = () => {
    setRole('organizer');
    setPermissions([...ROLE_DEFAULT_PERMISSIONS.organizer]);
    setNotes('Trưởng Ban Tổ Chức - Toàn quyền trong Tenant Database của giải');
  };

  const handleTogglePermission = (perm: UserPermission) => {
    if (permissions.includes(perm)) {
      setPermissions(permissions.filter((p) => p !== perm));
    } else {
      setPermissions([...permissions, perm]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) return;

    const res = MasterDb.createUser({
      fullName: fullName.trim(),
      email: email.trim(),
      password: password.trim() || '123',
      temporaryPin: temporaryPin.trim() || '1234',
      role,
      permissions,
      currentTenantId: selectedTenantId,
      dbAccessStatus,
      dbAccessType,
      notes: notes.trim(),
      plan,
      autoCreateIsolatedDb: dbAccessType === 'isolated_new',
      newTenantOrgName: newOrgName.trim(),
    });

    setProvisionedUser(res.user);
    if (onAccountProvisioned) {
      onAccountProvisioned(res.user);
    }
  };

  const getSlipText = () => {
    if (!provisionedUser) return '';
    const assignedTenant = tenants.find((t) => t.id === provisionedUser.currentTenantId);
    return `==========================================
PHIẾU CẤP TÀI KHOẢN HỆ THỐNG PICKLEBALL PRO
==========================================
Họ và Tên: ${provisionedUser.fullName}
Email Đăng Nhập: ${provisionedUser.email}
Mật Khẩu Mặc Định: ${provisionedUser.password || '123'}
Mã PIN Nhanh: ${provisionedUser.temporaryPin || '1234'}
Vai Trò: ${provisionedUser.role.toUpperCase()}
Phân Quyền: ${provisionedUser.permissions.join(', ')}
Database Được Gán: ${assignedTenant?.orgName || provisionedUser.currentTenantId}
Trạng Thái DB: ${provisionedUser.dbAccessStatus === 'granted' ? 'ĐÃ KÍCH HOẠT' : 'CHỜ DUYỆT'}
Ngày Cấp: ${new Date(provisionedUser.createdAt).toLocaleString('vi-VN')}
==========================================`;
  };

  const handleCopySlip = () => {
    navigator.clipboard.writeText(getSlipText());
    setCopiedSlip(true);
    setTimeout(() => setCopiedSlip(false), 2500);
  };

  const handlePrintSlip = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full p-6 space-y-5 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {provisionedUser ? 'Phiếu Cấp Tài Khoản Mới Thành Công' : 'Cấp Tài Khoản Người Dùng Mới'}
              </h3>
              <p className="text-[11px] text-slate-500 font-mono">
                {provisionedUser
                  ? 'Tài khoản đã được khởi tạo trong Master DB kèm mật khẩu mặc định 123'
                  : 'Khởi tạo tài khoản & phân quyền chi tiết trước khi cấp truy cập Database'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* View Mode: Success Slip Display */}
        {provisionedUser ? (
          <div className="space-y-4">
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-emerald-900 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-sm">Cấp Tài Khoản Thành Công!</h4>
                <p className="text-xs text-emerald-800 mt-0.5">
                  Tài khoản đã sẵn sàng đăng nhập với <strong>Mật khẩu mặc định: 123</strong>. Hãy sao chép phiếu thông tin dưới đây để gửi cho người dùng.
                </p>
              </div>
            </div>

            {/* Official Credentials Slip Card */}
            <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl p-5 space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="font-bold text-slate-900 text-sm tracking-wide">
                  PHIẾU THÔNG TIN ĐĂNG NHẬP
                </span>
                <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded text-[10px]">
                  PASS MẶC ĐỊNH: 123
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-700">
                <div>
                  <span className="text-slate-400 block text-[10px]">HỌ VÀ TÊN</span>
                  <strong className="text-slate-900 text-sm">{provisionedUser.fullName}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">EMAIL ĐĂNG NHẬP</span>
                  <strong className="text-emerald-700">{provisionedUser.email}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">MẬT KHẨU ĐĂNG NHẬP</span>
                  <div className="flex items-center gap-2">
                    <strong className="text-slate-900 text-sm bg-white px-2 py-0.5 rounded border border-slate-200">
                      {provisionedUser.password || '123'}
                    </strong>
                    <span className="text-[10px] text-slate-500 font-sans">(Mặc định: 123)</span>
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">MÃ PIN TRUY CẬP NHANH</span>
                  <strong className="text-slate-900 text-sm bg-white px-2 py-0.5 rounded border border-slate-200">
                    {provisionedUser.temporaryPin || '1234'}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">VAI TRÒ & QUYỀN HẠN</span>
                  <span className="font-bold text-slate-800">
                    {provisionedUser.role.toUpperCase()} ({provisionedUser.permissions.length} quyền)
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">DATABASE ĐƯỢC GÁN</span>
                  <span className="font-bold text-slate-800 truncate block">
                    {tenants.find((t) => t.id === provisionedUser.currentTenantId)?.orgName || provisionedUser.currentTenantId}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 flex flex-wrap gap-1">
                {provisionedUser.permissions.map((p) => (
                  <span key={p} className="bg-white border border-slate-200 text-slate-600 px-1.5 py-0.5 rounded text-[10px]">
                    ✓ {p}
                  </span>
                ))}
              </div>
            </div>

            {/* Action Buttons for Slip */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopySlip}
                  className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold transition-colors"
                >
                  {copiedSlip ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSlip ? 'Đã Sao Chép Phiếu!' : 'Sao Chép Thông Tin'}</span>
                </button>

                <button
                  type="button"
                  onClick={handlePrintSlip}
                  className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>In Phiếu A5</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                {onSwitchUser && (
                  <button
                    type="button"
                    onClick={() => {
                      onSwitchUser(provisionedUser.id);
                      onClose();
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
                  >
                    <span>Đăng Nhập Thử Bằng Tài Khoản Này</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Form Mode: Input Details */
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Quick Presets */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wide block">
                CHỌN NHANH VAI TRÒ CẤP TÀI KHOẢN
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={applyPresetReferee}
                  className={`p-2 rounded-lg border text-left transition-colors ${
                    role === 'referee'
                      ? 'bg-amber-50 border-amber-300 font-bold text-amber-900'
                      : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <span className="text-xs block">🎾 Trọng Tài Sân</span>
                  <span className="text-[10px] text-slate-400 font-normal">Chỉ nhập điểm</span>
                </button>

                <button
                  type="button"
                  onClick={applyPresetViewer}
                  className={`p-2 rounded-lg border text-left transition-colors ${
                    role === 'viewer'
                      ? 'bg-sky-50 border-sky-300 font-bold text-sky-900'
                      : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <span className="text-xs block">👁️ Khách Xem</span>
                  <span className="text-[10px] text-slate-400 font-normal">Chỉ xem bảng</span>
                </button>

                <button
                  type="button"
                  onClick={applyPresetCoordinator}
                  className={`p-2 rounded-lg border text-left transition-colors ${
                    role === 'coordinator'
                      ? 'bg-emerald-50 border-emerald-300 font-bold text-emerald-900'
                      : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <span className="text-xs block">📋 Điều Phối Viên</span>
                  <span className="text-[10px] text-slate-400 font-normal">VĐV & Lịch đấu</span>
                </button>

                <button
                  type="button"
                  onClick={applyPresetOrganizer}
                  className={`p-2 rounded-lg border text-left transition-colors ${
                    role === 'organizer'
                      ? 'bg-purple-50 border-purple-300 font-bold text-purple-900'
                      : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <span className="text-xs block">🏆 Trưởng BTC</span>
                  <span className="text-[10px] text-slate-400 font-normal">Toàn quyền giải</span>
                </button>
              </div>
            </div>

            {/* Profile Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Họ & Tên Người Dùng *
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Lê Văn Quang"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
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
                  placeholder="quang.referee@pball.vn"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                />
              </div>
            </div>

            {/* Password & PIN inputs with prominent "Mật khẩu mặc định 123" */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-emerald-50/40 border border-emerald-200/80 rounded-xl">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-800 flex items-center gap-1">
                    <Key className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Mật Khẩu Đăng Nhập</span>
                  </label>
                  <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded">
                    MẶC ĐỊNH: 123
                  </span>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 pr-16 bg-white border border-slate-200 rounded-lg font-mono font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  <div className="absolute right-2 top-2 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setPassword('123')}
                      title="Đặt lại về mật khẩu 123"
                      className="text-[10px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-1.5 py-0.5 rounded"
                    >
                      123
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  Người dùng có thể đăng nhập bằng email và mật khẩu <strong>123</strong>
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Mã PIN Nhanh (Thay thế)
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={temporaryPin}
                  onChange={(e) => setTemporaryPin(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-mono font-bold text-center focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Dùng để mở nhanh quyền nhập điểm trên điện thoại của trọng tài
                </p>
              </div>
            </div>

            {/* Database Assignment & Provisioning Option */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <label className="font-bold text-slate-800 block text-xs">
                CẤP QUYỀN DATABASE RIÊNG (TENANT DB)
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <label
                  className={`p-2.5 rounded-lg border cursor-pointer flex items-center gap-2 ${
                    dbAccessType === 'assigned_existing'
                      ? 'bg-emerald-50 border-emerald-300 font-semibold'
                      : 'bg-white border-slate-200'
                  }`}
                >
                  <input
                    type="radio"
                    name="modalDbAccessType"
                    checked={dbAccessType === 'assigned_existing'}
                    onChange={() => setDbAccessType('assigned_existing')}
                    className="text-emerald-600"
                  />
                  <div>
                    <span className="block text-xs">Gán vào DB có sẵn</span>
                    <span className="text-[10px] text-slate-500 font-normal block">
                      Trọng tài, điều phối viên giải
                    </span>
                  </div>
                </label>

                <label
                  className={`p-2.5 rounded-lg border cursor-pointer flex items-center gap-2 ${
                    dbAccessType === 'isolated_new'
                      ? 'bg-emerald-50 border-emerald-300 font-semibold'
                      : 'bg-white border-slate-200'
                  }`}
                >
                  <input
                    type="radio"
                    name="modalDbAccessType"
                    checked={dbAccessType === 'isolated_new'}
                    onChange={() => setDbAccessType('isolated_new')}
                    className="text-emerald-600"
                  />
                  <div>
                    <span className="block text-xs">Cấp Schema DB Độc Lập</span>
                    <span className="text-[10px] text-slate-500 font-normal block">
                      Dành cho BTC giải đấu mới
                    </span>
                  </div>
                </label>
              </div>

              {dbAccessType === 'isolated_new' ? (
                <div className="pt-2">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Tên CLB / Tổ Chức Mới *
                  </label>
                  <input
                    type="text"
                    required={dbAccessType === 'isolated_new'}
                    placeholder="VD: CLB Pickleball Bình Dương"
                    value={newOrgName}
                    onChange={(e) => setNewOrgName(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg"
                  />
                </div>
              ) : (
                <div className="pt-2">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Chọn Database Giải Đấu
                  </label>
                  <select
                    value={selectedTenantId}
                    onChange={(e) => setSelectedTenantId(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-medium"
                  >
                    {tenants.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.orgName} (Schema: {t.schemaName})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="pt-2 flex items-center justify-between border-t border-slate-200 text-xs">
                <span className="text-slate-600 font-medium">Trạng thái cấp quyền DB:</span>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="modalDbStatus"
                      checked={dbAccessStatus === 'granted'}
                      onChange={() => setDbAccessStatus('granted')}
                      className="text-emerald-600"
                    />
                    <span className="text-emerald-700 font-bold">Kích hoạt ngay</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="modalDbStatus"
                      checked={dbAccessStatus === 'pending'}
                      onChange={() => setDbAccessStatus('pending')}
                      className="text-amber-600"
                    />
                    <span className="text-amber-700 font-bold">Tạm chờ duyệt</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Granular Permission Checklist */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-900 block">
                DANH MỤC PHÂN QUYỀN THAO TÁC ({permissions.length} QUYỀN ĐÃ CHỌN)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-36 overflow-y-auto pr-1">
                <label className="flex items-center gap-2 p-1.5 bg-slate-50 hover:bg-slate-100 rounded border border-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={permissions.includes('input_scores')}
                    onChange={() => handleTogglePermission('input_scores')}
                    className="text-emerald-600 rounded"
                  />
                  <span className="font-semibold text-slate-800">🎾 Ghi nhận & Nhập tỷ số</span>
                </label>
                <label className="flex items-center gap-2 p-1.5 bg-slate-50 hover:bg-slate-100 rounded border border-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={permissions.includes('view_groups_brackets')}
                    onChange={() => handleTogglePermission('view_groups_brackets')}
                    className="text-emerald-600 rounded"
                  />
                  <span className="font-semibold text-slate-800">👁️ Xem bảng đấu & Playoff</span>
                </label>
                <label className="flex items-center gap-2 p-1.5 bg-slate-50 hover:bg-slate-100 rounded border border-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={permissions.includes('view_standings')}
                    onChange={() => handleTogglePermission('view_standings')}
                    className="text-emerald-600 rounded"
                  />
                  <span className="font-semibold text-slate-800">📊 Xem bảng xếp hạng</span>
                </label>
                <label className="flex items-center gap-2 p-1.5 bg-slate-50 hover:bg-slate-100 rounded border border-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={permissions.includes('print_scoresheet')}
                    onChange={() => handleTogglePermission('print_scoresheet')}
                    className="text-emerald-600 rounded"
                  />
                  <span className="font-semibold text-slate-800">🖨️ In biên bản trọng tài</span>
                </label>
                <label className="flex items-center gap-2 p-1.5 bg-slate-50 hover:bg-slate-100 rounded border border-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={permissions.includes('manage_teams_excel')}
                    onChange={() => handleTogglePermission('manage_teams_excel')}
                    className="text-emerald-600 rounded"
                  />
                  <span className="font-semibold text-slate-800">📑 Nhập Excel & VĐV</span>
                </label>
                <label className="flex items-center gap-2 p-1.5 bg-slate-50 hover:bg-slate-100 rounded border border-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={permissions.includes('schedule_groups')}
                    onChange={() => handleTogglePermission('schedule_groups')}
                    className="text-emerald-600 rounded"
                  />
                  <span className="font-semibold text-slate-800">🗓️ Bốc thăm & Lập lịch đấu</span>
                </label>
                <label className="flex items-center gap-2 p-1.5 bg-slate-50 hover:bg-slate-100 rounded border border-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={permissions.includes('manage_tournaments')}
                    onChange={() => handleTogglePermission('manage_tournaments')}
                    className="text-emerald-600 rounded"
                  />
                  <span className="font-semibold text-slate-800">⚙️ Cấu hình giải đấu</span>
                </label>
                <label className="flex items-center gap-2 p-1.5 bg-slate-50 hover:bg-slate-100 rounded border border-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={permissions.includes('manage_database')}
                    onChange={() => handleTogglePermission('manage_database')}
                    className="text-emerald-600 rounded"
                  />
                  <span className="font-semibold text-slate-800">💾 Quản trị Tenant DB</span>
                </label>
              </div>
            </div>

            {/* Submit Bar */}
            <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
              <span className="text-slate-500 text-[11px]">
                Mật khẩu cấp phát mặc định: <strong className="text-slate-800 font-mono">123</strong>
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-sm transition-colors"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Xác Nhận Cấp Tài Khoản</span>
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
