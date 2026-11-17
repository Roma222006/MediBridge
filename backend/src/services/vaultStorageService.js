const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const config = require('../config');

const VAULT_DIR = path.join(__dirname, '../../uploads/vault');
if (!fs.existsSync(VAULT_DIR)) {
  fs.mkdirSync(VAULT_DIR, { recursive: true });
}

function checkMagicBytes(buffer, mimeType) {
  if (mimeType === 'application/pdf') {
    // Starts with %PDF (0x25, 0x50, 0x44, 0x46)
    return buffer.length >= 4 && buffer.slice(0, 4).toString() === '%PDF';
  }
  if (mimeType === 'image/png') {
    // 89 50 4E 47 0D 0A 1A 0A
    const pngMagic = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    return buffer.length >= 8 && buffer.slice(0, 8).equals(pngMagic);
  }
  if (mimeType === 'image/jpeg') {
    // FF D8 FF
    return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }
  return false;
}

class VaultStorageService {
  saveFile(buffer, originalName, mimeType) {
    if (!checkMagicBytes(buffer, mimeType)) {
      const err = new Error('File content does not match reported MIME type (magic byte check failed).');
      err.code = 'INVALID_FILE_SIGNATURE';
      err.statusCode = 400;
      throw err;
    }

    const sha256Hash = crypto.createHash('sha256').update(buffer).digest('hex');
    const fileKey = `${crypto.randomUUID()}${path.extname(originalName) || '.dat'}`;
    const filePath = path.join(VAULT_DIR, fileKey);

    fs.writeFileSync(filePath, buffer);

    return {
      fileKey,
      fileSizeBytes: buffer.length,
      sha256Hash,
      mimeType
    };
  }

  generateSignedDownloadToken({ recordId, fileKey, userId, role }) {
    // 60-second ephemeral signed token
    return jwt.sign(
      {
        recordId,
        fileKey,
        userId,
        role,
        purpose: 'vault_download'
      },
      config.jwt.accessSecret,
      { expiresIn: '60s' }
    );
  }

  verifyDownloadToken(token) {
    try {
      const decoded = jwt.verify(token, config.jwt.accessSecret);
      if (decoded.purpose !== 'vault_download') {
        throw new Error('Invalid token purpose');
      }
      return decoded;
    } catch (err) {
      const error = new Error('Download URL has expired or is invalid. Please request a new signed link.');
      error.code = 'DOWNLOAD_LINK_EXPIRED';
      error.statusCode = 403;
      throw error;
    }
  }

  getFilePath(fileKey) {
    // Protect against directory traversal attacks
    const safeKey = path.basename(fileKey);
    const fullPath = path.join(VAULT_DIR, safeKey);
    if (!fs.existsSync(fullPath)) {
      const err = new Error('Physical file not found in vault storage.');
      err.code = 'FILE_NOT_FOUND';
      err.statusCode = 404;
      throw err;
    }
    return fullPath;
  }

  deletePhysicalFile(fileKey) {
    try {
      const fullPath = path.join(VAULT_DIR, path.basename(fileKey));
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    } catch (e) {
      console.error('[VaultStorage] Failed to unlink file:', e.message);
    }
  }
}

module.exports = new VaultStorageService();
