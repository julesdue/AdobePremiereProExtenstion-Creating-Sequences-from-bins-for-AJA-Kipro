$._PPP_ = $._PPP_ || {};

$._PPP_.createSequencesFromBin = function(binName, blackFrameName, payloadsPath, sep) {
    $._PPP_.updateEventPanel('createSequencesFromBin called');

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
    
    // Log all items in the bin for debugging
    var binItemsMsg = 'Bin items:';
    for (var bi = 0; bi < bin.children.numItems; bi++) {
        var bitem = bin.children[bi];
        binItemsMsg += ' [' + bi + '] name=' + (bitem ? bitem.name : 'null') + ', type=' + (bitem ? bitem.type : 'null') + ';';
    }
    $._PPP_.updateEventPanel(binItemsMsg);
    
    // search for the black frame item
    var projItemBlackFrame = null;
    for (var i = 0; i < project.rootItem.children.numItems; i++) {
        var item = project.rootItem.children[i];
        if (item) {
            if (item.name === blackFrameName) {
                projItemBlackFrame = item;
                break;
            }
        }
    }
    if (!projItemBlackFrame) {
        $._PPP_.updateEventPanel('Black frame not found. Searched for: ' + blackFrameName);
    }

    // starting loop to create sequences
    var createdCount = 0;
    for (var i = 0; i < bin.children.numItems; i++) {
        var projItemFile = bin.children[i];
        if (projItemFile && projItemFile.name.slice(-4) !== '_dnx') {
            
            $._PPP_.updateEventPanel('### START CLIP ###');
            
            // Find the sequence object by name
            var interp = projItemFile.getFootageInterpretation();
            var fps = interp.frameRate;
            $._PPP_.updateEventPanel('Clip: ' + projItemFile.name + ' | FPS: ' + fps);
            
            // Match preset filenames: 23.976...→23976, 29.97...→2997, 24/25/30→24/25/30
            var fpsPreset;
            var fpsNum = parseFloat(fps);
            if (fpsNum >= 23 && fpsNum < 24) {
                $._PPP_.updateEventPanel('Matched 23.976 fps range, using 23976');
                fpsPreset = '23976';
            } else if (fpsNum >= 29 && fpsNum < 30) {
                $._PPP_.updateEventPanel('Matched 29.97 fps range, using 2997');
                fpsPreset = '2997';
            } else if (Math.abs(fpsNum - 24) < 0.1) {
                $._PPP_.updateEventPanel('Matched 24 fps, using 24');
                fpsPreset = '24';
            } else if (Math.abs(fpsNum - 25) < 0.1) {
                $._PPP_.updateEventPanel('Matched 25 fps, using 25');
                fpsPreset = '25';
            } else if (Math.abs(fpsNum - 30) < 0.1) {
                $._PPP_.updateEventPanel('Matched 30 fps, using 30');
                fpsPreset = '30';
            } else {
                $._PPP_.updateEventPanel('No match for fps, using: ' + fpsNum.toString().replace(/[,\.]/g, ''));
                fpsPreset = fpsNum.toString().replace(/[,\.]/g, '');
            }

            // loading sqrpreset
            $._PPP_.updateEventPanel('payloadsPath: ' + payloadsPath);
            var presetPath = payloadsPath + 'KiPro_FHD_8Ch_' + fpsPreset + 'fps.sqpreset';
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
            
            // Create the sequence with the specified preset
            $._PPP_.updateEventPanel('before create sequence');
            var newSeq = app.project.newSequence(seqName, presetPath);
            $._PPP_.updateEventPanel('Created sequence: ' + newSeq.name + ' with preset: ' + presetPath);
            
            // Insert the clip into the sequence
            var offset = 14;
            newSeq.videoTracks[0].insertClip(projItemFile, offset, 0, 0);
            $._PPP_.updateEventPanel(projItemFile.name + ' added to sequence: ' + newSeq.name);
            
            // Log the components of the inserted clip
			
            var insertedClipComponents = newSeq.videoTracks[0].clips[0].components;
            // $._PPP_.updateEventPanel('Components of the inserted clip: [' + Array.from(insertedClipComponents).map(c => c.displayName).join(', ') + ']');
            
            // Iterate through the components of the inserted clip
            var componentsLog = 'Components of the inserted clip:';
            for (var c = 0; c < insertedClipComponents.numItems; c++) {
                var component = insertedClipComponents[c];
                componentsLog += ' [' + c + '] displayName=' + component.displayName + ';';
            }
            $._PPP_.updateEventPanel(componentsLog);
            
            // Iterate through the properties of each component of the inserted clip
            var propertiesLog = 'Properties of the components of the inserted clip:';
            for (var c = 0; c < insertedClipComponents.numItems; c++) {
                var component = insertedClipComponents[c];
                for (var p = 0; p < component.properties.numItems; p++) {
                    var property = component.properties[p];
                    propertiesLog += ' [Component ' + c + ', Property ' + p + '] displayName=' + property.displayName + ';';
                }
            }
            $._PPP_.updateEventPanel(propertiesLog);
            
            // Add the black frame at the start if it exists
            newSeq.videoTracks[0].insertClip(projItemBlackFrame, 0, 0, 0);
            $._PPP_.updateEventPanel('Black frame added to sequence: ' + newSeq.name);
            
            // Move the sequence to the bin
            var numItems = app.project.rootItem.children.numItems;
            for (var t = 0; t < numItems; t++) {
                if(app.project.rootItem.children[t].name.indexOf(newSeq.name) > -1){
                    var targetSeq = app.project.rootItem.children[t];
                }
            }
            targetSeq.moveBin(bin);
            $._PPP_.updateEventPanel('Moved sequence: ' + targetSeq.name + ' to bin: ' + bin.name);
            
            // Update the event panel with the created sequence
            createdCount++;
            $._PPP_.updateEventPanel('### END CLIP ###');
        }
    }
    $._PPP_.updateEventPanel("Created " + createdCount + " sequences for files in bin: " + binName);
};

$._PPP_.exportSequencesToME = function(binName, exportBasePath, payloadsPath, sep) {
    $._PPP_.updateEventPanel('exportSequencesToME called');

    app.encoder.launchEncoder();
    var project = app.project;

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
            var presetPath = payloadsPath + 'KiPro_ndxhd-hqx10bit_FHD_8ChMono_48kHz_24bit_23LUFs_ver2-5.epr';
            var outputPath = exportBasePath + sep + binName + sep + seqName + '.mov';
            $._PPP_.updateEventPanel('[ME Export] Constructed export path: ' + seqName + ' to ' + outputPath);
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