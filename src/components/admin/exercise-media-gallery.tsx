import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { AdminExercise } from "@/lib/admin-exercises";
import { ChevronLeft, ChevronRight, ExternalLink, Images, Video } from "lucide-react";

export type GalleryMediaItem = {
  id: string;
  kind: "image" | "video";
  url: string;
  label?: string;
};

/** YouTube / Vimeo page URLs cannot play in <video> — convert to embed. */
export function getVideoEmbedUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "").toLowerCase();

    if (host === "youtu.be") {
      const id = parsed.pathname.split("/").filter(Boolean)[0];
      return id ? `https://www.youtube.com/embed/${id}?rel=0` : null;
    }

    if (host === "youtube.com" || host === "m.youtube.com" || host === "youtube-nocookie.com") {
      if (parsed.pathname.startsWith("/embed/")) {
        const id = parsed.pathname.split("/")[2];
        return id ? `https://www.youtube.com/embed/${id}?rel=0` : null;
      }
      if (parsed.pathname.startsWith("/shorts/")) {
        const id = parsed.pathname.split("/")[2];
        return id ? `https://www.youtube.com/embed/${id}?rel=0` : null;
      }
      const id = parsed.searchParams.get("v");
      return id ? `https://www.youtube.com/embed/${id}?rel=0` : null;
    }

    if (host === "vimeo.com" || host === "player.vimeo.com") {
      const parts = parsed.pathname.split("/").filter(Boolean);
      const id = host === "player.vimeo.com" ? parts[1] : parts[0];
      return id && /^\d+$/.test(id) ? `https://player.vimeo.com/video/${id}` : null;
    }
  } catch {
    return null;
  }
  return null;
}

export function collectExerciseMedia(exercise: AdminExercise): GalleryMediaItem[] {
  const seen = new Set<string>();
  const items: GalleryMediaItem[] = [];

  const imageUrls = exercise.imageUrls?.length
    ? exercise.imageUrls
    : exercise.imageUrl
      ? [exercise.imageUrl]
      : [];
  const videoUrls = exercise.videoUrls?.length
    ? exercise.videoUrls
    : exercise.videoUrl
      ? [exercise.videoUrl]
      : [];

  for (const url of imageUrls) {
    if (!url || seen.has(url)) continue;
    seen.add(url);
    items.push({ id: `img:${url}`, kind: "image", url, label: exercise.name });
  }
  for (const url of videoUrls) {
    if (!url || seen.has(url)) continue;
    seen.add(url);
    items.push({ id: `vid:${url}`, kind: "video", url, label: exercise.name });
  }

  return items;
}

export function ExerciseMediaButton({
  items,
  exerciseName,
}: {
  items: GalleryMediaItem[];
  exerciseName: string;
}) {
  const [open, setOpen] = useState(false);

  if (!items.length) {
    return <span className="text-xs text-muted-foreground">No media</span>;
  }

  const imageCount = items.filter((item) => item.kind === "image").length;
  const videoCount = items.filter((item) => item.kind === "video").length;
  const parts = [
    imageCount ? `${imageCount} img` : null,
    videoCount ? `${videoCount} vid` : null,
  ].filter(Boolean);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex max-w-full shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md border border-dashed border-border px-2 py-1 text-xs text-muted-foreground transition-colors hover:border-lime/50 hover:text-foreground"
        aria-label={`View ${items.length} media for ${exerciseName}`}
      >
        <Images className="h-3.5 w-3.5 shrink-0 text-lime" />
        <span className="whitespace-nowrap">{parts.join(" · ")}</span>
        <span className="shrink-0 text-[10px] uppercase tracking-wide text-lime/90">View</span>
      </button>

      <MediaGalleryDialog
        open={open}
        onOpenChange={setOpen}
        items={items}
        title={exerciseName}
      />
    </>
  );
}

function GalleryVideo({ url, title }: { url: string; title: string }) {
  const embedUrl = getVideoEmbedUrl(url);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [url]);

  if (embedUrl) {
    return (
      <iframe
        key={embedUrl}
        src={embedUrl}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        className="h-full w-full rounded border-0 bg-black"
      />
    );
  }

  if (failed) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-2 px-4 text-center">
        <p className="text-sm text-muted-foreground">
          This link isn’t a playable video file. Use an uploaded MP4/WebM, or a YouTube/Vimeo URL.
        </p>
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-lime hover:underline"
        >
          Open link <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>
    );
  }

  return (
    <video
      key={url}
      src={url}
      controls
      playsInline
      preload="metadata"
      className="h-full w-full rounded bg-black object-contain"
      onError={() => setFailed(true)}
    />
  );
}

export function MediaGalleryDialog({
  open,
  onOpenChange,
  items,
  title,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: GalleryMediaItem[];
  title: string;
}) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (open) setIndex(0);
  }, [open, items]);

  useEffect(() => {
    if (!open || items.length < 2) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        setIndex((current) => (current - 1 + items.length) % items.length);
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        setIndex((current) => (current + 1) % items.length);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, items.length]);

  const active = items[index] ?? null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[26rem] w-[min(92vw,32rem)] max-w-none flex-col gap-0 overflow-hidden border-border bg-panel p-0 sm:rounded-xl">
        <DialogHeader className="shrink-0 border-b border-border px-3 py-2.5 pr-11 text-left">
          <DialogTitle className="flex items-center gap-2 text-sm">
            <Images className="h-3.5 w-3.5 text-lime" />
            {title}
          </DialogTitle>
          <DialogDescription className="text-[11px]">
            {index + 1} of {items.length}
            {active ? ` · ${active.kind}` : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="relative min-h-0 flex-1 bg-black">
          <div className="absolute inset-0 p-2">
            {active?.kind === "image" ? (
              <img
                src={active.url}
                alt={title}
                className="h-full w-full rounded object-contain"
              />
            ) : active?.kind === "video" ? (
              <GalleryVideo url={active.url} title={title} />
            ) : null}
          </div>

          {items.length > 1 ? (
            <>
              <button
                type="button"
                className="absolute left-1.5 top-1/2 z-10 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full border border-border bg-panel/90 text-foreground shadow backdrop-blur hover:bg-panel"
                onClick={() => setIndex((current) => (current - 1 + items.length) % items.length)}
                aria-label="Previous media"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                className="absolute right-1.5 top-1/2 z-10 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full border border-border bg-panel/90 text-foreground shadow backdrop-blur hover:bg-panel"
                onClick={() => setIndex((current) => (current + 1) % items.length)}
                aria-label="Next media"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </>
          ) : null}
        </div>

        {items.length > 1 ? (
          <div className="shrink-0 border-t border-border bg-panel-2/50 px-2.5 py-2">
            <ul className="flex gap-1.5 overflow-x-auto">
              {items.map((item, itemIndex) => {
                const selected = itemIndex === index;
                return (
                  <li key={item.id} className="shrink-0">
                    <button
                      type="button"
                      onClick={() => setIndex(itemIndex)}
                      className={`relative h-10 w-10 overflow-hidden rounded border transition-colors ${
                        selected
                          ? "border-lime ring-1 ring-lime/50"
                          : "border-border opacity-70 hover:opacity-100"
                      }`}
                      aria-label={`Show media ${itemIndex + 1}`}
                      aria-current={selected ? "true" : undefined}
                    >
                      {item.kind === "image" ? (
                        <img src={item.url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <span className="grid h-full w-full place-items-center bg-panel text-muted-foreground">
                          <Video className="h-3.5 w-3.5" />
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
