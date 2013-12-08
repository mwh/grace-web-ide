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
        restorePrompt.removeChild(restorePrompt.lastChild);
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
        restorePrompt.removeChild(restorePrompt.lastChild);
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
        tb.div.parentNode.removeChild(tb.div);
        tb.tab.parentNode.removeChild(tb.tab);
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
    closeButton.addEventListener('click', function() {
        div.parentNode.removeChild(div)
    });
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
        var li = jobData[jobID].li;
        li.parentNode.removeChild(li);
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
            + 'version ' + MiniGrace.version + '/'
            + '<a href="https://github.com/mwh/minigrace/tree/'
            + MiniGrace.revision + '">' + MiniGrace.revision + '</a></p>'
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

function tour() {
    localStorage.setItem("seen-tour", "1");
    var obscurer = $c('div');
    obscurer.style.position = 'absolute';
    obscurer.style.left = 0;
    obscurer.style.top = 0;
    obscurer.style.right= 0;
    obscurer.style.bottom = 0;
    obscurer.style.zIndex = 100;
    var tips = [];
    function addTip(el, message) {
        tips.push({el: el, message: message});
    }
    function nextTip() {
        showTip(tips.shift());
    }
    function findOffset(el) {
        var top = el.offsetTop;
        var left = el.offsetLeft;
        var el2 = el.offsetParent;
        while (el2) {
            top += el2.offsetTop;
            left += el2.offsetLeft;
            el2 = el2.offsetParent;
        }
        return {offsetTop: top, offsetLeft: left,
            offsetWidth: el.offsetWidth, offsetHeight: el.offsetHeight};
    }
    function showTip(tip) {
        while (obscurer.lastChild)
            obscurer.removeChild(obscurer.lastChild);
        var heading = $c('h2');
        var box = $c('div');
        box.style.border = '3px solid blue';
        box.style.position = 'absolute';
        var of = findOffset(tip.el);
        box.style.top = (of.offsetTop - 3) + 'px';
        box.style.left = of.offsetLeft + 'px';
        box.style.width = of.offsetWidth + 'px';
        box.style.height = of.offsetHeight + 'px';
        obscurer.appendChild(box);
        var msgbox = $c('div');
        $ha(heading, "Interface tour");
        msgbox.appendChild(heading);
        $ha(msgbox, "<p>" + tip.message + "</p>");
        msgbox.style.position = 'absolute';
        msgbox.style.top = '20%';
        msgbox.style.left = '20%';
        msgbox.style.background = '#ddd';
        msgbox.style.border = '3px solid #bbb';
        msgbox.style.width = '300px';
        var close = $c('button');
        $ha(close, "Close");
        close.style.styleFloat = close.style.cssFloat = "right";
        close.addEventListener('click', function() {
            document.body.removeChild(obscurer);
        });
        if (tips.length) {
            var next = $c('button');
            $ha(next, "Next");
            next.addEventListener('click', nextTip);
            next.style.styleFloat = next.style.cssFloat = "right";
            msgbox.appendChild(next);
        }
        msgbox.appendChild(close);
        obscurer.appendChild(msgbox);
    }
    addTip($('runbutton'), "To run your program, click the green arrow.");
    addTip($('output_area'), "The output of your program appears on the right.");
    addTip($('stderr_area'), "If there is error output from compiling or running your program, it appears below.");
    addTip(document.getElementsByClassName('module-tabbutton')[1], "The tab border will be orange while the module is being recompiled in the background, and red if there was an error.");
    addTip(document.getElementsByClassName('ace_gutter')[0], "If there is a static error in your program, the line of the error will be marked beside the code. You can hover over the marker to see the error, or click it for more information.");
    addTip($('samplesbutton'), "To load one of the prewritten samples into the system, click the \"Load sample\" button.");
    addTip($('module-tabbar-new'), "To create a new module, click the new tab button.");
    addTip($('output-select'), "To switch between viewing the textual and graphical output of your program, use the menu below the output.");
    addTip($('downloadbutton'), "To download your program to your computer, click the download button.");
    document.body.appendChild(obscurer);
    nextTip();
}
