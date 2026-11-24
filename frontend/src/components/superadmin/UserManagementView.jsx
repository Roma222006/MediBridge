import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import {
  Users,
  Search,
  Filter,
  UserCheck,
  Stethoscope,
  Building2,
  ShieldCheck,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  RefreshCw,
  X,
  Lock,
  Calendar,
  Phone,
  Mail,
  ShieldAlert
} from 'lucide-react';

export default function UserManagementView({ onToast }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  // Selected User Detail Modal
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetailData, setUserDetailData] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Suspension / Status Modal (Scenario 3)
  const [statusTargetUser, setStatusTargetUser] = useState(null);
  const [targetStatus, setTargetStatus] = useState('SUSPENDED');
  const [statusReason, setStatusReason] = useState('');
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [actionSubmitting, setActionSubmitting] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: pageSize
      };
      if (searchTerm.trim()) params.search = searchTerm.trim();
      if (filterRole !== 'ALL') params.role = filterRole;
      if (filterStatus !== 'ALL') params.accountStatus = filterStatus;

      const res = await api.get('/super-admin/users', { params });
      if (res.data?.success) {
        setUsers(res.data.data.users || []);
        setTotalCount(res.data.data.pagination?.total || 0);
      }
    } catch (err) {
      console.error('[User Management] Error loading users:', err);
      if (onToast) onToast('Failed to load platform user accounts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [currentPage, filterRole, filterStatus]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchUsers();
  };

  const handleOpenDetail = async (user) => {
    setSelectedUser(user);
    setShowDetailModal(true);
    setLoadingDetail(true);
    try {
      const res = await api.get(`/super-admin/users/${user._id}`);
      if (res.data?.success) {
        setUserDetailData(res.data.data);
      }
    } catch (err) {
      console.error('[User Detail] Error:', err);
      if (onToast) onToast('Failed to load user account details.');
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleOpenStatusModal = (user, newStatus) => {
    setStatusTargetUser(user);
    setTargetStatus(newStatus);
    setStatusReason('');
    setShowStatusModal(true);
  };

  const handleConfirmStatusChange = async (e) => {
    e.preventDefault();
    if (targetStatus === 'SUSPENDED' && !statusReason.trim()) {
      if (onToast) onToast('A formal justification reason is required to suspend an account.');
      return;
    }

    setActionSubmitting(true);
    try {
      const res = await api.patch(`/super-admin/users/${statusTargetUser._id}/status`, {
        status: targetStatus,
        reason: statusReason.trim()
      });

      if (res.data?.success) {
        if (onToast) onToast(res.data.message || `Account updated to ${targetStatus}`);
        setShowStatusModal(false);
        fetchUsers();
        if (showDetailModal && selectedUser?._id === statusTargetUser._id) {
          handleOpenDetail(statusTargetUser);
        }
      }
    } catch (err) {
      console.error('[User Status] Error:', err);
      if (onToast) onToast(err.response?.data?.error?.message || 'Failed to update user status.');
    } finally {
      setActionSubmitting(false);
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'patient':
        return { label: 'Patient', bg: '#F3F4F6', color: '#374151', icon: UserCheck };
      case 'doctor':
        return { label: 'Doctor', bg: '#FAF5FF', color: '#6B21A8', icon: Stethoscope };
      case 'hospital_admin':
        return { label: 'Hospital Admin', bg: '#EFF6FF', color: '#1E40AF', icon: Building2 };
      case 'super_admin':
        return { label: 'Super Admin', bg: '#F8DDE3', color: '#B83D83', icon: ShieldCheck };
      default:
        return { label: role, bg: '#F3F4F6', color: '#374151', icon: UserCheck };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1
            style={{
              margin: '0 0 4px 0',
              fontFamily: 'var(--font-heading, "Manrope", sans-serif)',
              fontSize: '1.625rem',
              fontWeight: '800',
              color: 'var(--color-heading, #702B59)'
            }}
          >
            User Management
          </h1>
          <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted, #702B59)' }}>
            Central platform user directory, credential state, session security, and account governance.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchUsers}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 14px',
            borderRadius: '8px',
            border: '1px solid var(--border, #E8E3E5)',
            backgroundColor: '#FFFFFF',
            color: 'var(--color-heading, #702B59)',
            fontSize: '0.8125rem',
            fontWeight: '700',
            cursor: 'pointer'
          }}
        >
          <RefreshCw size={14} className={loading ? 'spin' : ''} />
          <span>Refresh Users</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px',
          backgroundColor: '#FFFFFF',
          padding: '16px 20px',
          borderRadius: '12px',
          border: '1px solid var(--border, #E8E3E5)',
          boxShadow: '0 2px 8px rgba(112, 43, 89, 0.04)'
        }}
      >
        <form onSubmit={handleSearchSubmit} style={{ flex: '1 1 280px', position: 'relative' }}>
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted, #702B59)'
            }}
          />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search users by email, phone, or User ID..."
            style={{
              width: '100%',
              height: '38px',
              padding: '0 12px 0 38px',
              borderRadius: '8px',
              border: '1px solid var(--border, #E8E3E5)',
              fontSize: '0.8125rem',
              color: 'var(--text, #29252A)',
              outline: 'none'
            }}
          />
        </form>

        {/* Role Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted, #702B59)' }}>Role:</span>
          <select
            value={filterRole}
            onChange={(e) => {
              setFilterRole(e.target.value);
              setCurrentPage(1);
            }}
            style={{
              height: '38px',
              padding: '0 10px',
              borderRadius: '8px',
              border: '1px solid var(--border, #E8E3E5)',
              fontSize: '0.8125rem',
              color: 'var(--text, #29252A)',
              outline: 'none',
              backgroundColor: '#FFFFFF'
            }}
          >
            <option value="ALL">All Roles</option>
            <option value="patient">Patient</option>
            <option value="doctor">Doctor</option>
            <option value="hospital_admin">Hospital Admin</option>
            <option value="super_admin">Super Admin</option>
          </select>
        </div>

        {/* Status Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted, #702B59)' }}>Status:</span>
          <select
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value);
              setCurrentPage(1);
            }}
            style={{
              height: '38px',
              padding: '0 10px',
              borderRadius: '8px',
              border: '1px solid var(--border, #E8E3E5)',
              fontSize: '0.8125rem',
              color: 'var(--text, #29252A)',
              outline: 'none',
              backgroundColor: '#FFFFFF'
            }}
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          border: '1px solid var(--border, #E8E3E5)',
          overflow: 'hidden',
          boxShadow: '0 2px 8px rgba(112, 43, 89, 0.04)'
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8125rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#FAF6F7', borderBottom: '1px solid var(--border, #E8E3E5)' }}>
                <th style={{ padding: '14px 16px', fontWeight: '800', color: 'var(--color-heading, #702B59)' }}>USER / IDENTITY</th>
                <th style={{ padding: '14px 16px', fontWeight: '800', color: 'var(--color-heading, #702B59)' }}>ROLE</th>
                <th style={{ padding: '14px 16px', fontWeight: '800', color: 'var(--color-heading, #702B59)' }}>TENANT AFFILIATION</th>
                <th style={{ padding: '14px 16px', fontWeight: '800', color: 'var(--color-heading, #702B59)' }}>REGISTERED</th>
                <th style={{ padding: '14px 16px', fontWeight: '800', color: 'var(--color-heading, #702B59)' }}>EMAIL VERIFIED</th>
                <th style={{ padding: '14px 16px', fontWeight: '800', color: 'var(--color-heading, #702B59)' }}>ACCOUNT STATUS</th>
                <th style={{ padding: '14px 16px', fontWeight: '800', color: 'var(--color-heading, #702B59)', textAlign: 'right' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted, #702B59)' }}>
                    Loading platform user accounts...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted, #702B59)' }}>
                    No user accounts match the search/filter criteria.
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const roleBadge = getRoleBadge(u.role);
                  const Icon = roleBadge.icon;
                  return (
                    <tr
                      key={u._id}
                      style={{
                        borderBottom: '1px solid var(--border, #E8E3E5)',
                        transition: 'background-color 0.1s ease'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#FAF6F7')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      {/* Identity */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: '800', color: 'var(--color-heading, #702B59)' }}>
                          {u.displayName || u.email}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #702B59)' }}>
                          {u.email} &bull; {u.phone}
                        </div>
                      </td>

                      {/* Role */}
                      <td style={{ padding: '14px 16px' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            backgroundColor: roleBadge.bg,
                            color: roleBadge.color,
                            fontSize: '0.75rem',
                            fontWeight: '800'
                          }}
                        >
                          <Icon size={12} />
                          <span>{roleBadge.label}</span>
                        </span>
                      </td>

                      {/* Tenant */}
                      <td style={{ padding: '14px 16px', color: 'var(--text, #29252A)' }}>
                        {u.hospitalId?.name ? (
                          <div>
                            <div style={{ fontWeight: '600' }}>{u.hospitalId.name}</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted, #702B59)' }}>Lic: {u.hospitalId.licenseNumber}</div>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-muted, #702B59)', fontSize: '0.75rem' }}>Global (State Network)</span>
                        )}
                      </td>

                      {/* Registration Date */}
                      <td style={{ padding: '14px 16px', color: 'var(--text-muted, #702B59)' }}>
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>

                      {/* Email Verified */}
                      <td style={{ padding: '14px 16px' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '0.75rem',
                            fontWeight: '700',
                            color: '#15803D'
                          }}
                        >
                          <CheckCircle size={14} />
                          <span>Verified</span>
                        </span>
                      </td>

                      {/* Account Status */}
                      <td style={{ padding: '14px 16px' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '3px 10px',
                            borderRadius: '9999px',
                            fontSize: '0.75rem',
                            fontWeight: '800',
                            backgroundColor:
                              u.accountStatus === 'ACTIVE'
                                ? '#DCFCE7'
                                : u.accountStatus === 'SUSPENDED'
                                ? '#FEE2E2'
                                : '#F3F4F6',
                            color:
                              u.accountStatus === 'ACTIVE'
                                ? '#15803D'
                                : u.accountStatus === 'SUSPENDED'
                                ? '#B83245'
                                : '#4B5563'
                          }}
                        >
                          {u.accountStatus || 'ACTIVE'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <button
                            type="button"
                            onClick={() => handleOpenDetail(u)}
                            style={{
                              padding: '5px 10px',
                              borderRadius: '6px',
                              border: '1px solid var(--border, #E8E3E5)',
                              backgroundColor: '#FFFFFF',
                              color: 'var(--color-heading, #702B59)',
                              fontSize: '0.75rem',
                              fontWeight: '700',
                              cursor: 'pointer'
                            }}
                          >
                            Inspect
                          </button>

                          {u.accountStatus === 'SUSPENDED' ? (
                            <button
                              type="button"
                              onClick={() => handleOpenStatusModal(u, 'ACTIVE')}
                              style={{
                                padding: '5px 10px',
                                borderRadius: '6px',
                                border: '1px solid #86EFAC',
                                backgroundColor: '#DCFCE7',
                                color: '#15803D',
                                fontSize: '0.75rem',
                                fontWeight: '700',
                                cursor: 'pointer'
                              }}
                            >
                              Reactivate
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleOpenStatusModal(u, 'SUSPENDED')}
                              style={{
                                padding: '5px 10px',
                                borderRadius: '6px',
                                border: '1px solid #FCA5A5',
                                backgroundColor: '#FEE2E2',
                                color: '#B83245',
                                fontSize: '0.75rem',
                                fontWeight: '700',
                                cursor: 'pointer'
                              }}
                            >
                              Suspend
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 18px',
            backgroundColor: '#FAF6F7',
            borderTop: '1px solid var(--border, #E8E3E5)',
            fontSize: '0.75rem',
            color: 'var(--text-muted, #702B59)'
          }}
        >
          <span>Showing {users.length} of {totalCount} platform users</span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                border: '1px solid var(--border, #E8E3E5)',
                backgroundColor: '#FFFFFF',
                cursor: currentPage <= 1 ? 'not-allowed' : 'pointer'
              }}
            >
              Previous
            </button>
            <span style={{ display: 'inline-flex', alignItems: 'center', fontWeight: '700' }}>Page {currentPage}</span>
            <button
              type="button"
              disabled={currentPage * pageSize >= totalCount}
              onClick={() => setCurrentPage((p) => p + 1)}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                border: '1px solid var(--border, #E8E3E5)',
                backgroundColor: '#FFFFFF',
                cursor: currentPage * pageSize >= totalCount ? 'not-allowed' : 'pointer'
              }}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* =====================================================================
          MODAL 1: USER ACCOUNT INSPECT MODAL
          ===================================================================== */}
      {showDetailModal && selectedUser && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              maxWidth: '620px',
              width: '100%',
              padding: '28px',
              position: 'relative',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px', borderBottom: '1px solid var(--border, #E8E3E5)', paddingBottom: '12px' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800', color: 'var(--color-heading, #702B59)' }}>
                  User Account Inspection
                </h2>
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted, #702B59)' }}>
                  User ID: {selectedUser._id}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowDetailModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted, #702B59)' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ backgroundColor: '#FAF6F7', padding: '16px', borderRadius: '10px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.8125rem' }}>
                  <div>
                    <span style={{ color: 'var(--text-muted, #702B59)', display: 'block', fontSize: '0.75rem', fontWeight: '700' }}>EMAIL</span>
                    <strong style={{ color: 'var(--text, #29252A)' }}>{selectedUser.email}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted, #702B59)', display: 'block', fontSize: '0.75rem', fontWeight: '700' }}>PHONE</span>
                    <strong style={{ color: 'var(--text, #29252A)' }}>{selectedUser.phone}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted, #702B59)', display: 'block', fontSize: '0.75rem', fontWeight: '700' }}>ROLE</span>
                    <strong style={{ color: 'var(--color-primary, #B83D83)', textTransform: 'capitalize' }}>{selectedUser.role.replace('_', ' ')}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted, #702B59)', display: 'block', fontSize: '0.75rem', fontWeight: '700' }}>STATUS</span>
                    <strong style={{ color: selectedUser.accountStatus === 'ACTIVE' ? '#15803D' : '#B83245' }}>{selectedUser.accountStatus || 'ACTIVE'}</strong>
                  </div>
                </div>
              </div>

              {selectedUser.suspensionReason && (
                <div style={{ padding: '12px 14px', borderRadius: '8px', backgroundColor: '#FEE2E2', border: '1px solid #FCA5A5', color: '#B83245', fontSize: '0.8125rem' }}>
                  <strong>Suspension Reason:</strong> {selectedUser.suspensionReason}
                </div>
              )}

              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #702B59)', lineHeight: '1.45', borderTop: '1px solid var(--border, #E8E3E5)', paddingTop: '14px' }}>
                <strong>Privacy Notice:</strong> In compliance with the Digital Personal Data Protection (DPDP) Act 2023, patient medical notes and Health Vault records are isolated from the administrative console and can never be read through user administration.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL 2: SUSPEND / REACTIVATE USER ACCOUNT (Scenario 3)
          ===================================================================== */}
      {showStatusModal && statusTargetUser && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              maxWidth: '520px',
              width: '100%',
              padding: '28px',
              position: 'relative',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  backgroundColor: targetStatus === 'SUSPENDED' ? '#FEE2E2' : '#DCFCE7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: targetStatus === 'SUSPENDED' ? '#B83245' : '#15803D'
                }}
              >
                {targetStatus === 'SUSPENDED' ? <AlertTriangle size={22} /> : <CheckCircle size={22} />}
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800', color: 'var(--color-heading, #702B59)' }}>
                  {targetStatus === 'SUSPENDED' ? 'Suspend User Account' : 'Reactivate User Account'}
                </h2>
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted, #702B59)' }}>
                  {statusTargetUser.email} &bull; Role: {statusTargetUser.role}
                </span>
              </div>
            </div>

            <form onSubmit={handleConfirmStatusChange}>
              {targetStatus === 'SUSPENDED' ? (
                <div style={{ marginBottom: '16px' }}>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text, #29252A)', lineHeight: '1.5', margin: '0 0 12px 0' }}>
                    Suspending this account will immediately revoke all active JWT refresh token sessions. The user will be blocked from logging in until reactivated. This action will be permanently recorded in the immutable platform audit trail.
                  </p>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '700', color: 'var(--color-heading, #702B59)', marginBottom: '6px' }}>
                    Mandatory Administrative Reason *
                  </label>
                  <textarea
                    rows={3}
                    value={statusReason}
                    onChange={(e) => setStatusReason(e.target.value)}
                    placeholder="State reason for suspension (e.g. Credential irregularity, security investigation, or requested by hospital authority)..."
                    required
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border, #E8E3E5)',
                      fontSize: '0.8125rem',
                      color: 'var(--text, #29252A)',
                      outline: 'none',
                      resize: 'vertical'
                    }}
                  />
                </div>
              ) : (
                <p style={{ fontSize: '0.875rem', color: 'var(--text, #29252A)', margin: '0 0 20px 0' }}>
                  Are you sure you want to reactivate the account for <strong>{statusTargetUser.email}</strong>? The user will regain normal portal login permissions.
                </p>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button
                  type="button"
                  onClick={() => setShowStatusModal(false)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: '1px solid var(--border, #E8E3E5)',
                    backgroundColor: '#FFFFFF',
                    color: 'var(--text, #29252A)',
                    fontSize: '0.8125rem',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={actionSubmitting}
                  style={{
                    padding: '8px 18px',
                    borderRadius: '8px',
                    backgroundColor: targetStatus === 'SUSPENDED' ? '#B83245' : 'var(--color-primary, #B83D83)',
                    color: '#FFFFFF',
                    border: 'none',
                    fontSize: '0.8125rem',
                    fontWeight: '700',
                    cursor: actionSubmitting ? 'not-allowed' : 'pointer'
                  }}
                >
                  {actionSubmitting
                    ? 'Processing...'
                    : targetStatus === 'SUSPENDED'
                    ? 'Confirm Account Suspension'
                    : 'Confirm Reactivation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
