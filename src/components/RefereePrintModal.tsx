import React from 'react';
import { X, Printer, Trophy } from 'lucide-react';
import { Match, Team, Tournament } from '../types/tournament.ts';

interface RefereePrintModalProps {
  tournament: Tournament;
  matches: Match[];
  teamsMap: Record<string, Team>;
  onClose: () => void;
}

export const RefereePrintModal: React.FC<RefereePrintModalProps> = ({
  tournament,
  matches,
  teamsMap,
  onClose,
}) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        {/* Modal Controls - Hidden when printing */}
        <div className="no-print p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Biên Bản & Phiếu Điểm Trọng Tài (Chuẩn In A4)
            </h3>
            <p className="text-xs text-slate-500">
              Sẵn sàng in ấn trực tiếp phục vụ tổ trọng tài trên sân
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>In Ngay (Print)</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-1.5"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Area */}
        <div className="p-8 overflow-y-auto space-y-8 bg-white text-slate-900 font-sans print:p-0">
          {matches.slice(0, 8).map((match, idx) => {
            const t1 = match.team1Id ? teamsMap[match.team1Id] : null;
            const t2 = match.team2Id ? teamsMap[match.team2Id] : null;

            return (
              <div
                key={match.id}
                className="border-2 border-slate-800 rounded-lg p-5 print-break-inside-avoid"
              >
                {/* Header */}
                <div className="border-b-2 border-slate-800 pb-3 mb-4 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-600 block">
                      LIÊN ĐOÀN PICKLEBALL · BIÊN BẢN TRẬN ĐẤU CHÍNH THỨC
                    </span>
                    <h2 className="text-base font-extrabold text-slate-900 uppercase">
                      {tournament.name}
                    </h2>
                  </div>
                  <div className="text-right text-xs font-mono font-bold">
                    <div>TRẬN SỐ #{match.matchNumber}</div>
                    <div className="text-slate-600">{match.roundName} · {match.courtName}</div>
                  </div>
                </div>

                {/* Match Info */}
                <div className="grid grid-cols-2 gap-4 text-xs mb-4">
                  <div className="border border-slate-300 rounded p-2.5 bg-slate-50/50">
                    <span className="font-mono text-[10px] text-slate-500 block uppercase">
                      ĐỘI 1 (CODE: {t1?.code || '—'})
                    </span>
                    <div className="font-bold text-sm text-slate-900 mt-0.5">
                      {t1?.name || '...................................................'}
                    </div>
                    <div className="text-xs text-slate-600 mt-1">
                      VĐV: {t1?.player2 ? `${t1.player1} & ${t1.player2}` : t1?.player1 || '......................................'}
                    </div>
                  </div>

                  <div className="border border-slate-300 rounded p-2.5 bg-slate-50/50 text-right">
                    <span className="font-mono text-[10px] text-slate-500 block uppercase">
                      ĐỘI 2 (CODE: {t2?.code || '—'})
                    </span>
                    <div className="font-bold text-sm text-slate-900 mt-0.5">
                      {t2?.name || '...................................................'}
                    </div>
                    <div className="text-xs text-slate-600 mt-1">
                      VĐV: {t2?.player2 ? `${t2.player1} & ${t2.player2}` : t2?.player1 || '......................................'}
                    </div>
                  </div>
                </div>

                {/* Score Grid */}
                <table className="w-full text-xs border-collapse border border-slate-400 text-center mb-4">
                  <thead className="bg-slate-100 font-bold">
                    <tr>
                      <th className="border border-slate-400 p-2 text-left">Đội Thi Đấu</th>
                      <th className="border border-slate-400 p-2 w-24">Hiệp 1 (Game 1)</th>
                      <th className="border border-slate-400 p-2 w-24">Hiệp 2 (Game 2)</th>
                      <th className="border border-slate-400 p-2 w-24">Hiệp 3 (Game 3)</th>
                      <th className="border border-slate-400 p-2 w-28">Kết Quả Chung Cuộc</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-slate-400 p-2 text-left font-semibold">
                        {t1?.name || 'Đội 1'}
                      </td>
                      <td className="border border-slate-400 p-2 font-mono font-bold text-base h-10">
                        {match.scores[0]?.team1Score ?? ''}
                      </td>
                      <td className="border border-slate-400 p-2 font-mono font-bold text-base">
                        {match.scores[1]?.team1Score ?? ''}
                      </td>
                      <td className="border border-slate-400 p-2 font-mono font-bold text-base">
                        {match.scores[2]?.team1Score ?? ''}
                      </td>
                      <td className="border border-slate-400 p-2 font-mono font-bold">
                        {match.winnerId === match.team1Id ? 'THẮNG' : ''}
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-slate-400 p-2 text-left font-semibold">
                        {t2?.name || 'Đội 2'}
                      </td>
                      <td className="border border-slate-400 p-2 font-mono font-bold text-base h-10">
                        {match.scores[0]?.team2Score ?? ''}
                      </td>
                      <td className="border border-slate-400 p-2 font-mono font-bold text-base">
                        {match.scores[1]?.team2Score ?? ''}
                      </td>
                      <td className="border border-slate-400 p-2 font-mono font-bold text-base">
                        {match.scores[2]?.team2Score ?? ''}
                      </td>
                      <td className="border border-slate-400 p-2 font-mono font-bold">
                        {match.winnerId === match.team2Id ? 'THẮNG' : ''}
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* Signatures */}
                <div className="grid grid-cols-3 gap-4 pt-4 text-center text-xs font-medium">
                  <div>
                    <p className="font-bold mb-8">ĐỘI TRƯỞNG ĐỘI 1</p>
                    <p className="text-[10px] text-slate-400 italic">(Ký & ghi rõ họ tên)</p>
                  </div>
                  <div>
                    <p className="font-bold mb-8">TRỌNG TÀI CHÍNH</p>
                    <p className="text-[10px] text-slate-400 italic">(Ký & ghi rõ họ tên)</p>
                  </div>
                  <div>
                    <p className="font-bold mb-8">ĐỘI TRƯỞNG ĐỘI 2</p>
                    <p className="text-[10px] text-slate-400 italic">(Ký & ghi rõ họ tên)</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
