"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus } from "lucide-react";
import { adminMe } from "@/services/admin-api";

const API = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api"
).replace(/\/$/, "");

type Category = {
  _id: string;
  name: string;
  slug: string;
  description: string;
  isActive: boolean;
};

export default function AdminCategoriesPage() {
  const router = useRouter();
  const [items, setItems] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function load() {
    const res = await fetch(`${API}/admin/categories`, {
      credentials: "include",
      cache: "no-store"
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const result = await res.json();

    if (!result.success) throw new Error("Unable to load categories");

    setItems(result.data);
  }

  useEffect(() => {
    let active = true;

    async function initialize() {
      try {
        await adminMe();
        if (active) await load();
      } catch {
        if (active) router.replace("/admin/login");
      } finally {
        if (active) setLoading(false);
      }
    }

    void initialize();
    return () => { active = false; };
  }, [router]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch(`${API}/admin/categories`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, slug, description })
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(result.message || "Unable to create category");
      }

      setName("");
      setSlug("");
      setDescription("");
      setMessage("Category created successfully.");
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
            <ArrowLeft size={17}/> Dashboard
          </Link>
          <span>NUURMART ADMIN CONSOLE</span>
        </div>

        <div className="nma-manage-heading">
          <div>
            <span className="nma-overline">STORE ORGANIZATION</span>
            <h1>Manage Categories</h1>
            <p>Create and organize product collections.</p>
          </div>
          <Link href="/admin/products">Manage Products</Link>
        </div>

        {error && <p className="nma-manage-error" role="alert">{error}</p>}
        {message && <p className="nma-manage-success">{message}</p>}

        <div className="nma-manage-layout">
          <section className="nma-manage-panel">
            <h2>Add Category</h2>
            <form onSubmit={submit} className="nma-manage-form">
              <label>Category Name
                <input required minLength={2} maxLength={100}
                  value={name}
                  onChange={(e) => setName(e.target.value)}/>
              </label>
              <label>Category Slug
                <input required
                  placeholder="organic-foods"
                  pattern="[a-z0-9]+(-[a-z0-9]+)*"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}/>
              </label>
              <label>Description
                <textarea maxLength={500} rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}/>
              </label>
              <button type="submit" className="nma-save" disabled={saving}>
                <Plus size={17}/>
                {saving ? "Creating..." : "Create Category"}
              </button>
            </form>
          </section>

          <section className="nma-manage-panel">
            <h2>All Categories ({items.length})</h2>
            {loading ? <p>Loading...</p> : (
              <div className="nma-product-list">
                {items.map((item) => (
                  <article className="nma-product-row" key={item._id}>
                    <div>
                      <strong>{item.name}</strong>
                      <small>{item.slug}</small>
                      <span>{item.isActive ? "Active" : "Inactive"}</span>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
