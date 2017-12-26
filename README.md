# React Truffle TTN Application Demo

## Configuration

1. Install Truffle globally.
    ```bash
    npm install -g truffle
    ```

2. Clone repository
    ```bash
    git clone https://github.com/async-la/ttn-eth
    cd ttn-eth
    ```
3. Set Data directory
    ```bash
    DATADIR=/path/to/mydataDir
    ```

3. Create an account
    ```bash
    geth --datadir $DATADIR account new
    ```
    NOTE: Replace <ACCOUNT_ADDRESS> in genesis.json with the address of your newly created account.

4. Create Genesis Block
    ```bash
    geth --datadir $DATADIR init ./genesis.json
    ```

5. Start Geth in console mode with RPC - NOTE: --rpccorsdomain is a wildcard for DEMO purposes only
    ```bash
    geth --datadir $DATADIR --rpc --rpccorsdomain '*' console
    ```
    In the development console, unlock your wallet and start mining
    ```bash
    > personal.unlockAccount(eth.coinbase)
    > miner.start()
    ```

5. Start Swarm
    ```bash
    swarm --bzzaccount <WALLET_ADDRESS> --datadir $DATADIR --ens-api '' -corsdomain '*'   
    ```
    In the development console, unlock your wallet and start mining
    ```bash
    > personal.unlockAccount(eth.coinbase)
    > miner.start()
    ```


5. In a new terminal window, compile and migrate the smart contracts.
    ```javascript
    truffle compile
    truffle migrate
    ```

6. Start backend service
    ```bash
    node server.js
    ```
    NOTE: Updated app-id and key in server.js to match your TTN application


6. Start front end app
    ```bash
    npm start
    ```
