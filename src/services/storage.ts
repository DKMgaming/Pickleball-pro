/**
 * Multi-Tenant Isolated Database Engine
 * Implements Master Database (Users & Tenants) and isolated Tenant Databases
 * Each tenant operates within a completely separate schema / data store
 */

import {
  MasterUser,
  Tenant,
  TenantDatabase,
  Tournament,
  Team,
  Group,
  Match,
  DEFAULT_STAGE_RULES,
  UserRole,
  UserPermission,
  ROLE_DEFAULT_PERMISSIONS,
} from '../types/tournament.ts';

const STORAGE_KEYS = {
  MASTER_USERS: 'pball_master_users',
  MASTER_TENANTS: 'pball_master_tenants',
  ACTIVE_TENANT_ID: 'pball_active_tenant_id',
  ACTIVE_USER_ID: 'pball_active_user_id',
  IS_LOGGED_IN: 'pball_is_logged_in',
  TENANT_DB_PREFIX: 'pball_tenant_db_',
};

// Seed Master Users with comprehensive RBAC permissions & assigned Tenant DBs
const DEFAULT_USERS: MasterUser[] = [
  {
    id: 'user_super_admin',
    username: 'admin',
    email: 'admin.master@pickleballvn.com',
    fullName: 'Phạm Quốc Khánh (Super Admin Hệ Thống)',
    role: 'super_admin',
    currentTenantId: 'tenant_thuduc',
    assignedTenantIds: ['tenant_thuduc', 'tenant_saigon', 'tenant_hanoi'],
    permissions: [...ROLE_DEFAULT_PERMISSIONS.super_admin],
    status: 'active',
    password: '123',
    dbAccessStatus: 'granted',
    dbAccessType: 'isolated_new',
    temporaryPin: '9999',
    notes: 'Quản trị viên hệ thống trung tâm Master Server',
    plan: 'Enterprise',
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'user_thuduc',
    email: 'btc.thuduc@pickleballvn.com',
    fullName: 'Nguyễn Văn Hùng (Trưởng BTC Thủ Đức)',
    role: 'organizer',
    currentTenantId: 'tenant_thuduc',
    assignedTenantIds: ['tenant_thuduc'],
    permissions: [...ROLE_DEFAULT_PERMISSIONS.organizer],
    status: 'active',
    password: '123',
    dbAccessStatus: 'granted',
    dbAccessType: 'isolated_new',
    temporaryPin: '1234',
    notes: 'Chủ sở hữu Database riêng: tenant_clb_thuduc_schema',
    plan: 'Pro',
    createdAt: '2026-01-10T08:00:00Z',
  },
  {
    id: 'user_referee_thuduc',
    email: 'referee.quang@pball.vn',
    fullName: 'Lê Văn Quang (Trọng Tài - Chỉ Nhập Điểm)',
    role: 'referee',
    currentTenantId: 'tenant_thuduc',
    assignedTenantIds: ['tenant_thuduc'],
    permissions: ['input_scores', 'print_scoresheet'],
    status: 'active',
    password: '123',
    dbAccessStatus: 'granted',
    dbAccessType: 'assigned_existing',
    temporaryPin: '2345',
    notes: 'Trọng tài sân 1 & 2 - Chỉ được quyền nhập tỷ số & in biên bản',
    plan: 'Starter',
    createdAt: '2026-01-12T10:00:00Z',
  },
  {
    id: 'user_saigon',
    email: 'admin@saigonopen.org',
    fullName: 'Trần Minh Quân (BTC Sài Gòn Open)',
    role: 'organizer',
    currentTenantId: 'tenant_saigon',
    assignedTenantIds: ['tenant_saigon'],
    permissions: [...ROLE_DEFAULT_PERMISSIONS.organizer],
    status: 'active',
    password: '123',
    dbAccessStatus: 'granted',
    dbAccessType: 'isolated_new',
    temporaryPin: '5678',
    notes: 'Chủ sở hữu Database riêng: tenant_saigon_open_schema',
    plan: 'Enterprise',
    createdAt: '2026-02-15T09:30:00Z',
  },
  {
    id: 'user_viewer',
    email: 'media@pickleballtoday.vn',
    fullName: 'Hoàng Báo Chí (Khách Xem - Chỉ Xem Bảng)',
    role: 'viewer',
    currentTenantId: 'tenant_thuduc',
    assignedTenantIds: ['tenant_thuduc', 'tenant_saigon'],
    permissions: ['view_groups_brackets', 'view_standings'],
    status: 'active',
    password: '123',
    dbAccessStatus: 'granted',
    dbAccessType: 'assigned_existing',
    temporaryPin: '1111',
    notes: 'Phóng viên tác nghiệp - Chỉ xem lịch thi đấu và bảng xếp hạng',
    plan: 'Starter',
    createdAt: '2026-03-01T14:15:00Z',
  },
  {
    id: 'user_pending_referee',
    email: 'referee.tuan@pball.vn',
    fullName: 'Đặng Tuấn (Trọng Tài Dự Bị - Chờ Cấp DB)',
    role: 'referee',
    currentTenantId: 'tenant_thuduc',
    assignedTenantIds: ['tenant_thuduc'],
    permissions: ['input_scores'],
    status: 'active',
    password: '123',
    dbAccessStatus: 'pending',
    dbAccessType: 'assigned_existing',
    temporaryPin: '3333',
    notes: 'Đã phân quyền Nhập tỷ số nhưng đang chờ Admin phê duyệt quyền truy cập DB',
    plan: 'Starter',
    createdAt: '2026-04-01T08:00:00Z',
  },
];

// Seed Master Tenants
const DEFAULT_TENANTS: Tenant[] = [
  {
    id: 'tenant_thuduc',
    userId: 'user_thuduc',
    orgName: 'CLB Pickleball TP. Thủ Đức',
    slug: 'clb-thuduc',
    schemaName: 'tenant_clb_thuduc_schema',
    dbConnectionString: 'postgresql://usr_thuduc:***@pg-cluster.picklepall.internal:5432/tenant_thuduc_db',
    createdAt: '2026-01-10T08:05:00Z',
    storageBytes: 124800,
  },
  {
    id: 'tenant_saigon',
    userId: 'user_saigon',
    orgName: 'Saigon Pickleball Open 2026',
    slug: 'saigon-open',
    schemaName: 'tenant_saigon_open_schema',
    dbConnectionString: 'postgresql://usr_saigon:***@pg-cluster.picklepall.internal:5432/tenant_saigon_db',
    createdAt: '2026-02-15T09:35:00Z',
    storageBytes: 94200,
  },
  {
    id: 'tenant_hanoi',
    userId: 'user_hanoi',
    orgName: 'Hà Nội Masters Pickleball Club',
    slug: 'hanoi-masters',
    schemaName: 'tenant_hanoi_masters_schema',
    dbConnectionString: 'postgresql://usr_hanoi:***@pg-cluster.picklepall.internal:5432/tenant_hanoi_db',
    createdAt: '2026-03-01T14:20:00Z',
    storageBytes: 45000,
  },
];

// Helper to seed initial sample tournament in Thủ Đức tenant
function createSampleThuducDatabase(): TenantDatabase {
  const tournamentId = 'tour_thuduc_open_2026';
  
  const sampleTournament: Tournament = {
    id: tournamentId,
    name: 'Giải Pickleball Vô Địch Đôi Nam Thủ Đức Open 2026',
    description: 'Giải đấu quy tụ 8 cặp VĐV xuất sắc tranh cúp vàng. Áp dụng chuẩn luật USA Pickleball & VPA 2026.',
    category: 'doubles_men',
    format: 'combined', // Vòng bảng + Playoff loại trực tiếp
    status: 'in_progress',
    courtsCount: 4,
    matchFormat: 'best_of_3',
    pointsPerGame: 11,
    winByTwo: true,
    stageRules: DEFAULT_STAGE_RULES,
    pointsPerWin: 3,
    pointsPerLoss: 0,
    qualifyPerGroup: 2,
    groupsCount: 2,
    location: 'Cụm 6 Sân Pickleball D-Sports Thủ Đức, TP. HCM',
    startDate: '2026-10-15',
    createdAt: new Date().toISOString(),
    creatorId: 'user_thuduc',
    creatorName: 'Nguyễn Văn Hùng (Trưởng BTC Thủ Đức)',
  };

  const sampleTeams: Team[] = [
    // Bảng A (4 đội)
    {
      id: 'team_01',
      tournamentId,
      code: 'TD-01',
      name: 'Thủ Đức Smashers',
      player1: 'Nguyễn Tuấn Anh',
      player2: 'Trần Quốc Bảo',
      seed: 1,
      avatarColor: 'bg-emerald-600',
    },
    {
      id: 'team_02',
      tournamentId,
      code: 'Q2-02',
      name: 'An Phú Dinking Aces',
      player1: 'Lê Minh Khang',
      player2: 'Võ Hoàng Phúc',
      avatarColor: 'bg-sky-600',
    },
    {
      id: 'team_03',
      tournamentId,
      code: 'BT-03',
      name: 'Bình Thạnh Spinners',
      player1: 'Phạm Đức Duy',
      player2: 'Đỗ Hữu Thắng',
      avatarColor: 'bg-amber-600',
    },
    {
      id: 'team_04',
      tournamentId,
      code: 'Q9-04',
      name: 'Công Nghệ Cao Power',
      player1: 'Hoàng Văn Lâm',
      player2: 'Bùi Gia Huy',
      avatarColor: 'bg-indigo-600',
    },
    // Bảng B (4 đội)
    {
      id: 'team_05',
      tournamentId,
      code: 'Q1-05',
      name: 'Sài Gòn Lightning',
      player1: 'Đặng Tuấn Kiệt',
      player2: 'Hà Thế Phong',
      seed: 2,
      avatarColor: 'bg-purple-600',
    },
    {
      id: 'team_06',
      tournamentId,
      code: 'Q7-06',
      name: 'Phú Mỹ Hưng Dinks',
      player1: 'Ngô Thanh Tùng',
      player2: 'Dương Trí Dũng',
      avatarColor: 'bg-teal-600',
    },
    {
      id: 'team_07',
      tournamentId,
      code: 'PN-07',
      name: 'Phú Nhuận Paddle Pros',
      player1: 'Vũ Quốc Trung',
      player2: 'Nguyễn Tấn Đạt',
      avatarColor: 'bg-rose-600',
    },
    {
      id: 'team_08',
      tournamentId,
      code: 'TB-08',
      name: 'Tân Bình Fast Spin',
      player1: 'Phan Trọng Nghĩa',
      player2: 'Đoàn Hùng Cường',
      avatarColor: 'bg-orange-600',
    },
  ];

  const groupA: Group = {
    id: 'group_a',
    tournamentId,
    name: 'Bảng A',
    teamIds: ['team_01', 'team_02', 'team_03', 'team_04'],
  };

  const groupB: Group = {
    id: 'group_b',
    tournamentId,
    name: 'Bảng B',
    teamIds: ['team_05', 'team_06', 'team_07', 'team_08'],
  };

  const sampleMatches: Match[] = [
    // Bảng A - Lượt 1
    {
      id: 'm_ga_01',
      tournamentId,
      stage: 'group',
      groupId: 'group_a',
      roundName: 'Lượt 1',
      roundIndex: 1,
      matchNumber: 1,
      team1Id: 'team_01',
      team2Id: 'team_02',
      status: 'completed',
      courtName: 'Sân 1 (Center)',
      scheduledTime: '08:00',
      scores: [
        { gameNumber: 1, team1Score: 11, team2Score: 6 },
        { gameNumber: 2, team1Score: 11, team2Score: 8 },
      ],
      winnerId: 'team_01',
    },
    {
      id: 'm_ga_02',
      tournamentId,
      stage: 'group',
      groupId: 'group_a',
      roundName: 'Lượt 1',
      roundIndex: 1,
      matchNumber: 2,
      team1Id: 'team_03',
      team2Id: 'team_04',
      status: 'completed',
      courtName: 'Sân 2',
      scheduledTime: '08:00',
      scores: [
        { gameNumber: 1, team1Score: 11, team2Score: 7 },
        { gameNumber: 2, team1Score: 8, team2Score: 11 },
        { gameNumber: 3, team1Score: 11, team2Score: 9 },
      ],
      winnerId: 'team_03',
    },
    // Bảng A - Lượt 2
    {
      id: 'm_ga_03',
      tournamentId,
      stage: 'group',
      groupId: 'group_a',
      roundName: 'Lượt 2',
      roundIndex: 2,
      matchNumber: 3,
      team1Id: 'team_01',
      team2Id: 'team_03',
      status: 'completed',
      courtName: 'Sân 1 (Center)',
      scheduledTime: '09:00',
      scores: [
        { gameNumber: 1, team1Score: 11, team2Score: 4 },
        { gameNumber: 2, team1Score: 11, team2Score: 5 },
      ],
      winnerId: 'team_01',
    },
    {
      id: 'm_ga_04',
      tournamentId,
      stage: 'group',
      groupId: 'group_a',
      roundName: 'Lượt 2',
      roundIndex: 2,
      matchNumber: 4,
      team1Id: 'team_02',
      team2Id: 'team_04',
      status: 'completed',
      courtName: 'Sân 2',
      scheduledTime: '09:00',
      scores: [
        { gameNumber: 1, team1Score: 11, team2Score: 6 },
        { gameNumber: 2, team1Score: 11, team2Score: 8 },
      ],
      winnerId: 'team_02',
    },
    // Bảng A - Lượt 3
    {
      id: 'm_ga_05',
      tournamentId,
      stage: 'group',
      groupId: 'group_a',
      roundName: 'Lượt 3',
      roundIndex: 3,
      matchNumber: 5,
      team1Id: 'team_01',
      team2Id: 'team_04',
      status: 'completed',
      courtName: 'Sân 1 (Center)',
      scheduledTime: '10:00',
      scores: [
        { gameNumber: 1, team1Score: 11, team2Score: 3 },
        { gameNumber: 2, team1Score: 11, team2Score: 2 },
      ],
      winnerId: 'team_01',
    },
    {
      id: 'm_ga_06',
      tournamentId,
      stage: 'group',
      groupId: 'group_a',
      roundName: 'Lượt 3',
      roundIndex: 3,
      matchNumber: 6,
      team1Id: 'team_02',
      team2Id: 'team_03',
      status: 'completed',
      courtName: 'Sân 2',
      scheduledTime: '10:00',
      scores: [
        { gameNumber: 1, team1Score: 11, team2Score: 9 },
        { gameNumber: 2, team1Score: 11, team2Score: 7 },
      ],
      winnerId: 'team_02',
    },

    // Bảng B - Lượt 1
    {
      id: 'm_gb_01',
      tournamentId,
      stage: 'group',
      groupId: 'group_b',
      roundName: 'Lượt 1',
      roundIndex: 1,
      matchNumber: 7,
      team1Id: 'team_05',
      team2Id: 'team_06',
      status: 'completed',
      courtName: 'Sân 3',
      scheduledTime: '08:00',
      scores: [
        { gameNumber: 1, team1Score: 11, team2Score: 7 },
        { gameNumber: 2, team1Score: 11, team2Score: 9 },
      ],
      winnerId: 'team_05',
    },
    {
      id: 'm_gb_02',
      tournamentId,
      stage: 'group',
      groupId: 'group_b',
      roundName: 'Lượt 1',
      roundIndex: 1,
      matchNumber: 8,
      team1Id: 'team_07',
      team2Id: 'team_08',
      status: 'completed',
      courtName: 'Sân 4',
      scheduledTime: '08:00',
      scores: [
        { gameNumber: 1, team1Score: 11, team2Score: 8 },
        { gameNumber: 2, team1Score: 11, team2Score: 6 },
      ],
      winnerId: 'team_07',
    },
    // Bảng B - Lượt 2
    {
      id: 'm_gb_03',
      tournamentId,
      stage: 'group',
      groupId: 'group_b',
      roundName: 'Lượt 2',
      roundIndex: 2,
      matchNumber: 9,
      team1Id: 'team_05',
      team2Id: 'team_07',
      status: 'completed',
      courtName: 'Sân 3',
      scheduledTime: '09:00',
      scores: [
        { gameNumber: 1, team1Score: 11, team2Score: 5 },
        { gameNumber: 2, team1Score: 11, team2Score: 7 },
      ],
      winnerId: 'team_05',
    },
    {
      id: 'm_gb_04',
      tournamentId,
      stage: 'group',
      groupId: 'group_b',
      roundName: 'Lượt 2',
      roundIndex: 2,
      matchNumber: 10,
      team1Id: 'team_06',
      team2Id: 'team_08',
      status: 'completed',
      courtName: 'Sân 4',
      scheduledTime: '09:00',
      scores: [
        { gameNumber: 1, team1Score: 11, team2Score: 7 },
        { gameNumber: 2, team1Score: 11, team2Score: 9 },
      ],
      winnerId: 'team_06',
    },
    // Bảng B - Lượt 3
    {
      id: 'm_gb_05',
      tournamentId,
      stage: 'group',
      groupId: 'group_b',
      roundName: 'Lượt 3',
      roundIndex: 3,
      matchNumber: 11,
      team1Id: 'team_05',
      team2Id: 'team_08',
      status: 'completed',
      courtName: 'Sân 3',
      scheduledTime: '10:00',
      scores: [
        { gameNumber: 1, team1Score: 11, team2Score: 6 },
        { gameNumber: 2, team1Score: 11, team2Score: 4 },
      ],
      winnerId: 'team_05',
    },
    {
      id: 'm_gb_06',
      tournamentId,
      stage: 'group',
      groupId: 'group_b',
      roundName: 'Lượt 3',
      roundIndex: 3,
      matchNumber: 12,
      team1Id: 'team_06',
      team2Id: 'team_07',
      status: 'completed',
      courtName: 'Sân 4',
      scheduledTime: '10:00',
      scores: [
        { gameNumber: 1, team1Score: 11, team2Score: 8 },
        { gameNumber: 2, team1Score: 11, team2Score: 6 },
      ],
      winnerId: 'team_06',
    },

    // Playoff (Bán kết + Chung kết)
    // Bán kết 1: Nhất A (Thủ Đức Smashers) vs Nhì B (Phú Mỹ Hưng Dinks)
    {
      id: 'm_playoff_semi_01',
      tournamentId,
      stage: 'playoff',
      roundName: 'Bán Kết 1',
      roundIndex: 1,
      matchNumber: 13,
      team1Id: 'team_01', // Nhất A
      team2Id: 'team_06', // Nhì B
      status: 'completed',
      courtName: 'Sân 1 (Center)',
      scheduledTime: '11:15',
      scores: [
        { gameNumber: 1, team1Score: 11, team2Score: 7 },
        { gameNumber: 2, team1Score: 11, team2Score: 9 },
      ],
      winnerId: 'team_01',
      nextMatchId: 'm_playoff_final',
      nextSlotIndex: 1,
    },
    // Bán kết 2: Nhất B (Sài Gòn Lightning) vs Nhì A (An Phú Dinking Aces)
    {
      id: 'm_playoff_semi_02',
      tournamentId,
      stage: 'playoff',
      roundName: 'Bán Kết 2',
      roundIndex: 1,
      matchNumber: 14,
      team1Id: 'team_05', // Nhất B
      team2Id: 'team_02', // Nhì A
      status: 'completed',
      courtName: 'Sân 2',
      scheduledTime: '11:15',
      scores: [
        { gameNumber: 1, team1Score: 11, team2Score: 8 },
        { gameNumber: 2, team1Score: 8, team2Score: 11 },
        { gameNumber: 3, team1Score: 11, team2Score: 7 },
      ],
      winnerId: 'team_05',
      nextMatchId: 'm_playoff_final',
      nextSlotIndex: 2,
    },
    // Chung kết Vô Địch: Thủ Đức Smashers vs Sài Gòn Lightning
    {
      id: 'm_playoff_final',
      tournamentId,
      stage: 'playoff',
      roundName: 'Chung Kết',
      roundIndex: 2,
      matchNumber: 15,
      team1Id: 'team_01',
      team2Id: 'team_05',
      status: 'in_progress',
      courtName: 'Sân 1 (Center)',
      scheduledTime: '14:30',
      scores: [
        { gameNumber: 1, team1Score: 11, team2Score: 9 },
        { gameNumber: 2, team1Score: 10, team2Score: 12 },
      ],
      winnerId: null,
    },
    // Tranh Hạng Ba: Phú Mỹ Hưng Dinks vs An Phú Dinking Aces
    {
      id: 'm_playoff_third',
      tournamentId,
      stage: 'playoff',
      roundName: 'Tranh Hạng 3',
      roundIndex: 2,
      matchNumber: 16,
      team1Id: 'team_06',
      team2Id: 'team_02',
      status: 'completed',
      courtName: 'Sân 2',
      scheduledTime: '13:30',
      scores: [
        { gameNumber: 1, team1Score: 11, team2Score: 8 },
        { gameNumber: 2, team1Score: 11, team2Score: 9 },
      ],
      winnerId: 'team_06',
      isThirdPlace: true,
    },
  ];

  return {
    tenantId: 'tenant_thuduc',
    schemaName: 'tenant_clb_thuduc_schema',
    tournaments: [sampleTournament],
    teams: sampleTeams,
    groups: [groupA, groupB],
    matches: sampleMatches,
  };
}

// Master DB operations
export const MasterDb = {
  getUsers(): MasterUser[] {
    const raw = localStorage.getItem(STORAGE_KEYS.MASTER_USERS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.MASTER_USERS, JSON.stringify(DEFAULT_USERS));
      return DEFAULT_USERS;
    }
    try {
      const users: MasterUser[] = JSON.parse(raw);
      // Backwards compatibility migration
      let modified = false;
      users.forEach((u) => {
        if (!u.permissions) {
          u.permissions = ROLE_DEFAULT_PERMISSIONS[u.role] || [];
          modified = true;
        }
        if (!u.assignedTenantIds) {
          u.assignedTenantIds = [u.currentTenantId];
          modified = true;
        }
        if (!u.status) {
          u.status = 'active';
          modified = true;
        }
        if (!u.dbAccessStatus) {
          u.dbAccessStatus = 'granted';
          modified = true;
        }
        if (!u.dbAccessType) {
          u.dbAccessType = u.role === 'organizer' ? 'isolated_new' : 'assigned_existing';
          modified = true;
        }
        if (!u.password) {
          u.password = '123';
          modified = true;
        }
        if (!u.temporaryPin) {
          u.temporaryPin = '1234';
          modified = true;
        }
        if (u.id === 'user_super_admin' || u.role === 'super_admin') {
          if (u.username !== 'admin') {
            u.username = 'admin';
            modified = true;
          }
        }
      });
      if (modified) {
        localStorage.setItem(STORAGE_KEYS.MASTER_USERS, JSON.stringify(users));
      }
      return users;
    } catch {
      return DEFAULT_USERS;
    }
  },

  saveUsers(users: MasterUser[]): void {
    localStorage.setItem(STORAGE_KEYS.MASTER_USERS, JSON.stringify(users));
  },

  isLoggedIn(): boolean {
    const val = localStorage.getItem(STORAGE_KEYS.IS_LOGGED_IN);
    // Return true by default if already authenticated, or if logged in flag is true
    return val === 'true';
  },

  setLoggedIn(val: boolean): void {
    localStorage.setItem(STORAGE_KEYS.IS_LOGGED_IN, val ? 'true' : 'false');
  },

  login(identifier: string, passwordInput: string): { success: boolean; user?: MasterUser; message?: string } {
    const users = this.getUsers();
    const cleanId = identifier.trim().toLowerCase();
    const cleanPass = passwordInput.trim();

    if (!cleanId) {
      return { success: false, message: 'Vui lòng nhập Tên đăng nhập (admin) hoặc Email.' };
    }

    const user = users.find(
      (u) =>
        (u.username && u.username.toLowerCase() === cleanId) ||
        u.email.toLowerCase() === cleanId ||
        u.id.toLowerCase() === cleanId ||
        u.fullName.toLowerCase() === cleanId ||
        (cleanId === 'admin' && (u.role === 'super_admin' || u.id === 'user_super_admin' || u.username === 'admin'))
    );

    if (!user) {
      return { success: false, message: 'Tài khoản không tồn tại trên hệ thống. Tên đăng nhập admin là "admin", mật khẩu "123".' };
    }

    if (user.status === 'suspended') {
      return { success: false, message: 'Tài khoản đã bị tạm khóa. Vui lòng liên hệ Super Admin.' };
    }

    const expectedPassword = user.password || '123';
    const matchesPassword = cleanPass === expectedPassword || cleanPass === user.temporaryPin;

    if (!matchesPassword) {
      return { success: false, message: 'Mật khẩu không chính xác. Mật khẩu mặc định hệ thống là: 123' };
    }

    this.setActiveUserId(user.id);
    this.setLoggedIn(true);
    return { success: true, user };
  },

  logout(): void {
    this.setLoggedIn(false);
  },

  getActiveUserId(): string {
    const stored = localStorage.getItem(STORAGE_KEYS.ACTIVE_USER_ID);
    if (stored) return stored;
    // Default to Super Admin so user has full capabilities out of the box
    localStorage.setItem(STORAGE_KEYS.ACTIVE_USER_ID, 'user_super_admin');
    return 'user_super_admin';
  },

  setActiveUserId(id: string): void {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_USER_ID, id);
    // Also auto-switch active tenant to the user's current tenant
    const user = this.getUsers().find((u) => u.id === id);
    if (user && user.currentTenantId) {
      this.setActiveTenantId(user.currentTenantId);
    }
  },

  getActiveUser(): MasterUser {
    const users = this.getUsers();
    const activeId = this.getActiveUserId();
    return users.find((u) => u.id === activeId) || users[0] || DEFAULT_USERS[0];
  },

  hasPermission(user: MasterUser | null, perm: UserPermission): boolean {
    if (!user) return false;
    if (user.role === 'super_admin') return true;
    if (user.status === 'suspended') return false;
    // If DB access has been revoked or pending, block mutating operations
    if (user.dbAccessStatus !== 'granted') {
      if (perm === 'input_scores' || perm === 'manage_teams_excel' || perm === 'schedule_groups' || perm === 'manage_tournaments' || perm === 'manage_database') {
        return false;
      }
    }
    return user.permissions?.includes(perm) || false;
  },

  setDbAccessStatus(userId: string, status: 'granted' | 'pending' | 'revoked'): void {
    const users = this.getUsers().map((u) => (u.id === userId ? { ...u, dbAccessStatus: status } : u));
    this.saveUsers(users);
  },

  createUser(data: {
    username?: string;
    email: string;
    fullName: string;
    role: UserRole;
    currentTenantId: string;
    password?: string;
    assignedTenantIds?: string[];
    permissions?: UserPermission[];
    plan?: 'Starter' | 'Pro' | 'Enterprise';
    dbAccessStatus?: 'granted' | 'pending' | 'revoked';
    dbAccessType?: 'isolated_new' | 'assigned_existing';
    temporaryPin?: string;
    notes?: string;
    autoCreateIsolatedDb?: boolean;
    newTenantOrgName?: string;
  }): { user: MasterUser; tenant?: Tenant } {
    let tenantId = data.currentTenantId;
    let createdTenant: Tenant | undefined = undefined;

    // If requested, auto-provision an isolated tenant schema for this user
    if (data.autoCreateIsolatedDb && data.newTenantOrgName) {
      createdTenant = this.createTenant(data.newTenantOrgName, data.email, data.fullName);
      tenantId = createdTenant.id;
    }

    const newUserId = `user_${Date.now().toString().slice(-6)}`;
    const effectivePermissions =
      data.permissions || ROLE_DEFAULT_PERMISSIONS[data.role] || [];
    const assigned = data.assignedTenantIds || [tenantId];
    if (!assigned.includes(tenantId)) {
      assigned.push(tenantId);
    }

    const newUser: MasterUser = {
      id: newUserId,
      username: data.username?.trim() || data.email.trim().split('@')[0],
      email: data.email.trim(),
      fullName: data.fullName.trim(),
      role: data.role,
      password: data.password?.trim() || '123',
      currentTenantId: tenantId,
      assignedTenantIds: assigned,
      permissions: effectivePermissions,
      status: 'active',
      dbAccessStatus: data.dbAccessStatus || 'granted',
      dbAccessType: data.dbAccessType || (data.autoCreateIsolatedDb ? 'isolated_new' : 'assigned_existing'),
      temporaryPin: data.temporaryPin || '1234',
      notes: data.notes || '',
      plan: data.plan || 'Pro',
      createdAt: new Date().toISOString(),
    };

    const users = this.getUsers();
    users.push(newUser);
    this.saveUsers(users);

    return { user: newUser, tenant: createdTenant };
  },

  updateUser(updated: MasterUser): void {
    const users = this.getUsers().map((u) => (u.id === updated.id ? updated : u));
    this.saveUsers(users);
  },

  changeUserPassword(
    userId: string,
    newPassword: string,
    oldPassword?: string,
    forceByAdmin = false,
    newPin?: string
  ): { success: boolean; message: string; updatedUser?: MasterUser } {
    const users = this.getUsers();
    const userIndex = users.findIndex((u) => u.id === userId);
    if (userIndex === -1) {
      return { success: false, message: 'Không tìm thấy tài khoản người dùng.' };
    }

    const targetUser = users[userIndex];

    // If not forced by admin, check old password
    if (!forceByAdmin) {
      const currentPass = targetUser.password || '123';
      const cleanOld = (oldPassword || '').trim();
      if (cleanOld !== currentPass && cleanOld !== targetUser.temporaryPin) {
        return { success: false, message: 'Mật khẩu hiện tại không chính xác.' };
      }
    }

    const cleanNewPass = newPassword.trim();
    if (!cleanNewPass) {
      return { success: false, message: 'Vui lòng nhập mật khẩu mới.' };
    }
    if (cleanNewPass.length < 3) {
      return { success: false, message: 'Mật khẩu mới phải có ít nhất 3 ký tự.' };
    }

    targetUser.password = cleanNewPass;
    if (newPin && newPin.trim()) {
      targetUser.temporaryPin = newPin.trim();
    }

    users[userIndex] = { ...targetUser };
    this.saveUsers(users);

    return {
      success: true,
      message: `Đổi mật khẩu thành công cho tài khoản ${targetUser.fullName}!`,
      updatedUser: users[userIndex],
    };
  },

  resetUserPasswordToDefault(userId: string): { success: boolean; message: string; updatedUser?: MasterUser } {
    return this.changeUserPassword(userId, '123', undefined, true, '1234');
  },

  deleteUser(userId: string): void {
    const users = this.getUsers().filter((u) => u.id !== userId);
    this.saveUsers(users);
  },

  getTenants(): Tenant[] {
    const raw = localStorage.getItem(STORAGE_KEYS.MASTER_TENANTS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.MASTER_TENANTS, JSON.stringify(DEFAULT_TENANTS));
      return DEFAULT_TENANTS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return DEFAULT_TENANTS;
    }
  },

  getActiveTenantId(): string {
    const stored = localStorage.getItem(STORAGE_KEYS.ACTIVE_TENANT_ID);
    if (stored) return stored;
    localStorage.setItem(STORAGE_KEYS.ACTIVE_TENANT_ID, 'tenant_thuduc');
    return 'tenant_thuduc';
  },

  setActiveTenantId(id: string): void {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_TENANT_ID, id);
  },

  getActiveTenant(): Tenant {
    const tenants = this.getTenants();
    const activeId = this.getActiveTenantId();
    return tenants.find((t) => t.id === activeId) || tenants[0];
  },

  createTenant(orgName: string, userEmail: string, userName: string): Tenant {
    const slug = orgName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    const newId = `tenant_${slug}_${Date.now().toString().slice(-4)}`;
    const newUserId = `user_${slug}_${Date.now().toString().slice(-4)}`;
    const schemaName = `tenant_${slug.replace(/-/g, '_')}_schema`;

    const newTenant: Tenant = {
      id: newId,
      userId: newUserId,
      orgName,
      slug,
      schemaName,
      dbConnectionString: `postgresql://${slug}_user:***@pg-cluster.picklepall.internal:5432/${slug}_db`,
      createdAt: new Date().toISOString(),
      storageBytes: 15400,
    };

    const newUser: MasterUser = {
      id: newUserId,
      email: userEmail,
      fullName: userName,
      role: 'organizer',
      currentTenantId: newId,
      assignedTenantIds: [newId],
      permissions: [...ROLE_DEFAULT_PERMISSIONS.organizer],
      status: 'active',
      dbAccessStatus: 'granted',
      dbAccessType: 'isolated_new',
      temporaryPin: '8888',
      notes: 'Trưởng ban tổ chức (BTC) giải đấu',
      plan: 'Pro',
      createdAt: new Date().toISOString(),
    };

    const users = this.getUsers();
    users.push(newUser);
    this.saveUsers(users);

    const tenants = this.getTenants();
    tenants.push(newTenant);
    localStorage.setItem(STORAGE_KEYS.MASTER_TENANTS, JSON.stringify(tenants));

    // Initialize isolated Tenant DB
    const emptyTenantDb: TenantDatabase = {
      tenantId: newId,
      schemaName,
      tournaments: [],
      teams: [],
      groups: [],
      matches: [],
    };
    TenantDb.saveDatabase(newId, emptyTenantDb);

    this.setActiveTenantId(newId);
    return newTenant;
  },
};

// Tenant DB operations (Isolated Per Tenant)
export const TenantDb = {
  getDatabase(tenantId: string): TenantDatabase {
    const key = `${STORAGE_KEYS.TENANT_DB_PREFIX}${tenantId}`;
    const raw = localStorage.getItem(key);

    if (!raw) {
      if (tenantId === 'tenant_thuduc') {
        const seed = createSampleThuducDatabase();
        localStorage.setItem(key, JSON.stringify(seed));
        return seed;
      }
      const tenant = MasterDb.getTenants().find((t) => t.id === tenantId);
      const emptyDb: TenantDatabase = {
        tenantId,
        schemaName: tenant?.schemaName || `tenant_${tenantId}_schema`,
        tournaments: [],
        teams: [],
        groups: [],
        matches: [],
      };
      localStorage.setItem(key, JSON.stringify(emptyDb));
      return emptyDb;
    }

    try {
      const parsed: TenantDatabase = JSON.parse(raw);
      if (parsed.tournaments) {
        parsed.tournaments.forEach((t) => {
          if (!t.stageRules) {
            t.stageRules = { ...DEFAULT_STAGE_RULES };
          }
        });
      }
      return parsed;
    } catch {
      return {
        tenantId,
        schemaName: `tenant_${tenantId}_schema`,
        tournaments: [],
        teams: [],
        groups: [],
        matches: [],
      };
    }
  },

  saveDatabase(tenantId: string, db: TenantDatabase): void {
    const key = `${STORAGE_KEYS.TENANT_DB_PREFIX}${tenantId}`;
    const json = JSON.stringify(db);
    localStorage.setItem(key, json);

    // Update storage size in master metadata
    const tenants = MasterDb.getTenants();
    const current = tenants.find((t) => t.id === tenantId);
    if (current) {
      current.storageBytes = new Blob([json]).size;
      localStorage.setItem(STORAGE_KEYS.MASTER_TENANTS, JSON.stringify(tenants));
    }
  },

  // Export isolated DB as JSON file
  exportAsJson(tenantId: string): string {
    const db = this.getDatabase(tenantId);
    return JSON.stringify(db, null, 2);
  },

  // Export isolated DB as PostgreSQL SQL DDL / DML file
  exportAsSql(tenantId: string): string {
    const db = this.getDatabase(tenantId);
    const tenant = MasterDb.getTenants().find((t) => t.id === tenantId);
    const schema = tenant?.schemaName || 'tenant_schema';

    let sql = `-- ==========================================================\n`;
    sql += `-- PICKLEBALL TOURNAMENT PRO - TENANT ISOLATED DATABASE EXPORT\n`;
    sql += `-- Tenant ID: ${tenantId} | Organization: ${tenant?.orgName || 'BTC'}\n`;
    sql += `-- Target Schema: ${schema}\n`;
    sql += `-- Generated At: ${new Date().toISOString()}\n`;
    sql += `-- ==========================================================\n\n`;

    sql += `CREATE SCHEMA IF NOT EXISTS "${schema}";\n`;
    sql += `SET search_path TO "${schema}", public;\n\n`;

    sql += `-- Table: tournaments\n`;
    sql += `CREATE TABLE IF NOT EXISTS "${schema}".tournaments (\n`;
    sql += `    id VARCHAR(64) PRIMARY KEY,\n`;
    sql += `    name VARCHAR(255) NOT NULL,\n`;
    sql += `    category VARCHAR(32) NOT NULL,\n`;
    sql += `    format VARCHAR(32) NOT NULL,\n`;
    sql += `    status VARCHAR(32) NOT NULL,\n`;
    sql += `    courts_count INT NOT NULL DEFAULT 4,\n`;
    sql += `    match_format VARCHAR(32) NOT NULL DEFAULT 'best_of_3',\n`;
    sql += `    points_per_game INT NOT NULL DEFAULT 11,\n`;
    sql += `    win_by_two BOOLEAN NOT NULL DEFAULT TRUE,\n`;
    sql += `    points_per_win INT NOT NULL DEFAULT 3,\n`;
    sql += `    points_per_loss INT NOT NULL DEFAULT 0,\n`;
    sql += `    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()\n`;
    sql += `);\n\n`;

    db.tournaments.forEach((t) => {
      sql += `INSERT INTO "${schema}".tournaments (id, name, category, format, status, courts_count, match_format, points_per_game, win_by_two, points_per_win, points_per_loss) VALUES\n`;
      sql += `('${t.id}', '${t.name.replace(/'/g, "''")}', '${t.category}', '${t.format}', '${t.status}', ${t.courtsCount}, '${t.matchFormat}', ${t.pointsPerGame}, ${t.winByTwo}, ${t.pointsPerWin}, ${t.pointsPerLoss})\n`;
      sql += `ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, status = EXCLUDED.status;\n\n`;
    });

    sql += `-- Table: teams\n`;
    sql += `CREATE TABLE IF NOT EXISTS "${schema}".teams (\n`;
    sql += `    id VARCHAR(64) PRIMARY KEY,\n`;
    sql += `    tournament_id VARCHAR(64) REFERENCES "${schema}".tournaments(id) ON DELETE CASCADE,\n`;
    sql += `    code VARCHAR(32) NOT NULL,\n`;
    sql += `    name VARCHAR(255) NOT NULL,\n`;
    sql += `    player1 VARCHAR(128) NOT NULL,\n`;
    sql += `    player2 VARCHAR(128),\n`;
    sql += `    seed INT\n`;
    sql += `);\n\n`;

    db.teams.forEach((tm) => {
      sql += `INSERT INTO "${schema}".teams (id, tournament_id, code, name, player1, player2, seed) VALUES\n`;
      sql += `('${tm.id}', '${tm.tournamentId}', '${tm.code}', '${tm.name.replace(/'/g, "''")}', '${tm.player1.replace(/'/g, "''")}', ${tm.player2 ? `'${tm.player2.replace(/'/g, "''")}'` : 'NULL'}, ${tm.seed || 'NULL'});\n`;
    });

    sql += `\n-- Table: matches\n`;
    sql += `CREATE TABLE IF NOT EXISTS "${schema}".matches (\n`;
    sql += `    id VARCHAR(64) PRIMARY KEY,\n`;
    sql += `    tournament_id VARCHAR(64) REFERENCES "${schema}".tournaments(id) ON DELETE CASCADE,\n`;
    sql += `    stage VARCHAR(32) NOT NULL,\n`;
    sql += `    group_id VARCHAR(64),\n`;
    sql += `    round_name VARCHAR(64) NOT NULL,\n`;
    sql += `    team1_id VARCHAR(64),\n`;
    sql += `    team2_id VARCHAR(64),\n`;
    sql += `    status VARCHAR(32) NOT NULL,\n`;
    sql += `    court_name VARCHAR(64),\n`;
    sql += `    winner_id VARCHAR(64),\n`;
    sql += `    score_data JSONB\n`;
    sql += `);\n`;

    return sql;
  },

  importFromJson(tenantId: string, jsonString: string): boolean {
    try {
      const parsed: TenantDatabase = JSON.parse(jsonString);
      if (!parsed.tournaments || !parsed.teams) {
        throw new Error('Dữ liệu không đúng cấu trúc Tenant Database');
      }
      parsed.tenantId = tenantId;
      this.saveDatabase(tenantId, parsed);
      return true;
    } catch (e) {
      console.error('Import error:', e);
      return false;
    }
  },

  resetDatabase(tenantId: string): void {
    if (tenantId === 'tenant_thuduc') {
      const fresh = createSampleThuducDatabase();
      this.saveDatabase(tenantId, fresh);
    } else {
      const tenant = MasterDb.getTenants().find((t) => t.id === tenantId);
      const emptyDb: TenantDatabase = {
        tenantId,
        schemaName: tenant?.schemaName || `tenant_${tenantId}_schema`,
        tournaments: [],
        teams: [],
        groups: [],
        matches: [],
      };
      this.saveDatabase(tenantId, emptyDb);
    }
  },
};
