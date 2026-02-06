"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  {
    href: "/",
    label: "홈",
    icon: "/figma/nav/nav-home.svg",
    iconClass: "tab-icon-home",
  },
  {
    href: "/events/all",
    label: "이벤트",
    icon: "/figma/nav/nav-events.svg",
    iconClass: "tab-icon-events",
  },
  {
    href: "/camera/shot",
    label: "",
    icon: "/figma/nav/nav-camera.svg",
    iconClass: "tab-icon-camera",
    isCenter: true,
  },
  {
    href: "/reward",
    label: "리워드",
    icon: "/figma/nav/nav-reward.svg",
    iconClass: "tab-icon-reward",
  },
  {
    href: "/profile",
    label: "프로필",
    icon: "/figma/nav/nav-profile.png",
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
                  <img src={tab.icon} alt="" className={tab.iconClass} />
                </span>
              ) : tab.isAvatar ? (
                <span className="tab-avatar">
                  <img src={tab.icon} alt="" />
                </span>
              ) : (
                <span className="tab-icon">
                  <img src={tab.icon} alt="" className={tab.iconClass} />
                </span>
              )}
              {tab.label && <span className="tab-label">{tab.label}</span>}
            </Link>
          );
        })}
      </nav>
    </>
  );
}

