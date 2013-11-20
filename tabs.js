var moduleTabs = {};
function addTab(name) {
    var tabbar = $('module-tabbar');
    var li = $c('li');
    li.classList.add('module-tabbutton');
    li.innerHTML = name;
    li.classList.add('active');
    li.addEventListener('click', tabClickListener);
    li.dataset.module = name;
    var closeButton = $c('span');
    closeButton.classList.add('close-button');
    closeButton.innerHTML = '&#10060;';
    closeButton.addEventListener('click', function(ev) {
        ev.stopPropagation();
        var code = editor.getValue();
        if (tabbar.lastChild.dataset.module
            && moduleTabs[name].tab.classList.contains('active'))
            switchTab(tabbar.lastChild.dataset.module);
        tabbar.removeChild(li);
        div.remove();
        delete moduleTabs[name];
        window['gracecode_' + name] = undefined;
        sessionStorage.removeItem('code:' + name);
        saveLocalStorage();
        offerRestore("Closed tab " + name, function() {
            addTab(name);   
            moduleTabs[name].editor.setValue(code, -1);
            saveLocalStorage();
        });
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

function tabNewClickListener() {
    var name = prompt("Enter a name for the new module.");
    addTab(name);
}

var scheduledTabs = [];
var scheduledTabsInterval = 0;
function scheduleTab(name, code) {
    // The Ace editor doesn't like having multiple tabs created
    // in very short succession - make sure they are spread out.
    scheduledTabs.push({module: name, text: code});
    if (!scheduledTabsInterval)
        scheduledTabsInterval = setInterval(scheduledTabsCallback, 250);
}

function scheduledTabsCallback() {
    var tab = scheduledTabs.shift();
    if (!moduleTabs[tab.module]) {
        var tb = addTab(tab.module);
        if (tab.text)
            tb.editor.setValue(tab.text, -1);
    }
    if (scheduledTabs.length == 0) {
        clearInterval(scheduledTabsInterval);
        scheduledTabsInterval = 0;
    }
}

function jumpTo(module, line, pos) {
    switchTab(module);
    var editor = moduleTabs[module].editor;
    editor.moveCursorTo(line - 1, pos ? pos - 1 : 0);
    editor.getSelection().clearSelection();
}

// vim: set expandtab ts=8 sw=4 tw=0: 
