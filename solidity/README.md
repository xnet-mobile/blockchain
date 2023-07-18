# XNET Blockchain
Smart contracts and related scripts for XNET Mobile. Created by Sint
Connexa <connexa@xnet.company>

## Contents

There are three smart contracts included in this repo:

* [contracts/XNETXSplit.sol](contracts/XNETSplit.sol) &mdash; payment
  splitter contract used for token distribution
* [contracts/XNET.sol](contracts/XNET.sol) &mdash; the XNET Mobile
  ERC20 utility token, as minted
* [contracts/XNETLockup2.sol](contracts/XNETLockup2.sol) &mdash; the
   XNET vesting wallet contract used for locked rewards. Derived from
   the OpenZeppelin VestingWallet.sol contract, but with the addition
   of an escrow role that allows for the slashing/revocation of
   rewards, and thus dealing with XNET-specific use cases as well as
   the general case of lost or compromised credentials on the part of
   the beneficiary.
* [contracts/XNETlockup.sol](contracts/XNETlockup.sol) &mdash; the
  first version of the XNET vesting wallet, a plain vanilla
  implementation of the OpenZeppelin VestingWallet. DEPRECATED due to
  the lack of the escrow role that allows for slashing and dealing
  with circumstances like lost credentials on the part of the
  beneficiary.

## Scripts
In the [scripts](./scripts) directory, you will find deployment
scripts for the smart contracts

## Dependencies
This project is being developed as a
[hardhat](https://hardhat.org/getting-started/) project, built on top
of NPM.  It also uses some other open-source tools.

In order to work with these contracts and scripts , you will want to
make sure that a recent version of NPM is installed (version 16.0 is
known to work) and that appropriate packages have been
installed. **Note** The version of NPM available on Ubuntu 20.04
(Focal) is not recent enough.

### Making sure you have NPM 16.0
The simplest way to deal with a potentially outdated version of Node
is by installing NVM, a version manager for node.js.  You can install
NVM as follows:

	curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.35.3/install.sh | bash
	
To check the version of nvm, type `nvm --version`.  You should see
`0.35.3` or similar. You may need to restart your terminal or update
environment variables for the changes to take effect.

### Install NPM 16.0 using NVM

To install the desired version of node, type `nvm install <version>`,
*e.g.* for version 16.0 type:

	nvm install 16.0
	
### Install NPM packages

To work with this project, you will need to install the required node
package dependencies. Typing

	npm install
	
Should do what you want. Alternatively, you can install the
dependencies manually as so:

	npm install --save-dev hardhat
	npm install --save-dev dotenv
	npm install --save-dev @nomiclabs/hardhat-ethers ethers 
	npm install --save-dev @nomiclabs/hardhat-etherscan
	npm install --save-dev @openzeppelin/contracts
	npm install --save-dev @0x0proxy/multi

## compiling smart contracts
To compile the smart contracts, type

   npx hardhat compile

## deploying smart contracts

In order to deploy the smart contracts beyond a localhost testing
environment, you will need to have appropriate API keys set up in your
`.env` file. There is an example `.env` file named `example.env` that
you can rename to .env and then put your sensitive credentials
into. **NOTE:** do not override the `.gitignore` and check your .env
into the repository, as this will publish your secrets to the world.

### deploying XNET.sol
To deploy the XNET.sol contract, use

	npx hardhat run --network $NETWORK scripts/deploy-XNET.js
	
### deploying the XNETLockup2.sol

To deploy the XNETLockup2 smart contract in batch, use the
`handle-lockups.sh` script, in conjunction with the relevant
`deploy-XNETLockup2.js` hardhat node script and the relevant
network-dependent JSON configuration files, for which examples are
provided for the localhost network.

This will require setting the environment variables `NETWORK` and
`ESCROWADDR` appropriately. You will need a `.env` file with appropriate
credentials to deploy to networks other than `localhost`
