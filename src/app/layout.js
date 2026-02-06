import "./globals.css";
import { MiniKitProvider } from "@worldcoin/minikit-js/minikit-provider";
import AuthWrapper from "../components/AuthWrapper";

export default function RootLayout({ children }) {

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
