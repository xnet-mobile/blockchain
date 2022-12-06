// XNET contracts/library deployment script
// created Sun May  8 22:23:20 PDT 2022 by connexa@xnet.company

// scripts/deploy-XNET.js

const multi = require('@0x0proxy/multi');

const Xcontractinfo='xnet.address.txt';
var xnetContractAddr = '';

async function main () {

    multi.greenlog("***********************************");
    multi.greenlog("  Deploying XNET.sol");
    multi.greenlog("***********************************");

    const XNET = await ethers.getContractFactory('XNET');
    const xNet = await XNET.deploy();
    multi.writeContractAddress(Xcontractinfo,xNet.address);
    console.log('==> XNET deployed to:',
		multi.amber(xNet.address));

    
    
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
