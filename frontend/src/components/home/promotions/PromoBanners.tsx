import Image from "next/image";
import { ArrowUpRight } from "lucide-react";

const promotions = [
  {
    eyebrow: "EVERYDAY FRESHNESS",
    title: "Fresh picks.",
    emphasis: "Better days.",
    description: "Explore our thoughtful grocery selection.",
    image: "/images/campaigns/organic-market.jpg",
    category: "Organic Foods",
  },
  {
    eyebrow: "THE GOOD FOOD EDIT",
    title: "Eat well.",
    emphasis: "Live beautifully.",
    description: "Discover wholesome everyday essentials.",
    image: "/images/campaigns/healthy-food.jpg",
    category: "Nuts & Seeds",
  },
];

export function PromoBanners() {
  return (
    <section className="nm-v2-promotions" aria-label="Featured collections">
      <div className="nm-container">
        <div className="nm-v2-promo-heading">
          <span>DISCOVER SOMETHING GOOD</span>
          <span>THOUGHTFULLY SELECTED FOR YOU</span>
        </div>

        <div className="nm-v2-promo-grid">
          {promotions.map((promotion, index) => (
            <a
              href="#shop"
              className={`nm-v2-promo nm-v2-promo-${index + 1}`}
              key={promotion.title}
            >
              <Image
                src={promotion.image}
                alt={promotion.description}
                fill
                sizes="(max-width: 760px) 100vw, 50vw"
                className="nm-v2-cover"
              />
              <div className="nm-v2-promo-shade" />
              <div className="nm-v2-promo-content">
                <span>{promotion.eyebrow}</span>
                <h2>
                  {promotion.title}
                  <br />
                  <em>{promotion.emphasis}</em>
                </h2>
                <p>{promotion.description}</p>
                <span className="nm-v2-promo-link">
                  Shop Collection <ArrowUpRight size={17} />
                </span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
