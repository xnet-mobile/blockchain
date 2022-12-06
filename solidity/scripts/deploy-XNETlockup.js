// vesting wallet deployment script
// created Sun Nov 27 10:44:49 PST 2022 by connexa@xnet.company

// scripts/deploy-XNETlockup.js

const multi = require('@0x0proxy/multi');
const fs = require("fs");

var network = process.env.NETWORK;

const lockuplist='lockup-beneficiaries.' + network + '.json';
const deployedlist='lockup-deployed.' + network + '.json';
const newdeploys='new-deploys.' + network + '.json';

function readjson (fname) {
    console.log('readjson called with '  + fname);
    var jsonobj = undefined;
    try {
	const data = fs.readFileSync(fname, "utf8");
	jsonobj = JSON.parse(data);
    } catch (err) {
	console.log("readjson: Error:", err);
    }
    return jsonobj;
}

function writejson(fname,thingout) {
    console.log('writejson called with ' + fname);
    const content = JSON.stringify(thingout) + "\n";
    fs.writeFileSync(fname,content, { flag: 'w' }, err => {
	if (err) {
	    console.error(err);
	    throw(err);
	}
    });
}

function writesimple(fname,thingout) {
    console.log('writesimple called with ' + fname);
    var content = "";
    for (var i=0; i <  thingout.length; i++) {
	for (var j = 0; j < thingout[i].length; j++) {
	    content = content + thingout[i][j] + " ";
	}
	content += "\n";
    }
    fs.writeFileSync(fname,content, { flag: 'w' }, err => {
	if (err) {
	    console.error(err);
	    throw(err);
	}
    });
}
    

function formatBene(bene) {
    if (bene.length == undefined ||
	bene.length != 3)
	return multi.red("<not bene: " + bene + ">");
    
    return multi.colorAddress(bene[0]) +
	" : " +
	new Date(bene[1]*1000).toISOString() +
	" -- " + new Date((bene[1]+bene[2])*1000).toISOString();
}

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
    multi.greenlog("***********************************");
    multi.greenlog("  Deploying XNETLockup.sol wallets");
    multi.greenlog("***********************************");

    if (network == null || network == undefined) {
	console.log(multi.amber('no network set') +
		    ': please set evironment variable NETWORK before running');
	process.exit(1);
    }
    network = network.toLowerCase();
    const XNETLockup = await ethers.getContractFactory('XNETLockup');

    console.log('reading list of previously deployed beneficiaries: '
		+ deployedlist);
    var deployed = readjson(deployedlist);
    if (deployed == undefined) {
	deployed = {
	    'count': 0,
	    'beneficiaries': [ ],
	    'wallets': [ ],
	};
    }
    const consistent = (deployed.count != undefined &&
			deployed.wallets.length == deployed.count &&
			deployed.beneficiaries.length == deployed.count);
    multi.assert(consistent,
		 "consistency check on "+deployedlist);

    console.log('reading list of new beneficiaries: ' + lockuplist)
    const bene = readjson(lockuplist);
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
		const wallet = await XNETLockup.deploy(ben[0],
						       ben[1],
						       ben[2]);
		console.log('==> ==> created new wallet at ' +
			   multi.colorAddress(wallet.address));
		deployed.wallets.push(wallet.address);
		newDeploy.push([wallet.address,
				ben[0],
				ben[1],
				ben[2]]);
		
	    }
	}
	deployed.count = deployed.wallets.length;
	console.log("Updated deployed beneficiaries: ");
	writejson(deployedlist,deployed);
	writesimple(newdeploys,newDeploy);
	console.log("done");
    }
}


main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });

    
