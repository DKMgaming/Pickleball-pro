import React, { useState } from 'react';
import {
  Database,
  Server,
  Download,
  Upload,
  RefreshCw,
  Plus,
  ShieldCheck,
  Check,
  FileCode,
  Layers,
  HardDrive
} from 'lucide-react';
import { MasterUser, Tenant, TenantDatabase } from '../types/tournament.ts';
import { MasterDb, TenantDb } from '../services/storage.ts';

interface TenantDbInspectorModalProps {
  activeTenant: Tenant;
  onSwitchTenant: (tenantId: string) => void;
  onDatabaseChanged: () => void;
}

export const TenantDbInspectorModal: React.FC<TenantDbInspectorModalProps> = ({
  activeTenant,
  onSwitchTenant,
  onDatabaseChanged,
}) => {
  const [activeTab, setActiveTab] = useState<'tenant' | 'master' | 'sql'>('tenant');
  const [showNewTenantForm, setShowNewTenantForm] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserName, setNewUserName] = useState('');

  const users = MasterDb.getUsers();
  const tenants = MasterDb.getTenants();
  const tenantDb = TenantDb.getDatabase(activeTenant.id);

  // Export JSON
  const handleExportJson = () => {
    const jsonStr = TenantDb.exportAsJson(activeTenant.id);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_${activeTenant.slug}_db_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export SQL
  const handleExportSql = () => {
    const sqlStr = TenantDb.exportAsSql(activeTenant.id);
    const blob = new Blob([sqlStr], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `schema_${activeTenant.slug}_postgresql.sql`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Create new tenant organization
  const handleCreateTenant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrgName || !newUserEmail || !newUserName) return;

    const created = MasterDb.createTenant(newOrgName, newUserEmail, newUserName);
    onSwitchTenant(created.id);
    setShowNewTenantForm(false);
    setNewOrgName('');
    setNewUserEmail('');
    setNewUserName('');
    onDatabaseChanged();
  };

  // Reset tenant DB
  const handleResetDb = () => {
    if (confirm(`Bạn có chắc muốn khôi phục dữ liệu gốc cho ${activeTenant.orgName}?`)) {
      TenantDb.resetDatabase(activeTenant.id);
      onDatabaseChanged();
    }
  };

  const sqlDdl = TenantDb.exportAsSql(activeTenant.id);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight text-slate-900">
              Kiến Trúc Multi-Tenant & Quản Trị Database Riêng
            </h2>
            <span className="text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded">
              ISOLATED SCHEMA
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Mỗi Ban Tổ Chức (User) sở hữu một Database / Schema hoàn toàn độc lập · Bảo mật tuyệt đối
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowNewTenantForm(!showNewTenantForm)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-2xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tạo Tài Khoản / BTC Mới</span>
          </button>
        </div>
      </div>

      {/* New Tenant Creation Form */}
      {showNewTenantForm && (
        <div className="bg-white border-2 border-emerald-500/30 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">
              Khởi Tạo Tenant Database Độc Lập Cho Tổ Chức Mới
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              PostgreSQL Isolated Schema Auto-Provision
            </span>
          </div>

          <form onSubmit={handleCreateTenant} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tên Câu Lạc Bộ / BTC Giải *
              </label>
              <input
                type="text"
                required
                placeholder="VD: CLB Pickleball Đà Nẵng"
                value={newOrgName}
                onChange={(e) => setNewOrgName(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Họ & Tên Người Quản Trị *
              </label>
              <input
                type="text"
                required
                placeholder="VD: Hoàng Minh Đức"
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email Đăng Nhập (Tài khoản) *
              </label>
              <input
                type="email"
                required
                placeholder="admin@danangpickleball.vn"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
              />
            </div>

            <div className="sm:col-span-3 flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowNewTenantForm(false)}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm"
              >
                Kích Hoạt Database Tenant Mới
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tenant Context Selector Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {tenants.map((t) => {
          const isActive = t.id === activeTenant.id;
          return (
            <button
              key={t.id}
              onClick={() => onSwitchTenant(t.id)}
              className={`p-4 rounded-xl border text-left transition-all relative ${
                isActive
                  ? 'border-emerald-500 bg-emerald-50/20 ring-1 ring-emerald-500 shadow-xs'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-900 truncate pr-2">
                  {t.orgName}
                </span>
                {isActive && (
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3" />
                  </span>
                )}
              </div>
              <div className="text-[11px] font-mono text-slate-500 truncate mb-1">
                Schema: <strong className="text-slate-700">{t.schemaName}</strong>
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mt-2 pt-2 border-t border-slate-100">
                <span>Dung lượng: {(t.storageBytes / 1024).toFixed(1)} KB</span>
                <span className="text-emerald-600">Đang hoạt động</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Segmented Tab Controls */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg max-w-fit">
        <button
          onClick={() => setActiveTab('tenant')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
            activeTab === 'tenant'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Database className="w-3.5 h-3.5 text-emerald-600" />
          <span>Tenant DB ({activeTenant.orgName})</span>
        </button>

        <button
          onClick={() => setActiveTab('master')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
            activeTab === 'master'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Server className="w-3.5 h-3.5 text-sky-600" />
          <span>Master Server Database</span>
        </button>

        <button
          onClick={() => setActiveTab('sql')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
            activeTab === 'sql'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileCode className="w-3.5 h-3.5 text-amber-600" />
          <span>PostgreSQL DDL Export</span>
        </button>
      </div>

      {/* Tab 1: Current Active Tenant Database Details */}
      {activeTab === 'tenant' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-slate-100 gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Thông Số Schema & Cơ Sở Dữ Liệu Tenant Hiện Tại
                </h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  URI: {activeTenant.dbConnectionString}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportJson}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Sao Lưu (.json)</span>
                </button>
                <button
                  onClick={handleExportSql}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-sky-600" />
                  <span>Xuất SQL (.sql)</span>
                </button>
                <button
                  onClick={handleResetDb}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors"
                  title="Khôi phục lại dữ liệu mẫu ban đầu"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Reset DB</span>
                </button>
              </div>
            </div>

            {/* Entity counts summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-[11px] font-semibold text-slate-500 block">Tournaments</span>
                <span className="text-xl font-bold font-mono text-slate-900">
                  {tenantDb.tournaments.length}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-[11px] font-semibold text-slate-500 block">Teams / Players</span>
                <span className="text-xl font-bold font-mono text-slate-900">
                  {tenantDb.teams.length}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-[11px] font-semibold text-slate-500 block">Bảng Đấu (Groups)</span>
                <span className="text-xl font-bold font-mono text-slate-900">
                  {tenantDb.groups.length}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-[11px] font-semibold text-slate-500 block">Trận Đấu (Matches)</span>
                <span className="text-xl font-bold font-mono text-slate-900">
                  {tenantDb.matches.length}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Master Server Database (Users & Tenants) */}
      {activeTab === 'master' && (
        <div className="space-y-6">
          {/* Master Tenants Table */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
            <div className="p-4 bg-slate-50/60 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 uppercase font-mono">
                BẢNG MASTER_TENANTS ({tenants.length} TỔ CHỨC ĐÃ CẤP PHÁT)
              </h3>
              <span className="text-[11px] text-slate-500 font-mono">PostgreSQL Tenant Registry</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-2.5">Tenant ID</th>
                    <th className="px-4 py-2.5">Tên Tổ Chức (BTC)</th>
                    <th className="px-4 py-2.5 font-mono">Schema Name</th>
                    <th className="px-4 py-2.5 font-mono">Connection String</th>
                    <th className="px-4 py-2.5 text-right font-mono">Storage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {tenants.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50">
                      <td className="px-4 py-2.5 font-bold text-slate-900">{t.id}</td>
                      <td className="px-4 py-2.5 font-sans font-semibold text-slate-800">{t.orgName}</td>
                      <td className="px-4 py-2.5 text-emerald-700 font-semibold">{t.schemaName}</td>
                      <td className="px-4 py-2.5 text-slate-500 max-w-[220px] truncate" title={t.dbConnectionString}>
                        {t.dbConnectionString}
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums">
                        {(t.storageBytes / 1024).toFixed(1)} KB
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Master Users Table */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
            <div className="p-4 bg-slate-50/60 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 uppercase font-mono">
                BẢNG MASTER_USERS ({users.length} TÀI KHOẢN QUẢN TRỊ)
              </h3>
              <span className="text-[11px] text-slate-500 font-mono">Auth & Role Control</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-2.5">User ID</th>
                    <th className="px-4 py-2.5">Họ & Tên</th>
                    <th className="px-4 py-2.5">Email</th>
                    <th className="px-4 py-2.5">Gói Dịch Vụ</th>
                    <th className="px-4 py-2.5">Tenant Liên Kết</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50">
                      <td className="px-4 py-2.5 font-mono text-slate-500">{u.id}</td>
                      <td className="px-4 py-2.5 font-semibold text-slate-900">{u.fullName}</td>
                      <td className="px-4 py-2.5 font-mono text-slate-600">{u.email}</td>
                      <td className="px-4 py-2.5">
                        <span className="font-mono text-[10px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                          {u.plan}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 font-mono text-emerald-700">{u.currentTenantId}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Generated PostgreSQL DDL Script */}
      {activeTab === 'sql' && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold font-mono text-slate-700">
              SCHEMA DDL CHO TENANT: {activeTenant.schemaName}
            </span>
            <button
              onClick={handleExportSql}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Tải File SQL</span>
            </button>
          </div>
          <pre className="bg-slate-900 text-slate-100 p-4 rounded-xl text-xs font-mono overflow-x-auto max-h-96 leading-relaxed">
            {sqlDdl}
          </pre>
        </div>
      )}
    </div>
  );
};
