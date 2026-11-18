import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { categories } from "@/features/products/catalog";
import {
  categorySlug,
  findCategory,
} from "@/features/products/routes";
import { CollectionView } from "@/components/collections/CollectionView";

type Props = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return categories
    .filter((category) => category.name !== "All")
    .map((category) => ({ slug: categorySlug(category.name) }));
}

export async function generateMetadata({
  params,
}: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = findCategory(slug);

  return {
    title: category
      ? `${category} Collection | NuurMart`
      : "Collection Not Found | NuurMart",
    description: category
      ? `Browse NuurMart's ${category} collection. Demo catalog.`
      : "Collection unavailable.",
  };
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const category = findCategory(slug);
  if (!category) notFound();

  return <CollectionView initialCategory={category} />;
}
