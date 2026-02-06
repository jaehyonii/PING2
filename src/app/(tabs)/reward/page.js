'use client';

import { useEffect, useMemo, useState } from "react";
import { MiniKit } from "@worldcoin/minikit-js";

const formatNumber = (value) => new Intl.NumberFormat("en-US").format(value);

export default function RewardPage() {
  const [pingPoint, setPingPoint] = useState(0);
  const [isLoadingPoint, setIsLoadingPoint] = useState(true);

  useEffect(() => {
    const walletAddress = MiniKit.user?.walletAddress;

    if (!walletAddress) {
      setIsLoadingPoint(false);
      return;
    }

    let isCancelled = false;

    const fetchPoint = async () => {
      try {
        const response = await fetch(
          `/api/points?walletAddress=${encodeURIComponent(walletAddress)}`,
          { method: "GET", cache: "no-store" }
        );

        if (!response.ok) {
          const detail = await response.text();
          console.error("Failed to fetch points:", detail);
          if (!isCancelled) setPingPoint(0);
          return;
        }

        const data = await response.json();
        const value = Number(data?.point?.ping_point ?? 0);
        if (!isCancelled) setPingPoint(Number.isFinite(value) ? value : 0);
      } catch (error) {
        console.error("Error while fetching points:", error);
        if (!isCancelled) setPingPoint(0);
      } finally {
        if (!isCancelled) setIsLoadingPoint(false);
      }
    };

    fetchPoint();

    return () => {
      isCancelled = true;
    };
  }, []);

  const pingPointLabel = useMemo(() => {
    if (isLoadingPoint) return "...";
    return `${formatNumber(pingPoint)}P`;
  }, [isLoadingPoint, pingPoint]);

  return (
    <section className="reward-page" aria-label="리워드">
      <h1 className="reward-title">Rewards</h1>
      <p className="reward-subtitle">Ping Point와 체인별 Airdrop을 확인하세요.</p>

      <div className="reward-section">
        <h2 className="reward-section-title">당신의 Ping Point</h2>
        <article className="reward-card" aria-label="Ping Point">
          <span className="reward-icon reward-icon-glow reward-icon-ping">
            <img src="/figma/reward/reward-ping-point-coin.png" alt="" />
          </span>
          <p className="reward-value">{pingPointLabel}</p>
        </article>
      </div>

      <div className="reward-section">
        <h2 className="reward-section-title">당신의 World Coin 보유량</h2>
        <article className="reward-card" aria-label="World Coin">
          <span className="reward-icon reward-icon-glow reward-icon-worldcoin">
            <img src="/figma/reward/reward-worldcoin-coin.png" alt="" />
          </span>
          <p className="reward-value">1,240 WLD</p>
        </article>
      </div>
    </section>
  );
}
