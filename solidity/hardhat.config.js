/**
 * @type import('hardhat/config').HardhatUserConfig
 */

require('@nomiclabs/hardhat-ethers');
require("@nomiclabs/hardhat-etherscan");
require("dotenv").config();

// stick secrets in environment variables
// richard@xnet.company Alchemy account

const { PRIVATE_KEY, POLYGON_API_URL, MUMBAI_API_URL, GOERLI_API_URL,
	ETHER_GOERLI_API, ETHER_POLYGON_API} = process.env;

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
case 'polygon':
default:
    etherKey = `${ETHER_POLYGON_API}`;
    break;
}

module.exports = {
    solidity: "0.8.2",
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
