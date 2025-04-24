// Status management
const status = document.getElementById('status');

// Helper function to set the status message
function setStatus(message, isError = false) {
  status.textContent = message;
  status.style.color = isError ? 'red' : 'black';
  status.style.fontWeight = isError ? 'bold' : 'normal';
}

function getSelectedOptions() {
  return {
    dataType: document.getElementById('dataType').value,
    taskType: document.getElementById('taskType').value
  };
}

// Helper function to get links from the page
async function getRootFileLinks(tabId) {
  return await chrome.scripting.executeScript({
    target: { tabId: tabId },
    func: () => {
      return Array.from(document.querySelectorAll('a[href*=".root"]')).map(a => ({
        url: a.href,
        filename: a.href.split('/').pop()
      }));
    }
  });
}

// Helper function to filter target files
function filterTargetFiles(links, targetFiles) {
  return links.filter(file => targetFiles.includes(file.filename));
}

// Helper function to check if files already exist
async function checkIfFilesExist(filesToDownload) {
  const existingFiles = await chrome.downloads.search({
    filenameRegex: filesToDownload.map(file => file.filename).join('|')
  });
  return existingFiles.map(file => file.filename);
}

// Helper function to download files
async function downloadFiles(filesToDownload) {
  for (const file of filesToDownload) {
    await chrome.downloads.download({
      url: file.url,
      filename: file.filename,
      conflictAction: 'overwrite',
      saveAs: false
    });
  }
  setStatus('Downloads started to your Downloads folder!', false);
}

// Helper function to handle file analysis
async function analyzeFiles(filesToAnalyze, options) {
  try {
    setStatus('Looking for ROOT files...');
    
    // Option 1: Check Chrome's download history first
    const chromeDownloads = await chrome.downloads.search({
      filenameRegex: 'AO2D\.root|AnalysisResults\.root',
      orderBy: ['-startTime'],
      limit: 2
    });
    
    if (chromeDownloads.length > 0) {
      filesToAnalyze = chromeDownloads.map(d => d.filename);
      setStatus(`Found ${filesToAnalyze.length} files in download history`);
    }

    // Connect to native app and analyze
    const port = chrome.runtime.connectNative('com.example.root_analyzer');
    
    port.onMessage.addListener((response) => {
      if (response.status === 'success') {
        setStatus(`Analysis complete. Keys: ${response.keys.join(', ')}`);
      } else {
        setStatus(`Analysis error: ${response.message}`, true);
      }
    });
    
    for (const filepath of filesToAnalyze) {
      port.postMessage({
        type: 'analyze',
        filepath: filepath,
        options: options
      });
    }
    
  } catch (error) {
    setStatus('Error: ' + error.message, true);
    console.error(error);
  }
}

// Event listener for "Download ROOT Files"
document.getElementById('downloadFiles').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  setStatus('Preparing downloads...', false);

  try {
    const links = await getRootFileLinks(tab.id);
    const targetFiles = ['AO2D.root', 'AnalysisResults.root'];
    const filesToDownload = filterTargetFiles(links[0].result, targetFiles);

    if (filesToDownload.length === 0) {
      setStatus('No target files found', true);
      return;
    }

    // Check for existing files in the download folder (we won't skip them)
    const existingFiles = await checkIfFilesExist(filesToDownload);

    // Proceed with downloading files, even if they already exist
    setStatus(`Downloading ${filesToDownload.length} files...`);
    await downloadFiles(filesToDownload);

  } catch (error) {
    setStatus('Error: ' + error.message, true);
    console.error('Extension error:', error);
  }
});

// Event listener for "Analyze Existing Files"
document.getElementById('analyzeFiles').addEventListener('click', async () => {
  let filesToAnalyze = [];

  try {
    // Option 1: Check Chrome's download history first
    const chromeDownloads = await chrome.downloads.search({
      filenameRegex: 'AO2D\.root|AnalysisResults\.root',
      orderBy: ['-startTime'],
      limit: 2
    });

    if (chromeDownloads.length > 0) {
      filesToAnalyze = chromeDownloads.map(d => d.filename);
      setStatus(`Found ${filesToAnalyze.length} files in download history`);
    } else {
      // Fallback to file picker
      const fileHandle = await window.showOpenFilePicker({
        types: [{
          description: 'ROOT Files',
          accept: {'application/octet-stream': ['.root']}
        }],
        multiple: true
      });

      filesToAnalyze = await Promise.all(
        fileHandle.map(async f => (await f.getFile()).name)
      );
      setStatus(`Selected ${filesToAnalyze.length} files`);
    }

    if (filesToAnalyze.length === 0) {
      setStatus('No files selected or found', true);
      return;
    }

    // Get selected options from dropdowns
    const options = getSelectedOptions();
    // Analyze the selected files
    await analyzeFiles(filesToAnalyze, options);
  } catch (error) {
    setStatus('Error: ' + error.message, true);
    console.error(error);
  }
});

// Event listener for "Download and Analyze"
document.getElementById('downloadAndAnalyze').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  setStatus('Starting process...');

  try {
    const links = await getRootFileLinks(tab.id);
    const targetFiles = ['AO2D.root', 'AnalysisResults.root'];
    const filesToDownload = filterTargetFiles(links[0].result, targetFiles);

    if (filesToDownload.length === 0) {
      setStatus('No ROOT files found', true);
      return;
    }

    setStatus('Downloading files...');
    await downloadFiles(filesToDownload);
    setStatus('Downloads complete! Starting analysis...');

    const downloads = await chrome.downloads.search({
      query: targetFiles,
      orderBy: ['-startTime'],
      limit: 2
    });

    // Get selected options from dropdowns
    const options = getSelectedOptions();
    await analyzeFiles(downloads.map(d => d.filename), options);

  } catch (error) {
    setStatus('Error: ' + error.message, true);
    console.error('Extension error:', error);
  }
});