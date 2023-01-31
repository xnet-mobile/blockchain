// vesting wallet deployment script
// created Sun Nov 27 10:44:49 PST 2022 by connexa@xnet.company

// scripts/deploy-XNETLockup2.js

const multi = require('@0x0proxy/multi');

var network = process.env.NETWORK;
var escrow = process.env.ESCROWADDR;

// format a beneficiary as a string with human-readable date and color
// wallet address
function formatBene(bene) {
    if (bene.length == undefined ||
	bene.length != 3)
	return multi.red("<not bene: " + bene + ">");
    
    return multi.colorAddress(bene[0]) +
	" : " +
	new Date(bene[1]*1000).toISOString() +
	" -- " + new Date((bene[1]+bene[2])*1000).toISOString();
}

// do a deep-ish membership test for an array of arrays
function listIn(list,init) {
    for (var i = 0; i < list.length; i++) {
	var matched= true;
	for (var j = 0; j < init.length; j++) {
	    if (list[i][j] != init[j]) {
		matched=false;
		break;
	    }
	}
	if (matched) return true;
    }
    return false;
}

async function main () {
    multi.greenlog("************************************");
    multi.greenlog("  Deploying XNETLockup2.sol wallets");
    multi.greenlog("************************************");

    if (network == undefined) {
	console.log(multi.amber('no network set') +
		    ': please set evironment variable NETWORK before running');
	process.exit(1);
    }

    if (escrow == undefined) {
	console.log(multi.amber('no escrow address set') +
		    ': plese set environment variable ESCROWADDR before running');
	process.exit(1);
    }
    
    network = network.toLowerCase();
    const lockuplist='lockup2-beneficiaries.' + network + '.json';
    const deployedlist='lockup2-deployed.' + network + '.json';
    const newdeploys='lockup2-new-deploys.' + network + '.txt';
    
    const XNETLockup2 = await ethers.getContractFactory('XNETLockup2');

    console.log('reading list of previously deployed beneficiaries: '
		+ deployedlist);
    var deployed = multi.readjson(deployedlist);
    if (deployed == undefined) {
	console.log('==> empty previously deployed list, making new');
	deployed = {
	    'count': 0,
	    'beneficiaries': [ ],
	    'agents': [ ],
	    'wallets': [ ],
	};
    }
    const consistent = (deployed.count != undefined &&
			deployed.wallets.length == deployed.count &&
			deployed.agents.length == deployed.count &&
			deployed.beneficiaries.length == deployed.count);
    multi.assert(consistent,
		 "consistency check on "+deployedlist);

    console.log('reading list of new beneficiaries: ' + lockuplist)
    const bene = multi.readjson(lockuplist);
    if (bene == undefined) {
	console.log(multi.amber('beneficiary record file ' +
				lockuplist +
				' not found') +
		    ': nothing to do, exiting');
	process.exit(1);
    }

    const consistent2 = (bene.count != undefined &&
			 bene.count == bene.beneficiaries.length);
    multi.assert(consistent2,
		 "consistency check on "+lockuplist);
    
    if (!(consistent && consistent2)) process.exit(1);
    
    if (deployed.count > 0) {
	console.log('==> list of existing beneficiaries and wallet addresses');
	for (var i = 0; i < deployed.count; i++) {
	    console.log(formatBene(deployed.beneficiaries[i])
			+ ' <--> ' +
			multi.colorAddress(deployed.wallets[i]))
	}
    }
    
    if (bene.count > 0) {
	var newDeploy = [];
	for (var i = 0; i < bene.count; i++) {
	    if (listIn(deployed.beneficiaries,bene.beneficiaries[i])) {
		console.log('    * dup beneficiary ' +
			    formatBene(bene.beneficiaries[i]));
	    }
	    else {
		const ben = bene.beneficiaries[i];
		console.log('==> making wallet for ' +
			    formatBene(ben));
		deployed.beneficiaries.push(ben);
		const wallet = await XNETLockup2.deploy(ben[0],
							escrow,
							ben[1],
							ben[2]);
		console.log('==> ==> created new wallet at ' +
			    multi.colorAddress(wallet.address));
		deployed.agents.push(escrow);
		deployed.wallets.push(wallet.address);
		newDeploy.push([wallet.address,
				escrow,
				ben[0],
				ben[1],
				ben[2]]);
		
	    }
	}
	deployed.count = deployed.wallets.length;
	console.log("Updated deployed beneficiaries: ");
	multi.writejson(deployedlist,deployed);
	multi.writesimple(newdeploys,newDeploy);
	console.log("done");
    }
}


main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });

    
