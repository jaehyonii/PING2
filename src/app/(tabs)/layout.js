import Link from "next/link";

export default function TabsLayout({ children }) {
  return (
    <>
      <main className="page">{children}</main>
      <nav className="tabbar" aria-label="Primary">
        <Link href="/" className="tab">홈</Link>
        <Link href="/events" className="tab">이벤트</Link>
        <Link href="/camera" className="tab">카메라</Link>
        <Link href="/leaderboard" className="tab">리더보드</Link>
        <Link href="/profile" className="tab">프로필</Link>
      </nav>
    </>
  );
}
