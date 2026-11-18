import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { products } from "@/features/products/catalog";
import { findProduct } from "@/features/products/routes";
import { ProductDetails } from "@/components/product/ProductDetails";

type Props = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return products.map((product) => ({ slug: product.id }));
}

export async function generateMetadata({
  params,
}: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = findProduct(slug);

  return {
    title: product
      ? `${product.name} | NuurMart`
      : "Product Not Found | NuurMart",
    description: product
      ? `Explore ${product.name} at NuurMart. Demo product information.`
      : "Product unavailable.",
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = findProduct(slug);

  if (!product) notFound();

  return <ProductDetails product={product} />;
}
