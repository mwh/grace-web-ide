function offerRestore(message, func) {
    var restorePrompt = $('restore-prompt');
    while (restorePrompt.lastChild)
        restorePrompt.lastChild.remove();
    restorePrompt.appendChild($t(message));
    var a = $c('a');
    a.href = 'javascript:;';
    a.addEventListener('click', function() {
        clearTimeout(tid);
        clearRestore();
        func();
    });
    a.appendChild($t('Undo'));
    restorePrompt.appendChild($t(' '));
    restorePrompt.appendChild(a);
    restorePrompt.style.display = 'block';
    var tid = setTimeout(clearRestore, 10000);
}

function clearRestore() {
    var restorePrompt = $('restore-prompt');
    while (restorePrompt.lastChild)
    while (restorePrompt.lastChild)
        restorePrompt.lastChild.remove();
    restorePrompt.style.display = 'none';
}

function saveLocalStorage() {
    var modules = [];
    for (var k in moduleTabs) {
        localStorage.setItem('code:' + k, moduleTabs[k].editor.getValue());
        modules.push(k);
    }
    localStorage.setItem('modules', modules.join(','));
}

function restoreLocalStorage() {
    if (!localStorage.getItem('modules'))
        return;
    for (var k in moduleTabs) {
        var tb = moduleTabs[k];
        tb.div.remove();
        tb.tab.remove();
    }
    var modules = localStorage.getItem('modules').split(',');
    for (var i=0; i<modules.length; i++) {
        (function() {
            var name = modules[i];
            setTimeout(function() {
                var tb = addTab(name);
                tb.editor.setValue(localStorage.getItem('code:' + name), -1);
            }, i * 250);
        })();
    }
}

function outputswitch() {
    var tb = document.getElementById('output_area');
    var next = document.getElementById('output-select').value;
    if (next == 'stdout') {
        $('stdcanvas').style.display = 'none';
        $('stdout_txt').style.display = 'inline';
    } else {
        $('stdcanvas').style.display = 'inline';
        $('stdout_txt').style.display = 'none';
    }
}

function popupBox(func) {
    var div = $c('div');
    div.classList.add('popup-box');
    var closeButton = $c('button');
    closeButton.classList.add('close-button');
    closeButton.innerHTML = '&#10060;';
    closeButton.addEventListener('click', function() {div.remove()});
    div.appendChild(closeButton);
    func(div);
    document.body.appendChild(div);
}
