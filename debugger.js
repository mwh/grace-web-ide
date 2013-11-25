function examineException(exception) {
    popupBox(function(div) {
        div.classList.add('exception-popup');
        div.appendChild($t('Available stack frames:'));
        var ol = $c('ol');
        for (var i=0; i<exception.stackFrames.length; i++) {
            var frame = exception.stackFrames[i];
            var li = $c('li');
            var vl = $c('dl');
            var numVariables = 0;
            frame.forEach(function(name, value) {
                createVarDTDD(name, value, vl);
                numVariables++;
            });
            vl.style.display = 'none';
            li.addEventListener('click', function() {
                this.removeChild(this.firstChild);
                if (this.lastChild.style.display == 'none') {
                    this.lastChild.style.display = 'block';
                    this.insertBefore($t('▾'), this.firstChild);
                } else {
                    this.lastChild.style.display = 'none';
                    this.insertBefore($t('▸'), this.firstChild);
                }
            });
            li.appendChild($t('▸'));
            li.appendChild($t(frame.methodName + ' (' + numVariables + ')'));
            li.appendChild(vl);
            ol.appendChild(li);
        }
        div.appendChild(ol);
    });
}

function createVarDTDD(name, value, vl) {
    var isUserObj = value.data;
    var dt = $c('dt');
    if (isUserObj)
        dt.appendChild($t('▸'));
    dt.appendChild($t(name));
    var dd = $c('dd');
    dd.appendChild($t(getDebugString(value)));
    if (isUserObj) {
        dd.addEventListener('click', function(ev) {
            ev.stopPropagation();
            var dt = this.previousSibling;
            dt.removeChild(dt.firstChild);
            if (this.getElementsByTagName('dl').length) {
                dt.insertBefore($t('▸'), dt.firstChild);
                this.removeChild(this.getElementsByTagName('dl')[0]);
            } else {
                dt.insertBefore($t('▾'), dt.firstChild);
                offerObjectInspection(value, this);
            }
        });
        dt.addEventListener('click', function(ev) {
            ev.stopPropagation();
            dd.click();
        });
    }
    vl.appendChild(dt);
    vl.appendChild(dd);
}

function getDebugString(value) {
    var debugString = "unknown";
    try {
        if (typeof value == "undefined") {
            debugString = "uninitialised";
        } else {
            var debugString = callmethod(value,
                "asDebugString", [0])._value;
        }
    } catch(e) {
        debugger
        debugString = "<[Error calling asDebugString"
            + ": " + e.message._value + "]>";
    }
    debugString = debugString.replace("\\", "\\\\");
    debugString = debugString.replace("\n", "\\n");
    if (debugString.length > 60)
        debugString = debugString.substring(0,57) + "...";
    return debugString;
}

function offerObjectInspection(obj, par) {
    var vl = $c('dl');
    var methods = [];
    for (var name in obj.data) {
        var value = obj.data[name];
        createVarDTDD(name, value, vl);
    }
    par.appendChild(vl);
}
