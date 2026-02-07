import React from 'react';

export default function UploadSuccessModal({ isOpen, onConfirm, onClose }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="w-[320px] bg-[#1e1e1e] rounded-[15px] p-[24px] flex flex-col items-center text-center shadow-2xl animate-in fade-in zoom-in duration-200">

                {/* Title & Description */}
                <div className="flex flex-col gap-[8px] mb-[5px]">
                    <h2 className="text-[24px] font-bold text-white leading-tight pt-[8px]">
                        오늘의 Ping! 올리기 완료
                    </h2>
                    <p className="text-[14px] text-white">
                        Ping Point +25 / AirDrop Pool +1,000P<br />
                        흭득했어요
                    </p>
                </div>

                {/* Central Image with Glow */}
                <div className="relative w-[100px] h-[100px] mb-[5px] flex items-center justify-center">
                    {/* Glow Effect */}
                    <div className="absolute inset-0 bg-[#00bfdc] opacity-30 blur-[50px] rounded-full" />
                    <img
                        src="/ping-button.png"
                        alt="Ping Icon"
                        className="relative w-[120px] h-[120px] object-contain drop-shadow-[0_0_15px_rgba(0,191,220,0.5)]"
                    />
                </div>

                {/* Title & Description */}
                <div className="flex flex-col gap-[8px] mb-[8px]">
                    <p className="text-[12px] text-white pt-[8px]">
                        이벤트 미션은 집계 전까지 부스트 수가 숨겨져요. <br />
                        지금은 편하게 구경하고, 딱 한 번만 Ping!
                    </p>
                </div>

                {/* Confirm Button */}
                <button
                    onClick={onConfirm}
                    className="w-full h-[52px] bg-[#00bfdc] rounded-[16px] flex items-center justify-center mb-[5px] active:scale-95 transition-transform"
                >
                    <span className="text-[16px] font-bold text-white">피드 둘러보기</span>
                </button>

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="w-full h-[15px] flex items-center justify-center active:scale-95 transition-transform mt-[10px]"
                >
                    <span className="text-[14px] text-[#858585]">닫기</span>
                </button>

            </div>
        </div>
    );
}
