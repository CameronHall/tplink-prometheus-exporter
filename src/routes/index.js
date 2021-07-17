const express = require('express');
const router = express.Router();

const dataFetcher = require('../services/data-fetcher');
const deviceManager = require('../services/device-manager');
const dataBroadcaster = require('../services/data-broadcaster');

const { register, Histogram, Gauge, Counter } = require('prom-client');

metrics = {
    current: new Gauge({
        name: 'kasa_current',
        help: 'Current flowing through device in Ampere.',
        labelNames: ['alias', 'id'],
    }),
    power_load: new Gauge({
        name: 'kasa_power_load',
        help: 'Current power in Watt.',
        labelNames: ['alias', 'id'],
    }),
    power_total: new Counter({
        name: 'kasa_power_total',
        help: 'Power consumption since device connected in kWh.',
        labelNames: ['alias', 'id'],
    }),
    ready_state: new Gauge({
        name: 'kasa_relay_state',
        help: 'Relay state (switch on/off).',
        labelNames: ['alias', 'id'],
    }),
    rssi: new Gauge({
        name: 'kasa_rssi',
        help: 'Wifi received signal strength indicator.',
        labelNames: ['alias', 'id'],
    }),
    voltage: new Gauge({
        name: 'kasa_voltage',
        help: 'Current voltage connected to device in Volt.',
        labelNames: ['alias', 'id'],
    }),
    metadata: new Gauge({
        name: 'kasa_metadata',
        help: 'Device metadata.',
        labelNames: ['alias', 'id', 'feature', 'model', 'sw_ver', 'ip'],
    }),
    on_time: new Gauge({
        name: 'kasa_on_time',
        help: 'Time in seconds since online.',
        labelNames: ['alias', 'id'],
    }),
    online: new Gauge({
        name: 'kasa_online',
        help: 'Device online.',
        labelNames: ['alias', 'id'],
    }),
}

function populateMetrics() {
    devices = sortDevices(deviceManager.getAllDevices());
    metrics.power_total.reset();
        
    devices.forEach((device) => {    
        let deviceInfo = device._sysInfo;
        let cachedData = dataFetcher.getCachedData(device.id);
        let realtimeUsage = dataBroadcaster.generatePayload('realtimeUsage', device.alias, cachedData.realtimeUsage).data;
        let powerState = dataBroadcaster.generatePayload('powerState', device.id, cachedData.powerState).data

        metrics.current.labels(device.alias, device.id).set(realtimeUsage['current']);
        metrics.power_load.labels(device.alias, device.id).set(realtimeUsage['power']);
        metrics.ready_state.labels(device.alias, device.id).set(+ powerState['isOn']);
        metrics.voltage.labels(device.alias, device.id).set(realtimeUsage['voltage']);
        metrics.rssi.labels(device.alias, device.id).set(deviceInfo.rssi)
        metrics.metadata.labels(
            device.alias, 
            device.id,
            deviceInfo.feature,
            deviceInfo.model,
            deviceInfo.sw_ver,
            device.host
        ).set(1);
        metrics.on_time.labels(device.alias, device.id).set(powerState['uptime']);
        metrics.online.labels(device.alias, device.id).set(+ (device.status === 'online'));
        metrics.power_total.inc({alias: device.alias, id: device.id}, realtimeUsage['total']);
        

    })
   return register.metrics();
}

router.get('/', function(req, res) {
  let payload = {};
  devices = sortDevices(deviceManager.getAllDevices());
  devices.forEach((device) => { 
    
    let deviceId = device.alias;
    let cachedData = dataFetcher.getCachedData(device.id);

    payload[device.alias] = {
        'realtimeUsage': dataBroadcaster.generatePayload('realtimeUsage', deviceId, cachedData.realtimeUsage).data,
        'dailyUsage': dataBroadcaster.generatePayload('dailyUsage', deviceId, cachedData.dailyUsage),
        'monthlyUsage': dataBroadcaster.generatePayload('monthlyUsage', deviceId, cachedData.monthlyUsage),
        'powerState': dataBroadcaster.generatePayload('powerState', deviceId, cachedData.powerState).data,
    };
  })
     
  return res.json(payload);
});

router.get('/kasa', (req, res) => {
    return populateMetrics().then(metrics => res.send(metrics))
})

function sortDevices(devices) {
  return devices.slice().sort((a, b) => {
    return a.alias.toLowerCase().localeCompare(b.alias.toLowerCase())
  })
}

module.exports = router;