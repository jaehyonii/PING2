import React from 'react';

export default function StartScreen() {
    return (
        // 전체 화면 컨테이너: 높이를 화면 전체(h-screen)로 설정하고 배경색을 지정합니다.
        <div className="relative w-full h-screen overflow-hidden bg-[#121212]">
            {/*
        배경 그라데이션 수정:
        Figma 디자인에 맞춰 상단 Cyan(#00bfdc)에서 하단 Black(#121212)으로 떨어지는 그라데이션을 적용했습니다.
        - from-[#00bfdc]: 시작 색상 (Cyan)
        - to-[#121212]: 끝 색상 (Black)
        - bg-gradient-to-b: 위에서 아래로 그라데이션
      */}
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-[#00bfdc] to-[#121212]" />

            {/* 컨텐츠 컨테이너: 화면 중앙 정렬 */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                {/*
            로고 이미지:
            - 너비(w-[74px])와 높이(h-[98px])를 Figma 디자인 또는 사용자 요청에 맞춰 조정했습니다.
            - object-contain: 이미지 비율을 유지하며 컨테이너 안에 맞춤.
        */}
                <div className="relative">
                    <img
                        src="/figma/Logo.png"
                        alt="Ping Logo"
                        className="w-[74px] h-[98px] object-contain"
                    />
                </div>
            </div>
        </div>
    );
}
