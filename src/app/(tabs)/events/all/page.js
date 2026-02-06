import Link from "next/link";

const HOT_PINGS = [
  {
    image: "/figma/events/events-hot-ping-1.png",
    lines: ["친구랑 광고보고", "리워드 수령까지~"],
  },
  {
    image: "/figma/events/events-hot-ping-2.png",
    lines: ["발급 받은 기프트로", "들어온 편의점에서 한 컷"],
  },
  {
    image: "/figma/events/events-hot-ping-3.png",
    lines: ["카페에서 바우처", "사용하고 한 장"],
  },
];

const RECOMMENDED_EVENTS = [
  {
    tag: "[World]",
    title: "MiniApp 1개 다운로드 받기",
    icon: "/figma/events/events-icon-worldcoin.png",
  },
  {
    tag: "[MADS]",
    title: "광고 1회 보기",
    icon: "/figma/events/events-icon-mads.png",
  },
  {
    tag: "[Gift Card]",
    title: "기프트카드 1장 발급/예약",
    icon: "/figma/events/events-icon-gift-card.png",
  },
  {
    tag: "[Deals]",
    title: "바우처 1개 사용하기",
    icon: "/figma/events/events-icon-deals-coupon.png",
  },
  {
    tag: "[Uno]",
    title: "$WLD 입금하기",
    icon: "/figma/events/events-icon-uno.png",
  },
  {
    tag: "[Credit]",
    title: "지금 바로 달러 빌리기",
    icon: "/figma/events/events-icon-credit.png",
  },
];

export default function EventsAllPage() {
  return (
    <section className="events-page" aria-label="이벤트">
      <img className="events-logo" src="/figma/events/logo-ping.svg" alt="Ping" />
      <h1 className="events-title">오늘의 Ping! 을 남겨요.</h1>
      <p className="events-subtitle">
        사진 한 장으로 Ping Point를 받고,
        <br />
        에어드랍도 챙기세요.
      </p>

      <Link className="events-search" href="/events/detail/1" aria-label="이벤트 검색">
        <img src="/figma/events/icon-search-muted.svg" alt="" />
        <span>참여하고 싶은 이벤트를 검색하세요!</span>
      </Link>

      <section className="events-hot">
        <div className="events-section-head">
          <h2>최근 인기 Ping!</h2>
          <p>PingMask를 활용하면 쉽게 참여 가능해요.</p>
        </div>

        <div className="events-hot-grid">
          {HOT_PINGS.map((item, index) => (
            <Link className="events-hot-card" href={`/events/detail/${index + 1}`} key={`hot-${index}`}>
              <img src={item.image} alt="" />
              <div className="events-hot-overlay">
                <p className="events-hot-label">Today&apos;s Ping!</p>
                <p className="events-hot-copy">{item.lines[0]}</p>
                <p className="events-hot-copy">{item.lines[1]}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="events-recommended">
        <div className="events-section-head">
          <h2>추천 이벤트</h2>
          <p>이외에도 다양한 이벤트들이 열려요.</p>
        </div>

        <div className="events-list">
          {RECOMMENDED_EVENTS.map((item, index) => (
            <Link className="events-item" href={`/events/detail/${index + 1}`} key={`${item.tag}-${item.title}`}>
              <span className="events-item-icon">
                <img src={item.icon} alt="" />
              </span>
              <span className="events-item-content">
                <span className="events-item-title">
                  <span className="events-item-tag">{`${item.tag} `}</span>
                  <span>{item.title}</span>
                </span>
                <span className="events-item-meta">Ping Point +35P / AirDrop Pool +1,000P</span>
              </span>
              <img className="events-item-next" src="/figma/events/icon-next-ltr.svg" alt="" />
            </Link>
          ))}
        </div>
      </section>
    </section>
  );
}
