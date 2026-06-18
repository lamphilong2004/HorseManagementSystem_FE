import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const KEY_BALANCE = "mock_wallet_balance";
const KEY_LAST_RESET = "mock_wallet_last_reset";
const KEY_SETTLED = "mock_wallet_settled_preds";
const DEFAULT_BALANCE = 10000000;

const WalletContext = createContext(null);

export function WalletProvider({ children }) {
  const [balance, setBalance] = useState(DEFAULT_BALANCE);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    initWallet().then((nextBalance) => {
      if (!alive) return;
      setBalance(nextBalance);
      setReady(true);
    });
    return () => {
      alive = false;
    };
  }, []);

  const persistBalance = useCallback(async (next) => {
    setBalance(next);
    await AsyncStorage.setItem(KEY_BALANCE, String(next));
  }, []);

  const deductBalance = useCallback(
    async (amount) => {
      if (balance >= amount) {
        await persistBalance(balance - amount);
      }
    },
    [balance, persistBalance]
  );

  const addBalance = useCallback(
    async (amount) => {
      await persistBalance(balance + amount);
    },
    [balance, persistBalance]
  );

  const getSettledPredictionIds = useCallback(async () => {
    const raw = await AsyncStorage.getItem(KEY_SETTLED);
    if (!raw) return [];
    try {
      const decoded = JSON.parse(raw);
      return Array.isArray(decoded) ? decoded.map(String) : [];
    } catch (_error) {
      return [];
    }
  }, []);

  const markPredictionAsSettled = useCallback(
    async (predictionId) => {
      const settled = await getSettledPredictionIds();
      if (!settled.includes(predictionId)) {
        settled.push(predictionId);
        await AsyncStorage.setItem(KEY_SETTLED, JSON.stringify(settled));
      }
    },
    [getSettledPredictionIds]
  );

  const value = useMemo(
    () => ({
      balance,
      ready,
      deductBalance,
      addBalance,
      getSettledPredictionIds,
      markPredictionAsSettled
    }),
    [addBalance, balance, deductBalance, getSettledPredictionIds, markPredictionAsSettled, ready]
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

async function initWallet() {
  const balanceStr = await AsyncStorage.getItem(KEY_BALANCE);
  let nextBalance = balanceStr ? Number.parseInt(balanceStr, 10) : DEFAULT_BALANCE;
  if (!Number.isFinite(nextBalance)) nextBalance = DEFAULT_BALANCE;

  if (!balanceStr) {
    await AsyncStorage.setItem(KEY_BALANCE, String(nextBalance));
  }

  const lastResetStr = await AsyncStorage.getItem(KEY_LAST_RESET);
  let lastReset = lastResetStr ? new Date(lastResetStr) : new Date();
  if (Number.isNaN(lastReset.getTime())) lastReset = new Date();

  if (!lastResetStr) {
    await AsyncStorage.setItem(KEY_LAST_RESET, lastReset.toISOString());
  }

  if (nextBalance < 100000) {
    const daysSince = Math.floor((Date.now() - lastReset.getTime()) / 86400000);
    if (daysSince >= 3) {
      nextBalance = DEFAULT_BALANCE;
      await AsyncStorage.setItem(KEY_BALANCE, String(nextBalance));
      await AsyncStorage.setItem(KEY_LAST_RESET, new Date().toISOString());
    }
  }

  return nextBalance;
}

export function useWallet() {
  const value = useContext(WalletContext);
  if (!value) throw new Error("useWallet must be used within WalletProvider");
  return value;
}
