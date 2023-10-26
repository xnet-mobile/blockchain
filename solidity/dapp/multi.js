// mutli.js
// utiltiy module for developing, testing, and deploying solidity code
// born on 14 Jan 2022, created by 0x0proxy.eth
// Licensed under the MIT License

// This is a collection of simple tools and utility functions that
// we've found helpful in developing smart contracts in Solidity using
// hardhat.
//
// Intended use is:
// const multi = require('multi');
// inside a Node.js script foo.js that is being run by means of:
// npx hardhat run --network <yournetwork> foo.js
//
// Multi.js is a bit of a mishmash; hence the mutlitool name.  Some or
// all of this script's functionality is available elsewhere but with
// annoyingly excessive dependencies or with frustrating limitations.
// I hate the massive dependency rush you get with "npm install," so I
// wanted to create a light-weight support script that had nearly all
// of what I used on a routine basis, all in once place.
//
// The testing/assert stuff can be found in dedicated testing
// frameworks, but under hardhat at the time of this writing it was
// impossible to do certain basic things inside the frameworks (such
// as modify the frequency of block updates, or assert exceptions)
// without doing really awkward things that involved combining
// otherwise incompatible test frameworks
//
// There is even a little truffle-like deployment management in the
// form of a simple utility to record the latest contract deployment
// addresses.
//
// Hope you find this useful, please feel free to make
// improvements. If you do, I hope you will commit them back to the
// multitool repo on a branch and make a pull request.

//const debug = true;
const debug = false;

var multi = {};

// ***************************
// dependencies
// ***************************

// const ethers = require('ethers');

// ******************************************
// Terminal output color formatting
// ******************************************

// colors for console formatting
multi.cdict = {
    "Reset":  "\x1b[0m",
    "Bright": "\x1b[1m",
    "Dim": "\x1b[2m",
    "Underscore": "\x1b[4m",
    "Blink": "\x1b[5m",
    "Reverse": "\x1b[7m",
    "Hidden": "\x1b[8m",

    "FgBlack": "\x1b[30m",
    "FgRed": "\x1b[31m",
    "FgGreen": "\x1b[32m",
    "FgYellow": "\x1b[33m",
    "FgBlue": "\x1b[34m",
    "FgMagenta": "\x1b[35m",
    "FgCyan": "\x1b[36m",
    "FgWhite": "\x1b[37m",
    
    "BgBlack": "\x1b[40m",
    "BgRed": "\x1b[41m",
    "BgGreen": "\x1b[42m",
    "BgYellow": "\x1b[43m",
    "BgBlue": "\x1b[44m",
    "BgMagenta": "\x1b[45m",
    "BgCyan": "\x1b[46m",
    "BgWhite": "\x1b[47m"
}

// various color formatting functions

multi.colorstring = function(c,s) {
    str = multi.cdict[c]+s+multi.cdict['Reset'];
    return str;
}

multi.blue = function(s) {
    return multi.colorstring('FgBlue',s);
}
multi.red = function(s) {
    return multi.colorstring('FgRed',s);
}

multi.green = function (s) {
    return multi.colorstring('FgGreen',s);
}

multi.amber = function (s) {
    return multi.colorstring('FgYellow',s);
}

multi.bluelog = function(s) {
    console.log(multi.blue(s));
}
multi.greenlog = function(s) {
    console.log(multi.green(s));
}
multi.redlog = function(s) {
    console.log(multi.red(s));
}
multi.amberlog = function(s) {
    console.log(multi.amber(s));
}



// ****************************************
// lightweight assert testing support
// ****************************************

// **************************************************
// functions for testing closeness of inexact numbers

multi.smallEpsilon= 1.0e-6;
multi.bigEpsilon = 10n**15n;

// Test closeness of floating-point values. Return true if values are
// within epsilon, by default multi.smallEpsilon

multi.close = function(s1,s2,epsilon=multi.smallEpsilon) {
    return Math.abs(s1 - s2) <= epsilon;
}

// bigClose() is intended for testing closeness of big-number values
// denominated in ether or similar.  By default bigEpsilon is 10^15,
// since we assume a fixed point denominator of 10^18, and slop for
// gas fees.  Epsilon can be set to a small value (say, 1) if a test
// for true equality is warranted.

multi.bigClose = function(b1,b2,
			    epsilon=multi.bigEpsilon) {
    b1 = BigInt(String(b1));
    b2 = BigInt(String(b2));
    if (debug) {
	multi.bluelog("debug: b1: " + b1 +
			", b2: " + b2 +
			", epsilon: " + epsilon);
    }
			
    if (b1 > b2) {
	if (debug) {
	    multi.bluelog("debug: b1-b2: " + b1 - b);
	}
	//return (b1.sub(b2)).lt(epsilon);
	return (b1 - b2) <= epsilon;
    }
    if (debug) {
	//multi.bluelog("debug: b2-b1: " + b2.sub(b1) );
	multi.bluelog("debug: b2-b1: " + b2 - b1 );
    }
    // return (b2.sub(b1)).lt(epsilon);
    return (b2 - b1) <= epsilon;
    //return (b2.sub(b1)).lt(epsilon);
}

// ***************************************************************
// This is a simple set of tools for asserting, recording, reading,
// and writing test records.

multi.total = 0;
multi.pass = 0;
multi.fail = 0;

// clear the pass-fail record
multi.clearCount = function() {
    multi.pass = 0;
    multi.fail = 0;
    multi.total= 0;
}

// basic assert, won't handle exceptions (do that yourself if you need it)
multi.assert = function(condition, passmsg="", failmsg=""){
    if (failmsg == "") {
	failmsg = passmsg;
    }
    if (condition) {
	multi.total ++;
	multi.pass ++;
	console.log(multi.amber("assertion: ") +
		    multi.green(passmsg + " -- PASS"));
    }
    else {
	multi.total++;
	multi.fail ++;
	console.log(multi.amber("assertion: ") +
		    multi.red(failmsg + " -- FAIL"));
    }
}

// Expect a revert -- this is a bit of a hack, but appears to work
// with Node.js scripts running under hardhat
multi.expectRevert = function (promisething, errmessage,
				 passmsg="", failmsg="") {
    promisething.then((resolved,rejected) => {
	failmsg = 'no exception: ' + passmsg;
	multi.assert(false,passmsg,failmsg);
	return("no exception");
    }).catch(e=> {
	// console.log(multi.introspect(e,true));
	if (e.name == "ProviderError") {
	    // console.log(" --> " + e);
	    // console.log(" --> " + mylib.introspect(e,true));
	    failmsg = 'incorrect exception: ' + e.toString() +
		' - ' + passmsg;
	    multi.assert(e.toString().includes(errmessage),
			   passmsg, failmsg);
	    return('provider error with message');
	} else if (typeof(e.error) != "undefined") {
	    failmsg = 'incorrect exception: ' + e.error + ' - ' +failmsg;
	    multi.assert((e.error).toString().includes(errmessage),
			   passmsg, failmsg);
	    return('exception with error message');
	}
	failmsg = 'bad exception type: ' + passmsg;
	multi.assert(false,passmsg,failmsg);
	return('exception with bad type');
    });
}

// ****************************************
// Misc useful functions and constants
// ****************************************

// zero address for contracts
multi.zeroAddress='0x0000000000000000000000000000000000000000';

// timeout function for introducing delay in test scripts with await
multi.timeoutPromise = function (interval) {
    return new Promise((resolve, reject) => {
	setTimeout(function(){
	    resolve("done");
	}, interval);
    });
};

// convert a number to a bignum representation denominated in ether,
// or similar 10^18 denominator fixpoint
multi.toEth = function (val,
			  precise = 10,
			  denom = 10n ** 18n) {
    var v = parseFloat(val).toPrecision(precise) * (10**precise);
    return BigInt(Math.round(v)) * denom / (10n ** BigInt(precise));
}

// do some object introspection -- often useful for debugging
multi.introspect = function(obj,console=false) {
    var proplist = "";
    for (var propName in obj) {
	if(typeof(obj[propName]) != "undefined") {
	    if (proplist != "") proplist +=", ";
	    if (console)
		proplist += (multi.amber(propName) + " = " +
			     multi.green(obj[propName]) );
	    else
		proplist += (propName + " = " + obj[propName] );
	    
	}
    }
    return proplist;
}

// ******************************
// string formatting functions

// utility function for string formatting Eth
multi.ethForm =  function(bal,units=false) {
    const num = Number(bal);
    const sym= units ? "Ξ" : "";
    return sym + num.toLocaleString().split(".")[0] + "."
        + num.toFixed(4).split(".")[1];
}

// function to use color to make wallet addresses visually distinct.
// For HTML formatting assums you have CSS with appropriate color
// assignments for the relevant classses, e.g. (for dark background):
//
// .addr-letter {
//    color: yellow;
// }
//
// .addr-number {
//    color: lightgreen;
// }

multi.colorAddress= function (adr,html=false) {
    const address = String(adr);
    // If it doesn't look like an address, don't do anything to it
    if (address.substr(0,2) != "0x") {
	return adr;
    }
    // Otherwise, iterate through and build a colored representation
    var rval = ""
    for (var i=0; i < address.length; i++) {
	var s = address[i];
	if (isNaN(Number(s))) {
	    if (html) {
		rval +='<span class="addr-number">'+s+'</span>';
	    }
	    else {
		rval += multi.amber(s);
	    }
	}
	else {
	    if (html) {
		rval +='<span class="addr-letter">'+s+'</span>';
	    }
	    else {
		rval += multi.green(s);
	    }
	}
    }
    return rval;
}
