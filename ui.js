function $(n) {
    return document.getElementById(n);
}
function $c(n, properties) {
    var el = document.createElement(n);
    if (properties)
        for (var k in properties)
            el[k] = properties[k];
    return el;
}
function $t(n) {
    return document.createTextNode(n);
}
function $h(c) {
    var div = $c('div');
    div.innerHTML = c;
    return div.firstChild;
}
function $ac(o, c) {
    o.appendChild(c);
}
function $ha(o, c) {
    var div = $c('div');
    div.innerHTML = c;
    for (var i=0; i<div.childNodes.length; i++) {
        o.appendChild(div.childNodes[i].cloneNode(true));
    }
}
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
        delete moduleTabs[k];
    }
    var modules = localStorage.getItem('modules').split(',');
    for (var i=0; i<modules.length; i++) {
        (function() {
            var name = modules[i];
            scheduleTab(name, localStorage.getItem('code:' + name));
        })();
    }
}

function outputswitch() {
    var tb = document.getElementById('output_area');
    var next = document.getElementById('output-select').value;
    if (next == 'stdout') {
        $('standard-canvas').style.display = 'none';
        $('stdout_txt').style.display = 'inline';
    } else {
        $('standard-canvas').style.display = 'inline';
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

var jobData = {};
var jobCount = 0;
function createJob(s) {
    var jobList = $('job_list');
    var jobID = "job" + jobCount++;
    var li = $c('li');
    li.appendChild($t(s));
    jobList.appendChild(li);
    jobData[jobID] = {
        message: s,
        li: li
    };
    return jobID;
}
function completeJob(jobID, state) {
    jobData[jobID].li.classList.remove('running');
    if (state) {
        jobData[jobID].li.classList.add(state);
    }
    jobData[jobID].li.classList.add('done');
    jobData[jobID].complete = true;
    setTimeout(function() {
        jobData[jobID].li.remove();
        delete jobData[jobID];
    }, 750);
}
function markJobInProgress(jobID) {
    jobData[jobID].li.classList.add('running');
}
function isJobCompleted(jobID) {
    if (!jobData[jobID])
        return true;
    return jobData[jobID].complete;
}

function aboutClickListener() {
    popupBox(function(div) {
        $ha(div,
            '<p><a href="http://ecs.vuw.ac.nz/~mwh/minigrace/">Minigrace</a> '
            + 'version ' + MiniGrace.version + '/' + MiniGrace.revision + '</p>'
            + '<p>Entypo pictograms by Daniel Bruce — '
            + '<a href="http://www.entypo.com/">www.entypo.com</a></p>'
        );
        var appendGitLine = function(rev) {
            $ha(div, '<p>IDE revision ' + rev + '</p>');
        }
        getFile("./.git/HEAD", function(text) {
            if (text.substring(0, 5) == "ref: ") {
                getFile("./.git/" + text.substring(5), function(ref) {
                    appendGitLine(ref);
                });
            } else if (/^[0-9a-f]+$/.test(text)) {
                appendGitLine(text);
            }
        });
    });
}

function highlight(el) {
    el.classList.add('flash');
    setTimeout(function() {el.classList.remove('flash');}, 1500);
}

function makeEditable(el, saveCallback) {
    el.saveCallback = saveCallback;
    el.addEventListener('dblclick', editElement);
}

function editElement(ev) {
    ev.stopPropagation();
    var input = $c('input', {type: 'text',
        style: 'border: 0; padding: 0; margin: 0;'});
    saveCallback = this.saveCallback;
    input.value = this.textContent;
    input.style.width = this.offsetWidth + 'px';
    input.style.height = this.offsetHeight + 'px';
    var cs = getComputedStyle(this);
    input.style.fontFamily = cs.fontFamily;
    input.style.fontSize = cs.fontSize;
    input.style.fontWeight = cs.fontWeight;
    input.style.background = '#ccf';
    var nodeType = this.tagName;
    input.addEventListener('keypress', function(ev) {
        if (ev.keyCode == 13) // Enter
            finishElementEdit(this, nodeType, saveCallback);
    });
    input.addEventListener('blur', function(ev) {
        finishElementEdit(this, nodeType, saveCallback);
    });
    this.parentNode.replaceChild(input, this);
    input.focus();
    highlight(input);
}

function finishElementEdit(input, nodeType, saveCallback) {
    var el = $c(nodeType);
    $ac(el, $t(input.value));
    makeEditable(el, saveCallback);
    input.parentNode.replaceChild(el, input);
    saveCallback(input.value);
}
