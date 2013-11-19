function $(n) {
    return document.getElementById(n);
}
function $c(n) {
    return document.createElement(n);
}
var moduleTabs = {};
function addTab(name) {
    var tabbar = $('module-tabbar');
    var li = $c('li');
    li.classList.add('module-tabbutton');
    li.innerHTML = name;
    li.classList.add('active');
    li.addEventListener('click', tabClickListener);
    li.dataset.module = name;
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
    editor.commands.bindKeys({"ctrl-l":null, "ctrl-shift-r":null, "ctrl-r":null, "ctrl-t":null, "ctrl-shift-p": null})
    editor.resize();
    editor.on('change', function(ev) {
        moduleTabs[name].lastChange = new Date().getTime();
        moduleTabs[name].changedSinceLast = true;
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
}

function tabClickListener() {
    var name = this.dataset.module;
    moduleTabs[name].div.style.display = 'block';
    moduleTabs[name].tab.classList.add('active');
    for (var k in moduleTabs) {
        if (k != name) {
            moduleTabs[k].div.style.display = 'none';
            moduleTabs[k].tab.classList.remove('active');
        }
    }
}

function tabNewClickListener() {
    var name = prompt("Enter a name for the new module.");
    addTab(name);
}
// vim: set expandtab ts=8 sw=4 tw=0: 
