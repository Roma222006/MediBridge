const express = require('express');
const router = express.Router();
const superAdminController = require('../controllers/superAdminController');
const authMiddleware = require('../middlewares/authMiddleware');
const rbacMiddleware = require('../middlewares/rbacMiddleware');

// Security Guard: Super Admin Access Only
router.use(authMiddleware);
router.use(rbacMiddleware('super_admin'));

// 1. Dashboard Overview
router.get('/overview', (req, res, next) => superAdminController.getOverview(req, res, next));

// 2. Hospital Management
router.get('/hospitals', (req, res, next) => superAdminController.getHospitals(req, res, next));
router.get('/hospitals/:id', (req, res, next) => superAdminController.getHospitalById(req, res, next));
router.patch('/hospitals/:id/status', (req, res, next) => superAdminController.updateHospitalStatus(req, res, next));
router.put('/hospitals/:id', (req, res, next) => superAdminController.updateHospitalProfile(req, res, next));

// 3. Hospital Approvals & Verification Workflow
router.get('/approvals', (req, res, next) => superAdminController.getApprovalApplications(req, res, next));
router.post('/approvals/:id/decision', (req, res, next) => superAdminController.submitApprovalDecision(req, res, next));

// 4. User Management
router.get('/users', (req, res, next) => superAdminController.getUsers(req, res, next));
router.get('/users/:id', (req, res, next) => superAdminController.getUserById(req, res, next));
router.patch('/users/:id/status', (req, res, next) => superAdminController.updateUserStatus(req, res, next));

// 5. Role & Permission Management
router.get('/roles', (req, res, next) => superAdminController.getRoles(req, res, next));
router.patch('/roles/:roleName', (req, res, next) => superAdminController.updateRolePermissions(req, res, next));

// 6. Platform Monitoring & Incidents
router.get('/monitoring', (req, res, next) => superAdminController.getPlatformHealth(req, res, next));
router.get('/incidents', (req, res, next) => superAdminController.getIncidents(req, res, next));
router.post('/incidents', (req, res, next) => superAdminController.createIncident(req, res, next));
router.patch('/incidents/:id', (req, res, next) => superAdminController.updateIncident(req, res, next));

// 7. Platform Audit Logs
router.get('/audit-logs', (req, res, next) => superAdminController.getAuditLogs(req, res, next));
router.get('/audit-logs/export', (req, res, next) => superAdminController.exportAuditLogsCsv(req, res, next));

// 8. Platform Reports & Aggregates
router.get('/reports', (req, res, next) => superAdminController.getReports(req, res, next));

// 9. System Settings & Governance
router.get('/settings', (req, res, next) => superAdminController.getSystemSettings(req, res, next));
router.put('/settings/:key', (req, res, next) => superAdminController.updateSystemSetting(req, res, next));

// 10. Global Search
router.get('/search', (req, res, next) => superAdminController.globalSearch(req, res, next));

// 11. Platform Notifications
router.get('/notifications', (req, res, next) => superAdminController.getNotifications(req, res, next));
router.patch('/notifications/:id/read', (req, res, next) => superAdminController.markNotificationRead(req, res, next));
router.patch('/notifications/read-all', (req, res, next) => superAdminController.markAllNotificationsRead(req, res, next));

module.exports = router;
