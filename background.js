// Called when the user clicks on the browser action.
chrome.browserAction.onClicked.addListener(function(tab) {

  // Send a message to the active tab
  console.log("Opening UI");
  chrome.tabs.create({url:chrome.extension.getURL("page-setup.html")});


});

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    console.log("Background message recieved", request, "sender", sender);
});

chrome.extension.onRequest.addListener(function(request, sender, sendResponse) {

  switch (request.action) {

  case "save":
    var save = {};
    save[request.saveName] = request.saveContent;
    console.log("Saving", save);
    chrome.storage.sync.set(save,
      function(result) {
        console.log("Saved, sending response..");
        sendResponse({
          response: "Saved",
          saved: request.save,
          success: result
        });
      });
    break;

    case "load":
      console.log("Loading", request.load);
      chrome.storage.sync.get(request.load, function (result) {
        sendResponse({
          response: "Load",
          loaded: result
        });
      });
      break;
  }

});
