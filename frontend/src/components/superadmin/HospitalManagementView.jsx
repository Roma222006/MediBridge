import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import {
  Building2,
  Search,
  Filter,
  Eye,
  AlertTriangle,
  CheckCircle,
  XCircle,
  FileText,
  Stethoscope,
  Bed,
  MapPin,
  Phone,
  Mail,
  ShieldCheck,
  Edit,
  Clock,
  ExternalLink,
  RefreshCw,
  X
} from 'lucide-react';
import Modal from '../ui/Modal';

export default function HospitalManagementView({ onToast }) {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [filterApproval, setFilterApproval] = useState('ALL');
  const [filterAccount, setFilterAccount] = useState('ALL');
  const [filterType, setFilterType] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Selected Hospital Details Modal
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [detailData, setDetailData] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Status Action Modal (Suspend / Reactivate)
  const [statusTargetHospital, setStatusTargetHospital] = useState(null);
  const [targetStatus, setTargetStatus] = useState('SUSPENDED');
  const [statusReason, setStatusReason] = useState('');
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [actionSubmitting, setActionSubmitting] = useState(false);

  // Edit Profile Modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    phone: '',
    emergencyPhone: '',
    email: '',
    website: '',
    operatingHours: ''
  });

  const fetchHospitals = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: pageSize
      };
      if (searchTerm.trim()) params.search = searchTerm.trim();
      if (filterApproval !== 'ALL') params.approvalStatus = filterApproval;
      if (filterAccount !== 'ALL') params.accountStatus = filterAccount;
      if (filterType !== 'ALL') params.type = filterType;

      const res = await api.get('/super-admin/hospitals', { params });
      if (res.data?.success) {
        setHospitals(res.data.data.hospitals || []);
        setTotalCount(res.data.data.pagination?.total || 0);
      }
    } catch (err) {
      console.error('[Hospitals] Error loading hospitals:', err);
      if (onToast) onToast('Failed to load hospitals list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHospitals();
  }, [currentPage, filterApproval, filterAccount, filterType]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchHospitals();
  };

  const handleOpenDetail = async (hospital) => {
    setSelectedHospital(hospital);
    setShowDetailModal(true);
    setLoadingDetail(true);
    try {
      const res = await api.get(`/super-admin/hospitals/${hospital._id}`);
      if (res.data?.success) {
        setDetailData(res.data.data);
      }
    } catch (err) {
      console.error('[Hospital Detail] Error loading details:', err);
      if (onToast) onToast('Failed to load detailed hospital information.');
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleOpenStatusModal = (hospital, newStatus) => {
    setStatusTargetHospital(hospital);
    setTargetStatus(newStatus);
    setStatusReason('');
    setShowStatusModal(true);
  };

  const handleConfirmStatusChange = async (e) => {
    e.preventDefault();
    if (targetStatus === 'SUSPENDED' && !statusReason.trim()) {
      if (onToast) onToast('A formal justification reason is required to suspend a hospital.');
      return;
    }

    setActionSubmitting(true);
    try {
      const res = await api.patch(`/super-admin/hospitals/${statusTargetHospital._id}/status`, {
        status: targetStatus,
        reason: statusReason.trim()
      });

      if (res.data?.success) {
        if (onToast) onToast(res.data.message || `Hospital status updated to ${targetStatus}`);
        setShowStatusModal(false);
        fetchHospitals();
        if (showDetailModal && selectedHospital?._id === statusTargetHospital._id) {
          handleOpenDetail(statusTargetHospital);
        }
      }
    } catch (err) {
      console.error('[Hospital Status] Error updating status:', err);
      if (onToast) onToast(err.response?.data?.error?.message || 'Failed to update hospital status.');
    } finally {
      setActionSubmitting(false);
    }
  };

  const handleOpenEdit = (hospital) => {
    setSelectedHospital(hospital);
    setEditForm({
      name: hospital.name || '',
      phone: hospital.phone || '',
      emergencyPhone: hospital.emergencyPhone || '108',
      email: hospital.email || '',
      website: hospital.website || '',
      operatingHours: hospital.operatingHours || '24/7 Emergency & OPD (08:00 - 20:00)'
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setActionSubmitting(true);
    try {
      const res = await api.put(`/super-admin/hospitals/${selectedHospital._id}`, editForm);
      if (res.data?.success) {
        if (onToast) onToast('Hospital profile updated successfully.');
        setShowEditModal(false);
        fetchHospitals();
      }
    } catch (err) {
      console.error('[Edit Hospital] Error:', err);
      if (onToast) onToast(err.response?.data?.error?.message || 'Failed to update hospital profile.');
    } finally {
      setActionSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Page Title & Search Header */}
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
            Hospital Management
          </h1>
          <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted, #702B59)' }}>
            Central institutional directory, operational bed figures, and facility account controls.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchHospitals}
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
          <span>Refresh Directory</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
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
        {/* Search Input */}
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
            placeholder="Search by hospital name, license number, city..."
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

        {/* Approval Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted, #702B59)' }}>Approval:</span>
          <select
            value={filterApproval}
            onChange={(e) => {
              setFilterApproval(e.target.value);
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
            <option value="ALL">All Approvals</option>
            <option value="APPROVED">Approved</option>
            <option value="PENDING">Pending Review</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="ADDITIONAL_INFO_REQUIRED">Info Required</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>

        {/* Account Status Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted, #702B59)' }}>Status:</span>
          <select
            value={filterAccount}
            onChange={(e) => {
              setFilterAccount(e.target.value);
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
            <option value="ALL">All Account Status</option>
            <option value="ACTIVE">Active</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>

        {/* Facility Type Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted, #702B59)' }}>Type:</span>
          <select
            value={filterType}
            onChange={(e) => {
              setFilterType(e.target.value);
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
            <option value="ALL">All Types</option>
            <option value="tertiary">Tertiary Center</option>
            <option value="district_hq">District Headquarters</option>
            <option value="private">Private Facility</option>
            <option value="phc">Primary Health Center</option>
          </select>
        </div>
      </div>

      {/* Hospitals Directory Table */}
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
                <th style={{ padding: '14px 16px', fontWeight: '800', color: 'var(--color-heading, #702B59)' }}>HOSPITAL NAME & ID</th>
                <th style={{ padding: '14px 16px', fontWeight: '800', color: 'var(--color-heading, #702B59)' }}>FACILITY TYPE</th>
                <th style={{ padding: '14px 16px', fontWeight: '800', color: 'var(--color-heading, #702B59)' }}>LOCATION</th>
                <th style={{ padding: '14px 16px', fontWeight: '800', color: 'var(--color-heading, #702B59)' }}>BED CAPACITY</th>
                <th style={{ padding: '14px 16px', fontWeight: '800', color: 'var(--color-heading, #702B59)' }}>APPROVAL</th>
                <th style={{ padding: '14px 16px', fontWeight: '800', color: 'var(--color-heading, #702B59)' }}>STATUS</th>
                <th style={{ padding: '14px 16px', fontWeight: '800', color: 'var(--color-heading, #702B59)', textAlign: 'right' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted, #702B59)' }}>
                    Loading hospital directory...
                  </td>
                </tr>
              ) : hospitals.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted, #702B59)' }}>
                    No hospitals found matching your filter criteria.
                  </td>
                </tr>
              ) : (
                hospitals.map((hosp) => (
                  <tr
                    key={hosp._id}
                    style={{
                      borderBottom: '1px solid var(--border, #E8E3E5)',
                      transition: 'background-color 0.1s ease'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#FAF6F7')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    {/* Name & ID */}
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: '800', color: 'var(--color-heading, #702B59)' }}>
                        {hosp.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #702B59)' }}>
                        Lic: {hosp.licenseNumber} &bull; ID: {hosp._id.toString().slice(-6)}
                      </div>
                    </td>

                    {/* Facility Type */}
                    <td style={{ padding: '14px 16px', textTransform: 'capitalize' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          backgroundColor: '#F8DDE3',
                          color: '#702B59',
                          fontSize: '0.75rem',
                          fontWeight: '700'
                        }}
                      >
                        {hosp.type ? hosp.type.replace('_', ' ') : 'General'}
                      </span>
                    </td>

                    {/* Location */}
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ color: 'var(--text, #29252A)' }}>
                        {hosp.address?.city || 'Coimbatore'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #702B59)' }}>
                        {hosp.address?.district || 'Tamil Nadu'}
                      </div>
                    </td>

                    {/* Bed Capacity */}
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: '700', color: '#15803D' }}>
                        {hosp.bedCapacity?.general?.available || 0} / {hosp.bedCapacity?.general?.total || 0} Gen
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#B83245' }}>
                        {hosp.bedCapacity?.icu?.available || 0} / {hosp.bedCapacity?.icu?.total || 0} ICU
                      </div>
                    </td>

                    {/* Approval Status */}
                    <td style={{ padding: '14px 16px' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '3px 10px',
                          borderRadius: '9999px',
                          fontSize: '0.75rem',
                          fontWeight: '800',
                          backgroundColor:
                            hosp.approvalStatus === 'APPROVED'
                              ? '#DCFCE7'
                              : hosp.approvalStatus === 'REJECTED'
                              ? '#FEE2E2'
                              : '#FEF3C7',
                          color:
                            hosp.approvalStatus === 'APPROVED'
                              ? '#15803D'
                              : hosp.approvalStatus === 'REJECTED'
                              ? '#B83245'
                              : '#B77A32'
                        }}
                      >
                        {hosp.approvalStatus || 'APPROVED'}
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
                            hosp.accountStatus === 'ACTIVE'
                              ? '#DCFCE7'
                              : hosp.accountStatus === 'SUSPENDED'
                              ? '#FEE2E2'
                              : '#F3F4F6',
                          color:
                            hosp.accountStatus === 'ACTIVE'
                              ? '#15803D'
                              : hosp.accountStatus === 'SUSPENDED'
                              ? '#B83245'
                              : '#4B5563'
                        }}
                      >
                        {hosp.accountStatus || 'ACTIVE'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={() => handleOpenDetail(hosp)}
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
                          View
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenEdit(hosp)}
                          style={{
                            padding: '5px 10px',
                            borderRadius: '6px',
                            border: '1px solid var(--border, #E8E3E5)',
                            backgroundColor: '#FFFFFF',
                            color: 'var(--color-primary, #B83D83)',
                            fontSize: '0.75rem',
                            fontWeight: '700',
                            cursor: 'pointer'
                          }}
                        >
                          Edit
                        </button>

                        {hosp.accountStatus === 'SUSPENDED' ? (
                          <button
                            type="button"
                            onClick={() => handleOpenStatusModal(hosp, 'ACTIVE')}
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
                            onClick={() => handleOpenStatusModal(hosp, 'SUSPENDED')}
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
                ))
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
          <span>Showing {hospitals.length} of {totalCount} registered hospitals</span>
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
          MODAL 1: HOSPITAL DETAIL INSPECTION MODAL
          ===================================================================== */}
      {showDetailModal && selectedHospital && (
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
              maxWidth: '820px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '28px',
              position: 'relative',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', borderBottom: '1px solid var(--border, #E8E3E5)', paddingBottom: '16px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <h2 style={{ margin: 0, fontSize: '1.375rem', fontWeight: '800', color: 'var(--color-heading, #702B59)' }}>
                    {selectedHospital.name}
                  </h2>
                  <span
                    style={{
                      padding: '3px 10px',
                      borderRadius: '9999px',
                      fontSize: '0.75rem',
                      fontWeight: '800',
                      backgroundColor: selectedHospital.approvalStatus === 'APPROVED' ? '#DCFCE7' : '#FEF3C7',
                      color: selectedHospital.approvalStatus === 'APPROVED' ? '#15803D' : '#B77A32'
                    }}
                  >
                    {selectedHospital.approvalStatus}
                  </span>
                </div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted, #702B59)', marginTop: '4px' }}>
                  License: {selectedHospital.licenseNumber} &bull; Type: {selectedHospital.type}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowDetailModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted, #702B59)' }}
              >
                <X size={20} />
              </button>
            </div>

            {loadingDetail ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted, #702B59)' }}>
                Loading hospital operational information...
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
                {/* 1. Contact & Address Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', backgroundColor: '#FAF6F7', padding: '16px', borderRadius: '10px' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--color-heading, #702B59)', textTransform: 'uppercase' }}>Location & Address</div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--text, #29252A)', marginTop: '4px' }}>
                      {selectedHospital.address?.street}, {selectedHospital.address?.area}
                    </div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--text, #29252A)' }}>
                      {selectedHospital.address?.city}, {selectedHospital.address?.district} - {selectedHospital.address?.pincode}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--color-heading, #702B59)', textTransform: 'uppercase' }}>Communications</div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--text, #29252A)', marginTop: '4px' }}>
                      Phone: {selectedHospital.phone} &bull; Emergency: {selectedHospital.emergencyPhone || '108'}
                    </div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--text, #29252A)' }}>
                      Email: {selectedHospital.email || 'N/A'}
                    </div>
                  </div>
                </div>

                {/* 2. Operational Figures */}
                <div>
                  <h3 style={{ margin: '0 0 10px 0', fontSize: '1rem', fontWeight: '800', color: 'var(--color-heading, #702B59)' }}>
                    Live Operational Metrics
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                    <div style={{ padding: '12px', border: '1px solid var(--border, #E8E3E5)', borderRadius: '8px', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #702B59)' }}>General Beds</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#15803D' }}>
                        {selectedHospital.bedCapacity?.general?.available || 0} / {selectedHospital.bedCapacity?.general?.total || 0}
                      </div>
                    </div>
                    <div style={{ padding: '12px', border: '1px solid var(--border, #E8E3E5)', borderRadius: '8px', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #702B59)' }}>ICU Beds</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#B83245' }}>
                        {selectedHospital.bedCapacity?.icu?.available || 0} / {selectedHospital.bedCapacity?.icu?.total || 0}
                      </div>
                    </div>
                    <div style={{ padding: '12px', border: '1px solid var(--border, #E8E3E5)', borderRadius: '8px', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #702B59)' }}>Active Doctors</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--color-heading, #702B59)' }}>
                        {detailData?.doctors?.length || 0}
                      </div>
                    </div>
                    <div style={{ padding: '12px', border: '1px solid var(--border, #E8E3E5)', borderRadius: '8px', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #702B59)' }}>Departments</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--color-heading, #702B59)' }}>
                        {detailData?.services?.length || 0}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Associated Administrators */}
                <div>
                  <h3 style={{ margin: '0 0 10px 0', fontSize: '1rem', fontWeight: '800', color: 'var(--color-heading, #702B59)' }}>
                    Authorized Hospital Administrators ({detailData?.admins?.length || 0})
                  </h3>
                  {(!detailData?.admins || detailData.admins.length === 0) ? (
                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted, #702B59)' }}>No administrator accounts bound yet.</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {detailData.admins.map((adm) => (
                        <div key={adm._id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', borderRadius: '6px', border: '1px solid var(--border, #E8E3E5)', backgroundColor: '#FFFFFF' }}>
                          <span style={{ fontWeight: '700', color: 'var(--text, #29252A)' }}>{adm.email}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted, #702B59)' }}>Phone: {adm.phone} &bull; Status: {adm.accountStatus}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 4. Submitted Documents */}
                <div>
                  <h3 style={{ margin: '0 0 10px 0', fontSize: '1rem', fontWeight: '800', color: 'var(--color-heading, #702B59)' }}>
                    Submitted Regulatory Documents ({selectedHospital.documents?.length || 0})
                  </h3>
                  {(!selectedHospital.documents || selectedHospital.documents.length === 0) ? (
                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted, #702B59)' }}>No regulatory documents uploaded.</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {selectedHospital.documents.map((doc, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: '6px', border: '1px solid var(--border, #E8E3E5)', backgroundColor: '#FAF6F7' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <FileText size={18} style={{ color: 'var(--color-primary, #B83D83)' }} />
                            <div>
                              <div style={{ fontWeight: '700', fontSize: '0.8125rem', color: 'var(--color-heading, #702B59)' }}>{doc.title}</div>
                              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted, #702B59)' }}>{doc.docType} &bull; Uploaded {new Date(doc.uploadedAt).toLocaleDateString()}</div>
                            </div>
                          </div>
                          <span style={{ fontSize: '0.75rem', fontWeight: '700', padding: '2px 8px', borderRadius: '4px', backgroundColor: doc.status === 'VERIFIED' ? '#DCFCE7' : '#FEF3C7', color: doc.status === 'VERIFIED' ? '#15803D' : '#B77A32' }}>
                            {doc.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL 2: SUSPEND / REACTIVATE CONFIRMATION MODAL (Scenario 2)
          ===================================================================== */}
      {showStatusModal && statusTargetHospital && (
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
                  {targetStatus === 'SUSPENDED' ? 'Suspend Hospital Account' : 'Reactivate Hospital Account'}
                </h2>
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted, #702B59)' }}>
                  {statusTargetHospital.name}
                </span>
              </div>
            </div>

            <form onSubmit={handleConfirmStatusChange}>
              {targetStatus === 'SUSPENDED' ? (
                <div style={{ marginBottom: '16px' }}>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text, #29252A)', lineHeight: '1.5', margin: '0 0 12px 0' }}>
                    Suspending this hospital account will immediately prevent new OPD booking and 108 emergency bed broadcasting. Existing appointments and medical records will be preserved for clinical safety.
                  </p>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '700', color: 'var(--color-heading, #702B59)', marginBottom: '6px' }}>
                    Mandatory Operational / Regulatory Reason *
                  </label>
                  <textarea
                    rows={3}
                    value={statusReason}
                    onChange={(e) => setStatusReason(e.target.value)}
                    placeholder="e.g. Failure to comply with fire safety certificate renewal or temporary emergency decontamination protocol."
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
                  Are you sure you want to reactivate <strong>{statusTargetHospital.name}</strong>? The facility will resume live OPD scheduling and hospital discovery.
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
                    ? 'Confirm Suspension'
                    : 'Confirm Reactivation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL 3: EDIT HOSPITAL PROFILE MODAL
          ===================================================================== */}
      {showEditModal && selectedHospital && (
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
              maxWidth: '560px',
              width: '100%',
              padding: '28px',
              position: 'relative',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', borderBottom: '1px solid var(--border, #E8E3E5)', paddingBottom: '12px' }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800', color: 'var(--color-heading, #702B59)' }}>
                Edit Approved Hospital Information
              </h2>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted, #702B59)' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: 'var(--color-heading, #702B59)', marginBottom: '4px' }}>
                    Hospital Name
                  </label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    required
                    style={{ width: '100%', height: '38px', padding: '0 12px', borderRadius: '8px', border: '1px solid var(--border, #E8E3E5)', fontSize: '0.8125rem' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: 'var(--color-heading, #702B59)', marginBottom: '4px' }}>
                      Primary Phone
                    </label>
                    <input
                      type="text"
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      required
                      style={{ width: '100%', height: '38px', padding: '0 12px', borderRadius: '8px', border: '1px solid var(--border, #E8E3E5)', fontSize: '0.8125rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: 'var(--color-heading, #702B59)', marginBottom: '4px' }}>
                      Emergency Hotline
                    </label>
                    <input
                      type="text"
                      value={editForm.emergencyPhone}
                      onChange={(e) => setEditForm({ ...editForm, emergencyPhone: e.target.value })}
                      required
                      style={{ width: '100%', height: '38px', padding: '0 12px', borderRadius: '8px', border: '1px solid var(--border, #E8E3E5)', fontSize: '0.8125rem' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: 'var(--color-heading, #702B59)', marginBottom: '4px' }}>
                      Official Email
                    </label>
                    <input
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      required
                      style={{ width: '100%', height: '38px', padding: '0 12px', borderRadius: '8px', border: '1px solid var(--border, #E8E3E5)', fontSize: '0.8125rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: 'var(--color-heading, #702B59)', marginBottom: '4px' }}>
                      Official Website
                    </label>
                    <input
                      type="text"
                      value={editForm.website}
                      onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                      placeholder="https://..."
                      style={{ width: '100%', height: '38px', padding: '0 12px', borderRadius: '8px', border: '1px solid var(--border, #E8E3E5)', fontSize: '0.8125rem' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: 'var(--color-heading, #702B59)', marginBottom: '4px' }}>
                    Operating Hours
                  </label>
                  <input
                    type="text"
                    value={editForm.operatingHours}
                    onChange={(e) => setEditForm({ ...editForm, operatingHours: e.target.value })}
                    required
                    style={{ width: '100%', height: '38px', padding: '0 12px', borderRadius: '8px', border: '1px solid var(--border, #E8E3E5)', fontSize: '0.8125rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '22px' }}>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
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
                    backgroundColor: 'var(--color-primary, #B83D83)',
                    color: '#FFFFFF',
                    border: 'none',
                    fontSize: '0.8125rem',
                    fontWeight: '700',
                    cursor: actionSubmitting ? 'not-allowed' : 'pointer'
                  }}
                >
                  {actionSubmitting ? 'Saving Changes...' : 'Save Hospital Information'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
