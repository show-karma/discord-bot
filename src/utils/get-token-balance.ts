/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable no-console */
import KarmaBalanceCheckerABI from '../ABI/KarmaBalanceChecker.json';
import { ethers } from 'ethers';

export interface DelegatorInfo {
  [key: string]: number;
}

export default async function getTokenBalance(publicAddresses: string[], tokenAddress: string) {
  const provider = new ethers.providers.JsonRpcProvider(process.env.MAINNET_PROVIDER_URL);

  const splitSize = 2000;
  const contract = new ethers.Contract(
    '0x806f4fde35f4c6e09655FF9D17F9a5Af1b8bA5D1',
    KarmaBalanceCheckerABI,
    provider
  );

  if (!contract) return;
  const delegatorsBalances: DelegatorInfo = {};
  for (let i = 0; i < publicAddresses.length; i += splitSize) {
    const chunk = publicAddresses.slice(i, i + splitSize);
    try {
      const balances = await contract.bulkBalance(chunk, tokenAddress);
      chunk.forEach((addr, index) => {
        const amount = Number(ethers.utils.formatEther(balances[index]));
        if (amount > 0) {
          delegatorsBalances[addr] = amount;
        }
      });
    } catch (err) {
      console.error(`Failed to fetch delegators votes for token: ${tokenAddress}`, err);
    }
  }

  return delegatorsBalances;
}
