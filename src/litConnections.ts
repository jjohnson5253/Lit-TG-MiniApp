import { LitNodeClient } from '@lit-protocol/lit-node-client';
import { LitNetwork, AuthMethodScope } from '@lit-protocol/constants';
import { LitContracts } from '@lit-protocol/contracts-sdk';
import { litActionCode } from "./litAction";
import * as ethers from 'ethers';
import {
    LitAbility,
    LitPKPResource,
    LitActionResource,
  } from "@lit-protocol/auth-helpers";

export const connectToLitNodes = async () => {
    const litNodeClient = new LitNodeClient({
        litNetwork: LitNetwork.DatilDev,
        debug: false,
      });
    await litNodeClient.connect();
    return litNodeClient;
};

export const connectToLitContracts = async (provider: any) => {
    const ethersProvider = new ethers.providers.Web3Provider(provider as any);
    await provider.send("eth_requestAccounts", []);
    const newSigner = ethersProvider.getSigner();
    const litContracts = new LitContracts({
        signer: newSigner,
        network: LitNetwork.DatilDev,
    });
    await litContracts.connect();
    const pkp = (await litContracts.pkpNftContractUtils.write.mint()).pkp;
    litContracts.addPermittedAction({
        authMethodScopes: [AuthMethodScope.SignAnything],
        pkpTokenId: pkp.tokenId,
        ipfsId: "QmZfSBkbYZNFmX6yY3yFLiZUVb2DXutxJoq52aXHFBo3do"
    })
    return pkp;
};

export const getSessionSignatures = async (litNodeClient: LitNodeClient, pkp: any, telegramUser: any) => {
    console.log("Generating session signatures...");
    console.log("litNodeClient:", litNodeClient);
    console.log("pkp:", pkp);
    console.log("telegramUser:", telegramUser);
    const sessionSignatures= await litNodeClient.getPkpSessionSigs({
        pkpPublicKey: pkp.publicKey,
        litActionCode: Buffer.from(litActionCode).toString("base64"),
        jsParams: {
            telegramUserData: JSON.stringify(telegramUser),
            telegramBotSecret: process.env.VITE_TELEGRAM_BOT_TOKEN,
            pkpTokenId: pkp.tokenId,
          },
          resourceAbilityRequests: [
            {
              resource: new LitPKPResource("*"),
              ability: LitAbility.PKPSigning,
            },
            {
              resource: new LitActionResource("*"),
              ability: LitAbility.LitActionExecution,
            },
          ],
          expiration: new Date(Date.now() + 1000 * 60 * 10).toISOString(), // 10 minutes
        });
        console.log(
          `✅ Got PKP Session Sigs: ${JSON.stringify(sessionSignatures, null, 2)}`
        );
        return sessionSignatures;
};