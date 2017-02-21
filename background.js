// Called when the user clicks on the browser action.
chrome.browserAction.onClicked.addListener(function(tab) {

  // Send a message to the active tab
  console.log("Opening UI");
  chrome.tabs.create({url:chrome.extension.getURL("page-setup.html")});



  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
      console.log("Background message recieved", request, "sender", sender);
      if (request.setup) {
        console.log("Adding listeners"); 
      }
    });

});
