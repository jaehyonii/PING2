import Link from "next/link";

export default function EventDetailPage() {
  return (
    <section className="events-detail-page" aria-label="이벤트 상세">
      <div className="events-detail-bg-glow" aria-hidden="true">
        <img src="/figma/events/events-detail-bg-mask.png" alt="" />
      </div>

      <Link className="events-detail-back" href="/events/all" aria-label="이벤트 목록으로">
        <img src="/figma/events/icon-chevron-down-32.svg" alt="" />
      </Link>

      <img className="events-detail-logo" src="/figma/events/logo-ping.svg" alt="Ping" />

      <header className="events-detail-header">
        <p className="events-detail-tag">[MADS]</p>
        <h1 className="events-detail-title">광고 1회 보기</h1>
      </header>

      <div className="events-detail-chips" role="list" aria-label="이벤트 상태">
        <span className="events-detail-chip is-active" role="listitem">
          마감 D-3
        </span>
        <span className="events-detail-chip" role="listitem">
          상시 촬영
        </span>
        <span className="events-detail-chip" role="listitem">
          PingMask 필수
        </span>
      </div>

      <div className="events-detail-copy">
        <p className="events-detail-copy-title">광고 1회 시청 + MADS PingMask 한 장이면 끝.</p>
        <p className="events-detail-copy-body">광고 1회를 시청하고, MADS PingMask로 촬영 후 업로드하세요.</p>
      </div>

      <Link className="events-detail-cta" href="/camera/shot?mask=mads">
        Ping! 촬영하러 가기
      </Link>

      <section className="events-detail-rewards" aria-label="리워드">
        <p className="events-detail-section-kicker">Rewards</p>
        <div className="events-detail-rewards-grid">
          <div className="events-detail-reward-block">
            <p className="events-detail-reward-label">World Coin</p>
            <p className="events-detail-reward-value">+35WLD</p>
          </div>
          <div className="events-detail-reward-divider" aria-hidden="true" />
          <div className="events-detail-reward-block">
            <p className="events-detail-reward-label">Ping Point</p>
            <p className="events-detail-reward-value">+35P</p>
          </div>
        </div>
      </section>

      <section className="events-detail-miniapp" aria-label="MiniApp 정보">
        <p className="events-detail-miniapp-title">MiniApp 정보</p>
        <div className="events-detail-miniapp-head">
          <div className="events-detail-miniapp-main">
            <span className="events-detail-miniapp-icon">
              <img src="/figma/events/events-detail-miniapp-mads.png" alt="" />
            </span>
            <p>MADS</p>
          </div>
          <img className="events-detail-miniapp-next" src="/figma/events/icon-chevron-down-21.svg" alt="" />
        </div>
        <p className="events-detail-miniapp-body">
          하루에 한 번, MADS를 열고 광고 1개만 보면
          <br />
          무료 $MADS 토큰이 지갑으로 바로 지급됩니다.
        </p>
      </section>

      <section className="events-detail-examples" aria-label="예시">
        <div className="events-detail-examples-head">
          <p>다른 사람들은 이렇게도 했어요.</p>
          <img src="/figma/events/icon-plus-20.svg" alt="" />
        </div>
        <div className="events-detail-examples-track">
          <article className="events-detail-example-card">
            <img className="events-detail-example-image is-first" src="/figma/events/events-detail-example-main.png" alt="" />
          </article>
          <article className="events-detail-example-card">
            <img className="events-detail-example-image is-second" src="/figma/events/events-detail-example-main.png" alt="" />
          </article>
          <article className="events-detail-example-card">
            <img className="events-detail-example-image is-third" src="/figma/events/events-detail-example-main.png" alt="" />
          </article>
        </div>
      </section>

      <div className="events-detail-note">
        <p>검증 방식 : 광고 시청하기 + 실시간 촬영 + MADS 마스크 적용</p>
        <p>유의사항 : 스크린샷/갤러리 업로드 불가 (현장·조작 방지) / 중복 참여는 1일 1회만 인정</p>
      </div>
    </section>
  );
}
