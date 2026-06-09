import crypto from "node:crypto";

export type StoredObject = {
  url: string;
  key: string;
  bucket: string;
  provider: "s3";
  bytes: number;
  contentType: string;
};

export class ObjectStorageConfigurationError extends Error {
  constructor() {
    super("S3/R2 storage belum dikonfigurasi. Isi S3_BUCKET, S3_REGION, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY, dan opsional S3_ENDPOINT.");
  }
}

function sha256Hex(value: string | Buffer) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function hmac(key: Buffer | string, value: string) {
  return crypto.createHmac("sha256", key).update(value).digest();
}

function awsDate(date = new Date()) {
  const iso = date.toISOString().replace(/[:-]|\.\d{3}/g, "");
  return {
    amzDate: iso,
    shortDate: iso.slice(0, 8)
  };
}

function endpointFor(bucket: string, region: string) {
  if (process.env.S3_ENDPOINT) {
    const endpoint = process.env.S3_ENDPOINT.replace(/\/$/, "");
    return `${endpoint}/${bucket}`;
  }
  return `https://${bucket}.s3.${region}.amazonaws.com`;
}

export function objectStorageReady() {
  return Boolean(process.env.S3_BUCKET && process.env.S3_REGION && process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY);
}

export async function putObject(input: {
  key: string;
  body: Buffer | string;
  contentType: string;
  cacheControl?: string;
}): Promise<StoredObject> {
  if (!objectStorageReady()) throw new ObjectStorageConfigurationError();

  const bucket = process.env.S3_BUCKET!;
  const region = process.env.S3_REGION!;
  const accessKeyId = process.env.S3_ACCESS_KEY_ID!;
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY!;
  const baseUrl = endpointFor(bucket, region);
  const key = input.key.replace(/^\/+/, "").replace(/\\/g, "/");
  const url = `${baseUrl}/${key.split("/").map(encodeURIComponent).join("/")}`;
  const parsed = new URL(url);
  const body = Buffer.isBuffer(input.body) ? input.body : Buffer.from(input.body);
  const uploadBody = Uint8Array.from(body).buffer;
  const payloadHash = sha256Hex(body);
  const { amzDate, shortDate } = awsDate();
  const service = "s3";
  const canonicalUri = parsed.pathname;
  const canonicalHeaders = [
    `content-type:${input.contentType}`,
    `host:${parsed.host}`,
    `x-amz-content-sha256:${payloadHash}`,
    `x-amz-date:${amzDate}`
  ].join("\n");
  const signedHeaders = "content-type;host;x-amz-content-sha256;x-amz-date";
  const canonicalRequest = ["PUT", canonicalUri, "", `${canonicalHeaders}\n`, signedHeaders, payloadHash].join("\n");
  const credentialScope = `${shortDate}/${region}/${service}/aws4_request`;
  const stringToSign = ["AWS4-HMAC-SHA256", amzDate, credentialScope, sha256Hex(canonicalRequest)].join("\n");
  const signingKey = hmac(hmac(hmac(hmac(`AWS4${secretAccessKey}`, shortDate), region), service), "aws4_request");
  const signature = crypto.createHmac("sha256", signingKey).update(stringToSign).digest("hex");

  const response = await fetch(url, {
    method: "PUT",
    headers: {
      authorization: `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
      "content-type": input.contentType,
      "x-amz-content-sha256": payloadHash,
      "x-amz-date": amzDate,
      ...(input.cacheControl ? { "cache-control": input.cacheControl } : {})
    },
    body: uploadBody
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Upload S3/R2 gagal (${response.status}). ${text.slice(0, 240)}`);
  }

  const publicBaseUrl = process.env.S3_PUBLIC_BASE_URL?.replace(/\/$/, "");
  return {
    url: publicBaseUrl ? `${publicBaseUrl}/${key}` : url,
    key,
    bucket,
    provider: "s3",
    bytes: body.byteLength,
    contentType: input.contentType
  };
}
