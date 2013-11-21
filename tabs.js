var moduleTabs = {};
function addTab(name) {
    var tabbar = $('module-tabbar');
    var li = $c('li');
    li.classList.add('module-tabbutton');
    var nameSpan = $c('span');
    $ac(nameSpan, $t(name));
    makeEditable(nameSpan, function(newName) {
        moduleTabs[newName] = moduleTabs[name];
        delete moduleTabs[name];
        window['gracecode_' + name] = undefined;
        sessionStorage.removeItem('code:' + name);
        name = newName;
        li.dataset.module = name;
        compileTab(newName);
        saveLocalStorage();
    });
    $ac(li, nameSpan);
    li.classList.add('active');
    li.addEventListener('click', tabClickListener);
    li.dataset.module = name;
    var closeButton = $c('span');
    closeButton.classList.add('close-button');
    closeButton.innerHTML = '&#10060;';
    closeButton.addEventListener('click', function(ev) {
        ev.stopPropagation();
        closeTab(name);
    });
    li.appendChild(closeButton);
    tabbar.appendChild(li);
    var div = $c('div');
    div.classList.add('main-editor');
    var codearea = $('code-area'); 
    codearea.appendChild(div);
    var editor = ace.edit(div);
    var GraceMode = ace.require("ace/mode/grace").Mode;
    editor.getSession().setMode(new GraceMode());
    editor.setBehavioursEnabled(false);
    editor.setHighlightActiveLine(true);
    editor.setShowFoldWidgets(false);
    editor.setShowPrintMargin(false);
    editor.getSession().setUseSoftTabs(true);
    editor.getSession().setTabSize(4);
    editor.commands.bindKeys({"ctrl-l":null, "ctrl-shift-r":null, "ctrl-r":null, "ctrl-t":null, "ctrl-shift-p": null, "ctrl-shift-k": null})
    editor.resize();
    editor.on('change', function(ev) {
        moduleTabs[name].lastChange = new Date().getTime();
        moduleTabs[name].changedSinceLast = true;
        if (moduleTabs[name].tab.classList.contains('active'))
            updateDownloadURL();
        saveLocalStorage();
    });
    editor.on('guttermousedown', function(e) {
        if (!moduleTabs[name].lineClick)
            return;
        var target = e.domEvent.target;
        if (target.className.indexOf("ace_gutter-cell") == -1)
            return;
        if (e.clientX > 25 + target.getBoundingClientRect().left)
            return;
        var row = e.getDocumentPosition().row
        e.stop();
        moduleTabs[name].lineClick(row);
    });
    for (var k in moduleTabs) {
        moduleTabs[k].div.style.display = 'none';
        moduleTabs[k].tab.classList.remove('active');
    }
    editor.focus();
    moduleTabs[name] = {
        editor: editor,
        div: div,
        tab: li,
        lastChange: 0,
        changedSinceLast: false,
    };
    return moduleTabs[name];
}

function tabClickListener() {
    var name = this.dataset.module;
    switchTab(name);
}

function switchTab(name) {
    moduleTabs[name].div.style.display = 'block';
    moduleTabs[name].tab.classList.add('active');
    for (var k in moduleTabs) {
        if (k != name) {
            moduleTabs[k].div.style.display = 'none';
            moduleTabs[k].tab.classList.remove('active');
        }
    }
    updateDownloadURL();
}

function closeTab(name) {
    var tabbar = $('module-tabbar');
    var tab = moduleTabs[name];
    if (tab.tab.classList.contains('active')) {
        var newActive;
        for (var i=0; i<tabbar.childNodes.length; i++) {
            if (tabbar.childNodes[i] != tab.tab
                    && tabbar.childNodes[i].dataset
                    && tabbar.childNodes[i].dataset.module
                    && tabbar.childNodes[i].dataset.module != name)
                newActive = tabbar.childNodes[i].dataset.module;
        }
        if (newActive)
            switchTab(newActive);
    }
    var li = tab.tab;
    var div = tab.div;
    tabbar.removeChild(li);
    div.remove();
    delete moduleTabs[name];
    window['gracecode_' + name] = undefined;
    sessionStorage.removeItem('code:' + name);
    saveLocalStorage();
    var code = tab.editor.getValue();
    offerRestore("Closed tab " + name, function() {
        addTab(name);
        moduleTabs[name].editor.setValue(code, -1);
        saveLocalStorage();
    });
}

function tabNewClickListener() {
    var name = prompt("Enter a name for the new module.");
    addTab(name);
}

var scheduledTabs = [];
var scheduledTabsInterval = 0;
function scheduleTab(name, code, noCompile) {
    // The Ace editor doesn't like having multiple tabs created
    // in very short succession - make sure they are spread out.
    scheduledTabs.push({module: name, text: code, noCompile: noCompile});
    if (!scheduledTabsInterval)
        scheduledTabsInterval = setInterval(scheduledTabsCallback, 250);
}

function scheduledTabsCallback() {
    var tab = scheduledTabs.shift();
    if (!moduleTabs[tab.module]) {
        var tb = addTab(tab.module);
        tb.noCompile = tab.noCompile;
        if (tab.text)
            tb.editor.setValue(tab.text, -1);
        if (tab.noImmediateCompile)
            tb.changedSinceLast = false;
    }
    if (scheduledTabs.length == 0) {
        clearInterval(scheduledTabsInterval);
        scheduledTabsInterval = 0;
    }
}

function updateScheduledTab(name, delta) {
    for (var i=0; i<scheduledTabs.length; i++) {
        var tab = scheduledTabs[i];
        if (tab.module == name) {
            for (var k in delta) {
                tab[k] = delta[k];
            }
        }
    }
}

function jumpTo(module, line, pos) {
    switchTab(module);
    var editor = moduleTabs[module].editor;
    editor.moveCursorTo(line - 1, pos ? pos - 1 : 0);
    editor.getSelection().clearSelection();
}

// vim: set expandtab ts=8 sw=4 tw=0: 
