import React, { useEffect } from 'react';

export default function PingToast({ isVisible, onClose }) {
    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-start pt-[60px] bg-black/60 backdrop-blur-[2px] animate-in fade-in duration-200">
            {/* Toast Container */}
            <div className="w-[calc(100%-40px)] max-w-[335px] bg-[#1c1c1d] rounded-[8px] p-[12px] flex items-center justify-between shadow-lg border border-white/5">

                {/* Left Content */}
                <div className="flex items-center gap-[12px]">
                    {/* Logo Icon */}
                    <div className="w-[18px] h-[18px] flex items-center justify-center">
                        <img
                            src="/figma/Logo.png"
                            alt="Logo"
                            className="w-full h-full object-contain"
                        />
                    </div>
                    {/* Text */}
                    <p className="text-[12px] text-[#f9f9f9] font-medium leading-none">
                        Ping! 완료~ 오늘 1번까지 변경할 수 있어요.
                    </p>
                </div>

                {/* Cancel Button */}
                <button
                    onClick={onClose}
                    className="inline-flex items-center shrink-0 min-w-max"
                >
                    <span className="text-[12px] text-[#f9f9f9] font-medium leading-none whitespace-nowrap">
                        취소하기
                    </span>
                </button>
            </div>
        </div>
    );
}
