import { useMemo } from 'react';
import { useAnchorWallet, useConnection } from '@solana/wallet-adapter-react';
import { AnchorProvider, Program, Idl, setProvider } from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';
import idl from '../idl/soldora.json';
import { Soldora } from '../types/soldora';

const PROGRAM_ID = new PublicKey(idl.address);

export const useSoldora = () => {
    const { connection } = useConnection();
    const wallet = useAnchorWallet();

    const provider = useMemo(() => {
        if (!wallet) return null;
        return new AnchorProvider(connection, wallet, {
            preflightCommitment: 'processed',
        });
    }, [connection, wallet]);

    const program = useMemo(() => {
        if (!provider) return null;
        setProvider(provider);
        return new Program(idl as unknown as Idl, provider) as unknown as Program<Soldora>;
    }, [provider]);

    return { program, provider, wallet, connection };
};
