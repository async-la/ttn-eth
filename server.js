// TTN
const { data, application } =  require("ttn")

// @NOTE: REPLACE THE FOLLOWING VALUES TO MATCH YOUR TTN APPLICATION
const appID = ''
const accessKey = ''

// WEB3
const Web3 = require('web3');
const web3 = new Web3(new Web3.providers.HttpProvider('http://127.0.0.1:8545'));

// TRUFFLE CONTRACT
const contract = require('truffle-contract')
const TTNDeviceContract = require('./build/contracts/TTNDevice.json')
const TTNDevice = contract(TTNDeviceContract)
TTNDevice.setProvider(web3.currentProvider)

// SWARM
web3.bzz.setProvider('http://127.0.0.1:8500')

//dirty hack for web3@1.0.0 support for localhost testrpc,
// see https://github.com/trufflesuite/truffle-contract/issues/56#issuecomment-331084530
if (typeof TTNDevice.currentProvider.sendAsync !== "function") {
  TTNDevice.currentProvider.sendAsync = function() {
    return TTNDevice.currentProvider.send.apply(
      TTNDevice.currentProvider, arguments
    );
  };
}

web3.eth.getAccounts(async (error, accounts) => {
  if (error) throw error
  try {
    // Contract successfully deployed.
    const TTNDeviceInstance = await TTNDevice.deployed()
    console.log('Created Contract Instance')

    // Instantiate TTN applicationa and data clients.
    const applicationClient = await application(appID, accessKey)
    console.log('Created Application Client')

    const dataClient = await data(appID, accessKey)
    console.log('Created Data Client')

    // Register listener for uplink packets from end nodes
    console.log('Waiting for uplinks...')
    dataClient.on('uplink', async (devID, payload) => {
      try {
        console.log(`Received uplink from device ${devID} with payload: `, payload)

        // Workaround to set wallet address as device description
        const device = await applicationClient.device(devID)
        const deviceEthAddress = device.description

        // Contract call to check if device has already been registered
        const deviceExists = await TTNDeviceInstance.isDevicePresent(deviceEthAddress)

        if (deviceExists) {
          // Device Exists
          // Write BZZ hash to contract
          const uploadResult = await TTNDeviceInstance.setDeviceData(deviceEthAddress, await web3.bzz.upload(JSON.stringify(payload)), { from: accounts[0], gas: 900000 })
          console.log('New payload sumbitted', uploadResult.tx)
          return
        } else {
          console.log('New device detecting. Registering...')
          // Contract call to register device and upload payload
          const registerResult = await TTNDeviceInstance.registerDevice(deviceEthAddress, device.devEui, device.appEui, device.devAddr, { from: accounts[0], gas: 900000 })
          console.log('Registered New device', registerResult.tx)

          const uploadResult = await TTNDeviceInstance.setDeviceData(deviceEthAddress, await web3.bzz.upload(JSON.stringify(payload)), { from: accounts[0], gas: 900000 })
          console.log('New payload sumbitted', uploadResult.tx)

          return
        }
      } catch(err) {
        console.log('ERROR: ', err)
        throw err
      }
    })
  } catch(err) {
    console.log('ERROR: ', err)
    throw err
  }
})
