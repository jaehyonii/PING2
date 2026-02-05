"use client";

import { FaceDetector, FilesetResolver } from "@mediapipe/tasks-vision";
import { useRouter } from "next/navigation";
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
const CAMERA_FACING_FRONT = "user";
const CAMERA_FACING_BACK = "environment";
const CAMERA_SWITCH_DELAY_MS = 150;
const CAMERA_READY_TIMEOUT_MS = 2000;
const STORAGE_KEY_FRONT = "ping-camera-front";
const STORAGE_KEY_BACK = "ping-camera-back";

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
  const router = useRouter();
  const videoRef = useRef(null);
  const maskCanvasRef = useRef(null);
  const maskImageRef = useRef(null);
  const lastDetectionsRef = useRef([]);
  const streamRef = useRef(null);
  const isCapturingRef = useRef(false);
  const mountedRef = useRef(false);
  const [isReady, setIsReady] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isFrontCamera, setIsFrontCamera] = useState(true);

  const stopStream = () => {
    if (!streamRef.current) return;
    streamRef.current.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const waitForVideoReady = (video, timeoutMs = CAMERA_READY_TIMEOUT_MS) =>
    new Promise((resolve) => {
      if (!video) {
        resolve(false);
        return;
      }

      if (video.videoWidth && video.videoHeight) {
        resolve(true);
        return;
      }

      let done = false;

      const cleanup = () => {
        video.removeEventListener("loadedmetadata", handleReady);
        video.removeEventListener("loadeddata", handleReady);
        video.removeEventListener("error", handleError);
        clearTimeout(timerId);
      };

      const handleReady = () => {
        if (done) return;
        done = true;
        cleanup();
        resolve(true);
      };

      const handleError = () => {
        if (done) return;
        done = true;
        cleanup();
        resolve(false);
      };

      const timerId = setTimeout(handleError, timeoutMs);

      video.addEventListener("loadedmetadata", handleReady);
      video.addEventListener("loadeddata", handleReady);
      video.addEventListener("error", handleError);
    });

  const buildConstraints = (facingMode) => [
    { video: { facingMode: { exact: facingMode } }, audio: false },
    { video: { facingMode: { ideal: facingMode } }, audio: false },
  ];

  const findBackCameraId = async () => {
    if (!navigator?.mediaDevices?.enumerateDevices) return null;

    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter((device) => device.kind === "videoinput");
      if (!videoDevices.length) return null;

      const backDevice = videoDevices.find((device) =>
        /back|rear|environment/i.test(device.label || "")
      );
      return (backDevice ?? videoDevices[videoDevices.length - 1]).deviceId || null;
    } catch (error) {
      return null;
    }
  };

  const requestStream = async (constraintsList) => {
    let lastError = null;
    for (const constraints of constraintsList) {
      try {
        return await navigator.mediaDevices.getUserMedia(constraints);
      } catch (error) {
        lastError = error;
      }
    }
    throw lastError;
  };

  const startCamera = async (facingMode, allowErrorMessage = true) => {
    if (typeof window === "undefined") return false;

    if (!window.isSecureContext) {
      if (allowErrorMessage) {
        setErrorMessage("카메라는 HTTPS 환경에서만 사용할 수 있어요.");
      }
      return false;
    }

    if (!navigator?.mediaDevices?.getUserMedia) {
      if (allowErrorMessage) {
        setErrorMessage("브라우저가 카메라를 지원하지 않아요.");
      }
      return false;
    }

    setIsReady(false);
    if (allowErrorMessage) setErrorMessage("");

    try {
      stopStream();
      await new Promise((resolve) => setTimeout(resolve, 80));

      let constraintsList = buildConstraints(facingMode);
      if (facingMode === CAMERA_FACING_BACK) {
        const backDeviceId = await findBackCameraId();
        if (backDeviceId) {
          constraintsList = [
            ...constraintsList,
            { video: { deviceId: { exact: backDeviceId } }, audio: false },
          ];
        }
      }
      const stream = await requestStream(constraintsList);

      if (!mountedRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return false;
      }

      streamRef.current = stream;
      const video = videoRef.current;

      if (video) {
        video.srcObject = stream;
        await video.play().catch(() => {});
      }

      const ready = await waitForVideoReady(video);
      if (!mountedRef.current) return false;

      setIsReady(ready);
      setIsFrontCamera(facingMode !== CAMERA_FACING_BACK);

      if (!ready && allowErrorMessage) {
        setErrorMessage("카메라 화면을 불러오지 못했어요.");
      }

      return ready;
    } catch (error) {
      if (allowErrorMessage) {
        const errorName = error?.name;
        if (errorName === "NotAllowedError" || errorName === "SecurityError") {
          setErrorMessage("카메라 접근 권한을 허용해주세요.");
        } else if (facingMode === CAMERA_FACING_BACK) {
          setErrorMessage("후면 카메라를 사용할 수 없어요.");
        } else {
          setErrorMessage("카메라를 불러오지 못했어요.");
        }
      }
      return false;
    }
  };

  useEffect(() => {
    mountedRef.current = true;
    startCamera(CAMERA_FACING_FRONT);

    return () => {
      mountedRef.current = false;
      stopStream();
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

  const captureFrame = (includeMask, mirror = isFrontCamera) => {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) return null;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    if (mirror) {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    if (includeMask && maskCanvasRef.current) {
      ctx.drawImage(maskCanvasRef.current, 0, 0, canvas.width, canvas.height);
    }

    return canvas.toDataURL("image/jpeg", 0.92);
  };

  const handleShutter = async () => {
    if (!isReady || isCapturingRef.current) return;
    if (typeof window === "undefined") return;

    isCapturingRef.current = true;
    setErrorMessage("");

    const frontImage = captureFrame(true, true);

    if (!frontImage) {
      setErrorMessage("전면 사진을 저장하지 못했어요. 다시 시도해주세요.");
      isCapturingRef.current = false;
      return;
    }

    const backReady = await startCamera(CAMERA_FACING_BACK);
    if (!backReady) {
      isCapturingRef.current = false;
      await startCamera(CAMERA_FACING_FRONT, false);
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, CAMERA_SWITCH_DELAY_MS));

    const backImage = captureFrame(false, false);
    if (!backImage) {
      setErrorMessage("후면 사진을 저장하지 못했어요. 다시 시도해주세요.");
      isCapturingRef.current = false;
      await startCamera(CAMERA_FACING_FRONT, false);
      return;
    }

    window.sessionStorage.setItem(STORAGE_KEY_FRONT, frontImage);
    window.sessionStorage.setItem(STORAGE_KEY_BACK, backImage);

    router.push("/camera/preview");
  };

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

      <button className="camera-shutter" type="button" aria-label="촬영" onClick={handleShutter}>
        <img src="/figma/camera-shutter.svg" alt="" />
      </button>
    </div>
  );
}
