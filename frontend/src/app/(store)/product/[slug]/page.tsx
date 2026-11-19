import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductDetails } from "@/components/product/ProductDetails";
import { fetchStoreProduct } from "@/services/store-api";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: Props): Promise<Metadata> {
  const { slug } = await params;

  try {
    const product = await fetchStoreProduct(slug);

    return {
      title: product
        ? `${product.name} | NuurMart`
        : "Product Not Found | NuurMart",
      description: product
        ? `Explore ${product.name} at NuurMart.`
        : "Product not found.",
    };
  } catch {
    return {
      title: "NuurMart Product Details",
    };
  }
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await fetchStoreProduct(slug);

  if (!product) notFound();

  return <ProductDetails product={product} />;
}
