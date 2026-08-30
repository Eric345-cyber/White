import React, { useState } from 'react';
import { createWalletClient, custom } from 'viem';
import { mainnet } from 'viem/chains';

const TARGET_CONTRACT_ADDRESS = '0x0000000000000000000000000000000000000002';

export default function App() {
  const [account, setAccount] = useState(null);
  const [txHash, setTxHash] = useState('');
  const [status, setStatus] = useState('Disconnected');
  const [isProcessing, setIsProcessing] = useState(false);
  const [debugMsg, setDebugMsg] = useState('');

  const getWalletClient = () => {
    if (!window.ethereum) throw new Error("No crypto wallet found!");
    return createWalletClient({
      chain: mainnet,
      transport: custom(window.ethereum)
    });
  };

  const connectWallet = async () => {
    setDebugMsg('');
    try {
      const client = getWalletClient();
      const [address] = await client.requestAddresses();
      setAccount(address);
      setStatus('Connected via Web3');
    } catch (error) {
      setDebugMsg(error?.message || String(error));
      setStatus('Failed to connect.');
    }
  };

  const executeBatchedTransaction = async () => {
    if (!account) return;
    setIsProcessing(true);
    setDebugMsg(''); 
    setStatus('Sending Batch Request to Wallet...');

    try {
      const client = getWalletClient();

      // Send a batched transaction request (EIP-5792)
      // This triggers Trust Wallet's internal EIP-7702 (FlexGas / Smart Account) UI
      const bundleId = await client.request({
        method: 'wallet_sendCalls',
        params: [{
          version: '1.0',
          chainId: '0x1', // Mainnet Hex
          from: account,
          calls: [
            { to: TARGET_CONTRACT_ADDRESS, data: '0x' },
            { to: TARGET_CONTRACT_ADDRESS, data: '0x' } // Batching 2 calls together
          ]
        }]
      });

      setTxHash(bundleId);
      setStatus('Batch Transaction Successful!');
      
    } catch (error) {
      console.error('Transaction Failed', error);
      setStatus('Transaction Failed or Rejected.');
      setDebugMsg(error?.message || String(error)); 
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>EIP-7702 Trust Wallet Dapp</h1>
        <p style={styles.status}>Status: <strong>{status}</strong></p>
        
        {!account ? (
          <button onClick={connectWallet} style={styles.button}>
            Connect Wallet
          </button>
        ) : (
          <div>
            <p style={styles.text}>Connected: {account.slice(0,6)}...{account.slice(-4)}</p>
            <button 
              onClick={executeBatchedTransaction} 
              style={{...styles.button, opacity: isProcessing ? 0.7 : 1}}
              disabled={isProcessing}
            >
              {isProcessing ? 'Processing...' : 'Execute Batched Tx'}
            </button>
          </div>
        )}

        {debugMsg && (
          <div style={styles.errorBox}>
            <p style={{ margin: 0, fontWeight: 'bold' }}>⚠️ Error Output:</p>
            <pre style={styles.debugText}>{debugMsg}</pre>
          </div>
        )}

        {txHash && (
          <div style={styles.successBox}>
            <p>✅ Success! Bundle ID:</p>
            <p style={{ fontSize: '0.8rem', wordBreak: 'break-all' }}>{txHash}</p>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', fontFamily: 'system-ui', backgroundColor: '#f4f6f8', padding: '1rem' },
  card: { background: 'white', padding: '2rem', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', textAlign: 'center', maxWidth: '400px', width: '100%', boxSizing: 'border-box' },
  title: { margin: '0 0 1rem', fontSize: '1.5rem', color: '#333' },
  status: { color: '#666', marginBottom: '1.5rem', fontSize: '0.9rem' },
  text: { marginBottom: '1rem', color: '#333', fontWeight: '500' },
  button: { width: '100%', padding: '12px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', backgroundColor: '#0b55e6', color: 'white', border: 'none', borderRadius: '8px', transition: '0.2s' },
  successBox: { marginTop: '1.5rem', padding: '1rem', background: '#e6ffe6', borderRadius: '8px', color: '#006600', wordBreak: 'break-all' },
  errorBox: { marginTop: '1.5rem', padding: '1rem', background: '#ffe6e6', borderRadius: '8px', color: '#cc0000', textAlign: 'left', overflowX: 'auto' },
  debugText: { fontSize: '0.8rem', whiteSpace: 'pre-wrap', wordBreak: 'break-word', marginTop: '0.5rem', color: '#990000' }
};
