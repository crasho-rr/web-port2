const originalFetch = window.fetch;

function mergeFiles(fileParts) {
    return new Promise((resolve, reject) => {
        let buffers = [];

        function fetchPart(index) {
            if (index >= fileParts.length) {
                let mergedBlob = new Blob(buffers);
                let mergedFileUrl = URL.createObjectURL(mergedBlob);
                resolve(mergedFileUrl);
                return;
            }
            fetch(fileParts[index]).then((response) => {
                if (!response.ok) throw new Error("Missing part: " + fileParts[index]);
                return response.arrayBuffer();
            }).then((data) => {
                buffers.push(data);
                fetchPart(index + 1);
            }).catch(reject);
        }
        fetchPart(0);
    });
}

function getParts(file, start, end) {
    let parts = [];
    for (let i = start; i <= end; i++) {
        parts.push(file + ".part" + i);
    }
    return parts;
}
Promise.all([
    mergeFiles(getParts("bfdi.pck", 1, 11)),
    mergeFiles(getParts("bfdi.wasm", 1, 3))
]).then(([pckUrl, wasmUrl]) => {
    window.fetch = async function (url, ...args) {
        if (url.endsWith("bfdi.pck")) {
            return originalFetch(pckUrl, ...args);
        } else if (url.endsWith("bfdi.wasm")) {
            return originalFetch(wasmUrl, ...args);
        } else {
            return originalFetch(url, ...args);
        }
    };
    window.godotRunStart();
});