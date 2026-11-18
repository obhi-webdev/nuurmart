import { CollectionView } from "@/components/collections/CollectionView";

export const metadata = {
  title: "Shop All Products | NuurMart",
  description: "Explore NuurMart's grocery and organic food collections.",
};

export default function AllCollectionsPage() {
  return <CollectionView initialCategory="All" />;
}
