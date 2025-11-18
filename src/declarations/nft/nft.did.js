export const idlFactory = ({ IDL }) => {
  const NFT = IDL.Service({
    'getAsset' : IDL.Func([], [IDL.Vec(IDL.Nat8)], []),
    'getName' : IDL.Func([], [IDL.Text], []),
    'getOwner' : IDL.Func([], [IDL.Text], []),
  });
  return NFT;
};
export const init = ({ IDL }) => {
  return [IDL.Text, IDL.Text, IDL.Vec(IDL.Nat8)];
};
