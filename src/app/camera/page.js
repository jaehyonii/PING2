export default function CameraPage() {
  return (
    <div className="camera-page">
      <button className="camera-back" type="button" aria-label="뒤로">
        <img src="/figma/icon-chevron-down.svg" alt="" />
      </button>
      <div className="camera-logo-wrap">
        <img className="camera-logo" src="/figma/logo-ping.svg" alt="Ping!" />
      </div>

      <div className="camera-preview">
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
