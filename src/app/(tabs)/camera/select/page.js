import Link from "next/link";

const MASK_CARDS = [
  {
    title: "MADS",
    imageUrl: "/figma/camera/select/hotping-mad.jpg",
    objectPosition: "left center",
  },
  {
    title: "Credits",
    imageUrl: "/figma/camera/select/hotping-credit.png",
    objectPosition: "center top",
  },
  {
    title: "Worldcoin",
    imageUrl: "/figma/camera/select/hotping-world.png",
    objectPosition: "center top",
  },
  {
    title: "Gift Card",
    imageUrl: "/figma/camera/select/hotping-gift.png",
    objectPosition: "left center",
  },
  {
    title: "Deals",
    imageUrl: "/figma/camera/select/hotping-deal.png",
    objectPosition: "center top",
  },
  {
    title: "Uno",
    imageUrl: "/figma/camera/select/hotping-uno.png",
    objectPosition: "center top",
  },
];

const FILTERS = ["추천", "지금 인기", "내가 자주 사용하는"];

export default function CameraSelectPage() {
  return (
    <>
      <main className="camera-select-page">
        <h1 className="camera-select-title">원하는 PingMask를 고르세요.</h1>
        <p className="camera-select-subtitle">
          PingMask로 얼굴을 가리고,
          <br />
          한 장만 찍으면 끝.
        </p>

        <button className="camera-select-search" type="button" aria-label="체인 검색">
          <img src="/figma/events/icon-search-muted.svg" alt="" />
          <span>앱을 검색하세요!</span>
        </button>

        <div className="camera-select-filter-row">
          <div className="camera-select-filters" role="tablist" aria-label="PingMask 필터">
            {FILTERS.map((label, index) => (
              <button
                key={label}
                type="button"
                role="tab"
                className={`camera-select-filter-chip${index === 2 ? " is-active" : ""}`}
                aria-selected={index === 2}
              >
                {label}
              </button>
            ))}
          </div>
          <button className="camera-select-filter-plus" type="button" aria-label="필터 추가">
            <img src="/figma/events/icon-plus-20.svg" alt="" />
          </button>
        </div>

        <section className="camera-select-mask-grid" aria-label="PingMask 목록">
          {MASK_CARDS.map((card) => (
            <Link
              key={card.title}
              className="camera-select-mask-card"
              href={{
                pathname: "/camera/shot",
                query: { mask: card.title.toLowerCase() },
              }}
            >
              <img
                className="camera-select-mask-image"
                src={card.imageUrl}
                alt={`${card.title} mask`}
                style={{ objectPosition: card.objectPosition }}
              />
              <div className="camera-select-mask-overlay">
                <span className="camera-select-mask-label">{card.title}</span>
              </div>
            </Link>
          ))}
        </section>
      </main>
    </>
  );
}
