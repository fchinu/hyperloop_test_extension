# Hyperloop test extensions

This Google Chrome extension allows for an easier download of the outputs of Hyperloop tests and for a quick check on the test outputs.

## Setup
First, clone the repository:
```bash
git clone git@github.com:fchinu/hyperloop_test_extension.git
```

Then, navigate to the directory:
```bash
cd hyperloop_test_extension
```

To setup the [Native Messaging](https://developer.chrome.com/docs/extensions/develop/concepts/native-messaging) to run the analysis script, you will need to navigate to [chrome://extensions/](chrome://extensions/) and enable the "Developer mode" toggle in the top right corner. Then, click on "Load unpacked" and select the `hyperloop_test_extension` folder in the cloned repository. This will load the extension into Chrome.

You will then need to edit the `path` and `allowed_origins` fields in the `com.example.root_analyzer.json` file to point to the location of the `hyperloop_test_extension.py` script on your local machine and to the extension ID you obtained in the previous step. Lastly, you should copy the `com.example.root_analyzer.json` file to the Native Messaging host directory. On Linux, this is usually located at `~/.config/google-chrome/NativeMessagingHosts/`. You can find more informations in the [Native Messaging webpage](https://developer.chrome.com/docs/extensions/develop/concepts/native-messaging)

You are then free to edit the `root_analyser.py` script to suit your needs. You may also add more options in the `popup.html` file to allow for more options in the analysis script.

To use the extension, prepare your Hyperloop test, head to the `output` page and just use the extension buttons.