import React, { useState } from 'react';
import { createWeb3Modal } from '@web3modal/wagmi/react';
import { defaultWagmiConfig } from '@web3modal/wagmi/react/config';
import { WagmiProvider, useAccount } from 'wagmi';
import { mainnet } from 'wagmi/chains';
import { useSendCalls } from 'wagmi/experimental';

// 1. Get a Project ID at https://cloud.walletconnect.com
const projectId = '02e24ecc14c12e9d6cfe347f5ae22e78'; // Demo ID

// 2. Create Wagmi Config with WalletConnect enabled
const metadata = {
  name: 'EIP-7702 Dapp',
  description: 'Testing Trust Wallet EIP-7702',
  url: 'https://railway.app', 
  icons: ['https://avatars.githubusercontent.com/u/37784886']
};

const config = defaultWagmiConfig({
  chains: [mainnet],
  projectId,
  metadata,
});

// 3. Initialize Web3Modal
createWeb3Modal({
  wagmiConfig: config,
  projectId,
  enableAnalytics: true, 
});

const TARGET_CONTRACT_ADDRESS = '0x0000000000000000000000000000000000000002';

// 4. The Core UI Component
function DappUI() {
  const { address, isConnected } = useAccount();
  const { sendCalls, isPending, isError, error, data: bundleId } = useSendCalls();
  const [debugMsg, setDebugMsg] = useState('');

  const executeBatchedTransaction = () => {
    setDebugMsg('');
    try {
      sendCalls({
        calls: [
          // FIX 1: Provide "0x00" instead of "0x" to satisfy Viem's strict hex regex
          { to: TARGET_CONTRACT_ADDRESS, data: '0x00', value: 0n },
          { to: TARGET_CONTRACT_ADDRESS, data: '0x00', value: 0n }
        ],
        // FIX 2: Explicitly define atomicRequired to satisfy Viem's boolean check
        atomicRequired: true, 
      });
    } catch (err) {
      setDebugMsg(err?.message || String(err));
    }
  };

  return (
    <div style={styles.card}>
      <h1 style={styles.title}>EIP-7702 Trust Wallet Dapp</h1>
      
      {!isConnected ? (
        <w3m-button /> 
      ) : (
        <div style={{ marginTop: '20px' }}>
          <w3m-button />
          <div style={{ margin: '20px 0' }}>
            <button 
              onClick={executeBatchedTransaction} 
              style={{...styles.button, opacity: isPending ? 0.7 : 1}}
              disabled={isPending}
            >
              {isPending ? 'Sending to WalletConnect...' : 'Execute Batched Tx'}
            </button>
          </div>
        </div>
      )}

      {(isError || debugMsg) && (
        <div style={styles.errorBox}>
          <p style={{ margin: 0, fontWeight: 'bold' }}>⚠️ Error Output:</p>
          <pre style={styles.debugText}>
            {debugMsg || error?.message}
          </pre>
        </div>
      )}

      {bundleId && (
        <div style={styles.successBox}>
          <p>✅ Success! Bundle ID:</p>
          <p style={{ fontSize: '0.8rem', wordBreak: 'break-all' }}>{bundleId}</p>
        </div>
      )}
    </div>
  );
}

// 5. Wrap the App in WagmiProvider
export default function App() {
  return (
    <WagmiProvider config={config}>
      <div style={styles.container}>
        <DappUI />
      </div>
    </WagmiProvider>
  );
}

const styles = {
  container: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', fontFamily: 'system-ui', backgroundColor: '#f4f6f8', padding: '1rem' },
  card: { background: 'white', padding: '2rem', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', textAlign: 'center', maxWidth: '400px', width: '100%', boxSizing: 'border-box' },
  title: { margin: '0 0 1rem', fontSize: '1.5rem', color: '#333' },
  button: { width: '100%', padding: '12px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', backgroundColor: '#0b55e6', color: 'white', border: 'none', borderRadius: '8px', transition: '0.2s' },
  successBox: { marginTop: '1.5rem', padding: '1rem', background: '#e6ffe6', borderRadius: '8px', color: '#006600', wordBreak: 'break-all' },
  errorBox: { marginTop: '1.5rem', padding: '1rem', background: '#ffe6e6', borderRadius: '8px', color: '#cc0000', textAlign: 'left', overflowX: 'auto' },
  debugText: { fontSize: '0.8rem', whiteSpace: 'pre-wrap', wordBreak: 'break-word', marginTop: '0.5rem', color: '#990000' }
};
