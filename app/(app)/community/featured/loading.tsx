import { CollectionPageSkeleton } from "@/components/loading";

export default function LoadingFeaturedContent() {
  return (
    <CollectionPageSkeleton
      cardCount={3}
      controls={false}
      label="Loading featured content"
    />
  );
}
