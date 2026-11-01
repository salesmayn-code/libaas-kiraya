import { AbstractNotificationProviderService, MedusaError } from "@medusajs/framework/utils"
import type {
  Logger,
  ProviderSendNotificationDTO,
  ProviderSendNotificationResultsDTO,
} from "@medusajs/framework/types"
import nodemailer, { type Transporter } from "nodemailer"

type Options = {
  host: string
  port: number
  secure?: boolean
  user?: string
  pass?: string
  from: string
}

type InjectedDependencies = {
  logger: Logger
}

function formatDate(value: unknown): string {
  if (!value) return ""
  const date = new Date(String(value))
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toISOString().slice(0, 10)
}

function renderTemplate(template: string, data: Record<string, unknown>) {
  if (template === "rental-booking-confirmed") {
    const bookings = Array.isArray(data.bookings) ? data.bookings : []
    const rows = bookings
      .map((raw) => {
        const booking = raw as Record<string, unknown>
        return `<li style="margin-bottom:8px">
          <strong>Booking ${booking.reference}</strong><br/>
          Rental: ${formatDate(booking.rental_start)} — ${formatDate(booking.rental_end)}<br/>
          Event: ${formatDate(booking.event_date)}<br/>
          Refundable deposit: PKR ${Number(booking.deposit_amount ?? 0).toLocaleString("en-PK")}
        </li>`
      })
      .join("")

    return {
      subject: `Your Libaas Kiraya booking is confirmed (#${data.display_id ?? ""})`,
      html: `<div style="font-family:Arial,sans-serif;color:#2B2230;line-height:1.5">
        <h2 style="color:#4A1634">Wear it once. Rent it right.</h2>
        <p>Your payment went through and the outfit is reserved for your dates.</p>
        <ul>${rows}</ul>
        <p>The boutique will hand over or courier the outfit. Return it by the due date and the deposit is released after the return check.</p>
        <p style="color:#5F5666;font-size:12px">Libaas Kiraya · demo marketplace</p>
      </div>`,
      text: `Booking confirmed (#${data.display_id ?? ""}). ${bookings.length} rental booking(s).`,
    }
  }

  if (template === "rental-inspection-submitted") {
    const needsReview = data.needs_admin_review === true
    return {
      subject: "Your outfit has been inspected",
      html: `<div style="font-family:Arial,sans-serif;color:#2B2230;line-height:1.5">
        <h2 style="color:#4A1634">Inspection filed</h2>
        <p>Deduction proposed: <strong>PKR ${Number(data.deduction ?? 0).toLocaleString("en-PK")}</strong>.</p>
        <p>${needsReview ? "Our team is reviewing the deduction before you respond." : `Decide by ${formatDate(data.deadline)}. Silence means the inspection is accepted.`}</p>
      </div>`,
      text: `Inspection filed. Proposed deduction PKR ${data.deduction ?? 0}.`,
    }
  }

  if (template === "rental-completed") {
    return {
      subject: "Your deposit has been settled",
      html: `<div style="font-family:Arial,sans-serif;color:#2B2230;line-height:1.5">
        <h2 style="color:#4A1634">Booking completed</h2>
        <p>Deduction: PKR ${Number(data.deduction ?? 0).toLocaleString("en-PK")}</p>
        <p>Released back to you: <strong>PKR ${Number(data.released ?? 0).toLocaleString("en-PK")}</strong></p>
      </div>`,
      text: `Deposit settled. Released PKR ${data.released ?? 0}.`,
    }
  }

  if (template === "rental-cancelled") {
    return {
      subject: "Your booking has been cancelled",
      html: `<div style="font-family:Arial,sans-serif;color:#2B2230;line-height:1.5">
        <h2 style="color:#4A1634">Booking cancelled</h2>
        <p>Refund initiated: <strong>PKR ${Number(data.total_refund ?? 0).toLocaleString("en-PK")}</strong>.</p>
        <p>The dates have been released for other renters.</p>
      </div>`,
      text: `Booking cancelled. Refund PKR ${data.total_refund ?? 0}.`,
    }
  }

  if (template === "payout-paid") {
    return {
      subject: "Your Libaas Kiraya payout is paid",
      html: `<div style="font-family:Arial,sans-serif;color:#2B2230;line-height:1.5">
        <h2 style="color:#4A1634">Payout paid</h2>
        <p>Amount: <strong>PKR ${Number(data.amount ?? 0).toLocaleString("en-PK")}</strong></p>
        <p>Reference: ${data.reference ?? "—"}</p>
      </div>`,
      text: `Payout paid PKR ${data.amount ?? 0}. Reference ${data.reference ?? "—"}.`,
    }
  }

  return {
    subject: `Libaas Kiraya · ${template.replace(/[-_]/g, " ")}`,
    html: `<div style="font-family:Arial,sans-serif;color:#2B2230">
      <h2 style="color:#4A1634">${template.replace(/[-_]/g, " ")}</h2>
      <pre style="white-space:pre-wrap">${JSON.stringify(data, null, 2)}</pre>
    </div>`,
    text: JSON.stringify(data, null, 2),
  }
}

class SmtpNotificationProviderService extends AbstractNotificationProviderService {
  static identifier = "smtp"

  protected logger_: Logger
  protected options_: Options
  protected transporter: Transporter

  constructor({ logger }: InjectedDependencies, options: Options) {
    super()
    this.logger_ = logger
    this.options_ = options
    this.transporter = nodemailer.createTransport({
      host: options.host,
      port: options.port,
      secure: options.secure ?? false,
      auth: options.user
        ? {
            user: options.user,
            pass: options.pass,
          }
        : undefined,
    })
  }

  static validateOptions(options: Record<string, unknown>) {
    if (!options.host || !options.from) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "SMTP notification provider requires host and from options")
    }
  }

  async send(
    notification: ProviderSendNotificationDTO
  ): Promise<ProviderSendNotificationResultsDTO> {
    const data = (notification.data ?? {}) as Record<string, unknown>
    const rendered = renderTemplate(notification.template, data)

    const info = await this.transporter.sendMail({
      from: this.options_.from,
      to: notification.to,
      subject: rendered.subject,
      text: rendered.text,
      html: rendered.html,
    })

    this.logger_.info(
      `[smtp-notification] Sent "${rendered.subject}" to ${notification.to} (${info.messageId})`
    )

    return { id: info.messageId }
  }
}

export default SmtpNotificationProviderService
