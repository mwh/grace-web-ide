function setUpMinigrace() {
    minigrace.stderr_write = function(value) {
        var stderr = document.getElementById("stderr_txt");
        stderr.value += value;
        stderr.scrollTop = stderr.scrollHeight;
    };
    minigrace.stdout_write = function(value) {
        var stdout = document.getElementById("stdout_txt");
        stdout.value += value;
        scrollstdout();
    };
    minigrace.verbose = false;
}

function scrollstdout() {
    var stdout = $('stdout_txt');
    stdout.scrollTop = stdout.scrollHeight;
}

function reportCompileError() {
    var editor = moduleTabs[minigrace.modname].editor;
    var lines = $('stderr_txt').value.split("\n");
    var bits;
    var line;
    for (var i=0; i<lines.length; i++) {
        if (lines[i].substring(0, 10) != 'minigrace:') {
            line = lines[i];
            break;
        }
    }
    if (bits = line.match(/^.+\[([0-9]+)\]: (.+)$/)) {
        var linenum = +bits[1];
        var message = bits[2];
        editor.moveCursorTo(linenum - 1, 0);
        editor.getSelection().clearSelection();
        editor.getSession().setAnnotations([{
            row: linenum - 1,
            column: 0,
            text: message,
            type: "error"
        }]);
    }
    if (bits = line.match(/^.+\[([0-9]+):\(?([0-9]+).*?\]: (.+)$/)) {
        var linenum = +bits[1];
        var charnum = +bits[2];
        var message = bits[3];
        if (bits = line.match(/^.+\[[^:]+:([0-9]+)-([0-9]+)/)) {
            editor.moveCursorTo(linenum - 1, charnum - 1);
            editor.getSelection().setSelectionAnchor(linenum - 1, +bits[2]);
        } else {
            editor.moveCursorTo(linenum - 1, charnum - 1);
            editor.getSelection().clearSelection();
        }
        editor.getSession().setAnnotations([{
            row: linenum - 1,
            column: charnum - 1,
            text: message,
            type: "error"
        }]);
    }
}

function run() {
    var module = $('module-tabbar').getElementsByClassName('active')[0]
        .dataset.module;
    var tabData = moduleTabs[module];
    var editor = tabData.editor;
    minigrace.modname = module;
    var oldstderr = $('stderr_txt').value;
    $('stderr_txt').value = "";
    var compiled = minigrace.compilerun(editor.getValue());
    if (!compiled)
        $('stderr_txt').value = oldstderr;
    if (minigrace.compileError)
        reportCompileError();
}
