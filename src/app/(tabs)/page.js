const cards = [
  {
    id: 1,
    user: "coinlover1234",
    meta: "Base Builder Sprint · Base · 집계 마감 D-1",
    avatar: "/figma/avatar-default.png",
    image: "/figma/feed-card-1.png",
    overlay: "/figma/feed-overlay-1.png",
  },
  {
    id: 2,
    user: "PingintheBlock",
    meta: "KBW Booth Mission · Optimism · 1시간 42분 남음",
    avatar: "/figma/avatar-default.png",
    image: "/figma/feed-card-2.png",
    overlay: "/figma/feed-overlay-1.png",
  },
  {
    id: 3,
    user: "coinlover1234",
    meta: "Momentum DEX Screenshot Quest · Arbitrum · 2시간 남음",
    avatar: "/figma/avatar-default.png",
    image: "/figma/feed-card-3.png",
    overlay: "/figma/feed-overlay-2.png",
  },
];

export default function Home() {
  return (
    <div className="home">
      <header className="home-header">
        <img className="logo" src="/figma/logo-ping.svg" alt="Ping!" />
        <button className="notify" type="button" aria-label="알림">
          <img src="/figma/icon-bell.svg" alt="" />
        </button>
      </header>

      <div className="home-tabs" role="tablist" aria-label="홈 탭">
        <button className="home-tab is-active" role="tab" aria-selected="true" type="button">
          탐색~
        </button>
        <button className="home-tab" role="tab" aria-selected="false" type="button">
          친구들
        </button>
      </div>

      <section className="feed">
        {cards.map((card) => (
          <article className="feed-card" key={card.id}>
            <header className="card-header">
              <div className="card-user">
                <span className="avatar">
                  <img src={card.avatar} alt="" />
                </span>
                <div className="card-meta">
                  <p className="card-user-name">{card.user}</p>
                  <p className="card-user-sub">{card.meta}</p>
                </div>
              </div>
              <button className="card-menu" type="button" aria-label="더보기">
                <img src="/figma/icon-meatball.svg" alt="" />
              </button>
            </header>
            <div className="card-image">
              <img src={card.image} alt="" />
              <div className="card-overlay">
                <img src={card.overlay} alt="" />
              </div>
              <button className="ping-button" type="button" aria-label="핑 보내기">
                <span className="ping-glow" aria-hidden="true">
                  <img src="/figma/ping-glow.svg" alt="" />
                </span>
                <span className="ping-core">
                  <img src="/figma/ping-core.png" alt="" />
                </span>
              </button>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}

