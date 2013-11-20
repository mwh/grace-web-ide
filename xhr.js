function getFile(url, callback, failedCallback) {
    var req = new XMLHttpRequest();
    req.open("GET", url, true);
    req.onreadystatechange = function() {
        if (req.readyState == 4) {
            if (req.status == 200) {
                callback(req.responseText);
            } else {
                if (failedCallback) {
                    failedCallback(req.status);
                }
            }
        }
    }
    req.send(null);
}
