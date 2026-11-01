import type {
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import Redis from "ioredis"

const redis = new Redis(process.env.REDIS_URL ?? "redis://localhost:6379", {
  maxRetriesPerRequest: null,
  lazyConnect: true,
})

export function rateLimit({
  windowSeconds,
  max,
  keyPrefix,
}: {
  windowSeconds: number
  max: number
  keyPrefix: string
}) {
  return async function rateLimitMiddleware(
    req: MedusaRequest,
    res: MedusaResponse,
    next: MedusaNextFunction
  ) {
    try {
      const actor = (req as MedusaRequest & { auth_context?: { actor_id?: string } })
        .auth_context?.actor_id
      const identity = actor || req.ip || req.socket.remoteAddress || "unknown"
      const bucket = Math.floor(Date.now() / (windowSeconds * 1000))
      const key = `ratelimit:${keyPrefix}:${identity}:${bucket}`

      if (redis.status === "wait") {
        await redis.connect()
      }

      const count = await redis.incr(key)

      if (count === 1) {
        await redis.expire(key, windowSeconds)
      }

      if (count > max) {
        res.status(429).json({
          type: "rate_limit",
          message: "Too many requests. Please wait a moment and try again.",
        })
        return
      }

      next()
    } catch {
      next()
    }
  }
}
