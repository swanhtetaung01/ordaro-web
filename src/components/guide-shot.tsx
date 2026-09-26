"use client";

import Image from "next/image";
import { useRef } from "react";

import { focusRing } from "@/components/ui";

/** One phone screenshot in the shop guide. Tapping it shows it as large as the screen allows. */
export function GuideShot({
  src,
  height,
  caption,
  zoomLabel,
  closeLabel,
}: {
  src: string;
  height: number;
  caption: string;
  zoomLabel: string;
  closeLabel: string;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  return (
    <figure className="flex w-[min(74vw,18rem)] shrink-0 snap-start flex-col gap-2 lg:w-60">
      <button
        aria-label={zoomLabel}
        className={`block cursor-zoom-in rounded-[30px] bg-ink p-1.5 shadow-lg ${focusRing}`}
        onClick={() => dialog.current?.showModal()}
        type="button"
      >
        <Image alt={caption} className="h-auto w-full rounded-3xl bg-surface" height={height} src={src} unoptimized width={780} />
      </button>
      <figcaption className="px-1 text-sm text-slate">{caption}</figcaption>
      <dialog
        aria-label={caption}
        className="m-auto max-h-none max-w-none overflow-visible bg-transparent p-0 backdrop:bg-slate-950/85"
        onClick={() => dialog.current?.close()}
        ref={dialog}
      >
        <Image
          alt={caption}
          className="block h-auto max-h-[86dvh] w-auto max-w-[94vw] rounded-2xl"
          height={height}
          src={src}
          unoptimized
          width={780}
        />
        <p className="mt-3 text-center text-sm text-white">{closeLabel}</p>
      </dialog>
    </figure>
  );
}
