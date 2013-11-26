function uploadFile() {
    var file = document.createElement('input');
    file.type = 'file';
    file.addEventListener('change', function() {
        var name = file.files[0].name;
        if (name.substring(name.length - 6) == ".grace")
            name = name.substring(0, name.length - 6);
        name = name.replace(/^.*\/.+?$/, '$1');
        name = name.replace(/^.*\\.+?$/, '$1');
        var tb = addTab(name);
        var reader = new FileReader();
        reader.readAsText(file.files[0]);
        reader.addEventListener("load", function() {
            tb.editor.setValue(reader.result, -1);
        });
    });
    file.click();
}

function updateDownloadURL() {
    var url = window.URL;
    if (!url && window.webkitURL)
        url = window.webkitURL;
    var module = $('module-tabbar').getElementsByClassName('active')[0]
        .dataset.module;
    var tabData = moduleTabs[module];
    var editor = tabData.editor;
    var blob = new Blob([editor.getValue()],
            {type: "text/x-grace;charset=utf-8"});
    var u = url.createObjectURL(blob);
    var dl = $('downloadbutton');
    if (dl.href)
        url.revokeObjectURL(dl.href);
    dl.download = module + '.grace';
    dl.href = u;
}
window.addEventListener('load', function() {
    var downloadAttrSupported = (typeof document.createElement('a').download
        != 'undefined');
    var dl = $('downloadbutton');
    if (!downloadAttrSupported) {
        dl.title = "Your browser does not support the download attribute "
            + "on links; "
            + "to download the file, right-click and save as.";
        dl.addEventListener('click', function (ev) {
            alert("Your browser does not support the download attribute. "
                + "To download the file, right-click and save as."
                + "\n\nAlternatively, return in a recent version of "
                + "Firefox, Chrome, or Opera, where this functionality "
                + "works."
                );
            ev.preventDefault();
        });
    }
});
