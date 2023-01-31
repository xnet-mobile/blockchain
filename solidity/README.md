# XNET Blockchain
Smart contracts and related scripts for XNET Mobile. Created by Sint
Connexa <connexa@xnet.company>

## Dependencies
This project is being developed as a
[hardhat](https://hardhat.org/getting-started/) project, built on top
of NPM.  It also uses some other open-source tools.

In order to work with these contracts and scripts , you will want to
make sure that a recent version of NPM is installed (version 14.4 is
known to work) and that appropriate packages have been
installed. **Note** The version of NPM available on Ubuntu 20.04
(Focal) is not recent enough.

### Making sure you have NPM 14.4
The simplest way to deal with a potentially outdated version of Node
is by installing NVM, a version manager for node.js.  You can install
NVM as follows:

	curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.35.3/install.sh | bash
	
To check the version of nvm, type `nvm --version`.  You should see
`0.35.3` or similar. You may need to restart your terminal or update
environment variables for the changes to take effect.

### Install NPM 14.4 using NVM

To install the desired version of node, type `nvm install <version>`,
*e.g.* for version 14.4 type:

	nvm install 14.4.0
	
### Install NPM packages

To work with this project, you will need to install the following
packages and their dependencies:

	npm install --save-dev hardhat
	npm install --save-dev dotenv
	npm install --save-dev @nomiclabs/hardhat-ethers ethers 
	npm install --save-dev @nomiclabs/hardhat-etherscan
	npm install --save-dev @openzeppelin/contracts
	npm install --save-dev @0x0proxy/multi

## compiling
To complie the smart contracts, type

   npx hardhat compile

## deploying XNETLockup2

To deploy the XNETLockup2 smart contract in batch, use the
`handle-lockups.sh` script, in conjunction with the relevant
`deploy-XNETLockup2.js` hardhat node script and the relvant
network-dependent JSON configuration files.

This will require setting the environment variables NETWORK and
ESCROWADDR appropriately. You will need a `.env` file with appropriate
credentials to deploy to networks other than `localhost`
