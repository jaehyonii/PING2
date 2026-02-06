import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import {
  MiniAppWalletAuthSuccessPayload,
  verifySiweMessage,
} from "@worldcoin/minikit-js";

interface IRequestPayload {
  payload: MiniAppWalletAuthSuccessPayload;
  nonce: string;
}

export const POST = async (req: NextRequest) => {
  const { payload, nonce } = (await req.json()) as IRequestPayload;
  // Next.js 15+
  const cookieStore = await cookies();
  const siweValue = cookieStore.get("siwe")?.value;
  if (nonce != siweValue) {
    return NextResponse.json({
      status: "error",
      isValid: false,
      message: "Invalid nonce",
    });
  }
  try {
    const validMessage = await verifySiweMessage(payload, nonce);
    return NextResponse.json({
      status: "success",
      isValid: validMessage.isValid,
    });
  } catch (error: any) {
    // Handle errors in validation or processing
    return NextResponse.json({
      status: "error",
      isValid: false,
      message: error.message,
    });
  }
};