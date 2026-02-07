'use client';

import { useEffect, useMemo, useState } from "react";
import { MiniKit } from "@worldcoin/minikit-js";
import { getProfilesAssetUrl } from "@/lib/supabaseStorage";

const shortenWallet = (walletAddress) => {
  if (!walletAddress || walletAddress.length < 10) return walletAddress || "";
  return `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`;
};

export default function ProfilePage() {
  const [userRow, setUserRow] = useState(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [publicPings, setPublicPings] = useState([]);
  const [isLoadingPings, setIsLoadingPings] = useState(true);

  useEffect(() => {
    const walletAddress = MiniKit.user?.walletAddress;

    if (!walletAddress) {
      setIsLoadingUser(false);
      setIsLoadingPings(false);
      setPublicPings([]);
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

    const fetchMyFeeds = async () => {
      try {
        const response = await fetch(
          `/api/feeds?walletAddress=${encodeURIComponent(walletAddress)}&limit=100`,
          { method: "GET", cache: "no-store" }
        );

        if (!response.ok) {
          const detail = await response.text();
          console.error("Failed to fetch my feeds:", detail);
          if (!isCancelled) setPublicPings([]);
          return;
        }

        const data = await response.json();
        const myPings = Array.isArray(data?.feeds)
          ? data.feeds
              .map((feed, index) => {
                const image = typeof feed?.image === "string" ? feed.image.trim() : "";
                const overlay = typeof feed?.overlay === "string" ? feed.overlay.trim() : "";
                if (!image) return null;
                return {
                  id: feed?.id || feed?.feed_id || `${walletAddress}-${index}`,
                  image,
                  overlay: overlay || null,
                };
              })
              .filter(Boolean)
          : [];

        if (!isCancelled) {
          setPublicPings(myPings);
        }
      } catch (error) {
        console.error("Error while fetching my feeds:", error);
        if (!isCancelled) setPublicPings([]);
      } finally {
        if (!isCancelled) setIsLoadingPings(false);
      }
    };

    fetchUser();
    fetchMyFeeds();

    return () => {
      isCancelled = true;
    };
  }, []);

  const walletNickname = MiniKit.user?.username?.trim() || "";
  const fallbackName = walletNickname || "Me";
  const storageFallbackProfile = getProfilesAssetUrl("profile-default.jpg");
  const fallbackImage = MiniKit.user?.profilePictureUrl || storageFallbackProfile;
  const fallbackAvatar = MiniKit.user?.profilePictureUrl || storageFallbackProfile;
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
          {publicPings.map((ping, index) => (
            <div className="profile-grid-item" key={`${ping.id}-${index}`}>
              <img className="profile-grid-main" src={ping.image} alt={`Public Ping ${index + 1}`} />
              {ping.overlay ? (
                <div className="profile-grid-overlay" aria-hidden="true">
                  <img src={ping.overlay} alt="" />
                </div>
              ) : null}
            </div>
          ))}
        </div>
        {!isLoadingPings && publicPings.length === 0 ? (
          <p className="profile-id">No Public Ping yet.</p>
        ) : null}
      </div>
    </section>
  );
}
