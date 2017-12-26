import React, { Component } from 'react'
import TTNDeviceContract from '../build/contracts/TTNDevice.json'
import Web3 from 'web3'
import './App.css'

const web3 = new Web3(new Web3.providers.HttpProvider('http://127.0.0.1:8545'));
const contract = require('truffle-contract')
const TTNDevice = contract(TTNDeviceContract)

class App extends Component {
  _TTNContractInstance = null

  state = {
    deviceCount: 0,
    devices: [],
    selectedDeviceTimestamps: [],
    selectedTimestamp: null,
  }

  async componentWillMount() {
    await this._registerProviders()
    await this._syncContent()
    this._registerListeners()
  }

  async _registerProviders() {
    TTNDevice.setProvider(web3.currentProvider)
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
  }

  async _registerListeners() {
    this._SetDeviceData = await this._TTNContractInstance.SetDeviceData();
    this._SetDeviceData.watch((error, result) => {
      console.log('## New Event: ', result)
      // this._syncContent()
    })
  }

  async _syncContent() {
    this._TTNContractInstance = await TTNDevice.deployed()
    // Or pass a callback to start watching immediately

    const deviceCount = await this._TTNContractInstance.getDeviceCount()
    this.setState({ deviceCount: deviceCount.toString(10) })

    const devices = await this.getDevicesByIndexAsync()
    this.setState({ devices, selectedDeviceAddress: devices[0] })
    this.getDeviceTimestamps(this.state.selectedDeviceAddress)
  }

  getDevicesByIndexAsync = async () => {
    let test = []
    for (let i = 0; i < this.state.deviceCount; i++) {
      test.push(this._TTNContractInstance.getDeviceAtIndex(i))
    }
    return Promise.all(test)
  }

  getDevicePayloadAsync = async (address, timestamp) => {
    const bzzHash = await this._TTNContractInstance.getDeviceData(address, timestamp)
    const rawPayload = await web3.bzz.download(bzzHash)
    const formattedPayload = new TextDecoder("utf-8").decode(rawPayload)

    this.setState({ selectedTimestamp: timestamp, selectedPayload: formattedPayload })

    return formattedPayload
  }

  getDeviceTimestamps = async (address) => {
    if (!address) return
    const selectedDevice = await this._TTNContractInstance.getDeviceTimestamps(address)

    // Convert BigNumber to string
    const parsedTimestamps = selectedDevice.map(timestamp => timestamp.toString(10))
    this.setState({ selectedDeviceTimestamps: parsedTimestamps })
  }

  renderSelectBox = () => {
    return (
      <select name="text" onChange={event => this.getDeviceTimestamps(event.target.value)}>
        {this.state.devices.map((device, index) => {
          return <option value={device}>{device}</option>
        })}
      </select>
    )
  }

  renderSelectedDevice = () => {
    return this.state.selectedDeviceTimestamps.map(timestamp => {
      return <button style={{backgroundColor: timestamp === this.state.selectedTimestamp && 'green'}} value={timestamp} onClick={event => this.getDevicePayloadAsync(this.state.selectedDeviceAddress, event.target.value)}>{timestamp}</button>
    })
  }

  render() {
    return (
      <div className="container">
        <p>Device Count {this.state.deviceCount}</p>
        <label>Select Device</label>
        {this.renderSelectBox()}
        <div>
          <p>Device Uplink Timestamps</p>
          {this.renderSelectedDevice()}
          <p>Payload</p>
          {this.state.selectedPayload}
        </div>
      </div>
    );
  }
}

export default App
