// XNET EpochStake test DAPP
// Created by Sint Connexa on Mon Oct 23 12:48:44 PDT 2023
// connexa@xnet.company

// XNET Mobile token
// PRODUCTION Polygon token contract address:
//const tokenAddress = "0xbC5EB84C052FD012bb902C258C9fD241b17C0005";

// TEST Goerli token contract address:
const tokenAddress = "0x956Aab11F7f56B02d7CAD167E88cAd8101e72FA0";

let epochStakeAddress = "0xdeB24bDE892e6156759005011d104A5275cE519f";

let provider;
let signer;
let tokenContract;
let epochStakeContract;
let staker = false;
let escrow = false;

function shortenAddress(address) {
    if (!address) return '';
    
    const firstPart = address.substring(0, 6); // First 4 characters
    const lastPart = address.substring(address.length - 4); // Last 4 characters
    return `${firstPart}...${lastPart}`;
}

function numberToFormat(n) {
    return Number(n).toLocaleString('en-US',
				    {minimumFractionDigits: 2,
				     maximumFractionDigits: 2})
}

function showSpinner() {
    document.getElementById("spinner").classList.remove("hidden");
}

function hideSpinner() {
    document.getElementById("spinner").classList.add("hidden");  
}

function showError(msg) {
    document.getElementById("errorMsg").innerText = msg;
    document.getElementById("errorModal").classList.remove("hidden");
}
const walletConnectButton = document.getElementById('connect-wallet');
const contractConnectButton = document.getElementById('connect-contract');
const walXnetBal = document.getElementById('wallet-xnet-balance');
const conXnetBal = document.getElementById('contract-xnet-balance');
const conXnetStakedBal = document.getElementById('contract-xnet-staked');
const errorModal = document.getElementById('errorModal');
const esaddr = document.getElementById('esaddr');

console.log(`walletConnectButton: ${walletConnectButton}`);

async function updateContractAddr(address) {
    showSpinner();
    epochStakeAddress = address;
    esaddr.value = epochStakeAddress;
    epochStakeContract = new ethers.Contract(address,
					     epochStakeABI,
					     signer);
    const balance = await epochStakeContract.getBalance(tokenAddress);
    const epochnum = await epochStakeContract.currentEpoch();
    const stakerRole = await epochStakeContract.STAKER_ROLE();
    const escrowRole = await epochStakeContract.ESCROW_ROLE();
    staker = await epochStakeContract.hasRole(stakerRole,
					      signer.getAddress());
    escrow = await epochStakeContract.hasRole(escrowRole,
					      signer.getAddress());
    var roles="You are not a staker or escrow agent"
    if (staker) {
	roles="You are the staker/beneficiary, and may withdraw unstaked assets.";
    }
    else {
	if (escrow) {
	    roles = "You have the ESCROW AGENT role, and may slash staked assets.";
	}
    }
    document.getElementById('epochnum').innerHTML=`<p>${ multi.colorAddress(address, true)} &mdash; staking epoch <b>${epochnum}</b></p><p>${roles}</p>`;
    console.log(`epochstake XNET balance ${balance}`);
    
    conXnetBal.textContent = `${numberToFormat(ethers.utils.formatEther(balance))}`;
    hideSpinner()
}

async function init() {

    // Connect to Metamask
    provider = new ethers.providers.Web3Provider(window.ethereum);
    
    // Request account access
    await provider.send("eth_requestAccounts", []);

    // Get signer
    signer = provider.getSigner();

    // Instantiate token contract
    tokenContract = new ethers.Contract(tokenAddress, erc20ABI, signer);

    updateContractAddr(epochStakeAddress);

    updateBalance()
    
    // Listen for balance changes
    tokenContract.on("Transfer", updateBalance);

    walletConnectButton.classList.add("connected");
    contractConnectButton.classList.add("connected");
    //faucetButton.disabled=false;
    let sgnraddr = await signer.getAddress();
    sgnraddr = shortenAddress(sgnraddr);
    //walletConnectButton.innerHTML = multi.colorAddress(sgnraddr, true);
    walletConnectButton.textContent = sgnraddr;
    
}

async function updateBalance() {
    const balance = await tokenContract.balanceOf(signer.getAddress());
    const balance2 = await tokenContract.balanceOf(epochStakeAddress);
    const balance3 = await epochStakeContract.getBalance(tokenAddress);
    const balance4 = await epochStakeContract.getStakedBalance(tokenAddress);
    const foo = multi.assert(
	multi.bigClose(balance2,balance3+balance4,0n),
	"staked+unstaked = total $XNET balance")
    walXnetBal.textContent =
	`${numberToFormat(ethers.utils.formatEther(balance))}`;
    conXnetBal.textContent =
	`${numberToFormat(ethers.utils.formatEther(balance3))}`;
    conXnetStakedBal.textContent =
	`${numberToFormat(ethers.utils.formatEther(balance4))}`;

}

async function transferToken() {
    const val = document.getElementById("depositAmount").value;
    if (val == '' || Number.isNaN(Number(val))) {
	showError("Bad value for witdrawal, must be number")
	return;
    }
    const amount = ethers.utils.parseEther(val)
    showSpinner();
    try {
	tokenC = new ethers.Contract(tokenAddress, erc20ABI, signer);
        const tx = await tokenC.transfer(epochStakeAddress,amount);
        await tx.wait();
        // alert("Transfered successfully!");
    } catch (error) {
        console.error("Error staking:", error);
	hideSpinner();
	showError(`Sorry, there was an error processing your request: ${error}`);
    }
    finally {
	document.getElementById("depositAmount").value = "";
	hideSpinner();
    }
}

async function withdraw() {
    const val = document.getElementById("withdrawAmount").value
    if (val == '' || Number.isNaN(Number(val))) {
	showError("Bad value for witdrawal, must be number")
	return;
    }
    const amount = ethers.utils.parseEther(val);
    if ( amount == 0) {
	let confirmed = false;

	const confirmBox = confirm("Are you sure you want to withdraw all unstaked $XNET?");
	if (!confirmBox)
	    return
    }
    showSpinner()
    try {
        const tx = await epochStakeContract.withdrawAsset(tokenAddress, amount);
        await tx.wait();
        alert("Withdrawn successfully!");
    } catch (error) {
        console.error("Error withdrawing:", error);
        alert("Error withdrawing. See console for details.");
    }
    finally {
	document.getElementById("withdrawAmount").value = "";
    }
    hideSpinner();
}


errorModal.addEventListener("click", () => { errorModal.classList.add("hidden"); })
walletConnectButton.addEventListener("click", init);

// Get query parameters from URL
const queryParams = new URLSearchParams(window.location.search);

