import productsData from '../data/products.json';
import {Product, ProductDatabase} from './types';

interface ProductDataFromJSON {
  metadata: {
    version: string;
    lastUpdated: string;
    description: string;
    totalProducts: number;
  };
  products: Product[];
}

class ProductService {
  private database: ProductDatabase;

  constructor() {
    const jsonData = productsData as ProductDataFromJSON;

    // Convert products array to record for efficient lookups
    const productsRecord: Record<string, Product> = {};
    jsonData.products.forEach(product => {
      productsRecord[product.id] = product;
    });

    this.database = {
      metadata: jsonData.metadata,
      products: productsRecord,
    };
  }

  /**
   * Get product by barcode
   */
  getProductByBarcode(barcode: string): Product | null {
    return this.database.products[barcode] || null;
  }

  /**
   * Get all products
   */
  getAllProducts(): Record<string, Product> {
    return this.database.products;
  }

  /**
   * Get products by category
   */
  getProductsByCategory(category: string): Product[] {
    return Object.values(this.database.products).filter(
      product => product.category === category,
    );
  }

  /**
   * Get all categories
   */
  getCategories(): string[] {
    const categories = Object.values(this.database.products)
      .map(product => product.category)
      .filter(Boolean) as string[];
    return [...new Set(categories)];
  }

  /**
   * Get database metadata
   */
  getMetadata() {
    return this.database.metadata;
  }
}

// Export singleton instance
export const productService = new ProductService();

// Export the product database for backward compatibility
export const PRODUCT_DATABASE = productService.getAllProducts();
