import "dotenv/config"

import { Ed25519Keypair  } from "@mysten/sui.js/keypairs/ed25519";
import { fromB64 } from "@mysten/sui.js/utils";

import { execSync } from "child_process";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import { TransactionBlock } from "@mysten/sui.js/transactions";
import { SuiClient } from "@mysten/sui.js/client";
import { writeFileSync, mkdirSync } from "fs";
import { v4 as uuidv4 } from "uuid";
const getMoveCode = (amount, name, ticker, description, imageUrl) => {
    return `module fungible_tokens::${ticker} {
        use sui::coin::{Self, Coin};
        use sui::address::{Self};
        use sui::sui::{SUI};
        use sui::balance::{Self};
        use sui::url::{Self};
        use meme_fund::pool;
        public struct ${ticker} has drop {}
        #[allow(unused_function)]
        fun init(witness: ${ticker}, ctx: &mut TxContext) {
            let imageUrl = url::new_unsafe_from_bytes(b"${imageUrl}");
            let (mut treasury_cap, metadata) = coin::create_currency<${ticker}>(witness, 9, b"${ticker}", b"${name}", b"${description}", option::some(imageUrl), ctx);
            let newMeme = coin::mint(&mut treasury_cap, ${amount}, ctx);
            let zeroSui = coin::from_balance(balance::zero<SUI>(), ctx);
            transfer::public_freeze_object(metadata);
            pool::create_pool(newMeme, zeroSui, 1, 500 * 1000000000, ctx);
            transfer::public_transfer(treasury_cap, address::from_u256(0))
        }
    }`;
}
const getToml = () => {
    return `[package]
    name = "FungibleTokens"
    version = "0.0.1"
    edition = "2024.beta"
    
    [dependencies]
    Sui = { git = "https://github.com/MystenLabs/sui.git", subdir = "crates/sui-framework/packages/sui-framework", rev = "mainnet-v1.23.1" }
    meme_fund = { local = "../contracts" }
    
    [addresses]
    fungible_tokens = "0x0"`;
}

export const deployNewToken = async (maxSupply, name, ticker, description, imageUrl) => {

    const privkey = process.env.DEPLOYER_B64_PRIVKEY
    if (!privkey) {
        console.log("Error: DEPLOYER_B64_PRIVKEY not set as env variable.")
        process.exit(1)
    }
    const keypair = Ed25519Keypair.fromSecretKey(fromB64(privkey).slice(1));
    const folderName = uuidv4();
    mkdirSync("../" + folderName);
    mkdirSync("../" + folderName + "/sources");
    const moveCode = getMoveCode(maxSupply, name, ticker, description, imageUrl);
    const tomlCode = getToml();
    writeFileSync("../" + folderName + "/Move.toml", tomlCode);
    writeFileSync("../" + folderName + "/sources/fungiblecoin.move" , moveCode);
    const path_to_contracts = path.join(dirname(fileURLToPath(import.meta.url)), `../../${folderName}`)
    
    const client = new SuiClient({ url: "https://fullnode.testnet.sui.io:443"})
    
    console.log("Building move code...")
    const { modules, dependencies } = JSON.parse(execSync(
        `sui move build --dump-bytecode-as-base64 --path ${path_to_contracts}`,
        { encoding: "utf-8" }
    ))
    
    console.log("Deploying from address:", keypair.toSuiAddress())
    const deploy_trx = new TransactionBlock()
    const [upgradeCap] = deploy_trx.publish({
        modules,
        dependencies,
    });
    
    deploy_trx.transferObjects([upgradeCap], deploy_trx.pure("0x0"));
    return client.signAndExecuteTransactionBlock({
        signer: keypair, transactionBlock: deploy_trx, options: {
            showBalanceChanges: true,
            showEffects: true,
            showEvents: true,
            showInput: false,
            showObjectChanges: true,
            showRawInput: false
        }
    })
    
    const parse_cost = (amount) => Math.abs(parseInt(amount)) / 1_000_000_000
    
    if (balanceChanges) {
        console.log("Cost to deploy:", parse_cost(balanceChanges[0].amount), "SUI")
    }
    
    if (!objectChanges) {
        console.log("Error: RPC did not return objectChanges")
        //process.exit(1)
    }
    const published_event = objectChanges.find(obj => obj.type == "published")
    if (published_event?.type != "published") {
        //process.exit(1)
    }
    
    console.log("PackageID = " + published_event.packageId);
    return objectChanges.digest;
}

