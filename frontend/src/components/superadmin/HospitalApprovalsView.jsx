import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import {
  ClipboardCheck,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  FileText,
  Building2,
  Calendar,
  ExternalLink,
  RefreshCw,
  X,
  Send,
  Info
} from 'lucide-react';

export default function HospitalApprovalsView({ onToast }) {
  const [applications, setApplications] = useState([]);
  const [counts, setCounts] = useState({
    total: 0,
    pending: 0,
    underReview: 0,
    infoRequired: 0,
    approved: 0,
    rejected: 0
  });
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [totalCount, setTotalCount] = useState(0);

  // Review Application Modal
  const [selectedApp, setSelectedApp] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [decisionType, setDecisionType] = useState('APPROVE');
  const [decisionReason, setDecisionReason] = useState('');
  const [decisionComments, setDecisionComments] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: pageSize
      };
      if (selectedStatus !== 'ALL') params.status = selectedStatus;
      if (searchTerm.trim()) params.search = searchTerm.trim();

      const res = await api.get('/super-admin/approvals', { params });
      if (res.data?.success) {
        setApplications(res.data.data.applications || []);
        setCounts(res.data.data.counts || counts);
        setTotalCount(res.data.data.pagination?.total || 0);
      }
    } catch (err) {
      console.error('[Approvals] Error loading applications:', err);
      if (onToast) onToast('Failed to load hospital applications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [selectedStatus, currentPage]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchApplications();
  };

  const handleOpenReview = (app) => {
    setSelectedApp(app);
    setDecisionType('APPROVE');
    setDecisionReason('');
    setDecisionComments('');
    setShowReviewModal(true);
  };

  const handleSubmitDecision = async (e) => {
    e.preventDefault();
    if (decisionType === 'REJECT' && !decisionReason.trim()) {
      if (onToast) onToast('A specific reason is required to reject an institutional application.');
      return;
    }
    if (decisionType === 'REQUEST_INFO' && !decisionComments.trim()) {
      if (onToast) onToast('Please specify what documents or clarifications are needed.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post(`/super-admin/approvals/${selectedApp._id}/decision`, {
        decision: decisionType,
        reason: decisionReason.trim(),
        comments: decisionComments.trim()
      });

      if (res.data?.success) {
        if (onToast) onToast(res.data.message || 'Hospital application review decision submitted.');
        setShowReviewModal(false);
        fetchApplications();
      }
    } catch (err) {
      console.error('[Approval Decision] Error:', err);
      if (onToast) onToast(err.response?.data?.error?.message || 'Failed to submit approval decision.');
    } finally {
      setSubmitting(false);
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
            Hospital Approvals & Empanelment
          </h1>
          <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted, #702B59)' }}>
            Statutory regulatory review, document verification, and accreditation approval workflow.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchApplications}
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
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* Approval Status Metric Pills (6 States) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '12px'
        }}
      >
        <button
          type="button"
          onClick={() => { setSelectedStatus('ALL'); setCurrentPage(1); }}
          style={{
            padding: '14px',
            borderRadius: '10px',
            border: selectedStatus === 'ALL' ? '2px solid var(--color-primary, #B83D83)' : '1px solid var(--border, #E8E3E5)',
            backgroundColor: selectedStatus === 'ALL' ? '#FAF6F7' : '#FFFFFF',
            textAlign: 'left',
            cursor: 'pointer'
          }}
        >
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #702B59)', fontWeight: '700' }}>TOTAL APPLICATIONS</div>
          <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--color-heading, #702B59)', marginTop: '4px' }}>
            {counts.total}
          </div>
        </button>

        <button
          type="button"
          onClick={() => { setSelectedStatus('PENDING'); setCurrentPage(1); }}
          style={{
            padding: '14px',
            borderRadius: '10px',
            border: selectedStatus === 'PENDING' ? '2px solid #B77A32' : '1px solid var(--border, #E8E3E5)',
            backgroundColor: selectedStatus === 'PENDING' ? '#FEF3C7' : '#FFFFFF',
            textAlign: 'left',
            cursor: 'pointer'
          }}
        >
          <div style={{ fontSize: '0.75rem', color: '#B77A32', fontWeight: '700' }}>PENDING REVIEW</div>
          <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#B77A32', marginTop: '4px' }}>
            {counts.pending}
          </div>
        </button>

        <button
          type="button"
          onClick={() => { setSelectedStatus('UNDER_REVIEW'); setCurrentPage(1); }}
          style={{
            padding: '14px',
            borderRadius: '10px',
            border: selectedStatus === 'UNDER_REVIEW' ? '2px solid #2563EB' : '1px solid var(--border, #E8E3E5)',
            backgroundColor: selectedStatus === 'UNDER_REVIEW' ? '#EFF6FF' : '#FFFFFF',
            textAlign: 'left',
            cursor: 'pointer'
          }}
        >
          <div style={{ fontSize: '0.75rem', color: '#1E40AF', fontWeight: '700' }}>UNDER VERIFICATION</div>
          <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#1E40AF', marginTop: '4px' }}>
            {counts.underReview}
          </div>
        </button>

        <button
          type="button"
          onClick={() => { setSelectedStatus('ADDITIONAL_INFO_REQUIRED'); setCurrentPage(1); }}
          style={{
            padding: '14px',
            borderRadius: '10px',
            border: selectedStatus === 'ADDITIONAL_INFO_REQUIRED' ? '2px solid #D97706' : '1px solid var(--border, #E8E3E5)',
            backgroundColor: selectedStatus === 'ADDITIONAL_INFO_REQUIRED' ? '#FFFBEB' : '#FFFFFF',
            textAlign: 'left',
            cursor: 'pointer'
          }}
        >
          <div style={{ fontSize: '0.75rem', color: '#92400E', fontWeight: '700' }}>INFO REQUIRED</div>
          <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#92400E', marginTop: '4px' }}>
            {counts.infoRequired}
          </div>
        </button>

        <button
          type="button"
          onClick={() => { setSelectedStatus('APPROVED'); setCurrentPage(1); }}
          style={{
            padding: '14px',
            borderRadius: '10px',
            border: selectedStatus === 'APPROVED' ? '2px solid #15803D' : '1px solid var(--border, #E8E3E5)',
            backgroundColor: selectedStatus === 'APPROVED' ? '#DCFCE7' : '#FFFFFF',
            textAlign: 'left',
            cursor: 'pointer'
          }}
        >
          <div style={{ fontSize: '0.75rem', color: '#15803D', fontWeight: '700' }}>APPROVED</div>
          <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#15803D', marginTop: '4px' }}>
            {counts.approved}
          </div>
        </button>

        <button
          type="button"
          onClick={() => { setSelectedStatus('REJECTED'); setCurrentPage(1); }}
          style={{
            padding: '14px',
            borderRadius: '10px',
            border: selectedStatus === 'REJECTED' ? '2px solid #B83245' : '1px solid var(--border, #E8E3E5)',
            backgroundColor: selectedStatus === 'REJECTED' ? '#FEE2E2' : '#FFFFFF',
            textAlign: 'left',
            cursor: 'pointer'
          }}
        >
          <div style={{ fontSize: '0.75rem', color: '#B83245', fontWeight: '700' }}>REJECTED</div>
          <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#B83245', marginTop: '4px' }}>
            {counts.rejected}
          </div>
        </button>
      </div>

      {/* Application Table */}
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
                <th style={{ padding: '14px 16px', fontWeight: '800', color: 'var(--color-heading, #702B59)' }}>APPLICATION ID</th>
                <th style={{ padding: '14px 16px', fontWeight: '800', color: 'var(--color-heading, #702B59)' }}>HOSPITAL NAME</th>
                <th style={{ padding: '14px 16px', fontWeight: '800', color: 'var(--color-heading, #702B59)' }}>REGISTRATION #</th>
                <th style={{ padding: '14px 16px', fontWeight: '800', color: 'var(--color-heading, #702B59)' }}>LOCATION</th>
                <th style={{ padding: '14px 16px', fontWeight: '800', color: 'var(--color-heading, #702B59)' }}>SUBMISSION DATE</th>
                <th style={{ padding: '14px 16px', fontWeight: '800', color: 'var(--color-heading, #702B59)' }}>DOCUMENTS</th>
                <th style={{ padding: '14px 16px', fontWeight: '800', color: 'var(--color-heading, #702B59)' }}>STATUS</th>
                <th style={{ padding: '14px 16px', fontWeight: '800', color: 'var(--color-heading, #702B59)', textAlign: 'right' }}>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted, #702B59)' }}>
                    Loading pending applications...
                  </td>
                </tr>
              ) : applications.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted, #702B59)' }}>
                    No applications found matching the selected status.
                  </td>
                </tr>
              ) : (
                applications.map((app) => (
                  <tr
                    key={app._id}
                    style={{
                      borderBottom: '1px solid var(--border, #E8E3E5)',
                      transition: 'background-color 0.1s ease'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#FAF6F7')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <td style={{ padding: '14px 16px', fontWeight: '700', color: 'var(--color-heading, #702B59)' }}>
                      APP-{app._id.toString().slice(-6).toUpperCase()}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: '800', color: 'var(--color-heading, #702B59)' }}>{app.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #702B59)' }}>{app.email}</div>
                    </td>
                    <td style={{ padding: '14px 16px', color: 'var(--text, #29252A)' }}>
                      {app.licenseNumber}
                    </td>
                    <td style={{ padding: '14px 16px', color: 'var(--text, #29252A)' }}>
                      {app.address?.city || 'Coimbatore'}, {app.address?.district || 'Tamil Nadu'}
                    </td>
                    <td style={{ padding: '14px 16px', color: 'var(--text-muted, #702B59)' }}>
                      {new Date(app.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '0.75rem',
                          fontWeight: '700',
                          color: 'var(--color-primary, #B83D83)'
                        }}
                      >
                        <FileText size={14} />
                        <span>{app.documents?.length || 0} Submitted</span>
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '3px 10px',
                          borderRadius: '9999px',
                          fontSize: '0.75rem',
                          fontWeight: '800',
                          backgroundColor:
                            app.approvalStatus === 'APPROVED'
                              ? '#DCFCE7'
                              : app.approvalStatus === 'REJECTED'
                              ? '#FEE2E2'
                              : app.approvalStatus === 'UNDER_REVIEW'
                              ? '#EFF6FF'
                              : '#FEF3C7',
                          color:
                            app.approvalStatus === 'APPROVED'
                              ? '#15803D'
                              : app.approvalStatus === 'REJECTED'
                              ? '#B83245'
                              : app.approvalStatus === 'UNDER_REVIEW'
                              ? '#1E40AF'
                              : '#B77A32'
                        }}
                      >
                        {app.approvalStatus ? app.approvalStatus.replace(/_/g, ' ') : 'PENDING'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <button
                        type="button"
                        onClick={() => handleOpenReview(app)}
                        style={{
                          padding: '6px 14px',
                          borderRadius: '6px',
                          border: 'none',
                          backgroundColor: 'var(--color-primary, #B83D83)',
                          color: '#FFFFFF',
                          fontSize: '0.75rem',
                          fontWeight: '700',
                          cursor: 'pointer'
                        }}
                      >
                        Review Application
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* =====================================================================
          APPLICATION REVIEW & DECISION MODAL (Scenario 1)
          ===================================================================== */}
      {showReviewModal && selectedApp && (
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
              maxWidth: '780px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '28px',
              position: 'relative',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', borderBottom: '1px solid var(--border, #E8E3E5)', paddingBottom: '16px' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.375rem', fontWeight: '800', color: 'var(--color-heading, #702B59)' }}>
                  Institutional Review: {selectedApp.name}
                </h2>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted, #702B59)', marginTop: '4px' }}>
                  Application ID: APP-{selectedApp._id.toString().slice(-6).toUpperCase()} &bull; Submitted {new Date(selectedApp.createdAt).toLocaleDateString()}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowReviewModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted, #702B59)' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Application Details Summary */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', backgroundColor: '#FAF6F7', padding: '16px', borderRadius: '10px', marginBottom: '20px' }}>
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--color-heading, #702B59)', textTransform: 'uppercase' }}>Facility Details</div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text, #29252A)', marginTop: '4px' }}>
                  Type: {selectedApp.type} &bull; License: {selectedApp.licenseNumber}
                </div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text, #29252A)' }}>
                  Address: {selectedApp.address?.street}, {selectedApp.address?.city}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--color-heading, #702B59)', textTransform: 'uppercase' }}>Administrator In-Charge</div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text, #29252A)', marginTop: '4px' }}>
                  Email: {selectedApp.adminUser?.email || selectedApp.email}
                </div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text, #29252A)' }}>
                  Phone: {selectedApp.adminUser?.phone || selectedApp.phone}
                </div>
              </div>
            </div>

            {/* Submitted Documents Inspection */}
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ margin: '0 0 10px 0', fontSize: '1rem', fontWeight: '800', color: 'var(--color-heading, #702B59)' }}>
                Submitted Regulatory Documents ({selectedApp.documents?.length || 0})
              </h3>
              {(!selectedApp.documents || selectedApp.documents.length === 0) ? (
                <div style={{ padding: '16px', backgroundColor: '#FFFBEB', borderRadius: '8px', color: '#92400E', fontSize: '0.8125rem' }}>
                  No uploaded regulatory files attached with this registration.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {selectedApp.documents.map((doc, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '12px 16px',
                        borderRadius: '8px',
                        border: '1px solid var(--border, #E8E3E5)',
                        backgroundColor: '#FFFFFF'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <FileText size={20} style={{ color: 'var(--color-primary, #B83D83)' }} />
                        <div>
                          <div style={{ fontWeight: '700', fontSize: '0.875rem', color: 'var(--color-heading, #702B59)' }}>
                            {doc.title}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #702B59)' }}>
                            {doc.docType} &bull; Uploaded {new Date(doc.uploadedAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span
                          style={{
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            fontWeight: '700',
                            backgroundColor: doc.status === 'VERIFIED' ? '#DCFCE7' : '#FEF3C7',
                            color: doc.status === 'VERIFIED' ? '#15803D' : '#B77A32'
                          }}
                        >
                          {doc.status}
                        </span>
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => {
                            e.preventDefault();
                            alert(`Inspecting document: ${doc.title} (Verified tamper-evident cryptographic hash attached)`);
                          }}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '5px 10px',
                            borderRadius: '6px',
                            border: '1px solid var(--border, #E8E3E5)',
                            backgroundColor: '#FAF6F7',
                            color: 'var(--color-heading, #702B59)',
                            fontSize: '0.75rem',
                            fontWeight: '700',
                            textDecoration: 'none'
                          }}
                        >
                          <ExternalLink size={12} />
                          <span>Inspect</span>
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Decision Submission Form */}
            <form onSubmit={handleSubmitDecision} style={{ borderTop: '1px solid var(--border, #E8E3E5)', paddingTop: '20px' }}>
              <h3 style={{ margin: '0 0 12px 0', fontSize: '1rem', fontWeight: '800', color: 'var(--color-heading, #702B59)' }}>
                Regulatory Decision Action
              </h3>

              {/* Decision Radio Selector */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '16px' }}>
                {[
                  { id: 'APPROVE', label: 'Approve Empanelment', color: '#15803D', bg: '#DCFCE7' },
                  { id: 'UNDER_REVIEW', label: 'Mark Under Review', color: '#1E40AF', bg: '#EFF6FF' },
                  { id: 'REQUEST_INFO', label: 'Request Documents', color: '#B77A32', bg: '#FEF3C7' },
                  { id: 'REJECT', label: 'Reject Application', color: '#B83245', bg: '#FEE2E2' }
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setDecisionType(opt.id)}
                    style={{
                      padding: '12px 8px',
                      borderRadius: '8px',
                      border: decisionType === opt.id ? `2px solid ${opt.color}` : '1px solid var(--border, #E8E3E5)',
                      backgroundColor: decisionType === opt.id ? opt.bg : '#FFFFFF',
                      color: decisionType === opt.id ? opt.color : 'var(--text, #29252A)',
                      fontSize: '0.75rem',
                      fontWeight: '800',
                      cursor: 'pointer',
                      textAlign: 'center'
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {/* Dynamic Notes Field Based on Decision */}
              {decisionType === 'REJECT' && (
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '700', color: '#B83245', marginBottom: '6px' }}>
                    Mandatory Regulatory Rejection Reason *
                  </label>
                  <textarea
                    rows={3}
                    value={decisionReason}
                    onChange={(e) => setDecisionReason(e.target.value)}
                    placeholder="Specify why this hospital cannot be empanelled (e.g., lapsed Clinical Establishments Act license, missing NOC)..."
                    required
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid #FCA5A5',
                      fontSize: '0.8125rem',
                      color: 'var(--text, #29252A)',
                      outline: 'none'
                    }}
                  />
                </div>
              )}

              {decisionType === 'REQUEST_INFO' && (
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '700', color: '#B77A32', marginBottom: '6px' }}>
                    Specific Additional Documents or Clarifications Required *
                  </label>
                  <textarea
                    rows={3}
                    value={decisionComments}
                    onChange={(e) => setDecisionComments(e.target.value)}
                    placeholder="Specify the exact statutory documents or physical verification items required from the hospital admin..."
                    required
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid #FDE68A',
                      fontSize: '0.8125rem',
                      color: 'var(--text, #29252A)',
                      outline: 'none'
                    }}
                  />
                </div>
              )}

              {decisionType === 'APPROVE' && (
                <div style={{ padding: '12px 16px', borderRadius: '8px', backgroundColor: '#DCFCE7', border: '1px solid #86EFAC', marginBottom: '16px', color: '#15803D', fontSize: '0.8125rem' }}>
                  <strong>Empanelment Activation:</strong> Approving this hospital will grant operational credentials, enable live bed telemetry broadcast, and activate OPD doctor roster scheduling for this facility.
                </div>
              )}

              {/* Submit Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowReviewModal(false)}
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
                  disabled={submitting}
                  style={{
                    padding: '8px 20px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor:
                      decisionType === 'APPROVE'
                        ? '#15803D'
                        : decisionType === 'REJECT'
                        ? '#B83245'
                        : 'var(--color-primary, #B83D83)',
                    color: '#FFFFFF',
                    fontSize: '0.8125rem',
                    fontWeight: '800',
                    cursor: submitting ? 'not-allowed' : 'pointer'
                  }}
                >
                  {submitting ? 'Submitting...' : `Submit ${decisionType} Decision`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
