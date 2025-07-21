// filepath: src/app/pages/apps/products/model/product-info.model.ts

export interface ProductInfo {
  code: string;
  product: ProductDetails | null;
}

export interface ProductDetails {
  _keywords?: string[];
  brands?: string | null;
  categories?: string | null;
  categories_hierarchy?: string[] | null;
  code?: string | null;
  generic_name?: string | null;
  image_url?: string | null;
  product_name?: string | null;
  stores?: string | null;
  unit?: string | null;
  product_type?: string | null;
  quantity?: string | null;
  serving_quantity?: string | null;
  serving_quantity_unit?: string | null;
  serving_size?: string | null;
  department?: string | null;
  category?: string | null;
  subcategory?: string | null;
  priceValidUntil?: string | null;
  price?: number | null;
  priceWithoutDiscount?: number | null;
  percentDiscount?: number | null;
}
