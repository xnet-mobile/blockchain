// Test code for the EpochStake.sol contract
// Created Sat Sep 30 22:06:23 PDT 2023 by Sint Connexa

// We import Chai to use its asserting functions here.
const chai = require("chai");
const { expect } = require("chai");
const multi = require("@0x0proxy/multi")

// necessary for correct bignum comparison resuilts
const { solidity} = require("ethereum-waffle");
chai.use(solidity);

const { AddressZero } = ethers.constants;

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
	return { XNETToken, epochStake, EpochStake,  owner, addr1, addr2 };
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
	it("EpochStake should recognized that a wallet address is not a valid asset", async function() {
	    const {XNETToken, epochStake, owner, addr1, addr2} = await loadFixture(deployEpochStakeFixture);
	    const outtokens = await epochStake.inTokens(owner.address);
	    expect(!outtokens);
	});

	it("EpochState should revert on constructor if wallet address is included in list of assets", async function () {
	    const [owner, addr1, addr2] = await ethers.getSigners();

	    const XNETToken = await ethers.deployContract("XNET");
	    const xnetaddr = XNETToken.address;
	    console.log("xnetaddr: " + xnetaddr);
	    const EpochStake = await ethers.getContractFactory("EpochStake");
	    await expect( EpochStake.deploy(addr1.address,
					    addr2.address,
					    0,
					    0,
					    [ xnetaddr,
					      addr1.address])
			).to.be.revertedWith("EpochStake: bad token in list");
	});
	
	it("EpochState should revert on constructor if non-token contract address is included in list of assets", async function () {
	    const [owner, addr1, addr2] = await ethers.getSigners();

	    const XNETToken = await ethers.deployContract("XNET");
	    const xnetaddr = XNETToken.address;
	    console.log("xnetaddr: " + xnetaddr);
	    const EpochStake = await ethers.getContractFactory("EpochStake");
	    const epochStake = await EpochStake.deploy(addr1.address,
						       addr2.address,
						       0,
						       0,
						       [ xnetaddr ]);
	    await expect( EpochStake.deploy(addr1.address,
					    addr2.address,
					    0,
					    0,
				 	    [ xnetaddr,
					      epochStake.address])
			).to.be.revertedWith("function returned an unexpected amount of data");
	});

	it("EpochStake should return zero for current_epoch on first call", async function() {
	    const {XNETToken, epochStake, owner, addr1, addr2} = await loadFixture(deployEpochStakeFixture);
	    expect(await epochStake.current_epoch()).to.equal(0);
	});

	it("EpochStake should return zero for current_epoch on first call", async function() {
	    const {XNETToken, epochStake, owner, addr1, addr2} = await loadFixture(deployEpochStakeFixture);
	    expect(await epochStake.current_epoch()).to.equal(0);
	});

	it("EpochStake should revert with \"no snapshot access\" if first call to snapshot() is not from escrow agent or staker", async function() {
	    const {XNETToken, epochStake, owner, addr1, addr2} = await loadFixture(deployEpochStakeFixture);
	    await expect( epochStake.snapshot()).to.be.revertedWith("EpochStake: no snapshot access");
	});

	it("EpochStake should not revert and then return correct epoch plus one when first shapshot() call is by staker/agent", async function() {
	    const {XNETToken, epochStake, owner, addr1, addr2} = await loadFixture(deployEpochStakeFixture);
	    await epochStake.connect(addr1).snapshot();
	    expect(await epochStake.current_epoch()).to.equal(24);
	    
	});
	
	it("After first snapshot() call, call by non staker/agent reverts on no epoch boundary", async function() {
	    const {XNETToken, epochStake, owner, addr1, addr2} = await loadFixture(deployEpochStakeFixture);
	    await epochStake.connect(addr1).snapshot();
	    await expect( epochStake.snapshot()).to.be.revertedWith("EpochStake: no epoch boundary");
	});
	it("Transfer 10,0000 Wei and 1M tokens to EpochStake before snapshot, verify balance", async function() {
	    const {XNETToken, epochStake, owner, addr1, addr2} = await loadFixture(deployEpochStakeFixture);
	    // transfer 1M tokens to EpochStake contract address
	    await XNETToken.transfer(epochStake.address,1000000000000000000000000n);
	    // Transfer 10,000 Wei to EpochStake contract address
	    await owner.sendTransaction({ to: epochStake.address,
	     				  value: 100000n });
	    // Balance must now be 10,000 Wei
	    expect( await ethers.provider.getBalance(epochStake.address)).to.equal(100000n);
	    // Token balance of the EpochStake contract must now be 1M
	    expect( await XNETToken.balanceOf(epochStake.address)).to.equal(1000000000000000000000000n)
	    // Verify that the unstaked balance of Eth is 10,000 Wei
	    expect( await epochStake.getBalance(AddressZero)).to.equal(100000);
	    // Verify that the unstaked balance of XNET is 1M
	    expect( await epochStake.getBalance(XNETToken.address)).to.equal(1000000000000000000000000n);
	    // Verify that the staked balance of both assets is zero
	    expect( await epochStake.getStakedBalance(AddressZero)).to.equal(0n);
	    expect( await epochStake.getStakedBalance(XNETToken.address)).to.equal(0n);
	});

	it("Transfer 10,0000 Wei and 1M tokens to EpochStake and snapshot, verify staked and unstaked balances of both assets before and after snapshot", async function() {
	    const {XNETToken, epochStake, owner, addr1, addr2} = await loadFixture(deployEpochStakeFixture);
	    // transfer 1M tokens to EpochStake contract
	    await XNETToken.transfer(epochStake.address,1000000000000000000000000n)
	    // transfer 10000 Wei to EpochStake contract
	    await owner.sendTransaction({ to: epochStake.address,
	     				  value: 100000n });

	    // Check total Eth balance of EpochStake contract, must be 10,000
	    expect( await ethers.provider.getBalance(epochStake.address)).to.equal(100000n);
	    // Check total XNET TOken balance of contract, must be 1M
	    expect( await XNETToken.balanceOf(epochStake.address)).to.equal(1000000000000000000000000n)

	    // Chek the unstaked Eth balance of the EpochStake
	    // contract, should be 10,000 Wei
	    expect( await epochStake.getBalance(AddressZero)).to.equal(100000n);
	    // Check the staked balance of the EpochStke contract, should be 0
	    expect( await epochStake.getStakedBalance(AddressZero)).to.equal(0);
	    // Check the unstaked XNET token balance, should be 1M
	    expect( await epochStake.getBalance(XNETToken.address)).to.equal(1000000000000000000000000n);
	    // Check the staked XNET token balance, should be 0
	    expect( await epochStake.getStakedBalance(XNETToken.address)).to.equal(0);
	    // Call Snapshot, which should make all unstaked balances staked
	    await epochStake.connect(addr1).snapshot();
	    // Now staked balance of XNET token shouild be 1M
	    expect( await epochStake.getStakedBalance(XNETToken.address)).to.equal(1000000000000000000000000n);
	    /// ... and unstaked balance should be 0
	    expect( await epochStake.getBalance(XNETToken.address)).to.equal(0n);
	    // Now staked balance of native asset should be 10,000 Wei
	    expect( await epochStake.getStakedBalance(AddressZero)).to.equal(100000);
	    // .. and unstaked should be 0
	    expect( await epochStake.getBalance(AddressZero)).to.equal(0n);
	});
	it("Test unstaked asset withdrawl functionality.  Transfer assets in, attepmpt withdrawl by escrow agent and non-staker (will revert), withdraw some by correct account, snapshot and make sure resulting balance is correct", async function() {
	    const {XNETToken, epochStake, owner, addr1, addr2} = await loadFixture(deployEpochStakeFixture);
	    // transfer 1M tokens to EpochStake contract
	    await XNETToken.transfer(epochStake.address,1000000000000000000000000n)
	    // transfer 10000 Wei to EpochStake contract
	    await owner.sendTransaction({ to: epochStake.address,
	     				  value: 1000000000000000000000n });
	    // attempt unstaked asset withdrawl by Escrow agent, should revert
	    await expect( epochStake.withdrawEth(1000)).to.be.revertedWith("AccessControl: account 0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266 is missing role 0xb9e206fa2af7ee1331b72ce58b6d938ac810ce9b5cdb65d35ab723fd67badf9e");
	    // attempt unstaked asset withdrawl by non-staker, should revert
	    await expect( epochStake.connect(addr2).withdrawEth(1000)).to.be.revertedWith("AccessControl: account 0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc is missing role 0xb9e206fa2af7ee1331b72ce58b6d938ac810ce9b5cdb65d35ab723fd67badf9e");
	    const strtbal = await ethers.provider.getBalance(addr1.address);
	    console.log(`starting balance of staker: ${strtbal}`);
	    await epochStake.connect(addr1).withdrawEth(0);
	    const newbal =  await ethers.provider.getBalance(addr1.address);
	    console.log(`ending balance of staker: ${newbal}`);
	    expect(multi.bigClose(newbal,BigInt(String(strtbal)) + BigInt("1000000000000000000000")));
	});
	    
	
    });
});

	   
  
    
