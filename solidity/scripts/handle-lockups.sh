#! /bin/bash
echo "**********************************************************"
echo "==> processing new XNET lockups on network $NETWORK"
echo "**********************************************************"
if [ "${NETWORK}" = "" ]; then
    echo "unset NETWORK -- exiting"
    exit 1
fi
echo "deploying new vesting wallet contracts, if any"
npx hardhat run --network $NETWORK scripts/deploy-XNETLockup2.js

echo "pausing"
sleep 10

echo "verifying new vesting wallet contracts, if any"
while read -r line; do
    echo $line;
    ADDR=`echo $line | awk '{print $1}'`
    BEN=`echo $line | awk '{print $2}'`
    START=`echo $line | awk '{print $3}'`
    DUR=`echo $line | awk '{print $4}'`
    npx hardhat verify --contract contracts/XNETLockup2.sol:XNETLockup2 --network ${NETWORK} $ADDR $BEN $START $DUR
    echo "pausing"
    sleep 2
done < new-deploys.${NETWORK}.json

echo "done"
