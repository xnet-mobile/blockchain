// Test code for the EpochStake.sol contract
// Created Sat Sep 30 22:06:23 PDT 2023 by Sint Connexa

//-----------------------------------
// require statements and related

// We import Chai to use its asserting functions here.
const chai = require("chai");
const { expect, use } = require("chai");

// necessary for correct bignum comparison resuilts
const { solidity} = require("ethereum-waffle");

chai.use(solidity);

// fopr event testing
const chaiAsPromised = require('chai-as-promised');
use(chaiAsPromised);

// chai.use(require("chai-events"));
// const should = chai.should();
const EventEmitter = require("events");

// Use Rich's multitool library
//const multi = require("@0x0proxy/multi")
const multi = require("./multi.js")

// conveince constant for Eth zero address
const { AddressZero } = ethers.constants;

//-----------------------
// Utility functions

// sleep for the requested number of miliseconds
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Get the current unix time in seconds
function getCurrentUnixTimeInSeconds() {
    const currentTimeMilliseconds = Date.now();
    const currentTimeSeconds = Math.floor(currentTimeMilliseconds / 1000);
    return currentTimeSeconds;
}

// We use `loadFixture` to share common setups (or fixtures) between tests.
// Using this simplifies your tests and makes them run faster, by taking
// advantage of Hardhat Network's snapshot functionality.
const {
    loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("EpochStake contract", function () {

    // set up event catcher
    let emitter = null;
    beforeEach(function() {
	emitter = new EventEmitter();
    });


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
	// console.log("xnetaddr: " + xnetaddr);
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

    async function deployFastEpochFixture() {
	// Deploy an instance of the epoch stake contract with a start
	// time of fifteen seconds from now and an epoch length of ten
	// seconds.

	const [owner, addr1, addr2] = await ethers.getSigners();

	const now = getCurrentUnixTimeInSeconds();
	const epochstart = now+15;
	const epochdur = 20;
	const XNETToken = await ethers.deployContract("XNET");
	const xnetaddr = XNETToken.address;
	// console.log("xnetaddr: " + xnetaddr);
	const EpochStake = await ethers.getContractFactory("EpochStake");
	const fastStake = await EpochStake.deploy(addr1.address,
						   addr2.address,
						   epochstart,
						   epochdur,
						   [ xnetaddr ]);

	// Fixtures can return anything you consider useful for your
	// tests
	return { epochstart, epochdur, XNETToken, fastStake, EpochStake,  owner, addr1, addr2 };
    }

    describe("Deployment", function () {
	// `it` is another Mocha function. This is the one you use to define each
	// of your tests. It receives the test name, and a callback function.
	//
	// If the callback function is async, Mocha will `await` it.
	it("XNET should return correct total supply of 24B", async function () {
	    // We use loadFixture to setup our environment, and then assert that
	    // things went well
	    const {XNETToken, owner, addr1, addr2} = await loadFixture(deployXNETFixture);
	    const ts = await XNETToken.totalSupply();
	    expect(ts).to.equal(24n * (10n ** 9n) * (10n ** 18n));
	 
	});
	it("EpochStake should recognize that XNET is a valid asset", async function() {
	    const {XNETToken, epochStake, owner, addr1, addr2} = await loadFixture(deployEpochStakeFixture);
	    const intokens = await epochStake.inTokens(XNETToken.address);
	    const outtokens = await epochStake.inTokens(owner.address);
	    expect(intokens && !outtokens).to.be.true;
	});
	it("EpochStake should recognize that a wallet address is not a valid asset", async function() {
	    const {XNETToken, epochStake, owner, addr1, addr2} = await loadFixture(deployEpochStakeFixture);
	    const outtokens = await epochStake.inTokens(owner.address);
	    expect(!outtokens).to.be.true;
	});

	it("EpochState should revert on constructor if wallet address is included in list of assets", async function () {
	    const [owner, addr1, addr2] = await ethers.getSigners();

	    const XNETToken = await ethers.deployContract("XNET");
	    const xnetaddr = XNETToken.address;
	    // console.log("xnetaddr: " + xnetaddr);
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
	    // console.log("xnetaddr: " + xnetaddr);
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
    });
    describe("Initialization", function() {
	
	it("EpochStake should return zero for current_epoch_plus1 on first call", async function() {
	    const {XNETToken, epochStake, owner, addr1, addr2} = await loadFixture(deployEpochStakeFixture);
	    expect(await epochStake.current_epoch_plus1()).to.equal(0);
	});

	it("EpochStake should revert with \"no snapshot access\" if first call to snapshot() is not from escrow agent or staker", async function() {
	    const {XNETToken, epochStake, owner, addr1, addr2} = await loadFixture(deployEpochStakeFixture);
	    await expect( epochStake.snapshot()).to.be.revertedWith("EpochStake: no snapshot access");
	});

	it("EpochStake should not revert and then return correct epoch plus one when first shapshot() call is by staker/agent. Successful snapshot call should result in EpochTransition event.", async function() {
	    const {XNETToken, epochStake, owner, addr1, addr2} = await loadFixture(deployEpochStakeFixture);
	    const snap = await epochStake.connect(addr1).snapshot();
	    await expect(snap).to.emit(epochStake, 'EpochTransition')
		.withArgs(0,24);

	    expect(await epochStake.current_epoch_plus1()).to.equal(24);
	    
	});
    });

    describe("Transfers, Withdrawls, and Slashings in Epoch 0", function() {
	it("After first snapshot() call, call by non staker/agent reverts on no epoch boundary", async function() {
	    const {XNETToken, epochStake, owner, addr1, addr2} = await loadFixture(deployEpochStakeFixture);
	    await epochStake.connect(addr1).snapshot();
	    await expect( epochStake.snapshot()).to.be.revertedWith("EpochStake: no epoch boundary");
	});
	
	it("Transfer 10,0000 Wei and 1M tokens to EpochStake before snapshot, verify balance", async function() {
	    const {XNETToken, epochStake, owner, addr1, addr2} = await loadFixture(deployEpochStakeFixture);
	    // transfer 1M tokens to EpochStake contract address
	    await XNETToken.transfer(epochStake.address,1000000n * (10n ** 18n));
	    // Transfer 10,000 Wei to EpochStake contract address
	    await owner.sendTransaction({ to: epochStake.address,
	     				  value: 100000n });
	    // Balance must now be 10,000 Wei
	    expect( await ethers.provider.getBalance(epochStake.address)).to.equal(100000n);
	    // Token balance of the EpochStake contract must now be 1M
	    expect( await XNETToken.balanceOf(epochStake.address)).to.equal(1000000n * (10n ** 18n))
	    // Verify that the unstaked balance of Eth is 10,000 Wei
	    expect( await epochStake.getBalance(AddressZero)).to.equal(100000);
	    // Verify that the unstaked balance of XNET is 1M
	    expect( await epochStake.getBalance(XNETToken.address)).to.equal(1000000n * (10n ** 18n));
	    // Verify that the staked balance of both assets is zero
	    expect( await epochStake.getStakedBalance(AddressZero)).to.equal(0n);
	    expect( await epochStake.getStakedBalance(XNETToken.address)).to.equal(0n);
	});

	it("Transfer 10,0000 Wei and 1M tokens to EpochStake and snapshot, verify staked and unstaked balances of both assets before and after snapshot", async function() {
	    const {XNETToken, epochStake, owner, addr1, addr2} = await loadFixture(deployEpochStakeFixture);
	    // transfer 1M tokens to EpochStake contract
	    await XNETToken.transfer(epochStake.address,1000000n * (10n ** 18n))
	    // transfer 10000 Wei to EpochStake contract
	    await owner.sendTransaction({ to: epochStake.address,
	     				  value: 100000n });

	    // Check total Eth balance of EpochStake contract, must be 10,000
	    expect( await ethers.provider.getBalance(epochStake.address)).to.equal(100000n);
	    // Check total XNET TOken balance of contract, must be 1M
	    expect( await XNETToken.balanceOf(epochStake.address)).to.equal(1000000n * (10n ** 18n))

	    // Chek the unstaked Eth balance of the EpochStake
	    // contract, should be 10,000 Wei
	    expect( await epochStake.getBalance(AddressZero)).to.equal(100000n);
	    // Check the staked balance of the EpochStke contract, should be 0
	    expect( await epochStake.getStakedBalance(AddressZero)).to.equal(0);
	    // Check the unstaked XNET token balance, should be 1M
	    expect( await epochStake.getBalance(XNETToken.address)).to.equal(1000000n * (10n ** 18n));
	    // Check the staked XNET token balance, should be 0
	    expect( await epochStake.getStakedBalance(XNETToken.address)).to.equal(0);
	    // Call Snapshot, which should make all unstaked balances staked
	    const snap = await epochStake.connect(addr1).snapshot();
	    await expect(snap).to.emit(epochStake,'Snapshot')
		.withArgs(addr1.address,24,XNETToken.address,1000000n * (10n ** 18n) );
	    await expect(snap).to.emit(epochStake,'Snapshot')
		.withArgs(addr1.address,24,AddressZero,100000n);


	    // Now staked balance of XNET token shouild be 1M
	    expect( await epochStake.getStakedBalance(XNETToken.address)).to.equal(1000000n * (10n ** 18n));
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
	    await XNETToken.transfer(epochStake.address,1000000n * (10n ** 18n))
	    // transfer 10000 Eth to EpochStake contract
	    await owner.sendTransaction({ to: epochStake.address,
	     				  value: 1000n * (10n ** 18n) });
	    // attempt unstaked asset withdrawl by Escrow agent, should revert
	    await expect( epochStake.withdrawEth(1000)).to.be.revertedWith("AccessControl: account 0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266 is missing role 0xb9e206fa2af7ee1331b72ce58b6d938ac810ce9b5cdb65d35ab723fd67badf9e");
	    // attempt unstaked asset withdrawl by non-staker, should revert
	    await expect( epochStake.connect(addr2).withdrawEth(1000)).to.be.revertedWith("AccessControl: account 0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc is missing role 0xb9e206fa2af7ee1331b72ce58b6d938ac810ce9b5cdb65d35ab723fd67badf9e");
	    const strtbal = BigInt(await ethers.provider
				   .getBalance(addr1.address));
	    //console.log(`starting balance of staker: ${strtbal}`);
	    const withdrw = await epochStake.connect(addr1).withdrawEth(0);

	    // test emission of Withdraw event
	    await expect(withdrw).to.emit(epochStake, 'Withdraw')
		.withArgs(addr1.address,AddressZero, 1000n * (10n ** 18n));
	    
	    const newbal =  await ethers.provider.getBalance(addr1.address);
	    //console.log(`ending balance of staker: ${newbal}`);
	    expect(multi.bigClose(newbal,
				  strtbal + 1000n * (10n ** 18n)))
		.to.be.true;
	});
	it("Test slashing. Verify reverts when wrong acount slashes, when slash is too big, that specified amount can be slashed as well as full amount on zero", async function() {
	    const {XNETToken, epochStake, owner, addr1, addr2} = await loadFixture(deployEpochStakeFixture);
	    // transfer 100 tokens to EpochStake contract
	    await XNETToken.transfer(epochStake.address,
				     100n * (10n **18n));
	    // transfer 10 Eth to EpochStake contract
	    await owner.sendTransaction({ to: epochStake.address,
	     				  value: (10n * (10n ** 18n)) });
	    // snapshot so as to stake assets
	    await epochStake.connect(addr1).snapshot();
	    
	    // attempt to slash with the wrong acount
	    await expect( epochStake.slashAsset(XNETToken.address,0)).to.be.revertedWith("AccessControl: account 0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266 is missing role 0x2fdac322ee704ce09f0773f7f3f92eb98d5e7c836ee9c056cccd5f61041e5e3f");
	    await expect( epochStake.slashEth(0)).to.be.revertedWith("AccessControl: account 0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266 is missing role 0x2fdac322ee704ce09f0773f7f3f92eb98d5e7c836ee9c056cccd5f61041e5e3f");

	    // get the staring balance of the escrow agent account
	    const escrow = addr2;
	    const epochStakeEscrow = epochStake.connect(escrow);
	    const strtbal = BigInt(await XNETToken.balanceOf(escrow.address));

	    // Slash 10 tokens
	    await epochStakeEscrow.slashAsset(XNETToken.address,
					      10n * (10n**18n));
	    const newbal =  BigInt(await XNETToken.balanceOf(escrow.address));
	    //console.log(`start balance: ${strtbal}  new balance: ${newbal}` );
	    expect(multi.bigClose(newbal,
				  strtbal + 10n*(10n**18n),
				  1)).to.be.true;
	    // Slash eth
	    const strtbal2 = BigInt(await ethers.provider
				    .getBalance(escrow.address));

	    // Slash 1 eth
	    await epochStakeEscrow.slashEth(1n * (10n**18n));
	    const newbal2 = BigInt(await ethers.provider
				   .getBalance(escrow.address));
	    //console.log(`start balance: ${strtbal2}  new balance: ${newbal2}` );
	    expect(multi.bigClose(newbal2,
				  strtbal2 + 1n*(10n**18n))).to.be.true;

	});
    });
    
    describe("Epoch Transitions from pre-zero to post zero", function() {
	
	it("Test epoch boundary transition with stake reduction, including emission of RequestStakeSubtraction event", async function() {
	    const {epochstart, epochdur, XNETToken, fastStake, owner, addr1, addr2} = await loadFixture(deployFastEpochFixture);
	    // we are in epoch -1 territory to start with
	    expect( await fastStake.nextEpoch()).to.equal(0);
	    await expect (fastStake.connect(addr1).snapshot()).to.be.revertedWith('EpochStake: no epoch boundary');
	    await expect (fastStake.currentEpoch()).to.be.revertedWith('Epoch: epoch is negative');
	    process.stdout.write(`            waiting for epoch boundary ${epochstart}`);
	    // transfer 100 tokens to Faststake contract
	    await XNETToken.transfer(fastStake.address,
				     100n * (10n **18n));
	    // transfer 10 Eth to Faststake contract
	    await owner.sendTransaction({ to: fastStake.address,
	     				  value: (10n * (10n ** 18n)) });
	    tm = getCurrentUnixTimeInSeconds();
	    while(tm < epochstart ) {
		process.stdout.write(".");
		await sleep(500);	// half a second
		tm = getCurrentUnixTimeInSeconds();
	    }
	    console.log(`done: ${tm}`);
	   
	    // snapshot
	    await fastStake.connect(addr1).snapshot();
	    expect( await fastStake.currentEpoch()).to.equal(0);
	    expect( await fastStake.nextEpoch()).to.equal(1);

	    // connect staker to contract
	    const fastStakeStaker = fastStake.connect(addr1);
	    
	    // request staking reduction of 50% for both assets
	    const sub1 = await fastStakeStaker
		  .subtractEth(5n * (10n ** 18n));
	    await expect(sub1).to.emit(fastStake,'RequestStakeSubtraction')
		.withArgs(addr1.address,AddressZero,5n * (10n ** 18n));
	    const sub2 = await fastStakeStaker
		  .subtractAsset(XNETToken.address,
				 50n * (10n ** 18n));
	    await expect(sub2).to.emit(fastStake,'RequestStakeSubtraction')
		.withArgs(addr1.address,XNETToken.address,50n * (10n ** 18n));

	    // attempt to withdraw right after subtraction request
	    // should fail

	    await expect (fastStakeStaker.withdrawEth(5n * (10n ** 18n)))
		.to.be.revertedWith('EpochStake: withdraw too big');
	    await expect (fastStakeStaker.withdrawAsset(XNETToken.address,
							50n * (10n ** 18n)))
		.to.be.revertedWith('EpochStake: ERC20 withdraw too big');


	    process.stdout.write(`            waiting for epoch boundary ${epochstart+epochdur}`);
	    tm = getCurrentUnixTimeInSeconds();
	    while(tm < epochstart + epochdur ) {
		process.stdout.write(".");
		await sleep(500);	// one second
		tm = getCurrentUnixTimeInSeconds();
	    }
	    console.log(`done: ${tm}`);
	   
	    // snapshot
	    await fastStake.connect(addr1).snapshot();

	    // make sure epoch counter is correct
	    expect( await fastStake.nextEpoch()).to.equal(2);

	    // witherdrawls should now succeed
	    await fastStakeStaker.withdrawEth(5n * (10n ** 18n));
	    await fastStakeStaker.withdrawAsset(XNETToken.address,
						50n * (10n ** 18n));

	    // Verify staked balances
	    expect(multi.bigClose(await fastStake.getStakedBalance(AddressZero),
				  5n * (10n **18n),
				  1)).to.be.true;
	    expect(multi.bigClose(await fastStake
				  .getStakedBalance(XNETToken.address),
				  50n * (10n **18n),
				  1)).to.be.true;
	    
	});
	it("Test epoch boundary transition with canceled stake reduction, including emission of CancelStakeSubtraction event", async function() {
	    const {epochstart, epochdur, XNETToken, fastStake, owner, addr1, addr2} = await loadFixture(deployFastEpochFixture);
	    // we are in epoch -1 territory to start with
	    expect( await fastStake.nextEpoch()).to.equal(0);
	    await expect (fastStake.connect(addr1).snapshot()).to.be.revertedWith('EpochStake: no epoch boundary');
	    await expect (fastStake.currentEpoch()).to.be.revertedWith('Epoch: epoch is negative');
	    process.stdout.write(`            waiting for epoch boundary ${epochstart + 2*epochdur}`);
	    // transfer 100 tokens to Faststake contract
	    await XNETToken.transfer(fastStake.address,
				     100n * (10n **18n));
	    // transfer 10 Eth to Faststake contract
	    await owner.sendTransaction({ to: fastStake.address,
	     				  value: (10n * (10n ** 18n)) });
	    tm = getCurrentUnixTimeInSeconds();
	    while(tm < epochstart + 2*epochdur ) {
		process.stdout.write(".");
		await sleep(500);	// half a second
		tm = getCurrentUnixTimeInSeconds();
	    }
	    console.log(`done: ${tm}`);
	   
	    // snapshot
	    await fastStake.connect(addr1).snapshot();
	    expect( await fastStake.currentEpoch()).to.equal(0);
	    expect( await fastStake.nextEpoch()).to.equal(1);

	    // connect staker to contract
	    const fastStakeStaker = fastStake.connect(addr1);
	    
	    // request staking reduction of 100% for both assets
	    const sub1 = await fastStakeStaker
		  .subtractEth(0);
	    await expect(sub1).to.emit(fastStake,'RequestStakeSubtraction')
		.withArgs(addr1.address,AddressZero,10n * (10n ** 18n));
	    const sub2 = await fastStakeStaker
		  .subtractAsset(XNETToken.address,
				 0);
	    await expect(sub2).to.emit(fastStake,'RequestStakeSubtraction')
		.withArgs(addr1.address,XNETToken.address,100n * (10n ** 18n));

	    // attempt to withdraw right after subtraction request
	    // should fail

	    await expect (fastStakeStaker.withdrawEth(5n * (10n ** 18n)))
		.to.be.revertedWith('EpochStake: withdraw too big');
	    await expect (fastStakeStaker.withdrawAsset(XNETToken.address,
							50n * (10n ** 18n)))
		.to.be.revertedWith('EpochStake: ERC20 withdraw too big');

	    // cancel stake subtraction requests

	    const can1 = await fastStakeStaker
		  .cancelSubtractEth();
	    await expect(can1).to.emit(fastStake,'CancelStakeSubtraction')
		.withArgs(addr1.address,AddressZero);

	    const can2 = await fastStakeStaker
		  .cancelSubtractAsset(XNETToken.address);
	    await expect(can2).to.emit(fastStake,'CancelStakeSubtraction')
		.withArgs(addr1.address,XNETToken.address);


	    process.stdout.write(`            waiting for epoch boundary ${epochstart+epochdur*3}`);
	    tm = getCurrentUnixTimeInSeconds();
	    while(tm < epochstart + epochdur*3 ) {
		process.stdout.write(".");
		await sleep(500);	// one second
		tm = getCurrentUnixTimeInSeconds();
	    }
	    console.log(`done: ${tm}`);

	    // snapshot
	    await fastStake.connect(addr1).snapshot();

	    // make sure epoch counter is correct
	    expect( await fastStake.nextEpoch()).to.equal(3);

	    // witherdrawls should fail, as stake reduction was canceled
	    
	    await expect (fastStakeStaker.withdrawEth(5n * (10n ** 18n)))
		.to.be.revertedWith('EpochStake: withdraw too big');
	    await expect (fastStakeStaker.withdrawAsset(XNETToken.address,
							50n * (10n ** 18n)))
		.to.be.revertedWith('EpochStake: ERC20 withdraw too big');

	    return;
	    
	});
    });
	    
	    
	    

	
});

	   
  
    
