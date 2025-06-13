-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  image_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add is_active column to categories if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'categories' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE categories ADD COLUMN is_active boolean DEFAULT true;
  END IF;
END $$;

-- Metal colors table
CREATE TABLE IF NOT EXISTS metal_colors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  hex_color text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add is_active column to metal_colors if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'metal_colors' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE metal_colors ADD COLUMN is_active boolean DEFAULT true;
  END IF;
END $$;

-- Check if products table exists and add new columns if needed
DO $$
BEGIN
  -- Add product_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'product_id'
  ) THEN
    ALTER TABLE products ADD COLUMN product_id text;
  END IF;

  -- Add product_name column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'product_name'
  ) THEN
    ALTER TABLE products ADD COLUMN product_name text;
  END IF;

  -- Add product_link column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'product_link'
  ) THEN
    ALTER TABLE products ADD COLUMN product_link text;
  END IF;

  -- Add metal_type column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'metal_type'
  ) THEN
    ALTER TABLE products ADD COLUMN metal_type text;
  END IF;

  -- Add category_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'category_id'
  ) THEN
    ALTER TABLE products ADD COLUMN category_id uuid;
  END IF;

  -- Add diamond_color column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'diamond_color'
  ) THEN
    ALTER TABLE products ADD COLUMN diamond_color text;
  END IF;

  -- Add diamond_piece_count column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'diamond_piece_count'
  ) THEN
    ALTER TABLE products ADD COLUMN diamond_piece_count integer DEFAULT 0;
  END IF;

  -- Add diamond_weight column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'diamond_weight'
  ) THEN
    ALTER TABLE products ADD COLUMN diamond_weight decimal(8,3) DEFAULT 0;
  END IF;

  -- Add gross_weight column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'gross_weight'
  ) THEN
    ALTER TABLE products ADD COLUMN gross_weight decimal(8,3);
  END IF;

  -- Add net_weight column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'net_weight'
  ) THEN
    ALTER TABLE products ADD COLUMN net_weight decimal(8,3);
  END IF;

  -- Add metal_color_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'metal_color_id'
  ) THEN
    ALTER TABLE products ADD COLUMN metal_color_id uuid;
  END IF;

  -- Add stock_quantity column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'stock_quantity'
  ) THEN
    ALTER TABLE products ADD COLUMN stock_quantity integer DEFAULT 0;
  END IF;

  -- Add featured column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'featured'
  ) THEN
    ALTER TABLE products ADD COLUMN featured boolean DEFAULT false;
  END IF;

  -- Add updated_at column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE products ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;

-- Add constraints after columns are created
DO $$
BEGIN
  -- Add unique constraint on product_id if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'products' AND constraint_name = 'products_product_id_key'
  ) THEN
    ALTER TABLE products ADD CONSTRAINT products_product_id_key UNIQUE (product_id);
  END IF;

  -- Add check constraint on metal_type if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'products' AND constraint_name = 'products_metal_type_check'
  ) THEN
    ALTER TABLE products ADD CONSTRAINT products_metal_type_check 
    CHECK (metal_type IN ('Gold', 'Silver', 'Platinum'));
  END IF;

  -- Add foreign key constraint for category_id if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'products' AND constraint_name = 'products_category_id_fkey'
  ) THEN
    ALTER TABLE products ADD CONSTRAINT products_category_id_fkey 
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL;
  END IF;

  -- Add foreign key constraint for metal_color_id if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'products' AND constraint_name = 'products_metal_color_id_fkey'
  ) THEN
    ALTER TABLE products ADD CONSTRAINT products_metal_color_id_fkey 
    FOREIGN KEY (metal_color_id) REFERENCES metal_colors(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Product images table (without display_order column)
CREATE TABLE IF NOT EXISTS product_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  alt_text text,
  is_primary boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Product models table for 3D models
CREATE TABLE IF NOT EXISTS product_models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  model_url text NOT NULL,
  model_type text NOT NULL CHECK (model_type IN ('3D', 'AR', 'VR')),
  file_size bigint,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance (only for columns that exist)
DO $$
BEGIN
  -- Product indexes
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'category_id') THEN
    CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'metal_color_id') THEN
    CREATE INDEX IF NOT EXISTS idx_products_metal_color_id ON products(metal_color_id);
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'metal_type') THEN
    CREATE INDEX IF NOT EXISTS idx_products_metal_type ON products(metal_type);
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'availability') THEN
    CREATE INDEX IF NOT EXISTS idx_products_availability ON products(availability);
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'featured') THEN
    CREATE INDEX IF NOT EXISTS idx_products_featured ON products(featured);
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'created_at') THEN
    CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at);
  END IF;

  -- Category indexes (only if is_active column exists)
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'categories' AND column_name = 'is_active') THEN
    CREATE INDEX IF NOT EXISTS idx_categories_is_active ON categories(is_active);
  END IF;

  -- Metal color indexes (only if is_active column exists)
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'metal_colors' AND column_name = 'is_active') THEN
    CREATE INDEX IF NOT EXISTS idx_metal_colors_is_active ON metal_colors(is_active);
  END IF;
END $$;

-- Create indexes for new tables
CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_product_models_product_id ON product_models(product_id);

-- Full-text search index for products (only if columns exist)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'product_name'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'description'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_products_search ON products USING gin(
      to_tsvector('english', COALESCE(product_name, '') || ' ' || COALESCE(description, ''))
    );
  END IF;
END $$;

-- Enable RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE metal_colors ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_models ENABLE ROW LEVEL SECURITY;

-- Drop existing policies before creating new ones to avoid conflicts
DROP POLICY IF EXISTS "Anyone can view categories" ON categories;
DROP POLICY IF EXISTS "Admin can manage categories" ON categories;
DROP POLICY IF EXISTS "Anyone can view metal colors" ON metal_colors;
DROP POLICY IF EXISTS "Admin can manage metal colors" ON metal_colors;
DROP POLICY IF EXISTS "Anyone can view product images" ON product_images;
DROP POLICY IF EXISTS "Admin can manage product images" ON product_images;
DROP POLICY IF EXISTS "Anyone can view product models" ON product_models;
DROP POLICY IF EXISTS "Admin can manage product models" ON product_models;

-- RLS Policies for categories
DO $$
BEGIN
  -- Check if is_active column exists before creating policies that use it
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'categories' AND column_name = 'is_active') THEN
    CREATE POLICY "Anyone can view categories"
      ON categories
      FOR SELECT
      TO public
      USING (is_active = true);
  ELSE
    -- Create policy without is_active check
    CREATE POLICY "Anyone can view categories"
      ON categories
      FOR SELECT
      TO public
      USING (true);
  END IF;
END $$;

CREATE POLICY "Admin can manage categories"
  ON categories
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.auth_user_id = auth.uid() 
      AND admin_users.status = 'active'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.auth_user_id = auth.uid() 
      AND admin_users.status = 'active'
    )
  );

-- RLS Policies for metal_colors
DO $$
BEGIN
  -- Check if is_active column exists before creating policies that use it
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'metal_colors' AND column_name = 'is_active') THEN
    CREATE POLICY "Anyone can view metal colors"
      ON metal_colors
      FOR SELECT
      TO public
      USING (is_active = true);
  ELSE
    -- Create policy without is_active check
    CREATE POLICY "Anyone can view metal colors"
      ON metal_colors
      FOR SELECT
      TO public
      USING (true);
  END IF;
END $$;

CREATE POLICY "Admin can manage metal colors"
  ON metal_colors
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.auth_user_id = auth.uid() 
      AND admin_users.status = 'active'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.auth_user_id = auth.uid() 
      AND admin_users.status = 'active'
    )
  );

-- RLS Policies for product_images
CREATE POLICY "Anyone can view product images"
  ON product_images
  FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM products 
      WHERE products.id = product_images.product_id 
      AND products.availability = true
    )
  );

CREATE POLICY "Admin can manage product images"
  ON product_images
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.auth_user_id = auth.uid() 
      AND admin_users.status = 'active'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.auth_user_id = auth.uid() 
      AND admin_users.status = 'active'
    )
  );

-- RLS Policies for product_models
CREATE POLICY "Anyone can view product models"
  ON product_models
  FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM products 
      WHERE products.id = product_models.product_id 
      AND products.availability = true
    )
  );

CREATE POLICY "Admin can manage product models"
  ON product_models
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.auth_user_id = auth.uid() 
      AND admin_users.status = 'active'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.auth_user_id = auth.uid() 
      AND admin_users.status = 'active'
    )
  );

-- Create trigger function for updating timestamps if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
DO $$
BEGIN
  -- Categories trigger
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.triggers 
    WHERE trigger_name = 'update_categories_updated_at'
  ) THEN
    CREATE TRIGGER update_categories_updated_at
      BEFORE UPDATE ON categories
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;

  -- Metal colors trigger
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.triggers 
    WHERE trigger_name = 'update_metal_colors_updated_at'
  ) THEN
    CREATE TRIGGER update_metal_colors_updated_at
      BEFORE UPDATE ON metal_colors
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;

  -- Products trigger (only if updated_at column exists)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'updated_at'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.triggers 
    WHERE trigger_name = 'update_products_updated_at'
  ) THEN
    CREATE TRIGGER update_products_updated_at
      BEFORE UPDATE ON products
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Insert default categories (only using columns that exist)
INSERT INTO categories (name, description) VALUES
('Ring', 'Engagement rings, wedding bands, and fashion rings'),
('Bracelet', 'Tennis bracelets, charm bracelets, and cuff bracelets'),
('Bangle', 'Traditional and modern bangles'),
('Necklace', 'Chains, pendants, and statement necklaces'),
('Earring', 'Studs, hoops, and drop earrings')
ON CONFLICT (name) DO NOTHING;

-- Insert default metal colors (only using columns that exist)
INSERT INTO metal_colors (name, hex_color) VALUES
('Gold', '#FFD700'),
('Rose Gold', '#E8B4A0'),
('White Gold', '#F8F8FF'),
('Silver', '#C0C0C0'),
('Platinum', '#E5E4E2')
ON CONFLICT (name) DO NOTHING;