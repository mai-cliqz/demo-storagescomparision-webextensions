/*
Given the name of a beast, get the URL to the corresponding image.
*/
const dataURL = chrome.extension.getURL("data/bloom_filter.json"); // 500KB
let nItems = 42600;
let myStorage;
const dbName = 'myDatabase';

function sendInfo(data) {
  chrome.tabs.executeScript(null, {
    file: "/content_scripts/main.js" 
  });
  return new Promise((resolve, reject) => {
    chrome.tabs.query({ active: true, currentWindow: true }, resolve);
  }).then((tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, { info: data });
  })
}

$('#btnWrite').click(function(e) {
  $.getJSON(dataURL, function(json) {

    const data = json; // JSON && JSON.parse(json) || $.parseJSON(json);
    // sendInfo(`Finished getting data. Time Elapsed: ${Date.now() - startTime}ms`);
    nItems = data.bkt.length;
    console.log(nItems);
  
    sendInfo(`Writing data ..`);
    
    const startTime = Date.now();
    switch ($('#storageSelect').val()) {
      case "IndexedDB":
        let db;
        myStorage = indexedDB;
        const request = myStorage.open(dbName, 5);
        request.onerror = function(event) {
          // alert("Why didn't you allow my web app to use IndexedDB?!");
        };
        request.onsuccess = function(event) {
          db = event.target.result;
        };
        request.onupgradeneeded = function(event) {
          $('#btnWrite').text('AAA');
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
      case "ChromeStorage":
        myStorage = chrome.storage;
        let values = {};
        $.each(data.bkt, function(idx, element) {
          values[idx] = element;
        });
        myStorage.local.set(values, function() {
          sendInfo(`Storage: ${$('#storageSelect').val()} (WRITE) <br /> Items: ${nItems} <br /> Time Elapsed: ${Date.now() - startTime}ms`);
        });
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
  const startTime = Date.now();
  switch ($('#storageSelect').val()) {
    case "IndexedDB":
      let db;
      myStorage = indexedDB;
      const request = myStorage.open(dbName, 5);
      request.onerror = function(event) {
        // alert("Why didn't you allow my web app to use IndexedDB?!");
      };
      request.onsuccess = function(event) {
        db = event.target.result;
        let objectStore = db.transaction("bkt").objectStore("bkt");
        // Mozilla specific (now supported in Chrome ?)
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
    case "ChromeStorage":
      myStorage = chrome.storage;
      myStorage.local.get(null, function(items) {
        for(key in items) {
          result.push(items[key]);
        }
        console.log('Result', result);
        sendInfo(`Storage: ${$('#storageSelect').val()} (READ) <br /> Items: ${nItems} <br /> Time Elapsed: ${Date.now() - startTime}ms`);
      });
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
  chrome.storage.local.clear();
  chrome.tabs.reload();
  window.close();
});