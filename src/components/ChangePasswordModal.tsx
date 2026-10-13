import React, { useState } from 'react';
import {
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  X,
  RotateCcw,
  Sparkles,
  Copy,
  Check,
  ShieldAlert,
} from 'lucide-react';
import { MasterUser } from '../types/tournament';
import { MasterDb } from '../services/storage';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  // If targetUser is provided and differs from currentUser, it's admin changing subordinate's password
  targetUser: MasterUser;
  currentUser: MasterUser;
  onPasswordChanged: (updatedUser: MasterUser) => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  isOpen,
  onClose,
  targetUser,
  currentUser,
  onPasswordChanged,
}) => {
  const isSelf = targetUser.id === currentUser.id;
  const isAdminManagingSub = !isSelf && (currentUser.role === 'super_admin' || currentUser.role === 'organizer');

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [newPin, setNewPin] = useState(targetUser.temporaryPin || '1234');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [copiedSlip, setCopiedSlip] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleQuickReset123 = () => {
    setNewPassword('123');
    setConfirmPassword('123');
    setNewPin('1234');
    setErrorMessage(null);
  };

  const handleGenerateRandomPassword = () => {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const generated = `Pickle@${randomNum}`;
    setNewPassword(generated);
    setConfirmPassword(generated);
    setNewPin(String(randomNum));
    setErrorMessage(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanNew = newPassword.trim();
    if (!cleanNew) {
      setErrorMessage('Vui lòng nhập mật khẩu mới.');
      return;
    }

    if (cleanNew.length < 3) {
      setErrorMessage('Mật khẩu mới phải có ít nhất 3 ký tự.');
      return;
    }

    if (cleanNew !== confirmPassword.trim()) {
      setErrorMessage('Mật khẩu xác nhận không trùng khớp với mật khẩu mới.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = MasterDb.changeUserPassword(
        targetUser.id,
        cleanNew,
        isSelf ? oldPassword : undefined,
        !isSelf, // forceByAdmin
        newPin.trim() || undefined
      );

      if (!res.success) {
        setErrorMessage(res.message);
        setIsSubmitting(false);
        return;
      }

      setSuccessMessage(res.message);
      if (res.updatedUser) {
        onPasswordChanged(res.updatedUser);
      }

      // If self change, close after a moment
      if (isSelf) {
        setTimeout(() => {
          onClose();
        }, 1500);
      }
    } catch {
      setErrorMessage('Đã xảy ra lỗi khi cập nhật mật khẩu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyNewCredentials = () => {
    const slip = `🔐 THÔNG TIN MẬT KHẨU MỚI:
Họ tên: ${targetUser.fullName}
Tên đăng nhập: ${targetUser.username || targetUser.email}
Email: ${targetUser.email}
Mật khẩu mới: ${newPassword}
Mã PIN nhanh: ${newPin}
Thời gian đổi: ${new Date().toLocaleString('vi-VN')}`;

    navigator.clipboard.writeText(slip);
    setCopiedSlip(true);
    setTimeout(() => setCopiedSlip(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              isAdminManagingSub ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
            }`}>
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {isSelf ? 'Đổi Mật Khẩu Cá Nhân' : 'Đổi Mật Khẩu Tài Khoản Cấp Dưới'}
              </h3>
              <p className="text-[11px] text-slate-500 font-mono">
                {isSelf
                  ? 'Bảo mật tài khoản quản trị của bạn'
                  : `Cập nhật mật khẩu cho: ${targetUser.fullName}`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Card info */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 flex items-center justify-between text-xs">
          <div className="space-y-0.5">
            <div className="font-bold text-slate-900 flex items-center gap-2">
              <span>{targetUser.fullName}</span>
              {isSelf && (
                <span className="text-[10px] font-mono bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-semibold">
                  Tài khoản của bạn
                </span>
              )}
            </div>
            <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1.5">
              {targetUser.username && (
                <span className="bg-white px-1.5 py-0.5 rounded border border-slate-200 font-bold text-slate-700">
                  @{targetUser.username}
                </span>
              )}
              <span>{targetUser.email}</span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-700 uppercase">
              {targetUser.role}
            </span>
            <div className="text-[10px] text-slate-400 mt-1 font-mono">
              Hiện tại: {targetUser.password || '123'}
            </div>
          </div>
        </div>

        {/* Feedback Messages */}
        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex-1 font-medium">{errorMessage}</div>
          </div>
        )}

        {successMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs space-y-2">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
              <div className="font-semibold">{successMessage}</div>
            </div>
            {isAdminManagingSub && (
              <div className="pt-2 border-t border-emerald-200/80 flex items-center justify-between">
                <span className="text-[11px] text-emerald-700">
                  Mật khẩu mới: <strong className="font-mono text-emerald-900 font-bold">{newPassword}</strong>
                </span>
                <button
                  type="button"
                  onClick={handleCopyNewCredentials}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-xs"
                >
                  {copiedSlip ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Đã sao chép!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Sao chép thông tin</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Admin Quick Action Helper for Subordinates */}
        {isAdminManagingSub && !successMessage && (
          <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3 text-xs space-y-2">
            <div className="flex items-center gap-1.5 font-semibold text-amber-900">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Thao tác nhanh cho Quản trị viên:</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleQuickReset123}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-lg font-medium transition-colors text-[11px]"
              >
                <RotateCcw className="w-3 h-3 text-amber-600" />
                <span>Đặt lại về mặc định (123)</span>
              </button>
              <button
                type="button"
                onClick={handleGenerateRandomPassword}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-lg font-medium transition-colors text-[11px]"
              >
                <Sparkles className="w-3 h-3 text-amber-600" />
                <span>Tạo ngẫu nhiên (Pickle@xxxx)</span>
              </button>
            </div>
          </div>
        )}

        {/* Change Password Form */}
        {!successMessage && (
          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
            {/* Old password (only for self) */}
            {isSelf && (
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Mật Khẩu Hiện Tại *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Nhập mật khẩu hiện tại (mặc định: 123)"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    className="w-full pl-8 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 mt-1 font-mono">
                  Gợi ý: Mật khẩu mặc định hệ thống ban đầu là 123
                </p>
              </div>
            )}

            {/* New Password */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-slate-700">
                  Mật Khẩu Mới *
                </label>
                <span className="text-[10px] text-slate-400 font-mono">Tối thiểu 3 ký tự</span>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Nhập mật khẩu mới"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-8 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono font-bold text-slate-800"
                />
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Xác Nhận Mật Khẩu Mới *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Nhập lại mật khẩu mới"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono font-bold text-slate-800"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
              </div>
            </div>

            {/* Optional PIN */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-slate-700">
                  Mã PIN Nhanh (Tùy chọn)
                </label>
                <span className="text-[10px] text-slate-400 font-mono">Mã số 4-6 số mở khóa nhanh</span>
              </div>
              <input
                type="text"
                maxLength={6}
                placeholder="VD: 1234"
                value={newPin}
                onChange={(e) => setNewPin(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-slate-700 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            {/* Admin Note if resetting sub-account */}
            {isAdminManagingSub && (
              <div className="text-[11px] text-slate-500 bg-slate-100 p-2.5 rounded-lg flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  Bạn đang đổi mật khẩu với tư cách Quản trị viên cấp cao. Người dùng cấp dưới sẽ dùng mật khẩu mới này để đăng nhập ngay sau khi lưu.
                </span>
              </div>
            )}

            {/* Actions */}
            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white rounded-lg shadow-sm transition-colors ${
                  isAdminManagingSub
                    ? 'bg-amber-600 hover:bg-amber-700'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Đang lưu...' : 'Lưu Mật Khẩu Mới'}</span>
              </button>
            </div>
          </form>
        )}

        {/* If success, close button */}
        {successMessage && (
          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors"
            >
              Đóng Cửa Sổ
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
