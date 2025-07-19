$._PPP_ = $._PPP_ || {};

$._PPP_.createSequencesFromBin = function(binName, extensionPath) {
    var project = app.project;
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
        $._PPP_.updateEventPanel("Bin not found: " + binName);
        return;
    }
    $._PPP_.updateEventPanel('Processing bin: ' + binName + ', items: ' + bin.children.numItems);
    var binItemsMsg = 'Bin items:';
    for (var bi = 0; bi < bin.children.numItems; bi++) {
        var bitem = bin.children[bi];
        binItemsMsg += ' [' + bi + '] name=' + (bitem ? bitem.name : 'null') + ', type=' + (bitem ? bitem.type : 'null') + ';';
    }
    $._PPP_.updateEventPanel(binItemsMsg);
    var projItemBlackFrame = null;
    var blackFrameNames = [
        "black",
        "black_frame",
        "filler_frame",
        "schwarz",
        "schwarzer_frame",
        "schwarz_frame"
    ];
    for (var i = 0; i < project.rootItem.children.numItems; i++) {
        var item = project.rootItem.children[i];
        if (item) {
            for (var j = 0; j < blackFrameNames.length; j++) {
                if (item.name === blackFrameNames[j]) {
                    projItemBlackFrame = item;
                    break;
                }
            }
            if (projItemBlackFrame) break;
        }
    }
    if (!projItemBlackFrame) {
        $._PPP_.updateEventPanel('Black frame not found. Searched for: ' + blackFrameNames.join(', '));
    }

    // Determine path separator based on OS
    var sep;
    if ($.os.indexOf('Windows') >= 0) {
        sep = '\\';
    } else if ($.os.indexOf('Macintosh') >= 0) {
        sep = '/';
    } else {
        sep = '/'; // Default to forward slash for other OS
    }

    var extensionBase = extensionPath;
    if (extensionBase.slice(-1) !== sep) extensionBase += sep;
    extensionBase += 'payloads' + sep;
    var createdCount = 0;
    for (var i = 0; i < bin.children.numItems; i++) {
        var projItemFile = bin.children[i];
        if (projItemFile && projItemFile.type === ProjectItemType.CLIP) {
            
            $._PPP_.updateEventPanel('### START CLIP ###');
            
            var interp = projItemFile.getFootageInterpretation();
            var fps = interp.frameRate;
            $._PPP_.updateEventPanel('Clip: ' + projItemFile.name + ' | FPS: ' + fps);
            
            // Match preset filenames: 23.976...→23976, 29.97...→2997, 24/25/30→24/25/30
            var fpsPreset;
            var fpsNum = parseFloat(fps);
            if (fpsNum >= 23 && fpsNum < 24) {
                fpsPreset = '23976';
            } else if (fpsNum >= 29 && fpsNum < 30) {
                fpsPreset = '2997';
            } else if (Math.abs(fpsNum - 24) < 0.1) {
                fpsPreset = '24';
            } else if (Math.abs(fpsNum - 25) < 0.1) {
                fpsPreset = '25';
            } else if (Math.abs(fpsNum - 30) < 0.1) {
                fpsPreset = '30';
            } else {
                fpsPreset = fpsNum.toString().replace(/[,\.]/g, '');
            }
            var presetPath = extensionBase + 'KiPro_FHD_8Ch_' + fpsPreset + 'fps.sqpreset';
            $._PPP_.updateEventPanel('Using the preset: ' + presetPath);
            
            var seqName = projItemFile.name.replace(/\.[^\.]+$/, '_dnx');
            $._PPP_.updateEventPanel('Attempting to create sequence: ' + seqName);
            
            var exists = false;
            for (var s = 0; s < app.project.sequences.numSequences; s++) {
                if (app.project.sequences[s].name === seqName) {
                    exists = true;
                    break;
                }
            }
            if (exists) {
                $._PPP_.updateEventPanel('Sequence already exists: ' + seqName + ', skipping.');
                continue;
            }
            var newSeq = app.project.newSequence(seqName, presetPath);
            $._PPP_.updateEventPanel('Created sequence: ' + newSeq.name + ' with preset: ' + presetPath);
            var offset = 14;
            newSeq.videoTracks[0].insertClip(projItemFile, offset, 0, 0);
            $._PPP_.updateEventPanel(projItemFile.name + ' added to sequence: ' + newSeq.name);
            newSeq.videoTracks[0].insertClip(projItemBlackFrame, 0, 0, 0);
            $._PPP_.updateEventPanel('Black frame added to sequence: ' + newSeq.name);
            var numItems = app.project.rootItem.children.numItems;
            for (var t = 0; t < numItems; t++) {
                if(app.project.rootItem.children[t].name.indexOf(newSeq.name) > -1){
                    var targetSeq = app.project.rootItem.children[t];
                }
            }
            targetSeq.moveBin(bin);
            $._PPP_.updateEventPanel('Moved sequence: ' + targetSeq.name + ' to bin: ' + bin.name);
            createdCount++;
            $._PPP_.updateEventPanel('### END CLIP ###');
        }
    }
    $._PPP_.updateEventPanel("Created " + createdCount + " sequences for files in bin: " + binName);
};
