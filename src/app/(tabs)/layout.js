"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import HomeIcon from "../../components/icons/HomeIcon";
import EventsIcon from "../../components/icons/EventsIcon";
import RewardIcon from "../../components/icons/RewardIcon";

const tabs = [
  {
    href: "/feed/all",
    label: "홈",
    Icon: HomeIcon,
    iconClass: "tab-icon-home",
  },
  {
    href: "/events/all",
    label: "이벤트",
    Icon: EventsIcon,
    iconClass: "tab-icon-events",
  },
  {
    href: "/camera/select",
    label: "",
    icon: "/figma/nav/nav-camera.svg",
    iconClass: "tab-icon-camera",
    isCenter: true,
  },
  {
    href: "/reward",
    label: "리워드",
    Icon: RewardIcon,
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
          const isActive =
            tab.href === "/"
              ? pathname === "/" || pathname.startsWith("/feed")
              : pathname.startsWith(tab.href);
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
                  {tab.Icon ? (
                    <tab.Icon isActive={isActive} className={tab.iconClass} />
                  ) : (
                    <img src={tab.icon} alt="" className={tab.iconClass} />
                  )}
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

