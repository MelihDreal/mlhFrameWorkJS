// -----JS CODE-----
//@input SceneObject box
// Create a scene object with a collider component.
var collider = script.getSceneObject().getComponent("Physics.ColliderComponent");
 
collider.overlapFilter.includeIntangible = false;
collider.overlapFilter.includeDynamic = true;
collider.overlapFilter.includeStatic = true;
 
// Print overlap events.
collider.onOverlapEnter.add(function (e) {
    print("OverlapEnter(" + e.overlap.id + "): " + e.overlap.collider);
    print("please subscribe");
    script.box.enabled = false;a
});
collider.onOverlapStay.add(function (e) {
    var overlapCount = e.currentOverlapCount;
    if (overlapCount == 0) {
        return;
    }
    var overlaps = e.currentOverlaps;
    for (var i = 0; i < overlaps.length; ++i) {
        var overlap = overlaps[i];
        print("Overlap[" + i + "]: id=" + overlap.id + ", collider=" + overlap.collider);
    }
});
collider.onOverlapExit.add(function (e) {
    print("OverlapExit(" + e.overlap.id + ")");
});



// -----JS CODE-----

// @input SceneObject box
// @input SceneObject sphere

var collider = script.box.getComponent("Physics.ColliderComponent");
var colSphere = script.sphere.getComponent("Physics.ColliderComponent");

collider.onOverlapEnter.add(function (e) {
    print("OverlapEnter(" + e.overlap.id + "): " + e.overlap.collider);
    script.sphere.enabled = false;
});

//https://www.youtube.com/watch?v=ZQFI5vVsuuo