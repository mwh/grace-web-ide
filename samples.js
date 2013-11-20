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
    popupBox(function(div) {
        div.appendChild($t("Choose a sample to load"));
        div.appendChild($c('br'));
        var select = $c('select');
        for (var s in samples) {
            var opt = document.createElement('option');
            opt.value = s;
            opt.innerHTML = samples[s].name;
            select.appendChild(opt);
        }
        div.appendChild(select);
        var loadButton = $c('input', {'type': 'button', value: 'Load'});
        loadButton.addEventListener('click', function() {
            div.remove();
            loadSample(select.value);
        });
        div.appendChild(loadButton);
    });
}

window.addEventListener('load', function() {
    getFile("./samples/index.json", function(text) {
        samples = JSON.parse(text);
    });
});
