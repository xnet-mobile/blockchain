// SPDX-License-Identifier: MIT
/// @author Sint Connexa, connexa@xnet.company

pragma solidity ^0.8.3;

/**
 * Epoch -- an epoch calculator. Useful for things like XNET.
 *
 *
 * XNETpochStart = 1668412800  // Star of the XNET epoch in Unix time:
 *                              // November 14th, 2022, midnight Pacific
 *
 * XNETEpochDur = 14 * 24 * 60 * 60 // 14 days in seconds
 *              = 1209600
 */

contract Epoch {
  /* constants */

  /* If either the _epochStart or _epochDur parameters of the
   * constructor are zero, the XNET values are used instead. */
  
  /* just in case you forgot the start of the XNET epoch 0 */
  /* 14 November 2022, Midnight US Pacific Time */
  uint256 public constant XNETepochStart = 1668412800;
  
  /* the duration of an XNET epoch, 14 days in seconds */
  uint256 public constant XNETepochDur = 14 * 24 * 60 * 60;
  
  /* unix time for start of epoch */
  uint256 public immutable epochStart;

  /* total number of seconds in epoch */
  uint256 public immutable epochDur;

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
    if (_epochStart == 0) 
      _epochStart = XNETepochStart;
    
    if (_epochDur == 0)
      _epochDur = XNETepochDur;

    epochStart = _epochStart;
    epochDur = _epochDur;
  }
}
