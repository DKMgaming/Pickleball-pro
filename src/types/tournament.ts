/**
 * Type definitions for Pickleball Tournament Management System
 * Follows Multi-Tenant Architecture & Official Pickleball Tournament Regulations
 */

export type TournamentCategory = 
  | 'singles_men'      // Đơn nam
  | 'singles_women'    // Đơn nữ
  | 'doubles_men'      // Đôi nam
  | 'doubles_women'    // Đôi nữ
  | 'doubles_mixed';   // Đôi nam nữ

export type TournamentFormat = 
  | 'round_robin'      // Vòng bảng vòng tròn
  | 'knockout'         // Đấu loại trực tiếp
  | 'combined';        // Kết hợp (Vòng bảng + Playoff loại trực tiếp)

export type TournamentStatus = 'draft' | 'in_progress' | 'completed';

export type MatchStatus = 'scheduled' | 'in_progress' | 'completed';

export type MatchFormatOption = 'best_of_1' | 'best_of_3' | 'best_of_5';
export type PointsPerGameOption = 11 | 15 | 21;

// Configuration for rules per tournament stage
export interface StageRuleConfig {
  matchFormat: MatchFormatOption;     // Đấu 1 hiệp, 3 hiệp thắng 2, 5 hiệp thắng 3
  pointsPerGame: PointsPerGameOption; // 11 điểm chuẩn, 15 điểm hoặc 21 điểm
  winByTwo: boolean;                  // Cách 2 điểm (Deuce)
}

export interface TournamentStageRules {
  group: StageRuleConfig;         // Vòng Bảng
  roundOf16: StageRuleConfig;     // Vòng 1/16 & 1/8
  quarterFinals: StageRuleConfig; // Vòng Tứ Kết
  semiFinals: StageRuleConfig;    // Vòng Bán Kết
  finals: StageRuleConfig;        // Vòng Chung Kết & Tranh Hạng 3
}

export const DEFAULT_STAGE_RULES: TournamentStageRules = {
  group: {
    matchFormat: 'best_of_1',
    pointsPerGame: 11,
    winByTwo: true,
  },
  roundOf16: {
    matchFormat: 'best_of_1',
    pointsPerGame: 15,
    winByTwo: true,
  },
  quarterFinals: {
    matchFormat: 'best_of_3',
    pointsPerGame: 11,
    winByTwo: true,
  },
  semiFinals: {
    matchFormat: 'best_of_3',
    pointsPerGame: 11,
    winByTwo: true,
  },
  finals: {
    matchFormat: 'best_of_3',
    pointsPerGame: 11,
    winByTwo: true,
  },
};

export interface GameScore {
  gameNumber: number;
  team1Score: number;
  team2Score: number;
}

export interface PlayerInfo {
  fullName: string;
  phone?: string;
  rating?: number;
}

export interface Team {
  id: string;
  tournamentId: string;
  code: string;           // Mã đội / Tên đội (Cột A trong Excel)
  name: string;           // Tên đội hiển thị
  player1: string;        // VĐV 1 (Cột B trong Excel)
  player2?: string;       // VĐV 2 (Cột C trong Excel, để trống nếu đánh đơn)
  seed?: number;          // Hạt giống (1, 2, 3...)
  contactPhone?: string;
  avatarColor?: string;
}

export interface Group {
  id: string;
  tournamentId: string;
  name: string;           // Bảng A, Bảng B, Bảng C...
  teamIds: string[];
}

export interface Match {
  id: string;
  tournamentId: string;
  stage: 'group' | 'playoff';
  groupId?: string;       // Bảng nào nếu là vòng bảng
  roundName: string;      // Vòng 1, Vòng 2, Vòng 1/16, Vòng 1/8, Tứ kết, Bán kết, Chung kết
  roundIndex: number;     // Số thứ tự vòng
  matchNumber: number;
  team1Id: string | null;
  team2Id: string | null;
  status: MatchStatus;
  courtName: string;      // Sân 1, Sân 2...
  scheduledTime?: string; // Giờ thi đấu (VD: 08:30)
  scores: GameScore[];    // Điểm các game (Game 1, Game 2, Game 3...)
  winnerId: string | null;
  nextMatchId?: string;   // Dẫn đến trận nào ở nhánh playoff tiếp theo
  nextSlotIndex?: 1 | 2;  // Slot 1 (Team 1) hay Slot 2 (Team 2) ở trận tiếp theo
  isThirdPlace?: boolean; // Tranh hạng 3
}

export interface Standing {
  teamId: string;
  teamName: string;
  playerNames: string;
  groupId: string;
  played: number;         // Số trận đã đấu
  won: number;            // Trận thắng
  lost: number;           // Trận thua
  gamesWon: number;       // Số game (hiệp) thắng
  gamesLost: number;      // Số game (hiệp) thua
  pointsWon: number;      // Tổng số quả/điểm ghi được
  pointsLost: number;     // Tổng số quả/điểm bị thua
  gameDiff: number;       // Hiệu số game (+/-)
  pointDiff: number;      // Hiệu số quả (+/-)
  totalPoints: number;    // Tổng điểm (Thắng = 3 điểm, Thua = 0 điểm)
  rank: number;           // Thứ hạng hiện tại trong bảng
  isQualified: boolean;   // Đủ điều kiện vào vòng Playoff (Nhất/Nhì bảng)
}

export interface Tournament {
  id: string;
  name: string;
  description: string;
  category: TournamentCategory;
  format: TournamentFormat;
  status: TournamentStatus;
  courtsCount: number;
  matchFormat: MatchFormatOption;        // Mặc định chung
  pointsPerGame: PointsPerGameOption;    // Mặc định chung
  winByTwo: boolean;                     // Mặc định chung
  stageRules: TournamentStageRules;      // Thiết lập quy tắc điểm riêng cho từng giai đoạn!
  pointsPerWin: number;                  // Chuẩn: 3 điểm
  pointsPerLoss: number;                 // Chuẩn: 0 điểm
  qualifyPerGroup: number;               // Số đội mỗi bảng vào playoff (thường là 2)
  groupsCount: number;                   // Số bảng đấu
  location: string;
  startDate: string;
  createdAt: string;
  creatorId?: string;                    // ID người tạo giải đấu
  creatorName?: string;                  // Tên Trưởng BTC / người tạo giải
}

/**
 * Determine exact rule configuration for a given match based on its tournament stage
 */
export function getStageRuleForMatch(
  match: Match,
  tournament: Tournament
): StageRuleConfig {
  const rules = tournament.stageRules || DEFAULT_STAGE_RULES;

  if (match.stage === 'group') {
    return rules.group;
  }

  const name = match.roundName.toLowerCase();
  if (name.includes('1/16') || name.includes('vòng 16') || name.includes('1/8') || name.includes('vòng 1/8')) {
    return rules.roundOf16;
  }
  if (name.includes('tứ kết') || name.includes('quarter')) {
    return rules.quarterFinals;
  }
  if (name.includes('bán kết') || name.includes('semi')) {
    return rules.semiFinals;
  }
  if (name.includes('chung kết') || name.includes('tranh hạng 3') || name.includes('final') || match.isThirdPlace) {
    return rules.finals;
  }

  return rules.group;
}

// Role-Based Access Control (RBAC) Models
export type UserRole =
  | 'super_admin'       // Quản trị viên tối cao: Toàn quyền Master DB & tạo Database riêng
  | 'organizer'         // Trưởng ban tổ chức: Toàn quyền trong Tenant DB
  | 'coordinator'       // Điều phối viên: Nhập VĐV, bốc thăm & lập lịch
  | 'referee'           // Trọng tài / Thư ký: Chỉ ghi nhận điểm số các trận đấu
  | 'viewer';           // Khách xem / Truyền thông: Chỉ xem (Read-only)

export type UserPermission =
  | 'input_scores'          // Quyền nhập & sửa tỷ số trận đấu (Dành cho Trọng tài)
  | 'view_groups_brackets'  // Quyền xem bảng đấu & nhánh Playoff (Dành cho Khách xem / Báo chí)
  | 'view_standings'        // Quyền xem bảng xếp hạng vòng bảng
  | 'print_scoresheet'      // Quyền in biên bản & phiếu điểm trọng tài
  | 'schedule_groups'       // Quyền bốc thăm chia bảng & lập lịch thi đấu
  | 'manage_teams_excel'    // Quyền nhập file Excel & sửa danh sách VĐV
  | 'manage_tournaments'    // Quyền tạo & cấu hình giải đấu mới
  | 'manage_database'       // Quyền sao lưu, xuất SQL, quản trị schema DB riêng
  | 'manage_users';         // Quyền tạo & phân quyền tài khoản con

export const ROLE_DEFAULT_PERMISSIONS: Record<UserRole, UserPermission[]> = {
  super_admin: [
    'manage_tournaments',
    'manage_teams_excel',
    'schedule_groups',
    'input_scores',
    'view_groups_brackets',
    'view_standings',
    'print_scoresheet',
    'manage_database',
    'manage_users',
  ],
  organizer: [
    'manage_tournaments',
    'manage_teams_excel',
    'schedule_groups',
    'input_scores',
    'view_groups_brackets',
    'view_standings',
    'print_scoresheet',
    'manage_database',
  ],
  coordinator: [
    'manage_teams_excel',
    'schedule_groups',
    'input_scores',
    'view_groups_brackets',
    'view_standings',
    'print_scoresheet',
  ],
  referee: [
    'input_scores',
    'view_groups_brackets',
    'print_scoresheet',
  ],
  viewer: [
    'view_groups_brackets',
    'view_standings',
  ],
};

// Master Database Schema Models
export interface MasterUser {
  id: string;
  username?: string; // Tên đăng nhập ngắn (ví dụ: 'admin')
  email: string;
  fullName: string;
  role: UserRole;
  currentTenantId: string;
  assignedTenantIds: string[]; // Các Tenant DB mà user này được phân quyền thao tác
  permissions: UserPermission[]; // Danh sách quyền chi tiết được cấp
  status: 'active' | 'suspended';
  password?: string; // Mật khẩu đăng nhập (mặc định: 123)
  dbAccessStatus: 'granted' | 'pending' | 'revoked'; // Trạng thái cấp quyền Database riêng
  dbAccessType: 'isolated_new' | 'assigned_existing'; // Loại database được cấp
  temporaryPin?: string; // Mật khẩu / PIN truy cập nhanh
  notes?: string; // Ghi chú phân công nhân sự
  plan: 'Starter' | 'Pro' | 'Enterprise';
  createdAt: string;
}

export interface Tenant {
  id: string;
  userId: string;
  orgName: string;
  slug: string;
  schemaName: string;             // Isolated schema: e.g. "tenant_club_thuduc_db"
  dbConnectionString: string;     // Connection string URI
  logoUrl?: string;
  createdAt: string;
  storageBytes: number;
}

// Complete isolated data container for a single tenant database
export interface TenantDatabase {
  tenantId: string;
  schemaName: string;
  tournaments: Tournament[];
  teams: Team[];
  groups: Group[];
  matches: Match[];
}
