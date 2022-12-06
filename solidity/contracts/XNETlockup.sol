// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "@openzeppelin/contracts/finance/VestingWallet.sol";

contract XNETLockup is VestingWallet {

  /* plain vanilla implementation of VestingWallet */
  
  constructor(address beneficiaryAddress,
	      uint64 startTimestamp,
	      uint64 durationSeconds)
    VestingWallet(beneficiaryAddress,
		  startTimestamp,
		  durationSeconds) { }
}
