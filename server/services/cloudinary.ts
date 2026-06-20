// server/services/cloudinary.ts — Cloudinary file storage service
import { v2 as cloudinary } from 'cloudinary';

const isConfigured = !!(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (isConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  console.log('✅ Cloudinary configured');
} else {
  console.warn('⚠️  Cloudinary not configured — file uploads will use local fallback');
}

export interface UploadResult {
  url: string;
  publicId: string;
  format: string;
  size: number;
}

export const uploadFile = async (
  filePath: string,
  folder: string = 'intellmeet'
): Promise<UploadResult> => {
  if (!isConfigured) {
    // Local fallback — return a placeholder URL
    return {
      url: `/uploads/${filePath.split(/[/\\]/).pop()}`,
      publicId: `local_${Date.now()}`,
      format: filePath.split('.').pop() || 'unknown',
      size: 0,
    };
  }

  const result = await cloudinary.uploader.upload(filePath, {
    folder,
    resource_type: 'auto',
    quality: 'auto',
    fetch_format: 'auto',
  });

  return {
    url: result.secure_url,
    publicId: result.public_id,
    format: result.format,
    size: result.bytes,
  };
};

export const uploadBuffer = async (
  buffer: Buffer,
  filename: string,
  folder: string = 'intellmeet'
): Promise<UploadResult> => {
  if (!isConfigured) {
    return {
      url: `/uploads/${filename}`,
      publicId: `local_${Date.now()}`,
      format: filename.split('.').pop() || 'unknown',
      size: buffer.length,
    };
  }

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'auto', public_id: filename.replace(/\.[^/.]+$/, '') },
      (error, result) => {
        if (error || !result) return reject(error || new Error('Upload failed'));
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          format: result.format,
          size: result.bytes,
        });
      }
    );
    stream.end(buffer);
  });
};

export const deleteFile = async (publicId: string): Promise<void> => {
  if (!isConfigured) return;
  await cloudinary.uploader.destroy(publicId);
};

export const getCloudinaryStatus = () => ({ isConfigured });

export { cloudinary };
