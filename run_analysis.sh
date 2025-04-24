#!/bin/bash

# Configuration
VENV_PATH="/home/fabrizio/.venv/ml312"
SCRIPT_PATH="/home/fabrizio/Desktop/test_downloader/root_analyser.py"
LOG_FILE="/home/fabrizio/Desktop/test_downloader/log.txt"

# Log function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "${LOG_FILE}"
}

log "=== Starting execution ==="

# Activate virtual environment
if [ -f "${VENV_PATH}/bin/activate" ]; then
    log "Activating virtual environment at ${VENV_PATH}"
    source "${VENV_PATH}/bin/activate"
else
    log "ERROR: Virtual environment not found at ${VENV_PATH}"
    exit 1
fi

# Check Python version
log "Using Python: $(which python3)"
log "Python version: $(python3 --version)"

source $HOME/root/root_install/bin/thisroot.sh

# Run the script
log "Executing script at ${SCRIPT_PATH}"
python3 "${SCRIPT_PATH}" >> "${LOG_FILE}" 2>&1
EXIT_CODE=$?

# Final logging
if [ ${EXIT_CODE} -eq 0 ]; then
    log "Script completed successfully"
else
    log "ERROR: Script failed with code ${EXIT_CODE}"
fi

log "=== Execution complete ==="
exit ${EXIT_CODE}