/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar.tsx';
import { DashboardOverview } from './components/DashboardOverview.tsx';
import { TeamsExcelManager } from './components/TeamsExcelManager.tsx';
import { GroupsScheduler } from './components/GroupsScheduler.tsx';
import { StandingsTable } from './components/StandingsTable.tsx';
import { BracketView } from './components/BracketView.tsx';
import { TenantDbInspectorModal } from './components/TenantDbInspectorModal.tsx';
import { TournamentConfigModal } from './components/TournamentConfigModal.tsx';
import { ScoreInputModal } from './components/ScoreInputModal.tsx';
import { RefereePrintModal } from './components/RefereePrintModal.tsx';
import { TenantSwitcherModal } from './components/TenantSwitcherModal.tsx';
import { AdminUserPermissions } from './components/AdminUserPermissions.tsx';
import { AdminLoginPage } from './components/AdminLoginPage.tsx';
import { AccountProvisionModal } from './components/AccountProvisionModal.tsx';
import { DeleteTournamentModal } from './components/DeleteTournamentModal.tsx';

import {
  Tournament,
  Team,
  Group,
  Match,
  Tenant,
  TenantDatabase,
  GameScore,
  MasterUser,
} from './types/tournament.ts';
import { MasterDb, TenantDb } from './services/storage.ts';
import { BracketService } from './services/bracketService.ts';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => MasterDb.isLoggedIn());
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [currentUser, setCurrentUser] = useState<MasterUser>(() => MasterDb.getActiveUser());
  const [activeTenant, setActiveTenant] = useState<Tenant>(() => MasterDb.getActiveTenant());
  const [tenantDb, setTenantDb] = useState<TenantDatabase>(() =>
    TenantDb.getDatabase(MasterDb.getActiveTenantId())
  );

  // Modals state
  const [showTournamentConfigModal, setShowTournamentConfigModal] = useState<boolean>(false);
  const [tournamentToEdit, setTournamentToEdit] = useState<Tournament | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [tournamentToDelete, setTournamentToDelete] = useState<Tournament | null>(null);
  const [showScoreModal, setShowScoreModal] = useState<boolean>(false);
  const [selectedMatchForScore, setSelectedMatchForScore] = useState<Match | null>(null);
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);
  const [showTenantModal, setShowTenantModal] = useState<boolean>(false);
  const [showProvisionModal, setShowProvisionModal] = useState<boolean>(false);

  // Current primary tournament of active tenant
  const currentTournament: Tournament | null = tenantDb.tournaments[0] || null;

  // Refresh DB state when tenant changes
  const reloadTenantData = (tenantId: string) => {
    MasterDb.setActiveTenantId(tenantId);
    const tenant = MasterDb.getActiveTenant();
    setActiveTenant(tenant);
    const db = TenantDb.getDatabase(tenantId);
    setTenantDb(db);
  };

  const handleSwitchTenant = (tenantId: string) => {
    reloadTenantData(tenantId);
  };

  // Switch logged-in user session (Impersonate / RBAC testing)
  const handleSwitchUserSession = (userId: string) => {
    MasterDb.setActiveUserId(userId);
    const user = MasterDb.getActiveUser();
    setCurrentUser(user);
    if (user.currentTenantId) {
      reloadTenantData(user.currentTenantId);
    }
  };

  // Login handler
  const handleLoginSuccess = (user: MasterUser) => {
    setIsLoggedIn(true);
    setCurrentUser(user);
    if (user.currentTenantId) {
      reloadTenantData(user.currentTenantId);
    }
  };

  // Logout handler
  const handleLogout = () => {
    MasterDb.logout();
    setIsLoggedIn(false);
  };

  // Save updated tenant database
  const persistTenantDatabase = (updatedDb: TenantDatabase) => {
    TenantDb.saveDatabase(activeTenant.id, updatedDb);
    setTenantDb({ ...updatedDb });
  };

  // Tournament Save with Organizer Ownership Verification
  const handleSaveTournament = (tournamentData: Tournament) => {
    if (!MasterDb.hasPermission(currentUser, 'manage_tournaments')) {
      alert('Tài khoản hiện tại không có quyền quản lý giải đấu.');
      return;
    }

    const existingIndex = tenantDb.tournaments.findIndex((t) => t.id === tournamentData.id);
    const isExisting = existingIndex >= 0;

    if (isExisting) {
      const existing = tenantDb.tournaments[existingIndex];
      const isOwner =
        currentUser.role === 'super_admin' ||
        (currentUser.role === 'organizer' &&
          (!existing.creatorId ||
            existing.creatorId === currentUser.id ||
            activeTenant.userId === currentUser.id));

      if (!isOwner) {
        alert(
          `Bạn không có quyền sửa thông tin giải đấu "${existing.name}". Chỉ Trưởng Ban Tổ Chức (BTC) tạo giải mới có quyền sửa.`
        );
        return;
      }
      // Preserve original creator
      tournamentData.creatorId = existing.creatorId || currentUser.id;
      tournamentData.creatorName = existing.creatorName || currentUser.fullName;
    } else {
      // New tournament - explicitly tag current user as creator
      tournamentData.creatorId = currentUser.id;
      tournamentData.creatorName = currentUser.fullName;
    }

    let updatedTournaments = [...tenantDb.tournaments];
    if (isExisting) {
      updatedTournaments[existingIndex] = tournamentData;
    } else {
      updatedTournaments = [tournamentData, ...updatedTournaments];
    }

    persistTenantDatabase({
      ...tenantDb,
      tournaments: updatedTournaments,
    });
  };

  // Tournament Delete with Organizer Creator Authorization
  const handleDeleteTournament = (tournamentId: string) => {
    const target = tenantDb.tournaments.find((t) => t.id === tournamentId);
    if (!target) return;

    const isOwner =
      currentUser.role === 'super_admin' ||
      (currentUser.role === 'organizer' &&
        (!target.creatorId ||
          target.creatorId === currentUser.id ||
          activeTenant.userId === currentUser.id));

    if (!isOwner) {
      alert(
        `Bạn không có quyền xóa giải đấu "${target.name}". Chỉ Trưởng Ban Tổ Chức (BTC) tạo giải mới có quyền xóa.`
      );
      return;
    }

    const remainingTournaments = tenantDb.tournaments.filter((t) => t.id !== tournamentId);
    const remainingTeams = tenantDb.teams.filter((t) => t.tournamentId !== tournamentId);
    const remainingGroups = tenantDb.groups.filter((g) => g.tournamentId !== tournamentId);
    const remainingMatches = tenantDb.matches.filter((m) => m.tournamentId !== tournamentId);

    persistTenantDatabase({
      ...tenantDb,
      tournaments: remainingTournaments,
      teams: remainingTeams,
      groups: remainingGroups,
      matches: remainingMatches,
    });
  };

  // Teams Save
  const handleSaveTeams = (newTeams: Team[]) => {
    if (!MasterDb.hasPermission(currentUser, 'manage_teams_excel')) {
      alert('Tài khoản hiện tại không có quyền chỉnh sửa danh sách VĐV.');
      return;
    }
    persistTenantDatabase({
      ...tenantDb,
      teams: newTeams,
    });
  };

  const handleUpdateTeam = (updatedTeam: Team) => {
    if (!MasterDb.hasPermission(currentUser, 'manage_teams_excel')) {
      alert('Tài khoản hiện tại không có quyền chỉnh sửa danh sách VĐV.');
      return;
    }
    const newTeams = tenantDb.teams.map((t) => (t.id === updatedTeam.id ? updatedTeam : t));
    persistTenantDatabase({
      ...tenantDb,
      teams: newTeams,
    });
  };

  const handleDeleteTeam = (teamId: string) => {
    if (!MasterDb.hasPermission(currentUser, 'manage_teams_excel')) {
      alert('Tài khoản hiện tại không có quyền xóa VĐV.');
      return;
    }
    const newTeams = tenantDb.teams.filter((t) => t.id !== teamId);
    persistTenantDatabase({
      ...tenantDb,
      teams: newTeams,
    });
  };

  // Groups and Matches Save
  const handleUpdateGroupsAndMatches = (newGroups: Group[], newMatches: Match[]) => {
    if (!MasterDb.hasPermission(currentUser, 'schedule_groups')) {
      alert('Tài khoản hiện tại không có quyền bốc thăm hoặc lập lịch thi đấu.');
      return;
    }
    persistTenantDatabase({
      ...tenantDb,
      groups: newGroups,
      matches: newMatches,
    });
  };

  // Score recording handler with playoff automatic winner advancement
  const handleSaveScore = (
    matchId: string,
    scores: GameScore[],
    winnerId: string | null,
    status: 'scheduled' | 'in_progress' | 'completed'
  ) => {
    if (!MasterDb.hasPermission(currentUser, 'input_scores')) {
      alert('Tài khoản hiện tại không có quyền ghi nhận tỷ số trận đấu.');
      return;
    }

    const updatedMatches = [...tenantDb.matches];
    const matchIndex = updatedMatches.findIndex((m) => m.id === matchId);
    if (matchIndex === -1) return;

    const currentMatch = { ...updatedMatches[matchIndex] };
    currentMatch.scores = scores;
    currentMatch.winnerId = winnerId;
    currentMatch.status = status;
    updatedMatches[matchIndex] = currentMatch;

    // If playoff match completed and has nextMatchId, advance winner!
    if (winnerId && currentMatch.nextMatchId) {
      const nextIdx = updatedMatches.findIndex((m) => m.id === currentMatch.nextMatchId);
      if (nextIdx >= 0) {
        const nextMatch = { ...updatedMatches[nextIdx] };
        if (currentMatch.nextSlotIndex === 1) {
          nextMatch.team1Id = winnerId;
        } else if (currentMatch.nextSlotIndex === 2) {
          nextMatch.team2Id = winnerId;
        }
        updatedMatches[nextIdx] = nextMatch;
      }
    }

    // If semi-final, also advance loser to bronze match (m_playoff_third)
    if (winnerId && currentMatch.roundName.includes('Bán Kết')) {
      const loserId = winnerId === currentMatch.team1Id ? currentMatch.team2Id : currentMatch.team1Id;
      const thirdIdx = updatedMatches.findIndex((m) => m.isThirdPlace);
      if (thirdIdx >= 0 && loserId) {
        const thirdMatch = { ...updatedMatches[thirdIdx] };
        if (currentMatch.roundName.includes('1')) {
          thirdMatch.team1Id = loserId;
        } else {
          thirdMatch.team2Id = loserId;
        }
        updatedMatches[thirdIdx] = thirdMatch;
      }
    }

    persistTenantDatabase({
      ...tenantDb,
      matches: updatedMatches,
    });
  };

  // Generate Playoff Bracket from group standings
  const handleGeneratePlayoffFromStandings = (
    qualifiedTeams: { teamId: string; groupRank: string }[]
  ) => {
    if (!MasterDb.hasPermission(currentUser, 'schedule_groups')) {
      alert('Tài khoản hiện tại không có quyền xếp nhánh Playoff.');
      return;
    }

    if (!currentTournament) return;
    if (qualifiedTeams.length < 2) {
      alert('Chưa có đủ số đội hoàn thành vòng bảng để xếp nhánh Playoff.');
      return;
    }

    const startingMatchNum =
      tenantDb.matches.filter((m) => m.stage === 'group').length + 1;

    const playoffMatches = BracketService.generatePlayoffBracket(
      currentTournament,
      qualifiedTeams,
      startingMatchNum
    );

    // Keep group matches, replace playoff matches
    const nonPlayoff = tenantDb.matches.filter((m) => m.stage !== 'playoff');
    persistTenantDatabase({
      ...tenantDb,
      matches: [...nonPlayoff, ...playoffMatches],
    });

    setActiveTab('bracket');
  };

  // Regenerate bracket manually
  const handleRegenerateBracket = () => {
    if (!MasterDb.hasPermission(currentUser, 'schedule_groups')) {
      alert('Tài khoản hiện tại không có quyền tạo nhánh Playoff.');
      return;
    }
    if (!currentTournament) return;
    const topTeams = tenantDb.teams.slice(0, 4).map((t, idx) => ({
      teamId: t.id,
      groupRank: `Hạt giống #${idx + 1}`,
    }));
    handleGeneratePlayoffFromStandings(topTeams);
  };

  const teamsMap = tenantDb.teams.reduce<Record<string, Team>>((acc, t) => {
    acc[t.id] = t;
    return acc;
  }, {});

  // Guard score modal opening with RBAC permission check
  const handleOpenScoreModal = (match: Match) => {
    if (!MasterDb.hasPermission(currentUser, 'input_scores')) {
      alert(
        `Tài khoản "${currentUser.fullName}" (${currentUser.role}) chỉ có quyền xem (Read-only), không được phép ghi nhận tỷ số trận đấu.`
      );
      return;
    }
    setSelectedMatchForScore(match);
    setShowScoreModal(true);
  };

  if (!isLoggedIn) {
    return <AdminLoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Navbar Contract */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeTenant={activeTenant}
        currentUser={currentUser}
        onOpenTenantModal={() => setShowTenantModal(true)}
        onOpenNewTournamentModal={() => {
          setTournamentToEdit(null);
          setShowTournamentConfigModal(true);
        }}
        onOpenProvisionModal={() => setShowProvisionModal(true)}
        onLogout={handleLogout}
      />

      {/* Database Access Status or Role Restriction Banner */}
      {currentUser.dbAccessStatus !== 'granted' ? (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 text-xs text-amber-900">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="font-semibold flex items-center gap-1.5">
              ⚠️ Tài khoản &ldquo;{currentUser.fullName}&rdquo; đang ở trạng thái {currentUser.dbAccessStatus === 'pending' ? 'Chờ Cấp Quyền Database Riêng' : 'Đã Thu Hồi Quyền Database'}. Mọi thao tác ghi điểm hoặc chỉnh sửa bị tạm khóa.
            </span>
            <button
              onClick={() => setActiveTab('users')}
              className="text-xs font-bold text-amber-800 hover:text-amber-950 underline self-start sm:self-auto"
            >
              Vào Phân Quyền Cấp DB ➔
            </button>
          </div>
        </div>
      ) : currentUser.role === 'referee' ? (
        <div className="bg-emerald-50 border-b border-emerald-200 px-4 py-2 text-xs text-emerald-900">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <span className="font-medium flex items-center gap-1.5">
              🎾 Phiên Trọng Tài: Tài khoản &ldquo;{currentUser.fullName}&rdquo; được cấp quyền: <strong>Chỉ Nhập Tỷ Số & In Phiếu Điểm</strong> trên Database {activeTenant.orgName}.
            </span>
            <button
              onClick={() => setActiveTab('users')}
              className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 underline"
            >
              Đổi vai trò
            </button>
          </div>
        </div>
      ) : currentUser.role === 'viewer' ? (
        <div className="bg-sky-50 border-b border-sky-200 px-4 py-2 text-xs text-sky-900">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <span className="font-medium flex items-center gap-1.5">
              👁️ Phiên Khách Xem: Tài khoản &ldquo;{currentUser.fullName}&rdquo; được cấp quyền: <strong>Chỉ Xem Bảng Đấu & BXH (Read-Only)</strong>.
            </span>
            <button
              onClick={() => setActiveTab('users')}
              className="text-[11px] font-semibold text-sky-700 hover:text-sky-900 underline"
            >
              Đổi vai trò
            </button>
          </div>
        </div>
      ) : null}

      {/* Main Viewport Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && (
          <DashboardOverview
            tournament={currentTournament}
            teams={tenantDb.teams}
            matches={tenantDb.matches}
            activeTenant={activeTenant}
            currentUser={currentUser}
            onNavigateTab={setActiveTab}
            onOpenScoreModal={handleOpenScoreModal}
            onOpenPrintModal={() => setShowPrintModal(true)}
            onOpenEditTournamentModal={() => {
              setTournamentToEdit(currentTournament);
              setShowTournamentConfigModal(true);
            }}
            onOpenDeleteTournamentModal={() => {
              setTournamentToDelete(currentTournament);
              setShowDeleteModal(true);
            }}
            onOpenNewTournamentModal={() => {
              setTournamentToEdit(null);
              setShowTournamentConfigModal(true);
            }}
          />
        )}

        {activeTab === 'teams' && (
          <TeamsExcelManager
            tournament={currentTournament}
            teams={tenantDb.teams}
            onSaveTeams={handleSaveTeams}
            onUpdateTeam={handleUpdateTeam}
            onDeleteTeam={handleDeleteTeam}
          />
        )}

        {activeTab === 'groups' && (
          <GroupsScheduler
            tournament={currentTournament}
            groups={tenantDb.groups}
            matches={tenantDb.matches}
            teams={tenantDb.teams}
            onUpdateGroupsAndMatches={handleUpdateGroupsAndMatches}
            onOpenScoreModal={(match) => {
              setSelectedMatchForScore(match);
              setShowScoreModal(true);
            }}
          />
        )}

        {activeTab === 'standings' && (
          <StandingsTable
            tournament={currentTournament}
            groups={tenantDb.groups}
            matches={tenantDb.matches}
            teams={tenantDb.teams}
            onGeneratePlayoffFromStandings={handleGeneratePlayoffFromStandings}
          />
        )}

        {activeTab === 'bracket' && (
          <BracketView
            tournament={currentTournament}
            matches={tenantDb.matches}
            teams={tenantDb.teams}
            onOpenScoreModal={(match) => {
              setSelectedMatchForScore(match);
              setShowScoreModal(true);
            }}
            onRegenerateBracket={handleRegenerateBracket}
          />
        )}

        {activeTab === 'database' && (
          <TenantDbInspectorModal
            activeTenant={activeTenant}
            onSwitchTenant={handleSwitchTenant}
            onDatabaseChanged={() => reloadTenantData(activeTenant.id)}
          />
        )}

        {activeTab === 'users' && (
          <AdminUserPermissions
            currentUser={currentUser}
            activeTenant={activeTenant}
            onUserChanged={(updated) => setCurrentUser(updated)}
            onSwitchUserSession={handleSwitchUserSession}
            onOpenProvisionModal={() => setShowProvisionModal(true)}
          />
        )}
      </main>

      {/* Modals */}
      {showTournamentConfigModal && (
        <TournamentConfigModal
          currentTournament={tournamentToEdit}
          currentUser={currentUser}
          activeTenant={activeTenant}
          onClose={() => {
            setShowTournamentConfigModal(false);
            setTournamentToEdit(null);
          }}
          onSaveTournament={handleSaveTournament}
          onDeleteTournament={(trnId) => {
            const trn = tenantDb.tournaments.find((t) => t.id === trnId);
            setTournamentToDelete(trn || null);
            setShowDeleteModal(true);
          }}
        />
      )}

      {showDeleteModal && tournamentToDelete && (
        <DeleteTournamentModal
          isOpen={showDeleteModal}
          tournament={tournamentToDelete}
          activeTenant={activeTenant}
          currentUser={currentUser}
          teamsCount={tenantDb.teams.filter((t) => t.tournamentId === tournamentToDelete.id).length}
          matchesCount={tenantDb.matches.filter((m) => m.tournamentId === tournamentToDelete.id).length}
          onClose={() => {
            setShowDeleteModal(false);
            setTournamentToDelete(null);
          }}
          onConfirmDelete={(trnId) => {
            handleDeleteTournament(trnId);
            setShowDeleteModal(false);
            setTournamentToDelete(null);
          }}
        />
      )}

      {showScoreModal && selectedMatchForScore && currentTournament && (
        <ScoreInputModal
          match={selectedMatchForScore}
          tournament={currentTournament}
          teamsMap={teamsMap}
          onClose={() => {
            setShowScoreModal(false);
            setSelectedMatchForScore(null);
          }}
          onSaveScore={handleSaveScore}
        />
      )}

      {showPrintModal && currentTournament && (
        <RefereePrintModal
          tournament={currentTournament}
          matches={tenantDb.matches}
          teamsMap={teamsMap}
          onClose={() => setShowPrintModal(false)}
        />
      )}

      {showTenantModal && (
        <TenantSwitcherModal
          activeTenant={activeTenant}
          onSelectTenant={handleSwitchTenant}
          onOpenNewTenant={() => {
            setActiveTab('users');
          }}
          onClose={() => setShowTenantModal(false)}
        />
      )}

      {showProvisionModal && (
        <AccountProvisionModal
          activeTenant={activeTenant}
          onClose={() => setShowProvisionModal(false)}
          onAccountProvisioned={(newUser) => {
            reloadTenantData(newUser.currentTenantId || activeTenant.id);
          }}
          onSwitchUser={(userId) => {
            handleSwitchUserSession(userId);
          }}
        />
      )}
    </div>
  );
}
