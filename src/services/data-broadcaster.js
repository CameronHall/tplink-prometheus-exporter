const app = require('../app');

function broadcastRealtimeUsageUpdate(deviceId, data) {
  generatePayload('realtimeUsage', deviceId, data);
}

function broadcastDailyUsageUpdate(deviceId, data) {
  generatePayload('dailyUsage', deviceId, data);
}

function broadcastMonthlyUsageUpdate(deviceId, data) {
  generatePayload('monthlyUsage', deviceId, data);
}

function broadcastPowerStateUpdate(deviceId, data) {
  generatePayload('powerState', deviceId, data);
}

function generatePayload(dataType, deviceId, data) {

  let payload = {
    dataType: dataType,
    deviceId: deviceId,
    data: data
  }

  return payload;
}


module.exports = {
  broadcastRealtimeUsageUpdate: broadcastRealtimeUsageUpdate,
  broadcastDailyUsageUpdate: broadcastDailyUsageUpdate,
  broadcastMonthlyUsageUpdate: broadcastMonthlyUsageUpdate,
  broadcastPowerStateUpdate: broadcastPowerStateUpdate,
  generatePayload: generatePayload
}