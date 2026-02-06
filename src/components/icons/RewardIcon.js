import React from "react";

export default function RewardIcon({ isActive, className }) {
    const color = "#00BFDC";
    return (
        <svg
            width="100%"
            height="100%"
            viewBox="0 0 20 18"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            style={{ display: "block" }}
        >
            <path
                d="M1 6.5H4.5C4.77386 6.5 5 6.72614 5 7V17C5 17.2739 4.77386 17.5 4.5 17.5H1C0.726142 17.5 0.5 17.2739 0.5 17V7C0.5 6.72614 0.726142 6.5 1 6.5ZM8.25 0.5H11.75C12.0239 0.5 12.25 0.726142 12.25 1V17C12.25 17.2739 12.0239 17.5 11.75 17.5H8.25C7.97614 17.5 7.75 17.2739 7.75 17V1C7.75 0.726142 7.97614 0.5 8.25 0.5ZM15.5 8.5H19C19.2739 8.5 19.5 8.72614 19.5 9V17C19.5 17.2739 19.2739 17.5 19 17.5H15.5C15.2261 17.5 15 17.2739 15 17V9C15 8.72614 15.2261 8.5 15.5 8.5Z"
                fill={isActive ? color : "none"}
                stroke={isActive ? "none" : color}
                strokeWidth={isActive ? "0" : "1.5"}
            />
        </svg>
    );
}
