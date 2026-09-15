import pg from "pg";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL || "postgresql://postgres:postgres@127.0.0.1:5432/app_db" });

const IMG = {
  trad1: "https://images.pexels.com/photos/20702673/pexels-photo-20702673.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800",
  blueKurti: "https://images.pexels.com/photos/19556879/pexels-photo-19556879.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800",
  yellow: "https://images.pexels.com/photos/8770996/pexels-photo-8770996.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800",
  redTrad: "https://images.pexels.com/photos/30912301/pexels-photo-30912301.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800",
  redSari: "https://images.pexels.com/photos/2741099/pexels-photo-2741099.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800",
  sareeOut: "https://images.pexels.com/photos/33225559/pexels-photo-33225559.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800",
  brick: "https://images.pexels.com/photos/34155069/pexels-photo-34155069.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800",
  hijabBokeh: "https://images.pexels.com/photos/34414157/pexels-photo-34414157.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800",
  hijabNight: "https://images.pexels.com/photos/34414153/pexels-photo-34414153.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800",
  pinkHijab: "https://images.pexels.com/photos/34488636/pexels-photo-34488636.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800",
  brownHijab: "https://images.pexels.com/photos/38560278/pexels-photo-38560278.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800",
  purpleHijab: "https://images.pexels.com/photos/34414155/pexels-photo-34414155.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800",
  whiteLake: "https://images.pexels.com/photos/27856781/pexels-photo-27856781.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800",
  floralHijab: "https://images.pexels.com/photos/27945418/pexels-photo-27945418.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800",
  darkTrad: "https://images.pexels.com/photos/36765973/pexels-photo-36765973.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800",
  heroPoster: "https://images.pexels.com/photos/35083322/pexels-photo-35083322.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
  heroMobilePoster: "https://images.pexels.com/photos/34414157/pexels-photo-34414157.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=800",
};

const uid = () => crypto.randomUUID();
const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

async function main() {
  const c = await pool.connect();
  try {
    await c.query("BEGIN");

    // Users
    const adminHash = await bcrypt.hash("Nafi#@#@", 10);
    const custHash = await bcrypt.hash("test1234", 10);
    await c.query(
      `INSERT INTO users (id, name, email, phone, password_hash, role)
       VALUES ($1,'Sushre Admin','admin@sushre.com','01335055833',$2,'admin')
       ON CONFLICT (email) DO UPDATE SET password_hash=EXCLUDED.password_hash, role='admin'`,
      [uid(), adminHash]
    );
    await c.query(
      `INSERT INTO users (id, name, email, phone, password_hash, role)
       VALUES ($1,'Test Customer','customer@test.com','01711111111',$2,'customer')
       ON CONFLICT (email) DO NOTHING`,
      [uid(), custHash]
    );

    // Categories
    const cats = [
      ["Saree", "Jamdhani, muslin & festive sarees", IMG.redSari, 1],
      ["Three-Piece", "Cotton, georgette & embroidered sets", IMG.trad1, 2],
      ["Kurti & Tops", "Everyday elegance, office to outing", IMG.blueKurti, 3],
      ["Hijab & Modest", "Premium chiffon hijabs & abaya", IMG.hijabBokeh, 4],
      ["Festive Wear", "Wedding, Eid & occasion edits", IMG.redTrad, 5],
    ];
    const catIds = {};
    for (const [name, desc, img, sort] of cats) {
      const slug = slugify(name);
      const r = await c.query(
        `INSERT INTO categories (id, name, slug, description, image_url, sort_order, active)
         VALUES ($1,$2,$3,$4,$5,$6,true)
         ON CONFLICT (slug) DO UPDATE SET name=EXCLUDED.name, image_url=EXCLUDED.image_url RETURNING id`,
        [uid(), name, slug, desc, img, sort]
      );
      catIds[name] = r.rows[0].id;
    }

    // Delivery zones
    const zones = [
      ["Inside Dhaka", 70, 2500, "24–48 hours", 1],
      ["Outside Dhaka", 130, 3000, "3–5 days", 2],
      ["Express (Dhaka)", 180, null, "Same day / Next day", 3],
    ];
    for (const [name, charge, freeAbove, est, sort] of zones) {
      const ex = await c.query(`SELECT id FROM delivery_zones WHERE name=$1`, [name]);
      if (ex.rows.length === 0) {
        await c.query(
          `INSERT INTO delivery_zones (id, name, charge, free_above, estimated_text, active, sort_order) VALUES ($1,$2,$3,$4,$5,true,$6)`,
          [uid(), name, charge, freeAbove, est, sort]
        );
      }
    }

    // Coupons
    const coupons = [
      ["WELCOME10", "percent", 10, 1000, 300, 500, true, null],
      ["EID15", "percent", 15, 2000, 500, 200, true, null],
      ["FLAT100", "fixed", 100, 1500, 100, 300, true, null],
    ];
    for (const [code, type, val, min, max, limit, active] of coupons) {
      await c.query(
        `INSERT INTO coupons (id, code, type, value, min_subtotal, max_discount, usage_limit, used_count, active)
         VALUES ($1,$2,$3,$4,$5,$6,$7,0,$8)
         ON CONFLICT (code) DO UPDATE SET type=EXCLUDED.type, value=EXCLUDED.value, active=EXCLUDED.active`,
        [uid(), code, type, val, min, max, limit, active]
      );
    }

    // Products
    const products = [
      { name: "Rajshahi Mulberry Silk Saree — Crimson", cat: "Saree", price: 4850, compare: 6200, img: IMG.redSari, featured: true, best: true, isNew: false, sold: 412, fabric: "Mulberry silk", desc: "Hand-finished Rajshahi silk with a deep crimson body, gold zari paar and a soft, breathable fall. Includes unstitched blouse piece." },
      { name: "Pastel Muslin Saree with Zari Border", cat: "Saree", price: 3450, compare: 4200, img: IMG.sareeOut, featured: true, best: false, isNew: true, sold: 88, fabric: "Dhaka muslin", desc: "Featherlight muslin in blush pastel with a delicate zari border. Perfect for daytime events and office festivities." },
      { name: "Noor Embroidered Three-Piece — Ivory", cat: "Three-Piece", price: 2650, compare: 3200, img: IMG.trad1, featured: true, best: true, isNew: false, sold: 530, fabric: "Swiss cotton", desc: "Ivory Swiss-cotton kameez with tonal chikankari embroidery, straight palazzo and a sheer embroidered dupatta." },
      { name: "Neelambari Cotton Three-Piece — Royal Blue", cat: "Three-Piece", price: 1980, compare: 2450, img: IMG.blueKurti, featured: true, best: false, isNew: true, sold: 164, fabric: "Premium cotton", desc: "Royal-blue printed three-piece with lace detailing and a soft voile dupatta. Colour-fast, pre-shrunk fabric." },
      { name: "Holud Embroidered Kurti — Marigold", cat: "Kurti & Tops", price: 1450, compare: 1850, img: IMG.yellow, featured: false, best: true, isNew: false, sold: 301, fabric: "Georgette + crepe", desc: "Marigold A-line kurti with mirror & thread embroidery. Ideal for holud, pohela boishakh and festive mornings." },
      { name: "Gulnaar Festive Lehenga Kurti — Ruby", cat: "Festive Wear", price: 5950, compare: 7500, img: IMG.redTrad, featured: true, best: true, isNew: true, sold: 97, fabric: "Net + silk", desc: "Ruby-red festive set with sequin bodice, flared skirt and net dupatta. Made for weddings & Eid evenings." },
      { name: "Meher Brick-Print Day Kurti — Olive", cat: "Kurti & Tops", price: 1250, compare: null, img: IMG.brick, featured: false, best: false, isNew: true, sold: 45, fabric: "Linen-cotton", desc: "Olive linen-cotton kurti with minimal block print. Breathable everyday staple with side slits." },
      { name: "Amina Premium Chiffon Hijab — Taupe", cat: "Hijab & Modest", price: 550, compare: 750, img: IMG.hijabBokeh, featured: true, best: true, isNew: false, sold: 890, fabric: "Premium chiffon", desc: "Non-slip premium chiffon hijab, 72×28 in. Opaque, breathable, with a soft matte finish that drapes beautifully." },
      { name: "Layali Satin Hijab — Midnight", cat: "Hijab & Modest", price: 650, compare: 850, img: IMG.hijabNight, featured: false, best: false, isNew: true, sold: 210, fabric: "Matte satin", desc: "Midnight matte-satin hijab with a luxe sheen. Evening-ready, stays in place with an undercap." },
      { name: "Rose Quartz Hijab — Blush Pink", cat: "Hijab & Modest", price: 520, compare: 680, img: IMG.pinkHijab, featured: false, best: false, isNew: true, sold: 132, fabric: "Georgette", desc: "Blush-pink georgette hijab — featherlight, easy to style, perfect for daily wear and office." },
      { name: "Sahara Abaya Set — Espresso", cat: "Hijab & Modest", price: 3850, compare: 4600, img: IMG.brownHijab, featured: true, best: false, isNew: true, sold: 76, fabric: "Nida crepe", desc: "Espresso Nida-crepe abaya with matching hijab. Minimal, tailored, with side pockets and premium stitching." },
      { name: "Shamima Floral Modest Dress — Ivory Bloom", cat: "Hijab & Modest", price: 2250, compare: 2800, img: IMG.floralHijab, featured: false, best: true, isNew: false, sold: 264, fabric: "Cherry georgette", desc: "Full-sleeve floral modest dress with belt and inner. Flowy, opaque, and nursing-friendly." },
    ];

    const sizes = ["S", "M", "L", "XL"];
    const colors = [
      ["Ivory", "#F5EFE2"],
      ["Maroon", "#6D1F3E"],
      ["Navy", "#1E2A5A"],
    ];

    for (const p of products) {
      const slug = slugify(p.name);
      const ex = await c.query(`SELECT id FROM products WHERE slug=$1`, [slug]);
      let pid;
      if (ex.rows.length > 0) {
        pid = ex.rows[0].id;
        await c.query(
          `UPDATE products SET name=$2, base_price=$3, compare_price=$4, image_url=$5, category_id=$6, featured=$7, bestseller=$8, is_new=$9, total_sold=$10, fabric=$11, description=$12, active=true WHERE id=$1`,
          [pid, p.name, p.price, p.compare, p.img, catIds[p.cat], p.featured, p.best, p.isNew, p.sold, p.fabric, p.desc]
        );
        await c.query(`DELETE FROM product_variants WHERE product_id=$1`, [pid]);
        await c.query(`DELETE FROM product_images WHERE product_id=$1`, [pid]);
      } else {
        pid = uid();
        await c.query(
          `INSERT INTO products (id, name, slug, description, category_id, base_price, compare_price, fabric, active, featured, is_new, bestseller, rating_avg, rating_count, total_sold, image_url)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,true,$9,$10,$11,48,120,$12,$13)`,
          [pid, p.name, slug, p.desc, catIds[p.cat], p.price, p.compare, p.fabric, p.featured, p.isNew, p.best, p.sold, p.img]
        );
      }
      await c.query(`INSERT INTO product_images (id, product_id, url, alt, sort_order) VALUES ($1,$2,$3,$4,0)`, [uid(), pid, p.img, p.name]);
      // variants
      let vi = 0;
      for (const size of sizes) {
        const [color, hex] = colors[vi % colors.length];
        const stock = [18, 24, 15, 9][vi % 4];
        const price = p.price + (size === "XL" ? 100 : 0);
        await c.query(
          `INSERT INTO product_variants (id, product_id, size, color, color_hex, sku, price, stock, image_url, active, sort_order)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,true,$10)`,
          [uid(), pid, size, color, hex, `${slug.slice(0, 8).toUpperCase()}-${size}`, price, stock, p.img, vi]
        );
        vi++;
      }
      // one low-stock + one out-of-stock demo on first product handled: set XL of product 1 to 0? keep stock healthy except one
    }
    // Make one variant out of stock for testing blocked flow
    await c.query(
      `UPDATE product_variants SET stock=0 WHERE id IN (SELECT id FROM product_variants ORDER BY stock ASC LIMIT 2)`
    );

    // Hero settings
    await c.query(
      `INSERT INTO hero_settings (id, hero_type, video_url, mobile_video_url, poster_url, mobile_poster_url, image_url, badge_text, headline, subheadline, primary_cta_text, primary_cta_link, secondary_cta_text, secondary_cta_link, overlay_opacity, animation, enabled)
       VALUES (1,'video',
        'https://videos.pexels.com/video-files/7779054/7779054-uhd_4096_2160_25fps.mp4',
        'https://videos.pexels.com/video-files/34373827/14561748_2160_3840_30fps.mp4',
        $1, $2, $1,
        'New · Eid Festive Edit 2026',
        'Elegance woven for every day',
        'Sarees, three-pieces & modest wear — crafted in Dhaka, delivered across Bangladesh with cash on delivery.',
        'Shop New Arrivals','/shop','Explore Offers','/offers',48,'cinematic',true)
       ON CONFLICT (id) DO NOTHING`,
      [IMG.heroPoster, IMG.heroMobilePoster]
    );

    // Site settings
    await c.query(
      `INSERT INTO site_settings (id, announcement_text, announcement_enabled, free_shipping_threshold, support_phone, support_email, facebook, instagram, tiktok, youtube)
       VALUES (1,'Eid Festive Sale — up to 40% OFF + Free delivery over ৳2,500 · Code: WELCOME10',true,2500,'09638-010101','hello@sushre.com','https://facebook.com','https://instagram.com','https://tiktok.com','https://youtube.com')
       ON CONFLICT (id) DO NOTHING`
    );

    await c.query("COMMIT");
    console.log("Seed OK");
  } catch (e) {
    await c.query("ROLLBACK");
    console.error("Seed failed", e);
    process.exit(1);
  } finally {
    c.release();
    await pool.end();
  }
}

main();
