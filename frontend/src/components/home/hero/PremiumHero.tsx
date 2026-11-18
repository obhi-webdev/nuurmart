import Image from "next/image";
import { ArrowDownRight, ArrowUpRight, Leaf } from "lucide-react";

export function PremiumHero() {
  return (
    <section className="nm-v2-hero" aria-labelledby="nm-hero-title">
      <div className="nm-container nm-v2-hero-shell">
        <div className="nm-v2-hero-copy">
          <div className="nm-v2-overline">
            <Leaf size={15} strokeWidth={1.5} />
            THE ART OF GOOD LIVING
          </div>

          <h1 id="nm-hero-title">
            Nature&apos;s finest.
            <br />
            <em>For your everyday.</em>
          </h1>

          <p>
            From carefully selected pantry essentials to
            naturally inspired favourites, discover a more
            thoughtful way to shop.
          </p>

          <div className="nm-v2-hero-actions">
            <a className="nm-v2-primary" href="#shop">
              Explore the Collection
              <ArrowUpRight size={17} />
            </a>
            <a href="#categories" className="nm-v2-secondary">
              Browse Categories
              <ArrowDownRight size={17} />
            </a>
          </div>

          <div className="nm-v2-hero-footer">
            <span>01 / 03</span>
            <span className="nm-v2-line" />
            <span>CURATED GROCERY ESSENTIALS</span>
          </div>
        </div>

        <div className="nm-v2-hero-image">
          <Image
            src="/images/campaigns/hero-gourmet.jpg"
            alt="Beautifully arranged gourmet food and fresh ingredients"
            fill
            priority
            sizes="(max-width: 800px) 100vw, 55vw"
            className="nm-v2-cover"
          />
          <div className="nm-v2-image-shade" />
          <div className="nm-v2-image-label">
            <span>THE NUURMART EDIT</span>
            <strong>Good food. Beautiful moments.</strong>
          </div>
          <div className="nm-v2-image-seal">
            <Leaf size={23} strokeWidth={1.25} />
            <span>NATURALLY</span>
            <strong>GOOD</strong>
          </div>
        </div>
      </div>
    </section>
  );
}
