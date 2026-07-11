export type ProductStatus = "Active" | "Hidden" | "Sold";

export interface CatalogGame {
  id: number;
  name: string;
  imageUrl: string | null;
  createdAt: string;
}

export interface CatalogCategory {
  id: number;
  name: string;
  createdAt: string;
}

export interface CatalogProduct {
  id: number;
  sellerId: number;
  gameId: number;
  categoryId: number;
  title: string;
  description: string;
  price: number;
  status: ProductStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CatalogData {
  games: CatalogGame[];
  categories: CatalogCategory[];
  products: CatalogProduct[];
}
