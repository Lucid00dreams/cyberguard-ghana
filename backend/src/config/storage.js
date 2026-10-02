const { S3Client } = require("@aws-sdk/client-s3");

// Cloudflare R2 speaks the S3 API, so the AWS SDK works unmodified.
// R2 has zero egress fees, which is why it was chosen for the zero-cost
// architecture over raw AWS S3.
const r2Client = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME;
const R2_ENDPOINT = process.env.R2_ENDPOINT;

module.exports = { r2Client, BUCKET_NAME };
