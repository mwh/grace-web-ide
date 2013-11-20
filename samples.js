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
    var req = new XMLHttpRequest();
    req.open("GET", "./samples/" + sample.dir + '/' + k + ".js", true);
    req.onreadystatechange = function() {
        if (req.readyState == 4) {
            if (req.status == 200) {
                var theModule;
                eval(req.responseText);
                eval("theModule = gracecode_" + k + ";");
                window['gracecode_' + k] = theModule;
                bgMinigrace.postMessage({action: 'import', modname: k,
                    code: req.responseText});
                completeJob(jobID, 'good');
            } else {
                compileTab(k, sample.requires);
                completeJob(jobID, 'bad');
            }
        }
    };
    req.send(null);
}

function loadSample(k) {
    var sample = samples[k];
    if (sample.requires) {
        for (var i=0; i<sample.requires.length; i++)
            loadSample(sample.requires[i]);
    }
    var jobID = createJob("Load " + k + " sample");
    var req = new XMLHttpRequest();
    req.open("GET", "./samples/" + sample.dir + '/' + k + ".grace", true);
    req.onreadystatechange = function() {
        if (req.readyState == 4) {
            if (req.status == 200) {
                completeJob(jobID, 'good');
                scheduleTab(k, req.responseText, true);
                loadSampleJS(k);
            } else
                completeJob(jobID, 'bad');
        }
    }
    req.send(null);
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
    var req = new XMLHttpRequest();
    req.open("GET", "./samples/index.json", true);
    req.onreadystatechange = function() {
        if (req.readyState == 4) {
            if (req.status == 200) {
                samples = JSON.parse(req.responseText);
            }
        }
    };
    req.send(null);
});
