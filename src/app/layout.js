'use client';

import { useEffect, useState } from "react";
import "./globals.css";
import { MiniKitProvider } from "@worldcoin/minikit-js/minikit-provider";
import { MiniKit, VerifyCommandInput, VerificationLevel, ISuccessResult } from '@worldcoin/minikit-js'
import { WalletAuthInput } from '@worldcoin/minikit-js'

const verifyPayload = { //: VerifyCommandInput
	action: 'login', // This is your action ID from the Developer Portal
	//signal: '0x12312', // Optional additional data
	verification_level: VerificationLevel.Device, // Orb | Device
}

const handleVerify = async () => {
	if (!MiniKit.isInstalled()) {
		return false
	}
	// World App will open a drawer prompting the user to confirm the operation, promise is resolved once user confirms or cancels
	const { finalPayload } = await MiniKit.commandsAsync.verify(verifyPayload)
	if (finalPayload.status === 'error') {
		console.log('Error payload', finalPayload)
		return false
	}

	// Verify the proof in the backend
	const verifyResponse = await fetch('/api/verify', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			payload: finalPayload, // as ISuccessResult, // Parses only the fields we need to verify
			action: 'login', // This is your action ID from the Developer Portal
			//signal: '0x12312', // Optional
		}),
	})

	// TODO: Handle Success!
	const verifyResponseJson = await verifyResponse.json()
	if (verifyResponseJson.status === 200) {
		console.log('Verification success!')
		return true
	}

	return false
}


export default function RootLayout({ children }) {
	const [status, setStatus] = useState('pending');

	useEffect(() => {
		let cancelled = false;

		const runVerify = async () => {
			const ok = await handleVerify();
			if (cancelled) return;
			setStatus(ok ? 'verified' : 'error');
		};

		if (status === 'pending') {
			runVerify();
		}

		return () => {
			cancelled = true;
		};
	}, []);

	return (
		<html lang="ko">
			<MiniKitProvider>
				<body className="app-body">
					{status === 'verified' ? (
						children
					) : status === 'error' ? (
						<main className="page">
							<section className="feed-status is-error" role="alert">
								인증에 실패했어요. 잠시 후 다시 시도해주세요.
							</section>
						</main>
					) : (
						<main className="page">
							<section className="feed-status" role="status" aria-live="polite">
								인증을 확인하고 있어요...
							</section>
						</main>
					)}
				</body>
			</MiniKitProvider>
		</html>
	);
}
