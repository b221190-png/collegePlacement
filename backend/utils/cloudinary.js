const { v2: cloudinary } = require('cloudinary');

const getCloudinaryConfig = () => ({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

const isCloudinaryConfigured = () => {
  const config = getCloudinaryConfig();
  return Boolean(config.cloud_name && config.api_key && config.api_secret);
};

const configureCloudinary = () => {
  if (!isCloudinaryConfigured()) {
    return false;
  }

  cloudinary.config(getCloudinaryConfig());
  return true;
};

const uploadResumeBuffer = (file, options = {}) => {
  if (!file || !file.buffer) {
    return Promise.reject(new Error('Resume file buffer is required'));
  }

  if (!configureCloudinary()) {
    return Promise.reject(new Error('Cloudinary is not configured'));
  }

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'raw',
        folder: process.env.CLOUDINARY_RESUME_FOLDER || 'college-placement/resumes',
        use_filename: true,
        unique_filename: true,
        overwrite: false,
        ...options
      },
      (error, result) => {
        if (error || !result) {
          reject(error || new Error('Cloudinary upload failed'));
          return;
        }

        resolve(result);
      }
    );

    stream.end(file.buffer);
  });
};

module.exports = {
  cloudinary,
  isCloudinaryConfigured,
  uploadResumeBuffer
};
