# Airdrop Bot Test Checklist

Note: A collection of the current wildcard slash command commands and expected outcomes to check against during development.

Test Definitions:
- `describe` - the test scenario
- `it` - specify the expected outcome to be observed within discord
- `assert` - focused on the final outcome/ expected behavior observed in Discord UI (not the intermediate e.g. creation of Mongo Collection).

## Airdrop Admin - Slash Commands

### Test: `/airdrop-admin create-airdrop`
- Describe: `/airdrop-admin create-airdrop` should create an airdrop that's based on a role! with options: 
- Required:
    -  `Role required to receive the airdrop` 
    -   `Token ID to airdrop to the user upon receiving the role`
-  Optional:
   -  `Channel to broadcast the airdrop. If not specified, defaults to the Airdrops channel`
   -   `Duration in hours until the airdrop automatically ends`
- It: create an airdrop that's based on a role, with options of auto-conclude and desired channel to broadcast the message. 
- Assert: a new embed is created reflecting the latest active airdrop.

### Test: `/airdrop-admin edit-airdrop-duration`
- Describe: `/airdrop-admin edit-airdrop-duration` should `edit an airdrop's duration` with options:
  - Required:
    - `Role associated with the airdrop`
    - `Token ID associated with the airdrop`
    - `Duration in hours until the airdrop automatically ends (from now)`
- It: edit a live airdrop's duration by the time (in hours) specified relative to the time now.
- Assert: time should have been modified by the hours specified (date.now + hours)

### Test: `/airdrop-admin conclude-airdrop`

- Describe: `/airdrop-admin conclude-airdrop` should conclude an airdrop associated with the given role with options: 
- Required:
    -  `Role associated with the airdrop` 
    -   `Token ID associated with the airdrop`
- It: conclude an airdrop that's based on a role
- Assert: update the active embed of airdrop status to concluded. 


### Test: `/airdrop-admin reopen-airdrop`
- Describe: `/airdrop-admin reopen-airdrop` should reopen an airdrop that has ended. with options:
  - Required: 
    - `Role required to receive the airdrop`
    - `Token ID to airdrop to the user upon receiving the role`
  - Optional:
    - `Channel to broadcast the airdrop. If not specified, defaults to the Airdrops channel`
    - `Duration in hours until the airdrop automatically ends (from now`
- It: should reopen an airdrop that has previously ended
- Assert: airdrop embed should update as reopened with status as `active`


### Test: `/airdrop admin award-role`
- Describe: `/airdrop admin award-role` should Award a role to all users present in the given voice channel with options:
  - Required:
    - `Role to award`
    - `Voice channel containing members to award.`
- It: should award all users a specifier role present in the voice channel.
- Assert: guild members present in a given voice channel should receive a specified role.


## Airdrop - Slash Commands

### Test: `/airdrop get-airdrop-contract-address`

- Describe: `/airdrop get-airdrop-contract-address` should get the smart contract address for the Airdrop
- It: should retrieve the smart contract address for the airdrop, additionally returning two button "View contract" and "View collection"
- Assert: the deployed airdrop bot contract address equals the contract address of the airdrop smart contract.
  

### Test: `/airdrop get-airdrop-bot-wallet-address`

- Describe: `/airdrop get-airdrop-bot-wallet-address` should get the wallet address of the Airdrop bot
- It: should get the bot wallet address associated with the airdrop bot
- Assert: airdrop wallet address equals the owner of the smart contract 


### Test: `/airdrop view-active-airdrops`

- Describe: `/airdrop view-active-airdrops` should view all active Airdrops
- It: should be able to show all active airdrops in a tabulated embed format
- Assert: all active airdrops are equal to airdrops presented in the tabulated embed list.


### Test: `/airdrop get-token-balance`

- Describe: `/airdrop get-token-balance` should retrieve the balance of a token ID for the given address with required options `Address to retrieve the balance for` and `Token ID to retrieve balance for`
- It: should retrieve the token balance of the id for the given address
- Assert: token balance should equal the value on chain.


## Button Interaction 

### Test: `Claim Airdrop` - Button
- Describe: during a live airdrop, within the claim airdrop channel, clicking on `Claim airdrop` should instantiate a new text modal to enter a user wallet address where by a user can claim a token.
- It: should instantiate a new text input modal, whereby user provides a wallet address
- Assert: bot should reply with a congratulations message along with the airdrop recipient address

### Test: `View Airdrop` - Button
- Describe: during a live airdrop, within the claim airdrop channel, View Airdrop Button should navigate you on discord to the active airdrop embed.
- It: button should navigate back to the referenced airdrop embed.
- Assert: the claim airdrop thread `swag tokenId` and `role` is identical to the airdrop embed `swag tokenId` and `role`


### Test: `View Contract` - Button
- Describe: Upon slash command of `/airdrop get-airdrop-contract-address` the "View contract" button should take you to view the contract on https://polygonscan.com
- It: should take you to an external link https://polygonscan.com.
- Assert: the contract address of the airdrop contract should be the same as the contract address on Polygonscan


### Test: `View Collection` - Button
- Describe: Upon slash command of `/airdrop get-airdrop-contract-address` the "View Collection" button should take you to view the swag token on https://opensea.io
- It: should take you to an external link https://opensea.io
- Assert: the contract address of the airdrop contract should be the same as the contract address on OpenSea.


