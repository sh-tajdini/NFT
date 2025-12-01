import Cycles "mo:base/ExperimentalCycles";
import Principal "mo:base/Principal";
import NFTActorClass "../NFT/nft";
import Debug "mo:base/Debug";
import List "mo:base/List";
import HashMap "mo:base/HashMap";


actor OpenD {
    var mapOfNFTs = HashMap.HashMap<Principal, NFTActorClass.NFT>(1, Principal.equal, Principal.hash);
    var mapOfOwners = HashMap.HashMap<Principal, List.List<Principal>>(1, Principal.equal, Principal.hash);

    public shared(msg)func mint(imgData : [Nat8],name : Text) : async Principal {
        let owner :Principal= msg.caller;
        Debug.print(debug_show(Cycles.balance()));
        Cycles.add(100_500_000_000); // add cycles to cover NFT canister creation cost
        let newNFT = await NFTActorClass.NFT(name, owner, imgData);
        Debug.print(debug_show(Cycles.balance()));
        let newNftPrincipal = await newNFT.getCanisterID();
        mapOfNFTs.put(newNftPrincipal, newNFT);
        addToOwnershipMap(owner, newNftPrincipal);
        

        return newNftPrincipal;

    };
    private func addToOwnershipMap(owner:Principal, nftId:Principal) {
        var ownedNFTs: List.List<Principal> = switch (mapOfOwners.get(owner)){  
            case null List.nil<Principal>();
            case (?result) result;        
        };
        ownedNFTs :=List.push(nftId, ownedNFTs);
        mapOfOwners.put(owner, ownedNFTs);
    };

    public query func getOwnedNFT(user:Principal) : async [Principal] {
        var userNFTs: List.List<Principal> = switch (mapOfOwners.get(user)){  
            case null List.nil<Principal>();
            case (?result) result;        
        };
        return List.toArray(userNFTs);
    }
        
};
