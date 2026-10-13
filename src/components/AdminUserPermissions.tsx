import React, { useState } from 'react';
import {
  Users,
  Shield,
  ShieldCheck,
  Plus,
  Key,
  Database,
  Lock,
  Unlock,
  Trash2,
  Edit2,
  Check,
  UserCheck,
  AlertCircle,
  HelpCircle,
  X,
  Server,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Eye,
  EyeOff,
  Flame,
  FileText,
  UserPlus,
  KeyRound,
} from 'lucide-react';
import {
  MasterUser,
  Tenant,
  UserRole,
  UserPermission,
  ROLE_DEFAULT_PERMISSIONS,
} from '../types/tournament.ts';
import { MasterDb } from '../services/storage.ts';
import { ChangePasswordModal } from './ChangePasswordModal';

interface AdminUserPermissionsProps {
  currentUser: MasterUser;
  activeTenant: Tenant;
  onUserChanged: (updatedUser: MasterUser) => void;
  onSwitchUserSession: (userId: string) => void;
  onOpenProvisionModal?: () => void;
}

export const AdminUserPermissions: React.FC<AdminUserPermissionsProps> = ({
  currentUser,
  activeTenant,
  onUserChanged,
  onSwitchUserSession,
  onOpenProvisionModal,
}) => {
  const [users, setUsers] = useState<MasterUser[]>(() => MasterDb.getUsers());
  const [tenants, setTenants] = useState<Tenant[]>(() => MasterDb.getTenants());
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [editingUser, setEditingUser] = useState<MasterUser | null>(null);
  const [showMatrixModal, setShowMatrixModal] = useState<boolean>(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState<boolean>(false);
  const [targetUserForPassword, setTargetUserForPassword] = useState<MasterUser | null>(null);

  // Multi-step Wizard state (Step 1: Info, Step 2: Permissions, Step 3: DB Access Provisioning)
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);

  // Form states for Create/Edit User
  const [formEmail, setFormEmail] = useState('');
  const [formFullName, setFormFullName] = useState('');
  const [formPassword, setFormPassword] = useState('123');
  const [formRole, setFormRole] = useState<UserRole>('referee');
  const [formTemporaryPin, setFormTemporaryPin] = useState('8866');
  const [formNotes, setFormNotes] = useState('');
  const [formCurrentTenantId, setFormCurrentTenantId] = useState<string>(activeTenant.id);
  const [formPermissions, setFormPermissions] = useState<UserPermission[]>([
    'input_scores',
    'print_scoresheet',
  ]);
  const [formPlan, setFormPlan] = useState<'Starter' | 'Pro' | 'Enterprise'>('Starter');
  const [formDbAccessStatus, setFormDbAccessStatus] = useState<'granted' | 'pending' | 'revoked'>('granted');
  const [formDbAccessType, setFormDbAccessType] = useState<'assigned_existing' | 'isolated_new'>(
    'assigned_existing'
  );
  const [newOrgName, setNewOrgName] = useState('');

  const refreshData = () => {
    setUsers(MasterDb.getUsers());
    setTenants(MasterDb.getTenants());
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'super_admin':
        return (
          <span className="font-mono text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
            SUPER ADMIN
          </span>
        );
      case 'organizer':
        return (
          <span className="font-mono text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            TRƯỞNG BTC
          </span>
        );
      case 'coordinator':
        return (
          <span className="font-mono text-[10px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
            ĐIỀU PHỐI VIÊN
          </span>
        );
      case 'referee':
        return (
          <span className="font-mono text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
            TRỌNG TÀI
          </span>
        );
      case 'viewer':
        return (
          <span className="font-mono text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
            KHÁCH XEM (READ)
          </span>
        );
      default:
        return null;
    }
  };

  const allPermissionsList: { key: UserPermission; label: string; desc: string; category: string }[] = [
    {
      key: 'input_scores',
      label: 'Ghi Nhận & Nhập Tỷ Số',
      desc: 'Nhập điểm trực tiếp từng hiệp (Bo1/Bo3/Bo5) và xác nhận đội thắng',
      category: 'Trọng Tài',
    },
    {
      key: 'view_groups_brackets',
      label: 'Xem Bảng Đấu & Nhánh Playoff',
      desc: 'Xem sơ đồ cây knockout, lịch thi đấu các sân (Chế độ chỉ xem)',
      category: 'Khách / Báo Chí',
    },
    {
      key: 'view_standings',
      label: 'Xem Bảng Xếp Hạng Vòng Bảng',
      desc: 'Xem thứ hạng, hiệu số điểm và vé vào playoff vòng bảng',
      category: 'Khách / Báo Chí',
    },
    {
      key: 'print_scoresheet',
      label: 'In Biên Bản Trọng Tài A4',
      desc: 'Xuất và in phiếu điểm trọng tài kèm ô chữ ký 2 đội trưởng',
      category: 'Trọng Tài',
    },
    {
      key: 'schedule_groups',
      label: 'Bốc Thăm & Lập Lịch Đấu',
      desc: 'Chia bảng theo hạt giống / ngẫu nhiên, tự động sinh lịch đấu',
      category: 'Điều Phối Viên',
    },
    {
      key: 'manage_teams_excel',
      label: 'Nhập VĐV & File Excel',
      desc: 'Tải lên file Excel (.xlsx), kiểm tra trùng lặp và gán hạt giống',
      category: 'Điều Phối Viên',
    },
    {
      key: 'manage_tournaments',
      label: 'Quản Lý Giải Đấu',
      desc: 'Tạo giải mới, chỉnh sửa thể thức, cụm sân và quy tắc điểm từng vòng',
      category: 'Trưởng BTC',
    },
    {
      key: 'manage_database',
      label: 'Quản Trị Tenant Database',
      desc: 'Sao lưu JSON, xuất file SQL DDL, bảo trì và reset schema riêng',
      category: 'Trưởng BTC',
    },
    {
      key: 'manage_users',
      label: 'Phân Quyền User & Cấp DB',
      desc: 'Tạo tài khoản người dùng con, phân quyền chi tiết và cấp DB riêng',
      category: 'Super Admin',
    },
  ];

  // Quick Preset Handlers
  const applyPresetRefereeOnly = () => {
    setFormRole('referee');
    setFormPermissions(['input_scores', 'view_groups_brackets', 'print_scoresheet']);
    setFormNotes('Trọng tài điều hành trận đấu - Chỉ được nhập điểm & in biên bản');
  };

  const applyPresetViewerOnly = () => {
    setFormRole('viewer');
    setFormPermissions(['view_groups_brackets', 'view_standings']);
    setFormNotes('Khách xem / Truyền thông báo chí - Chỉ xem bảng đấu & xếp hạng');
  };

  const applyPresetCoordinator = () => {
    setFormRole('coordinator');
    setFormPermissions([
      'manage_teams_excel',
      'schedule_groups',
      'input_scores',
      'view_groups_brackets',
      'view_standings',
      'print_scoresheet',
    ]);
    setFormNotes('Điều phối viên giải - Quản lý VĐV, bốc thăm & giám sát tỷ số');
  };

  const applyPresetFullOrganizer = () => {
    setFormRole('organizer');
    setFormPermissions([...ROLE_DEFAULT_PERMISSIONS.organizer]);
    setFormNotes('Trưởng ban tổ chức - Toàn quyền trong Database riêng của giải');
  };

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingUser(null);
    setWizardStep(1);
    setFormEmail('');
    setFormFullName('');
    setFormPassword('123');
    setFormRole('referee');
    setFormTemporaryPin('8866');
    setFormNotes('Trọng tài sân - Chỉ được quyền nhập tỷ số');
    setFormCurrentTenantId(activeTenant.id);
    setFormPermissions(['input_scores', 'view_groups_brackets', 'print_scoresheet']);
    setFormPlan('Starter');
    setFormDbAccessStatus('granted');
    setFormDbAccessType('assigned_existing');
    setNewOrgName('');
    setShowCreateModal(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (user: MasterUser) => {
    setEditingUser(user);
    setWizardStep(1);
    setFormEmail(user.email);
    setFormFullName(user.fullName);
    setFormPassword(user.password || '123');
    setFormRole(user.role);
    setFormTemporaryPin(user.temporaryPin || '1234');
    setFormNotes(user.notes || '');
    setFormCurrentTenantId(user.currentTenantId);
    setFormPermissions([...user.permissions]);
    setFormPlan(user.plan);
    setFormDbAccessStatus(user.dbAccessStatus || 'granted');
    setFormDbAccessType(user.dbAccessType || 'assigned_existing');
    setNewOrgName('');
    setShowCreateModal(true);
  };

  // Toggle permission checkbox
  const handleTogglePermission = (perm: UserPermission) => {
    if (formPermissions.includes(perm)) {
      setFormPermissions(formPermissions.filter((p) => p !== perm));
    } else {
      setFormPermissions([...formPermissions, perm]);
    }
  };

  // Toggle Database Access Status directly from table row (Grant / Revoke)
  const handleToggleDbAccessStatus = (user: MasterUser) => {
    if (user.id === currentUser.id) {
      alert('Không thể tự thu hồi quyền truy cập Database của tài khoản đang đăng nhập.');
      return;
    }
    const nextStatus = user.dbAccessStatus === 'granted' ? 'revoked' : 'granted';
    MasterDb.setDbAccessStatus(user.id, nextStatus);
    refreshData();
  };

  // Submit Create or Edit User
  const handleSubmitUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formEmail || !formFullName) return;

    if (editingUser) {
      const updated: MasterUser = {
        ...editingUser,
        email: formEmail.trim(),
        fullName: formFullName.trim(),
        password: formPassword.trim() || '123',
        role: formRole,
        temporaryPin: formTemporaryPin.trim(),
        notes: formNotes.trim(),
        currentTenantId: formCurrentTenantId,
        permissions: formPermissions,
        dbAccessStatus: formDbAccessStatus,
        dbAccessType: formDbAccessType,
        plan: formPlan,
      };
      MasterDb.updateUser(updated);
      if (currentUser.id === updated.id) {
        onUserChanged(updated);
      }
    } else {
      MasterDb.createUser({
        email: formEmail,
        fullName: formFullName,
        password: formPassword.trim() || '123',
        role: formRole,
        temporaryPin: formTemporaryPin.trim(),
        notes: formNotes.trim(),
        currentTenantId: formCurrentTenantId,
        permissions: formPermissions,
        plan: formPlan,
        dbAccessStatus: formDbAccessStatus,
        dbAccessType: formDbAccessType,
        autoCreateIsolatedDb: formDbAccessType === 'isolated_new',
        newTenantOrgName: newOrgName,
      });
    }

    refreshData();
    setShowCreateModal(false);
  };

  // Toggle User Active / Suspended Status
  const handleToggleStatus = (user: MasterUser) => {
    if (user.id === currentUser.id) {
      alert('Không thể tự khóa tài khoản đang đăng nhập.');
      return;
    }
    const updated: MasterUser = {
      ...user,
      status: user.status === 'active' ? 'suspended' : 'active',
    };
    MasterDb.updateUser(updated);
    refreshData();
  };

  // Delete User
  const handleDeleteUser = (userId: string) => {
    if (userId === currentUser.id) {
      alert('Không thể xóa tài khoản bạn đang đăng nhập.');
      return;
    }
    if (confirm('Bạn có chắc chắn muốn xóa tài khoản này khỏi Master Server?')) {
      MasterDb.deleteUser(userId);
      refreshData();
    }
  };

  const filteredUsers = users.filter((u) => {
    if (selectedRoleFilter === 'all') return true;
    return u.role === selectedRoleFilter;
  });

  // Helper description of permissions
  const getUserPermissionSummary = (u: MasterUser) => {
    if (u.role === 'super_admin') return 'Toàn Quyền Master DB';
    const isReferee = u.permissions.includes('input_scores') && !u.permissions.includes('manage_tournaments');
    const isViewerOnly = !u.permissions.includes('input_scores') && !u.permissions.includes('manage_tournaments');
    if (isReferee && u.permissions.length <= 3) return 'Chỉ Nhập Tỷ Số & In Phiếu';
    if (isViewerOnly) return 'Chỉ Xem Bảng Đấu & BXH';
    if (u.permissions.includes('manage_tournaments')) return 'Toàn Quyền Tenant DB';
    return `Được cấp ${u.permissions.length} quyền`;
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight text-slate-900">
              Quản Trị Người Dùng & Phân Quyền Chi Tiết (RBAC)
            </h2>
            <span className="text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded">
              TENANT PERMISSIONS
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Thiết lập quyền chi tiết (chỉ nhập tỷ số, chỉ xem bảng đấu) trước khi cấp quyền truy cập vào Database riêng
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Permission Matrix Guide button */}
          <button
            onClick={() => setShowMatrixModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs transition-colors"
          >
            <HelpCircle className="w-3.5 h-3.5 text-sky-600" />
            <span>Ma Trận Phân Quyền</span>
          </button>

          {/* Quick Provision Account with default password 123 */}
          {onOpenProvisionModal && (
            <button
              onClick={onOpenProvisionModal}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg shadow-2xs transition-colors"
            >
              <UserPlus className="w-3.5 h-3.5 text-emerald-600" />
              <span>Cấp Tài Khoản Mới (Pass 123)</span>
            </button>
          )}

          {/* Create User Button with Step-by-Step Flow */}
          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-lg shadow-2xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tạo User & Phân Quyền</span>
          </button>
        </div>
      </div>

      {/* Active Session Card (Role Impersonation / Test Sandbox) */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-sm shrink-0">
            {currentUser.fullName.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900">
                Tài Khoản Đang Đăng Nhập: {currentUser.fullName}
              </span>
              {getRoleBadge(currentUser.role)}
              <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                {getUserPermissionSummary(currentUser)}
              </span>
            </div>
            <div className="text-[11px] text-slate-500 font-mono mt-0.5">
              Email: {currentUser.email} · Quyền DB:{' '}
              <strong className={currentUser.dbAccessStatus === 'granted' ? 'text-emerald-700' : 'text-amber-700'}>
                {currentUser.dbAccessStatus === 'granted' ? 'Đã Cấp Quyền' : 'Chờ Cấp / Tạm Khóa'}
              </strong>{' '}
              · Database:{' '}
              <span className="text-slate-800">
                {tenants.find((t) => t.id === currentUser.currentTenantId)?.orgName || currentUser.currentTenantId}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={() => {
              setTargetUserForPassword(currentUser);
              setShowChangePasswordModal(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-lg transition-colors shadow-2xs whitespace-nowrap"
            title="Đổi mật khẩu tài khoản đang đăng nhập của bạn"
          >
            <KeyRound className="w-3.5 h-3.5 text-amber-600" />
            <span>Đổi Mật Khẩu</span>
          </button>

          <span className="text-xs text-slate-500 font-medium hidden md:inline">
            Thử nghiệm vai trò:
          </span>
          <select
            value={currentUser.id}
            onChange={(e) => onSwitchUserSession(e.target.value)}
            className="px-3 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800"
          >
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                Đóng vai: {u.fullName} ({u.role} - {getUserPermissionSummary(u)})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Role Filter Tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg max-w-fit overflow-x-auto">
        <button
          onClick={() => setSelectedRoleFilter('all')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
            selectedRoleFilter === 'all'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Tất Cả ({users.length})
        </button>
        <button
          onClick={() => setSelectedRoleFilter('referee')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
            selectedRoleFilter === 'referee'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Trọng Tài (Chỉ Nhập Điểm)
        </button>
        <button
          onClick={() => setSelectedRoleFilter('viewer')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
            selectedRoleFilter === 'viewer'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Khách Xem (Chỉ Xem)
        </button>
        <button
          onClick={() => setSelectedRoleFilter('organizer')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
            selectedRoleFilter === 'organizer'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Trưởng BTC
        </button>
        <button
          onClick={() => setSelectedRoleFilter('coordinator')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
            selectedRoleFilter === 'coordinator'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Điều Phối Viên
        </button>
        <button
          onClick={() => setSelectedRoleFilter('super_admin')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
            selectedRoleFilter === 'super_admin'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Super Admin
        </button>
      </div>

      {/* Users Data Grid */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Người Dùng & PIN</th>
                <th className="px-4 py-3">Vai Trò & Tóm Tắt Quyền</th>
                <th className="px-4 py-3">Database Riêng (Tenant DB)</th>
                <th className="px-4 py-3 text-center">Trạng Thái Cấp DB</th>
                <th className="px-4 py-3">Chi Tiết Quyền Hạn</th>
                <th className="px-4 py-3 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map((u) => {
                const assignedTenant = tenants.find((t) => t.id === u.currentTenantId);
                const isCurrent = u.id === currentUser.id;
                const isDbGranted = u.dbAccessStatus === 'granted';

                return (
                  <tr
                    key={u.id}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      isCurrent ? 'bg-emerald-50/20' : ''
                    }`}
                  >
                    {/* User Profile & PIN */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0">
                          {u.fullName.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 flex items-center gap-1.5">
                            <span>{u.fullName}</span>
                            {isCurrent && (
                              <span className="text-[9px] font-mono font-bold text-emerald-700 bg-emerald-100 px-1 rounded">
                                BẠN
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] font-mono text-slate-500 flex items-center gap-1.5 flex-wrap">
                            {u.username && (
                              <span className="bg-slate-100 text-slate-800 px-1.5 py-0.2 rounded font-bold border border-slate-200">
                                @{u.username}
                              </span>
                            )}
                            <span>{u.email}</span>
                          </div>
                          <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400 mt-0.5">
                            {u.temporaryPin && (
                              <span>
                                PIN: <strong className="text-slate-600">{u.temporaryPin}</strong>
                              </span>
                            )}
                            <span>·</span>
                            <button
                              type="button"
                              onClick={() => {
                                setTargetUserForPassword(u);
                                setShowChangePasswordModal(true);
                              }}
                              title={`Nhấn để đổi mật khẩu cho ${u.fullName}`}
                              className="text-emerald-700 hover:text-emerald-900 font-bold bg-emerald-50 hover:bg-emerald-100 px-1.5 py-0.2 rounded border border-emerald-200 transition-colors inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Key className="w-2.5 h-2.5 text-emerald-600" />
                              <span>Pass: {u.password || '123'}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Role & Summary */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div>{getRoleBadge(u.role)}</div>
                      <div className="text-[11px] font-semibold text-emerald-800 mt-1">
                        {getUserPermissionSummary(u)}
                      </div>
                      {u.notes && (
                        <div className="text-[10px] text-slate-400 max-w-[160px] truncate" title={u.notes}>
                          {u.notes}
                        </div>
                      )}
                    </td>

                    {/* Tenant DB */}
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-800 truncate max-w-[170px]">
                        {assignedTenant?.orgName || u.currentTenantId}
                      </div>
                      <div className="text-[10px] font-mono text-emerald-700 truncate max-w-[170px]" title={assignedTenant?.schemaName}>
                        {assignedTenant?.schemaName || 'Schema riêng'}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {u.dbAccessType === 'isolated_new' ? 'Schema độc lập riêng' : 'Gán vào schema giải'}
                      </div>
                    </td>

                    {/* Database Access Status & Fast Grant/Revoke Button */}
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      {isDbGranted ? (
                        <button
                          onClick={() => handleToggleDbAccessStatus(u)}
                          title="Nhấn để tạm thu hồi quyền truy cập Database"
                          className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300 transition-colors"
                        >
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Đã Cấp DB
                        </button>
                      ) : (
                        <button
                          onClick={() => handleToggleDbAccessStatus(u)}
                          title="Nhấn để kích hoạt cấp quyền truy cập Database ngay"
                          className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 px-2 py-0.5 rounded border border-amber-300 transition-colors"
                        >
                          <Clock className="w-3 h-3 text-amber-600" />
                          Chờ Cấp DB
                        </button>
                      )}
                    </td>

                    {/* Permissions Badges */}
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {u.permissions && u.permissions.length > 0 ? (
                          u.permissions.map((p) => {
                            const found = allPermissionsList.find((item) => item.key === p);
                            const isSpecial = p === 'input_scores' || p === 'view_groups_brackets';
                            return (
                              <span
                                key={p}
                                className={`text-[10px] font-medium px-1.5 py-0.2 rounded border ${
                                  p === 'input_scores'
                                    ? 'bg-amber-50 text-amber-800 border-amber-200 font-semibold'
                                    : p === 'view_groups_brackets'
                                    ? 'bg-sky-50 text-sky-800 border-sky-200 font-semibold'
                                    : 'bg-slate-100 text-slate-600 border-slate-200'
                                }`}
                              >
                                {found?.label || p}
                              </span>
                            );
                          })
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">Không có quyền</span>
                        )}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onSwitchUserSession(u.id)}
                          title="Đăng nhập thử vai trò này để kiểm tra giới hạn quyền"
                          className="px-2 py-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded transition-colors"
                        >
                          Đóng vai
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(u)}
                          title="Sửa phân quyền & Database"
                          className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setTargetUserForPassword(u);
                            setShowChangePasswordModal(true);
                          }}
                          title={isCurrent ? 'Đổi mật khẩu tài khoản của bạn' : `Đổi mật khẩu cho ${u.fullName}`}
                          className="p-1 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(u)}
                          title={u.status === 'active' ? 'Khóa tài khoản' : 'Kích hoạt lại'}
                          className="p-1 text-slate-400 hover:text-amber-600 rounded transition-colors"
                        >
                          {u.status === 'active' ? (
                            <Lock className="w-3.5 h-3.5" />
                          ) : (
                            <Unlock className="w-3.5 h-3.5" />
                          )}
                        </button>
                        {!isCurrent && (
                          <button
                            onClick={() => handleDeleteUser(u.id)}
                            title="Xóa tài khoản"
                            className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Multi-Step Wizard Modal: Create/Edit User with Granular Permissions FIRST, then Database Allocation */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full p-6 space-y-5 max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {editingUser
                      ? 'Chỉnh Sửa Quyền & Database Tài Khoản'
                      : 'Quy Trình Tạo Mới & Phân Quyền Người Dùng'}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-mono">
                    Bước {wizardStep}/3: {wizardStep === 1 ? 'Thông Tin Tài Khoản' : wizardStep === 2 ? 'Phân Quyền Chi Tiết' : 'Cấp Quyền Database Riêng'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Stepper Progress Bar */}
            <div className="grid grid-cols-3 gap-2 pb-2">
              <button
                type="button"
                onClick={() => setWizardStep(1)}
                className={`py-1.5 px-2 rounded-lg text-left border transition-all ${
                  wizardStep === 1
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-800 font-bold'
                    : 'border-slate-200 bg-slate-50 text-slate-600'
                }`}
              >
                <span className="text-[10px] block font-mono">1. HỒ SƠ</span>
                <span className="text-xs truncate block font-semibold">Tài Khoản & PIN</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (formEmail && formFullName) setWizardStep(2);
                }}
                className={`py-1.5 px-2 rounded-lg text-left border transition-all ${
                  wizardStep === 2
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-800 font-bold'
                    : 'border-slate-200 bg-slate-50 text-slate-600'
                }`}
              >
                <span className="text-[10px] block font-mono">2. PHÂN QUYỀN</span>
                <span className="text-xs truncate block font-semibold">Nhập Điểm / Chỉ Xem</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (formEmail && formFullName) setWizardStep(3);
                }}
                className={`py-1.5 px-2 rounded-lg text-left border transition-all ${
                  wizardStep === 3
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-800 font-bold'
                    : 'border-slate-200 bg-slate-50 text-slate-600'
                }`}
              >
                <span className="text-[10px] block font-mono">3. DATABASE</span>
                <span className="text-xs truncate block font-semibold">Cấp Quyền Schema</span>
              </button>
            </div>

            <form onSubmit={handleSubmitUser} className="space-y-4 text-xs">
              {/* STEP 1: Basic Info & Credentials */}
              {wizardStep === 1 && (
                <div className="space-y-3.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Họ & Tên Người Dùng *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="VD: Lê Văn Quang (Trọng tài)"
                        value={formFullName}
                        onChange={(e) => setFormFullName(e.target.value)}
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
                        placeholder="referee.quang@pball.vn"
                        value={formEmail}
                        onChange={(e) => setFormEmail(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Mật Khẩu (Mặc định: 123)
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="123"
                        value={formPassword}
                        onChange={(e) => setFormPassword(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-center text-emerald-800"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Mã PIN Nhanh
                      </label>
                      <input
                        type="text"
                        maxLength={6}
                        placeholder="VD: 8866"
                        value={formTemporaryPin}
                        onChange={(e) => setFormTemporaryPin(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-center"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Vai Trò Khởi Điểm
                      </label>
                      <select
                        value={formRole}
                        onChange={(e) => setFormRole(e.target.value as UserRole)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-medium"
                      >
                        <option value="referee">Trọng Tài / Thư Ký (Chỉ nhập điểm)</option>
                        <option value="viewer">Khách Xem / Báo Chí (Chỉ xem)</option>
                        <option value="coordinator">Điều Phối Viên Sân Đấu</option>
                        <option value="organizer">Trưởng Ban Tổ Chức (BTC)</option>
                        <option value="super_admin">Super Admin (Tối cao)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Gói Dịch Vụ
                      </label>
                      <select
                        value={formPlan}
                        onChange={(e) => setFormPlan(e.target.value as 'Starter' | 'Pro' | 'Enterprise')}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                      >
                        <option value="Starter">Starter (Cơ bản)</option>
                        <option value="Pro">Pro (Chuẩn)</option>
                        <option value="Enterprise">Enterprise (VIP)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Ghi Chú Phân Công Nhiệm Vụ
                    </label>
                    <input
                      type="text"
                      placeholder="VD: Trọng tài điều khiển Sân 1 và Sân 2 trung tâm"
                      value={formNotes}
                      onChange={(e) => setFormNotes(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white"
                    />
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      disabled={!formEmail || !formFullName}
                      onClick={() => setWizardStep(2)}
                      className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors"
                    >
                      <span>Tiếp Tục: Phân Quyền Chi Tiết</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: Granular Permissions Configuration FIRST */}
              {wizardStep === 2 && (
                <div className="space-y-4">
                  {/* Quick Preset Buttons */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wide block">
                      ÁP DỤNG NHANH GÓI QUYỀN HẠN PHỔ BIẾN
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <button
                        type="button"
                        onClick={applyPresetRefereeOnly}
                        className={`p-2 rounded-lg border text-left transition-colors ${
                          formRole === 'referee' && formPermissions.includes('input_scores') && !formPermissions.includes('manage_tournaments')
                            ? 'bg-amber-50 border-amber-300 font-bold text-amber-900'
                            : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <span className="text-xs block">🎾 Chỉ Nhập Tỷ Số</span>
                        <span className="text-[10px] text-slate-400 font-normal">Trọng tài sân</span>
                      </button>

                      <button
                        type="button"
                        onClick={applyPresetViewerOnly}
                        className={`p-2 rounded-lg border text-left transition-colors ${
                          formRole === 'viewer'
                            ? 'bg-sky-50 border-sky-300 font-bold text-sky-900'
                            : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <span className="text-xs block">👁️ Chỉ Xem Bảng Đấu</span>
                        <span className="text-[10px] text-slate-400 font-normal">Khách / Livestream</span>
                      </button>

                      <button
                        type="button"
                        onClick={applyPresetCoordinator}
                        className={`p-2 rounded-lg border text-left transition-colors ${
                          formRole === 'coordinator'
                            ? 'bg-emerald-50 border-emerald-300 font-bold text-emerald-900'
                            : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <span className="text-xs block">📋 Điều Phối Viên</span>
                        <span className="text-[10px] text-slate-400 font-normal">VĐV & Lịch đấu</span>
                      </button>

                      <button
                        type="button"
                        onClick={applyPresetFullOrganizer}
                        className={`p-2 rounded-lg border text-left transition-colors ${
                          formRole === 'organizer'
                            ? 'bg-purple-50 border-purple-300 font-bold text-purple-900'
                            : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <span className="text-xs block">🏆 Toàn Quyền BTC</span>
                        <span className="text-[10px] text-slate-400 font-normal">Quản lý toàn bộ</span>
                      </button>
                    </div>
                  </div>

                  {/* Detailed Permissions Checkbox Grid */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-slate-900">
                        DANH MỤC PHÂN QUYỀN THAO TÁC CỦA TÀI KHOẢN ({formPermissions.length} QUYỀN ĐƯỢC CHỌN)
                      </label>
                      <span className="text-[11px] text-slate-500">
                        Tích chọn quyền cụ thể cho user
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
                      {allPermissionsList.map((p) => {
                        const isChecked = formPermissions.includes(p.key);
                        return (
                          <label
                            key={p.key}
                            className={`p-2.5 rounded-lg border flex items-start gap-2.5 cursor-pointer transition-colors ${
                              isChecked
                                ? 'bg-emerald-50/50 border-emerald-300'
                                : 'bg-white border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleTogglePermission(p.key)}
                              className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 mt-0.5"
                            />
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-semibold text-slate-900 block text-xs">
                                  {p.label}
                                </span>
                                <span className="text-[9px] font-mono text-slate-500 bg-slate-100 px-1 rounded">
                                  {p.category}
                                </span>
                              </div>
                              <span className="text-[10px] text-slate-500 block leading-tight mt-0.5">
                                {p.desc}
                              </span>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setWizardStep(1)}
                      className="flex items-center gap-1 text-slate-600 hover:text-slate-900 font-semibold"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Quay lại Bước 1</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setWizardStep(3)}
                      className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-colors"
                    >
                      <span>Tiếp Tục: Cấp Quyền Database Riêng</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: Database Provisioning & Access Rights */}
              {wizardStep === 3 && (
                <div className="space-y-4">
                  {/* Database Access Status Option */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <label className="font-bold text-slate-800 block text-xs">
                      TRẠNG THÁI CẤP QUYỀN TRUY CẬP DATABASE
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <label
                        className={`p-3 rounded-lg border cursor-pointer flex items-center gap-2.5 transition-colors ${
                          formDbAccessStatus === 'granted'
                            ? 'bg-emerald-50/70 border-emerald-400 font-semibold text-emerald-950'
                            : 'bg-white border-slate-200'
                        }`}
                      >
                        <input
                          type="radio"
                          name="dbAccessStatus"
                          checked={formDbAccessStatus === 'granted'}
                          onChange={() => setFormDbAccessStatus('granted')}
                          className="w-4 h-4 text-emerald-600"
                        />
                        <div>
                          <div className="flex items-center gap-1 text-emerald-700 font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Cấp Quyền Truy Cập Ngay (Active)</span>
                          </div>
                          <span className="text-[10px] text-slate-500 block font-normal">
                            User có thể kết nối và thực thi các quyền đã cấp ngay lập tức
                          </span>
                        </div>
                      </label>

                      <label
                        className={`p-3 rounded-lg border cursor-pointer flex items-center gap-2.5 transition-colors ${
                          formDbAccessStatus === 'pending'
                            ? 'bg-amber-50/70 border-amber-400 font-semibold text-amber-950'
                            : 'bg-white border-slate-200'
                        }`}
                      >
                        <input
                          type="radio"
                          name="dbAccessStatus"
                          checked={formDbAccessStatus === 'pending'}
                          onChange={() => setFormDbAccessStatus('pending')}
                          className="w-4 h-4 text-amber-600"
                        />
                        <div>
                          <div className="flex items-center gap-1 text-amber-700 font-bold">
                            <Clock className="w-3.5 h-3.5" />
                            <span>Tạm Giữ Chờ Phê Duyệt (Pending)</span>
                          </div>
                          <span className="text-[10px] text-slate-500 block font-normal">
                            Tạo tài khoản trước, chỉ cấp quyền truy cập DB sau khi Admin duyệt
                          </span>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Isolated Schema vs Existing Schema */}
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                    <label className="font-bold text-slate-800 block text-xs">
                      PHƯƠNG THỨC GÁN DATABASE RIÊNG (TENANT DB)
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <label
                        className={`p-3 rounded-lg border cursor-pointer flex items-center gap-2.5 transition-colors ${
                          formDbAccessType === 'assigned_existing'
                            ? 'bg-emerald-50/70 border-emerald-400 font-semibold text-emerald-950'
                            : 'bg-white border-slate-200'
                        }`}
                      >
                        <input
                          type="radio"
                          name="dbAccessType"
                          checked={formDbAccessType === 'assigned_existing'}
                          onChange={() => setFormDbAccessType('assigned_existing')}
                          className="w-4 h-4 text-emerald-600"
                        />
                        <div>
                          <span className="font-bold block text-xs">Gán Vào Database Có Sẵn</span>
                          <span className="text-[10px] text-slate-500 block font-normal">
                            Thích hợp cho Trọng tài, Điều phối viên, Ban giám sát
                          </span>
                        </div>
                      </label>

                      <label
                        className={`p-3 rounded-lg border cursor-pointer flex items-center gap-2.5 transition-colors ${
                          formDbAccessType === 'isolated_new'
                            ? 'bg-emerald-50/70 border-emerald-400 font-semibold text-emerald-950'
                            : 'bg-white border-slate-200'
                        }`}
                      >
                        <input
                          type="radio"
                          name="dbAccessType"
                          checked={formDbAccessType === 'isolated_new'}
                          onChange={() => setFormDbAccessType('isolated_new')}
                          className="w-4 h-4 text-emerald-600"
                        />
                        <div>
                          <span className="font-bold block text-xs">Tạo Schema DB Riêng Biệt Mới</span>
                          <span className="text-[10px] text-slate-500 block font-normal">
                            Cấp phát 1 Database cô lập 100% cho tổ chức BTC mới
                          </span>
                        </div>
                      </label>
                    </div>

                    {formDbAccessType === 'isolated_new' ? (
                      <div className="mt-2 pt-2 border-t border-slate-200 space-y-2">
                        <label className="block font-semibold text-slate-700">
                          Tên Câu Lạc Bộ / Giải Đấu Mới (Chủ Sở Hữu DB) *
                        </label>
                        <input
                          type="text"
                          required={formDbAccessType === 'isolated_new'}
                          placeholder="VD: CLB Pickleball Bình Dương Championship"
                          value={newOrgName}
                          onChange={(e) => setNewOrgName(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                        <p className="text-[10px] text-slate-500 font-mono">
                          Hệ thống Master Server sẽ tự động chạy lệnh DDL khởi tạo schema độc lập và cấu hình connection string riêng biệt cho user này.
                        </p>
                      </div>
                    ) : (
                      <div className="mt-2 pt-2 border-t border-slate-200 space-y-2">
                        <label className="block font-semibold text-slate-700">
                          Chọn Database Giải Đấu Gán Cho User
                        </label>
                        <select
                          value={formCurrentTenantId}
                          onChange={(e) => setFormCurrentTenantId(e.target.value)}
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
                  </div>

                  {/* Summary of Configuration */}
                  <div className="p-3 bg-slate-100 rounded-xl text-[11px] text-slate-700 space-y-1">
                    <span className="font-bold block text-slate-900">TỔNG KẾT THIẾT LẬP:</span>
                    <div>• Họ tên & Email: <strong>{formFullName}</strong> ({formEmail})</div>
                    <div>• Vai trò & Quyền: <strong>{formRole}</strong> ({getUserPermissionSummary({ role: formRole, permissions: formPermissions } as MasterUser)})</div>
                    <div>• Quyền DB: <strong>{formDbAccessStatus === 'granted' ? 'Kích hoạt ngay' : 'Tạm giữ chờ duyệt'}</strong></div>
                  </div>

                  {/* Wizard Bottom Buttons */}
                  <div className="pt-2 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setWizardStep(2)}
                      className="flex items-center gap-1 text-slate-600 hover:text-slate-900 font-semibold"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Quay lại Bước 2</span>
                    </button>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setShowCreateModal(false)}
                        className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                      >
                        Hủy
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-lg shadow-sm transition-colors"
                      >
                        {editingUser ? 'Lưu Phân Quyền & DB' : 'Xác Nhận Tạo & Cấp Quyền'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {/* Permission Matrix Guide Modal */}
      {showMatrixModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-3xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Ma Trận Phân Quyền Chi Tiết (RBAC Matrix)
                </h3>
              </div>
              <button
                onClick={() => setShowMatrixModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse border border-slate-200">
                <thead className="bg-slate-50 text-slate-700 font-bold">
                  <tr>
                    <th className="border border-slate-200 p-2.5">Quyền Hạn Nghiệp Vụ</th>
                    <th className="border border-slate-200 p-2.5 text-center text-amber-700">Chỉ Nhập Tỷ Số</th>
                    <th className="border border-slate-200 p-2.5 text-center text-sky-700">Chỉ Xem Bảng</th>
                    <th className="border border-slate-200 p-2.5 text-center text-emerald-700">Điều Phối Viên</th>
                    <th className="border border-slate-200 p-2.5 text-center text-purple-700">Trưởng BTC</th>
                    <th className="border border-slate-200 p-2.5 text-center text-rose-700">Super Admin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="border border-slate-200 p-2.5 font-medium">Nhập & Sửa tỷ số trận đấu</td>
                    <td className="border border-slate-200 p-2.5 text-center text-emerald-600 font-bold">✓ (Toàn quyền)</td>
                    <td className="border border-slate-200 p-2.5 text-center text-slate-300">✗ (Khóa)</td>
                    <td className="border border-slate-200 p-2.5 text-center text-emerald-600 font-bold">✓</td>
                    <td className="border border-slate-200 p-2.5 text-center text-emerald-600 font-bold">✓</td>
                    <td className="border border-slate-200 p-2.5 text-center text-emerald-600 font-bold">✓</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-200 p-2.5 font-medium">Xem bảng đấu & nhánh Playoff</td>
                    <td className="border border-slate-200 p-2.5 text-center text-emerald-600 font-bold">✓</td>
                    <td className="border border-slate-200 p-2.5 text-center text-emerald-600 font-bold">✓ (Read-only)</td>
                    <td className="border border-slate-200 p-2.5 text-center text-emerald-600 font-bold">✓</td>
                    <td className="border border-slate-200 p-2.5 text-center text-emerald-600 font-bold">✓</td>
                    <td className="border border-slate-200 p-2.5 text-center text-emerald-600 font-bold">✓</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-200 p-2.5 font-medium">Xem bảng xếp hạng vòng bảng</td>
                    <td className="border border-slate-200 p-2.5 text-center text-slate-300">✗</td>
                    <td className="border border-slate-200 p-2.5 text-center text-emerald-600 font-bold">✓</td>
                    <td className="border border-slate-200 p-2.5 text-center text-emerald-600 font-bold">✓</td>
                    <td className="border border-slate-200 p-2.5 text-center text-emerald-600 font-bold">✓</td>
                    <td className="border border-slate-200 p-2.5 text-center text-emerald-600 font-bold">✓</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-200 p-2.5 font-medium">In biên bản trọng tài A4</td>
                    <td className="border border-slate-200 p-2.5 text-center text-emerald-600 font-bold">✓</td>
                    <td className="border border-slate-200 p-2.5 text-center text-slate-300">✗</td>
                    <td className="border border-slate-200 p-2.5 text-center text-emerald-600 font-bold">✓</td>
                    <td className="border border-slate-200 p-2.5 text-center text-emerald-600 font-bold">✓</td>
                    <td className="border border-slate-200 p-2.5 text-center text-emerald-600 font-bold">✓</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-200 p-2.5 font-medium">Upload Excel & quản lý VĐV</td>
                    <td className="border border-slate-200 p-2.5 text-center text-slate-300">✗ (Khóa)</td>
                    <td className="border border-slate-200 p-2.5 text-center text-slate-300">✗ (Khóa)</td>
                    <td className="border border-slate-200 p-2.5 text-center text-emerald-600 font-bold">✓</td>
                    <td className="border border-slate-200 p-2.5 text-center text-emerald-600 font-bold">✓</td>
                    <td className="border border-slate-200 p-2.5 text-center text-emerald-600 font-bold">✓</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-200 p-2.5 font-medium">Bốc thăm & lập lịch thi đấu</td>
                    <td className="border border-slate-200 p-2.5 text-center text-slate-300">✗ (Khóa)</td>
                    <td className="border border-slate-200 p-2.5 text-center text-slate-300">✗ (Khóa)</td>
                    <td className="border border-slate-200 p-2.5 text-center text-emerald-600 font-bold">✓</td>
                    <td className="border border-slate-200 p-2.5 text-center text-emerald-600 font-bold">✓</td>
                    <td className="border border-slate-200 p-2.5 text-center text-emerald-600 font-bold">✓</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-200 p-2.5 font-medium">Tạo giải & sửa thể thức</td>
                    <td className="border border-slate-200 p-2.5 text-center text-slate-300">✗</td>
                    <td className="border border-slate-200 p-2.5 text-center text-slate-300">✗</td>
                    <td className="border border-slate-200 p-2.5 text-center text-slate-300">✗</td>
                    <td className="border border-slate-200 p-2.5 text-center text-emerald-600 font-bold">✓ (Tenant DB)</td>
                    <td className="border border-slate-200 p-2.5 text-center text-emerald-600 font-bold">✓ (Tất cả)</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-200 p-2.5 font-medium">Sao lưu & Xuất SQL Database</td>
                    <td className="border border-slate-200 p-2.5 text-center text-slate-300">✗</td>
                    <td className="border border-slate-200 p-2.5 text-center text-slate-300">✗</td>
                    <td className="border border-slate-200 p-2.5 text-center text-slate-300">✗</td>
                    <td className="border border-slate-200 p-2.5 text-center text-emerald-600 font-bold">✓</td>
                    <td className="border border-slate-200 p-2.5 text-center text-emerald-600 font-bold">✓</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-200 p-2.5 font-medium">Cấp phát DB & Phân quyền User</td>
                    <td className="border border-slate-200 p-2.5 text-center text-slate-300">✗</td>
                    <td className="border border-slate-200 p-2.5 text-center text-slate-300">✗</td>
                    <td className="border border-slate-200 p-2.5 text-center text-slate-300">✗</td>
                    <td className="border border-slate-200 p-2.5 text-center text-slate-300">✗</td>
                    <td className="border border-slate-200 p-2.5 text-center text-emerald-600 font-bold">✓ (Toàn quyền)</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setShowMatrixModal(false)}
                className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal (For admin self or subordinate accounts) */}
      {showChangePasswordModal && targetUserForPassword && (
        <ChangePasswordModal
          isOpen={showChangePasswordModal}
          targetUser={targetUserForPassword}
          currentUser={currentUser}
          onClose={() => {
            setShowChangePasswordModal(false);
            setTargetUserForPassword(null);
          }}
          onPasswordChanged={(updatedUser) => {
            setUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
            if (currentUser.id === updatedUser.id) {
              onUserChanged(updatedUser);
            }
          }}
        />
      )}
    </div>
  );
};
