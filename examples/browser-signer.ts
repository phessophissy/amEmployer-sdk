import { ethers } from 'ethers';
import { AmEmployer } from '@phessophissy/amemployer-sdk';

declare global {
  interface Window {
    ethereum?: ethers.Eip1193Provider;
  }
}

export async function createBrowserSdk() {
  if (!window.ethereum) {
    throw new Error('No injected wallet provider found');
  }

  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();

  return new AmEmployer({
    signer,
    apiUrl: 'https://api.amemployer.xyz',
  });
}

export async function createTaskFromBrowser() {
  const sdk = await createBrowserSdk();

  await sdk.taskManager.approveToken();

  return sdk.taskManager.createTask(
    ethers.parseEther('10'),
    ethers.encodeBytes32String('metadata'),
    60 * 60,
  );
}
