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
    setInterval(tabUpdateCheck, 500);
}

function tabUpdateCheck() {
    var limit = new Date().getTime() - 500;
    for (var k in moduleTabs) {
        var tb = moduleTabs[k];
        if (!tb.changedSinceLast)
            continue;
        if (tb.lastChange > limit)
            continue;
        if (tb.noCompile)
            continue;
        compileTab(k);
    }
}

function gcMod(name) {
    return "gracecode_" + name.replace('/', '$');
}

function compileTab(k, dependencies) {
    var tb = moduleTabs[k];
    if (dependencies) {
        for (var i=0; i<dependencies.length; i++) {
            if (!window[gcMod(dependencies[i])]) {
                setTimeout(function() {compileTab(k, dependencies);}, 1000);
                return;
            }
        }
    }
    if (!tb) {
        setTimeout(function() {compileTab(k, dependencies);}, 1000);
        return;
    }
    tb.changedSinceLast = false;
    var jobID = createJob("Compile " + k);
    tb.jobID = jobID;
    bgMinigrace.postMessage({action: "compile", mode: "ecmascript",
        modname: k, source: tb.editor.getValue(),
        jobID: jobID
    });
    tb.tab.classList.add('compiling');
    tb.tab.title = "Compiling in background...";
    if (tb.tab.classList.contains('active'))
        $('runbutton').innerHTML = '▷';
}

function backgroundMessageReceiver(ev) {
    if (ev.data.state == 'compiling') {
        markJobInProgress(ev.data.jobID);
        return;
    }
    completeJob(ev.data.jobID, ev.data.success ? "good" : "bad");
    if (!moduleTabs[ev.data.modname])
        return;
    var tb = moduleTabs[ev.data.modname];
    tb.tab.classList.remove('compiling');
    moduleTabs[ev.data.modname].noCompile = false;
    if (moduleTabs[ev.data.modname].changedSinceLast)
        return;
    if (tb.jobID == ev.data.jobID) {
        tb.jobID = undefined;
        $('runbutton').innerHTML = '▶';
    }
    tb.tab.title = '';
    if (!ev.data.success) {
        reportCompileError(ev.data.stderr, ev.data.modname, false)
        window[gcMod(ev.data.modname)] = undefined;
        return;
    }
    tb.tab.classList.add('success');
    setTimeout(function() {tb.tab.classList.remove('success')}, 500);
    moduleTabs[ev.data.modname].tab.classList.remove('error');
    moduleTabs[ev.data.modname].editor.getSession().clearAnnotations();
    eval(ev.data.output);
    var theModule;
    eval("theModule = " + gcMod(ev.data.modname) + ";");
    window[gcMod(ev.data.modname)] = theModule;
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
    while (line.match(/^.+?\.grace:.+?: warning:/)) {
        line = lines[++i];
    }
    if (bits = line.match(/^.+\[([0-9]+)\]: (.+)$/)) {
        var linenum = +bits[1];
        var message = bits[2];
        if (interactive) {
            editor.moveCursorTo(linenum - 1, 0);
            editor.getSelection().clearSelection();
        }
        moduleTabs[modname].lineClick = function(num) {
            if (num == linenum - 1) {
                reportCompileError(stderr, modname, true);
                updateStderr(stderr, modname);
            }
        };
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
        moduleTabs[modname].lineClick = function(num) {
            if (num == linenum - 1) {
                reportCompileError(stderr, modname, true);
                updateStderr(stderr, modname);
            }
        };
        editor.getSession().setAnnotations([{
            row: linenum - 1,
            column: charnum - 1,
            text: message,
            type: "error"
        }]);
    }
}

function run() {
    $('stderr_txt').style.display = 'inline';
    $('stderr_list').style.display = 'none';
    var module = $('module-tabbar').getElementsByClassName('active')[0]
        .dataset.module;
    var tabData = moduleTabs[module];
    var editor = tabData.editor;
    minigrace.modname = module;
    minigrace.debugMode = true;
    minigrace.printStackFrames = false;
    var oldstderr = $('stderr_txt').value;
    $('stderr_txt').value = "";
    if (!tabData.changedSinceLast && window[gcMod(module)]
            && (!tabData.jobID || isJobCompleted(tabData.jobID))) {
        minigrace.lastSourceCode = editor.getValue();
        minigrace.lastModname = module;
        minigrace.lastMode = 'js';
        minigrace.lastDebugMode = true;
        minigrace.run();
    } else {
        var compiled = minigrace.compilerun(editor.getValue());
        if (!compiled)
            $('stderr_txt').value = oldstderr;
    }
    if (minigrace.compileError)
        reportCompileError($('stderr_txt').value, module, true);
    updateStderr($('stderr_txt').value, module);
    if (minigrace.exception) {
        updateException();
        var imports = window[gcMod(module)].imports;
        for (var i=0; i<imports.length; i++) {
            if (!moduleTabs[imports[i]]) {
                if (samples[imports[i]]) {
                    if (confirm("It looks like you're trying to use the '"
                                + samples[imports[i]].name
                                + "' sample, which isn't loaded. Do you want "
                                + "to load it now?")) {
                        loadSample(imports[i]);
                    }
                }
            }
        }
    }
}

function updateException() {
    var list = $('stderr_list');
    var li = $c('li');
    var a = $c('a');
    a.href = 'javascript:;';
    a.addEventListener('click', function() {
        examineException(minigrace.exception);
    });
    a.appendChild($t('You can examine the values of local variables '
                + 'at the time the program stopped.'));
    li.appendChild(a);
    list.appendChild(li);
    $('stderr_area').scrollTop = $('stderr_area').scrollHeight;
}

function updateStderr(stderr, module) {
    $('stderr_txt').style.display = 'none';
    var list = $('stderr_list');
    list.style.display = 'inline';
    var lines = stderr.split('\n');
    while (list.lastChild)
        list.removeChild(list.lastChild);
    for (var i=0; i<lines.length; i++) {
        if (lines[i] == 'Did you mean:') {
            list.appendChild(makeSuggestionLine(lines[i+1], module));
        } else
            list.appendChild(makeStderrLine(lines[i]));
    }
    $('stderr_area').scrollTop = $('stderr_area').scrollHeight;
}

function makeStderrLine(line) {
    var li = $c('li');
    line = line.replace('&', '&amp;');
    line = line.replace('<', '&lt;');
    line = line.replace('>', '&gt;');
    line = line.replace(' ', '&nbsp;');
    line = line.replace(/([a-zA-Z0-9_\/]+)\.grace\[([0-9]+):([0-9]+)-([0-9]+)(.*?\])/g,
            '<a href="javascript:jumpTo('+"'$1', $2, $3, $4)"+';">'
            + '$1.grace[$2:$3-$4$5</a>');
    line = line.replace(/([a-zA-Z0-9_\/]+)\.grace\[([0-9]+):([0-9]+)(\])/g,
            '<a href="javascript:jumpTo('+"'$1', $2, $3)"+';">'
            + '$1.grace[$2:$3$4</a>');
    line = line.replace(/([a-zA-Z0-9_\/]+)\.grace\[([0-9]+):\(([0-9]+)\)(\])/g,
            '<a href="javascript:jumpTo('+"'$1', $2, $3)"+';">'
            + '$1.grace[$2:($3)$4</a>');
    line = line.replace(/^([a-zA-Z0-9_\/]+)\.grace\[([0-9]+)\]/g,
            '<a href="javascript:jumpTo(' + "'$1', $2)" + ';">$1.grace[$2]</a>');
    line = line.replace(/([ ;])([a-zA-Z0-9_\/]+):([0-9]+)/g,
            '$1<a href="javascript:jumpTo(' + "'$2', $3)" + ';">$2:$3</a>');
    li.innerHTML = line;
    return li;
}

function makeSuggestionLine(line, module) {
    var li = $c('li');
    var a = $c('a');
    a.href = "javascript:;";
    var res = /([0-9]+): (.*)$/.exec(line);
    var linenum = +res[1];
    var replacement = res[2];
    a.addEventListener('click', function() {
        switchTab(module);
        var editor = moduleTabs[module].editor;
        var text = editor.getValue();
        var lines = text.split('\n');
        lines[linenum-1] = replacement;
        editor.setValue(lines.join('\n'), -1)
        editor.moveCursorTo(linenum - 1, 0);
        editor.getSelection().clearSelection();
    });
    a.appendChild($t('Did you mean:'));
    li.appendChild(a);
    return li;
}

function validateModuleName(name) {
    if (/[[\]()!@#$%^&\-=+{};:'"?><`~ \\]/.test(name)) {
        alert("'" + name + "' is not a valid module name. "
                + "Try again without spaces or special characters.");
        return false;
    }
    return true;
}
