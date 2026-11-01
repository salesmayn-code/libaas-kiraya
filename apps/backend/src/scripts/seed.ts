import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, MedusaError, Modules } from "@medusajs/framework/utils"
import {
  createProductsWorkflow,
  updateProductsWorkflow,
  updateRegionsWorkflow,
} from "@medusajs/medusa/core-flows"
import { RENTAL_MODULE } from "../modules/rental"
import type RentalModuleService from "../modules/rental/service"
import { VENDOR_MODULE } from "../modules/vendor"
import type VendorModuleService from "../modules/vendor/service"

type Measurement = Record<string, number>

type ListingSpec = {
  title: string
  description: string
  image: string
  occasion_tags: string[]
  base_amount: number
  extra_day_amount: number
  cleaning_fee_amount: number
  deposit_amount: number
  late_fee_amount: number
  cancellation_policy: "flexible" | "standard" | "strict"
  sizes: { label: string; measurements: Measurement }[]
  units: { size: string; tag: string }[]
}

type VendorSpec = {
  name: string
  handle: string
  email: string
  phone: string
  whatsapp: string
  city: string
  description: string
  instagram_handle: string
  status: "active" | "pending"
  commission_bps: number
  default_cancellation_policy: "flexible" | "standard" | "strict"
  listings: ListingSpec[]
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"

const SEED_PHOTOS: Record<string, string[]> = {
  "lehenga-rosewood": ["pexels-13022612.jpg", "pexels-27329528.jpg", "pexels-14088974.jpg"],
  "lehenga-ivory-chikankari": ["pexels-14073537.jpg", "pexels-20736212.jpg", "pexels-33359858.jpg"],
  "anarkali-champagne": ["pexels-24866503.jpg", "pexels-33754390.jpg", "pexels-22431182.jpg"],
  "jewelry-kundan-bridal": ["pexels-33154729.jpg", "pexels-13595802.jpg", "pexels-28243911.jpg"],
  "lehenga-emerald": ["pexels-11690470.jpg", "pexels-33359858.jpg", "pexels-14088974.jpg"],
  "lehenga-maroon": ["pexels-14666123.jpg", "pexels-35852747.jpg", "pexels-27329528.jpg"],
  "sherwani-gold": ["pexels-12632524.jpg", "pexels-37070433.jpg", "pexels-36248984.jpg"],
  "jewelry-polki": ["pexels-13595802.jpg", "pexels-33154729.jpg", "pexels-13595433.jpg"],
  "lehenga-ivory-pearl": ["pexels-20736212.jpg", "pexels-14073537.jpg", "pexels-33359858.jpg"],
  "lehenga-maroon-zardozi": ["pexels-35852747.jpg", "pexels-14666123.jpg", "pexels-27329528.jpg"],
  "sherwani-blue": ["pexels-13624156.jpg", "pexels-13624148.jpg", "pexels-36248984.jpg"],
  "kurta-sage": ["pexels-31861623.jpg", "pexels-33180680.jpg", "pexels-33754390.jpg"],
  "kurta-black": ["pexels-40366359.jpg", "pexels-40366352.jpg", "pexels-9474563.jpg"],
  "sherwani-ivory": ["pexels-37070433.jpg", "pexels-36248984.jpg", "pexels-24017899.jpg"],
  "anarkali-rosewood": ["pexels-33754390.jpg", "pexels-22431182.jpg", "pexels-24866503.jpg"],
  "jewelry-jhumka": ["pexels-13595436.jpg", "pexels-22821354.jpg", "pexels-13595433.jpg"],
  "kurta-emerald": ["pexels-31861623.jpg", "pexels-33180680.jpg", "pexels-11690470.jpg"],
  "sherwani-grey": ["pexels-13624148.jpg", "pexels-13624156.jpg", "pexels-32276787.jpg"],
  "saree-blush": ["pexels-35108807.jpg", "pexels-34532682.jpg", "pexels-33067049.jpg"],
  "jewelry-gold": ["pexels-17298688.jpg", "pexels-28243911.jpg", "pexels-13595802.jpg"],
}

function seedImageUrls(key: string) {
  const photos = SEED_PHOTOS[key]

  if (!photos?.length) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      `Missing seed photos for ${key}`
    )
  }

  return photos.map((photo) => `${SITE_URL}/images/seed/${photo}`)
}

const sizes = {
  bridal: [
    { label: "S", measurements: { bust_in: 34, waist_in: 28, hip_in: 36, shoulder_in: 14, length_in: 44 } },
    { label: "M", measurements: { bust_in: 36, waist_in: 30, hip_in: 38, shoulder_in: 14.5, length_in: 44 } },
    { label: "L", measurements: { bust_in: 38, waist_in: 32, hip_in: 40, shoulder_in: 15, length_in: 45 } },
  ],
  men: [
    { label: "38", measurements: { chest_in: 38, waist_in: 32, shoulder_in: 17, length_in: 42 } },
    { label: "40", measurements: { chest_in: 40, waist_in: 34, shoulder_in: 17.5, length_in: 43 } },
    { label: "42", measurements: { chest_in: 42, waist_in: 36, shoulder_in: 18, length_in: 43 } },
  ],
  formal: [
    { label: "S", measurements: { bust_in: 34, waist_in: 28, hip_in: 36, shoulder_in: 14, length_in: 46 } },
    { label: "M", measurements: { bust_in: 36, waist_in: 30, hip_in: 38, shoulder_in: 14.5, length_in: 47 } },
  ],
  jewelry: [
    { label: "One size", measurements: { neck_in: 14, pendant_in: 4 } },
  ],
}

const vendors: VendorSpec[] = [
  {
    name: "Saima Couture",
    handle: "saima-couture",
    email: "hello@saimacouture.pk",
    phone: "+923001234567",
    whatsapp: "+923001234567",
    city: "Islamabad",
    description: "Bridal and formal couture from a boutique studio in F-7.",
    instagram_handle: "saimacouture",
    status: "active",
    commission_bps: 1200,
    default_cancellation_policy: "standard",
    listings: [
      {
        title: "Rosewood Tissue Lehenga",
        description: "Deep rosewood tissue lehenga with antique gold zari and a net dupatta.",
        image: "lehenga-rosewood",
        occasion_tags: ["barat", "walima"],
        base_amount: 22000,
        extra_day_amount: 6000,
        cleaning_fee_amount: 2000,
        deposit_amount: 25000,
        late_fee_amount: 2000,
        cancellation_policy: "standard",
        sizes: sizes.bridal,
        units: [
          { size: "M", tag: "RWD-001" },
          { size: "L", tag: "RWD-002" },
        ],
      },
      {
        title: "Ivory Chikankari Bridal Set",
        description: "Ivory chikankari lehenga with pearl detailing, worn once.",
        image: "lehenga-ivory-chikankari",
        occasion_tags: ["nikkah", "walima"],
        base_amount: 30000,
        extra_day_amount: 8000,
        cleaning_fee_amount: 2500,
        deposit_amount: 35000,
        late_fee_amount: 2500,
        cancellation_policy: "strict",
        sizes: sizes.bridal,
        units: [{ size: "S", tag: "IVC-001" }],
      },
      {
        title: "Champagne Anarkali",
        description: "Floor-length champagne anarkali with a scalloped dupatta.",
        image: "anarkali-champagne",
        occasion_tags: ["mehndi", "walima"],
        base_amount: 12000,
        extra_day_amount: 4000,
        cleaning_fee_amount: 1200,
        deposit_amount: 15000,
        late_fee_amount: 1500,
        cancellation_policy: "flexible",
        sizes: sizes.formal,
        units: [
          { size: "S", tag: "CHP-001" },
          { size: "M", tag: "CHP-002" },
        ],
      },
      {
        title: "Kundan Bridal Jewelry Set",
        description: "Kundan choker, jhumkas and tikka on a velvet base.",
        image: "jewelry-kundan-bridal",
        occasion_tags: ["barat", "nikkah"],
        base_amount: 9000,
        extra_day_amount: 2500,
        cleaning_fee_amount: 0,
        deposit_amount: 20000,
        late_fee_amount: 1000,
        cancellation_policy: "standard",
        sizes: sizes.jewelry,
        units: [{ size: "One size", tag: "KDN-001" }],
      },
    ],
  },
  {
    name: "Zari House",
    handle: "zari-house",
    email: "salam@zarihouse.pk",
    phone: "+923015550011",
    whatsapp: "+923015550011",
    city: "Rawalpindi",
    description: "Family-run zari workshop renting heritage pieces since 1988.",
    instagram_handle: "zarihouse.pk",
    status: "active",
    commission_bps: 1000,
    default_cancellation_policy: "flexible",
    listings: [
      {
        title: "Emerald Zari Bridal Lehenga",
        description: "Emerald raw silk lehenga with hand-worked gold zari borders.",
        image: "lehenga-emerald",
        occasion_tags: ["barat", "walima"],
        base_amount: 18000,
        extra_day_amount: 5000,
        cleaning_fee_amount: 1500,
        deposit_amount: 20000,
        late_fee_amount: 1500,
        cancellation_policy: "flexible",
        sizes: sizes.bridal,
        units: [
          { size: "M", tag: "LEH-101" },
          { size: "L", tag: "LEH-102" },
        ],
      },
      {
        title: "Maroon Velvet Bridal Lehenga",
        description: "Maroon velvet with dabka work and a heavy dupatta.",
        image: "lehenga-maroon",
        occasion_tags: ["barat"],
        base_amount: 26000,
        extra_day_amount: 7000,
        cleaning_fee_amount: 2000,
        deposit_amount: 30000,
        late_fee_amount: 2000,
        cancellation_policy: "standard",
        sizes: sizes.bridal,
        units: [{ size: "M", tag: "MVL-001" }],
      },
      {
        title: "Gold Tissue Sherwani",
        description: "Gold tissue sherwani with a silk kurta and churidar.",
        image: "sherwani-gold",
        occasion_tags: ["barat", "nikkah"],
        base_amount: 20000,
        extra_day_amount: 5500,
        cleaning_fee_amount: 1500,
        deposit_amount: 25000,
        late_fee_amount: 2000,
        cancellation_policy: "standard",
        sizes: sizes.men,
        units: [
          { size: "40", tag: "GTS-001" },
          { size: "42", tag: "GTS-002" },
        ],
      },
      {
        title: "Polki Choker Set",
        description: "Polki choker with matching jhumkas for a formal night.",
        image: "jewelry-polki",
        occasion_tags: ["walima", "mehndi"],
        base_amount: 7500,
        extra_day_amount: 2500,
        cleaning_fee_amount: 0,
        deposit_amount: 15000,
        late_fee_amount: 1000,
        cancellation_policy: "flexible",
        sizes: sizes.jewelry,
        units: [{ size: "One size", tag: "PLK-001" }],
      },
    ],
  },
  {
    name: "Meher Bridals",
    handle: "meher-bridals",
    email: "studio@meherbridals.pk",
    phone: "+92423334455",
    whatsapp: "+923004445566",
    city: "Lahore",
    description: "Lahore atelier specialising in hand-embroidered bridals.",
    instagram_handle: "meherbridals",
    status: "active",
    commission_bps: 1500,
    default_cancellation_policy: "strict",
    listings: [
      {
        title: "Ivory Pearl Walima Lehenga",
        description: "Ivory organza lehenga with pearl clusters and a trailing dupatta.",
        image: "lehenga-ivory-pearl",
        occasion_tags: ["walima"],
        base_amount: 34000,
        extra_day_amount: 9000,
        cleaning_fee_amount: 2500,
        deposit_amount: 40000,
        late_fee_amount: 3000,
        cancellation_policy: "strict",
        sizes: sizes.bridal,
        units: [{ size: "M", tag: "IPW-001" }],
      },
      {
        title: "Maroon Zardozi Bridal",
        description: "Maroon zardozi bridal with a velvet shawl.",
        image: "lehenga-maroon-zardozi",
        occasion_tags: ["barat", "nikkah"],
        base_amount: 38000,
        extra_day_amount: 10000,
        cleaning_fee_amount: 2500,
        deposit_amount: 45000,
        late_fee_amount: 3000,
        cancellation_policy: "strict",
        sizes: sizes.bridal,
        units: [{ size: "S", tag: "MZB-001" }],
      },
      {
        title: "Midnight Blue Sherwani",
        description: "Midnight blue sherwani with subtle self-texture and brass buttons.",
        image: "sherwani-blue",
        occasion_tags: ["walima", "nikkah"],
        base_amount: 24000,
        extra_day_amount: 6500,
        cleaning_fee_amount: 1500,
        deposit_amount: 28000,
        late_fee_amount: 2000,
        cancellation_policy: "standard",
        sizes: sizes.men,
        units: [
          { size: "40", tag: "MBS-001" },
          { size: "42", tag: "MBS-002" },
        ],
      },
      {
        title: "Sage Organza Kurta Set",
        description: "Sage organza kurta with embroidered collar and raw silk trousers.",
        image: "kurta-sage",
        occasion_tags: ["mehndi"],
        base_amount: 11000,
        extra_day_amount: 3500,
        cleaning_fee_amount: 1200,
        deposit_amount: 12000,
        late_fee_amount: 1200,
        cancellation_policy: "standard",
        sizes: sizes.formal,
        units: [
          { size: "S", tag: "SOK-001" },
          { size: "M", tag: "SOK-002" },
        ],
      },
    ],
  },
  {
    name: "Noor Formal",
    handle: "noor-formal",
    email: "rentals@noorformal.pk",
    phone: "+92512889900",
    whatsapp: "+923018899001",
    city: "Islamabad",
    description: "Formal wear for guests, groomsmen and the whole wedding party.",
    instagram_handle: "noorformal",
    status: "active",
    commission_bps: 1200,
    default_cancellation_policy: "standard",
    listings: [
      {
        title: "Black Formal Kurta",
        description: "Black cotton-silk kurta with a tone-on-tone placket.",
        image: "kurta-black",
        occasion_tags: ["mehndi", "walima"],
        base_amount: 7000,
        extra_day_amount: 2500,
        cleaning_fee_amount: 800,
        deposit_amount: 8000,
        late_fee_amount: 1000,
        cancellation_policy: "flexible",
        sizes: sizes.formal,
        units: [
          { size: "S", tag: "BFK-001" },
          { size: "M", tag: "BFK-002" },
        ],
      },
      {
        title: "Ivory Raw Silk Sherwani",
        description: "Ivory raw silk sherwani with a mandarin collar.",
        image: "sherwani-ivory",
        occasion_tags: ["nikkah", "barat"],
        base_amount: 19000,
        extra_day_amount: 5500,
        cleaning_fee_amount: 1500,
        deposit_amount: 22000,
        late_fee_amount: 1800,
        cancellation_policy: "standard",
        sizes: sizes.men,
        units: [
          { size: "38", tag: "IRS-001" },
          { size: "40", tag: "IRS-002" },
        ],
      },
      {
        title: "Rosewood Anarkali",
        description: "Rosewood anarkali with gota work, perfect for a walima guest.",
        image: "anarkali-rosewood",
        occasion_tags: ["walima", "mehndi"],
        base_amount: 13000,
        extra_day_amount: 4000,
        cleaning_fee_amount: 1200,
        deposit_amount: 15000,
        late_fee_amount: 1500,
        cancellation_policy: "flexible",
        sizes: sizes.formal,
        units: [{ size: "M", tag: "RWA-001" }],
      },
      {
        title: "Pearl Jhumka Set",
        description: "Pearl jhumkas with a fine gold-plated finish.",
        image: "jewelry-jhumka",
        occasion_tags: ["mehndi", "walima"],
        base_amount: 4500,
        extra_day_amount: 1500,
        cleaning_fee_amount: 0,
        deposit_amount: 8000,
        late_fee_amount: 800,
        cancellation_policy: "flexible",
        sizes: sizes.jewelry,
        units: [{ size: "One size", tag: "PJS-001" }],
      },
    ],
  },
  {
    name: "Libaas Co.",
    handle: "libaas-co",
    email: "hello@libaasco.pk",
    phone: "+923036667788",
    whatsapp: "+923036667788",
    city: "Rawalpindi",
    description: "Individual lister with a small curated formal wardrobe.",
    instagram_handle: "libaas.co",
    status: "active",
    commission_bps: 1100,
    default_cancellation_policy: "flexible",
    listings: [
      {
        title: "Emerald Velvet Kurta",
        description: "Emerald velvet kurta worn once at a mehndi.",
        image: "kurta-emerald",
        occasion_tags: ["mehndi"],
        base_amount: 8500,
        extra_day_amount: 3000,
        cleaning_fee_amount: 1000,
        deposit_amount: 10000,
        late_fee_amount: 1000,
        cancellation_policy: "flexible",
        sizes: sizes.formal,
        units: [{ size: "M", tag: "EVK-001" }],
      },
      {
        title: "Grey Textured Sherwani",
        description: "Grey textured sherwani with a silk stole.",
        image: "sherwani-grey",
        occasion_tags: ["walima"],
        base_amount: 16000,
        extra_day_amount: 5000,
        cleaning_fee_amount: 1500,
        deposit_amount: 18000,
        late_fee_amount: 1500,
        cancellation_policy: "standard",
        sizes: sizes.men,
        units: [{ size: "40", tag: "GTS-101" }],
      },
      {
        title: "Blush Organza Saree",
        description: "Blush organza saree with a sequinned blouse.",
        image: "saree-blush",
        occasion_tags: ["walima", "nikkah"],
        base_amount: 14000,
        extra_day_amount: 4500,
        cleaning_fee_amount: 1200,
        deposit_amount: 16000,
        late_fee_amount: 1500,
        cancellation_policy: "flexible",
        sizes: sizes.formal,
        units: [{ size: "S", tag: "BOS-001" }],
      },
      {
        title: "Antique Gold Necklace Set",
        description: "Antique gold necklace with matching earrings.",
        image: "jewelry-gold",
        occasion_tags: ["barat", "walima"],
        base_amount: 6000,
        extra_day_amount: 2000,
        cleaning_fee_amount: 0,
        deposit_amount: 12000,
        late_fee_amount: 1000,
        cancellation_policy: "flexible",
        sizes: sizes.jewelry,
        units: [{ size: "One size", tag: "AGN-001" }],
      },
    ],
  },
  {
    name: "The Sherwani Room",
    handle: "sherwani-room",
    email: "book@thesherwaniroom.pk",
    phone: "+92421112233",
    whatsapp: "+923001112233",
    city: "Lahore",
    description: "Groomswear specialists. Awaiting platform approval.",
    instagram_handle: "thesherwaniroom",
    status: "pending",
    commission_bps: 1200,
    default_cancellation_policy: "standard",
    listings: [],
  },
]

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
}

export default async function seed({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const link = container.resolve(ContainerRegistrationKeys.LINK)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const productService = container.resolve(Modules.PRODUCT)
  const regionService = container.resolve(Modules.REGION)
  const storeService = container.resolve(Modules.STORE)
  const salesChannelService = container.resolve(Modules.SALES_CHANNEL)
  const stockLocationService = container.resolve(Modules.STOCK_LOCATION)
  const apiKeyService = container.resolve(Modules.API_KEY)
  const customerService = container.resolve(Modules.CUSTOMER)

  const rentalService = container.resolve<RentalModuleService>(RENTAL_MODULE)
  const vendorService = container.resolve<VendorModuleService>(VENDOR_MODULE)

  await rentalService.getSettings()

  let [region] = await regionService.listRegions({ currency_code: "pkr" })

  if (!region) {
    region = await regionService.createRegions({
      name: "Pakistan",
      currency_code: "pkr",
      countries: ["pk"],
      payment_providers: ["pp_system_default"],
    })
    logger.info("Created PKR region")
  }

  await updateRegionsWorkflow(container).run({
    input: {
      selector: { id: region.id },
      update: {
        payment_providers: [
          "pp_system_default",
          "pp_simulated-wallet_simulated-wallet",
        ],
      },
    },
  })

  const [store] = await storeService.listStores()

  const [salesChannel] = await salesChannelService.listSalesChannels({
    id: store.default_sales_channel_id ?? undefined,
  })

  let [location] = await stockLocationService.listStockLocations({
    name: "Libaas Kiraya Hub",
  })

  if (!location) {
    location = await stockLocationService.createStockLocations({
      name: "Libaas Kiraya Hub",
      address: {
        address_1: "F-7 Markaz",
        city: "Islamabad",
        country_code: "pk",
      },
    })

    await link.create({
      [Modules.SALES_CHANNEL]: { sales_channel_id: salesChannel.id },
      [Modules.STOCK_LOCATION]: { stock_location_id: location.id },
    })
  }

  await storeService.updateStores(store.id, {
    default_location_id: location.id,
    default_region_id: region.id,
  })

  let [apiKey] = await apiKeyService.listApiKeys({ type: "publishable" })

  if (!apiKey) {
    apiKey = await apiKeyService.createApiKeys({
      title: "Libaas storefront",
      type: "publishable",
      created_by: "seed",
    })

    await link.create({
      [Modules.API_KEY]: { api_key_id: apiKey.id },
      [Modules.SALES_CHANNEL]: { sales_channel_id: salesChannel.id },
    })
  }

  const { data: shippingProfiles } = await query.graph({
    entity: "shipping_profile",
    fields: ["id"],
    filters: { type: "default" },
  })

  const shippingProfileId = shippingProfiles[0]?.id

  for (const vendorSpec of vendors) {
    let [vendor] = await vendorService.listVendors({ handle: vendorSpec.handle })

    if (!vendor) {
      vendor = await vendorService.createVendors({
        name: vendorSpec.name,
        handle: vendorSpec.handle,
        email: vendorSpec.email,
        phone: vendorSpec.phone,
        whatsapp: vendorSpec.whatsapp,
        city: vendorSpec.city,
        description: vendorSpec.description,
        instagram_handle: vendorSpec.instagram_handle,
        status: vendorSpec.status,
        kyc_status: vendorSpec.status === "active" ? "verified" : "submitted",
        commission_bps: vendorSpec.commission_bps,
        default_cancellation_policy: vendorSpec.default_cancellation_policy,
      })
      logger.info(`Created vendor ${vendorSpec.name}`)
    }

    for (const listingSpec of vendorSpec.listings) {
      const handle = slugify(listingSpec.title)
      const existingProducts = await productService.listProducts(
        { handle },
        { relations: ["images"] }
      )

      if (existingProducts.length) {
        const [product] = existingProducts
        const images = seedImageUrls(listingSpec.image)
        const currentImages = [...(product.images ?? [])].sort(
          (left, right) => left.rank - right.rank
        )

        if (
          product.thumbnail !== images[0] ||
          images.some((url, index) => currentImages[index]?.url !== url)
        ) {
          await updateProductsWorkflow(container).run({
            input: {
              products: [
                {
                  id: product.id,
                  thumbnail: images[0],
                  images: images.map((url, index) =>
                    currentImages[index]
                      ? { id: currentImages[index].id, url }
                      : { url }
                  ),
                },
              ],
            },
          })

          logger.info(`Refreshed images for ${listingSpec.title}`)
        }

        continue
      }

      const images = seedImageUrls(listingSpec.image)

      const { result: products } = await createProductsWorkflow(container).run({
        input: {
          products: [
            {
              title: listingSpec.title,
              description: listingSpec.description,
              status: "published",
              handle,
              thumbnail: images[0],
              images: images.map((url) => ({ url })),
              shipping_profile_id: shippingProfileId,
              sales_channels: [{ id: salesChannel.id }],
              options: [
                {
                  title: "Size",
                  values: listingSpec.sizes.map((size) => size.label),
                },
              ],
              variants: listingSpec.sizes.map((size) => ({
                title: `${listingSpec.title} — ${size.label}`,
                sku: `${handle}-${slugify(size.label)}`,
                manage_inventory: false,
                allow_backorder: true,
                options: { Size: size.label },
                metadata: { size_label: size.label },
                prices: [{ currency_code: "pkr", amount: listingSpec.base_amount }],
              })),
            },
          ],
        },
      })

      const product = products[0]

      const listing = await rentalService.createRentalListings({
        product_id: product.id,
        vendor_id: vendor.id,
        city: vendor.city,
        status: "active",
        base_amount: listingSpec.base_amount,
        base_days: 3,
        extra_day_amount: listingSpec.extra_day_amount,
        cleaning_fee_amount: listingSpec.cleaning_fee_amount,
        deposit_amount: listingSpec.deposit_amount,
        late_fee_amount: listingSpec.late_fee_amount,
        lead_buffer_days: 1,
        return_buffer_days: 2,
        min_days: 2,
        max_days: 7,
        fulfillment_modes: ["pickup", "courier"],
        cancellation_policy: listingSpec.cancellation_policy,
        occasion_tags: listingSpec.occasion_tags,
      })

      const variantBySize = new Map(
        (product.variants ?? []).map((variant) => [
          String(variant.metadata?.size_label ?? ""),
          variant.id,
        ])
      )

      const specs = await rentalService.createRentalVariantSpecs(
        listingSpec.sizes.map((size) => ({
          listing_id: listing.id,
          variant_id: variantBySize.get(size.label)!,
          size_label: size.label,
          measurements: size.measurements,
          alterable: true,
        }))
      )

      await rentalService.createRentalUnits(
        listingSpec.units.map((unit) => ({
          listing_id: listing.id,
          variant_id: variantBySize.get(unit.size)!,
          vendor_id: vendor.id,
          tag_code: unit.tag,
          condition_grade: "A" as const,
          status: "active" as const,
        }))
      )

      await link.create({
        [VENDOR_MODULE]: { vendor_id: vendor.id },
        [Modules.PRODUCT]: { product_id: product.id },
      })

      await link.create({
        [Modules.PRODUCT]: { product_id: product.id },
        [RENTAL_MODULE]: { rental_listing_id: listing.id },
      })

      for (const spec of specs) {
        await link.create({
          [Modules.PRODUCT]: { product_variant_id: spec.variant_id },
          [RENTAL_MODULE]: { rental_variant_spec_id: spec.id },
        })
      }

      logger.info(`Seeded listing ${listingSpec.title}`)
    }
  }

  const customers = [
    { email: "hira@example.com", first_name: "Hira", last_name: "Ahmed" },
    { email: "bilal@example.com", first_name: "Bilal", last_name: "Raza" },
    { email: "sana@example.com", first_name: "Sana", last_name: "Khalid" },
    { email: "ayesha@example.com", first_name: "Ayesha", last_name: "Noor" },
    { email: "hamza@example.com", first_name: "Hamza", last_name: "Iqbal" },
  ]

  for (const customer of customers) {
    const existing = await customerService.listCustomers({ email: customer.email })

    if (!existing.length) {
      await customerService.createCustomers(customer)
    }
  }

  const demoBookings = await rentalService.listRentalBookings({ cart_id: "seed-demo" })

  if (!demoBookings.length) {
    const demoCustomers = await customerService.listCustomers({
      email: customers.map((customer) => customer.email),
    })

    const { data: demoListings } = await query.graph({
      entity: "rental_listing",
      fields: [
        "id",
        "vendor_id",
        "city",
        "base_amount",
        "base_days",
        "extra_day_amount",
        "cleaning_fee_amount",
        "deposit_amount",
        "late_fee_amount",
        "lead_buffer_days",
        "return_buffer_days",
        "cancellation_policy",
        "variants.id",
        "variants.variant_id",
        "units.id",
      ],
      filters: { status: "active" },
    })

    const usable = demoListings.filter(
      (listing) => listing.variants?.length && listing.units?.length
    )

    const ledgerService = container.resolve("ledger") as {
      listLedgerEntries: (filters: Record<string, unknown>) => Promise<unknown[]>
      createLedgerEntries: (data: Record<string, unknown>[]) => Promise<{ id: string }[]>
      listPayouts: (filters: Record<string, unknown>) => Promise<unknown[]>
      createPayouts: (data: Record<string, unknown>) => Promise<{ id: string }>
    }

    function offsetDate(days: number) {
      const value = new Date()
      value.setUTCHours(0, 0, 0, 0)
      value.setUTCDate(value.getUTCDate() + days)
      return value
    }

    const specs = [
      { status: "confirmed" as const, start: 14, end: 16, ops: "none" as const },
      { status: "with_customer" as const, start: -1, end: 1, ops: "none" as const },
      { status: "returned" as const, start: -5, end: -3, ops: "none" as const },
      { status: "settling" as const, start: -10, end: -8, ops: "none" as const },
      { status: "disputed" as const, start: -16, end: -14, ops: "none" as const },
      { status: "completed" as const, start: -22, end: -20, ops: "none" as const },
      { status: "cancelled" as const, start: 7, end: 9, ops: "none" as const },
      { status: "expired" as const, start: 8, end: 10, ops: "none" as const },
      { status: "with_customer" as const, start: -4, end: -2, ops: "overdue" as const },
    ]

    let completedBooking: { id: string; vendor_id: string; deposit: number } | null = null
    let overdueUnit: { listing_id: string; unit_id: string; variant_id: string; vendor_id: string } | null = null

    for (let index = 0; index < specs.length; index++) {
      const spec = specs[index]
      const listing = usable[index]
      const customer = demoCustomers[index % demoCustomers.length]

      if (!listing || !customer) {
        continue
      }

      const variant = listing.variants?.[0]
      const unit = listing.units?.[0]

      if (!variant || !unit) {
        continue
      }

      const start = offsetDate(spec.start)
      const end = offsetDate(spec.end)
      const event = offsetDate(spec.start + 1)
      const blockedStart = offsetDate(spec.start - listing.lead_buffer_days)
      const blockedEnd = offsetDate(spec.end + listing.return_buffer_days)

      const booking = await rentalService.createRentalBookings({
        listing_id: listing.id,
        unit_id: unit.id,
        variant_id: variant.variant_id,
        vendor_id: listing.vendor_id,
        customer_id: customer.id,
        cart_id: "seed-demo",
        event_date: event,
        rental_start: start,
        rental_end: end,
        blocked_start: blockedStart,
        blocked_end: blockedEnd,
        days: Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1,
        status: spec.status,
        ops_flag: spec.ops,
        hold_expires_at:
          spec.status === "expired"
            ? offsetDate(-1)
            : spec.status === "confirmed" || spec.status === "cancelled"
              ? offsetDate(1)
              : null,
        fulfillment_mode: "pickup",
        currency_code: "pkr",
        rental_fee: Number(listing.base_amount),
        cleaning_fee: Number(listing.cleaning_fee_amount),
        deposit_amount: Number(listing.deposit_amount),
        platform_fee: Math.round(Number(listing.base_amount) * 0.12),
        pricing_snapshot: {
          base_amount: Number(listing.base_amount),
          base_days: listing.base_days,
          extra_day_amount: Number(listing.extra_day_amount),
          late_fee_amount: Number(listing.late_fee_amount),
          commission_bps: 1200,
          cancellation_policy: listing.cancellation_policy,
        },
        dispatched_at: spec.status === "with_customer" ? offsetDate(-1) : null,
        returned_at:
          spec.status === "returned" || spec.status === "settling" || spec.status === "disputed"
            ? offsetDate(-2)
            : null,
        inspection_due_at:
          spec.status === "returned" ? offsetDate(2) : null,
        completed_at: spec.status === "completed" ? offsetDate(-10) : null,
        cancelled_at: spec.status === "cancelled" ? offsetDate(1) : null,
        cancelled_by: spec.status === "cancelled" ? "customer" : null,
      })

      if (spec.ops === "overdue") {
        overdueUnit = {
          listing_id: listing.id,
          unit_id: unit.id,
          variant_id: variant.variant_id,
          vendor_id: listing.vendor_id,
        }
      }

      if (spec.status !== "expired") {
        const settled = spec.status === "completed"
        const released = settled ? Number(listing.deposit_amount) : 0

        await rentalService.createRentalDeposits({
          booking_id: booking.id,
          mode: "charge_refund",
          amount: listing.deposit_amount,
          status: settled ? "settled" : spec.status === "cancelled" ? "released" : "secured",
          captured_amount: 0,
          released_amount: released,
          secured_at: offsetDate(spec.start - 2),
          settled_at: settled || spec.status === "cancelled" ? offsetDate(-10) : null,
        })
      }

      if (spec.status === "settling" || spec.status === "disputed") {
        const inspection = await rentalService.createRentalInspections({
          booking_id: booking.id,
          filed_by: "seed",
          outcome: "minor_damage",
          damage_deduction: 3000,
          late_days: 0,
          late_fee: 0,
          total_deduction: 3000,
          notes: "Seed inspection with a small repair deduction.",
          photo_keys: ["seed/return-1.jpg", "seed/return-2.jpg", "seed/return-3.jpg"],
          status: spec.status === "disputed" ? "disputed" : "submitted",
          submitted_at: offsetDate(-1),
          dispute_deadline: offsetDate(2),
        })

        if (spec.status === "disputed") {
          await rentalService.createRentalDisputes({
            inspection_id: inspection.id,
            booking_id: booking.id,
            opened_by: customer.id,
            reason: "The mark was already there when I received the outfit.",
            evidence_keys: ["seed/customer-evidence-1.jpg"],
            status: "open",
            opened_at: offsetDate(1),
          })
        }
      }

      if (spec.status === "completed") {
        await ledgerService.createLedgerEntries([
          {
            vendor_id: listing.vendor_id,
            booking_id: booking.id,
            type: "rental_earning",
            amount: Number(listing.base_amount),
            currency_code: "pkr",
            status: "available",
            available_at: offsetDate(-10),
            idempotency_key: `seed-demo:${booking.id}:rental_earning`,
            memo: "Seed completed booking",
          },
          {
            vendor_id: listing.vendor_id,
            booking_id: booking.id,
            type: "commission",
            amount: -Math.round(Number(listing.base_amount) * 0.12),
            currency_code: "pkr",
            status: "available",
            available_at: offsetDate(-10),
            idempotency_key: `seed-demo:${booking.id}:commission`,
            memo: "Seed commission",
          },
        ])

        completedBooking = {
          id: booking.id,
          vendor_id: listing.vendor_id,
          deposit: Number(listing.deposit_amount),
        }
      }
    }

    if (overdueUnit) {
      const listing = usable.find((item) => item.id === overdueUnit?.listing_id)
      const customer = demoCustomers[1] ?? demoCustomers[0]

      if (listing && customer) {
        await rentalService.createRentalBookings({
          listing_id: listing.id,
          unit_id: overdueUnit.unit_id,
          variant_id: overdueUnit.variant_id,
          vendor_id: overdueUnit.vendor_id,
          customer_id: customer.id,
          cart_id: "seed-demo",
          event_date: offsetDate(5),
          rental_start: offsetDate(4),
          rental_end: offsetDate(6),
          blocked_start: offsetDate(3),
          blocked_end: offsetDate(8),
          days: 3,
          status: "confirmed",
          ops_flag: "at_risk",
          hold_expires_at: offsetDate(3),
          fulfillment_mode: "pickup",
          currency_code: "pkr",
          rental_fee: Number(listing.base_amount),
          cleaning_fee: Number(listing.cleaning_fee_amount),
          deposit_amount: Number(listing.deposit_amount),
          platform_fee: Math.round(Number(listing.base_amount) * 0.12),
          pricing_snapshot: {
            base_amount: Number(listing.base_amount),
            base_days: listing.base_days,
            extra_day_amount: Number(listing.extra_day_amount),
            late_fee_amount: Number(listing.late_fee_amount),
            commission_bps: 1200,
            cancellation_policy: listing.cancellation_policy,
          },
        })
      }
    }

    if (completedBooking) {
      const existingPayouts = await ledgerService.listPayouts({
        vendor_id: completedBooking.vendor_id,
      })

      if (!existingPayouts.length) {
        await ledgerService.createPayouts({
          vendor_id: completedBooking.vendor_id,
          amount: Number(5000),
          currency_code: "pkr",
          method: "bank_transfer",
          status: "draft",
          period_start: offsetDate(-30),
          period_end: offsetDate(-10),
        })
      }
    }

    logger.info("Seeded demo bookings across the lifecycle")
  }

  logger.info("Seed complete")
  logger.info(`Publishable key: ${apiKey.token}`)
}
