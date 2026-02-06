"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import PingModal from "../../../../../components/PingModal";
import PingToast from "../../../../../components/PingToast";

const DATA_URL = "/data/feed.json";

export default function FeedDetailPage() {
    const params = useParams();
    const { id } = params;
    const [feedItem, setFeedItem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isPingModalOpen, setIsPingModalOpen] = useState(false);
    const [showPingToast, setShowPingToast] = useState(false);

    useEffect(() => {
        async function fetchFeed() {
            try {
                const res = await fetch(DATA_URL);
                if (!res.ok) throw new Error("Failed to load feed");
                const data = await res.json();
                const item = data.find((i) => i.id === parseInt(id));
                setFeedItem(item);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }

        if (id) {
            fetchFeed();
        }
    }, [id]);

    if (loading) return <div className="text-white text-center mt-10">Loading...</div>;
    if (!feedItem) return <div className="text-white text-center mt-10">Feed not found</div>;

    return (
        <div className="bg-[#121212] relative w-full h-100vh min-h-screen flex flex-col items-center">

            {/* Header - In Flow */}
            <div className="w-full max-w-[375px] px-[20px] pt-[5px] pb-[20px] flex items-center justify-between z-20">
                <Link href="/feed/all" className="flex items-center justify-center">
                    <img src="/figma/back.svg" alt="Back" className="w-[24px] h-[24px]" />
                </Link>

                {/* User Info - Moved to Header */}
                <div className="flex items-center gap-[10px]">
                    <div className="w-[34px] h-[34px] bg-[#d9d9d9] rounded-full overflow-hidden border border-white/20">
                        <img src={feedItem.avatar} alt={feedItem.user} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[16px] font-medium text-white drop-shadow-md leading-[1.2]">{feedItem.user}</span>
                        <span className="text-[12px] font-light text-white/80 drop-shadow-md leading-[1.2]">{feedItem.meta}</span>
                    </div>
                </div>

                <button className="w-[26px] h-[26px] flex items-center justify-center">
                    <img src="/figma/home/icon-meatball.svg" alt="More" className="w-full h-full" />
                </button>
            </div>

            {/* Main Content Area (Matches Feed Card Layout) */}
            <div className="relative w-full max-w-[375px] aspect-[375/420]">
                {/* Main Image */}
                <img
                    src={feedItem.image}
                    alt="Main Feed"
                    className="w-full h-full object-cover"
                />

                {/* Selfie Overlay - Moved to Top Left */}
                <div className="absolute top-[20px] left-[20px] w-[90px] h-[120px] rounded-[15px] overflow-hidden border-[2px] border-black shadow-lg">
                    <img src={feedItem.overlay} alt="Overlay" className="w-full h-full object-cover" />
                </div>

                {/* Title Section - Moved Inside Image Area (Bottom) */}
                <div className="absolute bottom-[20px] left-[20px] flex flex-col items-start gap-[4px] z-10">
                    <span className="text-[16px] font-bold text-[#00bfdc] drop-shadow-md">Today’s Ping!</span>
                    <div className="text-[20px] font-semibold text-[#f9f9f9] drop-shadow-md">
                        <p>World Build Korea Hackathon</p>
                        <p>현장 배경이 보이게 찍기 🚀</p>
                    </div>
                </div>

                {/* Gradient for text readability with Blur */}
                <div
                    className="absolute bottom-0 left-0 right-0 h-[150px] bg-gradient-to-t from-black/60 to-transparent backdrop-blur-[10px] pointer-events-none"
                    style={{
                        maskImage: "linear-gradient(to top, black, transparent)",
                        WebkitMaskImage: "linear-gradient(to top, black, transparent)"
                    }}
                />
            </div>


            {/* Content Below Image */}
            <div className="w-full max-w-[375px] px-[20px] mt-[24px] flex flex-col gap-[30px] flex-1">

                {/* Comment Section (Placeholder) */}
                <div className="flex flex-col gap-[6px]">
                    <div className="flex items-center gap-[6px] text-[12px] font-light">
                        <span className="text-[#a3a3a3]">Hackathon Sprint Mission · World</span>
                        <span className="text-[#00bfdc]">나도 Ping! 올리기</span>
                    </div>

                    <div className="flex items-start justify-between">
                        <p className="text-[14px] font-medium text-[#f9f9f9]">
                            해커톤 준비 인증!<br />
                            오늘은 World와 함께 Ping 남깁니다. 🔥
                        </p>
                        <button className="w-[30px] h-[30px] flex-shrink-0 ml-[10px]">
                            <img src="/figma/comment.svg" alt="Comment" className="w-full h-full" />
                        </button>
                    </div>
                </div>

                {/* Ping Button - In Flow full width */}
                <div className="flex justify-center w-full mb-0">
                    <button
                        onClick={() => setIsPingModalOpen(true)}
                        className="flex items-center justify-center w-full h-[52px] px-[24px] rounded-[15px] bg-[#00bfdc] shadow-lg active:scale-95 transition-transform"
                    >
                        <img src="/ping-button.png" alt="" className="w-[36px] h-[36px] object-contain" />
                        <span className="text-[16px] font-semibold text-[#f3f3f3] whitespace-nowrap">Ping! 보내기</span>
                    </button>
                </div>
            </div>

            {/* Ping Modal */}
            <PingModal
                isOpen={isPingModalOpen}
                onClose={() => setIsPingModalOpen(false)}
                onConfirm={() => {
                    console.log(`Ping sent to ${id}`);
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
        </div>
    );
}
