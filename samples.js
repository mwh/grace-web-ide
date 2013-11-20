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
    document.getElementById('stderr_txt').value += "\nUI: Loading sample dependency " + sample.name;
    var req = new XMLHttpRequest();
    req.open("GET", "./sample/" + sample.dir + '/' + k + ".js", false);
    req.send(null);
    if (req.status == 200) {
        var theModule;
        eval(req.responseText);
        eval("theModule = gracecode_" + k + ";");
        window['gracecode_' + k] = theModule;
    } else {
        alert("Loading sample JavaScript code failed: retrieving " + k +
                " returned " + req.status);
    }
    req.open("GET", "./samples/" + sample.dir + '/' + k + ".gct", false);
    req.send(null);
    if (req.status == 200) {
        gctCache[k] = req.responseText;
    } else {
        alert("Loading sample JavaScript code metadata failed: retrieving "
                + k + " returned " + req.status);
    }
}

function loadSample(k) {
    var sample = samples[k];
    document.getElementById('stderr_txt').value = "UI: Loading " + sample.name;
    if (sample.requires) {
        for (var i=0; i<sample.requires.length; i++)
            loadSample(sample.requires[i]);
    }
    var req = new XMLHttpRequest();
    req.open("GET", "./samples/" + sample.dir + '/' + k + ".grace", false);
    req.send(null);
    if (req.status == 200) {
        scheduleTab(k, req.responseText);
    }
    document.getElementById('stderr_txt').value += "\nUI: done loading sample.\n";
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
            loadSample(select.value);
            div.remove();
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
