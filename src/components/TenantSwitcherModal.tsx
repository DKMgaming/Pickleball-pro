import React, { useState } from 'react';
import { X, Database, Check, Plus, Server, HardDrive, Key } from 'lucide-react';
import { Tenant } from '../types/tournament.ts';
import { MasterDb } from '../services/storage.ts';

interface TenantSwitcherModalProps {
  activeTenant: Tenant;
  onSelectTenant: (tenantId: string) => void;
  onOpenNewTenant: () => void;
  onClose: () => void;
}

export const TenantSwitcherModal: React.FC<TenantSwitcherModalProps> = ({
  activeTenant,
  onSelectTenant,
  onOpenNewTenant,
  onClose,
}) => {
  const tenants = MasterDb.getTenants();

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-emerald-600" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Chọn Tổ Chức & Database Tenant
              </h3>
              <p className="text-[11px] text-slate-500 font-mono">
                Cơ chế isolated schema - Dữ liệu độc lập 100%
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2.5 max-h-72 overflow-y-auto">
          {tenants.map((t) => {
            const isSelected = t.id === activeTenant.id;
            return (
              <button
                key={t.id}
                onClick={() => {
                  onSelectTenant(t.id);
                  onClose();
                }}
                className={`w-full p-3.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                  isSelected
                    ? 'border-emerald-500 bg-emerald-50/30 ring-1 ring-emerald-500'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="truncate pr-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 truncate">
                      {t.orgName}
                    </span>
                    {isSelected && (
                      <span className="text-[10px] font-mono text-emerald-700 bg-emerald-100/80 px-1.5 py-0.2 rounded font-bold">
                        Đang chọn
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] font-mono text-slate-500 mt-0.5 truncate">
                    Schema: {t.schemaName}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono mt-1">
                    Dung lượng: {(t.storageBytes / 1024).toFixed(1)} KB
                  </div>
                </div>

                {isSelected ? (
                  <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                ) : (
                  <div className="text-xs text-slate-400 font-medium shrink-0">
                    Chuyển đến
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
          <button
            onClick={() => {
              onClose();
              onOpenNewTenant();
            }}
            className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm Tổ Chức / Tenant Mới</span>
          </button>

          <button
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
