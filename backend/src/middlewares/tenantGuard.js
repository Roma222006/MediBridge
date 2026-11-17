/**
 * Tenant Guard Middleware
 * Enforces strict hospital multi-tenant isolation.
 * For Hospital Admins and Doctors:
 *   - Ensures operations are strictly bounded to their assigned hospitalId.
 *   - Forbids access to other hospitals' data, returning 404 or 403.
 *   - Strictly forbids hospital admins and super-admins from accessing Health Vault clinical files.
 */
function tenantGuard(options = {}) {
  return (req, res, next) => {
    const user = req.user;
    if (!user) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' }
      });
    }

    // Vault route restriction: Hospital Admins & Super Admins can NEVER read vault files
    if (options.isVaultRoute) {
      if (user.role === 'hospital_admin' || user.role === 'super_admin') {
        return res.status(403).json({
          success: false,
          error: {
            code: 'VAULT_ACCESS_PROHIBITED',
            message: 'Administrative roles are strictly prohibited from accessing patient clinical health records.'
          }
        });
      }
    }

    // If user is hospital admin or doctor, enforce their assigned hospitalId
    if (user.role === 'hospital_admin' || user.role === 'doctor') {
      if (!user.hospitalId) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'TENANT_UNASSIGNED',
            message: 'User account has no associated hospital tenant.'
          }
        });
      }

      // Check if route params or body contains a hospitalId
      const targetHospitalId =
        req.params.hospitalId ||
        req.params.id ||
        req.query.hospitalId ||
        (req.body && req.body.hospitalId);

      if (targetHospitalId && targetHospitalId.toString() !== user.hospitalId.toString()) {
        // Return 404 to avoid leaking tenant existence
        return res.status(404).json({
          success: false,
          error: {
            code: 'RESOURCE_NOT_FOUND',
            message: 'Requested hospital resource not found or belongs to another tenant.'
          }
        });
      }

      // Set tenant context on request for downstream queries
      req.tenantHospitalId = user.hospitalId;
    }

    next();
  };
}

module.exports = tenantGuard;
