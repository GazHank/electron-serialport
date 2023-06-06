// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

const { SerialPort } = require('serialport')

const { DelimiterParser } = require("@serialport/parser-delimiter");
const tableify = require('tableify')
const delay = time => new Promise(res=>setTimeout(res,time));
  
var Port, result, callbacks, supportedCommands;

async function listSerialPorts() {
  await SerialPort.list().then((ports, err) => {
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
  Port = new SerialPort(
    {
      path: path,
      baudRate: 115200,
      lock: true
    },
    err => {
      if (err !== null) {
        console.error(err);
      }
    }
  );
  // Port = test;
  Port.on('open', function() {
    console.log("port open", Port);
    updateinterface();
    parser = Port.pipe(new DelimiterParser({ delimiter: "\r\n" }));
    result = "";
    callbacks = [];
    supportedCommands = [];
    parser.on("data", data => {
      data = data.toString("utf-8");
      console.log("focus: incoming data:", data);

      if (data == ".") {
        // let result = result,
          resolve = callbacks.shift();

        this.result = "";
        if (resolve) {
          resolve(result);
        }
      } else {
        if (result.length == 0) {
          result = data;
        } else {
          result += "\r\n" + data;
        }
      }
    });
  })
  Port.on('close', function() {
    console.log("port closed!!!!!!");
    updateinterface();
    Port = null;
  })
  Port.on('error', err => {
    console.log("port error");
    console.log(err);
    updateinterface();
    Port = null;
  })
}

async function updateinterface() {
  if (Port && Port.isOpen) {
    //
    Port.get(function(error, status) {
      if (!error) {
        console.log(status);
      }
      return callback(error);
    });
    tableHTML = tableify(Port)
    document.getElementById('connection').innerHTML = tableHTML
    document.getElementById('connectionButtons').innerHTML = '<button id="dtr" onclick="resetDevice()">ResetDevice</button><button id="dtrTrue" onclick="setDTR(true)">DTR: true</button><button id="dtrFalse" onclick="setDTR(false)">DTR: false</button><button id="close" onclick="closeConnection()">Disconnect</button><button id="close" onclick="flushConnection()">Flush</button><button id="close" onclick="drainConnection()">Drain</button><button id="close" onclick="writePort()">Write Stuff</button>'
  } else {
    //
    document.getElementById('connection').innerHTML = ""
    listSerialPorts()
  }
}

async function closeConnection() {
  if (Port && Port.isOpen) {
    Port.close();
  }
  Port = null;
  console.log(Port);
  //
  document.getElementById('connection').innerHTML = ""
  listSerialPorts()
}

async function flushConnection() {
  if (Port && Port.isOpen) {
    Port.flush(function(error) {
      if (!error) {
        console.log('flush complete.');
      }
    });
  }
  console.log(Port);
  updateinterface()
}

async function drainConnection() {
  if (Port && Port.isOpen) {
    Port.drain(function(error) {
      if (!error) {
        console.log('drain complete.');
      }
    });
  }
  console.log(Port);
  updateinterface()
}

async function readConnection() {
  if (Port && Port.isOpen) {
    Port.read(function(error) {
      if (!error) {
        console.log('read complete.');
      }
    });
  }
  console.log(Port);
  updateinterface()
}

async function setDTR(bool) {
  var props = {
    lowLatency: true,
    rts: false,
    cts: bool,
    dsr: bool,
    dtr: bool
  };
  Port.set(props, function(error) {
    if (!error) {
      console.log('set complete.');
    }

    return callback(error);
  });
  await delay(50)
  Port.get(function(error, status) {
    if (!error) {
      console.log(status);
    }

    return callback(error);
  });
}

async function writePort() {
  var stri = 'hardware.layout\n';
  console.log('try write.');
  Port.write(stri);
  console.log('write complete.');
  // Buffer.from([]), function(error) {
  //   if (!error) {
  //     console.log('write complete.');
  //   }

  //   return callback(error);
  // });
}

let callback = (error, result) => {
  if (error !== null) {
  console.log("Caught error: " + String(error));
  return;
  }
  // console.log(result);
};

async function resetDevice() {
  if (Port && Port.isOpen) {
    console.log("  Update baud rate")
    Port.update({baudRate: 1200});
    console.log("  dtr true")
    setDTR(true)
    await delay(1000)
    console.log("  dtr false")
    setDTR(false)
    await delay(1500)
    //
    document.getElementById('connection').innerHTML = ""
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