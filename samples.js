var samples = {};

window.onload = function() {
    var sm = document.getElementById('sample');
    for (var s in samples) {
        var opt = document.createElement('option');
        opt.value = s;
        opt.innerHTML = samples[s].name;
        sm.appendChild(opt);
    }
};

function loadSampleJS(k) {
    if (window[gcMod(k)])
        return;
    var sample = samples[k];
    var jobID = createJob("Load " + k + "'s precompiled JavaScript");
    getFile("./samples/" + sample.dir + '/' + k + ".js", function(text) {
        var theModule;
        eval(text);
        eval("theModule = " + gcMod(k) + ";");
        window[gcMod(k)] = theModule;
        bgMinigrace.postMessage({action: 'import', modname: k,
            code: text});
        completeJob(jobID, 'good');
        if (moduleTabs[k]) {
            moduleTabs[k].noCompile = false;
            moduleTabs[k].changedSinceLast = false;
        } else
            updateScheduledTab(k, {noCompile: false, noImmediateCompile: true});
    }, function() {
        compileTab(k, sample.requires);
        completeJob(jobID, 'bad');
    });
}

function loadSample(k, force) {
    var sample = samples[k];
    if (sample.requires) {
        for (var i=0; i<sample.requires.length; i++)
            loadSample(sample.requires[i]);
    }
    var jobID = createJob("Load " + k + " sample");
    getFile("./samples/" + sample.dir + '/' + k + ".grace", function(text) {
        completeJob(jobID, 'good');
        if (force && moduleTabs[k]) {
            moduleTabs[k].editor.setValue(text, -1);
        }
        scheduleTab(k, text, true);
        loadSampleJS(k);
    }, function() {
        completeJob(jobID, 'bad');
    });
}

function samplesClickListener() {
    popupBox(function(odiv) {
        odiv.appendChild($t("Choose a sample to load"));
        var textinput = $c('input', {type: 'text', style: 'width: 100%'});
        $ac(odiv, textinput);
        textinput.addEventListener('input', function() {
            var needleBits = this.value.toLowerCase().split(' ');
            for (var i=0; i<div.childNodes.length; i++) {
                var el = div.childNodes[i];
                if (!el.dataset)
                    continue;
                el.style.display = 'none';
                var samp = samples[el.dataset.module];
                var matched = true;
                for (var j=0; j<needleBits.length; j++) {
                    var needle = needleBits[j];
                    if (!needle) continue;
                    if (!(el.dataset.module.toLowerCase().indexOf(needle) != -1
                        || samp.description.toLowerCase().indexOf(needle) != -1
                        || samp.name.toLowerCase().indexOf(needle) != -1))
                        matched = false;
                }
                if (matched)
                    el.style.display = 'block';
            }
            var lastDisplayed;
            for (var i=div.childNodes.length-1; i>=0; i--) {
                if (div.childNodes[i].style.display == 'none'
                    && lastDisplayed) {
                    var d = div.childNodes[i];
                    div.removeChild(d);
                    div.insertBefore(d, lastDisplayed.nextSibling);
                } else if (!lastDisplayed) {
                    lastDisplayed = div.childNodes[i];
                }
            }
        });
        textinput.addEventListener('keypress', function(ev) {
            if (ev.keyCode == 13) {
                if (div.childNodes[1].style.display == 'none') {
                    odiv.parentNode.removeChild(odiv);
                    loadSample(div.childNodes[0].dataset.module, true);
                }
            }
        });
        var div = $c('div');
        div.classList.add('samples-list');
        var categories = {"All": []};
        for (var s in samples) {
            var samp = samples[s];
            categories["All"].push(s);
            if (!samp.categories)
                continue;
            var cats = samp.categories;
            for (var i=0; i<cats.length; i++) {
                if (!categories[cats[i]])
                    categories[cats[i]] = [];
                categories[cats[i]].push(s);
            }
        }
        var fdiv = $c('div');
        $ac(fdiv, $t("Filter: "));
        for (var cat in categories) {
            var cl = $c('a');
            cl.style.display = 'inline-block';
            cl.style.marginRight = '1ex';
            cl.style.cursor = 'pointer';
            $ac(cl, $t(cat + " (" + categories[cat].length + ") "));
            $ac(fdiv, cl);
            cl.dataset.category = cat;
            cl.addEventListener('click', function() {
                var as = this.parentNode.getElementsByTagName('a');
                for (var i=0; i<as.length; i++)
                  as[i].style.fontWeight = 'normal';
                this.style.fontWeight = 'bold';
                for (var i=0; i<div.childNodes.length; i++) {
                    var el = div.childNodes[i];
                    var cur = categories[this.dataset.category];
                    if (!el.dataset)
                        continue;
                    el.style.display = 'none';
                    for (var j=0; j<cur.length;j++) {
                        if (cur[j] == el.dataset.module)
                            el.style.display = 'block';
                    }
                }
                var lastDisplayed;
                for (var i=div.childNodes.length-1; i>=0; i--) {
                    if (div.childNodes[i].style.display == 'none'
                        && lastDisplayed) {
                        var d = div.childNodes[i];
                        div.removeChild(d);
                        div.insertBefore(d, lastDisplayed.nextSibling);
                    } else if (!lastDisplayed) {
                        lastDisplayed = div.childNodes[i];
                    }
                }
            });
        }
        odiv.appendChild(fdiv);
        odiv.appendChild(div);
        setTimeout(function() {textinput.focus();}, 100);
        var sampDivs = {};
        for (var s in samples) {
            var samp = samples[s];
            var sdiv = $c('div');
            sampDivs[s] = sdiv;
            sdiv.dataset.module = s;
            var title = $c('h2');
            $ac(title, $t(samp.name));
            var loadButton = $c('input', {'type': 'button', value: 'Load'});
            loadButton.style = "float: right;";
            loadButton.style['float'] = "right";
            loadButton.addEventListener('click', function() {
                odiv.parentNode.removeChild(odiv);
                loadSample(this.dataset.module, true);
            });
            $ac(sdiv, loadButton);
            $ac(sdiv, title);
            loadButton.dataset.module = s;
            if (samp.description) {
                var req = $c('p');
                $ac(req, $t(samp.description));
                $ac(sdiv, req);
            }
            if (samp.requires && samp.requires.length) {
                var req = $c('p');
                $ac(req, $t("Uses: "));
                for (var j=0; j<samp.requires.length; j++) {
                    if (j)
                        $ac(req, $t(", "));
                    var a = $c('a');
                    $ac(a, $t(samples[samp.requires[j]].name));
                    a.href = "javascript:;";
                    a.dataset.module = samp.requires[j];
                    a.dataset.relative = s;
                    a.addEventListener('click', function() {
                        jumpTo(this.dataset.module, this.dataset.relative);
                    });
                    $ac(req, a);
                }
                $ac(sdiv, req);
            }
            if (samp.usedBy && samp.usedBy.length) {
                var req = $c('p');
                $ac(req, $t("Used by: "));
                for (var j=0; j<samp.usedBy.length; j++) {
                    if (j)
                        $ac(req, $t(", "));
                    var a = $c('a');
                    $ac(a, $t(samples[samp.usedBy[j]].name));
                    a.href = "javascript:;";
                    a.dataset.module = samp.usedBy[j];
                    a.dataset.relative = s;
                    a.addEventListener('click', function() {
                        jumpTo(this.dataset.module, this.dataset.relative);
                    });
                    $ac(req, a);
                }
                $ac(sdiv, req);
            }
            $ac(div, sdiv);
        }
        var jumpTo = function(name, relativeTo) {
            sampDivs[name].style.display = 'block';
            if (relativeTo) {
                var relDiv = sampDivs[relativeTo];
                sampDivs[name].parentNode.removeChild(sampDivs[name]);
                div.insertBefore(sampDivs[name], sampDivs[relativeTo]);
            }
            div.scrollTop = sampDivs[name].offsetTop - 100;
            highlight(sampDivs[name]);
        }
    });
}

window.addEventListener('load', function() {
    getFile("./samples/index.json", function(text) {
        samples = JSON.parse(text);
        for (var s in samples)
            samples[s].usedBy = [];
        for (var s in samples) {
            if (samples[s].requires)
                for (var i=0; i<samples[s].requires.length; i++)
                    samples[samples[s].requires[i]].usedBy.push(s);
        }
    });
});
