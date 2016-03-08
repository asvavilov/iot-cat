// TODO см. как еще можно подключаться без id (https://developer.chrome.com/extensions/messaging)
// TODO см. как вынести в настройки
var settings_example = {
	app_id: 'neljcpcmjnjlaknhmlbljafnoamchena',
	url: 'http://yasla.net/',
	context_file: 'tab_context.bx24.js'
};


// current watched tab
var watched_tab_id = null;

var settings = {};
chrome.storage.local.get('settings', function (result) {
	if (result.settings) {
		console.info('Settings', result.settings);
		settings = result.settings;
	} else {
		console.error('Settings not found', settings_example);
	}

	setActive(watched_tab_id);
});

function setActive(tabId) {
	if (!settings.app_id) {
		console.error('settings.app_id not found!');
		watched_tab_id = null;
	} else {
		watched_tab_id = tabId || null;
	}
	if (!watched_tab_id)
	{
		chrome.browserAction.setBadgeText({text: 'off'});
		chrome.browserAction.setBadgeBackgroundColor({color: '#F00'});

		if (settings.app_id) {
			chrome.runtime.sendMessage(settings.app_id, {active: false});
		}
	}
	else
	{
		chrome.browserAction.setBadgeText({text: 'on'});
		chrome.browserAction.setBadgeBackgroundColor({color: '#0F0'});

		if (settings.app_id) {
			chrome.tabs.executeScript(
				watched_tab_id,
				{
					file: settings.context_file
				},
				function (results) {
					chrome.runtime.sendMessage(settings.app_id, {active: true});
				}
			);
		}
	}
}

function sendCmd(cmd_arr) {
	if (!settings.app_id) {
		console.error('settings.app_id not found!');
		return;
	}
	console.log('send cmd:', cmd_arr);
	chrome.runtime.sendMessage(
		settings.app_id,
		{
			cmd: cmd_arr
		}
	);
}

/*chrome.runtime.onInstalled.addListener(function() {
	console.log("Installed.");
});*/

// FIXME придумать как обойти: если открыть вкладку, ввести адрес, то после этого никакое (onCreated, onUpdated) событие не вызывается
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
	if ((watched_tab_id && watched_tab_id != tabId) || changeInfo.status != 'complete' || tab.url.indexOf(settings.url) !== 0) return;
	//console.log('onUpdated', tabId, changeInfo, tab);
	setActive(tabId);
});

chrome.tabs.onRemoved.addListener(function(tabId, removeInfo) {
	if (!watched_tab_id || watched_tab_id != tabId) return;
	//console.log('onRemoved', tabId, removeInfo);
	if (!settings.url) {
		console.error('settings.url not found!');
		return;
	}
	chrome.tabs.query({url: settings.url + '*'}, function(tabs) {
    var tab = tabs[0];
		if (tab) {
			setActive(tab.id);
		} else {
			setActive(false);
		}
	});
});

chrome.runtime.onMessage.addListener(function(msg, _, sendResponse) {
	// commands
	if (msg.active !== undefined) {
		sendCmd([1, 1, msg.active ? 1 : 0]);
	}
});

// поддержание активности (чтобы не засыпали)
setInterval(function() {
	if (!settings.app_id) {
		console.error('settings.app_id not found!');
		return;
	}
	chrome.runtime.sendMessage(settings.app_id, {status_active: !!watched_tab_id});
}, 10000);
