import { randomUUID } from "node:crypto"
import path from "node:path"
import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { MedusaError } from "@medusajs/framework/utils"

const ALLOWED_TYPES = new Map([
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/webp", ".webp"],
  ["image/avif", ".avif"],
])

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024

export type UploadScope = "catalog" | "private"

function getClient() {
  return new S3Client({
    region: process.env.S3_REGION || "us-east-1",
    endpoint: process.env.S3_ENDPOINT,
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID!,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
    },
  })
}

export function getPublicUrl(key: string) {
  const endpoint = process.env.S3_ENDPOINT
  const bucket = process.env.S3_PUBLIC_BUCKET
  return `${endpoint}/${bucket}/${key}`
}

export async function createSignedDownload(key: string, expiresIn = 600) {
  const command = new GetObjectCommand({
    Bucket: process.env.S3_PRIVATE_BUCKET!,
    Key: key,
  })

  return getSignedUrl(getClient(), command, { expiresIn })
}

export async function createSignedUpload({
  vendorId,
  filename,
  contentType,
  size,
  scope,
}: {
  vendorId: string
  filename: string
  contentType: string
  size: number
  scope: UploadScope
}) {
  const extension = ALLOWED_TYPES.get(contentType)

  if (!extension) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Upload a JPEG, PNG, WebP or AVIF image"
    )
  }

  if (!Number.isFinite(size) || size <= 0 || size > MAX_UPLOAD_BYTES) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Images must be smaller than 10 MB"
    )
  }

  const safeStem = path
    .basename(filename, path.extname(filename))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)

  const bucket =
    scope === "catalog"
      ? process.env.S3_PUBLIC_BUCKET!
      : process.env.S3_PRIVATE_BUCKET!

  const key = `vendors/${vendorId}/${scope}/${randomUUID()}-${safeStem || "image"}${extension}`

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
    ContentLength: size,
  })

  const uploadUrl = await getSignedUrl(getClient(), command, { expiresIn: 600 })

  return {
    key,
    bucket,
    upload_url: uploadUrl,
    expires_in: 600,
    public_url: scope === "catalog" ? getPublicUrl(key) : null,
  }
}
