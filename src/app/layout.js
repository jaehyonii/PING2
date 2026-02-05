'use client';

import { useEffect, useState } from "react";
import "./globals.css";
import { MiniKitProvider } from "@worldcoin/minikit-js/minikit-provider";
import { MiniKit, VerifyCommandInput, VerificationLevel, ISuccessResult } from '@worldcoin/minikit-js'

const verifyPayload = { //: VerifyCommandInput
	action: 'login', // This is your action ID from the Developer Portal
	//signal: '0x12312', // Optional additional data
	verification_level: VerificationLevel.Device, // Orb | Device
}

const handleVerify = async () => {
	if (!MiniKit.isInstalled()) {
		return
	}
	// World App will open a drawer prompting the user to confirm the operation, promise is resolved once user confirms or cancels
	const { finalPayload } = await MiniKit.commandsAsync.verify(verifyPayload)
	if (finalPayload.status === 'error') {
		return console.log('Error payload', finalPayload)
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
	}
}


export default function RootLayout({ children }) {
	const [isVerified, setIsVerified] = useState(false);

	useEffect(() => {
		// Call the handleVerify function when the component mounts
		if (!isVerified)
			handleVerify().then(() => {
				setIsVerified(true);
			});
	}, []);

	return (
		<html lang="ko">
			<MiniKitProvider>
				<body className="app-body">
					{children}
				</body>
			</MiniKitProvider>
		</html>
	);
}
