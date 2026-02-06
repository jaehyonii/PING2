const PUBLIC_PINGS = [
  "/figma/profile/profile-public-ping-1.png",
  "/figma/profile/profile-public-ping-2.png",
  "/figma/profile/profile-public-ping-3.png",
  "/figma/profile/profile-public-ping-4.png",
  "/figma/profile/profile-public-ping-5.png",
  "/figma/profile/profile-public-ping-1.png",
];

export default function ProfilePage() {
  return (
    <section className="profile-page" aria-label="프로필">
      <div className="profile-hero">
        <img className="profile-hero-image" src="/figma/profile/profile-hero.png" alt="" />
        <div className="profile-hero-top-fade" aria-hidden="true" />
        <div className="profile-hero-bottom-fade" aria-hidden="true" />
        <div className="profile-meta">
          <h1 className="profile-name">Me</h1>
          <p className="profile-id">
            @worldID <span aria-hidden="true">🔥</span>
          </p>
        </div>
      </div>

      <div className="profile-content">
        <p className="profile-stats">
          <span className="profile-stats-value">36</span>
          <span className="profile-stats-label">친구</span>
          <span className="profile-stats-dot" aria-hidden="true">
            ·
          </span>
          <span className="profile-stats-value">24</span>
          <span className="profile-stats-label">팔로워</span>
          <span className="profile-stats-dot" aria-hidden="true">
            ·
          </span>
          <span className="profile-stats-value">8</span>
          <span className="profile-stats-label">팔로잉</span>
        </p>

        <div className="profile-actions">
          <button className="profile-share" type="button">
            이 프로필 공유
          </button>
          <button className="profile-edit" type="button" aria-label="프로필 수정">
            <img src="/figma/profile/icon-profile-edit.svg" alt="" />
          </button>
        </div>

        <h2 className="profile-section-title">공개 Ping!</h2>
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
