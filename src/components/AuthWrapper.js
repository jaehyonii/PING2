'use client';

import { useEffect, useState } from "react";
import { MiniKit } from '@worldcoin/minikit-js';
import { useMiniKit } from "@worldcoin/minikit-js/minikit-provider";
import StartScreen from "./StartScreen";

const signInWithWallet = async () => {
    // MiniKit.isInstalled() check is handled by the hook in the component, 
    // but the function itself still can check it or assume it's called when ready.
    if (!MiniKit.isInstalled()) {
        console.error("MiniKit not installed");
        return;
    }

    try {
        const res = await fetch(`/api/nonce`);
        const { nonce } = await res.json();

        const { commandPayload, finalPayload } = await MiniKit.commandsAsync.walletAuth({
            nonce: nonce,
            requestId: '0', // Optional
            expirationTime: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000),
            notBefore: new Date(new Date().getTime() - 24 * 60 * 60 * 1000),
            statement: 'This is my statement and here is a link https://worldcoin.com/apps',
        });

        if (finalPayload.status === 'error') {
            console.error("Wallet auth failed", finalPayload);
            return;
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
            });
            // You might want to handle the response here
        }
    } catch (error) {
        console.error("Error during sign in:", error);
    }
};

export default function AuthWrapper({ children }) {
    const { isInstalled } = useMiniKit();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [showStartScreen, setShowStartScreen] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setShowStartScreen(false);
        }, 3000);

        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        // Only attempt sign in after StartScreen is finished and MiniKit is installed
        if (!showStartScreen && isInstalled) {
            signInWithWallet().then(() => {
                if (MiniKit.user) {
                    setIsAuthenticated(true);
                }
            }).catch((err) => {
                console.log('로그인 실패:', err);
            });
        }
    }, [isInstalled, showStartScreen]);

    if (showStartScreen) {
        return <StartScreen />; // Import this component at the top
    }

    if (!isInstalled) {
        // Still initializing or not in Mini App
        return (
            <main className="page">
                {/* Optional: Show loading or specific message if not in Mini App */}
                <section className="feed-status">MiniKit Loading...</section>
            </main>
        );
    }

    return (
        <>
            {isAuthenticated ? (
                children
            ) : (
                <main className="page">
                    <section className="feed-status">로그인 하세요.</section>
                </main>
            )}
        </>
    );
}
