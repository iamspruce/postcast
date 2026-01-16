"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadAudio = uploadAudio;
const client_s3_1 = require("@aws-sdk/client-s3");
const config_1 = require("../config");
function client() {
    const accountId = (0, config_1.requireConfig)(config_1.config.r2.accountId, "R2_ACCOUNT_ID");
    const accessKeyId = (0, config_1.requireConfig)(config_1.config.r2.accessKeyId, "R2_ACCESS_KEY_ID");
    const secretAccessKey = (0, config_1.requireConfig)(config_1.config.r2.secretAccessKey, "R2_SECRET_ACCESS_KEY");
    return new client_s3_1.S3Client({
        region: "auto",
        endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
        credentials: { accessKeyId, secretAccessKey },
    });
}
async function uploadAudio(key, body, contentType = "audio/mpeg") {
    const bucket = (0, config_1.requireConfig)(config_1.config.r2.bucket, "R2_BUCKET");
    const publicBaseUrl = (0, config_1.requireConfig)(config_1.config.r2.publicBaseUrl, "R2_PUBLIC_BASE_URL");
    const s3 = client();
    await s3.send(new client_s3_1.PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
    }));
    return {
        key,
        publicUrl: `${publicBaseUrl}/${key}`,
    };
}
