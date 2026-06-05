"use client";

import { create } from "zustand";
import { api } from "../lib/api";

type BalanceResponse = { data: { points: number; redeemRate: number; minRedeem: number } };

type LoyaltyState = {
  points: number;
  redeemRate: number;
  minRedeem: number;
  loaded: boolean;
  fetchBalance: () => Promise<void>;
};

export const useLoyaltyStore = create<LoyaltyState>((set) => ({
  points: 0,
  redeemRate: 10,
  minRedeem: 50,
  loaded: false,

  fetchBalance: async () => {
    try {
      const json = await api.get<BalanceResponse>("/api/v1/loyalty/balance");
      set({ points: json.data.points, redeemRate: json.data.redeemRate, minRedeem: json.data.minRedeem, loaded: true });
    } catch {
      set({ loaded: true });
    }
  }
}));
