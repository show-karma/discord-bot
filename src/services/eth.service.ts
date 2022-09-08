import { ethers } from 'ethers';

export class EthService {
  private mainnetProvider: ethers.providers.JsonRpcProvider;

  constructor() {
    this.mainnetProvider = new ethers.providers.JsonRpcProvider(process.env.MAINNET_PROVIDER_URL);
  }

  private isEthAddress(address: string) {
    return /^0x[a-fA-F0-9]{40}$/g.test(address) ? address : false;
  }

  private async getAddressIfIsEnsName(ensName: string) {
    if (!ensName.includes('.eth')) return false;

    try {
      return await this.mainnetProvider.resolveName(ensName);
    } catch (err) {
      return false;
    }
  }

  async checkIfAddressOrEnsNameIsValid(address: string) {
    const isEthAddress = this.isEthAddress(address);
    const addressForEnsName = await this.getAddressIfIsEnsName(address);

    return isEthAddress || addressForEnsName;
  }
}
