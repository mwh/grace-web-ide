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
    if (window[k])
        return;
    var sample = samples[k];
    var jobID = createJob("Load " + k + "'s precompiled JavaScript");
    getFile("./samples/" + sample.dir + '/' + k + ".js", function(text) {
        var theModule;
        eval(text);
        eval("theModule = gracecode_" + k + ";");
        window['gracecode_' + k] = theModule;
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

function loadSample(k) {
    var sample = samples[k];
    if (sample.requires) {
        for (var i=0; i<sample.requires.length; i++)
            loadSample(sample.requires[i]);
    }
    var jobID = createJob("Load " + k + " sample");
    getFile("./samples/" + sample.dir + '/' + k + ".grace", function(text) {
        completeJob(jobID, 'good');
        scheduleTab(k, text, true);
        loadSampleJS(k);
    }, function() {
        completeJob(jobID, 'bad');
    });
}

function samplesClickListener() {
    popupBox(function(odiv) {
        odiv.appendChild($t("Choose a sample to load"));
        var div = $c('div', {style: "clear: both; overflow-y: auto; max-height: 40vh;"});
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
            $ac(cl, $t(cat + " (" + categories[cat].length + ") "));
            $ac(fdiv, cl);
            cl.dataset.category = cat;
            cl.addEventListener('click', function() {
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
            });
        }
        odiv.appendChild(fdiv);
        odiv.appendChild(div);
        var sampDivs = {};
        for (var s in samples) {
            var samp = samples[s];
            var sdiv = $c('div');
            sampDivs[s] = sdiv;
            sdiv.dataset.module = s;
            var title = $c('h2');
            $ac(title, $t(samp.name));
            $ac(sdiv, title);
            var loadButton = $c('input', {'type': 'button', value: 'Load',
                'style': 'float: right;'});
            loadButton.addEventListener('click', function() {
                odiv.remove();
                loadSample(this.dataset.module);
            });
            loadButton.dataset.module = s;
            if (samp.description) {
                var req = $c('p');
                $ac(req, $t(samp.description));
                $ac(sdiv, req);
            }
            if (samp.requires && samp.requires.length) {
                var req = $c('p');
                $ac(req, $t("Depends on: "));
                $ac(req, $t(samp.requires.join(", ")));
                $ac(sdiv, req);
            }
            $ac(sdiv, loadButton);
            $ac(div, sdiv);
        }
    });
}

window.addEventListener('load', function() {
    getFile("./samples/index.json", function(text) {
        samples = JSON.parse(text);
    });
});
