// TODO проверить неактивность приложения через несколько минут (https://developer.chrome.com/apps/event_pages)
//      вроде, при возникновении события просыпается, поэтому надо иметь периодический обмен расширения и приложения

// FIXME определять автоматически или задавать через настройки
// com port device (arduino, esp, ...)
var settings_example = {
	device: {productId: 29987, vendorId: 1}
};


var settings = {};
chrome.storage.local.get('settings', function (result) {
	if (result.settings) {
		console.info('Settings', result.settings);
		settings = result.settings;
	} else {
		console.error('Settings not found', settings_example);
	}
});

var bitrate = 9600;
var cmd_len = 4;

var connectionId;
var interval;

function onConnect(info) {
	connectionId = info.connectionId;
	console.log('connected:', connectionId);

	// поддержание активности
	if (interval) {
		clearInterval(interval);
	}
	interval = setInterval(function () {
		if (!connectionId) {
			clearConnection();
			return;
		}
		chrome.serial.getInfo(connectionId, function (connection_info) {
			// TODO проверить
			if (!connection_info) {
				clearConnection();
				return;
			}
			var len = 1;
			var buffer = new ArrayBuffer(len);
			var data = new Uint8Array(buffer);
			data[0] = 0;
			chrome.serial.send(connectionId, buffer, function (params) {
				//console.log('nop');
			});
		});
	}, 1000);

	// TODO при разрые связи сигнализировать и делать попытки переподключения, везде проверять наличие соединения

	chrome.serial.onReceive.addListener(function (info){
		var ab = info.data;
		console.log('received bytes len:', ab.byteLength);
		var dv = new DataView(ab);
		for (var i = 0; i < ab.byteLength; i++) {
			var ch = dv.getInt8(i);
			console.log(ch, ch >= 32 ? String.fromCharCode(ch) : null);
		}
		console.log('\n');
	});

}

function clearConnection () {
	connectionId = null;
	if (interval) {
		clearInterval(interval);
		interval = null;
	}
}

function sendCmd(cmd_arr) {
	console.log('send cmd:', cmd_arr);
	var buffer = new ArrayBuffer(cmd_len);
	var data = new Uint8Array(buffer);
	for (var i = 0; i < cmd_len; i++) {
		data[i] = cmd_arr[i] || 0;
	}
	chrome.serial.send(connectionId, buffer, function (params) {
		//console.log('sended');
	});
}

chrome.runtime.onMessageExternal.addListener(function (request, sender, sendResponse) {
	//console.log('app: ', request, sender, sendResponse);
	//sendResponse({mymsg: 'mymsg'});

	if (request.active === false && connectionId) {
		chrome.serial.disconnect(connectionId, function (result) {
			console.log('disconnected:', connectionId);
			clearConnection();
		});
	} else if (request.active === true && !connectionId) {
		if (settings.device) {
			chrome.serial.getDevices(function (ports) {
				for (var i = 0; i < ports.length; i++) {
					if (ports[i].productId == settings.device.productId && ports[i].vendorId == settings.device.vendorId) {
						chrome.serial.connect(ports[i].path, {bitrate: bitrate}, onConnect);
						break;
					}
				}
			});
		} else {
			console.error('settings.device not found!');
		}
	}

	if (!connectionId) {
		//console.log('No connection');
		return;
	}

	if (request.cmd !== undefined) {
		sendCmd(request.cmd);
	}

});
