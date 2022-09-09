import { ethers } from 'ethers';

export class EthService {
  private mainnetProvider: ethers.providers.JsonRpcProvider;

  constructor(providerUrl = process.env.MAINNET_PROVIDER_URL) {
    this.mainnetProvider = new ethers.providers.JsonRpcProvider(providerUrl);
  }

  public async isValidNetwork(): Promise<boolean> {
    try {
      const { chainId } = await this.mainnetProvider.getNetwork();
      return !!chainId;
    } catch (err) {
      return false;
    }
  }

  private isEthAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/g.test(address);
  }

  private async getAddressIfIsEnsName(ensName: string): Promise<string | null> {
    if (!ensName.includes('.eth')) return null;
    try {
      return await this.mainnetProvider.resolveName(ensName);
    } catch (err) {
      return null;
    }
  }

  async checkIfAddressOrEnsNameIsValid(address: string): Promise<string> {
    const isEthAddress = this.isEthAddress(address);
    const addressForEnsName = await this.getAddressIfIsEnsName(address);

    const validAddressOrEnsAddress = isEthAddress ? address : addressForEnsName;

    if (!validAddressOrEnsAddress) {
      throw new Error('Invalid eth address or ens name');
    }

    return validAddressOrEnsAddress;
  }
}
