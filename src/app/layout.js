'use client';

import { useEffect } from "react";
import "./globals.css";
import { MiniKitProvider } from "@worldcoin/minikit-js/minikit-provider";
import AuthWrapper from "../components/AuthWrapper";

export default function RootLayout({ children }) {
	useEffect(() => {
		const script = document.createElement('script')
		script.src = 'https://cdn.jsdelivr.net/npm/eruda'
		script.onload = () => {
			window.eruda.init()
		}
		document.body.appendChild(script)
	}, [])

	return (
		<html lang="ko">
			<MiniKitProvider props={{ appId: process.env.NEXT_PUBLIC_APP_ID }}>
				<body className="app-body">
					<AuthWrapper>
						{children}
					</AuthWrapper>
				</body>
			</MiniKitProvider>
		</html>
	);
}
