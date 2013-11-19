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
function downloadFile() {
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
    window.location.href = u;
    url.revokeObjectURL(u);
}