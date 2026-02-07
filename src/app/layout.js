import "./globals.css";
import { MiniKitProvider } from "@worldcoin/minikit-js/minikit-provider";
import AuthWrapper from "../components/AuthWrapper";
import VerifyWrapper from "../components/VerifyWrapper";

export default async function RootLayout({ children }) {
  return (
    <html lang="ko">
      <head>
        <script src="https://cdn.jsdelivr.net/npm/eruda"></script>
        <script>eruda.init();</script>
      </head>
      <body className="app-body">
        <MiniKitProvider props={{ appId: process.env.APP_ID }}>
          <AuthWrapper>
            <VerifyWrapper>
              {children}
            </VerifyWrapper>
          </AuthWrapper>
        </MiniKitProvider>
      </body>
    </html>
  );
}
