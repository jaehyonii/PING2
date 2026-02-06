'use client';

import { useEffect, useMemo, useState } from "react";
import { MiniKit } from "@worldcoin/minikit-js";

const PUBLIC_PINGS = [
  "/figma/profile/profile-public-ping-1.png",
  "/figma/profile/profile-public-ping-2.png",
  "/figma/profile/profile-public-ping-3.png",
  "/figma/profile/profile-public-ping-4.png",
  "/figma/profile/profile-public-ping-5.png",
  "/figma/profile/profile-public-ping-1.png",
];

const shortenWallet = (walletAddress) => {
  if (!walletAddress || walletAddress.length < 10) return walletAddress || "";
  return `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`;
};

export default function ProfilePage() {
  const [userRow, setUserRow] = useState(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  useEffect(() => {
    const walletAddress = MiniKit.user?.walletAddress;

    if (!walletAddress) {
      setIsLoadingUser(false);
      return;
    }

    let isCancelled = false;

    const fetchUser = async () => {
      const maxAttempts = 2;

      try {
        for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
          const response = await fetch(
            `/api/users?walletAddress=${encodeURIComponent(walletAddress)}`,
            { method: "GET", cache: "no-store" }
          );

          if (!response.ok) {
            const detail = await response.text();
            console.error("Failed to fetch user profile:", detail);
            if (!isCancelled) setUserRow(null);
            return;
          }

          const data = await response.json();
          if (data.user || attempt === maxAttempts) {
            if (!isCancelled) {
              setUserRow(data.user ?? null);
            }
            return;
          }

          await new Promise((resolve) => setTimeout(resolve, 300));
        }
      } catch (error) {
        console.error("Error while fetching user profile:", error);
        if (!isCancelled) setUserRow(null);
      } finally {
        if (!isCancelled) setIsLoadingUser(false);
      }
    };

    fetchUser();

    return () => {
      isCancelled = true;
    };
  }, []);

  const walletNickname = MiniKit.user?.username?.trim() || "";
  const fallbackName = walletNickname || "Me";
  const fallbackImage = MiniKit.user?.profilePictureUrl || "/profiles/profile-default.png";
  const fallbackAvatar = MiniKit.user?.profilePictureUrl || "/figma/home/profile-default.png";
  const fallbackWallet = MiniKit.user?.walletAddress?.toLowerCase() || "";

  const nickname = userRow?.nickname || fallbackName;
  const bgImage = userRow?.background_url || userRow?.profile_url || fallbackImage;
  const profileImage = userRow?.profile_url || fallbackAvatar;
  const walletLabel = useMemo(() => {
    if (walletNickname) return `@${walletNickname}`;
    const wallet = userRow?.wallet_address || fallbackWallet;
    if (!wallet) return "@worldID";
    return `@${shortenWallet(wallet)}`;
  }, [walletNickname, userRow?.wallet_address, fallbackWallet]);

  return (
    <section className="profile-page" aria-label="Profile">
      <div className="profile-hero">
        <img className="profile-hero-image" src={bgImage} alt="" />
        <div className="profile-hero-top-fade" aria-hidden="true" />
        <div className="profile-hero-bottom-fade" aria-hidden="true" />
        <div className="profile-meta">
          <div className="profile-meta-row">
            <div className="profile-avatar" aria-hidden="true">
              <img src={profileImage} alt="" />
            </div>
            <div className="profile-meta-text">
              <h1 className="profile-name">{nickname}</h1>
              <p className="profile-id">{walletLabel}</p>
            </div>
          </div>
          {isLoadingUser ? <p className="profile-id">Loading profile...</p> : null}
        </div>
      </div>

      <div className="profile-content">
        <p className="profile-stats">
          <span className="profile-stats-value">36</span>
          <span className="profile-stats-label">Friends</span>
          <span className="profile-stats-dot" aria-hidden="true">
            |
          </span>
          <span className="profile-stats-value">24</span>
          <span className="profile-stats-label">Followers</span>
          <span className="profile-stats-dot" aria-hidden="true">
            |
          </span>
          <span className="profile-stats-value">8</span>
          <span className="profile-stats-label">Following</span>
        </p>

        <div className="profile-actions">
          <button className="profile-share" type="button">
            Share Profile
          </button>
          <button className="profile-edit" type="button" aria-label="Edit Profile">
            <img src="/figma/profile/icon-profile-edit.svg" alt="" />
          </button>
        </div>

        <h2 className="profile-section-title">Public Ping!</h2>
        <div className="profile-grid">
          {PUBLIC_PINGS.map((image, index) => (
            <div className="profile-grid-item" key={`${image}-${index}`}>
              <img src={image} alt="" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
