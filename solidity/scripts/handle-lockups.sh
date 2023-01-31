#! /bin/bash
echo "**********************************************************"
echo "==> processing new XNET lockups on network $NETWORK"
echo "**********************************************************"
if [ "${NETWORK}" == "" ]; then
    echo "unset NETWORK -- exiting"
    exit 1
fi
echo "deploying new vesting wallet contracts, if any"

if [ ${1} == "deploy" ]; then
    echo "deploying contracts"
    npx hardhat run --network $NETWORK scripts/deploy-XNETlockup.js
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
    npx hardhat verify --contract contracts/XNETlockup.sol:XNETLockup --network ${NETWORK} $ADDR $BEN $AGENT $START $DUR
    echo "pausing"
    sleep 2
done < lockup2-new-deploys.${NETWORK}.txt

echo "done"
