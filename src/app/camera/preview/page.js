const FRONT_PHOTO_SRC = "/feeds/Feed_selfie_01.png";
const BACK_PHOTO_SRC = "/feeds/Feed_scene_01.png";

export default function CameraCapturedPreview() {
  return (
    <div className="capture-page">
      <button className="capture-back" type="button" aria-label="뒤로가기">
        <img src="/figma/icon-chevron-down.svg" alt="" />
      </button>

      <div className="capture-logo-wrap" aria-hidden="true">
        <img className="capture-logo" src="/figma/logo-ping.svg" alt="Ping 로고" />
      </div>

      <label className="capture-caption" aria-label="오늘의 Ping! 한 줄 추가하기">
        <textarea
          className="capture-caption-input"
          placeholder="오늘의 Ping! 한 줄 추가하기..."
          rows={1}
        />
      </label>

      <section className="capture-photo-card" aria-label="오늘의 Ping! 사진">
        <img className="capture-photo-main" src={BACK_PHOTO_SRC} alt="배경 사진" />
        <div className="capture-photo-overlay">
          <div className="capture-photo-thumb">
            <img src={FRONT_PHOTO_SRC} alt="전면 사진" />
          </div>
        </div>
      </section>

      <div className="capture-action">
        <p className="capture-action-note">오늘의 Ping!을 공유하면 Ping Point가 쌓여요.</p>
        <button className="capture-action-button" type="button">
          <span>Ping! 올리기</span>
          <img src="/figma/icon-sand.svg" alt="" />
        </button>
      </div>
    </div>
  );
}
