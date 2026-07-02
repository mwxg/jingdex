"use client";

import Image from "next/image";
import { useState } from "react";

export function PopupDemo() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="rounded-lg border border-muted-background bg-surface p-5">
      <button
        type="button"
        className="h-11 rounded-lg bg-primary px-5 font-sans text-sm font-bold text-text-light transition-colors hover:bg-primary/90"
        onClick={() => setIsOpen(true)}
      >
        Show message
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/25 px-6">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="demo-popup-title"
            className="relative w-full max-w-md rounded-lg border border-muted-background bg-surface p-6 shadow-xl"
          >
            <button
              type="button"
              aria-label="Close message"
              className="absolute right-3 top-3 grid size-10 place-items-center rounded-lg transition-colors hover:bg-muted-background"
              onClick={() => setIsOpen(false)}
            >
              <Image
                src="/icons/cross.svg"
                alt=""
                width={16}
                height={16}
                aria-hidden="true"
              />
            </button>

            <p className="font-sans text-sm font-bold uppercase text-primary">
              Study note
            </p>
            <h3
              id="demo-popup-title"
              className="mt-2 pr-10 font-heading text-3xl font-semibold text-foreground"
            >
              Card saved
            </h3>
            <p className="mt-3 font-sans text-base leading-7 text-muted">
              Your vocabulary card was added to the review queue. It will appear
              in your next study session.
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
