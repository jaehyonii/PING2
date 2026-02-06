import "./globals.css";
import { MiniKitProvider } from "@worldcoin/minikit-js/minikit-provider";
import AuthWrapper from "../components/AuthWrapper";

export default async function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body className="app-body">
        <MiniKitProvider props={{ appId: process.env.APP_ID }}>
          <AuthWrapper>{children}</AuthWrapper>
        </MiniKitProvider>
      </body>
    </html>
  );
}
