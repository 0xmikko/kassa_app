export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  description: string;
}

export interface ProductDatabase {
  metadata: {
    version: string;
    lastUpdated: string;
    description: string;
    totalProducts: number;
  };
  products: Record<string, Product>;
}
