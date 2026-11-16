export type Category = "pc" | "laptop";
export type LeadStatus = "new" | "contacted" | "closed";

export type Product = {
  id: string;
  name: string;
  category: Category;
  price: number;
  description: string;
  processor: string;
  graphics: string;
  memory: string;
  storage: string;
  imageUrl: string;
  published: boolean;
  featured: boolean;
  createdAt: string;
};

export type Lead = {
  id: string;
  name: string;
  phone: string;
  productId: string | null;
  productName: string;
  status: LeadStatus;
  createdAt: string;
};

export type ProductInput = Omit<Product, "id" | "createdAt">;
