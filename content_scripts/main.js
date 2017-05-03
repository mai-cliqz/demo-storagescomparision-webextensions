
function main(request, sender, sendResponse) {
  removeEverything();
  insertInfo(request.info);
  chrome.runtime.onMessage.removeListener(main);
}


function removeEverything() {
  while (document.body.firstChild) {
    document.body.firstChild.remove();
  }
}


function insertInfo(info) {
  var infoElement = document.createElement("div");
  infoElement.innerHTML = info;
  document.body.appendChild(infoElement);
}

/*
Assign beastify() as a listener for messages from the extension.
*/
chrome.runtime.onMessage.addListener(main);