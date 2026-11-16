import "dotenv/config";
import Database from "better-sqlite3";
import { randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

const databasePath = resolve(process.cwd(), "data", "pixel-forge.sqlite");
mkdirSync(dirname(databasePath), { recursive: true });

export const db = new Database(databasePath);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec([
  "CREATE TABLE IF NOT EXISTS products (",
  "  id TEXT PRIMARY KEY,",
  "  name TEXT NOT NULL,",
  "  category TEXT NOT NULL CHECK (category IN ('pc', 'laptop')),",
  "  price INTEGER NOT NULL CHECK (price > 0),",
  "  description TEXT NOT NULL,",
  "  processor TEXT NOT NULL,",
  "  graphics TEXT NOT NULL,",
  "  memory TEXT NOT NULL,",
  "  storage TEXT NOT NULL,",
  "  image_url TEXT NOT NULL,",
  "  published INTEGER NOT NULL DEFAULT 1,",
  "  featured INTEGER NOT NULL DEFAULT 0,",
  "  created_at TEXT NOT NULL",
  ");",
  "CREATE TABLE IF NOT EXISTS leads (",
  "  id TEXT PRIMARY KEY,",
  "  name TEXT NOT NULL,",
  "  phone TEXT NOT NULL,",
  "  product_id TEXT,",
  "  product_name TEXT NOT NULL,",
  "  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'closed')),",
  "  created_at TEXT NOT NULL,",
  "  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL",
  ");",
].join("\n"));

const count = db.prepare("SELECT COUNT(*) AS count FROM products").get() as { count: number };
if (count.count === 0) {
  const items = [
    {
      id: "pf-aurora-r5",
      name: "Aurora R5",
      category: "pc",
      price: 3299,
      description: "Сбалансированная игровая система для плавного Full HD и комфортного старта в киберспорте.",
      processor: "AMD Ryzen 5 7600",
      graphics: "GeForce RTX 4060 8 ГБ",
      memory: "32 ГБ DDR5",
      storage: "SSD NVMe 1 ТБ",
      image_url: "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=1200&q=85",
      featured: 1,
    },
    {
      id: "pf-phantom-x7",
      name: "Phantom X7",
      category: "pc",
      price: 4890,
      description: "Мощный универсальный компьютер для высоких настроек в современных играх и стриминга.",
      processor: "Intel Core i7-14700F",
      graphics: "GeForce RTX 4070 SUPER 12 ГБ",
      memory: "32 ГБ DDR5",
      storage: "SSD NVMe 2 ТБ",
      image_url: "/images/pixel-forge-workbench.png",
      featured: 1,
    },
    {
      id: "pf-titan-r9",
      name: "Titan R9 Studio",
      category: "pc",
      price: 7290,
      description: "Флагманская сборка с запасом мощности для 4K-гейминга, монтажа и сложных задач.",
      processor: "AMD Ryzen 9 9950X",
      graphics: "GeForce RTX 4080 SUPER 16 ГБ",
      memory: "64 ГБ DDR5",
      storage: "SSD NVMe 2 ТБ",
      image_url: "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=1200&q=85",
      featured: 1,
    },
    {
      id: "pf-pulse-r7",
      name: "Pulse R7",
      category: "pc",
      price: 4090,
      description: "Яркая сборка для высокого FPS в популярных играх и уверенного апгрейда в будущем.",
      processor: "AMD Ryzen 7 7700",
      graphics: "GeForce RTX 4060 Ti 8 ГБ",
      memory: "32 ГБ DDR5",
      storage: "SSD NVMe 1 ТБ",
      image_url: "https://images.unsplash.com/photo-1593640408182-31c70c8268f5?auto=format&fit=crop&w=1200&q=85",
      featured: 0,
    },
    {
      id: "pf-nova-15",
      name: "Nova 15",
      category: "laptop",
      price: 3790,
      description: "Компактный игровой ноутбук с быстрым экраном и графикой для учёбы и вечеров с друзьями.",
      processor: "AMD Ryzen 7 8845HS",
      graphics: "GeForce RTX 4060 8 ГБ",
      memory: "16 ГБ DDR5",
      storage: "SSD NVMe 1 ТБ",
      image_url: "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=1200&q=85",
      featured: 1,
    },
    {
      id: "pf-vertex-16",
      name: "Vertex 16",
      category: "laptop",
      price: 5290,
      description: "Производительный ноутбук с большим экраном для динамичных игр и работы с графикой.",
      processor: "Intel Core i7-14650HX",
      graphics: "GeForce RTX 4070 8 ГБ",
      memory: "32 ГБ DDR5",
      storage: "SSD NVMe 1 ТБ",
      image_url: "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=1200&q=85",
      featured: 1,
    },
    {
      id: "pf-dash-14",
      name: "Dash 14",
      category: "laptop",
      price: 2990,
      description: "Лёгкая модель на каждый день с дискретной графикой для популярных онлайн-игр.",
      processor: "Intel Core i5-13500H",
      graphics: "GeForce RTX 4050 6 ГБ",
      memory: "16 ГБ DDR5",
      storage: "SSD NVMe 512 ГБ",
      image_url: "https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?auto=format&fit=crop&w=1200&q=85",
      featured: 0,
    },
    {
      id: "pf-ghost-17",
      name: "Ghost 17 Pro",
      category: "laptop",
      price: 6490,
      description: "Большой игровой ноутбук для тех, кому важны высокая частота кадров и просторный экран.",
      processor: "Intel Core i9-14900HX",
      graphics: "GeForce RTX 4080 12 ГБ",
      memory: "32 ГБ DDR5",
      storage: "SSD NVMe 2 ТБ",
      image_url: "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=1200&q=85",
      featured: 0,
    },
  ];
  const insert = db.prepare([
    "INSERT INTO products",
    "(id, name, category, price, description, processor, graphics, memory, storage, image_url, published, featured, created_at)",
    "VALUES (@id, @name, @category, @price, @description, @processor, @graphics, @memory, @storage, @image_url, 1, @featured, @created_at)",
  ].join(" "));
  const seed = db.transaction(() => {
    for (const item of items) insert.run({ ...item, created_at: new Date().toISOString() });
  });
  seed();
}

export type ProductRecord = {
  id: string;
  name: string;
  category: "pc" | "laptop";
  price: number;
  description: string;
  processor: string;
  graphics: string;
  memory: string;
  storage: string;
  image_url: string;
  published: number;
  featured: number;
  created_at: string;
};

export type LeadRecord = {
  id: string;
  name: string;
  phone: string;
  product_id: string | null;
  product_name: string;
  status: "new" | "contacted" | "closed";
  created_at: string;
};

export function serializeProduct(row: ProductRecord) {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    price: row.price,
    description: row.description,
    processor: row.processor,
    graphics: row.graphics,
    memory: row.memory,
    storage: row.storage,
    imageUrl: row.image_url,
    published: Boolean(row.published),
    featured: Boolean(row.featured),
    createdAt: row.created_at,
  };
}

export function serializeLead(row: LeadRecord) {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    productId: row.product_id,
    productName: row.product_name,
    status: row.status,
    createdAt: row.created_at,
  };
}

export function createId() {
  return randomUUID();
}
