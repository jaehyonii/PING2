import { NextRequest, NextResponse } from 'next/server'
import { verifyCloudProof, IVerifyResponse, ISuccessResult } from '@worldcoin/minikit-js'

// interface IRequestPayload {
// 	payload: ISuccessResult
// 	action: string
// 	signal: string | undefined
// }

export async function POST(req) {
	const { payload, action, signal } = await req.json();
	const app_id = process.env.APP_ID;
	const verifyRes = await verifyCloudProof(payload, app_id, action, signal); // Wrapper on this

	if (verifyRes.success) {
		// This is where you should perform backend actions if the verification succeeds
		// Such as, setting a user as "verified" in a database
		return NextResponse.json({ verifyRes, status: 200 })
	} else {
		// This is where you should handle errors from the World ID /verify endpoint.
		// Usually these errors are due to a user having already verified.
		return NextResponse.json({ verifyRes, status: 400 })
	}
}