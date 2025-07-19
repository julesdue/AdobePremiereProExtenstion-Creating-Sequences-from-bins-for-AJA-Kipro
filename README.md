# AdobePremiereProExtenstion-Creating-Sequences-from-bins-for-AJA-Kipro
An Adobe PremierePro Extenstion for creating multiple seuqnces from selected bins. It used very specific sequence presets (which are stored in the lib folder) to create the sequences.

## Status
This proejct is work in progress.

## Enable loading of unsigned panels
On MacOS, type the following into Terminal, then relaunch Finder (either via rebooting, or from the Force Quit dialog):

```
defaults write /Users/<username>/Library/Preferences/com.adobe.CSXS.11.plist PlayerDebugMode 1
```

On Windows, make the following registry entry (a new Key, of type String):
<img width="1206" height="630" alt="Registry image" src="https://github.com/user-attachments/assets/936a25dd-7bc5-49b1-a8b6-0d8b5af81818" />


## Put the folder into extensions directory
Put /PProPanel or your own panel's containing directory here, to have Premiere Pro load it:

```
Windows:    C:\Program Files (x86)\Common Files\Adobe\CEP\extensions
Mac:        /Library/Application Support/Adobe/CEP/extensions
```
Note: That's the root /Library, not a specific user's ~/Library...
