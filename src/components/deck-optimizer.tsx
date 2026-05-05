"use client";

import {
  ArrowRight,
  BadgeDollarSign,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleSlash,
  Copy,
  Database,
  Download,
  ExternalLink,
  Gem,
  Image as ImageIcon,
  Layers3,
  Loader2,
  Lock,
  Pencil,
  RefreshCw,
  Save,
  Search,
  ShoppingCart,
  Sparkles,
  Trash2,
  Upload,
  Wand2,
} from "lucide-react";
import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { changedCards, reviewCards, sectionNames, toCsvRows } from "@/lib/deck-actions";
import { toExportLine } from "@/lib/deck-parser";
import { deckSummary, money } from "@/lib/deck-summary";
import { applyVibeToDeck, VIBES } from "@/lib/pimp-engine";
import type { CardPrint, ResolvedDeck, ResolvedDeckCard, VibeId } from "@/lib/types";

const DEMO_DECK = `Commander:
1 Atraxa, Praetors' Voice

Main:
1 Sol Ring
1 Command Tower
1 Swords to Plowshares
1 Counterspell
1 Lightning Bolt
1 Birds of Paradise
1 Cyclonic Rift
1 Demonic Tutor
1 Rhystic Study
1 Temple Garden`;

type SavedDeckSummary = {
  id: string;
  name: string;
  format: string;
  created_at: string;
};

type AdminStatus = {
  configured: boolean;
  cardPrintCount?: number;
  latestIngestRun?: {
    status: string;
    card_count: number;
    started_at: string;
    finished_at?: string | null;
  } | null;
};

type DbPrint = {
  scryfall_id: string;
  oracle_id: string;
  name: string;
  set_code: string;
  set_name: string;
  set_type?: string | null;
  collector_number: string;
  released_at?: string | null;
  frame: string;
  border_color?: string | null;
  finishes: string[];
  frame_effects: string[];
  promo: boolean;
  digital: boolean;
  oversized: boolean;
  lang: string;
  rarity?: string | null;
  image_uris: CardPrint["imageUris"];
  prices: CardPrint["prices"];
  purchase_uris: CardPrint["purchaseUris"];
  scryfall_uri: string;
  pimp_score: number;
};

function fromDbPrint(print: DbPrint): CardPrint {
  return {
    scryfallId: print.scryfall_id,
    oracleId: print.oracle_id,
    name: print.name,
    setCode: print.set_code,
    setName: print.set_name,
    setType: print.set_type ?? undefined,
    collectorNumber: print.collector_number,
    releasedAt: print.released_at ?? undefined,
    frame: print.frame,
    borderColor: print.border_color ?? undefined,
    finishes: print.finishes,
    frameEffects: print.frame_effects,
    promo: print.promo,
    digital: print.digital,
    oversized: print.oversized,
    lang: print.lang,
    rarity: print.rarity ?? undefined,
    imageUris: print.image_uris,
    prices: print.prices,
    purchaseUris: print.purchase_uris,
    scryfallUri: print.scryfall_uri,
    pimpScore: print.pimp_score,
  };
}

function price(print?: CardPrint) {
  if (!print) return "n/a";
  return print.prices.usd_foil ? `$${print.prices.usd_foil} foil` : print.prices.usd ? `$${print.prices.usd}` : "market";
}

function imageFor(print?: CardPrint) {
  return print?.imageUris.normal ?? print?.imageUris.large ?? print?.imageUris.small;
}

function treatment(print?: CardPrint) {
  if (!print) return "Unresolved";
  const effects = print.frameEffects.join(", ");
  if (effects) return effects.replaceAll("_", " ");
  if (print.frame === "1997") return "retro frame";
  if (print.finishes.includes("foil")) return "foil ready";
  return print.setName;
}

function buyUrl(card: ResolvedDeckCard) {
  const print = card.selectedPrint;
  if (!print?.purchaseUris.tcgplayer) return undefined;
  const params = new URLSearchParams({
    scryfallId: print.scryfallId,
    slot: card.id,
    url: print.purchaseUris.tcgplayer,
  });
  return `/api/out/tcgplayer?${params.toString()}`;
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="min-w-0 rounded-md border border-black/10 bg-white px-4 py-3 shadow-sm">
      <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
        {label}
      </div>
      <div className="mt-1 text-2xl font-semibold text-zinc-950">{value}</div>
    </div>
  );
}

function EmptyCard() {
  return (
    <div className="flex aspect-[63/88] items-center justify-center rounded-md border border-dashed border-zinc-300 bg-zinc-100 text-zinc-400">
      <ImageIcon className="h-8 w-8" />
    </div>
  );
}

function CardImage({ print, alt }: { print?: CardPrint; alt: string }) {
  const src = imageFor(print);
  if (!src) return <EmptyCard />;

  return (
    // Scryfall card images are already optimized static assets and need dynamic crop-free rendering.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading="lazy"
      className="aspect-[63/88] w-full rounded-md bg-zinc-100 object-cover shadow-[0_14px_40px_rgba(24,24,27,0.22)]"
    />
  );
}

function PrintPicker({
  card,
  onSelect,
}: {
  card: ResolvedDeckCard;
  onSelect: (print: CardPrint) => void;
}) {
  const [open, setOpen] = useState(false);
  const visible = card.candidates.slice(0, open ? 18 : 6);

  if (card.status === "unresolved") {
    return <p className="text-sm text-red-700">{card.reason ?? "Could not resolve this card."}</p>;
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex h-9 items-center gap-2 rounded-md border border-zinc-300 bg-white px-3 text-sm font-semibold text-zinc-900 transition hover:border-zinc-950"
      >
        <Layers3 className="h-4 w-4" />
        {open ? "Condense prints" : `Browse ${card.candidates.length} prints`}
      </button>

      {open && (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
          {visible.map((print) => (
            <button
              type="button"
              key={print.scryfallId}
              onClick={() => onSelect(print)}
              className={`group rounded-md border p-1 text-left transition hover:-translate-y-0.5 ${
                print.scryfallId === card.selectedPrint?.scryfallId
                  ? "border-emerald-500 bg-emerald-50"
                  : "border-zinc-200 bg-white"
              }`}
              title={`${print.setName} #${print.collectorNumber}`}
            >
              <CardImage print={print} alt={print.name} />
              <div className="mt-2 truncate px-1 text-[11px] font-semibold text-zinc-800">
                {print.setCode.toUpperCase()} #{print.collectorNumber}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function DeckCard({
  card,
  onSelect,
  onCorrect,
}: {
  card: ResolvedDeckCard;
  onSelect: (cardId: string, print: CardPrint) => void;
  onCorrect: (cardId: string, name: string) => void;
}) {
  const selected = card.selectedPrint;
  const outbound = buyUrl(card);
  const [correction, setCorrection] = useState(card.name);

  return (
    <article className="grid gap-4 border-b border-zinc-200 py-5 lg:grid-cols-[150px_1fr]">
      <div className="min-w-0">
        <CardImage print={selected} alt={card.name} />
      </div>
      <div className="min-w-0 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-semibold leading-tight text-zinc-950">{card.name}</h3>
              {card.userLocked && <Lock className="h-4 w-4 text-amber-600" />}
            </div>
            <p className="mt-1 text-sm text-zinc-600">
              {card.quantity}x - {card.section} - {selected ? `${selected.setName} #${selected.collectorNumber}` : "Needs review"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-zinc-950 px-2.5 py-1 text-xs font-semibold text-white">
              {price(selected)}
            </span>
            {outbound && (
              <a
                href={outbound}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-9 items-center gap-2 rounded-md bg-emerald-600 px-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
              >
                <ShoppingCart className="h-4 w-4" />
                Buy
              </a>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 text-xs font-medium">
          <span className="rounded-md bg-fuchsia-100 px-2 py-1 text-fuchsia-800">{treatment(selected)}</span>
          <span className="rounded-md bg-cyan-100 px-2 py-1 text-cyan-800">
            {selected?.finishes.join(" / ") || "no finish data"}
          </span>
          {card.reason && <span className="rounded-md bg-amber-100 px-2 py-1 text-amber-800">{card.reason}</span>}
        </div>

        <PrintPicker card={card} onSelect={(print) => onSelect(card.id, print)} />
        {card.status === "unresolved" && (
          <form
            className="flex flex-col gap-2 rounded-md border border-red-200 bg-red-50 p-3 sm:flex-row"
            onSubmit={(event) => {
              event.preventDefault();
              onCorrect(card.id, correction);
            }}
          >
            <input
              value={correction}
              onChange={(event) => setCorrection(event.target.value)}
              className="h-9 min-w-0 flex-1 rounded-md border border-red-200 bg-white px-3 text-sm outline-none focus:border-red-600"
              aria-label={`Correct card name for ${card.name}`}
            />
            <button
              type="submit"
              className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-red-700 px-3 text-sm font-semibold text-white"
            >
              <Search className="h-4 w-4" />
              Resolve name
            </button>
          </form>
        )}
      </div>
    </article>
  );
}

function SwipeReview({
  cards,
  onSelect,
}: {
  cards: ResolvedDeckCard[];
  onSelect: (cardId: string, print: CardPrint) => void;
}) {
  const [index, setIndex] = useState(0);
  const queue = cards.filter((card) => card.reason || card.status === "unresolved");
  const card = queue[index];

  if (!card) {
    return (
      <section className="rounded-md border border-emerald-200 bg-emerald-50 p-5 text-emerald-900">
        <div className="flex items-center gap-2 font-semibold">
          <Check className="h-5 w-5" />
          No review queue right now.
        </div>
      </section>
    );
  }

  const candidates = card.candidates.slice(0, 3);

  return (
    <section className="rounded-md border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-zinc-950">Swipe Review</h2>
          <p className="text-sm text-zinc-600">
            {index + 1} of {queue.length}: {card.name}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setIndex(Math.max(0, index - 1))}
            className="grid h-9 w-9 place-items-center rounded-md border border-zinc-300"
            aria-label="Previous review card"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setIndex(Math.min(queue.length - 1, index + 1))}
            className="grid h-9 w-9 place-items-center rounded-md border border-zinc-300"
            aria-label="Next review card"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {candidates.length === 0 && (
          <div className="rounded-md border border-dashed border-zinc-300 p-5 text-sm text-zinc-600">
            No candidates came back from Scryfall. Check the spelling in the source decklist.
          </div>
        )}
        {candidates.map((print) => (
          <button
            type="button"
            key={print.scryfallId}
            onClick={() => onSelect(card.id, print)}
            className="rounded-md border border-zinc-200 bg-zinc-50 p-2 text-left transition hover:border-emerald-500 hover:bg-emerald-50"
          >
            <CardImage print={print} alt={print.name} />
            <div className="mt-2 text-sm font-semibold text-zinc-950">{print.setName}</div>
            <div className="text-xs text-zinc-600">
              {print.setCode.toUpperCase()} #{print.collectorNumber} - {price(print)}
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}

export default function DeckOptimizer() {
  const [deckText, setDeckText] = useState(() => {
    if (typeof window === "undefined") return DEMO_DECK;
    return localStorage.getItem("pmd.deckText") ?? DEMO_DECK;
  });
  const [deck, setDeck] = useState<ResolvedDeck | null>(() => {
    if (typeof window === "undefined") return null;
    const savedDeck = localStorage.getItem("pmd.deck");
    return savedDeck ? (JSON.parse(savedDeck) as ResolvedDeck) : null;
  });
  const [activeVibe, setActiveVibe] = useState<VibeId>(() => {
    if (typeof window === "undefined") return "retro";
    return (localStorage.getItem("pmd.vibe") as VibeId | null) ?? "retro";
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deckName, setDeckName] = useState("Pimped Deck");
  const [activeDeckId, setActiveDeckId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [changedOnly, setChangedOnly] = useState(false);
  const [reviewOnly, setReviewOnly] = useState(false);
  const [selectedSection, setSelectedSection] = useState("All");
  const [savedDecks, setSavedDecks] = useState<SavedDeckSummary[]>([]);
  const [savedDecksLoading, setSavedDecksLoading] = useState(false);
  const [adminStatus, setAdminStatus] = useState<AdminStatus | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    localStorage.setItem("pmd.deckText", deckText);
  }, [deckText]);

  useEffect(() => {
    if (deck) localStorage.setItem("pmd.deck", JSON.stringify(deck));
  }, [deck]);

  useEffect(() => {
    localStorage.setItem("pmd.vibe", activeVibe);
  }, [activeVibe]);

  useEffect(() => {
    void refreshSavedDecks();
    void refreshAdminStatus();
  }, []);

  const filteredCards = useMemo(() => {
    const cards = deck?.cards ?? [];
    let scope = changedOnly ? changedCards(cards) : cards;
    if (reviewOnly) scope = reviewCards(scope);
    if (selectedSection !== "All") {
      scope = scope.filter((card) => card.section === selectedSection);
    }
    if (!query.trim()) return scope;
    const needle = query.toLowerCase();
    return scope.filter(
      (card) =>
        card.name.toLowerCase().includes(needle) ||
        card.selectedPrint?.setName.toLowerCase().includes(needle) ||
        card.selectedPrint?.setCode.toLowerCase().includes(needle),
    );
  }, [changedOnly, deck, query, reviewOnly, selectedSection]);

  const summary = useMemo(() => deckSummary(deck?.cards ?? []), [deck]);
  const sections = useMemo(() => (deck ? sectionNames(deck.cards) : []), [deck]);
  const cardsNeedingReview = useMemo(() => reviewCards(deck?.cards ?? []), [deck]);
  const cardsChanged = useMemo(() => changedCards(deck?.cards ?? []), [deck]);

  async function resolveDeck(vibe = activeVibe) {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/decks/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decklist: deckText, vibe }),
      });
      if (!response.ok) throw new Error(`Resolve failed: ${response.status}`);
      setDeck((await response.json()) as ResolvedDeck);
      setActiveDeckId(null);
      setDeckName(`Pimped Deck ${new Date().toLocaleDateString()}`);
      setActiveVibe(vibe);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not resolve deck");
    } finally {
      setLoading(false);
    }
  }

  function applyVibe(vibe: VibeId, force = false) {
    setActiveVibe(vibe);
    if (!deck) return;
    const sourceCards = force ? deck.cards.map((card) => ({ ...card, userLocked: false })) : deck.cards;
    const cards = applyVibeToDeck(sourceCards, vibe);
    setDeck({
      ...deck,
      cards,
      stats: {
        ...deck.stats,
        upgraded: cards.filter(
          (card) =>
            card.selectedPrint &&
            card.candidates[0] &&
            card.selectedPrint.scryfallId !== card.candidates[0].scryfallId,
        ).length,
        needsReview: cards.filter((card) => card.status === "unresolved" || card.reason).length,
      },
    });
  }

  function selectPrint(cardId: string, print: CardPrint) {
    if (!deck) return;
    setDeck({
      ...deck,
      cards: deck.cards.map((card) =>
        card.id === cardId ? { ...card, selectedPrint: print, userLocked: true, reason: undefined } : card,
      ),
    });
  }

  function lockAllSelected() {
    if (!deck) return;
    setDeck({
      ...deck,
      cards: deck.cards.map((card) => ({
        ...card,
        userLocked: card.status === "resolved" && Boolean(card.selectedPrint),
      })),
    });
  }

  function clearLocks() {
    if (!deck) return;
    setDeck({
      ...deck,
      cards: deck.cards.map((card) => ({ ...card, userLocked: false })),
    });
  }

  async function correctCardName(cardId: string, name: string) {
    if (!deck || !name.trim()) return;
    setError(null);
    const response = await fetch("/api/decks/resolve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decklist: `1 ${name.trim()}`, vibe: activeVibe }),
    });
    if (!response.ok) {
      setError(`Correction failed: ${response.status}`);
      return;
    }

    const resolved = (await response.json()) as ResolvedDeck;
    const replacement = resolved.cards[0];
    if (!replacement) return;

    setDeck({
      ...deck,
      cards: deck.cards.map((card) =>
        card.id === cardId
          ? {
              ...replacement,
              id: card.id,
              quantity: card.quantity,
              section: card.section,
              raw: card.raw,
            }
          : card,
      ),
    });
  }

  async function handleFileUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setDeckText(await file.text());
    event.target.value = "";
  }

  async function refreshSavedDecks() {
    setSavedDecksLoading(true);
    try {
      const response = await fetch("/api/decks");
      if (!response.ok) return;
      const payload = (await response.json()) as { decks?: SavedDeckSummary[] };
      setSavedDecks(payload.decks ?? []);
    } finally {
      setSavedDecksLoading(false);
    }
  }

  async function refreshAdminStatus() {
    const response = await fetch("/api/admin/status");
    if (!response.ok) return;
    setAdminStatus((await response.json()) as AdminStatus);
  }

  async function saveDeck(overwrite = false) {
    if (!deck) return;
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/decks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: overwrite ? activeDeckId : undefined,
          name: deckName,
          format: "commander",
          sourceText: deckText,
          cards: deck.cards,
        }),
      });
      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error ?? `Save failed: ${response.status}`);
      }
      const payload = (await response.json()) as { deck?: SavedDeckSummary };
      if (payload.deck?.id) {
        setActiveDeckId(payload.deck.id);
        setDeckName(payload.deck.name);
      }
      await refreshSavedDecks();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save deck");
    } finally {
      setSaving(false);
    }
  }

  async function renameSavedDeck() {
    if (!activeDeckId || !deckName.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/decks/${activeDeckId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: deckName }),
      });
      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error ?? `Rename failed: ${response.status}`);
      }
      await refreshSavedDecks();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not rename deck");
    } finally {
      setSaving(false);
    }
  }

  async function deleteSavedDeck(deckId = activeDeckId) {
    if (!deckId) return;
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/decks/${deckId}`, { method: "DELETE" });
      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error ?? `Delete failed: ${response.status}`);
      }
      if (deckId === activeDeckId) setActiveDeckId(null);
      await refreshSavedDecks();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not delete deck");
    } finally {
      setSaving(false);
    }
  }

  async function duplicateSavedDeck(deckId = activeDeckId) {
    if (!deckId) return;
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/decks/${deckId}`, { method: "POST" });
      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error ?? `Duplicate failed: ${response.status}`);
      }
      const payload = (await response.json()) as { deck?: SavedDeckSummary };
      if (payload.deck?.id) {
        setActiveDeckId(payload.deck.id);
        setDeckName(payload.deck.name);
      }
      await refreshSavedDecks();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not duplicate deck");
    } finally {
      setSaving(false);
    }
  }

  async function loadSavedDeck(deckId: string) {
    setError(null);
    const response = await fetch(`/api/decks/${deckId}`);
    if (!response.ok) {
      const payload = (await response.json()) as { error?: string };
      setError(payload.error ?? `Load failed: ${response.status}`);
      return;
    }

    const payload = (await response.json()) as {
      deck: { id: string; name: string; source_text?: { text?: string } };
      cards: Array<{
        id: string;
        quantity: number;
        section: string;
        user_locked: boolean;
        oracle_id?: string | null;
        card_prints?: DbPrint | null;
      }>;
    };
    const restoredCards: ResolvedDeckCard[] = payload.cards.map((row) => {
      const selectedPrint = row.card_prints ? fromDbPrint(row.card_prints) : undefined;
      return {
        id: row.id,
        quantity: row.quantity,
        name: selectedPrint?.name ?? "Unknown card",
        section: row.section,
        raw: `${row.quantity} ${selectedPrint?.name ?? "Unknown card"}`,
        oracleId: row.oracle_id ?? selectedPrint?.oracleId,
        status: selectedPrint ? "resolved" : "unresolved",
        selectedPrint,
        candidates: selectedPrint ? [selectedPrint] : [],
        userLocked: row.user_locked,
      };
    });
    setActiveDeckId(payload.deck.id);
    setDeckName(payload.deck.name);
    setDeckText(payload.deck.source_text?.text ?? restoredCards.map((card) => card.raw).join("\n"));
    setDeck({
      cards: restoredCards,
      unresolved: restoredCards.filter((card) => card.status === "unresolved"),
      stats: {
        totalLines: restoredCards.length,
        totalQuantity: restoredCards.reduce((sum, card) => sum + card.quantity, 0),
        resolved: restoredCards.filter((card) => card.status === "resolved").length,
        upgraded: 0,
        needsReview: restoredCards.filter((card) => card.status === "unresolved").length,
      },
      source: "cache",
    });
  }

  const exportText = useMemo(
    () => (deck ? deck.cards.map(toExportLine).join("\n") : ""),
    [deck],
  );
  const changedExportText = useMemo(
    () => cardsChanged.map(toExportLine).join("\n"),
    [cardsChanged],
  );
  const csvExportText = useMemo(
    () => (deck ? toCsvRows(deck.cards) : ""),
    [deck],
  );
  const changedBuyLinks = useMemo(
    () => cardsChanged.map(buyUrl).filter(Boolean).join("\n"),
    [cardsChanged],
  );

  return (
    <main className="min-h-screen bg-[#f7f7f2] text-zinc-950">
      <section className="border-b border-black/10 bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-8 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
          <div className="flex flex-col justify-between gap-8">
            <div>
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-md bg-zinc-950 text-white">
                  <Gem className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-4xl font-semibold tracking-normal text-zinc-950 sm:text-5xl">
                    Pimp My Deck
                  </h1>
                  <p className="mt-2 max-w-xl text-base leading-7 text-zinc-600">
                    Paste a Magic decklist, auto-match every card to premium Scryfall prints, then lock the versions worth showing off.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <Metric label="Cards" value={deck?.stats.totalLines ?? "0"} />
              <Metric label="Resolved" value={deck?.stats.resolved ?? "0"} />
              <Metric label="Value" value={deck ? money(summary.selectedTotal) : "$0"} />
            </div>
          </div>

          <div className="rounded-md border border-zinc-200 bg-zinc-50 p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-3">
              <label htmlFor="decklist" className="text-sm font-semibold text-zinc-950">
                Decklist
              </label>
              <button
                type="button"
                onClick={() => setDeckText(DEMO_DECK)}
                className="inline-flex h-8 items-center gap-2 rounded-md border border-zinc-300 bg-white px-3 text-xs font-semibold text-zinc-800"
              >
                <Upload className="h-3.5 w-3.5" />
                Load demo
              </button>
            </div>
            <textarea
              id="decklist"
              value={deckText}
              onChange={(event) => setDeckText(event.target.value)}
              spellCheck={false}
              className="h-56 w-full resize-none rounded-md border border-zinc-300 bg-white p-3 font-mono text-sm leading-6 outline-none transition focus:border-zinc-950"
            />
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.dek,.dec,text/plain"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => resolveDeck()}
                disabled={loading}
                className="inline-flex h-11 items-center gap-2 rounded-md bg-zinc-950 px-4 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                Resolve and pimp
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex h-11 items-center gap-2 rounded-md border border-zinc-300 bg-white px-4 text-sm font-semibold text-zinc-900 transition hover:border-zinc-950"
              >
                <Upload className="h-4 w-4" />
                Upload .txt
              </button>
              {error && <span className="text-sm font-medium text-red-700">{error}</span>}
              <span className="text-xs leading-5 text-zinc-500">
                Supabase cache resolves first; live fallback queues Scryfall requests at 110ms spacing.
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="sticky top-0 z-20 border-b border-black/10 bg-[#f7f7f2]/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-4 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {VIBES.map((vibe) => (
              <button
                type="button"
                key={vibe.id}
                onClick={() => applyVibe(vibe.id)}
                className={`inline-flex h-10 shrink-0 items-center gap-2 rounded-md border px-3 text-sm font-semibold transition ${
                  activeVibe === vibe.id
                    ? "border-zinc-950 bg-zinc-950 text-white"
                    : "border-zinc-300 bg-white text-zinc-800 hover:border-zinc-950"
                }`}
                title={vibe.description}
              >
                <Sparkles className="h-4 w-4" />
                {vibe.shortLabel}
              </button>
            ))}
            <button
              type="button"
              onClick={() => applyVibe(activeVibe, true)}
              disabled={!deck}
              className="inline-flex h-10 shrink-0 items-center gap-2 rounded-md border border-amber-300 bg-amber-50 px-3 text-sm font-semibold text-amber-900 disabled:opacity-50"
            >
              <ArrowRight className="h-4 w-4" />
              Reapply all
            </button>
            <button
              type="button"
              onClick={lockAllSelected}
              disabled={!deck}
              className="inline-flex h-10 shrink-0 items-center gap-2 rounded-md border border-zinc-300 bg-white px-3 text-sm font-semibold text-zinc-900 disabled:opacity-50"
            >
              <Lock className="h-4 w-4" />
              Lock all
            </button>
            <button
              type="button"
              onClick={clearLocks}
              disabled={!deck}
              className="inline-flex h-10 shrink-0 items-center gap-2 rounded-md border border-zinc-300 bg-white px-3 text-sm font-semibold text-zinc-900 disabled:opacity-50"
            >
              <CircleSlash className="h-4 w-4" />
              Clear locks
            </button>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <label className="relative block">
              <Pencil className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <input
                value={deckName}
                onChange={(event) => setDeckName(event.target.value)}
                placeholder="Deck name"
                className="h-10 w-full rounded-md border border-zinc-300 bg-white pl-9 pr-3 text-sm outline-none focus:border-zinc-950 sm:w-52"
              />
            </label>
            <label className="relative block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search cards or sets"
                className="h-10 w-full rounded-md border border-zinc-300 bg-white pl-9 pr-3 text-sm outline-none focus:border-zinc-950 sm:w-64"
              />
            </label>
            <button
              type="button"
              onClick={() => setChangedOnly((value) => !value)}
              disabled={!deck}
              className={`inline-flex h-10 items-center justify-center gap-2 rounded-md border px-3 text-sm font-semibold disabled:opacity-50 ${
                changedOnly
                  ? "border-zinc-950 bg-zinc-950 text-white"
                  : "border-zinc-300 bg-white text-zinc-900"
              }`}
            >
              Changed only
            </button>
            <button
              type="button"
              onClick={() => setReviewOnly((value) => !value)}
              disabled={!deck}
              className={`inline-flex h-10 items-center justify-center gap-2 rounded-md border px-3 text-sm font-semibold disabled:opacity-50 ${
                reviewOnly
                  ? "border-amber-700 bg-amber-700 text-white"
                  : "border-zinc-300 bg-white text-zinc-900"
              }`}
            >
              Review {cardsNeedingReview.length}
            </button>
            <select
              value={selectedSection}
              onChange={(event) => setSelectedSection(event.target.value)}
              disabled={!deck}
              className="h-10 rounded-md border border-zinc-300 bg-white px-3 text-sm font-semibold text-zinc-900 outline-none disabled:opacity-50"
            >
              <option value="All">All sections</option>
              {sections.map((section) => (
                <option key={section} value={section}>
                  {section}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => navigator.clipboard.writeText(exportText)}
              disabled={!deck}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-zinc-300 bg-white px-3 text-sm font-semibold text-zinc-900 disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              Copy export
            </button>
            <button
              type="button"
              onClick={() => navigator.clipboard.writeText(changedExportText)}
              disabled={!deck || cardsChanged.length === 0}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-zinc-300 bg-white px-3 text-sm font-semibold text-zinc-900 disabled:opacity-50"
            >
              <Copy className="h-4 w-4" />
              Changed
            </button>
            <button
              type="button"
              onClick={() => saveDeck(false)}
              disabled={!deck || saving}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-emerald-600 px-3 text-sm font-semibold text-white disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {saving ? "Saving" : "Save"}
            </button>
            <button
              type="button"
              onClick={() => saveDeck(true)}
              disabled={!deck || !activeDeckId || saving}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-emerald-600 bg-white px-3 text-sm font-semibold text-emerald-700 disabled:opacity-50"
            >
              Overwrite
            </button>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-6 px-5 py-6 lg:grid-cols-[1fr_340px] lg:px-8">
        <section className="rounded-md border border-zinc-200 bg-white px-4 shadow-sm">
          {!deck && (
            <div className="grid min-h-[460px] place-items-center py-16 text-center">
              <div className="max-w-md">
                <div className="mx-auto grid h-16 w-16 place-items-center rounded-md bg-zinc-950 text-white">
                  <Wand2 className="h-8 w-8" />
                </div>
                <h2 className="mt-5 text-2xl font-semibold text-zinc-950">Ready for the first pass</h2>
                <p className="mt-2 text-zinc-600">
                  The gallery appears here after resolution, with print candidates grouped by card and user locks preserved.
                </p>
              </div>
            </div>
          )}

          {deck &&
            filteredCards.map((card) => (
              <DeckCard
                key={card.id}
                card={card}
                onSelect={selectPrint}
                onCorrect={correctCardName}
              />
            ))}
          {deck && filteredCards.length === 0 && (
            <div className="grid min-h-80 place-items-center py-16 text-center">
              <div className="max-w-md">
                <h2 className="text-xl font-semibold text-zinc-950">No cards match these filters</h2>
                <p className="mt-2 text-sm leading-6 text-zinc-600">
                  Clear search, review-only, changed-only, or section filters to return to the full gallery.
                </p>
              </div>
            </div>
          )}
        </section>

        <aside className="space-y-4">
          {deck && <SwipeReview cards={deck.cards} onSelect={selectPrint} />}

          <section className="rounded-md border border-zinc-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-zinc-950">Deck Value</h2>
            <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-md bg-zinc-50 p-3">
                <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">
                  Selected
                </dt>
                <dd className="mt-1 text-xl font-semibold text-zinc-950">
                  {money(summary.selectedTotal)}
                </dd>
              </div>
              <div className="rounded-md bg-zinc-50 p-3">
                <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">
                  Delta
                </dt>
                <dd className="mt-1 text-xl font-semibold text-zinc-950">
                  {money(summary.delta)}
                </dd>
              </div>
              <div className="rounded-md bg-zinc-50 p-3">
                <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">
                  Changed
                </dt>
                <dd className="mt-1 text-xl font-semibold text-zinc-950">
                  {summary.changedCards}
                </dd>
              </div>
              <div className="rounded-md bg-zinc-50 p-3">
                <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">
                  Locked
                </dt>
                <dd className="mt-1 text-xl font-semibold text-zinc-950">
                  {summary.lockedCards}
                </dd>
              </div>
            </dl>
          </section>

          <section className="rounded-md border border-zinc-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-zinc-950">Quick Actions</h2>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => navigator.clipboard.writeText(csvExportText)}
                disabled={!deck}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-zinc-300 bg-white px-3 text-sm font-semibold text-zinc-900 disabled:opacity-50"
              >
                <Download className="h-4 w-4" />
                CSV
              </button>
              <button
                type="button"
                onClick={() => navigator.clipboard.writeText(changedBuyLinks)}
                disabled={!deck || !changedBuyLinks}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-zinc-300 bg-white px-3 text-sm font-semibold text-zinc-900 disabled:opacity-50"
              >
                <ShoppingCart className="h-4 w-4" />
                Buy links
              </button>
              <button
                type="button"
                onClick={renameSavedDeck}
                disabled={!activeDeckId || saving}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-zinc-300 bg-white px-3 text-sm font-semibold text-zinc-900 disabled:opacity-50"
              >
                <Pencil className="h-4 w-4" />
                Rename
              </button>
              <button
                type="button"
                onClick={() => duplicateSavedDeck()}
                disabled={!activeDeckId || saving}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-zinc-300 bg-white px-3 text-sm font-semibold text-zinc-900 disabled:opacity-50"
              >
                <Copy className="h-4 w-4" />
                Duplicate
              </button>
            </div>
          </section>

          <section className="rounded-md border border-zinc-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-semibold text-zinc-950">
              <BadgeDollarSign className="h-4 w-4" />
              Affiliate disclosure
            </div>
            <p className="mt-2 text-sm leading-6 text-zinc-600">
              Purchase buttons may route through configured TCGplayer Impact affiliate links. Prices are unchanged for users.
            </p>
          </section>

          <section className="rounded-md border border-zinc-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-zinc-950">Saved Decks</h2>
            <div className="mt-3 space-y-2">
              {savedDecksLoading && (
                <p className="text-sm leading-6 text-zinc-600">Loading saved decks...</p>
              )}
              {!savedDecksLoading && savedDecks.length === 0 && (
                <p className="text-sm leading-6 text-zinc-600">
                  Supabase decks will appear here after configuration and save.
                </p>
              )}
              {savedDecks.map((savedDeck) => (
                <div
                  key={savedDeck.id}
                  className={`rounded-md border px-3 py-2 text-sm transition ${
                    activeDeckId === savedDeck.id
                      ? "border-zinc-950 bg-zinc-100"
                      : "border-zinc-200 bg-zinc-50"
                  }`}
                >
                  <button type="button" onClick={() => loadSavedDeck(savedDeck.id)} className="w-full text-left">
                    <span className="block font-semibold text-zinc-950">{savedDeck.name}</span>
                    <span className="text-xs text-zinc-500">
                      {new Date(savedDeck.created_at).toLocaleString()}
                    </span>
                  </button>
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => duplicateSavedDeck(savedDeck.id)}
                      className="inline-flex h-8 items-center gap-1 rounded-md border border-zinc-300 bg-white px-2 text-xs font-semibold text-zinc-800"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      Copy
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteSavedDeck(savedDeck.id)}
                      className="inline-flex h-8 items-center gap-1 rounded-md border border-red-200 bg-red-50 px-2 text-xs font-semibold text-red-700"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-md border border-zinc-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <h2 className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-950">
                <Database className="h-4 w-4" />
                Data Status
              </h2>
              <button
                type="button"
                onClick={refreshAdminStatus}
                className="inline-flex h-8 items-center gap-1 rounded-md border border-zinc-300 bg-white px-2 text-xs font-semibold text-zinc-800"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Refresh
              </button>
            </div>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-zinc-500">Supabase</dt>
                <dd className="font-semibold text-zinc-950">
                  {adminStatus?.configured ? "Configured" : "Not configured"}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-zinc-500">Cached prints</dt>
                <dd className="font-semibold text-zinc-950">
                  {(adminStatus?.cardPrintCount ?? 0).toLocaleString()}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-zinc-500">Last ingest</dt>
                <dd className="text-right font-semibold text-zinc-950">
                  {adminStatus?.latestIngestRun
                    ? `${adminStatus.latestIngestRun.status} - ${new Date(
                        adminStatus.latestIngestRun.started_at,
                      ).toLocaleDateString()}`
                    : "None"}
                </dd>
              </div>
            </dl>
            <a
              href="https://scryfall.com/docs/api/bulk-data"
              target="_blank"
              className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-zinc-700 hover:text-zinc-950"
            >
              Scryfall bulk data
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </section>

          <section className="rounded-md border border-zinc-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-zinc-950">Export Preview</h2>
            <pre className="mt-3 max-h-80 overflow-auto rounded-md bg-zinc-950 p-3 text-xs leading-5 text-zinc-100">
              {exportText || "Resolve a deck to generate set-code export lines."}
            </pre>
          </section>
        </aside>
      </div>
    </main>
  );
}
