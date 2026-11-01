import { defineConfig, loadEnv } from "@medusajs/framework/utils"

loadEnv(process.env.NODE_ENV || "development", process.cwd())

const redisUrl = process.env.REDIS_URL

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET,
      cookieSecret: process.env.COOKIE_SECRET,
    },
  },
  modules: [
    {
      resolve: "./src/modules/vendor",
    },
    {
      resolve: "./src/modules/rental",
    },
    {
      resolve: "./src/modules/ledger",
    },
    {
      resolve: "./src/modules/measurement",
    },
    {
      resolve: "./src/modules/review",
    },
    {
      resolve: "@medusajs/medusa/cache-redis",
      options: {
        redisUrl,
      },
    },
    {
      resolve: "@medusajs/medusa/event-bus-redis",
      options: {
        redisUrl,
        jobOptions: {
          removeOnComplete: { age: 3600, count: 1000 },
          removeOnFail: { age: 3600, count: 1000 },
        },
      },
    },
    {
      resolve: "@medusajs/medusa/workflow-engine-redis",
      options: {
        redis: {
          redisUrl,
        },
      },
    },
    {
      resolve: "@medusajs/medusa/file",
      options: {
        providers: [
          {
            resolve: "@medusajs/medusa/file-s3",
            id: "s3",
            options: {
              file_url: `${process.env.S3_ENDPOINT}/${process.env.S3_PUBLIC_BUCKET}`,
              access_key_id: process.env.S3_ACCESS_KEY_ID,
              secret_access_key: process.env.S3_SECRET_ACCESS_KEY,
              region: process.env.S3_REGION,
              bucket: process.env.S3_PUBLIC_BUCKET,
              endpoint: process.env.S3_ENDPOINT,
              additional_client_config: {
                forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
              },
              download_file_duration: 3600,
            },
          },
        ],
      },
    },
    {
      resolve: "@medusajs/medusa/payment",
      options: {
        providers: [
          {
            resolve: "./src/modules/providers/payment-simulated-wallet",
            id: "simulated-wallet",
            options: {
              webhookSecret: process.env.SIMULATED_WALLET_WEBHOOK_SECRET,
            },
          },
        ],
      },
    },
    {
      resolve: "@medusajs/medusa/notification",
      options: {
        providers: [
          {
            resolve: "@medusajs/medusa/notification-local",
            id: "local",
            options: {
              channels: ["feed"],
            },
          },
          {
            resolve: "./src/modules/providers/notification-whatsapp-stub",
            id: "whatsapp-stub",
            options: {
              channels: ["whatsapp"],
            },
          },
          {
            resolve: "./src/modules/providers/notification-smtp",
            id: "smtp",
            options: {
              channels: ["email"],
              host: process.env.SMTP_HOST ?? "localhost",
              port: Number(process.env.SMTP_PORT ?? 1025),
              user: process.env.SMTP_USER || undefined,
              pass: process.env.SMTP_PASS || undefined,
              from: process.env.EMAIL_FROM ?? "no-reply@libaas.local",
            },
          },
        ],
      },
    },
  ],
})
