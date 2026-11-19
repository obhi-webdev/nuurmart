"use client";

import Link from "next/link";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Save, RefreshCw } from "lucide-react";
import { adminMe } from "@/services/admin-api";

const API = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api"
).replace(/\/$/, "");

type Product = {
  _id: string;
  name: string;
  slug: string;
  sku: string;
  categorySlug: string;
  price: number;
  compareAtPrice?: number;
  stockQuantity: number;
  unit: string;
  shortDescription: string;
  description: string;
  images: string[];
  featured: boolean;
  status: "draft" | "active" | "archived";
};

type Category = {
  _id: string;
  name: string;
  slug: string;
};

type FormData = {
  name: string;
  slug: string;
  sku: string;
  categorySlug: string;
  price: string;
  compareAtPrice: string;
  stockQuantity: string;
  unit: string;
  shortDescription: string;
  description: string;
  image: string;
  featured: boolean;
  status: Product["status"];
};

const empty: FormData = {
  name: "",
  slug: "",
  sku: "",
  categorySlug: "",
  price: "",
  compareAtPrice: "",
  stockQuantity: "0",
  unit: "1 kg",
  shortDescription: "",
  description: "",
  image: "",
  featured: false,
  status: "draft"
};

function toForm(p: Product): FormData {
  return {
    name: p.name,
    slug: p.slug,
    sku: p.sku,
    categorySlug: p.categorySlug,
    price: String(p.price),
    compareAtPrice: p.compareAtPrice === undefined
      ? "" : String(p.compareAtPrice),
    stockQuantity: String(p.stockQuantity),
    unit: p.unit,
    shortDescription: p.shortDescription || "",
    description: p.description || "",
    image: p.images?.[0] || "",
    featured: p.featured,
    status: p.status
  };
}

async function apiRequest(path: string, options?: RequestInit) {
  const response = await fetch(`${API}${path}`, {
    ...options,
    credentials: "include",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...options?.headers
    }
  });

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.message || `HTTP ${response.status}`);
  }

  return result;
}

export default function AdminProductsPage() {
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState<FormData>(empty);
  const [editing, setEditing] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      await adminMe();

      const [p, c] = await Promise.all([
        apiRequest("/admin/products"),
        apiRequest("/admin/categories")
      ]);

      setProducts(p.data);
      setCategories(c.data);
    } catch (err) {
      if (err instanceof Error && err.message === "Unauthorized") {
        router.replace("/admin/login");
      } else {
        setError(err instanceof Error ? err.message : "Loading failed");
      }
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void load();
  }, [load]);

  function change<K extends keyof FormData>(
    key: K,
    value: FormData[K]
  ) {
    setForm((previous) => ({
      ...previous,
      [key]: value
    }));
  }

  function startEdit(product: Product) {
    setEditing(product._id);
    setForm(toForm(product));
    setMessage("");
    document.getElementById("product-form")?.scrollIntoView({
      behavior: "smooth"
    });
  }

  function reset() {
    setEditing(null);
    setForm(empty);
    setMessage("");
  }

  async function uploadImage(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const image = event.target.files?.[0];
    if (!image) return;

    if (image.size > 5 * 1024 * 1024) {
      setError("Maximum image size is 5 MB.");
      event.target.value = "";
      return;
    }

    setUploading(true);
    setError("");
    setMessage("");

    try {
      const body = new FormData();
      body.append("image", image);

      const response = await fetch(`${API}/admin/uploads/product-image`, {
        method: "POST",
        credentials: "include",
        body
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Image upload failed");
      }

      change("image", result.data.url);
      setMessage("Image uploaded and optimized successfully.");
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Image upload failed"
      );
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim().toLowerCase(),
        sku: form.sku.trim().toUpperCase(),
        categorySlug: form.categorySlug,
        price: Number(form.price),
        compareAtPrice: form.compareAtPrice.trim() === ""
          ? null : Number(form.compareAtPrice),
        stockQuantity: Number(form.stockQuantity),
        unit: form.unit.trim(),
        shortDescription: form.shortDescription,
        description: form.description,
        images: form.image.trim() ? [form.image.trim()] : [],
        featured: form.featured,
        status: form.status
      };

      await apiRequest(
        editing ? `/admin/products/${editing}` : "/admin/products",
        {
          method: editing ? "PATCH" : "POST",
          body: JSON.stringify(payload)
        }
      );

      setMessage(editing ? "Product updated successfully." : "Product created successfully.");
      setEditing(null);
      setForm(empty);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="nma-manage">
      <div className="nma-manage-container">
        <div className="nma-manage-top">
          <Link href="/admin/dashboard">
            <ArrowLeft size={17} /> Dashboard
          </Link>
          <span>NUURMART ADMIN CONSOLE</span>
        </div>

        <div className="nma-manage-heading">
          <div>
            <span className="nma-overline">CATALOG MANAGEMENT</span>
            <h1>Manage Products</h1>
            <p>Control products, pricing, stock and publication status.</p>
          </div>
          <button type="button" onClick={reset}>
            <Plus size={17} /> New Product
          </button>
        </div>

        {error && <p className="nma-manage-error" role="alert">{error}</p>}
        {message && <p className="nma-manage-success" role="status">{message}</p>}

        <div className="nma-manage-layout">
          <section className="nma-manage-panel" id="product-form">
            <h2>{editing ? "Edit Product" : "Add New Product"}</h2>

            <form onSubmit={submit} className="nma-manage-form">
              <label>Product Name
                <input required minLength={2} maxLength={180}
                  value={form.name}
                  onChange={(e) => change("name", e.target.value)}/>
              </label>

              <label>Product Slug
                <input required placeholder="premium-raw-honey"
                  pattern="[a-z0-9]+(-[a-z0-9]+)*"
                  value={form.slug}
                  onChange={(e) => change("slug", e.target.value)}/>
              </label>

              <label>SKU
                <input required placeholder="NUUR-HON-001"
                  value={form.sku}
                  onChange={(e) => change("sku", e.target.value)}/>
              </label>

              <label>Category
                <select required value={form.categorySlug}
                  onChange={(e) => change("categorySlug", e.target.value)}>
                  <option value="">Select Category</option>
                  {categories.map((c) => (
                    <option value={c.slug} key={c._id}>{c.name}</option>
                  ))}
                </select>
              </label>

              <div className="nma-form-columns">
                <label>Price (৳)
                  <input type="number" min="0" step="0.01" required
                    value={form.price}
                    onChange={(e) => change("price", e.target.value)}/>
                </label>
                <label>Compare Price (৳)
                  <input type="number" min="0" step="0.01"
                    value={form.compareAtPrice}
                    onChange={(e) => change("compareAtPrice", e.target.value)}/>
                </label>
              </div>

              <div className="nma-form-columns">
                <label>Stock Quantity
                  <input type="number" min="0" step="1" required
                    value={form.stockQuantity}
                    onChange={(e) => change("stockQuantity", e.target.value)}/>
                </label>
                <label>Unit
                  <input required value={form.unit}
                    onChange={(e) => change("unit", e.target.value)}/>
                </label>
              </div>

              <div className="nma-image-upload">
                <label htmlFor="nma-product-upload">
                  Product Image
                </label>

                {form.image ? (
                  <div className="nma-image-preview">
                    <Image
                      src={form.image}
                      alt="Selected product preview"
                      width={160}
                      height={160}
                      unoptimized
                    />
                    <span>{form.image}</span>
                  </div>
                ) : (
                  <div className="nma-image-placeholder">
                    No product image selected
                  </div>
                )}

                <input
                  id="nma-product-upload"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={uploadImage}
                  disabled={uploading || saving}
                />

                <small>
                  {uploading
                    ? "Uploading and optimizing image..."
                    : "JPEG, PNG or WebP, maximum 5 MB"}
                </small>
              </div>

              <label>Short Description
                <textarea rows={2} maxLength={500}
                  value={form.shortDescription}
                  onChange={(e) => change("shortDescription", e.target.value)}/>
              </label>

              <label>Full Description
                <textarea rows={4} maxLength={10000}
                  value={form.description}
                  onChange={(e) => change("description", e.target.value)}/>
              </label>

              <label>Publication Status
                <select value={form.status}
                  onChange={(e) =>
                    change("status", e.target.value as Product["status"])
                  }>
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="archived">Archived</option>
                </select>
              </label>

              <label className="nma-check-label">
                <input type="checkbox" checked={form.featured}
                  onChange={(e) => change("featured", e.target.checked)}/>
                Featured Product
              </label>

              <button className="nma-save" type="submit" disabled={saving || uploading}>
                <Save size={17}/>
                {saving ? "Saving..." : editing ? "Update Product" : "Create Product"}
              </button>

              {editing && (
                <button type="button" onClick={reset}>
                  Cancel Editing
                </button>
              )}
            </form>
          </section>

          <section className="nma-manage-panel">
            <div className="nma-manage-list-head">
              <h2>Product Inventory ({products.length})</h2>
              <button type="button" onClick={() => void load()}>
                <RefreshCw size={17}/>
              </button>
            </div>

            {loading ? <p>Loading products...</p> :
              products.length === 0 ? <p>No products found.</p> :
              <div className="nma-product-list">
                {products.map((product) => (
                  <article key={product._id} className="nma-product-row">
                    <div>
                      <strong>{product.name}</strong>
                      <small>{product.sku} · {product.categorySlug}</small>
                      <span>
                        ৳{product.price.toLocaleString("en-BD")}
                        {" · "}Stock {product.stockQuantity}
                        {" · "}{product.status}
                      </span>
                    </div>
                    <button type="button" onClick={() => startEdit(product)}>
                      Edit
                    </button>
                  </article>
                ))}
              </div>
            }
          </section>
        </div>
      </div>
    </main>
  );
}
