import React, { useEffect } from "react";
import logo from "../../assets/logo.png";
import { Actor, HttpAgent } from "@dfinity/agent";
import { idlFactory } from "../../../declarations/nft/nft.did.js";
import { Principal } from "@dfinity/principal";
import Button from "./‌Button";
import { opend } from "../../../declarations/opend/index";

function Item(props) {
  const [name, setName] = React.useState();
  const [owner, setOwner] = React.useState();
  const [image, setImage] = React.useState();
  const [button, setButton] = React.useState();
  const [priceInput, setPriceInput] = React.useState();
  const id = props.id;
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
    setOwner(owner);
    setImage(imageUrl);
    setButton(<Button handleClick={handleSell} text={"Sell"} />);
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
  }
  async function sellItem() {
    console.log("set price =" + price);
    const listingResult = await opend.listItem(props.id, Number(price));
    console.log("listingResult =" + listingResult);
    if (listingResult == "Success") {
      const openDId = await opend.getOpenDCanisterID();
      const transferResult = await NFTActor.transferOwnership(openDId);
      console.log("transferResult =" + transferResult);
    }
  }

  return (
    <div className="disGrid-item">
      <div className="disPaper-root disCard-root makeStyles-root-17 disPaper-elevation1 disPaper-rounded">
        <img
          className="disCardMedia-root makeStyles-image-19 disCardMedia-media disCardMedia-img"
          src={image}
        />
        <div className="disCardContent-root">
          <h2 className="disTypography-root makeStyles-bodyText-24 disTypography-h5 disTypography-gutterBottom">
            {name}
            <span className="purple-text"></span>
          </h2>
          <p className="disTypography-root makeStyles-bodyText-24 disTypography-body2 disTypography-colorTextSecondary">
            Owner: {owner ? owner.toText() : "Loading..."}
          </p>
          {priceInput}
          {button}
        </div>
      </div>
    </div>
  );
}

export default Item;
