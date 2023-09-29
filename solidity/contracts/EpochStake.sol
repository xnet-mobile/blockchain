// SPDX-License-Identifier: MIT
/// @author Sint Connexa, connexa@xnet.company

pragma solidity ^0.8.3;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import "./Epoch.sol";

/**
 * EpochStake -- A staking contract. *Note* Unlike some staking
 * systems, this contract is responsible only for holding the staked
 * assets, not for generating staking payouts.

 * OVERVIEW
 *
 * The EpochStake contract holds a quantity of ERC20 tokens (or a
 * native token) as a locked stake for a specified period, or
 * epoch. It also holds unlocked tokens, and allows a designated
 * entity to slash the stake at any time.
 *
 * Two types of balances are maintained by this contract, free and
 * staked. Free balances may be added or withdrawn at any time by the
 * staker. Staked balances are locked for the duration of the current
 * epoch and are not acessible by the staker, but may be slashed by
 * a designated entity, or escrow agent.

 * SLASHING
 *
 * At any time, the escrow agent may slash, or withdraw any portion or
 * all of staked balances. The escrow agent cannot withdraw free
 * balances, which can only be withdrawn by the staker.

 * STAKE SUBTRACTION REQUESTS AND CANCELATIONS
 *
 * At any time, the staker may request a stake subtraction, which will
 * become operational at the next epoch boundary. Only zero or one
 * stake subtractions requests can be operational for any asset type -
 * if more than one such request is made for the same asset during an
 * epoch, the most recent request is the one that is honored. 
 *
 * When a stake subtraction is requested, a total is specified. If
 * that total is zero, the request is interpreted to mean the total
 * balance of the asset, i.e. the stake of that asset goes to
 * zero. Similarly, if the total subtraction request for an asset is
 * greater than the total staked, the interpretation is the total
 * balance of the asset. Otherwise, the exact amount requested is
 * subtracted from the stake.
 *
 * If a staker cancels stake subtraction for an asset, any live stake
 * subtraction request for that asset will be canceled. If no stake
 * subtraction request is live, the operation reverts.

 * EPOCH BOUNDARY TRANSITION OPERATIONS AND TRIGGER
 *
 * At the epoch boundary two operations are performed. First, any free
 * balance becomes a staked balance. *NOTE* This operation can only
 * increase total staked balances. Second, for all staked assets, zero
 * or one requested stake subtraction operations are performed. *NOTE*
 * This operation can only decrease total staked balances, and
 * increase free balances.
 *
 * Beacuse of the nature of the Ethereum blockchain, there is no
 * independent timer mechanism to trigger the epoch boundary
 * transition. Thus, an external entity must call the epoch_transition
 * method. This method compares the previous value of current_epoch
 * with the value calculated based on blockchain time. If the
 * calculated value is greater than current_epoch, then boundary
 * transition operations are performed and current_epoch is updated.

 * When an instance of EpochStake is created, current_epoch is set to
 * zero. This means that the next call to epoch_transition is very
 * likely to trigger the boundary transition. For that reason, the
 * first time this method is called, it must be called by the staker
 * or the escrow agent, to allow for the orderly transition of assets
 * into the contract before they are locked. Subsequent calls can be
 * made by anyone, as long as they are able to pay the gas.
 */

contract EpochStake is Epoch, AccessControl {
  using SafeERC20 for IERC20;

  /* Events */
  event Slash(address agent, uint256 amount);
  event Slash(address agent, address token, uint256 amount);
  event RequestStakeSubtraction(address staker, uint256 amount);
  event RequestStakeSubtraction(address staker, address token, uint256 amount);
  event CancelStakeSubtraction(address staker);
  event Snapshot(address actor, uint256 epoch, address asset, uint256 amount);
  event CancelStakeSubtraction(address staker, address token);
  event Withdraw(address staker, uint256 amount);
  event Withdraw(address staker, address token, uint256 amount);

  event EpochTransition(uint256 old_epoch, uint256 new_epoch);

  /* Roles */
  bytes32 public constant ESCROW_ROLE = keccak256("ESCROW_ROLE");
  bytes32 public constant ESCROW_ADMIN= keccak256("ESCROW_ADMIN");
  bytes32 public constant STAKER_ROLE = keccak256("STAKER_ROLE");
  bytes32 public constant STAKER_ADMIN= keccak256("STAKER_ADMIN");

  /* Public member varaibles */
  uint256 public current_epoch;
  
  /* NOTE: staked_eth must never be greater than native asset balance */
  uint256 public staked_eth;	/* quantity of native asset staked */
  
  /* amount of native asset requested to be subtracted from stake */
  uint256 public eth_subtract_request;

  /* A list of ERC20 token contract addresses - these are the ERC20
   * assets that can be staked */

  address[] public tokens;

  /* quantity of ERC20 tokens staked, must always be less than balance */
  mapping(address => uint256) public staked_erc20;

  /* amount of ERC20 tokens requested to be subtracted from stake */
  mapping(address => uint256) public erc20_subtract_request;

  /* A snapshot of an asset */
  struct AssetSnapshot {
    uint256 timestamp;
    address asset;		/* 0x0 if native asset */
    uint256 amount;
  }

  /* snapshots indexed by epoch */
  mapping(uint256 => AssetSnapshot[]) public snapshots;
  /* a flag to be set on first snapshot */
  bool public firstsnap;
  
  /* Utility Methods */

  // transfer tokens using the safeTransfer method
  function transferTokens(address tokenAddress,
			  address to,
			  uint256 amount) private {
    IERC20 token = IERC20(tokenAddress);
    token.safeTransfer(to, amount);
  }

  /* constructor just assigns staker and escrow roles */
  constructor(address stakerAddress,
	      address escrowAddress,
	      uint256 epochStart,
	      uint256 epochDur,
	      address[] memory _tokens)
    Epoch(epochStart,
	  epochDur) {
	_setRoleAdmin(ESCROW_ROLE,ESCROW_ADMIN);
	_setRoleAdmin(STAKER_ROLE,STAKER_ADMIN);
	_grantRole(STAKER_ADMIN, stakerAddress);
	_grantRole(STAKER_ROLE, stakerAddress);
	_grantRole(ESCROW_ADMIN, escrowAddress);
	_grantRole(ESCROW_ROLE, escrowAddress);

	tokens = _tokens;
    }

  /* only escrow agent or staker can call this function the first time */
  function snapshot() public {
    require(firstsnap ||
	    hasRole(ESCROW_ROLE,msg.sender) ||
	    hasRole(STAKER_ROLE,msg.sender),
	    "XNETLockup: no snapshot access");
    uint256 epoch = nextEpoch(); /* current epoch +1 */
    require (epoch > current_epoch,
	     "XNETLockup: no epoch boundary");

    /* set firstsnap flag */
    firstsnap = true;
    current_epoch = epoch;
    AssetSnapshot[] storage snapArray = snapshots[epoch];
    
    /* Process native asset */

    uint256 oldbal = staked_eth; /* record original staked balance */
    /* get current contract balance */
    uint256 balance = address(this).balance;
    /* process subtraction request */
    if (eth_subtract_request >= balance)
      eth_subtract_request = balance;
    staked_eth = balance - eth_subtract_request;
    /* zero out subtraction request */
    eth_subtract_request = 0;

    /* check for a change, emit event if so */
    if (oldbal != staked_eth) {
      emit Snapshot(msg.sender,epoch,address(0x0), staked_eth);
    }
    /* Record snapshot */ 
    AssetSnapshot memory assetsnap;
    assetsnap.timestamp = block.timestamp;
    assetsnap.asset = address(0x0);	/* native asset */
    assetsnap.amount = staked_eth;
    snapArray.push(assetsnap);
    
    /* Process ERC20 tokens */
    for (uint i = 0; i < tokens.length; i++) {
      address token = tokens[i];
      oldbal = staked_erc20[token];
      balance = IERC20(token).balanceOf(address(this));
      /* process subtraction requests */
      uint256 subval = erc20_subtract_request[token];
      if (subval >= balance)
	subval = balance;
      staked_erc20[token] = balance - subval;
      erc20_subtract_request[token]=0;
      
      /* emit event on change */
      if (oldbal != staked_erc20[token]) {
	emit Snapshot(msg.sender,epoch,token, staked_erc20[token]);
      }
      assetsnap.timestamp = block.timestamp;
      assetsnap.asset = token;
      assetsnap.amount = balance;
      snapArray.push(assetsnap);
      
    }
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
   * @dev grant staker agent role.  Available only to staker admin.
   */
    
  function grantStaker(address newagent) onlyRole(STAKER_ADMIN) public {
    require(newagent != address(0),
	    "XNETLockup: zero address agent!");
    _grantRole(STAKER_ROLE,newagent);
  }

  /**
   * @dev revoke escrow agent role.  Available only to escrow admin.
   */
    
  function revokeEscrow(address deadagent) onlyRole(ESCROW_ADMIN) public {
    _revokeRole(ESCROW_ROLE,deadagent);
  }

  /**
   * @dev revoke staker agent role.  Available only to staker admin.
   */
    
  function revokeStaker(address deadagent) onlyRole(STAKER_ADMIN) public {
    _revokeRole(STAKER_ROLE,deadagent);
  }

    
  /**
   * @dev grant escrow admin role.  Available only to escrow admin.
   */
    
  function grantEscrowAdmin(address newadmin) onlyRole(ESCROW_ADMIN) public {
    require(newadmin != address(0),
	    "XNETLockup: zero address admin!");
    _grantRole(ESCROW_ADMIN,newadmin);
  }

    /**
   * @dev grant staker admin role.  Available only to staker admin.
   */
    
  function grantStakerAdmin(address newadmin) onlyRole(STAKER_ADMIN) public {
    require(newadmin != address(0),
	    "XNETLockup: zero address admin!");
    _grantRole(STAKER_ADMIN,newadmin);
  }

  /**
   * @dev revoke escrow admin role.  Available only to escrow
   * admin. NOTE: can self-revoke, leaving no valid escrow admin.
   */
    
  function revokeEscrowAdmin(address deadadmin) onlyRole(ESCROW_ADMIN) public {
    _revokeRole(ESCROW_ADMIN,deadadmin);
  }
    
  /**
   * @dev revoke staker admin role.  Available only to staker
   * admin. NOTE: can self-revoke, leaving no valid staker admin.
   */
    
  function revokeStakerAdmin(address deadadmin) onlyRole(STAKER_ADMIN) public {
    _revokeRole(STAKER_ADMIN,deadadmin);
  }

  /**
   * Withdraw up to the full amount of non-staked ether (native token)
   * in the contract. Callable only by holders of the STAKER role. If
   * amount is zero, withdraw full amount
   */
  function withdraw(uint256 amount) public virtual onlyRole(STAKER_ROLE) {
    /* the staked balance must never be greater than the balance */
    uint256 balance = address(this).balance;
    assert(staked_eth <= balance);
    if (amount == 0) {
      amount = balance-staked_eth; /* must always be positive */
    }
    require (amount <= balance-staked_eth,
	     "XNETLockup: withdraw too big!");
    emit Withdraw(msg.sender,amount);
    Address.sendValue(payable(msg.sender),amount);
  }

  /**
   * @dev withdraw up to the full amount of the non-staked ERC20
   * token held by the contract.  Callable only by holders of the
   * STAKER_ROLE. If amount is zero, withdraw full amount.
   */
  function withdraw(address token, uint256 amount)
    public virtual onlyRole(STAKER_ROLE) {
    uint256 balance = IERC20(token).balanceOf(address(this));
    /* the staked balance must never be greater than the blance */
    assert(balance <= staked_erc20[token]);
    if (amount == 0) {
      amount = balance-staked_erc20[token];
    }
    require (amount <= balance-staked_erc20[token],
	     "XNETLockup: ERC20 witheraw too big");
    emit Withdraw(msg.sender,token,amount);
    SafeERC20.safeTransfer(IERC20(token), msg.sender, amount);
  }

  /**
   * Request subtraction of native asset from stake. Callable only by
   * holders of the STAKER_ROLE. If amount is zero, request full amount.
   */

  function subtract(uint256 amount) public virtual onlyRole(STAKER_ROLE) {
    /* the staked balance must never be greater than the balance */
    assert(staked_eth <= address(this).balance);
    if (amount == 0) {
      amount = staked_eth;
    }
    require (amount <= staked_eth,
	     "XNETLockup: subtraction too big!");
    eth_subtract_request = amount;
    emit RequestStakeSubtraction(msg.sender,amount);
  }

  /* cancel native token stake subtraction request */
  function cancelSubtract() public virtual onlyRole(STAKER_ROLE) {
    /* the staked balance must never be greater than the balance */
    assert(staked_eth <= address(this).balance);
    require (eth_subtract_request > 0,
	     "XNETLockup: no subtraction request");
    eth_subtract_request=0;
    emit CancelStakeSubtraction(msg.sender);
  }
    
  /**
   * Request subtraction of ERC20 asset from stake. Callable only by
   * holders of the STAKER_ROLE. If amount is zero, request full amount.
   */

  function subtract(address token,uint256 amount)
    public virtual onlyRole(STAKER_ROLE) {
    uint256 balance = IERC20(token).balanceOf(address(this));
    /* the staked balance must never be greater than the blance */
    assert(balance <= staked_erc20[token]);
    if (amount == 0) {
      amount = staked_erc20[token];
    }
    require (amount <= staked_erc20[token],
	     "XNETLockup: ERC20 subtraction too big");

    erc20_subtract_request[token] = amount;
    emit RequestStakeSubtraction(msg.sender,token,amount);
  }

  /**
   * Cancel subtraction request of ERC20 asset from stake. Callable only by
   * holders of the STAKER_ROLE.
   */

  function cancelSubtract(address token)
    public virtual onlyRole(STAKER_ROLE) {
    uint256 balance = IERC20(token).balanceOf(address(this));
    /* the staked balance must never be greater than the blance */
    assert(balance <= staked_erc20[token]);

    require (erc20_subtract_request[token] > 0,
	     "XNETLockup: no ERC20 subtraction request");

    erc20_subtract_request[token] = 0;
    emit CancelStakeSubtraction(msg.sender,token);
  }


  /**
   * @dev withdraw up to the full amount of staked ether (native
   * token) in the contract.  Callable only by holders of the
   * ESCROW_ROLE. If amount is zero, withdraw full amount.
   */
  function slash(uint256 amount) public virtual onlyRole(ESCROW_ROLE) {
    /* the staked balance must never be greater than the balance */
    assert(staked_eth <= address(this).balance);
    if (amount == 0) {
      amount = staked_eth;
    }
    require (amount <= address(this).balance,
	     "XNETLockup: slash too big!");
    emit Slash(msg.sender,amount);
    Address.sendValue(payable(msg.sender),amount);
  }

  /**
   * @dev withdraw up to the full amount of the staked  ERC20
   * token held by the contract.  Callable only by holders of the
   * ESCROW_ROLE. If amount is zero, withdraw full amount.
   */
  function slash(address token, uint256 amount)
    public virtual onlyRole(ESCROW_ROLE) {
    uint256 balance = IERC20(token).balanceOf(address(this));
    /* the staked balance must never be greater than the blance */
    assert(balance <= staked_erc20[token]);
    if (amount == 0) {
      amount = staked_erc20[token];
    }
    require (amount <= balance,
	     "XNETLockup: ERC20 slash too big");
    emit Slash(msg.sender,token,amount);
    SafeERC20.safeTransfer(IERC20(token), msg.sender, amount);
  }


}
