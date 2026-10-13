import React, { useState, useRef } from 'react';
import {
  FileSpreadsheet,
  Download,
  Upload,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Trash2,
  Users,
  Search,
  Hash,
  X
} from 'lucide-react';
import { Team, Tournament } from '../types/tournament.ts';
import { ExcelService, ExcelImportResult } from '../services/excelService.ts';

interface TeamsExcelManagerProps {
  tournament: Tournament | null;
  teams: Team[];
  onSaveTeams: (newTeams: Team[]) => void;
  onUpdateTeam: (team: Team) => void;
  onDeleteTeam: (teamId: string) => void;
}

export const TeamsExcelManager: React.FC<TeamsExcelManagerProps> = ({
  tournament,
  teams,
  onSaveTeams,
  onUpdateTeam,
  onDeleteTeam,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [previewResult, setPreviewResult] = useState<ExcelImportResult | null>(null);
  const [previewFileName, setPreviewFileName] = useState('');
  const [showManualAddModal, setShowManualAddModal] = useState(false);

  // Manual team add form state
  const [manualCode, setManualCode] = useState('');
  const [manualPlayer1, setManualPlayer1] = useState('');
  const [manualPlayer2, setManualPlayer2] = useState('');
  const [manualSeed, setManualSeed] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const isSingles = tournament?.category === 'singles_men' || tournament?.category === 'singles_women';

  // Handle file upload
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !tournament) return;

    setIsUploading(true);
    setPreviewFileName(file.name);

    try {
      const result = await ExcelService.parseExcelFile(file, tournament.category);
      setPreviewResult(result);
    } catch (err: unknown) {
      alert((err as Error).message || 'Lỗi khi đọc file Excel');
      setPreviewResult(null);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Confirm and save previewed teams to Tenant DB
  const handleConfirmImport = () => {
    if (!previewResult || !tournament) return;

    const newTeamEntities: Team[] = previewResult.validTeams.map((item, index) => ({
      id: `team_${Date.now()}_${index}`,
      tournamentId: tournament.id,
      code: item.code,
      name: item.name,
      player1: item.player1,
      player2: item.player2,
      seed: item.seed,
      avatarColor: item.avatarColor,
    }));

    // Merge or replace
    onSaveTeams([...teams, ...newTeamEntities]);
    setPreviewResult(null);
  };

  // Manual Add submit
  const handleManualAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tournament || !manualCode || !manualPlayer1) return;

    const newTeam: Team = {
      id: `team_${Date.now()}`,
      tournamentId: tournament.id,
      code: manualCode.trim(),
      name: manualCode.trim(),
      player1: manualPlayer1.trim(),
      player2: isSingles ? undefined : manualPlayer2.trim() || undefined,
      seed: manualSeed ? parseInt(manualSeed, 10) : undefined,
      avatarColor: 'bg-emerald-600',
    };

    onSaveTeams([...teams, newTeam]);
    setShowManualAddModal(false);
    setManualCode('');
    setManualPlayer1('');
    setManualPlayer2('');
    setManualSeed('');
  };

  const filteredTeams = teams.filter((t) => {
    const q = searchTerm.toLowerCase();
    return (
      t.name.toLowerCase().includes(q) ||
      t.code.toLowerCase().includes(q) ||
      t.player1.toLowerCase().includes(q) ||
      (t.player2 && t.player2.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Quản Lý VĐV & Nhập Dữ Liệu Excel
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Tuân thủ cấu trúc chuẩn: Cột A (TenDoi) · Cột B (Player1) · Cột C (Player2)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Download Sample Template */}
          <button
            onClick={() => ExcelService.downloadTemplate(isSingles)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>Tải File Excel Mẫu (.xlsx)</span>
          </button>

          {/* Trigger Upload File */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-lg shadow-2xs transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>{isUploading ? 'Đang đọc...' : 'Tải Lên File Excel'}</span>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".xlsx, .xls, .csv"
            className="hidden"
          />

          {/* Manual Add Button */}
          <button
            onClick={() => setShowManualAddModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm Thủ Công</span>
          </button>
        </div>
      </div>

      {/* Excel Preview Modal / Alert Area */}
      {previewResult && (
        <div className="bg-white border-2 border-emerald-500/30 rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Xem Trước Dữ Liệu Excel: {previewFileName}
                </h3>
                <p className="text-xs text-slate-500">
                  Đã kiểm tra {previewResult.totalRows} dòng · Hợp lệ:{' '}
                  <span className="font-semibold text-emerald-600">{previewResult.validTeams.length}</span> đội
                </p>
              </div>
            </div>
            <button
              onClick={() => setPreviewResult(null)}
              className="text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Warnings or Errors */}
          {previewResult.errors.length > 0 && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-rose-700">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Phát hiện {previewResult.errors.length} lỗi định dạng:</span>
              </div>
              <ul className="list-disc pl-5 space-y-0.5">
                {previewResult.errors.slice(0, 5).map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {previewResult.warnings.length > 0 && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-amber-700">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Cảnh báo lưu ý:</span>
              </div>
              <ul className="list-disc pl-5 space-y-0.5">
                {previewResult.warnings.slice(0, 5).map((warn, i) => (
                  <li key={i}>{warn}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Valid preview rows */}
          <div className="overflow-x-auto border border-slate-200 rounded-lg max-h-60 overflow-y-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-slate-50 sticky top-0 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-3 py-2">STT</th>
                  <th className="px-3 py-2">Mã/Tên Đội (Cột A)</th>
                  <th className="px-3 py-2">VĐV 1 (Cột B)</th>
                  <th className="px-3 py-2">VĐV 2 (Cột C)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {previewResult.validTeams.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="px-3 py-1.5 font-mono text-slate-400">{idx + 1}</td>
                    <td className="px-3 py-1.5 font-semibold text-slate-900">{row.name}</td>
                    <td className="px-3 py-1.5 text-slate-700">{row.player1}</td>
                    <td className="px-3 py-1.5 text-slate-700">{row.player2 || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              onClick={() => setPreviewResult(null)}
              className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Hủy bỏ
            </button>
            <button
              onClick={handleConfirmImport}
              disabled={previewResult.validTeams.length === 0}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg shadow-sm transition-colors"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Xác Nhận Lưu Vào Database Riêng</span>
            </button>
          </div>
        </div>
      )}

      {/* Search and Table Area */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm tên đội, VĐV, mã đội..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white transition-colors"
            />
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-500 font-mono">
            <span>Tổng cộng: <strong className="text-slate-900">{teams.length}</strong> đội</span>
            {isSingles ? (
              <span>({teams.length} VĐV)</span>
            ) : (
              <span>({teams.length * 2} VĐV)</span>
            )}
          </div>
        </div>

        {filteredTeams.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h4 className="text-sm font-semibold text-slate-800">Chưa có danh sách đội nào</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Hãy tải lên file Excel (.xlsx) theo mẫu chuẩn hoặc nhấn &ldquo;Thêm Thủ Công&rdquo; để bắt đầu.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">STT</th>
                  <th className="px-4 py-3">Mã Đội</th>
                  <th className="px-4 py-3">Tên Đội</th>
                  <th className="px-4 py-3">VĐV 1</th>
                  <th className="px-4 py-3">VĐV 2</th>
                  <th className="px-4 py-3 text-center">Hạt Giống</th>
                  <th className="px-4 py-3 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTeams.map((team, index) => (
                  <tr key={team.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 font-mono text-slate-400 tabular-nums">
                      {index + 1}
                    </td>
                    <td className="px-4 py-3 font-mono font-semibold text-slate-900">
                      {team.code}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-6 h-6 rounded-full ${team.avatarColor || 'bg-slate-500'} flex items-center justify-center text-white text-[10px] font-bold shrink-0`}
                        >
                          {team.name.charAt(0)}
                        </div>
                        <span className="font-semibold text-slate-900">{team.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-800 font-medium">
                      {team.player1}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {team.player2 || <span className="text-slate-400">—</span>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {team.seed ? (
                        <span className="inline-flex items-center gap-1 font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          <Hash className="w-3 h-3" />
                          {team.seed}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-mono">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => onDeleteTeam(team.id)}
                        className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                        title="Xóa đội"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Manual Add Modal */}
      {showManualAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Thêm Đội / VĐV Thủ Công</h3>
              <button
                onClick={() => setShowManualAddModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleManualAddSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mã / Tên Đội Thi Đấu (Cột A) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: TD-09, Sài Gòn Smashers"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Vận Động Viên 1 (Cột B) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Họ và tên VĐV 1"
                  value={manualPlayer1}
                  onChange={(e) => setManualPlayer1(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {!isSingles && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Vận Động Viên 2 (Cột C)
                  </label>
                  <input
                    type="text"
                    placeholder="Họ và tên VĐV 2 (bắt buộc cho giải đôi)"
                    value={manualPlayer2}
                    onChange={(e) => setManualPlayer2(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Hạt Giống (Tùy chọn)
                </label>
                <input
                  type="number"
                  min="1"
                  max="32"
                  placeholder="1, 2, 3..."
                  value={manualSeed}
                  onChange={(e) => setManualSeed(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-none font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowManualAddModal(false)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors"
                >
                  Lưu Vào Database
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
