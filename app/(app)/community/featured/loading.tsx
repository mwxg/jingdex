import { CollectionPageSkeleton } from "@/components/loading";

export default function LoadingFeaturedDecks() {
  return (
    <CollectionPageSkeleton
      cardCount={3}
      controls={false}
      label="Loading featured decks"
    />
  );
}
