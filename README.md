# AdobePremiereProExtenstion-Creating-Sequences-from-bins-for-AJA-Kipro
An Adobe PremierePro Extenstion for creating multiple seuqnces from selected bins. It used very specific sequence presets (which are stored in the lib folder) to create the sequences.

## Status
This proejct is work in progress.



## Loading the extenstion

### 1. Enable loading of unsigned panels
| Application | Host ID(Product SAPCode) |CC 2019 Version|CC 2020 Version|FY 2020|FY2021|FY2024|FY2025 ???
| ------------- | ------------- | ------------- | ------------- | ------------- | ------------- |------------- |------------- |
|Premiere Pro|	PPRO|	13 (CEP 9)|14 (CEP 9)| 14.4 (CEP 10) | 15.4(CEP 11)  | 25.0 (CEP 12) | ??? |

https://github.com/Adobe-CEP/CEP-Resources/blob/master/CEP_12.x/Documentation/CEP%2012%20HTML%20Extension%20Cookbook.md#applications-integrated-with-cep

#### Windows
Make the following registry entry (a new Key, of type String):
```
Computer\HKEY_CURRENT_USER\Software\Adobe\CSXS.12
```
```
PlayerDebugMode 1
```

<img width="50%" alt="Registry image" src="https://github.com/user-attachments/assets/936a25dd-7bc5-49b1-a8b6-0d8b5af81818" />

#### MacOS
On MacOS, type the following into Terminal, then relaunch Finder (either via rebooting, or from the Force Quit dialog):
```
defaults write /Users/<username>/Library/Preferences/com.adobe.CSXS.12.plist PlayerDebugMode 1
```



### 2. Put the folder into extensions directory
Put the entire folder "com.julian.kiproSequences" into the extenstion directory of Premiere Pro to load it on startup.

```
Windows:    C:\Program Files (x86)\Common Files\Adobe\CEP\extensions
Mac:        /Library/Application Support/Adobe/CEP/extensions
```
Note: Not the user extenstion folder but the main program directory.
