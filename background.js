// background.js
let nativePort = null;
const pendingDownloads = new Set();

function connectToNativeApp() {
  try {
    nativePort = chrome.runtime.connectNative('com.example.root_analyzer');
    console.log('Connected to native app');
    
    nativePort.onMessage.addListener((response) => {
      if (response.status === 'success') {
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icons/icon48.png',
          title: 'Analysis Complete',
          message: 'PDF should open automatically'
        });
      }
    });
    
    nativePort.onDisconnect.addListener(() => {
      console.log('Disconnected from native app');
      nativePort = null;
    });
    
    return nativePort;
  } catch (error) {
    console.error('Native connection failed:', error);
    return null;
  }
}

// Track download progress
chrome.downloads.onChanged.addListener((delta) => {
  if (delta.id && delta.state) {
    if (delta.state.current === 'in_progress') {
      pendingDownloads.add(delta.id);
    } else if (delta.state.current === 'complete') {
      pendingDownloads.delete(delta.id);
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'Download Complete',
        message: 'File ready for analysis'
      });
    }
  }
});

// Check if all downloads are finished
function areDownloadsComplete() {
  return pendingDownloads.size === 0;
}

// Wait for downloads to complete with timeout
function waitForDownloads(timeout = 30000) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const checkInterval = setInterval(() => {
      if (areDownloadsComplete() || (Date.now() - startTime) > timeout) {
        clearInterval(checkInterval);
        resolve(areDownloadsComplete());
      }
    }, 500);
  });
}

// Handle messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'download_and_analyze') {
    (async () => {
      try {
        // Start downloads
        pendingDownloads.add(request.downloadId);
        
        // Wait for completion
        const success = await waitForDownloads();
        if (!success) {
          sendResponse({status: 'error', message: 'Download timeout'});
          return;
        }
        
        // Run analysis
        const port = nativePort || connectToNativeApp();
        if (port) {
          port.postMessage({
            type: 'analyze',
            filepath: request.filepath
          });
          sendResponse({status: 'success'});
        } else {
          sendResponse({status: 'error', message: 'Native connection failed'});
        }
      } catch (error) {
        sendResponse({status: 'error', message: error.message});
      }
    })();
    return true; // Keep message channel open
  }
});

// Initialize
connectToNativeApp();