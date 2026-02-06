"use client";

import { FaceDetector, FilesetResolver } from "@mediapipe/tasks-vision";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

const DEFAULT_MASK_SRC = "/mask/Popcat.svg";
const FACE_MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/latest/blaze_face_short_range.tflite";
const VISION_WASM_BASE = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm";
const DETECT_INTERVAL_MS = 60;
const CAMERA_FACING_FRONT = "user";
const CAMERA_FACING_BACK = "environment";
const CAMERA_READY_TIMEOUT_MS = 5000;
const CAMERA_SWITCH_DELAY_MS = 450;
const STORAGE_KEY_FRONT = "ping-camera-front";
const STORAGE_KEY_BACK = "ping-camera-back";

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const getRollAngle = (detection) => {
  const keypoints = detection?.keypoints;
  if (!keypoints || keypoints.length < 2) return 0;

  let left = keypoints[0];
  let right = keypoints[0];

  for (const point of keypoints) {
    if (point.x < left.x) left = point;
    if (point.x > right.x) right = point;
  }

  return Math.atan2(right.y - left.y, right.x - left.x);
};

const waitForVideoReady = (video, timeoutMs = CAMERA_READY_TIMEOUT_MS) =>
  new Promise((resolve) => {
    if (!video) {
      resolve(false);
      return;
    }

    let done = false;
    let pollId = null;

    const isReady = () =>
      video.videoWidth > 0 &&
      video.videoHeight > 0 &&
      video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA;

    const finish = (result) => {
      if (done) return;
      done = true;
      video.removeEventListener("loadedmetadata", onReady);
      video.removeEventListener("loadeddata", onReady);
      video.removeEventListener("canplay", onReady);
      video.removeEventListener("playing", onReady);
      video.removeEventListener("resize", onReady);
      video.removeEventListener("error", onError);
      clearTimeout(timeoutId);
      if (pollId) clearInterval(pollId);
      resolve(result);
    };

    const onReady = () => {
      if (!isReady()) return;
      finish(true);
    };

    const onError = () => finish(false);
    const timeoutId = setTimeout(onError, timeoutMs);

    if (isReady()) {
      finish(true);
      return;
    }

    video.addEventListener("loadedmetadata", onReady);
    video.addEventListener("loadeddata", onReady);
    video.addEventListener("canplay", onReady);
    video.addEventListener("playing", onReady);
    video.addEventListener("resize", onReady);
    video.addEventListener("error", onError);
    pollId = setInterval(onReady, 80);
  });

export default function CameraPage() {
  const router = useRouter();
  const videoRef = useRef(null);
  const maskCanvasRef = useRef(null);
  const streamRef = useRef(null);
  const mountedRef = useRef(false);
  const maskImageRef = useRef(null);
  const isSequenceRunningRef = useRef(false);
  const detectorRef = useRef(null);
  const detectorRafRef = useRef(null);
  const lastDetectionsRef = useRef([]);

  const [isReady, setIsReady] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [isFrontCamera, setIsFrontCamera] = useState(true);
  const [isSequenceRunning, setIsSequenceRunning] = useState(false);

  const clearMaskCanvas = useCallback(() => {
    const canvas = maskCanvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }, []);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    const video = videoRef.current;
    if (video) {
      video.pause();
      video.srcObject = null;
    }
  }, []);

  const getBackDeviceId = useCallback(async () => {
    if (!navigator?.mediaDevices?.enumerateDevices) return null;

    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter((device) => device.kind === "videoinput");
      const backDevice = videoDevices.find((device) =>
        /back|rear|environment/i.test(device.label || "")
      );
      return backDevice?.deviceId ?? null;
    } catch {
      return null;
    }
  }, []);

  const requestCameraStream = useCallback(
    async (facingMode) => {
      const constraintsList = [];

      if (facingMode === CAMERA_FACING_BACK) {
        constraintsList.push({ video: { facingMode: { exact: CAMERA_FACING_BACK } }, audio: false });
        constraintsList.push({ video: { facingMode: CAMERA_FACING_BACK }, audio: false });
        constraintsList.push({ video: { facingMode: { ideal: CAMERA_FACING_BACK } }, audio: false });

        const backDeviceId = await getBackDeviceId();
        if (backDeviceId) {
          constraintsList.unshift({ video: { deviceId: { exact: backDeviceId } }, audio: false });
        }
      } else {
        constraintsList.push({ video: { facingMode: { exact: CAMERA_FACING_FRONT } }, audio: false });
        constraintsList.push({ video: { facingMode: CAMERA_FACING_FRONT }, audio: false });
        constraintsList.push({ video: { facingMode: { ideal: CAMERA_FACING_FRONT } }, audio: false });
      }

      constraintsList.push({ video: true, audio: false });

      let lastError = null;
      for (const constraints of constraintsList) {
        try {
          return await navigator.mediaDevices.getUserMedia(constraints);
        } catch (error) {
          lastError = error;
        }
      }

      throw lastError;
    },
    [getBackDeviceId]
  );

  const startCamera = useCallback(
    async (facingMode, { showError = true, clearError = true } = {}) => {
      if (typeof window === "undefined") return false;

      if (!window.isSecureContext) {
        if (showError) setErrorMessage("카메라는 HTTPS 환경에서만 사용할 수 있어요.");
        return false;
      }

      if (!navigator?.mediaDevices?.getUserMedia) {
        if (showError) setErrorMessage("브라우저가 카메라를 지원하지 않아요.");
        return false;
      }

      setIsReady(false);
      if (clearError) setErrorMessage("");

      try {
        stopStream();
        await wait(120);

        const stream = await requestCameraStream(facingMode);
        if (!mountedRef.current) {
          stream.getTracks().forEach((track) => track.stop());
          return false;
        }

        streamRef.current = stream;

        const video = videoRef.current;
        if (!video) return false;

        video.pause();
        video.srcObject = null;
        video.srcObject = stream;
        await video.play().catch(() => {});

        const ready = await waitForVideoReady(video);
        if (!mountedRef.current) return false;

        setIsFrontCamera(facingMode === CAMERA_FACING_FRONT);
        setIsReady(ready);

        if (!ready && showError) {
          setErrorMessage("카메라 화면을 불러오지 못했어요.");
        }

        return ready;
      } catch (error) {
        if (showError) {
          if (error?.name === "NotAllowedError" || error?.name === "SecurityError") {
            setErrorMessage("카메라 접근 권한을 허용해주세요.");
          } else if (facingMode === CAMERA_FACING_BACK) {
            setErrorMessage("후면 카메라를 사용할 수 없어요.");
          } else {
            setErrorMessage("카메라를 불러오지 못했어요.");
          }
        }
        return false;
      }
    },
    [requestCameraStream, stopStream]
  );

  useEffect(() => {
    const image = new Image();
    image.src = DEFAULT_MASK_SRC;
    image.onload = () => {
      maskImageRef.current = image;
    };
  }, []);

  useEffect(() => {
    if (!isReady || !isFrontCamera) {
      lastDetectionsRef.current = [];
      clearMaskCanvas();
      return;
    }

    let cancelled = false;
    let detector = null;
    let animationId = null;
    let lastDetectAt = 0;

    const renderLoop = () => {
      if (cancelled) return;

      const video = videoRef.current;
      const canvas = maskCanvasRef.current;
      const maskImage = maskImageRef.current;
      if (!video || !canvas) {
        animationId = requestAnimationFrame(renderLoop);
        detectorRafRef.current = animationId;
        return;
      }

      if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
        canvas.width = video.videoWidth || 1;
        canvas.height = video.videoHeight || 1;
      }

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        animationId = requestAnimationFrame(renderLoop);
        detectorRafRef.current = animationId;
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (detector && video.videoWidth && video.videoHeight) {
        const now = performance.now();
        if (now - lastDetectAt >= DETECT_INTERVAL_MS) {
          lastDetectAt = now;
          const results = detector.detectForVideo(video, now);
          lastDetectionsRef.current = results?.detections ?? [];
        }
      }

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
      detectorRafRef.current = animationId;
    };

    const setup = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(VISION_WASM_BASE);
        if (cancelled) return;

        detector = await FaceDetector.createFromOptions(vision, {
          baseOptions: { modelAssetPath: FACE_MODEL_URL },
          runningMode: "VIDEO",
          minDetectionConfidence: 0.6,
        });
        if (cancelled) {
          detector.close();
          return;
        }

        detectorRef.current = detector;
        renderLoop();
      } catch (error) {
        if (process.env.NODE_ENV !== "production") {
          console.warn("Face detector initialization failed:", error);
        }
      }
    };

    setup();

    return () => {
      cancelled = true;
      if (animationId) cancelAnimationFrame(animationId);
      detectorRafRef.current = null;
      lastDetectionsRef.current = [];

      if (detector?.close) detector.close();
      if (detectorRef.current === detector) detectorRef.current = null;

      clearMaskCanvas();
    };
  }, [clearMaskCanvas, isFrontCamera, isReady]);

  useEffect(() => {
    mountedRef.current = true;
    const initTimer = setTimeout(() => {
      void startCamera(CAMERA_FACING_FRONT);
    }, 0);

    return () => {
      mountedRef.current = false;
      clearTimeout(initTimer);
      if (detectorRafRef.current) cancelAnimationFrame(detectorRafRef.current);
      if (detectorRef.current?.close) detectorRef.current.close();
      detectorRef.current = null;
      stopStream();
    };
  }, [startCamera, stopStream]);

  const captureFrame = useCallback(({ includeMask, mirror }) => {
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
  }, []);

  const handleShutter = useCallback(async () => {
    if (!isReady || isSequenceRunningRef.current) return;

    isSequenceRunningRef.current = true;
    setIsSequenceRunning(true);
    setErrorMessage("");

    try {
      setStatusMessage("전면 사진 촬영 중...");
      const frontImage = captureFrame({ includeMask: true, mirror: true });
      if (!frontImage) {
        setErrorMessage("전면 사진을 저장하지 못했어요. 다시 시도해주세요.");
        return;
      }

      setStatusMessage("후면 카메라로 전환 중...");
      const backReady = await startCamera(CAMERA_FACING_BACK, {
        showError: true,
        clearError: false,
      });
      if (!backReady) {
        await startCamera(CAMERA_FACING_FRONT, { showError: false, clearError: false });
        return;
      }

      setStatusMessage("후면 사진 자동 촬영 중...");
      await wait(CAMERA_SWITCH_DELAY_MS);

      const backImage = captureFrame({ includeMask: false, mirror: false });
      if (!backImage) {
        setErrorMessage("후면 사진을 저장하지 못했어요. 다시 시도해주세요.");
        await startCamera(CAMERA_FACING_FRONT, { showError: false, clearError: false });
        return;
      }

      window.sessionStorage.setItem(STORAGE_KEY_FRONT, frontImage);
      window.sessionStorage.setItem(STORAGE_KEY_BACK, backImage);
      router.push("/camera/preview");
    } finally {
      isSequenceRunningRef.current = false;
      setIsSequenceRunning(false);
      setStatusMessage("");
    }
  }, [captureFrame, isReady, router, startCamera]);

  const handleFlipCamera = useCallback(async () => {
    if (isSequenceRunningRef.current) return;

    setStatusMessage("카메라 전환 중...");
    const targetFacing = isFrontCamera ? CAMERA_FACING_BACK : CAMERA_FACING_FRONT;
    await startCamera(targetFacing);
    setStatusMessage("");
  }, [isFrontCamera, startCamera]);

  return (
    <div className="camera-page">
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

        {!errorMessage && !isReady ? (
          <div className="camera-preview-status" role="status" aria-live="polite">
            카메라를 준비하는 중이에요...
          </div>
        ) : null}

        {!errorMessage && isReady && statusMessage ? (
          <div className="camera-preview-status" role="status" aria-live="polite">
            {statusMessage}
          </div>
        ) : null}

        {errorMessage ? (
          <div className="camera-preview-status is-error" role="alert">
            {errorMessage}
          </div>
        ) : null}

        <div className="camera-preview-overlay">
          <button className="camera-control camera-flash" type="button" aria-label="플래시 끄기">
            <img src="/figma/camera/shot/icon-flash-off.svg" alt="" />
          </button>
          <button
            className="camera-control camera-flip"
            type="button"
            aria-label="카메라 전환"
            onClick={handleFlipCamera}
            disabled={isSequenceRunning}
          >
            <img src="/figma/camera/shot/icon-flip-camera.svg" alt="" />
          </button>
        </div>
      </div>

      <button
        className="camera-shutter"
        type="button"
        aria-label="촬영"
        onClick={handleShutter}
        disabled={!isReady || isSequenceRunning}
      >
        <img src="/figma/camera/shot/camera-shutter.svg" alt="" />
      </button>
    </div>
  );
}
