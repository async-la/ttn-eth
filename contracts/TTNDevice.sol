pragma solidity ^0.4.17;

contract TTNDevice {
    // contract owner
    address private owner;

    // IoT device data
    struct Device {
        // link for detecting devices
        uint index;

        string devEUI;
        string appEUI;
        string deviceNetworkAddress;

        // blockchain timestamps stored swarm hashes
        uint[] timestamps;

        // map timestamp values to swarm file hashes
        mapping(uint => string) filehashes;
    }

    // map device id's to their data (one data per id)
    mapping(address => Device) private devices;

    // keep a separate device id array of all received id's
    address[] private deviceIndex;

    // event to log action
    event RegisterDevice (address indexed deviceId);
    event SetDeviceData (address indexed deviceId, uint timestamp, string filehash);

    // constructor
    function TTNDevice() public {
        owner = msg.sender;
    }

    function registerDevice(address deviceId, string devEUI, string appEUI, string deviceNetworkAddress) public {
        if (isDevicePresent(deviceId)) revert();
        devices[deviceId].index = deviceIndex.push(deviceId) - 1;
        devices[deviceId].devEUI = devEUI;
        devices[deviceId].appEUI = appEUI;
        devices[deviceId].deviceNetworkAddress = deviceNetworkAddress;
        RegisterDevice(deviceId);
    }

    // push specific device data handle into the chain
    function setDeviceData (address deviceId, string filehash) public {
        if (!isDevicePresent(deviceId)) revert();

        uint ts = now;
        devices[deviceId].timestamps.push(ts);
        devices[deviceId].filehashes[ts] = filehash;

        // trigger event
        SetDeviceData(deviceId, ts, filehash);
    }

    function isDevicePresent (address deviceId) public constant returns (bool result) {
        if (deviceIndex.length == 0) return false;

        // return true if device exists
        return (deviceIndex[devices[deviceId].index] == deviceId);
    }

    function getDevice (address deviceId) public constant returns (string devEUI, string appEUI, string deviceNetworkAddress) {
        if (!isDevicePresent(deviceId)) revert();

        // copy the data into memory
        Device memory d = devices[deviceId];

        // break the struct's members out into a tuple
        // in the same order that they appear in the struct
        return (d.devEUI, d.appEUI, d.deviceNetworkAddress);
    }

    // get received data at a certain timestamp for a specific device
    function getDeviceData (address device_id, uint timestamp) public constant returns (string bzzHash) {
        if(!isDevicePresent(device_id)) revert();
        return devices[device_id].filehashes[timestamp];
    }

    // get all data timestamps for a specific device
    function getDeviceTimestamps (address device_id) public constant returns (uint[] timestamp) {
        if(!isDevicePresent(device_id)) revert();
        return devices[device_id].timestamps;
    }

    // get total device count
    function getDeviceCount() public constant returns (uint count) {
        return deviceIndex.length;
    }

    // get device address from index
    function getDeviceAtIndex (uint index) public constant returns (address deviceId) {
        return deviceIndex[index];
    }

    // kills contract and sends remaining funds back to creator
    function kill() public {
        if (msg.sender == owner) {
            selfdestruct(owner);
        }
    }
}
