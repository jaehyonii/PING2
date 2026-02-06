import Link from "next/link";

const MASK_CARDS = [
  {
    title: "MADS",
    imageUrl: "/figma/camera/select/05c278ab1866558209b2cada594f61d1b1fff129.png",
    objectPosition: "left center",
  },
  {
    title: "Credits",
    imageUrl: "/figma/camera/select/f4e8e03800d65093c8a9425fa4cc021458e16688.png",
    objectPosition: "center top",
  },
  {
    title: "Worldcoin",
    imageUrl: "/figma/camera/select/2dfb4854b0f211c6fbd6e2e6cc074a8ac3835929.png",
    objectPosition: "center top",
  },
  {
    title: "Gift Card",
    imageUrl: "/figma/camera/select/96a3939155d33d69e6abd21ce17e510018e15c15.png",
    objectPosition: "left center",
  },
  {
    title: "Deals",
    imageUrl: "/figma/camera/select/85bc5ea1515cf999e4fd7a3a503351db207e5b66.png",
    objectPosition: "center top",
  },
  {
    title: "Uno",
    imageUrl: "/figma/camera/select/3fc452dab33006dc0a8fa1b673cfa8cbd4d354d4.png",
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
          <span>체인을 검색하세요!</span>
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
