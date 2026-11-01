import { AbstractPaymentProvider, BigNumber } from "@medusajs/framework/utils"
import type {
  AuthorizePaymentInput,
  AuthorizePaymentOutput,
  CancelPaymentInput,
  CancelPaymentOutput,
  CapturePaymentInput,
  CapturePaymentOutput,
  DeletePaymentInput,
  DeletePaymentOutput,
  GetPaymentStatusInput,
  GetPaymentStatusOutput,
  InitiatePaymentInput,
  InitiatePaymentOutput,
  ProviderWebhookPayload,
  RefundPaymentInput,
  RefundPaymentOutput,
  RetrievePaymentInput,
  RetrievePaymentOutput,
  UpdatePaymentInput,
  UpdatePaymentOutput,
  WebhookActionResult,
} from "@medusajs/framework/types"

type Options = {
  webhookSecret?: string
}

type WalletData = Record<string, unknown> & {
  wallet_id?: string
}

class SimulatedWalletProviderService extends AbstractPaymentProvider<Options> {
  static identifier = "simulated-wallet"
  static capabilities = {
    supportsHold: false,
  }

  constructor(container: Record<string, unknown>, options: Options) {
    super(container, options)
  }

  async initiatePayment(input: InitiatePaymentInput): Promise<InitiatePaymentOutput> {
    const walletId = `wallet_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

    return {
      id: walletId,
      data: {
        wallet_id: walletId,
        amount: input.amount,
        currency_code: input.currency_code,
        status: "initiated",
        customer_id: input.context?.customer?.id ?? null,
      },
    }
  }

  async authorizePayment(input: AuthorizePaymentInput): Promise<AuthorizePaymentOutput> {
    return {
      status: "authorized",
      data: {
        ...(input.data ?? {}),
        status: "authorized",
        authorized_at: new Date().toISOString(),
      },
    }
  }

  async capturePayment(input: CapturePaymentInput): Promise<CapturePaymentOutput> {
    return {
      data: {
        ...(input.data ?? {}),
        status: "captured",
        captured_at: new Date().toISOString(),
      },
    }
  }

  async refundPayment(input: RefundPaymentInput): Promise<RefundPaymentOutput> {
    return {
      data: {
        ...(input.data ?? {}),
        status: "refunded",
        refunded_amount: input.amount,
        refunded_at: new Date().toISOString(),
      },
    }
  }

  async cancelPayment(input: CancelPaymentInput): Promise<CancelPaymentOutput> {
    return {
      data: {
        ...(input.data ?? {}),
        status: "cancelled",
        cancelled_at: new Date().toISOString(),
      },
    }
  }

  async updatePayment(input: UpdatePaymentInput): Promise<UpdatePaymentOutput> {
    return { data: input.data }
  }

  async deletePayment(input: DeletePaymentInput): Promise<DeletePaymentOutput> {
    return { data: input.data }
  }

  async getPaymentStatus(input: GetPaymentStatusInput): Promise<GetPaymentStatusOutput> {
    const status = (input.data as WalletData | undefined)?.status

    if (status === "captured" || status === "refunded") {
      return { status: "captured" }
    }

    if (status === "cancelled") {
      return { status: "canceled" }
    }

    if (status === "authorized") {
      return { status: "authorized" }
    }

    return { status: "pending" }
  }

  async retrievePayment(input: RetrievePaymentInput): Promise<RetrievePaymentOutput> {
    return { data: input.data }
  }

  async getWebhookActionAndData(
    payload: ProviderWebhookPayload["payload"]
  ): Promise<WebhookActionResult> {
    const data = (payload.data ?? {}) as Record<string, unknown>
    const sessionId = String(data.session_id ?? "")
    const amount = new BigNumber(Number(data.amount ?? 0))

    if (data.event_type === "authorized") {
      return { action: "authorized", data: { session_id: sessionId, amount } }
    }

    if (data.event_type === "captured") {
      return { action: "captured", data: { session_id: sessionId, amount } }
    }

    if (data.event_type === "failed") {
      return { action: "failed", data: { session_id: sessionId, amount } }
    }

    return {
      action: "not_supported",
      data: { session_id: sessionId, amount: new BigNumber(0) },
    }
  }
}

export default SimulatedWalletProviderService
