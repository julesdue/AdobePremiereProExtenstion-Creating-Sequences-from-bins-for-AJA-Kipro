$._PPP_ = $._PPP_ || {};

$._PPP_.exportSequencesToME = function(binName, exportBasePath, extensionBase) {
    app.encoder.launchEncoder();
    var project = app.project;
    
    // Determine path separator based on OS
    var sep;
    if ($.os.indexOf('Windows') >= 0) {
        sep = '\\';
    } else if ($.os.indexOf('Macintosh') >= 0) {
        sep = '/';
    } else {
        sep = '/'; // Default to forward slash for other OS
    }

    // Find the bin by name
    function findBinByName(root, name) {
        for (var i = 0; i < root.children.numItems; i++) {
            var item = root.children[i];
            if (item && item.type === ProjectItemType.BIN && item.name === name) {
                return item;
            }
            if (item && item.type === ProjectItemType.BIN) {
                var found = findBinByName(item, name);
                if (found) return found;
            }
        }
        return null;
    }
    var bin = findBinByName(project.rootItem, binName);
    if (!bin) {
        $._PPP_.updateEventPanel('[ME Export] Bin not found: ' + binName);
        return;
    }

    // Prepare export output base path using the bin name as subfolder
    var outputBase = exportBasePath;
    if (outputBase && outputBase.length > 0) {
        if (outputBase.slice(-1) !== sep) outputBase += sep;
        outputBase += binName + sep;
    } else {
        outputBase = extensionBase;
    }

    var exportedCount = 0;
    for (var i = 0; i < bin.children.numItems; i++) {
        var projItemFile = bin.children[i];
        if (projItemFile && projItemFile.name && projItemFile.name.slice(-4) === '_dnx') {
            // Find the sequence object by name
            var targetSeq = null;
            for (var s = 0; s < app.project.sequences.numSequences; s++) {
                if (app.project.sequences[s].name === projItemFile.name) {
                    targetSeq = app.project.sequences[s];
                    break;
                }
            }
            if (!targetSeq) {
                $._PPP_.updateEventPanel('[ME Export] Could not find sequence object for: ' + projItemFile.name);
                continue;
            }
            app.project.activeSequence = targetSeq;
            var seqName = projItemFile.name;
            var presetPath = extensionBase + 'KiPro_ndxhd-hqx10bit_FHD_8ChMono_48kHz_24bit_23LUFs_ver2-5.epr';
            var outputPath = outputBase + seqName + '.mov';
            var workArea = 0; // ENCODE_ENTIRE
            var removeUponCompletion = 0;
            var jobId = app.encoder.encodeSequence(targetSeq, outputPath, presetPath, workArea, removeUponCompletion);
            if (jobId && jobId !== '0') {
                $._PPP_.updateEventPanel('[ME Export] Sent to Media Encoder: ' + seqName);
                exportedCount++;
            } else {
                $._PPP_.updateEventPanel('[ME Export] Failed to send: ' + seqName);
            }
        }
    }
    $._PPP_.updateEventPanel('[ME Export] Exported ' + exportedCount + ' sequences from bin: ' + binName);
};
