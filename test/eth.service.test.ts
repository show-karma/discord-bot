import 'dotenv/config';
import { EthService } from '../src/services/eth.service';

describe('ETH service', () => {
  describe('ETH - mainnet provider', () => {
    it(`Should connect`, async () => {
      const ethService = new EthService();
      expect(await ethService.isValidNetwork()).toBe(true);
    });

    it(`Should connect`, async () => {
      const ethService = new EthService('121fakeRpcdata131');
      expect(await ethService.isValidNetwork()).toBe(false);
    });
  });

  describe('ETH - address and ens name validation', () => {
    jest.setTimeout(30000);
    it(`Valid public address`, async () => {
      const ethService = new EthService();
      expect(
        await ethService.checkIfAddressOrEnsNameIsValid(
          '0xDA97C8739DE1e4b6Bc2560B6795Ac7a1a080C32a'
        )
      ).toBe('0xDA97C8739DE1e4b6Bc2560B6795Ac7a1a080C32a');
    });

    it(`Invalid public address`, async () => {
      try {
        const ethService = new EthService();
        await ethService.checkIfAddressOrEnsNameIsValid(
          '0xDA97C8739DE1e4b6Bc2560222B6795Ac7a1a080C32a'
        );
      } catch (err) {
        expect(err.message).toBe('Invalid eth address or ens name');
      }
    });

    it(`Valid ens name`, async () => {
      const ethService = new EthService();
      expect(await ethService.checkIfAddressOrEnsNameIsValid('artu1.eth')).toBe(
        '0xDA97C8739DE1e4b6Bc2560B6795Ac7a1a080C32a'
      );
    });

    it(`Invalid ens name `, async () => {
      try {
        const ethService = new EthService();
        await ethService.checkIfAddressOrEnsNameIsValid('invalidEnsName.eth');
      } catch (err) {
        expect(err.message).toBe('Invalid eth address or ens name');
      }
    });

    it(`Invalid ens name - without .eth extension`, async () => {
      try {
        const ethService = new EthService();
        await ethService.checkIfAddressOrEnsNameIsValid('invalidEnsName');
      } catch (err) {
        expect(err.message).toBe('Invalid eth address or ens name');
      }
    });
  });
});
