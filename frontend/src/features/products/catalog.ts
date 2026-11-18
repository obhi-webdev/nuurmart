export type Category =
  | "All"
  | "Honey"
  | "Dates"
  | "Oil & Ghee"
  | "Spices"
  | "Nuts & Seeds"
  | "Organic Foods";

export type Product = {
  id: string;
  name: string;
  category: Exclude<Category, "All">;
  price: number;
  compareAt?: number;
  unit: string;
  image: string;
  accent: string;
  badge?: string;
  featured?: boolean;
};

export const categories: {
  name: Category;
  icon: string;
  description: string;
}[] = [
  { name: "All", icon: "✦", description: "Everything" },
  { name: "Honey", icon: "🍯", description: "Pure & natural" },
  { name: "Dates", icon: "🌴", description: "Premium selection" },
  { name: "Oil & Ghee", icon: "🫒", description: "Everyday purity" },
  { name: "Spices", icon: "🌶️", description: "Freshly selected" },
  { name: "Nuts & Seeds", icon: "🥜", description: "Wholesome nutrition" },
  { name: "Organic Foods", icon: "🌾", description: "Better living" },
];

export const products: Product[] = [
  {
    id: "honey-01",
    name: "Premium Raw Natural Honey",
    category: "Honey",
    price: 1290,
    compareAt: 1490,
    unit: "1 kg",
    image: "🍯",
    accent: "#F4E2BA",
    badge: "BEST SELLER",
    featured: true,
  },
  {
    id: "dates-01",
    name: "Premium Medjool Dates",
    category: "Dates",
    price: 1850,
    compareAt: 2150,
    unit: "1 kg",
    image: "🌴",
    accent: "#E9D8C6",
    badge: "PREMIUM",
    featured: true,
  },
  {
    id: "oil-01",
    name: "Cold Pressed Mustard Oil",
    category: "Oil & Ghee",
    price: 890,
    compareAt: 990,
    unit: "1 litre",
    image: "🫒",
    accent: "#E8E9C9",
    badge: "PURE",
    featured: true,
  },
  {
    id: "nuts-01",
    name: "Premium Mixed Nuts",
    category: "Nuts & Seeds",
    price: 1450,
    compareAt: 1650,
    unit: "500 g",
    image: "🥜",
    accent: "#F1DDCC",
    featured: true,
  },
  {
    id: "spice-01",
    name: "Organic Turmeric Powder",
    category: "Spices",
    price: 350,
    unit: "250 g",
    image: "🌿",
    accent: "#F3E8BE",
    badge: "ORGANIC",
  },
  {
    id: "food-01",
    name: "Wholegrain Brown Rice",
    category: "Organic Foods",
    price: 680,
    unit: "2 kg",
    image: "🌾",
    accent: "#E4E9D9",
  },
  {
    id: "honey-02",
    name: "Black Seed Natural Honey",
    category: "Honey",
    price: 1590,
    compareAt: 1750,
    unit: "1 kg",
    image: "🍯",
    accent: "#E9D6BC",
  },
  {
    id: "dates-02",
    name: "Premium Ajwa Dates",
    category: "Dates",
    price: 2250,
    unit: "1 kg",
    image: "🌴",
    accent: "#E6DACD",
  },
];

export function formatPrice(value: number) {
  return `৳${value.toLocaleString("en-BD")}`;
}
