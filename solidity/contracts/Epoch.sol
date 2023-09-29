// SPDX-License-Identifier: MIT
/// @author Sint Connexa, connexa@xnet.company

pragma solidity ^0.8.3;

/**
 * Epoch -- an epoch calculator. Useful for things like XNET.
 *
 *
 * XNETEpochStart = 1668412800  // Star of the XNET epoch in Unix time:
 *                              // November 14th, 2022, midnight Pacific
 *
 * XNETEpochDur = 14 * 24 * 60 * 60 // 14 days in seconds
 *              = 1209600
 */

contract Epoch {
  /* unix time for start of epoch */
  uint256 public epochStart;

  /* total number of seconds in epoch */
  uint256 public epochDur;

  /* NOTE: currentEpoch will revert if the current time is before the
   * epochStart */

  /* internal calculator, will revert if time< epoch start */
  function epoch_calc() private view returns (uint256) {
    uint256 time = block.timestamp;
    time = time - epochStart;
    uint256 epoch = time/epochDur;
    return epoch;
  }
  
  /* Returns the current epoch, will revert if time is before the
   * epochStart */
  function currentEpoch() public view returns (uint256) {
    require(block.timestamp >= epochStart,
	    "Epoch: epoch is negative");
    return epoch_calc();
  }

  /* NOTE: nextEpoch will return 0 if current time is any time before
   * epochStart, otherwise it will return currentEpoch() + 1 */
  function nextEpoch() public view returns (uint256) {
    if (block.timestamp < epochStart) {
      return 0;
    }
    return epoch_calc() + 1;
  }

  constructor(uint256 _epochStart,
	      uint256 _epochDur) {
    epochStart = _epochStart;
    epochDur = _epochDur;
  }
}
