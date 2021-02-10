/**
 * Compute the euclidean distance between two points
 * @param {Point} p1
 * @param {Point} p2
 */
export function computeDist(p1, p2) {
    return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
}

/**
 * Return the current time in ms since 1970
 * @returns {number}
 */
export function getCurrentTimeMs() {
    return new Date().getTime();
}

export function getSubDir() {
    const url = document.URL.substr(0, document.URL.lastIndexOf("/"));
    const urlSplit = url.split("/");
    let subdir = "";
    for (let i = 3; i < urlSplit.length; i++) {
        subdir = subdir + "/" + urlSplit[i];
    }

    return subdir;
}

export function blobToDataURL(blob) {
    return new Promise((fulfill, reject) => {
        let reader = new FileReader();
        reader.onerror = reject;
        reader.onload = (e) => fulfill(reader.result);
        reader.readAsDataURL(blob);
    });
}

// verify if filename refers to an image
export function isImageFileName(filename) {
    var extension = filename.split(".")[filename.split(".").length - 1];
    var known_extensions = ["png", "jpg", "jpeg", "gif", "tiff", "bmp", "webp"];
    return known_extensions.includes(extension.toLowerCase());
}

// verify if filename refers to an pdf
export function isPDFFileName(filename) {
    var extension = filename.split(".")[filename.split(".").length - 1];
    var known_extensions = ["pdf"];
    return known_extensions.includes(extension.toLowerCase());
}
