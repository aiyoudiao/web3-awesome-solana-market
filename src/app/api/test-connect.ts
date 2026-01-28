import { Connection, clusterApiUrl } from '@solana/web3.js';

async function checkConnection(): Promise<void> {
    // Connect to Devnet
    const connection = new Connection("http://127.0.0.1:8899", 'confirmed');

    // Get the version of the Solana cluster
    const version = await connection.getVersion();
    console.log('Solana Cluster Version:', version);

    // Get the latest block height
    const slot = await connection.getSlot();
    console.log('Current Slot:', slot);
}

checkConnection().catch((error: Error) => console.error(error));