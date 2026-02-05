"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  {
    href: "/",
    label: "홈",
    icon: "/figma/nav-home.svg",
  },
  {
    href: "/events",
    label: "이벤트",
    icon: "/figma/nav-events.svg",
  },
  {
    href: "/camera/shot",
    label: "카메라",
    icon: "/figma/nav-camera.svg",
    isCenter: true,
  },
  {
    href: "/leaderboard",
    label: "리더보드",
    icon: "/figma/nav-leaderboard.svg",
  },
  {
    href: "/profile",
    label: "프로필",
    icon: "/figma/nav-profile.png",
    isAvatar: true,
  },
];

export default function TabsLayout({ children }) {
  const pathname = usePathname();

  return (
    <>
      <main className="page">{children}</main>
      <nav className="tabbar" aria-label="Primary">
        {tabs.map((tab) => {
          const isActive = tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`tab ${tab.isCenter ? "tab-center" : ""} ${isActive ? "is-active" : ""}`}
              aria-current={isActive ? "page" : undefined}
            >
              {tab.isCenter ? (
                <span className="tab-center-icon">
                  <img src={tab.icon} alt="" />
                </span>
              ) : tab.isAvatar ? (
                <span className="tab-avatar">
                  <img src={tab.icon} alt="" />
                </span>
              ) : (
                <span className="tab-icon">
                  <img src={tab.icon} alt="" />
                </span>
              )}
              <span className="tab-label">{tab.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}

