export const arcTestnet = {
  chainId: 5_042_002,
  circleBlockchain: 'ARC-TESTNET',
  explorerUrl: 'https://testnet.arcscan.app',
  nativeCurrency: {
    decimals: 18,
    symbol: 'USDC',
  },
  rpcUrl: 'https://rpc.testnet.arc.network',
  usdc: {
    address: '0x3600000000000000000000000000000000000000',
    decimals: 6,
  },
} as const;
