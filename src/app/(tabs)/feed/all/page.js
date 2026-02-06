"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import PingModal from "../../../../components/PingModal";
import PingToast from "../../../../components/PingToast";

const PAGE_SIZE = 3;
const DATA_URL = "/api/feeds";

function getPage(allItems, pageNumber) {
  const start = (pageNumber - 1) * PAGE_SIZE;
  const end = start + PAGE_SIZE;
  return allItems.slice(start, end);
}

export default function FeedAllPage() {
  const pathname = usePathname();
  const [allItems, setAllItems] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState("");
  const [isPingModalOpen, setIsPingModalOpen] = useState(false);
  const [showPingToast, setShowPingToast] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  const pageRef = useRef(1);
  const loadingRef = useRef(false);
  const abortRef = useRef(null);

  const fetchAll = useCallback(async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    setError("");

    if (abortRef.current) {
      abortRef.current.abort();
    }
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      // Cache busting using timestamp to ensure fresh data after login
      const res = await fetch(`${DATA_URL}?t=${Date.now()}`, { signal: controller.signal });
      if (!res.ok) throw new Error("Failed to load feed");
      const data = await res.json();
      const list = Array.isArray(data?.feeds) ? data.feeds : [];
      setAllItems(list);

      const firstPage = getPage(list, 1);
      setItems(firstPage);
      setHasMore(list.length > firstPage.length);
      pageRef.current = 2;
    } catch (err) {
      if (err?.name !== "AbortError") {
        setError("피드를 불러오지 못했습니다.");
      }
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, []);

  const loadMore = useCallback(() => {
    if (loadingRef.current || !hasMore) return;
    loadingRef.current = true;
    setLoading(true);

    const nextPageItems = getPage(allItems, pageRef.current);
    setItems((prev) => [...prev, ...nextPageItems]);
    pageRef.current += 1;
    setHasMore(allItems.length > (pageRef.current - 1) * PAGE_SIZE);

    loadingRef.current = false;
    setLoading(false);
  }, [allItems, hasMore]);

  useEffect(() => {
    fetchAll();
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, [fetchAll]);

  useEffect(() => {
    if (items.length === 0 && !loading) {
      fetchAll();
    }
  }, [items.length, loading, fetchAll]);


  useEffect(() => {
    function onScroll() {
      if (loadingRef.current || !hasMore) return;
      const scrollPosition = window.innerHeight + window.scrollY;
      const threshold = document.documentElement.scrollHeight - 200;
      if (scrollPosition >= threshold) {
        loadMore();
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [loadMore, hasMore]);

  return (
    <div className="home home-screen">
      <div className="home-tabs" role="tablist" aria-label="홈 탭">
        <button className="home-tab is-active" role="tab" aria-selected="true" type="button">
          탐색
        </button>
        <button className="home-tab" role="tab" aria-selected="false" type="button">
          친구들
        </button>
        <button className="notify" type="button" aria-label="알림">
          <img src="/figma/home/icon-bell.svg" alt="" />
        </button>
      </div>

      <section className="feed">
        {items.map((card) => (
          <Link
            href={`/feed/detail/${encodeURIComponent(card.id)}`}
            key={`${card.id}-${card.image}`}
            className="block"
          >
            <article className="feed-card">
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
                  <img src="/figma/home/icon-meatball.svg" alt="" />
                </button>
              </header>
              <div className="card-image">
                <img src={card.image} alt="" />
                <div className="card-overlay">
                  <img src={card.overlay} alt="" />
                </div>
                <button
                  className="ping-button"
                  type="button"
                  aria-label="핑 보내기"
                  onClick={(e) => {
                    e.preventDefault(); // Prevent Link navigation
                    e.stopPropagation();
                    setSelectedId(card.id);
                    setIsPingModalOpen(true);
                  }}
                >
                  <span className="ping-glow" aria-hidden="true">
                    <img src="/figma/home/ping-glow.svg" alt="" />
                  </span>
                  <span className="ping-core">
                    <img src="/figma/home/ping-core.png" alt="" />
                  </span>
                </button>
              </div>
            </article>
          </Link>
        ))}
      </section>

      {/* Ping Modal */}
      <PingModal
        isOpen={isPingModalOpen}
        onClose={() => setIsPingModalOpen(false)}
        onConfirm={() => {
          console.log(`Ping sent to ${selectedId}`);
          setIsPingModalOpen(false);
          setShowPingToast(true);
          setTimeout(() => setShowPingToast(false), 3000);
        }}
      />

      {/* Ping Toast */}
      <PingToast
        isVisible={showPingToast}
        onClose={() => setShowPingToast(false)}
      />

      {loading && <p className="feed-status">불러오는 중...</p>}
      {!loading && !hasMore && <p className="feed-status">마지막 게시물입니다.</p>}
      {error && <p className="feed-status is-error">{error}</p>}
    </div>
  );


}
