import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  boolean,
  timestamp,
  pgEnum,
  uniqueIndex,
  index,
  jsonb,
  serial,
} from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", ["admin", "staff", "customer"]);
export const couponTypeEnum = pgEnum("coupon_type", ["percent", "fixed"]);
export const orderStatusEnum = pgEnum("order_status", [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "returned",
]);
export const paymentMethodEnum = pgEnum("payment_method", [
  "cod",
  "bkash",
  "nagad",
  "rocket",
  "card",
]);
export const paymentStatusEnum = pgEnum("payment_status", ["pending", "paid", "failed"]);
export const heroTypeEnum = pgEnum("hero_type", ["image", "video"]);
export const heroAnimationEnum = pgEnum("hero_animation", [
  "fade",
  "slide-up",
  "zoom",
  "cinematic",
  "none",
]);
export const reviewStatusEnum = pgEnum("review_status", ["pending", "approved", "rejected"]);

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 120 }).notNull(),
    email: varchar("email", { length: 180 }).notNull(),
    phone: varchar("phone", { length: 20 }),
    passwordHash: text("password_hash").notNull(),
    role: userRoleEnum("role").notNull().default("customer"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex("users_email_unique").on(t.email), index("users_role_idx").on(t.role)]
);

export const categories = pgTable(
  "categories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 120 }).notNull(),
    slug: varchar("slug", { length: 140 }).notNull(),
    description: text("description"),
    imageUrl: text("image_url"),
    sortOrder: integer("sort_order").default(0).notNull(),
    active: boolean("active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex("categories_slug_unique").on(t.slug)]
);

export const products = pgTable(
  "products",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 200 }).notNull(),
    slug: varchar("slug", { length: 220 }).notNull(),
    description: text("description"),
    details: text("details"),
    fabric: varchar("fabric", { length: 120 }),
    categoryId: uuid("category_id").references(() => categories.id, { onDelete: "set null" }),
    basePrice: integer("base_price").notNull(),
    comparePrice: integer("compare_price"),
    brand: varchar("brand", { length: 120 }).default("Sushre"),
    active: boolean("active").default(true).notNull(),
    featured: boolean("featured").default(false).notNull(),
    isNew: boolean("is_new").default(false).notNull(),
    bestseller: boolean("bestseller").default(false).notNull(),
    ratingAvg: integer("rating_avg").default(0).notNull(),
    ratingCount: integer("rating_count").default(0).notNull(),
    totalSold: integer("total_sold").default(0).notNull(),
    imageUrl: text("image_url"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("products_slug_unique").on(t.slug),
    index("products_category_idx").on(t.categoryId),
    index("products_featured_idx").on(t.featured),
    index("products_active_idx").on(t.active),
  ]
);

export const productVariants = pgTable(
  "product_variants",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    size: varchar("size", { length: 30 }).notNull(),
    color: varchar("color", { length: 60 }).notNull(),
    colorHex: varchar("color_hex", { length: 10 }),
    sku: varchar("sku", { length: 80 }),
    price: integer("price"),
    stock: integer("stock").default(0).notNull(),
    imageUrl: text("image_url"),
    active: boolean("active").default(true).notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
  },
  (t) => [index("variants_product_idx").on(t.productId), uniqueIndex("variants_sku_unique").on(t.sku)]
);

export const productImages = pgTable(
  "product_images",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    alt: varchar("alt", { length: 200 }),
    sortOrder: integer("sort_order").default(0).notNull(),
  },
  (t) => [index("product_images_product_idx").on(t.productId)]
);

export const deliveryZones = pgTable("delivery_zones", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 120 }).notNull(),
  charge: integer("charge").notNull().default(0),
  freeAbove: integer("free_above"),
  estimatedText: varchar("estimated_text", { length: 120 }).default("2-4 days"),
  active: boolean("active").default(true).notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
});

export const coupons = pgTable(
  "coupons",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    code: varchar("code", { length: 40 }).notNull(),
    type: couponTypeEnum("type").notNull().default("percent"),
    value: integer("value").notNull(),
    minSubtotal: integer("min_subtotal").default(0).notNull(),
    maxDiscount: integer("max_discount"),
    usageLimit: integer("usage_limit"),
    usedCount: integer("used_count").default(0).notNull(),
    active: boolean("active").default(true).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex("coupons_code_unique").on(t.code)]
);

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    seq: serial("seq"),
    orderCode: varchar("order_code", { length: 20 }),
    idempotencyKey: varchar("idempotency_key", { length: 80 }),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    customerName: varchar("customer_name", { length: 120 }).notNull(),
    phone: varchar("phone", { length: 20 }).notNull(),
    email: varchar("email", { length: 180 }),
    address: text("address").notNull(),
    city: varchar("city", { length: 80 }).notNull(),
    area: varchar("area", { length: 120 }),
    deliveryZoneId: uuid("delivery_zone_id").references(() => deliveryZones.id, {
      onDelete: "set null",
    }),
    deliveryCharge: integer("delivery_charge").notNull().default(0),
    subtotal: integer("subtotal").notNull(),
    discount: integer("discount").notNull().default(0),
    couponCode: varchar("coupon_code", { length: 40 }),
    total: integer("total").notNull(),
    paymentMethod: paymentMethodEnum("payment_method").notNull().default("cod"),
    paymentStatus: paymentStatusEnum("payment_status").notNull().default("pending"),
    status: orderStatusEnum("status").notNull().default("pending"),
    notes: text("notes"),
    adminNote: text("admin_note"),
    estimatedDelivery: varchar("estimated_delivery", { length: 120 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("orders_code_unique").on(t.orderCode),
    uniqueIndex("orders_idempotency_unique").on(t.idempotencyKey),
    index("orders_status_idx").on(t.status),
    index("orders_created_idx").on(t.createdAt),
    index("orders_phone_idx").on(t.phone),
  ]
);

export const orderItems = pgTable(
  "order_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    productId: uuid("product_id").references(() => products.id, { onDelete: "set null" }),
    variantId: uuid("variant_id").references(() => productVariants.id, {
      onDelete: "set null",
    }),
    productName: varchar("product_name", { length: 200 }).notNull(),
    variantLabel: varchar("variant_label", { length: 160 }),
    sku: varchar("sku", { length: 80 }),
    price: integer("price").notNull(),
    quantity: integer("quantity").notNull(),
    total: integer("total").notNull(),
    imageUrl: text("image_url"),
  },
  (t) => [index("order_items_order_idx").on(t.orderId)]
);

export const orderStatusHistory = pgTable(
  "order_status_history",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    fromStatus: varchar("from_status", { length: 30 }),
    toStatus: varchar("to_status", { length: 30 }).notNull(),
    note: text("note"),
    createdBy: varchar("created_by", { length: 120 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("osh_order_idx").on(t.orderId)]
);

export const wishlists = pgTable(
  "wishlists",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex("wishlist_user_product_unique").on(t.userId, t.productId)]
);

export const reviews = pgTable(
  "reviews",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    authorName: varchar("author_name", { length: 120 }).notNull(),
    rating: integer("rating").notNull(),
    title: varchar("title", { length: 160 }),
    comment: text("comment").notNull(),
    status: reviewStatusEnum("status").notNull().default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("reviews_product_idx").on(t.productId)]
);

export const heroSettings = pgTable("hero_settings", {
  id: integer("id").primaryKey(),
  heroType: heroTypeEnum("hero_type").notNull().default("video"),
  videoUrl: text("video_url"),
  mobileVideoUrl: text("mobile_video_url"),
  posterUrl: text("poster_url"),
  mobilePosterUrl: text("mobile_poster_url"),
  imageUrl: text("image_url"),
  mobileImageUrl: text("mobile_image_url"),
  badgeText: varchar("badge_text", { length: 160 }),
  headline: text("headline"),
  subheadline: text("subheadline"),
  primaryCtaText: varchar("primary_cta_text", { length: 80 }),
  primaryCtaLink: varchar("primary_cta_link", { length: 300 }),
  secondaryCtaText: varchar("secondary_cta_text", { length: 80 }),
  secondaryCtaLink: varchar("secondary_cta_link", { length: 300 }),
  overlayOpacity: integer("overlay_opacity").default(45).notNull(),
  animation: heroAnimationEnum("animation").default("cinematic").notNull(),
  enabled: boolean("enabled").default(true).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const siteSettings = pgTable("site_settings", {
  id: integer("id").primaryKey(),
  announcementText: text("announcement_text"),
  announcementEnabled: boolean("announcement_enabled").default(true).notNull(),
  freeShippingThreshold: integer("free_shipping_threshold"),
  supportPhone: varchar("support_phone", { length: 30 }),
  supportEmail: varchar("support_email", { length: 120 }),
  facebook: text("facebook"),
  instagram: text("instagram"),
  tiktok: text("tiktok"),
  youtube: text("youtube"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const errorLogs = pgTable("error_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  context: varchar("context", { length: 80 }).notNull(),
  message: text("message").notNull(),
  details: jsonb("details"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const inventoryLogs = pgTable(
  "inventory_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id").references(() => products.id, { onDelete: "set null" }),
    variantId: uuid("variant_id").references(() => productVariants.id, {
      onDelete: "set null",
    }),
    changeQty: integer("change_qty").notNull(),
    reason: varchar("reason", { length: 120 }).notNull(),
    orderId: uuid("order_id").references(() => orders.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("inv_product_idx").on(t.productId)]
);

export type User = typeof users.$inferSelect;
export type Product = typeof products.$inferSelect;
export type ProductVariant = typeof productVariants.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type DeliveryZone = typeof deliveryZones.$inferSelect;
export type Coupon = typeof coupons.$inferSelect;
export type HeroSetting = typeof heroSettings.$inferSelect;
