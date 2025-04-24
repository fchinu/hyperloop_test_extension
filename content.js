function downloadRootFiles() {
    // Target files we want to download
    const targetFiles = ['AO2D.root', 'AnalysisResults.root'];
    let foundFiles = 0;
  
    // Find all links containing .root in their href
    const rootFileLinks = document.querySelectorAll('a[href*=".root"]');
  
    rootFileLinks.forEach(link => {
      const href = link.getAttribute('href');
      const fileName = href.split('/').pop();
      
      if (targetFiles.includes(fileName)) {
        // Create and dispatch click event
        const clickEvent = new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
          view: window
        });
        link.dispatchEvent(clickEvent);
        foundFiles++;
      }
    });
  
    // Send message back to popup
    if (foundFiles > 0) {
      chrome.runtime.sendMessage({
        type: 'status',
        text: `Started downloading ${foundFiles} file(s)`
      });
    } else {
      chrome.runtime.sendMessage({
        type: 'status',
        text: 'No matching ROOT files found'
      });
    }
  }
  
  // Make the function available to the window object
  window.downloadRootFiles = downloadRootFiles;