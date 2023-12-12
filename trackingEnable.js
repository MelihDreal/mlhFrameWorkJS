// -----JS CODE-----
// TrackingEnable.js
// Version: 0.1.0
// Event: On Awake
// Description: Toggles object according to tracking status

// @input SceneObject tracking;
// @input SceneObject[] objectsToEnable;

var trackingObj;
const trackingTypes = { None: "none", Body: "body", Head: "head" };
var trackingObjType = trackingTypes.None;
var errorMsg = "Error: please provide required inputs!";

if (validInputs()) {
    // determines if tracking object is head or body.
    if (!isNull(script.tracking.getComponent("Component.Head"))) {
        trackingObjType = trackingTypes.Head;
        trackingObj = script.tracking.getComponent("Component.Head");
    } else if (
        !isNull(script.tracking.getComponent("Component.ObjectTracking3D"))
    ) {
        trackingObjType = trackingTypes.Body;
        trackingObj = script.tracking.getComponent("Component.ObjectTracking3D");
    }

    // checks if tracking object is in frame to determine whether to enable
    // or disable scene objects.
    var updateEvent = script.createEvent("LateUpdateEvent");
    updateEvent.bind(function() {
        if (trackingObjType == trackingTypes.Body) {
            if (!trackingObj.isTracking()) {
                enableObjects(false);
            } else {
                enableObjects(true);
            }
        } else if (trackingObjType == trackingTypes.Head) {
            if (!trackingObj.getFacesCount() > 0) {
                enableObjects(false);
            } else {
                enableObjects(true);
            }
        }
    });
} else {
    print(errorMsg);
}

// Helper functions

function enableObjects(enable) {
    var objects = script.objectsToEnable;
    for (var i = 0; i < objects.length; i++) {
        if (!isNull(objects[i])) {
            if (objects[i].enabled !== enable) {
                objects[i].enabled = enable;
            }
        }
    }
}

function validInputs() {
    if (script.tracking && script.objectsToEnable) {
        var name = script.tracking.name;
        if (name.includes("Body Tracking") || name.includes("Head")) {
            return true;
        } else {
            errorMsg =
        "Error: Please provide body tracking or head binding tracking component!";
        }
    } else {
        return false;
    }
}
