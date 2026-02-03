"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

const PAGE_SIZE = 3;
const DATA_URL = "/data/feed.json";

function getPage(allItems, pageNumber) {
  const start = (pageNumber - 1) * PAGE_SIZE;
  const end = start + PAGE_SIZE;
  return allItems.slice(start, end);
}

export default function Home() {
  const pathname = usePathname();
  const [allItems, setAllItems] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState("");
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
      const res = await fetch(DATA_URL, { signal: controller.signal });
      if (!res.ok) throw new Error("Failed to load feed");
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
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
    if (pathname === "/" && items.length === 0 && !loading) {
      fetchAll();
    }
  }, [pathname, items.length, loading, fetchAll]);

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
    <div className="home">
      <header className="home-header">
        <img className="logo" src="/figma/logo-ping.svg" alt="Ping!" />
        <button className="notify" type="button" aria-label="알림">
          <img src="/figma/icon-bell.svg" alt="" />
        </button>
      </header>

      <div className="home-tabs" role="tablist" aria-label="홈 탭">
        <button className="home-tab is-active" role="tab" aria-selected="true" type="button">
          탐색
        </button>
        <button className="home-tab" role="tab" aria-selected="false" type="button">
          친구들
        </button>
      </div>

      <section className="feed">
        {items.map((card) => (
          <article className="feed-card" key={`${card.id}-${card.image}`}>
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

      {loading && <p className="feed-status">불러오는 중...</p>}
      {!loading && !hasMore && <p className="feed-status">마지막 게시물입니다.</p>}
      {error && <p className="feed-status is-error">{error}</p>}
    </div>
  );
}
