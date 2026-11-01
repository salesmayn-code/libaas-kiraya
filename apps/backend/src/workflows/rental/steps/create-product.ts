import { MedusaError, Modules, ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { createProductsWorkflow, deleteProductsWorkflow } from "@medusajs/medusa/core-flows"
import type { CreateProductWorkflowInputDTO } from "@medusajs/framework/types"

export type ListingVariantInput = {
  size_label: string
  measurements: Record<string, number>
  alterable: boolean
  alteration_notes?: string | null
}

export type CreateProductStepInput = {
  title: string
  description?: string | null
  images: string[]
  variants: ListingVariantInput[]
  base_amount: number
  handle: string
}

function slugSku(handle: string, sizeLabel: string) {
  return `${handle}-${sizeLabel}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export const createProductStep = createStep(
  "create-product",
  async (input: CreateProductStepInput, { container, context }) => {
    if (input.variants.length === 0) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "Add at least one size")
    }

    const sizes = input.variants.map((variant) => variant.size_label)
    const uniqueSizes = new Set(sizes)

    if (uniqueSizes.size !== sizes.length) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "Size labels must be unique")
    }

    const storeService = container.resolve(Modules.STORE)
    const [store] = await storeService.listStores()

    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const { data: shippingProfiles } = await query.graph({
      entity: "shipping_profile",
      fields: ["id"],
      filters: { type: "default" },
    })

    const productData: CreateProductWorkflowInputDTO = {
      title: input.title,
      description: input.description ?? undefined,
      status: "draft",
      thumbnail: input.images[0],
      images: input.images.map((url) => ({ url })),
      options: [{ title: "Size", values: sizes }],
      shipping_profile_id: shippingProfiles[0]?.id,
      sales_channels: store?.default_sales_channel_id
        ? [{ id: store.default_sales_channel_id }]
        : undefined,
      variants: input.variants.map((variant) => ({
        title: `${input.title} — ${variant.size_label}`,
        sku: slugSku(input.handle, variant.size_label),
        manage_inventory: false,
        allow_backorder: true,
        options: { Size: variant.size_label },
        metadata: { size_label: variant.size_label },
        prices: [{ currency_code: "pkr", amount: input.base_amount }],
      })),
    }

    const { result } = await createProductsWorkflow(container).run({
      input: { products: [productData] },
      context,
    })

    const product = result[0]

    return new StepResponse(product, product.id)
  },
  async (productId, { container, context }) => {
    if (!productId) {
      return
    }

    await deleteProductsWorkflow(container).run({
      input: { ids: [productId] },
      context,
    })
  }
)
