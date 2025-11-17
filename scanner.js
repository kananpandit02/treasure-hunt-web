// QR Scanner Logic

/**
 * Initializes a QR code scanner.
 * @param {string} elementId The ID of the HTML element to render the scanner in.
 * @param {function} onScanSuccess The callback function to execute on successful scan.
 */
export function initializeScanner(elementId, onScanSuccess) {
    const html5QrCode = new Html5Qrcode(elementId);
    const config = { fps: 10, qrbox: { width: 250, height: 250 } };

    // Start scanning
    html5QrCode.start({ facingMode: "environment" }, config, onScanSuccess)
        .catch(err => {
            console.error(`Unable to start scanning, error code = ${err}`);
            alert(`Error: Could not start QR scanner. ${err}`);
        });

    return html5QrCode;
}

/**
 * Stops the QR code scanner.
 * @param {Html5Qrcode} scannerInstance The scanner instance to stop.
 */
export function stopScanner(scannerInstance) {
    if (scannerInstance && scannerInstance.isScanning) {
        scannerInstance.stop().then(() => {
            console.log("QR Code scanning stopped.");
        }).catch(err => {
            console.error(`Failed to stop QR scanner. Error: ${err}`);
        });
    }
}
