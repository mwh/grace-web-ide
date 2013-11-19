var bgMinigrace;

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
    bgMinigrace = new Worker("background.js");
    bgMinigrace.onmessage = backgroundMessageReceiver;
    setInterval(tabUpdateCheck, 1000);
}

function tabUpdateCheck() {
    var limit = new Date().getTime() - 1000;
    for (var k in moduleTabs) {
        var tb = moduleTabs[k];
        if (!tb.changedSinceLast)
            continue;
        if (tb.lastChange > limit)
            continue;
        tb.changedSinceLast = false;
        bgMinigrace.postMessage({action: "compile", mode: "js",
            modname: k, source: tb.editor.getValue()});
    }
}

function backgroundMessageReceiver(ev) {
    if (moduleTabs[ev.data.modname].changedSinceLast)
        return;
    if (!ev.data.success) {
        reportCompileError(ev.data.stderr, ev.data.modname, false)
        window['gracecode_' + ev.data.modname] = undefined;
        return;
    }
    moduleTabs[ev.data.modname].tab.classList.remove('error');
    moduleTabs[ev.data.modname].editor.getSession().clearAnnotations();
    eval(ev.data.output);
    var theModule;
    eval("theModule = gracecode_" + ev.data.modname + ";");
    window['gracecode_' + ev.data.modname] = theModule;
}

function scrollstdout() {
    var stdout = $('stdout_txt');
    stdout.scrollTop = stdout.scrollHeight;
}

function reportCompileError(stderr, modname, interactive) {
    moduleTabs[modname].tab.classList.add('error');
    var editor = moduleTabs[modname].editor;
    var lines = stderr.split("\n");
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
        if (interactive) {
            editor.moveCursorTo(linenum - 1, 0);
            editor.getSelection().clearSelection();
        }
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
        if (!interactive) {
        } else if (bits = line.match(/^.+\[[^:]+:([0-9]+)-([0-9]+)/)) {
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
        reportCompileError($('stderr_txt').value, module, interactive);
}
