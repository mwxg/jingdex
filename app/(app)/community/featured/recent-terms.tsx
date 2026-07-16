"use client";

import {
  type MouseEvent,
  type PointerEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { TermDetailsModal } from "@/components/term-details-modal";
import { UsernameLink } from "@/components/username-link";
import {
  getChineseDisplayForms,
  type LanguagePreferences,
} from "@/lib/preferences/language";
import { type CommunityTerm } from "../data";

export function RecentTerms({
  preferences,
  terms,
}: Readonly<{
  preferences: LanguagePreferences;
  terms: CommunityTerm[];
}>) {
  const [selectedTerm, setSelectedTerm] = useState<CommunityTerm | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const viewportRef = useRef<HTMLDivElement>(null);
  const suppressClickRef = useRef(false);
  const dragRef = useRef({
    moved: false,
    pointerId: null as number | null,
    scrollLeft: 0,
    startX: 0,
  });

  const updateScrollButtons = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const maximumScroll = viewport.scrollWidth - viewport.clientWidth;
    setCanScrollLeft(viewport.scrollLeft > 1);
    setCanScrollRight(viewport.scrollLeft < maximumScroll - 1);
  }, []);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    updateScrollButtons();
    const resizeObserver = new ResizeObserver(updateScrollButtons);
    resizeObserver.observe(viewport);
    return () => resizeObserver.disconnect();
  }, [terms, updateScrollButtons]);

  function scrollTerms(direction: -1 | 1) {
    const viewport = viewportRef.current;
    if (!viewport) return;

    viewport.scrollBy({
      behavior: "smooth",
      left: direction * Math.max(144, viewport.clientWidth * 0.75),
    });
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== "mouse" || event.button !== 0) return;

    dragRef.current = {
      moved: false,
      pointerId: event.pointerId,
      scrollLeft: event.currentTarget.scrollLeft,
      startX: event.clientX,
    };
    setIsDragging(true);
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (drag.pointerId !== event.pointerId) return;

    const distance = event.clientX - drag.startX;
    if (Math.abs(distance) > 4) {
      drag.moved = true;
      if (!event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.setPointerCapture(event.pointerId);
      }
      event.preventDefault();
      event.currentTarget.scrollLeft = drag.scrollLeft - distance;
    }
  }

  function endDrag(event: PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (drag.pointerId !== event.pointerId) return;

    suppressClickRef.current = drag.moved;
    drag.pointerId = null;
    setIsDragging(false);
  }

  function cancelDrag(event: PointerEvent<HTMLDivElement>) {
    if (dragRef.current.pointerId !== event.pointerId) return;

    suppressClickRef.current = false;
    dragRef.current.pointerId = null;
    setIsDragging(false);
  }

  function handleClickCapture(event: MouseEvent<HTMLDivElement>) {
    if (!suppressClickRef.current) return;

    event.preventDefault();
    event.stopPropagation();
    suppressClickRef.current = false;
  }

  return (
    <>
      <div className="relative px-9">
        <button
          aria-label="Scroll to previous recent terms"
          className="absolute left-0 top-1/2 z-10 grid size-8 -translate-y-1/2 place-items-center rounded-full border border-muted-background bg-surface font-sans text-2xl font-bold text-foreground shadow-sm transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-35"
          disabled={!canScrollLeft}
          onClick={() => scrollTerms(-1)}
          type="button"
        >
          <span aria-hidden="true">‹</span>
        </button>

        <div
          className={`overflow-x-auto touch-pan-x select-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
          onClickCapture={handleClickCapture}
          onPointerCancel={cancelDrag}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={endDrag}
          onScroll={updateScrollButtons}
          ref={viewportRef}
        >
          <ul className="flex gap-2">
            {terms.map((term) => {
              const forms = getChineseDisplayForms(term, preferences.characterSet);
              const pronunciation = preferences.pronunciation === "zhuyin" ? term.zhuyin : term.pinyin;

              return (
                <li className="w-36 shrink-0 rounded-lg border border-muted-background bg-background p-2" key={term.id}>
                  <button
                    className="block w-full rounded text-left outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    onClick={() => setSelectedTerm(term)}
                    type="button"
                  >
                    <span className="block truncate font-chinese text-xl font-bold text-foreground">{forms.primary}</span>
                    <span className="mt-0.5 block truncate font-sans text-xs text-muted">{pronunciation}</span>
                  </button>
                  <p className="mt-1 truncate font-sans text-[0.6875rem] text-muted">
                    By <UsernameLink className="font-bold text-foreground hover:text-primary" username={term.added_by_display} />
                  </p>
                </li>
              );
            })}
          </ul>
        </div>

        <button
          aria-label="Scroll to next recent terms"
          className="absolute right-0 top-1/2 z-10 grid size-8 -translate-y-1/2 place-items-center rounded-full border border-muted-background bg-surface font-sans text-2xl font-bold text-foreground shadow-sm transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-35"
          disabled={!canScrollRight}
          onClick={() => scrollTerms(1)}
          type="button"
        >
          <span aria-hidden="true">›</span>
        </button>
      </div>

      {selectedTerm ? (
        <TermDetailsModal
          onClose={() => setSelectedTerm(null)}
          preferences={preferences}
          term={selectedTerm}
        />
      ) : null}
    </>
  );
}
