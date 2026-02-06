'use client';

import { use, useEffect, useState } from "react";
import "./globals.css";
import { MiniKitProvider } from "@worldcoin/minikit-js/minikit-provider";
import { MiniKit, VerifyCommandInput, VerificationLevel, ISuccessResult } from '@worldcoin/minikit-js'

const signInWithWallet = async () => {
	if (!MiniKit.isInstalled()) {
		return
	}

	const res = await fetch(`/api/nonce`)
	const { nonce } = await res.json()

	const { commandPayload, finalPayload } = await MiniKit.commandsAsync.walletAuth({
		nonce: nonce,
		requestId: '0', // Optional
		expirationTime: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000),
		notBefore: new Date(new Date().getTime() - 24 * 60 * 60 * 1000),
		statement: 'This is my statement and here is a link https://worldcoin.com/apps',
	})

	if (finalPayload.status === 'error') {
		return
	} else {
		const response = await fetch('/api/complete-siwe', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				payload: finalPayload,
				nonce,
			}),
		})
	}
}

export default function RootLayout({ children }) {
	const [user, setUser] = useState(null);

	useEffect(() => {
		const script = document.createElement('script')
		script.src = 'https://cdn.jsdelivr.net/npm/eruda'
		script.onload = () => {
			window.eruda.init()
		}
		document.body.appendChild(script)
	}, [])

	useEffect(() => {
		signInWithWallet().then(() => {
			console.log('MiniKit.user:', MiniKit.user)  // 확인용
			setUser(MiniKit.user)
		}).catch((err) => {
			console.log('로그인 실패:', err)
		});
	}, []);

	return (
		<html lang="ko">
			<MiniKitProvider>
				<body className="app-body">
					{user ? (
						<>
							{children}
						</>
					) : (
						<main className="page">
							<section className="feed-status">로그인 하세요.</section>
						</main>
					)}
				</body>
			</MiniKitProvider>
		</html>
	);
}
