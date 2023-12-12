// -----JS CODE-----
// necklaces.js
// Version: 0.1.0
// Event: On Awake
// Description: Enables the selected neckalce and disable the other necklaces


// @input SceneObject[] necklaces;
// @input Component.ScriptComponent carousel;

var necklaces = script.necklaces;

script.enableNecklaces = function(necklaceIndex) {
    if (necklaces.length > 1) {
        for (var i = 0; i < necklaces.length; i++) {
            if (i == necklaceIndex) {
                necklaces[i].enabled = true;
            } else {
                necklaces[i].enabled = false;
            }
        }
    }
};

