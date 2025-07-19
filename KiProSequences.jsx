$._PPP_ = $._PPP_ || {};
$._PPP_.createSequencesFromBin = function(binName) {
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
    // Debug: log ProjectItemType.CLIP value
    // Minimal debug: log bin name and number of items
    $._PPP_.updateEventPanel('Processing bin: ' + binName + ', items: ' + bin.children.numItems);
    // Log all items in the bin
    var binItemsMsg = 'Bin items:';
    for (var bi = 0; bi < bin.children.numItems; bi++) {
        var bitem = bin.children[bi];
        binItemsMsg += ' [' + bi + '] name=' + (bitem ? bitem.name : 'null') + ', type=' + (bitem ? bitem.type : 'null') + ';';
    }
    $._PPP_.updateEventPanel(binItemsMsg);
    
    // get black filler frame by searching for multiple possible names
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

    // Path to the ALPINALE 8channels für 5.1 (kipro) preset, using OS-specific separators
    var sep = ($.os.indexOf('Windows') >= 0) ? '\\' : '/';
    var extensionFolderName = 'com.julian.kiproSequences';
    var extensionBase = $.getenv('USERPROFILE') + sep + 'AppData' + sep + 'Roaming' + sep + 'Adobe' + sep + 'CEP' + sep + 'extensions' + sep + extensionFolderName + sep + 'payloads' + sep;

    // start looping through the bin items
    var createdCount = 0;
    for (var i = 0; i < bin.children.numItems; i++) {
        var projItemFile = bin.children[i];
        if (projItemFile && projItemFile.type === ProjectItemType.CLIP) {
            
            $._PPP_.updateEventPanel('### START CLIP ###');

            // Extract and log the frame rate (fps) of the current clip
            var interp = projItemFile.getFootageInterpretation();
            var fps = interp.frameRate;
            $._PPP_.updateEventPanel('Clip: ' + projItemFile.name + ' | FPS: ' + fps);

            // Dynamic sequence preset adaptation
            fps = fps.toString().replace(/[,\.]/g, ''); // ensure the fps number has no commas or dots
            presetPath = extensionBase + 'KiPro_FHD_8Ch_' + fps + 'fps.sqpreset';
            $._PPP_.updateEventPanel('Using the preset: ' + presetPath);


            // Create sequence name by replacing the file extension with '_dnx'
            var seqName = projItemFile.name.replace(/\.[^\.]+$/, '_dnx');
            $._PPP_.updateEventPanel('Attempting to create sequence: ' + seqName);

            // Check if a sequence with this name already exists
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


            // create new sequence with the preset
            var newSeq = app.project.newSequence(seqName, presetPath);
            $._PPP_.updateEventPanel('Created sequence: ' + newSeq.name + ' with preset: ' + presetPath);


            // add the clip to the sequence and move it to the right position
            var offset = 14; // move 7 + 7 seconds to the right
            newSeq.videoTracks[0].insertClip(projItemFile, offset, 0, 0);
            $._PPP_.updateEventPanel(projItemFile.name + ' added to sequence: ' + newSeq.name);

            // add black frame filler at start
            newSeq.videoTracks[0].insertClip(projItemBlackFrame, 0, 0, 0);
            $._PPP_.updateEventPanel('Black frame added to sequence: ' + newSeq.name);


            // move the created sequence to the bin
            var numItems = app.project.rootItem.children.numItems;
            
            // find the new index of the created sequence because premirer cannot handle objects of items --- whyyyy?
            for (var t = 0; t < numItems; t++) {
                if(app.project.rootItem.children[t].name.indexOf(newSeq.name) > -1){
                    var targetSeq = app.project.rootItem.children[t];
                }
            }
            targetSeq.moveBin(bin);
            $._PPP_.updateEventPanel('Moved sequence: ' + targetSeq.name + ' to bin: ' + bin.name);

            // Increment the created count
            createdCount++;

            $._PPP_.updateEventPanel('### END CLIP ###');
        }
    }

    // Log the total number of created sequences
    $._PPP_.updateEventPanel("Created " + createdCount + " sequences for files in bin: " + binName);
};
