// Test code for the EpochStake.sol contract
// Created Sat Sep 30 22:06:23 PDT 2023 by Sint Connexa

// We import Chai to use its asserting functions here.
const chai = require("chai");
const { expect } = require("chai");

// necessary for correct bignum comparison resuilts
const { solidity} = require("ethereum-waffle");
chai.use(solidity);


// We use `loadFixture` to share common setups (or fixtures) between tests.
// Using this simplifies your tests and makes them run faster, by taking
// advantage of Hardhat Network's snapshot functionality.
const {
    loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("EpochStake contract", function () {
    // We define a fixture to reuse the same setup in every test. We
    // use loadFixture to run this setup once, snapshot that state,
    // and reset Hardhat Network to that snapshot in every test.
    async function deployXNETFixture() {
	// Get the Signers here.
	const [owner, addr1, addr2] = await ethers.getSigners();

	// To deploy our contract, we just have to call
	// ethers.deployContract and await its waitForDeployment()
	// method, which happens once its transaction has been mined.
	const XNETToken = await ethers.deployContract("XNET");

	// Fixtures can return anything you consider useful for your
	// tests
	return { XNETToken, owner, addr1, addr2 };
    }

    async function deployEpochStakeFixture() {
	// Get the Signers here.
	const [owner, addr1, addr2] = await ethers.getSigners();

	// To deploy our contract, we just have to call
	// ethers.deployContract and await its waitForDeployment()
	// method, which happens once its transaction has been mined.
	
	const XNETToken = await ethers.deployContract("XNET");
	const xnetaddr = XNETToken.address;
	console.log("xnetaddr: " + xnetaddr);
	const EpochStake = await ethers.getContractFactory("EpochStake");
	const epochStake = await EpochStake.deploy(addr1.address,
						   addr2.address,
						   0,
						   0,
						   [ xnetaddr ]);

	// Fixtures can return anything you consider useful for your
	// tests
	return { XNETToken, epochStake, owner, addr1, addr2 };
    }

    describe("Deployment", function () {
	// `it` is another Mocha function. This is the one you use to define each
	// of your tests. It receives the test name, and a callback function.
	//
	// If the callback function is async, Mocha will `await` it.
	it("XNET should return correct total supply", async function () {
	    // We use loadFixture to setup our environment, and then assert that
	    // things went well
	    const {XNETToken, owner, addr1, addr2} = await loadFixture(deployXNETFixture);
	    const ts = await XNETToken.totalSupply();
	    expect(ts).to.equal(24000000000000000000000000000n);
	 
	});
	it("EpochStake should recognized that XNET is a valid asset", async function() {
	    const {XNETToken, epochStake, owner, addr1, addr2} = await loadFixture(deployEpochStakeFixture);
	    const intokens = await epochStake.inTokens(XNETToken.address);
	    const outtokens = await epochStake.inTokens(owner.address);
	    expect(intokens && !outtokens);
	});
	it("EpochStake should recognized that a signer address is not a valid asset", async function() {
	    const {XNETToken, epochStake, owner, addr1, addr2} = await loadFixture(deployEpochStakeFixture);
	    const outtokens = await epochStake.inTokens(owner.address);
	    expect(!outtokens);
	});
    });
});

	   
  
    
