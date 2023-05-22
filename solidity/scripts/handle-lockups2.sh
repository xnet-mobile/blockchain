#! /bin/bash
echo "**********************************************************"
echo "==> processing new XNET lockups on network $NETWORK"
echo "**********************************************************"
if [ "${NETWORK}" == "" ]; then
    echo "unset NETWORK -- exiting"
    exit 1
fi
echo "deploying new vesting wallet contracts, if any"

if [ -n "${1}" ] && [ "${1}" == "deploy" ]; then
    if [ -n "${2}" ]; then
	echo "updating beneficiaries from CSV"
	tmpfile=$(mktemp)
	cat "${2}" >> mergedbenes.csv
	cp "lockup2-beneficiaries.${NETWORK}.json" "lockup2-beneficiaries.${NETWORK}.bak.json"
	cat "${2}" | scripts/makedates.sh > $tmpfile
	node scripts/mergebenes.js $tmpfile
    fi
    echo "deploying contracts"
    echo npx hardhat run --network $NETWORK scripts/deploy-XNETlockup2.js
    npx hardhat run --network $NETWORK scripts/deploy-XNETlockup2.js
    echo "pausing"
    sleep 10
fi

echo "verifying new vesting wallet contracts, if any"
while read -r line; do
    echo $line;
    ADDR=`echo $line | awk '{print $1}'`
    AGENT=`echo $line | awk '{print $2}'`
    BEN=`echo $line | awk '{print $3}'`
    START=`echo $line | awk '{print $4}'`
    DUR=`echo $line | awk '{print $5}'`
    npx hardhat verify --contract contracts/XNETLockup2.sol:XNETLockup2 --network ${NETWORK} $ADDR $BEN $AGENT $START $DUR
    echo "pausing"
    sleep 10
done < lockup2-new-deploys.${NETWORK}.txt

echo "done"
