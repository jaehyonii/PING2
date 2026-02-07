"use client";

import { MiniKit } from "@worldcoin/minikit-js";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getFeedsAssetUrl } from "@/lib/supabaseStorage";
import UploadSuccessModal from "@/components/UploadSuccessModal";

const FRONT_PHOTO_FALLBACK = getFeedsAssetUrl("Feed_selfie_01.png");
const BACK_PHOTO_FALLBACK = getFeedsAssetUrl("Feed_scene_01.png");
const STORAGE_KEY_FRONT = "ping-camera-front";
const STORAGE_KEY_BACK = "ping-camera-back";
const isDataImageUrl = (value) => typeof value === "string" && value.startsWith("data:image/");

export default function CameraCapturedPreview() {
  const router = useRouter();
  const [lockedHeight] = useState(() =>
    typeof window !== "undefined" ? window.innerHeight : null
  );
  const [caption, setCaption] = useState("");
  const [photos, setPhotos] = useState({
    front: FRONT_PHOTO_FALLBACK,
    back: BACK_PHOTO_FALLBACK,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const capturePageStyle =
    lockedHeight !== null
      ? { "--capture-locked-height": `${lockedHeight}px` }
      : undefined;

  useEffect(() => {
    if (typeof window === "undefined") return;
    const readTimer = setTimeout(() => {
      const storedFront = window.sessionStorage.getItem(STORAGE_KEY_FRONT);
      const storedBack = window.sessionStorage.getItem(STORAGE_KEY_BACK);

      setPhotos({
        front: storedFront || FRONT_PHOTO_FALLBACK,
        back: storedBack || BACK_PHOTO_FALLBACK,
      });
    }, 0);

    return () => clearTimeout(readTimer);
  }, []);

  const handlePublish = async () => {
    if (isSubmitting) return;

    const walletAddress = MiniKit.user?.walletAddress?.trim();
    if (!walletAddress) {
      setSubmitError("지갑 정보를 확인할 수 없어요. 다시 로그인해주세요.");
      return;
    }
    if (!isDataImageUrl(photos.front) || !isDataImageUrl(photos.back)) {
      setSubmitError("촬영된 전면/후면 사진이 필요해요. 다시 촬영해주세요.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");

    try {
      const response = await fetch("/api/feeds", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          walletAddress,
          frontImage: photos.front,
          backImage: photos.back,
          caption: caption.trim() || null,
        }),
      });

      if (!response.ok) {
        const detail = await response.text();
        throw new Error(detail || "Feed insert failed");
      }

      if (typeof window !== "undefined") {
        window.sessionStorage.removeItem(STORAGE_KEY_FRONT);
        window.sessionStorage.removeItem(STORAGE_KEY_BACK);
      }

      setShowSuccessModal(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      setSubmitError(message || "업로드에 실패했어요. 잠시 후 다시 시도해주세요.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleModalConfirm = () => {
    setShowSuccessModal(false);
    router.push("/feed/all");
  };

  return (
    <div className="capture-page" style={capturePageStyle}>
      <label className="capture-caption" aria-label="오늘의 Ping! 한 줄 추가하기">
        <textarea
          className="capture-caption-input"
          placeholder="오늘의 Ping! 한 줄 추가하기…"
          rows={1}
          value={caption}
          onChange={(event) => setCaption(event.target.value)}
        />
      </label>

      <section className="capture-photo-card" aria-label="촬영한 사진 미리보기">
        <img className="capture-photo-main" src={photos.back} alt="후면 사진" />
        <div className="capture-photo-overlay">
          <div className="capture-photo-thumb">
            <img src={photos.front} alt="전면 사진" />
          </div>
        </div>
      </section>

      <div className="capture-action">
        <p className="capture-action-note">
          {submitError || "오늘의 Ping!을 게시하면 Ping Point가 쌓여요."}
        </p>
        <button
          className="capture-action-button"
          type="button"
          onClick={handlePublish}
          disabled={isSubmitting}
        >
          <span>{isSubmitting ? "업로드 중..." : "Ping! 올리기"}</span>
          <img src="/figma/camera/preview/icon-sand.svg" alt="" />
        </button>
      </div>

      <UploadSuccessModal
        isOpen={showSuccessModal}
        onConfirm={handleModalConfirm}
        onClose={handleModalConfirm}
      />
    </div>
  );
}
