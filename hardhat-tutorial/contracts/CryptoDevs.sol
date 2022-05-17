// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./IWhitelist.sol";

contract CryptoDevs is ERC721Enumerable, Ownable {
  
   //_baseTokenURI for computing {tokenURI}. 
    string _baseTokenURI;

      //  _price is the price of one Crypto Dev NFT
    uint256 public _price = 0.001 ether;

      // _paused is used to pause the contract
    bool public _paused;

      // max number of CryptoDevs
    uint256 public maxTokenIds = 20;

      // total number of tokenIds minted
    uint256 public tokenIds;

      // Whitelist contract instance
    IWhitelist whitelist;

      // boolean to keep track of presale start
    bool public presaleStarted;

      // timestamp for when presale ends
    uint256 public presaleEnded;

    modifier onlyWhenNotPaused {
        require(!_paused, "Contract currently paused");
    
        _;
    }

      
        // ERC721 constructor
       
       
    constructor (string memory baseURI, address whitelistContract) ERC721("Crypto Devs", "CD") {
        _baseTokenURI = baseURI;
        whitelist = IWhitelist(whitelistContract);
    }

      
      //startPresale starts a presale for the whitelisted addresses
    
    function startPresale() public onlyOwner {
        presaleStarted = true;
          // Set presaleEnded time = current timestamp + 1 minute
        presaleEnded = block.timestamp + 1 minutes;
    }

      /**
       //presaleMint: user mints one NFT per transaction during the presale.
       */
    function presaleMint() public payable onlyWhenNotPaused {
        require(presaleStarted && block.timestamp < presaleEnded, "Presale is not running");
        require(whitelist.whitelistedAddresses(msg.sender), "You are not whitelisted");
        require(tokenIds < maxTokenIds, "Exceeded maximum Crypto Devs supply");
        require(msg.value >= _price, "Ether sent is not correct");
        tokenIds += 1;
        //_safeMint is a safer version of the _mint function
          
        _safeMint(msg.sender, tokenIds);
    }

      
      // mint: allows user to mint 1 NFT per transaction after the presale
      
    function mint() public payable onlyWhenNotPaused {
        require(presaleStarted && block.timestamp >=  presaleEnded, "Presale has not ended yet");
        require(tokenIds < maxTokenIds, "Exceed maximum Crypto Devs supply");
        require(msg.value >= _price, "Ether sent is not correct");
        tokenIds += 1;
        _safeMint(msg.sender, tokenIds);
    }

      
      // _baseURI overides the Openzeppelin's ERC721 implementation
      
    function _baseURI() internal view virtual override returns (string memory) {
        return _baseTokenURI;
    }

      
      // setPaused makes the contract paused or unpaused
       
    function setPaused(bool val) public onlyOwner {
        _paused = val;
    }

      
    //withdraw: sends all the ether in the contract to the owner of the contract
      
    function withdraw() public onlyOwner  {
        address _owner = owner();
        uint256 amount = address(this).balance;
        (bool sent, ) =  _owner.call{value: amount}("");
        require(sent, "Failed to send Ether");
    }

       // Function to receive Ether (msg.data must be empty)
    receive() external payable {}

      // Fallback function is called when msg.data is not empty
    fallback() external payable {}
}

