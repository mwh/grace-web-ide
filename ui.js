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
