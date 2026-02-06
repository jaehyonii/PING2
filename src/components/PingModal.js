import React from 'react';

export default function PingModal({ isOpen, onClose, onConfirm }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="w-[320px] bg-[#1e1e1e] rounded-[15px] p-[24px] flex flex-col items-center text-center shadow-2xl animate-in fade-in zoom-in duration-200">

                {/* Title & Description */}
                <div className="flex flex-col gap-[8px] mb-[24px]">
                    <h2 className="text-[24px] font-bold text-white leading-tight pt-[8px]">
                        이 게시물에 Ping! 할까요?
                    </h2>
                    <p className="text-[14px] text-white">
                        이 게시물에는 지금 한 번만 Ping! 할 수 있어요.
                    </p>
                    <p className="text-[12px] text-[#F3F3F3] leading-relaxed">
                        Ping 수는 선정 전까지 비공개로 집계돼요.
                    </p>
                </div>

                {/* Central Image with Glow */}
                <div className="relative w-[100px] h-[100px] mb-[24px] flex items-center justify-center">
                    {/* Glow Effect */}
                    <div className="absolute inset-0 bg-[#00bfdc] opacity-30 blur-[50px] rounded-full" />
                    <img
                        src="/ping-button.png"
                        alt="Ping Icon"
                        className="relative w-[300px] h-[120px] object-contain drop-shadow-[0_0_15px_rgba(0,191,220,0.5)]"
                    />
                </div>

                {/* Confirm Button */}
                <button
                    onClick={onConfirm}
                    className="w-full h-[52px] bg-[#00bfdc] rounded-[16px] flex items-center justify-center mb-[12px] active:scale-95 transition-transform"
                >
                    <span className="text-[16px] font-bold text-white">Ping! 보내기</span>
                </button>

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="text-[14px] text-[#a3a3a3] font-medium py-[8px] px-[16px]"
                >
                    닫기
                </button>

                {/* Footer Note */}
                <p className="mt-[16px] text-[12px] text-[#F3F3F3]">
                    내 Ping은 하루 1번까지 수정할 수 있어요.
                </p>
            </div>
        </div>
    );
}
