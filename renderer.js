// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

const SP = require('serialport')
const tableify = require('tableify')
const delay = time => new Promise(res=>setTimeout(res,time));
  
var SerialPort;

async function listSerialPorts() {
  await SP.list().then((ports, err) => {
    if(err) {
      document.getElementById('error').textContent = err.message
      return
    } else {
      document.getElementById('error').textContent = ''
    }
    console.log('ports', ports);

    if (ports.length === 0) {
      document.getElementById('error').textContent = 'No ports discovered'
    } else {
      var buttonsBuff = [];
      ports.forEach(function (val) {
        buttonsBuff.push('<button  onclick="openConnection(\'' + val.path + '\')">Connect to ' + val.path + '</button>');
      });
      buttonsHTML = buttonsBuff.join('');
      document.getElementById('connectionButtons').innerHTML = buttonsHTML
    }

    tableHTML = tableify(ports)
    document.getElementById('ports').innerHTML = tableHTML

  })
}

async function openConnection(device) {
  console.warn("Warning! device being opened", device.isOpen, device);
  if (typeof device == "string") {
    path = device;
  } else if (typeof device == "object") {
    if (device.hasOwnProperty("binding")) {
      path = device.path;
      await device.close();
    } else {
      throw new Error("Need to find device");
    }
  } else {
    throw new Error("Invalid argument");
  }
  SerialPort = new SP(
    path,
    {
      baudRate: 115200,
      lock: true
    },
    err => {
      if (err !== null) {
        console.error(err);
      }
    }
  );
  // SerialPort = test;
  SerialPort.on('open', function() {
    console.log("port open", SerialPort);
    updateinterface();
  })
  SerialPort.on('close', function() {
    console.log("port closed");
    updateinterface();
    SerialPort = null;
  })
  SerialPort.on('error', err => {
    console.log("port error");
    console.log(err);
    updateinterface();
    SerialPort = null;
  })
}

async function updateinterface() {
  if (SerialPort && SerialPort.isOpen) {
    tableHTML = tableify(SerialPort)
    // document.getElementById('connection').innerHTML = tableHTML
    document.getElementById('connectionButtons').innerHTML = '<button id="dtr" onclick="resetDevice()">ResetDevice</button><button id="dtrTrue" onclick="setDTR(true)">DTR: true</button><button id="dtrFalse" onclick="setDTR(false)">DTR: false</button><button id="close" onclick="closeConnection()">Disconnect</button>'
  } else {
    // document.getElementById('connection').innerHTML = ""
    listSerialPorts()
  }
}

async function closeConnection() {
  if (SerialPort && SerialPort.isOpen) {
    SerialPort.close();
  }
  SerialPort = null;
  console.log(SerialPort);
  // document.getElementById('connection').innerHTML = ""
  listSerialPorts()
}

async function setDTR(bool) {
  var props = {
    rts: false,
    dtr: bool
  };
  SerialPort.set(props);
}

async function resetDevice() {
  if (SerialPort && SerialPort.isOpen) {
    console.log("  Update baud rate")
    SerialPort.update({baudRate: 1200});
    console.log("  dtr true")
    setDTR(true)
    await delay(1000)
    console.log("  dtr false")
    setDTR(false)
    await delay(1500)
    // document.getElementById('connection').innerHTML = ""
    listSerialPorts()
  } else {
    // Can't reset if there is no active connection
  }
}

// Set a timeout that will check for new serialPorts every 2 seconds.
// This timeout reschedules itself.
// setTimeout(function listPorts() {
//   listSerialPorts();
//   setTimeout(listPorts, 2000);
// }, 2000);