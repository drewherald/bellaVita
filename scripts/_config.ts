import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

export type InventoryConfig = { priceId: string; capacity: number; initialSold: number };

export async function readInventoryConfig(): Promise<InventoryConfig[]> {
  const config: unknown = JSON.parse(await readFile(resolve(process.env.INVENTORY_CONFIG_PATH || "inventory.config.json"), "utf8"));
  if (!Array.isArray(config) || !config.length) throw new Error("Inventory configuration must contain ticket prices.");
  const seen = new Set<string>();
  for (const entry of config) {
    if (!entry || typeof entry.priceId !== "string" || !/^price_[a-zA-Z0-9]+$/.test(entry.priceId) ||
      !Number.isSafeInteger(entry.capacity) || entry.capacity < 0 ||
      !Number.isSafeInteger(entry.initialSold) || entry.initialSold < 0 || entry.initialSold > entry.capacity || seen.has(entry.priceId)) {
      throw new Error("Invalid or duplicate inventory entry. Supply priceId, capacity and initialSold.");
    }
    seen.add(entry.priceId);
  }
  return config;
}
