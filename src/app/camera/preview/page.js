"use client";

import { useEffect, useState } from "react";

const FRONT_PHOTO_FALLBACK = "/feeds/Feed_selfie_01.png";
const BACK_PHOTO_FALLBACK = "/feeds/Feed_scene_01.png";
const STORAGE_KEY_FRONT = "ping-camera-front";
const STORAGE_KEY_BACK = "ping-camera-back";

export default function CameraCapturedPreview() {
  const [lockedHeight] = useState(() =>
    typeof window !== "undefined" ? window.innerHeight : null
  );
  const [photos, setPhotos] = useState({
    front: FRONT_PHOTO_FALLBACK,
    back: BACK_PHOTO_FALLBACK,
  });

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

  return (
    <div className="capture-page" style={capturePageStyle}>
      <label className="capture-caption" aria-label="오늘의 Ping! 한 줄 추가하기">
        <textarea
          className="capture-caption-input"
          placeholder="오늘의 Ping! 한 줄 추가하기…"
          rows={1}
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
        <p className="capture-action-note">오늘의 Ping!을 게시하면 Ping Point가 쌓여요.</p>
        <button className="capture-action-button" type="button">
          <span>Ping! 올리기</span>
          <img src="/figma/camera/preview/icon-sand.svg" alt="" />
        </button>
      </div>
    </div>
  );
}
