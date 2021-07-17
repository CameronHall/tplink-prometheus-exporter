const { Client } = require('tplink-smarthome-api');
const interfaces = require('os').networkInterfaces();

const devices = [];

function startDiscovery(bindAddress) {
  console.log('Starting discovery on interface: ' + bindAddress);
  var client = new Client();
  client.startDiscovery({
    deviceTypes: ['plug'],
    address: bindAddress,
    discoveryTimeout: 20000
  }).on('plug-new', registerPlug);  
}

Object.keys(interfaces)
  .reduce((results, name) => results.concat(interfaces[name]), [])
  .filter((iface) => iface.family === 'IPv4' && !iface.internal)
  .map((iface) => iface.address)
  .map(startDiscovery);


function registerPlug(plug) {
  
  if (plug.supportsEmeter) {
    console.log('Found device with energy monitor support: ' + plug.alias + ' [' + plug.deviceId + ']');
    if(!devices.includes(plug)) {
      devices.push(plug);
    }
  } else {
    console.log('Skipping device: ' + plug.alias + ' [' + plug.deviceId + ']. Energy monitoring not supported.');
  }
  
}

module.exports.getDevice = function(deviceId) {

  return devices.find(d => d.deviceId === deviceId);

};

module.exports.getAllDevices = function() {
  return devices;
}