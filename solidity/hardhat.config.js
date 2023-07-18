/**
 * @type import('hardhat/config').HardhatUserConfig
 */

require('@nomiclabs/hardhat-ethers');
require("@nomiclabs/hardhat-etherscan");
require("dotenv").config();

// We are using Alchemy for deployment to non-localhost test and
// production networks.  To do this, you will need to create an
// Alchemy account (go to https://www.alchemy.com/) and get your API
// keys.

// Also, to do a deployment to a non-localhost network, you will need
// to know the private key of the account you are deploying from --
// for example, you can get your private key from your MetaMask wallet.

// Export the plaintext of your private key and get your Alchemy API
// keys, then edit the .env file and make the appropriate
// subsitutions.

// DO NOT CHECK YOUR ACTUAL CREDENTIALS INTO THE GIT REPOSITORY

const { PRIVATE_KEY, POLYGON_API_URL, MUMBAI_API_URL, GOERLI_API_URL,
	ETHER_GOERLI_API, ETHER_POLYGON_API, ETHER_MUMBAI_API} = process.env;

var network = process.env.NETWORK;
if (network == undefined) {
    network = 'goerli';
}

network = network.toLowerCase();

var etherKey = null;
switch (network) {
case 'goerli':
    etherKey = `${ETHER_GOERLI_API}`;
    break
case 'mumbai':
    etherKey = `${ETHER_MUMBAI_API}`;
    break
case 'polygon':
default:
    etherKey = `${ETHER_POLYGON_API}`;
    break;
}

module.exports = {
    solidity: {
	compilers: [
	    {
		version: "0.8.2",
	    },
	    {
		version: "0.8.8",
	    },
	],
    },
    etherscan: {
	apiKey: etherKey,
    },
    networks: {
	polygon: {
	    url: POLYGON_API_URL,
	    accounts: [`0x${PRIVATE_KEY}`]
	},
	mumbai: {
	    url: MUMBAI_API_URL,
	    accounts: [`0x${PRIVATE_KEY}`]
	},
	goerli: {
	    url: GOERLI_API_URL,
	    accounts: [`0x${PRIVATE_KEY}`]
	}
    }
  };
