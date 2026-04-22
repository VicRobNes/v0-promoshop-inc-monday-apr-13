-- PromoShop Studio Seed Data
-- Run this after 001_create_schema.sql

-- ============================================
-- SEED BRANDS
-- ============================================
INSERT INTO public.brands (name, slug, description, logo_url, is_featured, display_order, is_active)
VALUES
  ('Rhone', 'rhone', 'Premium performance apparel for driven professionals. Technical fabrics engineered for work and workout.', '', true, 1, true),
  ('TravisMathew', 'travismathew', 'California-inspired performance lifestyle brand. Golf and casual wear built for comfort and style.', '', true, 2, true),
  ('Victorinox', 'victorinox', 'Swiss precision and craftsmanship. Iconic knives, tools, and accessories built to last a lifetime.', '', true, 3, true),
  ('Stanley', 'stanley', 'Legendary drinkware with over 100 years of heritage. Rugged durability and timeless design.', '', true, 4, true),
  ('Titleist', 'titleist', 'The #1 ball in golf. Premium golf equipment trusted by professionals worldwide.', '', true, 5, true),
  ('lululemon', 'lululemon', 'Premium athletic and lifestyle apparel. Technical fabrics engineered for performance and comfort.', '', true, 6, true),
  ('Johnnie-O', 'johnnie-o', 'West Coast lifestyle brand blending California cool with East Coast prep. Comfortable, versatile performance wear.', '', false, 7, true),
  ('Stio', 'stio', 'Mountain-inspired technical apparel. Performance outdoor gear rooted in Jackson Hole.', '', false, 8, true),
  ('Patagonia', 'patagonia', 'Outdoor apparel and gear built for adventure. Known for quality, durability, and environmental responsibility.', '', false, 9, true),
  ('Helly Hansen', 'helly-hansen', 'Norwegian heritage brand for sailing and outdoor adventures. Professional-grade protection with clean marine design.', '', false, 10, true),
  ('Peter Millar', 'peter-millar', 'Luxury golf and lifestyle apparel. Refined performance wear with timeless elegance and exceptional quality.', '', false, 11, true),
  ('YETI', 'yeti', 'Premium coolers, drinkware, and gear designed for the wild. Built to withstand the elements.', '', false, 12, true)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  is_featured = EXCLUDED.is_featured,
  display_order = EXCLUDED.display_order;

-- ============================================
-- SEED SAMPLE PRODUCTS
-- ============================================
INSERT INTO public.products (brand_id, name, slug, description, sku, price_range, category, tags, is_featured, is_active, min_quantity)
SELECT 
  b.id,
  'Element Polo',
  'rhone-element-polo',
  'Our most versatile polo. Moisture-wicking fabric with four-way stretch for all-day comfort.',
  'RH-POLO-001',
  '$78 - $98',
  'Polos',
  ARRAY['polo', 'performance', 'golf'],
  true,
  true,
  12
FROM public.brands b WHERE b.slug = 'rhone'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (brand_id, name, slug, description, sku, price_range, category, tags, is_featured, is_active, min_quantity)
SELECT 
  b.id,
  'Commuter Pant',
  'rhone-commuter-pant',
  'The perfect pant for work and play. Technical fabric that looks dressy but performs like activewear.',
  'RH-PANT-001',
  '$128 - $148',
  'Pants',
  ARRAY['pants', 'commuter', 'technical'],
  false,
  true,
  12
FROM public.brands b WHERE b.slug = 'rhone'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (brand_id, name, slug, description, sku, price_range, category, tags, is_featured, is_active, min_quantity)
SELECT 
  b.id,
  'Heater Polo',
  'travismathew-heater-polo',
  'California-cool polo with moisture management and UPF 50+ protection.',
  'TM-POLO-001',
  '$85 - $95',
  'Polos',
  ARRAY['polo', 'golf', 'casual'],
  true,
  true,
  12
FROM public.brands b WHERE b.slug = 'travismathew'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (brand_id, name, slug, description, sku, price_range, category, tags, is_featured, is_active, min_quantity)
SELECT 
  b.id,
  'Classic SD',
  'victorinox-classic-sd',
  'The original Swiss Army Knife. Compact, versatile, and built to last generations.',
  'VX-KNIFE-001',
  '$25 - $35',
  'Accessories',
  ARRAY['knife', 'tools', 'edc'],
  true,
  true,
  24
FROM public.brands b WHERE b.slug = 'victorinox'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (brand_id, name, slug, description, sku, price_range, category, tags, is_featured, is_active, min_quantity)
SELECT 
  b.id,
  'Quencher H2.0',
  'stanley-quencher-h20',
  'The tumbler that started a movement. 40oz of vacuum insulation for all-day hydration.',
  'ST-TUMBLER-001',
  '$35 - $45',
  'Drinkware',
  ARRAY['tumbler', 'drinkware', 'hydration'],
  true,
  true,
  12
FROM public.brands b WHERE b.slug = 'stanley'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (brand_id, name, slug, description, sku, price_range, category, tags, is_featured, is_active, min_quantity)
SELECT 
  b.id,
  'Pro V1',
  'titleist-pro-v1',
  'The #1 ball in golf. Extraordinary distance, consistent flight, and Drop-and-Stop short game control.',
  'TT-BALL-001',
  '$50 - $55/dozen',
  'Golf',
  ARRAY['golf', 'balls', 'premium'],
  true,
  true,
  12
FROM public.brands b WHERE b.slug = 'titleist'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (brand_id, name, slug, description, sku, price_range, category, tags, is_featured, is_active, min_quantity)
SELECT 
  b.id,
  'Metal Vent Tech Polo',
  'lululemon-metal-vent-polo',
  'Engineered for training with sweat-wicking fabric and seamless construction.',
  'LL-POLO-001',
  '$88 - $108',
  'Polos',
  ARRAY['polo', 'training', 'technical'],
  true,
  true,
  12
FROM public.brands b WHERE b.slug = 'lululemon'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (brand_id, name, slug, description, sku, price_range, category, tags, is_featured, is_active, min_quantity)
SELECT 
  b.id,
  'Better Sweater Jacket',
  'patagonia-better-sweater',
  'Classic fleece jacket made with recycled polyester. Warm, comfortable, and environmentally responsible.',
  'PAT-JACKET-001',
  '$139 - $159',
  'Jackets',
  ARRAY['jacket', 'fleece', 'sustainable'],
  true,
  true,
  12
FROM public.brands b WHERE b.slug = 'patagonia'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (brand_id, name, slug, description, sku, price_range, category, tags, is_featured, is_active, min_quantity)
SELECT 
  b.id,
  'Crew Midlayer Jacket',
  'helly-hansen-crew-midlayer',
  'Versatile midlayer with Polartec fleece. Perfect for sailing, hiking, or everyday wear.',
  'HH-JACKET-001',
  '$150 - $175',
  'Jackets',
  ARRAY['jacket', 'sailing', 'outdoor'],
  true,
  true,
  12
FROM public.brands b WHERE b.slug = 'helly-hansen'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (brand_id, name, slug, description, sku, price_range, category, tags, is_featured, is_active, min_quantity)
SELECT 
  b.id,
  'Rambler 20oz Tumbler',
  'yeti-rambler-20oz',
  'Double-wall vacuum insulation keeps drinks cold or hot for hours. Dishwasher safe.',
  'YT-TUMBLER-001',
  '$30 - $38',
  'Drinkware',
  ARRAY['tumbler', 'drinkware', 'insulated'],
  true,
  true,
  12
FROM public.brands b WHERE b.slug = 'yeti'
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- SEED HERO SLIDES
-- ============================================
INSERT INTO public.hero_slides (title, subtitle, cta_primary_text, cta_primary_url, cta_secondary_text, cta_secondary_url, display_order, is_active)
VALUES
  ('Premium Brand. Your Logo.', 'Elevate your corporate merchandise with world-class brands, expertly customized.', 'Explore Brands', '/brands', 'Get a Quote', '/my-quote', 1, true),
  ('Brands That Inspire', 'From Patagonia to YETI, outfit your team with gear they will actually want to wear.', 'View Collection', '/studio', 'Contact Us', '/about#contact', 2, true),
  ('Custom Without Compromise', 'Professional embroidery and printing on premium products. Minimum orders starting at just 12 pieces.', 'Start Your Project', '/studio', 'Learn More', '/about', 3, true)
ON CONFLICT DO NOTHING;

-- ============================================
-- SEED SITE SETTINGS
-- ============================================
INSERT INTO public.site_settings (key, value, description)
VALUES
  ('contact_email', '"hello@promoshopstudio.com"', 'Primary contact email'),
  ('contact_phone', '"+1 (555) 123-4567"', 'Primary contact phone'),
  ('contact_address', '{"street": "123 Main Street", "city": "Toronto", "province": "ON", "postal": "M5V 1A1", "country": "Canada"}'::jsonb, 'Business address'),
  ('social_links', '{"instagram": "https://instagram.com/promoshopstudio", "linkedin": "https://linkedin.com/company/promoshopstudio"}'::jsonb, 'Social media links'),
  ('min_order_quantity', '12', 'Minimum order quantity for all products')
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  description = EXCLUDED.description;
