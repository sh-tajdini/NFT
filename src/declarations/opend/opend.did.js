export const idlFactory = ({ IDL }) => {
  return IDL.Service({
    'getListedNFTS' : IDL.Func([], [IDL.Vec(IDL.Principal)], ['query']),
    'getOpenDCanisterID' : IDL.Func([], [IDL.Principal], ['query']),
    'getOriginalOwner' : IDL.Func(
        [IDL.Principal],
        [IDL.Opt(IDL.Principal)],
        ['query'],
      ),
    'getOwnedNFT' : IDL.Func(
        [IDL.Principal],
        [IDL.Vec(IDL.Principal)],
        ['query'],
      ),
    'isListed' : IDL.Func([IDL.Principal], [IDL.Bool], ['query']),
    'listItem' : IDL.Func([IDL.Principal, IDL.Nat], [IDL.Text], []),
    'mint' : IDL.Func([IDL.Vec(IDL.Nat8), IDL.Text], [IDL.Principal], []),
  });
};
export const init = ({ IDL }) => { return []; };
