import { useCallback, useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import bs58 from 'bs58';

export function useAuth() {
    const { publicKey, signMessage } = useWallet();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [token, setToken] = useState<string | null>(null);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const storedToken = localStorage.getItem('token');
            if (storedToken) {
                setToken(storedToken);
            }
        }
    }, []);

    useEffect(() => {
        if (token) {
            setIsAuthenticated(true);
        }
    }, [token]);

    const login = useCallback(async () => {
        if (!publicKey || !signMessage) throw new Error("Wallet not connected");

        try {
            // 1. Get Nonce
            const nonceRes = await fetch('/api/auth/nonce');
            const { data: { nonce } } = await nonceRes.json();

            // 2. Sign Message
            const message = new TextEncoder().encode(nonce);
            const signature = await signMessage(message);

            // 3. Login
            const loginRes = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    walletAddress: publicKey.toString(),
                    signature: bs58.encode(signature),
                    message: nonce
                })
            });

            const { data } = await loginRes.json();
            
            // 4. Save Session
            localStorage.setItem('token', data.token);
            setToken(data.token);
            setIsAuthenticated(true);
            
            return data.user;
        } catch (err) {
            console.error("Login failed:", err);
            throw err;
        }
    }, [publicKey, signMessage]);

    const logout = useCallback(() => {
        localStorage.removeItem('token');
        setToken(null);
        setIsAuthenticated(false);
    }, []);

    return { isAuthenticated, login, logout, token };
}
