/**
 * Excel Processing Service for Pickleball Tournament
 * Uses SheetJS (xlsx) for reading/writing .xlsx files
 * Strictly follows specification:
 * - Col A: TenDoi (Tên đội / Mã đội)
 * - Col B: Player1 (Họ và tên VĐV 1)
 * - Col C: Player2 (Họ và tên VĐV 2 - Để trống nếu thi đấu đơn)
 */

import * as XLSX from 'xlsx';
import { Team, TournamentCategory, Standing, Match } from '../types/tournament.ts';

export interface ExcelImportResult {
  validTeams: Omit<Team, 'id' | 'tournamentId'>[];
  errors: string[];
  warnings: string[];
  totalRows: number;
}

export const ExcelService = {
  /**
   * Parse uploaded Excel (.xlsx, .xls) or CSV file
   */
  async parseExcelFile(
    file: File,
    category: TournamentCategory
  ): Promise<ExcelImportResult> {
    const isSingles = category === 'singles_men' || category === 'singles_women';
    const errors: string[] = [];
    const warnings: string[] = [];
    const validTeams: Omit<Team, 'id' | 'tournamentId'>[] = [];

    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });

    if (!workbook.SheetNames.length) {
      throw new Error('File Excel không có sheet nào.');
    }

    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];

    // Convert sheet to array of rows
    const rawData = (XLSX.utils.sheet_to_json(worksheet, {
      header: 1, // Array of arrays: row 0 is header, row 1+ are data
      defval: '',
      blankrows: false,
    }) as unknown) as unknown[][];

    if (rawData.length <= 1) {
      throw new Error('File Excel không chứa dòng dữ liệu nào sau tiêu đề.');
    }

    // Inspect header row (index 0)
    const headerRow = (rawData[0] || []).map((cell) => String(cell || '').trim());
    
    // Find column indexes (support exact specification and common Vietnamese / English variants)
    let colTeamIdx = 0;
    let colPlayer1Idx = 1;
    let colPlayer2Idx = 2;

    headerRow.forEach((colName, idx) => {
      const lower = colName.toLowerCase().replace(/[\s_]+/g, '');
      if (
        lower.includes('tendoi') ||
        lower.includes('madoi') ||
        lower.includes('team') ||
        lower.includes('đội')
      ) {
        colTeamIdx = idx;
      } else if (
        lower.includes('player1') ||
        lower.includes('vdv1') ||
        lower.includes('vậnđộngviên1') ||
        lower.includes('ngườichơi1')
      ) {
        colPlayer1Idx = idx;
      } else if (
        lower.includes('player2') ||
        lower.includes('vdv2') ||
        lower.includes('vậnđộngviên2') ||
        lower.includes('ngườichơi2')
      ) {
        colPlayer2Idx = idx;
      }
    });

    const seenTeamCodes = new Set<string>();

    for (let i = 1; i < rawData.length; i++) {
      const row = rawData[i] || [];
      const rowNum = i + 1; // 1-indexed Excel row

      const teamCodeRaw = String(row[colTeamIdx] || '').trim();
      const player1Raw = String(row[colPlayer1Idx] || '').trim();
      const player2Raw = String(row[colPlayer2Idx] || '').trim();

      // Skip completely empty lines
      if (!teamCodeRaw && !player1Raw && !player2Raw) {
        continue;
      }

      // Validation 1: Missing Team Name / Code
      if (!teamCodeRaw) {
        errors.push(`Dòng ${rowNum}: Thiếu Tên/Mã đội (Cột A).`);
        continue;
      }

      // Validation 2: Missing Player 1
      if (!player1Raw) {
        errors.push(`Dòng ${rowNum}: Đội "${teamCodeRaw}" thiếu VĐV 1 (Cột B).`);
        continue;
      }

      // Validation 3: Duplicate Team Code / Name
      const normalizedCode = teamCodeRaw.toLowerCase();
      if (seenTeamCodes.has(normalizedCode)) {
        errors.push(
          `Dòng ${rowNum}: Trùng lặp tên đội "${teamCodeRaw}" đã xuất hiện trước đó.`
        );
        continue;
      }
      seenTeamCodes.add(normalizedCode);

      // Validation 4: Doubles vs Singles format check
      if (isSingles && player2Raw) {
        warnings.push(
          `Dòng ${rowNum}: Giải thi đấu Đơn nhưng đội "${teamCodeRaw}" có điền VĐV 2 ("${player2Raw}"). Sẽ tự động bỏ qua VĐV 2.`
        );
      } else if (!isSingles && !player2Raw) {
        warnings.push(
          `Dòng ${rowNum}: Giải thi đấu Đôi nhưng đội "${teamCodeRaw}" chỉ có 1 VĐV. Cần bổ sung VĐV 2.`
        );
      }

      // Color generator based on name
      const colors = [
        'bg-emerald-600',
        'bg-sky-600',
        'bg-amber-600',
        'bg-indigo-600',
        'bg-purple-600',
        'bg-teal-600',
        'bg-rose-600',
        'bg-orange-600',
        'bg-cyan-600',
      ];
      const avatarColor = colors[validTeams.length % colors.length];

      validTeams.push({
        code: teamCodeRaw,
        name: teamCodeRaw,
        player1: player1Raw,
        player2: isSingles ? undefined : player2Raw || undefined,
        seed: undefined,
        avatarColor,
      });
    }

    return {
      validTeams,
      errors,
      warnings,
      totalRows: rawData.length - 1,
    };
  },

  /**
   * Generate downloadable standard template file (.xlsx)
   */
  downloadTemplate(isSingles = false): void {
    const wsData = [
      ['TenDoi', 'Player1', 'Player2'],
      ['Thủ Đức Smashers', 'Nguyễn Tuấn Anh', isSingles ? '' : 'Trần Quốc Bảo'],
      ['An Phú Dinking Aces', 'Lê Minh Khang', isSingles ? '' : 'Võ Hoàng Phúc'],
      ['Bình Thạnh Spinners', 'Phạm Đức Duy', isSingles ? '' : 'Đỗ Hữu Thắng'],
      ['Sài Gòn Lightning', 'Đặng Tuấn Kiệt', isSingles ? '' : 'Hà Thế Phong'],
      ['Phú Mỹ Hưng Dinks', 'Ngô Thanh Tùng', isSingles ? '' : 'Dương Trí Dũng'],
      ['Tân Bình Fast Spin', 'Phan Trọng Nghĩa', isSingles ? '' : 'Đoàn Hùng Cường'],
    ];

    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Set column widths
    ws['!cols'] = [{ wch: 24 }, { wch: 22 }, { wch: 22 }];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'DanhSach_VDV');

    const fileName = isSingles
      ? 'Mau_Danh_Sach_VDV_Don_Pickleball.xlsx'
      : 'Mau_Danh_Sach_VDV_Doi_Pickleball.xlsx';

    XLSX.writeFile(wb, fileName);
  },

  /**
   * Export tournament standings to Excel
   */
  exportStandings(standings: Standing[], tournamentName: string): void {
    const header = [
      'Thứ hạng',
      'Đội thi đấu',
      'Vận động viên',
      'Bảng',
      'Trận đã đấu',
      'Thắng',
      'Thua',
      'Game Thắng',
      'Game Thua',
      'Hiệu số Game',
      'Điểm ghi',
      'Điểm thua',
      'Hiệu số Điểm',
      'Tổng điểm (Pts)',
      'Vé vào Playoff',
    ];

    const rows = standings.map((s) => [
      s.rank,
      s.teamName,
      s.playerNames,
      s.groupId,
      s.played,
      s.won,
      s.lost,
      s.gamesWon,
      s.gamesLost,
      s.gameDiff > 0 ? `+${s.gameDiff}` : s.gameDiff,
      s.pointsWon,
      s.pointsLost,
      s.pointDiff > 0 ? `+${s.pointDiff}` : s.pointDiff,
      s.totalPoints,
      s.isQualified ? 'ĐỦ ĐIỀU KIỆN' : 'Bị loại',
    ]);

    const ws = XLSX.utils.aoa_to_sheet([header, ...rows]);
    ws['!cols'] = [
      { wch: 10 },
      { wch: 24 },
      { wch: 28 },
      { wch: 10 },
      { wch: 12 },
      { wch: 8 },
      { wch: 8 },
      { wch: 12 },
      { wch: 12 },
      { wch: 14 },
      { wch: 12 },
      { wch: 12 },
      { wch: 14 },
      { wch: 14 },
      { wch: 16 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'BangXepHang');
    XLSX.writeFile(wb, `Bang_Xep_Hang_${tournamentName.replace(/\s+/g, '_')}.xlsx`);
  },

  /**
   * Export matches schedule to Excel
   */
  exportSchedule(
    matches: Match[],
    teamsMap: Record<string, Team>,
    tournamentName: string
  ): void {
    const header = [
      'Trận số',
      'Giai đoạn',
      'Vòng thi đấu',
      'Đội 1',
      'Đội 2',
      'Sân',
      'Giờ đấu',
      'Tỷ số Game',
      'Trạng thái',
      'Đội thắng',
    ];

    const rows = matches.map((m) => {
      const t1 = m.team1Id ? teamsMap[m.team1Id] : null;
      const t2 = m.team2Id ? teamsMap[m.team2Id] : null;
      const winner = m.winnerId ? teamsMap[m.winnerId] : null;

      const scoreText = m.scores && m.scores.length > 0
        ? m.scores.map((s) => `${s.team1Score}-${s.team2Score}`).join(', ')
        : 'Chưa có tỷ số';

      const statusText =
        m.status === 'completed'
          ? 'Đã kết thúc'
          : m.status === 'in_progress'
          ? 'Đang diễn ra'
          : 'Chờ thi đấu';

      return [
        m.matchNumber,
        m.stage === 'group' ? 'Vòng Bảng' : 'Playoff Trực Tiếp',
        m.roundName,
        t1 ? t1.name : 'Chờ xác định',
        t2 ? t2.name : 'Chờ xác định',
        m.courtName,
        m.scheduledTime || '',
        scoreText,
        statusText,
        winner ? winner.name : '',
      ];
    });

    const ws = XLSX.utils.aoa_to_sheet([header, ...rows]);
    ws['!cols'] = [
      { wch: 8 },
      { wch: 14 },
      { wch: 16 },
      { wch: 24 },
      { wch: 24 },
      { wch: 16 },
      { wch: 12 },
      { wch: 20 },
      { wch: 14 },
      { wch: 22 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'LichThiDau');
    XLSX.writeFile(wb, `Lich_Thi_Dau_${tournamentName.replace(/\s+/g, '_')}.xlsx`);
  },
};
