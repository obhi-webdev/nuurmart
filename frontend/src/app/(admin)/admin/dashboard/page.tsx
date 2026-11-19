"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BarChart3, Boxes, ChevronRight, LayoutDashboard,
  Leaf, LogOut, Package, Settings, ShoppingBag,
  Tag, Users
} from "lucide-react";
import {
  adminMe, adminLogout, type AdminUser
} from "@/services/admin-api";

const modules = [
  { name: "Products", icon: Package, info: "Catalog management", status: "Upcoming" },
  { name: "Categories", icon: Tag, info: "Organize collections", status: "Upcoming" },
  { name: "Orders", icon: ShoppingBag, info: "Track customer orders", status: "Upcoming" },
  { name: "Customers", icon: Users, info: "Customer management", status: "Upcoming" },
  { name: "Inventory", icon: Boxes, info: "Stock and availability", status: "Upcoming" },
  { name: "Analytics", icon: BarChart3, info: "Sales and performance", status: "Upcoming" },
];

export default function AdminDashboardPage() {
  const router = useRouter();
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [checking, setChecking] = useState(true);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    let active = true;

    adminMe()
      .then((user) => {
        if (active) setAdmin(user);
      })
      .catch(() => {
        if (active) router.replace("/admin/login");
      })
      .finally(() => {
        if (active) setChecking(false);
      });

    return () => {
      active = false;
    };
  }, [router]);

  async function logout() {
    setSigningOut(true);

    try {
      await adminLogout();
      router.replace("/admin/login");
    } catch {
      setSigningOut(false);
      window.alert("Sign out failed. Please try again.");
    }
  }

  if (checking || !admin) {
    return (
      <div className="nma-loading" role="status">
        <Leaf size={30} />
        Verifying administrator session...
      </div>
    );
  }

  return (
    <div className="nma-dashboard">
      <aside className="nma-sidebar">
        <Link href="/admin/dashboard" className="nma-side-logo">
          <Leaf size={27} />
          NUURMART
        </Link>

        <span className="nma-sidebar-caption">ADMIN WORKSPACE</span>

        <div className="nma-side-active">
          <LayoutDashboard size={19} />
          Overview
        </div>

        <div className="nma-sidebar-divider" />

        <p className="nma-side-note">
          Product management and operational modules will be
          enabled in the next development phase.
        </p>

        <div className="nma-side-bottom">
          <Settings size={18} />
          <span>Admin Foundation V1</span>
        </div>
      </aside>

      <div className="nma-dashboard-main">
        <header className="nma-dashboard-header">
          <div>
            <span className="nma-overline">NUURMART / ADMIN</span>
            <h1>Overview</h1>
          </div>

          <div className="nma-admin-actions">
            <span>{admin.name}</span>
            <button onClick={logout} disabled={signingOut}>
              <LogOut size={17} />
              {signingOut ? "Signing out..." : "Sign out"}
            </button>
          </div>
        </header>

        <div className="nma-dashboard-content">
          <div className="nma-welcome">
            <div>
              <span className="nma-overline">ADMINISTRATION CENTER</span>
              <h2>Welcome to NuurMart.</h2>
              <p>
                Your secure administration workspace is ready.
                Business modules will appear here as they are implemented.
              </p>
            </div>
            <Leaf size={75} strokeWidth={.8} />
          </div>

          <div className="nma-modules-header">
            <div>
              <span className="nma-overline">STORE OPERATIONS</span>
              <h2>Management Modules</h2>
            </div>
            <span>6 PLANNED MODULES</span>
          </div>

          <div className="nma-modules">
            {modules.map((item) => (
              <article className="nma-module" key={item.name}>
                <div className="nma-module-icon">
                  <item.icon size={22} />
                </div>
                <h3>{item.name}</h3>
                <p>{item.info}</p>
                <div>
                  {item.name === "Products" || item.name === "Categories" ? (
                    <Link href={
                      item.name === "Products"
                        ? "/admin/products"
                        : "/admin/categories"
                    }>
                      Open Manager <ChevronRight size={17}/>
                    </Link>
                  ) : (
                    <>
                      <span>{item.status}</span>
                      <ChevronRight size={17}/>
                    </>
                  )}
                </div>
              </article>
            ))}
          </div>

          <div className="nma-security-status">
            <Leaf size={20} />
            Signed in as {admin.email} · {admin.role}
          </div>
        </div>
      </div>
    </div>
  );
}
