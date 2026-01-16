import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { config, requireConfig } from "../config";
import { UploadResult } from "./types";

function client(): S3Client {
  const accountId = requireConfig(config.r2.accountId, "R2_ACCOUNT_ID");
  const accessKeyId = requireConfig(config.r2.accessKeyId, "R2_ACCESS_KEY_ID");
  const secretAccessKey = requireConfig(
    config.r2.secretAccessKey,
    "R2_SECRET_ACCESS_KEY"
  );

  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
}

export async function uploadAudio(
  key: string,
  body: Uint8Array,
  contentType = "audio/mpeg"
): Promise<UploadResult> {
  const bucket = requireConfig(config.r2.bucket, "R2_BUCKET");
  const publicBaseUrl = requireConfig(config.r2.publicBaseUrl, "R2_PUBLIC_BASE_URL");
  const s3 = client();

  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );

  return {
    key,
    publicUrl: `${publicBaseUrl}/${key}`,
  };
}
