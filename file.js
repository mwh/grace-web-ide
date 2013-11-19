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
