/*
Given the name of a beast, get the URL to the corresponding image.
*/
const dataURL = browser.extension.getURL("data/bloom_filter.json"); // 500KB
let nItems = 42600;
let myStorage;
const dbName = 'myDatabase';

function sendInfo(data) {
  browser.tabs.executeScript(null, { 
    file: "/content_scripts/main.js" 
  });
  const gettingActiveTab = browser.tabs.query({ active: true, currentWindow: true });
  gettingActiveTab.then((tabs) => {
    browser.tabs.sendMessage(tabs[0].id, { info: data });
  });
}

$('#btnWrite').click(function(e) {
  // sendInfo(`Getting data ..`);
  $.getJSON(dataURL, function(json) {
    const data = json; // JSON && JSON.parse(json) || $.parseJSON(json);
    // sendInfo(`Finished getting data. Time Elapsed: ${Date.now() - startTime}ms`);
    nItems = data.bkt.length;
    console.log(nItems)
    
    sendInfo(`Writing data ..`);
    const startTime = Date.now();
    switch ($('#storageSelect').val()) {
      case "IndexedDB":
        let db;
        myStorage = indexedDB;
        const request = myStorage.open(dbName, 3);
        request.onerror = function(event) {
          alert("Why didn't you allow my web app to use IndexedDB?!");
        };
        request.onsuccess = function(event) {
          db = event.target.result;
        };
        request.onupgradeneeded = function(event) {
          console.log('On upgrade');
          db = event.target.result;
          let objectStore = db.createObjectStore("bkt", { autoIncrement: true });
          // let bktObjectStore = db.transaction("bkt", "readwrite").objectStore("bkt");
          $.each(data.bkt, function(idx, element) {
            objectStore.add(element);
          });
          console.log('DONE');
          sendInfo(`Storage: ${$('#storageSelect').val()} (WRITE) <br /> Items: ${nItems} <br /> Time Elapsed: ${Date.now() - startTime}ms`);
        };
        break;
      case "LocalStorage":
        myStorage = localStorage;
        $.each(data.bkt, function(idx, element) {
          myStorage.setItem(idx, element);
        });
        sendInfo(`Storage: ${$('#storageSelect').val()} (WRITE) <br /> Items: ${nItems} <br /> Time Elapsed: ${Date.now() - startTime}ms`);
        break;
    }
  });
});

$('#btnRead').click(function(e) {
  sendInfo(`Reading data ..`);
  const result = [];
  //const startTime = Date.now();
  switch ($('#storageSelect').val()) {
    case "IndexedDB":
      let db;
      myStorage = indexedDB;
      const request = myStorage.open(dbName, 3);
      request.onerror = function(event) {
        alert("Why didn't you allow my web app to use IndexedDB?!");
      };
      request.onsuccess = function(event) {
        db = event.target.result;
        const startTime = Date.now();
        let objectStore = db.transaction("bkt").objectStore("bkt");
        // Mozilla specific
        // objectStore.getAll().onsuccess = function(event) {
        //   console.log("Got all data: ", event.target.result);
        //   sendInfo(`Storage: ${$('#storageSelect').val()} (READ) <br /> Items: ${nItems} <br /> Time Elapsed: ${Date.now() - startTime}ms`);
        // };
        objectStore.openCursor().onsuccess = function(event) {
          let cursor = event.target.result;
          if (cursor) {
            result.push(cursor.value);
            cursor.continue();
          }
          else {
            console.log('Result', result);
            sendInfo(`Storage: ${$('#storageSelect').val()} (READ) <br /> Items: ${nItems} <br /> Time Elapsed: ${Date.now() - startTime}ms`);
          }
        };
      };
      break;
    case "LocalStorage":
      myStorage = localStorage;
      for(let i = 0, n = nItems; i < n; i += 1) {
        result.push(myStorage.getItem(i));
      }
      console.log('Result', result);
      sendInfo(`Storage: ${$('#storageSelect').val()} (READ) <br /> Items: ${nItems} <br /> Time Elapsed: ${Date.now() - startTime}ms`);
      break;
  }
  
});

$('#btnReset').click(function(e) {
  localStorage.clear();
  indexedDB.deleteDatabase(dbName);
  browser.tabs.reload();
  window.close();
});