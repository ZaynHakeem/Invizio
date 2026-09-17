import { useEffect, useSyncExternalStore } from "react";
import type { InventoryStore } from "../data/store";
export function useInventory(store: InventoryStore) {
  const state = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getSnapshot,
  );
  useEffect(() => {
    void store.refresh();
    return () => store.cancelRead();
  }, [store]);
  return state;
}
