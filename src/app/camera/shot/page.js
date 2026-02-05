"use client";

import { FaceDetector, FilesetResolver } from "@mediapipe/tasks-vision";
import { useEffect, useRef, useState } from "react";

const MASK_SOURCES = [
  "/mask/Popcat.svg",
  "/mask/Dogecoin.svg",
  "/mask/Jupiter.svg",
  "/mask/Memecoin.svg",
  "/mask/MetaMask.svg",
  "/mask/Optimism.svg",
  "/mask/Orca.svg",
];
const DEFAULT_MASK_SRC = MASK_SOURCES[0];
const FACE_MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/latest/blaze_face_short_range.tflite";
const VISION_WASM_BASE = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm";
const DETECT_INTERVAL_MS = 60;

const getRollAngle = (detection) => {
  const keypoints = detection?.keypoints;
  if (!keypoints || keypoints.length < 2) return 0;

  let left = keypoints[0];
  let right = keypoints[0];

  for (const point of keypoints) {
    if (point.x < left.x) left = point;
    if (point.x > right.x) right = point;
  }

  const dx = right.x - left.x;
  const dy = right.y - left.y;
  return Math.atan2(dy, dx);
};

export default function CameraPage() {
  const videoRef = useRef(null);
  const maskCanvasRef = useRef(null);
  const maskImageRef = useRef(null);
  const lastDetectionsRef = useRef([]);
  const [isReady, setIsReady] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const isFrontCamera = true;

  useEffect(() => {
    let activeStream = null;
    let cancelled = false;

    const startCamera = async () => {
      setIsReady(false);
      setErrorMessage("");

      if (typeof window === "undefined") return;

      if (!window.isSecureContext) {
        setErrorMessage("카메라는 HTTPS 환경에서만 사용할 수 있어요.");
        return;
      }

      if (!navigator?.mediaDevices?.getUserMedia) {
        setErrorMessage("브라우저가 카메라를 지원하지 않아요.");
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
          audio: false,
        });

        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        activeStream = stream;
        const video = videoRef.current;

        if (video) {
          video.srcObject = stream;
          await video.play().catch(() => {});
          setIsReady(true);
        }
      } catch (error) {
        setErrorMessage("카메라 접근 권한을 허용해주세요.");
      }
    };

    startCamera();

    return () => {
      cancelled = true;
      if (activeStream) {
        activeStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const image = new Image();
    image.src = DEFAULT_MASK_SRC;
    image.onload = () => {
      maskImageRef.current = image;
    };
  }, []);

  useEffect(() => {
    if (!isReady || errorMessage) return;

    let detector = null;
    let animationId = null;
    let cancelled = false;
    let lastDetectAt = 0;

    const setupDetector = async () => {
      try {
        const video = videoRef.current;
        const canvas = maskCanvasRef.current;
        if (!video || !canvas) return;

        const vision = await FilesetResolver.forVisionTasks(VISION_WASM_BASE);
        detector = await FaceDetector.createFromOptions(vision, {
          baseOptions: { modelAssetPath: FACE_MODEL_URL },
          runningMode: "VIDEO",
          minDetectionConfidence: 0.6,
        });

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const renderLoop = () => {
          if (cancelled) return;

          if (!video.videoWidth || !video.videoHeight) {
            animationId = requestAnimationFrame(renderLoop);
            return;
          }

          if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
          }

          ctx.clearRect(0, 0, canvas.width, canvas.height);

          const now = performance.now();
          if (now - lastDetectAt >= DETECT_INTERVAL_MS) {
            lastDetectAt = now;
            const results = detector.detectForVideo(video, now);
            lastDetectionsRef.current = results?.detections ?? [];
          }

          const maskImage = maskImageRef.current;
          if (maskImage) {
            for (const detection of lastDetectionsRef.current) {
              const box = detection?.boundingBox;
              if (!box) continue;

              const size = Math.max(box.width, box.height) * 1.2;
              const centerX = box.originX + box.width / 2;
              const centerY = box.originY + box.height / 2;
              const angle = getRollAngle(detection);

              ctx.save();
              ctx.translate(centerX, centerY);
              ctx.rotate(angle);
              ctx.drawImage(maskImage, -size / 2, -size / 2, size, size);
              ctx.restore();
            }
          }

          animationId = requestAnimationFrame(renderLoop);
        };

        renderLoop();
      } catch (error) {
        setErrorMessage("얼굴 인식 모델을 불러오지 못했어요.");
      }
    };

    setupDetector();

    return () => {
      cancelled = true;
      if (animationId) cancelAnimationFrame(animationId);
      if (detector?.close) detector.close();
    };
  }, [isReady, errorMessage]);

  return (
    <div className="camera-page">
      <button className="camera-back" type="button" aria-label="뒤로">
        <img src="/figma/icon-chevron-down.svg" alt="" />
      </button>
      <div className="camera-logo-wrap">
        <img className="camera-logo" src="/figma/logo-ping.svg" alt="Ping!" />
      </div>

      <div className="camera-preview">
        <video
          ref={videoRef}
          className={`camera-video${isFrontCamera ? " is-mirrored" : ""}`}
          autoPlay
          playsInline
          muted
        />
        <canvas
          ref={maskCanvasRef}
          className={`camera-mask-canvas${isFrontCamera ? " is-mirrored" : ""}`}
          aria-hidden="true"
        />
        {!isReady && !errorMessage ? (
          <div className="camera-preview-status" role="status" aria-live="polite">
            카메라를 준비하는 중이에요...
          </div>
        ) : null}
        {errorMessage ? (
          <div className="camera-preview-status is-error" role="alert">
            {errorMessage}
          </div>
        ) : null}
        <div className="camera-preview-overlay">
          <button className="camera-control camera-flash" type="button" aria-label="플래시 끄기">
            <img src="/figma/icon-flash-off.svg" alt="" />
          </button>
          <button className="camera-control camera-flip" type="button" aria-label="카메라 전환">
            <img src="/figma/icon-flip-camera.svg" alt="" />
          </button>
        </div>
      </div>

      <button className="camera-shutter" type="button" aria-label="촬영">
        <img src="/figma/camera-shutter.svg" alt="" />
      </button>
    </div>
  );
}
