//console.log('executed content.js')

document.querySelector('body').addEventListener('click', function () {
	chrome.runtime.sendMessage({count: 1});
	setTimeout(function () {
		chrome.runtime.sendMessage({count: 0});
	}, 15000);
});

/*
chrome.runtime.sendMessage({mymsg: 'mymsg'}, function(response) {
  console.log("Background page responded: " + response);
});
chrome.runtime.onMessage.addListener(function(msg, _, sendResponse) {
  console.log("Got message from background page: " + msg);
});
*/
