import Cycles "mo:base/ExperimentalCycles";
import Principal "mo:base/Principal";
import NFTActorClass "../NFT/nft";
import Debug "mo:base/Debug";
actor OpenD {
    public shared(msg)func mint(imgData : [Nat8],name : Text) : async Principal {
        let owner :Principal= msg.caller;
        Debug.print(debug_show(Cycles.balance()));
        Cycles.add(100_500_000_000); // add cycles to cover NFT canister creation cost
        let newNFT = await NFTActorClass.NFT(name, owner, imgData);
        Debug.print(debug_show(Cycles.balance()));
        let newNftPrincipal = await newNFT.getCanisterID();

        return newNftPrincipal;

    };
};
