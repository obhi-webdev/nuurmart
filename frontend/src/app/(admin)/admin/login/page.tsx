"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight, Eye, EyeOff, Leaf, LockKeyhole,
  ShieldCheck, ShoppingBasket
} from "lucide-react";
import { adminLogin } from "@/services/admin-api";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function login(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      await adminLogin(email, password);
      router.replace("/admin/dashboard");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Login failed"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="nma-login">
      <section className="nma-login-brand">
        <div className="nma-brand">
          <Leaf size={30} />
          NUURMART
        </div>

        <div className="nma-login-brand-content">
          <span className="nma-overline">THE NUURMART CONTROL CENTER</span>
          <h1>
            Manage better.
            <br />
            <em>Grow smarter.</em>
          </h1>
          <p>
            A carefully designed workspace for your
            grocery and organic food business.
          </p>
          <div className="nma-brand-art">
            <ShoppingBasket size={125} strokeWidth={.8} />
          </div>
        </div>

        <span className="nma-brand-footer">
          NUURMART © {new Date().getFullYear()}
        </span>
      </section>

      <section className="nma-login-main">
        <div className="nma-login-form-wrap">
          <div className="nma-lock">
            <LockKeyhole size={24} />
          </div>

          <span className="nma-overline">SECURE ADMIN ACCESS</span>
          <h2>Welcome back.</h2>
          <p className="nma-login-intro">
            Enter your administrator credentials to continue.
          </p>

          <form onSubmit={login} className="nma-form">
            <label htmlFor="admin-email">Email Address</label>
            <input
              id="admin-email"
              type="email"
              autoComplete="username"
              placeholder="admin@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />

            <label htmlFor="admin-password">Password</label>
            <div className="nma-password">
              <input
                id="admin-password"
                type={visible ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                required
              />
              <button
                type="button"
                aria-label={visible ? "Hide password" : "Show password"}
                onClick={() => setVisible(!visible)}
              >
                {visible ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {error && <div className="nma-error" role="alert">{error}</div>}

            <button
              className="nma-login-submit"
              type="submit"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign in to Dashboard"}
              <ArrowRight size={18} />
            </button>
          </form>

          <div className="nma-login-trust">
            <ShieldCheck size={18} />
            Restricted to authorized NuurMart administrators.
          </div>
        </div>
      </section>
    </main>
  );
}
