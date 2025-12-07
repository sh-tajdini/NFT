import React, { useEffect } from "react";
import logo from "../../assets/logo.png";
import { Actor, HttpAgent } from "@dfinity/agent";
import { idlFactory } from "../../../declarations/nft/nft.did.js";
import { Principal } from "@dfinity/principal";
import Button from "./‌Button";
import { opend } from "../../../declarations/opend/index";
import CURRENT_USER_ID from "../index";

function Item(props) {
  const [name, setName] = React.useState();
  const [owner, setOwner] = React.useState();
  const [image, setImage] = React.useState();
  const [button, setButton] = React.useState();
  const [priceInput, setPriceInput] = React.useState();
  const [loaderHidden, setLoaderHidden] = React.useState(true);
  const [blur, setBlur] = React.useState();
  const [sellStatus, setSellStatus] = React.useState();
  const NFTActorRef = React.useRef();
  const id = props.id;
  function principalToText(p) {
    if (!p) return null;
    if (typeof p === "string") return p;
    if (Array.isArray(p)) return p.map(principalToText).join(", ");
    if (p && typeof p.toText === "function") return p.toText();
    try {
      return JSON.stringify(p);
    } catch (e) {
      return String(p);
    }
  }
  // talk to the local replica (dfx) not the webpack dev server
  const localHost = "http://localhost:8000/";
  const agent = new HttpAgent({ host: localHost });
  //TODO: when deploying change to ic0.app, remove
  agent.fetchRootKey();
  async function loadNFT() {
    // In local development we need to fetch the root key so certificate
    // verification succeeds against the local replica. Swallow failures
    // so production doesn't break if this is called there.
    try {
      if (
        window &&
        (window.location.hostname === "localhost" ||
          window.location.hostname === "127.0.0.1")
      ) {
        await agent.fetchRootKey();
      }
    } catch (err) {
      // fetching root key can fail in production; continue and let network errors surface
      // eslint-disable-next-line no-console
      console.warn("Unable to fetch root key (continuing):", err);
    }

    const NFTActor = await Actor.createActor(idlFactory, {
      agent,
      canisterId: id,
    });

    const name = await NFTActor.getName();
    const owner = await NFTActor.getOwner();
    let imageUrl = undefined;
    try {
      const assetData = await NFTActor.getAsset();
      if (assetData) {
        const imageBytes = new Uint8Array(assetData);
        imageUrl = URL.createObjectURL(
          new Blob([imageBytes.buffer], { type: "image/png" })
        );
      }
    } catch (err) {
      // If the actor doesn't expose the asset or the call fails, log and continue
      // eslint-disable-next-line no-console
      console.warn("Failed to fetch asset from NFT actor:", err);
    }

    setName(name);
    setOwner(principalToText(owner));
    setImage(imageUrl);
    NFTActorRef.current = NFTActor;
    let nftIsListed = false;

    try {
      if (opend && typeof opend.isListed === "function") {
        nftIsListed = await opend.isListed(props.id);
      } else {
        // canister method not available locally; assume not listed
        // console.warn to aid debugging
        // eslint-disable-next-line no-console
        console.warn(
          "opend.isListed not available on actor; skipping listed check"
        );
        nftIsListed = false;
      }
    } catch (e) {
      // If the call fails, log and assume not listed so UI remains usable
      // eslint-disable-next-line no-console
      console.warn("isListed call failed:", e);
      nftIsListed = false;
    }

    // If rendering in the discover view, show Buy button and do NOT blur images
    if (props.role === "discover") {
      const originalOwner = await opend.getOriginalOwner(props.id);
      if (originalOwner && originalOwner.length > 0) {
        const ownerPrincipal = originalOwner[0];
        if (
          principalToText(ownerPrincipal) !== principalToText(CURRENT_USER_ID)
        ) {
          setBlur(undefined);
          setButton(<Button handleClick={handleBuy} text={"Buy"} />);
        }
      } else {
        setBlur(undefined);
        setButton(<Button handleClick={handleBuy} text={"Buy"} />);
      }
    } else {
      if (nftIsListed) {
        setOwner("OpenD");
        setBlur({ filter: "blur(4px)" });
        setSellStatus("Listed");
      } else {
        setButton(<Button handleClick={handleSell} text={"Sell"} />);
        setSellStatus(null);
      }
    }
  }
  useEffect(() => {
    loadNFT();
  }, []);
  let price;
  function handleSell() {
    setPriceInput(
      <input
        placeholder="Price in DANG"
        type="number"
        className="price-input"
        value={price}
        onChange={(e) => {
          price = e.target.value;
        }}
      />
    );
    setButton(<Button handleClick={sellItem} text={"Confirm"} />);
    setSellStatus("Ready to list");
  }

  // Placeholder for buy flow (to be implemented later)
  function handleBuy() {
    console.log("Buy clicked for id:", props.id);
    setSellStatus("Buy clicked");
    // TODO: implement buy flow (token transfer, purchase confirmation)
  }
  async function sellItem() {
    setBlur({ filter: "blur(4px)" });
    setLoaderHidden(false);
    setSellStatus("Listing...");
    console.log("set price =" + price);
    const listingResult = await opend.listItem(props.id, Number(price));
    console.log("listingResult =", listingResult);
    console.log("NFTActor =", NFTActorRef.current);

    if (!listingResult) {
      setSellStatus("Listing failed: no response");
      setLoaderHidden(true);
      return;
    }

    if (typeof listingResult === "string" && listingResult !== "Success") {
      setSellStatus(listingResult);
      setLoaderHidden(true);
      return;
    }

    setSellStatus("Transferring ownership to OpenD...");
    if (NFTActorRef.current) {
      const openDId = await opend.getOpenDCanisterID();
      const transferResult = await NFTActorRef.current.transferOwnership(
        openDId
      );
      console.log("transferResult =" + transferResult);
      if (transferResult === "Success") {
        setLoaderHidden(true);
        setButton();
        setPriceInput();
        setOwner("OpenD");
        setSellStatus("Listed on OpenD");
      } else {
        setLoaderHidden(true);
        setSellStatus(transferResult || "Transfer failed");
      }
    } else {
      setLoaderHidden(true);
      setSellStatus("Transfer failed: NFT actor missing");
    }
  }

  return (
    <div className="disGrid-item">
      <div className="disPaper-root disCard-root makeStyles-root-17 disPaper-elevation1 disPaper-rounded">
        <img
          className="disCardMedia-root makeStyles-image-19 disCardMedia-media disCardMedia-img"
          src={image}
          style={blur}
        />
        <div className="lds-ellipsis" hidden={loaderHidden}>
          <div></div>
          <div></div>
          <div></div>
          <div></div>
        </div>
        <div className="disCardContent-root">
          <h2 className="disTypography-root makeStyles-bodyText-24 disTypography-h5 disTypography-gutterBottom">
            {name}
            <span className="purple-text"> {sellStatus}</span>
          </h2>
          <p className="disTypography-root makeStyles-bodyText-24 disTypography-body2 disTypography-colorTextSecondary">
            Owner: {owner ? owner : "Loading..."}
          </p>
          {priceInput}
          {button}
        </div>
      </div>
    </div>
  );
}

export default Item;
