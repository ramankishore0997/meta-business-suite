import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { useLocalStore } from "@/lib/store";
import type { Ad } from "@workspace/api-client-react";

type CampaignsUI = {
  isCampExpanded: (id: number) => boolean;
  toggleCamp: (id: number) => void;
  isAdsetExpanded: (id: number) => boolean;
  toggleAdset: (id: number) => void;

  selected: number[];
  isSelected: (id: number) => boolean;
  toggleSelect: (id: number) => void;
  selectMany: (ids: number[]) => void;
  clearSelect: () => void;

  activeCampaignId: number | null;
  openPerf: (id: number) => void;
  perfNonce: number;

  drawerCampaignId: number | null;
  openDrawer: (id: number) => void;
  closeDrawer: () => void;

  activeAd: Ad | null;
  openAd: (ad: Ad) => void;
  closeAd: () => void;
};

const Ctx = createContext<CampaignsUI | null>(null);

export function useCampaignsUI(): CampaignsUI {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCampaignsUI must be used within CampaignsUIProvider");
  return ctx;
}

export function CampaignsUIProvider({ children }: { children: ReactNode }) {
  const [expandedCamps, setExpandedCamps] = useLocalStore<number[]>("camp:expanded", []);
  const [expandedAdsets, setExpandedAdsets] = useLocalStore<number[]>("adset:expanded", []);
  const [selected, setSelected] = useState<number[]>([]);
  const [activeCampaignId, setActiveCampaignId] = useState<number | null>(null);
  const [perfNonce, setPerfNonce] = useState(0);
  const [drawerCampaignId, setDrawerCampaignId] = useState<number | null>(null);
  const [activeAd, setActiveAd] = useState<Ad | null>(null);

  const toggleCamp = useCallback(
    (id: number) =>
      setExpandedCamps((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])),
    [setExpandedCamps],
  );

  const toggleAdset = useCallback(
    (id: number) =>
      setExpandedAdsets((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])),
    [setExpandedAdsets],
  );

  const toggleSelect = useCallback(
    (id: number) =>
      setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])),
    [],
  );

  const value = useMemo<CampaignsUI>(
    () => ({
      isCampExpanded: (id) => expandedCamps.includes(id),
      toggleCamp,
      isAdsetExpanded: (id) => expandedAdsets.includes(id),
      toggleAdset,
      selected,
      isSelected: (id) => selected.includes(id),
      toggleSelect,
      selectMany: (ids) => setSelected(ids),
      clearSelect: () => setSelected([]),
      activeCampaignId,
      openPerf: (id) => {
        setActiveCampaignId(id);
        // Close any open drawer so the bottom-right panel isn't covered, and
        // bump the nonce so the panel expands even if it was collapsed.
        setDrawerCampaignId(null);
        setPerfNonce((n) => n + 1);
      },
      perfNonce,
      drawerCampaignId,
      openDrawer: (id) => {
        setDrawerCampaignId(id);
        setActiveCampaignId(id);
      },
      closeDrawer: () => setDrawerCampaignId(null),
      activeAd,
      openAd: (ad) => setActiveAd(ad),
      closeAd: () => setActiveAd(null),
    }),
    [expandedCamps, expandedAdsets, selected, activeCampaignId, perfNonce, drawerCampaignId, activeAd, toggleCamp, toggleAdset, toggleSelect],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
