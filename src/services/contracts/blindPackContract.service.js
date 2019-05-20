import {ethers} from 'ethers';

import {abi, contracts} from 'nifty-football-contract-tools';

export default class BlindPackContractService {

    constructor(networkId, web3, ethAccount) {
        this.networkId = networkId;
        this.ethAccount = ethAccount;
        const {address} = contracts.getNiftyFootballBlindPack(networkId);
        const {address: eliteAddress} = contracts.getNiftyFootballEliteBlindPack(networkId);
        this.contract = new web3.eth.Contract(abi.NiftyFootballTradingCardBlindPackAbi, address);
        this.eliteContract = new web3.eth.Contract(abi.NiftyFootballTradingCardEliteBlindPackAbi, eliteAddress);
    }

    async buyBlindPack(number, useCredits = false) {

        console.log(`buying regular ${number} using credit ${useCredits}`);

        const gasPrice = await ethers.getDefaultProvider(this.getNetworkString(this.networkId)).getGasPrice();

        const totalPrice = await this.contract.methods.totalPrice(number).call();

        // const gasLimit = await this.contract.estimate.buyBatch(number, {
        //     value: totalPrice
        // });

        // Supply zero value if using credits up
        const price = useCredits
            ? 0
            : totalPrice;

        // wait for tx to be mined
        return new Promise((resolve, reject) => {
            this.contract.methods.buyBatch(number).send({
                from: this.ethAccount,
                // The maximum units of gas for the transaction to use
                // gasLimit: gasLimit.add(500000),
                // The price (in wei) per unit of gas
                gasPrice: gasPrice,
                value: price,
            })
            .once('confirmation', (undefined, receipt) => resolve(receipt))
            .on('error', (e) => reject(e));
        })
    }

    async buyEliteBlindPack(number) {

        const gasPrice = await ethers.getDefaultProvider(this.getNetworkString(this.networkId)).getGasPrice();

        const totalPrice = await this.eliteContract.methods.totalPrice(number).call();

        // const gasLimit = await this.eliteContract.estimate.buyBatch(number, {
        //     value: totalPrice
        // });

        // wait for tx to be mined
        return new Promise((resolve, reject) => {
            this.eliteContract.methods.buyBatch(number).send({
                from: this.ethAccount,
                // The maximum units of gas for the transaction to use
                // gasLimit: gasLimit.add(500000),
                // The price (in wei) per unit of gas
                gasPrice: gasPrice,
                value: totalPrice,
            })
            .once('confirmation', (undefined, receipt) => resolve(receipt))
            .on('error', (e) => reject(e));
        })
    }


    getNetworkString = (network) => {
        return contracts.networkSplitter(network, {
            mainnet: 'homestead', // our default is mainnet so override
            ropsten: 'ropsten',
            rinkeby: 'rinkeby',
            local: 'homestead'
        });
    };
}
