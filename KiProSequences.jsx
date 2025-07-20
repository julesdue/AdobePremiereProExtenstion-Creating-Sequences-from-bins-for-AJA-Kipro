$._PPP_ = $._PPP_ || {};

// if(typeof($)=='undefined') {
// 	$={};
// }

// $._ext = {
// 	//Evaluate a file and catch the exception.
// 	evalFile : function(path) {
// 		try {
// 			$.evalFile(path);
// 		} catch (e) {alert("Exception:" + e);}
// 	},
// 	// Evaluate all the files in the given folder 
// 	evalFiles: function(jsxFolderPath) {
// 		var folder = new Folder(jsxFolderPath);
// 		if (folder.exists) {
// 			var jsxFiles = folder.getFiles("*.jsx");
// 			for (var i = 0; i < jsxFiles.length; i++) {
// 				var jsxFile = jsxFiles[i];
// 				$._ext.evalFile(jsxFile);
// 			}
// 		}
// 	},
// 	// entry-point function to call scripts more easily & reliably
// 	callScript: function(dataStr) {
// 		try {
// 			var dataObj = JSON.parse(decodeURIComponent(dataStr));
// 			if (
// 				!dataObj ||
// 				!dataObj.namespace ||
// 				!dataObj.scriptName ||
// 				!dataObj.args
// 			) {
// 				throw new Error('Did not provide all needed info to callScript!');
// 			}
// 			// call the specified jsx-function
// 			var result = $[dataObj.namespace][dataObj.scriptName].apply(
// 				null,
// 				dataObj.args
// 			);
// 			// build the payload-object to return
// 			var payload = {
// 				err: 0,
// 				result: result
// 			};
// 			return encodeURIComponent(JSON.stringify(payload));
// 		} catch (err) {
// 			var payload = {
// 				err: err
// 			};
// 			return encodeURIComponent(JSON.stringify(payload));
// 		}
// 	}
// };

// // Load all other JSX files in the jsx folder (except this one)
// (function() {
// 	var thisFile = File($.fileName).name;
// 	var jsxFolder = new Folder(File($.fileName).parent + '/jsx');
// 	if (jsxFolder.exists) {
// 		var jsxFiles = jsxFolder.getFiles('*.jsx');
// 		for (var i = 0; i < jsxFiles.length; i++) {
// 			var file = jsxFiles[i];
// 			if (file.name !== thisFile) {
// 				$.evalFile(file);
// 			}
// 		}
// 	}
// })();








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
    
    // Log all items in the bin for debugging
    var binItemsMsg = 'Bin items:';
    for (var bi = 0; bi < bin.children.numItems; bi++) {
        var bitem = bin.children[bi];
        binItemsMsg += ' [' + bi + '] name=' + (bitem ? bitem.name : 'null') + ', type=' + (bitem ? bitem.type : 'null') + ';';
    }
    $._PPP_.updateEventPanel(binItemsMsg);
    
    // Prepare export output base path using the bin name as subfolder
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
    if ($.os && $.os.toLowerCase().indexOf('windows') >= 0) {
        sep = '/';
    } else {
        sep = '/'; // Default to forward slash for Mac and other OS
    }

    var extensionBase = extensionPath;
    $._PPP_.updateEventPanel('Extension path: ' + extensionBase);
    if (extensionBase.slice(-1) !== sep) extensionBase += sep;
    extensionBase += 'payloads' + sep;
    $._PPP_.updateEventPanel('Using extension base path: ' + extensionBase);

    // starting loop to create sequences
    var createdCount = 0;
    for (var i = 0; i < bin.children.numItems; i++) {
        var projItemFile = bin.children[i];
        if (projItemFile && projItemFile.type === ProjectItemType.CLIP) {
            
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
            
            // Create the sequence with the specified preset
            $._PPP_.updateEventPanel('before create sequence');
            var newSeq = app.project.newSequence(seqName, presetPath);
            $._PPP_.updateEventPanel('Created sequence: ' + newSeq.name + ' with preset: ' + presetPath);
            
            // Insert the clip into the sequence
            var offset = 14;
            newSeq.videoTracks[0].insertClip(projItemFile, offset, 0, 0);
            $._PPP_.updateEventPanel(projItemFile.name + ' added to sequence: ' + newSeq.name);
            
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
