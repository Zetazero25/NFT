import { Contract, providers, utils } from "ethers";
import Head from "next/head";
import React, { useEffect, useRef, useState } from "react";
import Web3Modal from "web3modal";
import { abi, NFT_CONTRACT_ADDRESS } from "../constants";
import styles from "../styles/Home.module.css";

export default function Home() {
  // walletConnected tracks if user wallet is connected
  const [walletConnected, setWalletConnected] = useState(false);
  // presaleStarted tracks if presale started
  const [presaleStarted, setPresaleStarted] = useState(false);
  // presaleEnded tracks if presale ended
  const [presaleEnded, setPresaleEnded] = useState(false);
  // loading = true when waiting for transaction to get mined
  const [loading, setLoading] = useState(false);
  // checks if connected MetaMask wallet is owner of the contract
  const [isOwner, setIsOwner] = useState(false);
  // tokenIdsMinted tracks number of tokenIds that have been minted
  const [tokenIdsMinted, setTokenIdsMinted] = useState("0");
  // Create a reference to the Web3 Modal
  const web3ModalRef = useRef();

  
   // presaleMint: Mint NFT during presale
   
  const presaleMint = async () => {
    try {
      // need a Signer for the 'write' transaction.
      const signer = await getProviderOrSigner(true);
      // Create instance of the contract with a Signer
      
      const whitelistContract = new Contract(
        NFT_CONTRACT_ADDRESS,
        abi,
        signer
      );
      // call presaleMint from the contract
      const tx = await whitelistContract.presaleMint({
        // value signifies the cost of one nft which is "0.001" eth.
        // parsing 0.001 string to ether using the utils library from ethers.js
        value: utils.parseEther("0.001"),
      });
      setLoading(true);
      // wait for transaction to get mined
      await tx.wait();
      setLoading(false);
      window.alert("You successfully minted a Crypto Dev!");
    } catch (err) {
      console.error(err);
    }
  };

  
   //publicMint: Mint NFT after presale
   
  const publicMint = async () => {
    try {
      // We need a Signer becuase this is a write transaction.
      const signer = await getProviderOrSigner(true);
      // new instance of the Contract with a Signer
      const whitelistContract = new Contract(
        NFT_CONTRACT_ADDRESS,
        abi,
        signer
      );
      // call the mint from contract to mint the Crypto Dev
      const tx = await whitelistContract.mint({
        // value = cost of one crypto dev which is 0.001 eth.
        // parsing 0.001 string to ether using the utils library from ethers.js
        value: utils.parseEther("0.01"),
      });
      setLoading(true);
      // wait for the transaction to get mined
      await tx.wait();
      setLoading(false);
      window.alert("You successfully minted a Crypto Dev!");
    } catch (err) {
      console.error(err);
    }
  };

  
     // connectWallet: Connects the MetaMask wallet
    
  const connectWallet = async () => {
    try {
      // Get the provider from web3Modal
      await getProviderOrSigner();
      setWalletConnected(true);
    } catch (err) {
      console.error(err);
    }
  };

  
   //startPresale: starts presale for NFT Collection
  
  const startPresale = async () => {
    try {
      //need a Signer because this is a write transaction.
      const signer = await getProviderOrSigner(true);
      // new instance of Contract with a Signer
      const whitelistContract = new Contract(
        NFT_CONTRACT_ADDRESS,
        abi,
        signer
      );
      // call the startPresale from contract
      const tx = await whitelistContract.startPresale();
      setLoading(true);
      // wait for the transaction to get mined
      await tx.wait();
      setLoading(false);
      // set presale started to true
      await checkIfPresaleStarted();
    } catch (err) {
      console.error(err);
    }
  };

  
   /*checkIfPresaleStarted: checks if the presale has started by quering the presaleStarted
    variable in the contract
   */
  const checkIfPresaleStarted = async () => {
    try {
      // Get the provider from web3Modal
      //  do not need a Signer, only reading state from the blockchain
      const provider = await getProviderOrSigner();
      // connect to the Contract using a Provider, read only access to the contract
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, provider);
      // call the presaleStarted from contract
      const _presaleStarted = await nftContract.presaleStarted();
      if (!_presaleStarted) {
        await getOwner();
      }
      setPresaleStarted(_presaleStarted);
      return _presaleStarted;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  /*checkIfPresaleEnded: checks if presale has ended by quering the presaleEnded
   variable in contract
   */
  const checkIfPresaleEnded = async () => {
    try {
      // Get the provider from web3Modal, do not need a Signer
      const provider = await getProviderOrSigner();
      // connect to Contract using a Provider, read only access to contract
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, provider);
      // call the presaleEnded from the contract
      const _presaleEnded = await nftContract.presaleEnded();
      /* _presaleEnded is a Big Number, use the less than function instead of "<"
      Date.now()/1000 returns the current time in seconds
      if the _presaleEnded timestamp is less than the current time
       it means presale has ended*/
      const hasEnded = _presaleEnded.lt(Math.floor(Date.now() / 1000));
      if (hasEnded) {
        setPresaleEnded(true);
      } else {
        setPresaleEnded(false);
      }
      return hasEnded;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  
   //getOwner: calls contract to retrieve the owner
  
  const getOwner = async () => {
    try {
      // Get the provider from web3Modal, do not need Signer
      const provider = await getProviderOrSigner();
      //connect to the Contract using a Provider (Read only access to the contract)
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, provider);
      // call the owner function from contract
      const _owner = await nftContract.owner();
      //get the signer to extract address of currently connected MetaMask account
      const signer = await getProviderOrSigner(true);
      // get address associated to signer which is connected to MetaMask
      const address = await signer.getAddress();
      if (address.toLowerCase() === _owner.toLowerCase()) {
        setIsOwner(true);
      }
    } catch (err) {
      console.error(err.message);
    }
  };

  
   //getTokenIdsMinted: gets the number of tokenIds already minted
  
  const getTokenIdsMinted = async () => {
    try {
      // get the provider from web3Modal do not need Signer
      const provider = await getProviderOrSigner();
      // connect to Contract using  Provider( Read only access )
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, provider);
      // call the tokenIds from contract
      const _tokenIds = await nftContract.tokenIds();
      //_tokenIds is a Big Number, convert the Big Number to a string
      setTokenIdsMinted(_tokenIds.toString());
    } catch (err) {
      console.error(err);
    }
  };

  /**
   * Returns a Provider or Signer object representing the Ethereum RPC with or without the
   * signing capabilities of metamask attached
   *
   * @param {*} needSigner - True if you need the signer, default false otherwise
   */
  const getProviderOrSigner = async (needSigner = false) => {
    // Connect to Metamask
    const provider = await web3ModalRef.current.connect();
    const web3Provider = new providers.Web3Provider(provider);

    // If user is not connected to  Rinkeby network display an error
    const { chainId } = await web3Provider.getNetwork();
    if (chainId !== 4) {
      window.alert("Change the network to Rinkeby");
      throw new Error("Change network to Rinkeby");
    }

    if (needSigner) {
      const signer = web3Provider.getSigner();
      return signer;
    }
    return web3Provider;
  };

  // useEffects are used to react to changes in state of website
  // whenever the value of walletConnected changes - this effect will be called
  useEffect(() => {
    // if wallet is not connected create a new instance of Web3Modal & connect wallet
    if (!walletConnected) {
      // Assign the Web3Modal class to reference object by setting it's current value
      web3ModalRef.current = new Web3Modal({
        network: "rinkeby",
        providerOptions: {},
        disableInjectedProvider: false,
      });
      connectWallet();

      // Check if presale started & ended
      const _presaleStarted = checkIfPresaleStarted();
      if (_presaleStarted) {
        checkIfPresaleEnded();
      }

      getTokenIdsMinted();

      // Set an interval to get called every 5 seconds to check presale has ended
      const presaleEndedInterval = setInterval(async function () {
        const _presaleStarted = await checkIfPresaleStarted();
        if (_presaleStarted) {
          const _presaleEnded = await checkIfPresaleEnded();
          if (_presaleEnded) {
            clearInterval(presaleEndedInterval);
          }
        }
      }, 5 * 1000);

      // set an interval to get  number of token Ids minted every 5 second
      setInterval(async function () {
        await getTokenIdsMinted();
      }, 5 * 1000);
    }
  }, [walletConnected]);

  
      //renderButton: Returns a button based on state of the dapp
  const renderButton = () => {
    // If wallet is not connected return a button which allows to connect wallet
    if (!walletConnected) {
      return (
        <button onClick={connectWallet} className={styles.button}>
          Connect your wallet
        </button>
      );
    }

    // If we are currently waiting for something return a loading button
    if (loading) {
      return <button className={styles.button}>Loading...</button>;
    }

    // If connected user is owner, and presale hasnt started yet, allow them start presale
    if (isOwner && !presaleStarted) {
      return (
        <button className={styles.button} onClick={startPresale}>
          Start Presale!
        </button>
      );
    }

    // If connected user is not the owner but presale hasn't started yet return "Presale hasnt started"
    if (!presaleStarted) {
      return (
        <div>
          <div className={styles.description}>Presale hasnt started!</div>
        </div>
      );
    }

    // If presale started, but hasn't ended yet allow minting during presale period
    if (presaleStarted && !presaleEnded) {
      return (
        <div>
          <div className={styles.description}>
            Presale has started!!! If your address is whitelisted, Mint a
            Crypto Dev 🥳
          </div>
          <button className={styles.button} onClick={presaleMint}>
            Presale Mint 🚀
          </button>
        </div>
      );
    }

    // If presale started and has ended, its time public minting
    if (presaleStarted && presaleEnded) {
      return (
        <button className={styles.button} onClick={publicMint}>
          Public Mint 🚀
        </button>
      );
    }
  };

  return (
    <div>
      <Head>
        <title>Portfolio Crypto Devs</title>
        <meta name="description" content="Whitelist-Dapp" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className={styles.main}>
        <div>
          <h1 className={styles.title}>Welcome to Crypto Dev Portfolio!</h1>
          <div className={styles.description}>
            Its an NFT collection for developer Portfolio in Crypto.
          </div>
          <div className={styles.description}>
            {tokenIdsMinted}/20 have been minted
          </div>
          {renderButton()}
        </div>
        <div>
          <img className={styles.image} src="./cryptodevs/0.svg" />
        </div>
      </div>

      <footer className={styles.footer}>
        Made with &#10084; by Justice
      </footer>
    </div>
  );
}