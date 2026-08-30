import React, { useState } from 'react';
import { createWalletClient, custom, http } from 'viem';
import { mainnet } from 'viem/chains';
import { eip7702Actions } from 'viem/experimental';

// REPLACE THESE WITH YOUR ACTUAL CONTRACT ADDRESSES
const DELEGATOR_CONTRACT_ADDRESS = '0x0b9F19fB383C7570504Aa3Ecb539f79226F42358'; 
const TARGET_CONTRACT_ADDRESS = '0xEc853b1b57a076D83acF865AB535f632961eC03B';

export default function App() {
  const [account, setAccount] = useState(null);
  const [txHash, setTxHash] = useState('');
  const [status, setStatus] = useState('Disconnected');
  const [isProcessing, setIsProcessing] = useState(false);

  // Initialize Viem Client
  const getWalletClient = () => {
    if (!window.ethereum) throw new Error("No crypto wallet found!");
    return createWalletClient({
      chain: mainnet,
      transport: custom(window.ethereum)
    }).extend(eip7702Actions);
  };

  const connectWallet = async () => {
    try {
      const client = getWalletClient();
      const [address] = await client.requestAddresses();
      setAccount(address);
      setStatus('Connected via Trust Wallet / Web3');
    } catch (error) {
      console.error('Connection failed', error);
      setStatus('Failed to connect.');
    }
  };

  const executeDelegatedTransaction = async () => {
    if (!account) return;
    setIsProcessing(true);
    setStatus('Awaiting EIP-7702 Authorization Signature...');

    try {
      const client = getWalletClient();

      // 1. Prompt Trust Wallet to sign the authorization tuple
      const authorization = await client.signAuthorization({
        account,
        contractAddress: DELEGATOR_CONTRACT_ADDRESS,
      });

      setStatus('Authorization Signed! Broadcasting Type 4 Tx...');

      // 2. Submit the Type 4 Transaction
      const hash = await client.sendTransaction({
        account,
        to: TARGET_CONTRACT_ADDRESS, 
        data: '0x', // Replace with actual contract call data if needed
        authorizationList: [authorization], 
      });

      setTxHash(hash);
      setStatus('Transaction Successful!');
      
    } catch (error) {
      console.error('Transaction Failed', error);
      setStatus('Transaction Failed or Rejected.');
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
            Connect Trust Wallet
          </button>
        ) : (
          <div>
            <p style={styles.text}>Connected: {account.slice(0,6)}...{account.slice(-4)}</p>
            <button 
              onClick={executeDelegatedTransaction} 
              style={{...styles.button, opacity: isProcessing ? 0.7 : 1}}
              disabled={isProcessing}
            >
              {isProcessing ? 'Processing...' : 'Delegate & Execute Tx'}
            </button>
          </div>
        )}

        {txHash && (
          <div style={styles.successBox}>
            <p>✅ Success! Tx Hash:</p>
            <a href={`https://etherscan.io/tx/${txHash}`} target="_blank" rel="noreferrer" style={styles.link}>
              {txHash.slice(0,10)}...
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

// Simple Inline Styles
const styles = {
  container: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: 'system-ui' },
  card: { background: 'white', padding: '2rem', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', textAlign: 'center', maxWidth: '400px', width: '100%' },
  title: { margin: '0 0 1rem', fontSize: '1.5rem', color: '#333' },
  status: { color: '#666', marginBottom: '1.5rem', fontSize: '0.9rem' },
  text: { marginBottom: '1rem', color: '#333', fontWeight: '500' },
  button: { width: '100%', padding: '12px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', backgroundColor: '#0b55e6', color: 'white', border: 'none', borderRadius: '8px', transition: '0.2s' },
  successBox: { marginTop: '1.5rem', padding: '1rem', background: '#e6ffe6', borderRadius: '8px', color: '#006600' },
  link: { color: '#0b55e6', textDecoration: 'none', fontWeight: 'bold' }
};
