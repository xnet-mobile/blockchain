// SPDX-License-Identifier: MIT
/// @author Sint Connexa, connexa@xnet.company

pragma solidity ^0.8.2;

import "@openzeppelin/contracts/finance/VestingWallet.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * An extension of OpenZeppelin's VestingWallet contract with an
 * escrow role. The holder(s) of the escrow role are able to slash the
 * holdings of the vesting contract at any time, withdrawing up to the
 * full amount of any ether (native token) or ERC20 token held in the
 * wallet.  
 */

contract XNETLockup2 is VestingWallet, AccessControl {
    event Slash(address agent, uint256 amount);
    event Slash(address agent, address token, uint256 amount);
    
    bytes32 public constant ESCROW_ROLE = keccak256("ESCROW_ROLE");
    bytes32 public constant ESCROW_ADMIN= keccak256("ESCROW_ADMIN");
  
    constructor(address beneficiaryAddress,
		address escrowAddress,
		uint64 startTimestamp,
		uint64 durationSeconds)
	VestingWallet(beneficiaryAddress,
		      startTimestamp,
		      durationSeconds) {
	_setRoleAdmin(ESCROW_ROLE,ESCROW_ADMIN);
	_grantRole(ESCROW_ADMIN, escrowAddress);
	_grantRole(ESCROW_ROLE, escrowAddress);
    }

    /**
     * @dev grant escrow agent role.  Available only to escrow admin.
     */
    
    function grantEscrow(address newagent) onlyRole(ESCROW_ADMIN) public {
	require(newagent != address(0),
		"XNETLockup: zero address agent!");
	_grantRole(ESCROW_ROLE,newagent);
    }

    /**
     * @dev revoke escrow agent role.  Available only to escrow admin.
     */
    
    function revokeEscrow(address deadagent) onlyRole(ESCROW_ADMIN) public {
	_revokeRole(ESCROW_ROLE,deadagent);
    }

    
    /**
     * @dev grant escrow admin role.  Available only to escrow admin.
     */
    
    function grantAdmin(address newadmin) onlyRole(ESCROW_ADMIN) public {
	require(newadmin != address(0),
		"XNETLockup: zero address admin!");
	_grantRole(ESCROW_ADMIN,newadmin);
    }

    /**
     * @dev revoke escrow admin role.  Available only to escrow
     * admin. NOTE: can self-revoke, leaving no valid escrow admin.
     */
    
    function revokeAdmin(address deadadmin) onlyRole(ESCROW_ADMIN) public {
	_revokeRole(ESCROW_ADMIN,deadadmin);
    }
    
    /**
     * @dev withdraw up to the full amount of ether (native token)
     * held by the contract.  Callable only by holders of the
     * ESCROW_ROLE. If amount is zero, withdraw full amount.
     */
    function slash(uint256 amount) public virtual onlyRole(ESCROW_ROLE) {
	if (amount == 0) {
	    amount = address(this).balance;
	}
	require (amount <= address(this).balance,
		 "XNETLockup: slash too big!");
	emit Slash(msg.sender,amount);
	Address.sendValue(payable(msg.sender),amount);
    }

    /**
     * @dev withdraw up to the full amount of the specified ERC20
     * token held by the contract.  Callable only by holders of the
     * ESCROW_ROLE. If amount is zero, withdraw full amount.
     */
  function slash(address token, uint256 amount)
      public virtual onlyRole(ESCROW_ROLE) {
      uint256 balance = IERC20(token).balanceOf(address(this));
      if (amount == 0) {
	amount = balance;
      }
      require (amount <= balance,
	       "XNETLockup: ERC20 slash too big");
      emit Slash(msg.sender,token,amount);
      SafeERC20.safeTransfer(IERC20(token), msg.sender, amount);
  }
      
}
