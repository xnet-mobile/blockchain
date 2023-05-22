// merge beneficiaries node script

const multi = require('@0x0proxy/multi');

const fs = require('fs');
require("dotenv").config();
var network = process.env.NETWORK;

const lockuplist='lockup2-beneficiaries.' + network + '.json';
const mergefile = process.argv[2]

var bene = null;

if (fs.existsSync(lockuplist)) {
    bene = multi.readjson(lockuplist);
}
else {
    multi.amberlog("empty existing beneficairies list, making new one");
    bene = { "count": 0,
	     "beneficiaries": []
	   }
}

if (!fs.existsSync(mergefile)) {
    multi.amberlog("empty new beneficairies file, nothign to do");
    process.exit(1);
}

const newbene = multi.readjson(mergefile);

// compare a new element with all existing elements, append if unique
function doinsert(orig,newelement) {
    for (var i = 0; i < orig.length; i++) {
	oe=orig[i];
	const test = (oe.length == newelement.length);
	multi.assert(test,
		     "consistenncy check on element insertion");
	if (!test) {
	    process.exit(1);
	}
	var matched=true;
	for (var j = 0; j < oe.length; j++) {
	    if (oe[j] != newelement[j]) {
		matched = false;
		break;
	    }
	}
	if (matched) {
	    multi.amberlog("duplicate found: " + newelement);
	    return;
	}
    }
    multi.greenlog("no match found - inserting " + newelement);
    orig[orig.length]=newelement;
}

for (var i = 0; i < newbene.beneficiaries.length; i++) {
    doinsert(bene.beneficiaries,newbene.beneficiaries[i]);
}

bene.count = bene.beneficiaries.length;

multi.writejson(lockuplist,bene);
multi.greenlog("done with beneficiaries updates");

