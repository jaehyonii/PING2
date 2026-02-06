export default function RewardPage() {
  return (
    <section className="reward-page" aria-label="리워드">
      <h1 className="reward-title">Rewards</h1>
      <p className="reward-subtitle">Ping Point와 체인별 Airdrop을 확인하세요.</p>

      <div className="reward-section">
        <h2 className="reward-section-title">당신의 Ping Point</h2>
        <article className="reward-card" aria-label="Ping Point">
          <span className="reward-icon reward-icon-glow reward-icon-ping">
            <img src="/figma/reward/reward-ping-point-coin.png" alt="" />
          </span>
          <p className="reward-value">1,240P</p>
        </article>
      </div>

      <div className="reward-section">
        <h2 className="reward-section-title">당신의 World Coin 보유량</h2>
        <article className="reward-card" aria-label="World Coin">
          <span className="reward-icon reward-icon-glow reward-icon-worldcoin">
            <img src="/figma/reward/reward-worldcoin-coin.png" alt="" />
          </span>
          <p className="reward-value">1,240 WLD</p>
        </article>
      </div>
    </section>
  );
}
