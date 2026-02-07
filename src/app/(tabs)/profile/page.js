'use client';

import { useEffect, useMemo, useRef, useState } from "react";
import { MiniKit, VerifyCommandInput, VerificationLevel, ISuccessResult } from '@worldcoin/minikit-js'


import { getProfilesAssetUrl } from "@/lib/supabaseStorage";

const shortenWallet = (walletAddress) => {
  if (!walletAddress || walletAddress.length < 10) return walletAddress || "";
  return `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`;
};

const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result || "");
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });

export default function ProfilePage() {
  const [userRow, setUserRow] = useState(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [publicPings, setPublicPings] = useState([]);
  const [isLoadingPings, setIsLoadingPings] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editNickname, setEditNickname] = useState("");
  const [editProfilePreview, setEditProfilePreview] = useState("");
  const [editBackgroundPreview, setEditBackgroundPreview] = useState("");
  const [editProfileDataUrl, setEditProfileDataUrl] = useState("");
  const [editBackgroundDataUrl, setEditBackgroundDataUrl] = useState("");
  const [isSavingNickname, setIsSavingNickname] = useState(false);
  const [isSavingImages, setIsSavingImages] = useState(false);
  const [nicknameError, setNicknameError] = useState("");
  const [imagesError, setImagesError] = useState("");
  const profileImageInputRef = useRef(null);
  const backgroundImageInputRef = useRef(null);

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

  const verifyPayload = {
    action: 'nickname', // This is your action ID from the Developer Portal
    signal: '0x12312', // Optional additional data
    verification_level: VerificationLevel.Device, // Orb | Device
  }

  const handleVerify = async () => {
    if (!MiniKit.isInstalled()) {
      return
    }
    // World App will open a drawer prompting the user to confirm the operation, promise is resolved once user confirms or cancels
    const { finalPayload } = await MiniKit.commandsAsync.verify(verifyPayload)
    if (finalPayload.status === 'error') {
      return console.log('Error payload', finalPayload)
    }

    // Verify the proof in the backend
    const verifyResponse = await fetch('/api/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        payload: finalPayload, // Parses only the fields we need to verify
        action: 'nickname', // This is your action ID from the Developer Portal
        signal: '0x12312', // Optional
      }),
    })

    // TODO: Handle Success!
    const verifyResponseJson = await verifyResponse.json()
    if (verifyResponseJson.status === 200) {
      console.log('Verification success!')
      return true;
    }
    else {
      console.log('Verification failed!')
      return false;
    }
  }

  const walletNickname = MiniKit.user?.username?.trim() || "";
  const fallbackName = walletNickname || "Me";
  const storageFallbackProfile = getProfilesAssetUrl("profile-default.jpg");
  const fallbackImage = MiniKit.user?.profilePictureUrl || storageFallbackProfile;
  const fallbackAvatar = MiniKit.user?.profilePictureUrl || storageFallbackProfile;
  const fallbackWallet = MiniKit.user?.walletAddress?.toLowerCase() || "";

  const nickname = userRow?.nickname || fallbackName;
  const bgImage = userRow?.background_url || userRow?.profile_url || fallbackImage;
  const profileImage = userRow?.profile_url || fallbackAvatar;
  const nicknameChanged = editNickname.trim() !== nickname;
  const imageChanged = Boolean(editProfileDataUrl) || Boolean(editBackgroundDataUrl);
  const isAnySaving = isSavingNickname || isSavingImages;

  const walletLabel = useMemo(() => {
    if (walletNickname) return `@${walletNickname}`;
    const wallet = userRow?.wallet_address || fallbackWallet;
    if (!wallet) return "@worldID";
    return `@${shortenWallet(wallet)}`;
  }, [walletNickname, userRow?.wallet_address, fallbackWallet]);

  const openEditModal = () => {
    setEditNickname(nickname);
    setEditProfilePreview(profileImage);
    setEditBackgroundPreview(bgImage);
    setEditProfileDataUrl("");
    setEditBackgroundDataUrl("");
    setNicknameError("");
    setImagesError("");
    setIsEditing(true);
  };

  const closeEditModal = () => {
    if (isAnySaving) return;
    setIsEditing(false);
  };

  const handleImageChange = async (event, type) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setImagesError("Only image files can be uploaded.");
      return;
    }

    try {
      const dataUrl = await readFileAsDataUrl(file);
      if (typeof dataUrl !== "string" || !dataUrl) {
        throw new Error("Invalid image");
      }

      if (type === "profile") {
        setEditProfilePreview(dataUrl);
        setEditProfileDataUrl(dataUrl);
      } else {
        setEditBackgroundPreview(dataUrl);
        setEditBackgroundDataUrl(dataUrl);
      }
      setImagesError("");
    } catch {
      setImagesError("Failed to read the selected image.");
    }
  };

  const handleSaveNickname = async () => {
    const isVerified = await handleVerify();
    if (!isVerified) {
      setNicknameError("Arleady changed before..");
      return;
    }

    const walletAddress = MiniKit.user?.walletAddress;
    const trimmedNickname = editNickname.trim();

    if (!walletAddress) {
      setNicknameError("Wallet address is not available.");
      return;
    }

    if (!trimmedNickname) {
      setNicknameError("Nickname cannot be empty.");
      return;
    }

    if (!nicknameChanged) {
      return;
    }

    setIsSavingNickname(true);
    setNicknameError("");

    try {
      const body = {
        walletAddress,
        nickname: trimmedNickname,
      };

      const response = await fetch("/api/users", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setNicknameError(data?.message || "Failed to save nickname.");
        return;
      }

      if (data?.user) {
        setUserRow(data.user);
        setEditNickname(data.user.nickname || trimmedNickname);
      } else {
        setUserRow((prev) =>
          prev
            ? {
              ...prev,
              nickname: trimmedNickname,
            }
            : prev
        );
      }
    } catch (error) {
      console.error("Error while saving nickname:", error);
      setNicknameError("Error occurred while saving nickname.");
    } finally {
      setIsSavingNickname(false);
    }
  };

  const handleSaveImages = async () => {
    const walletAddress = MiniKit.user?.walletAddress;

    if (!walletAddress) {
      setImagesError("Wallet address is not available.");
      return;
    }

    if (!imageChanged) {
      return;
    }

    setIsSavingImages(true);
    setImagesError("");

    try {
      const body = {
        walletAddress,
      };

      if (editProfileDataUrl) {
        body.profileImage = editProfileDataUrl;
      }

      if (editBackgroundDataUrl) {
        body.backgroundImage = editBackgroundDataUrl;
      }

      const response = await fetch("/api/users", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setImagesError(data?.message || "Failed to save images.");
        return;
      }

      if (data?.user) {
        setUserRow(data.user);
        setEditProfilePreview(data.user.profile_url || profileImage);
        setEditBackgroundPreview(data.user.background_url || data.user.profile_url || bgImage);
      }

      setEditProfileDataUrl("");
      setEditBackgroundDataUrl("");
    } catch (error) {
      console.error("Error while saving profile images:", error);
      setImagesError("Error occurred while saving images.");
    } finally {
      setIsSavingImages(false);
    }
  };

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
          <button className="profile-edit" type="button" aria-label="Edit Profile" onClick={openEditModal}>
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

      {isEditing ? (
        <div className="profile-edit-modal-backdrop" role="presentation" onClick={closeEditModal}>
          <div
            className="profile-edit-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Edit profile"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 className="profile-edit-title">Edit Profile</h2>

            <div className="profile-edit-block">
              <label className="profile-edit-label" htmlFor="profile-edit-nickname">
                Nickname
              </label>
              <div className="profile-edit-inline">
                <input
                  id="profile-edit-nickname"
                  className="profile-edit-input"
                  type="text"
                  value={editNickname}
                  onChange={(event) => setEditNickname(event.target.value)}
                  maxLength={30}
                  placeholder="Enter nickname"
                  disabled={isAnySaving}
                />
                <button
                  className="profile-edit-save-inline"
                  type="button"
                  onClick={handleSaveNickname}
                  disabled={isAnySaving || !nicknameChanged}
                >
                  {isSavingNickname ? "Saving..." : "Save"}
                </button>
              </div>
              {nicknameError ? <p className="profile-edit-error">{nicknameError}</p> : null}
            </div>

            <div className="profile-edit-block">
              <p className="profile-edit-label profile-edit-label-block">Photos</p>
              <div className="profile-edit-images">
                <button
                  className="profile-edit-image-button"
                  type="button"
                  onClick={() => backgroundImageInputRef.current?.click()}
                  disabled={isAnySaving}
                >
                  <span>Change Background</span>
                  <img src={editBackgroundPreview || bgImage} alt="" />
                </button>

                <button
                  className="profile-edit-image-button"
                  type="button"
                  onClick={() => profileImageInputRef.current?.click()}
                  disabled={isAnySaving}
                >
                  <span>Change Avatar</span>
                  <img src={editProfilePreview || profileImage} alt="" />
                </button>
              </div>

              <button
                className="profile-edit-save profile-edit-save-images"
                type="button"
                onClick={handleSaveImages}
                disabled={isAnySaving || !imageChanged}
              >
                {isSavingImages ? "Saving images..." : "Save Photos"}
              </button>
              {imagesError ? <p className="profile-edit-error">{imagesError}</p> : null}
            </div>

            <div className="profile-edit-modal-actions">
              <button
                className="profile-edit-cancel"
                type="button"
                onClick={closeEditModal}
                disabled={isAnySaving}
              >
                Close
              </button>
            </div>

            <input
              ref={backgroundImageInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              hidden
              onChange={(event) => handleImageChange(event, "background")}
            />
            <input
              ref={profileImageInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              hidden
              onChange={(event) => handleImageChange(event, "profile")}
            />
          </div>
        </div>
      ) : null}
    </section>
  );
}
