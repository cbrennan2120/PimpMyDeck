export type BulkDataEntry = {
  type: string;
  download_uri: string;
};

export function pickBulkDownloadUri(entries: BulkDataEntry[]) {
  const allCards = entries.find((entry) => entry.type === "all_cards");
  if (!allCards?.download_uri) {
    throw new Error("Scryfall all_cards bulk download was not found");
  }

  return allCards.download_uri;
}
