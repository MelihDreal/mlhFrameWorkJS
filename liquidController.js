// LiquidController.js
// Version: 0.0.1
// Event: Lens Initialized
// Description: A controller script that allows you to create a chain like movement of an array of sceneObjects attached by the fist link 


//@ui {"widget":"label", "label":"Simulation Parameters"}
//@input float dampening = 3.5 {"widget":"slider","min":"0.1","max":"10.0", "step": " 0.1"}
//@input float gravity = 9.8 {"widget":"slider","min":"0.01","max":"20.0", "step": " 0.1"}
//@input int iterations = 1 {"widget":"slider","min":"1","max":"30", "step": "1"}
//@input vec2 bubblesInOutSpeed = {1.0, 0.15} {"label":"Bubbles In/Out Speed", "hint":"How fast the bubbles appear and disappear when the object is moved"}
//@input vec2 foamInOutSpeed = {0.35, 0.25} {"label":"Foam In/Out Speed", "hint":"How fast the foam appears and disappears when the object is moved"}
//@input float liquidHeightScript = 0.0 {"label": "Liquid Height"}
//@input bool UseObjectForHeight
//@input SceneObject LiquidHeightObject {"showIf": "UseObjectForHeight"}

//@ui {"widget" : "separator"}

//@ui {"widget":"label", "label":"Resources"}
//@input Asset.Material LiquidMaterial
//@input Asset.Material GlassMaterial
//@input Asset.Material SurfaceDisplacementMaterial

//@input bool ShowAdvanced
//@ui {"widget":"group_start", "label": "Advanced", "showIf": "ShowAdvanced"}
//@input bool EnableGlassFront = true
//@input bool EnableGlassBack = true
//@input bool EnableLiquid = true
//@input bool UseGlassBackMaterial = false
//@input Asset.Material GlassBackMaterial {"showIf": "UseGlassBackMaterial"}
//@ui {"widget":"group_end"}


var bubblesActivationThreshold = 0.001;
var foamActivationThreshold = 0.001;

var points = [];
var constraints = [];
var links = [];

var updatePin = true;
var timeSpeed = 33.0;

var relativeToTransform;
var acc;

script.joints = [];
script.relativeTo = null;
script.addRotation = false;
script.isRelative = false;
script.mass = 1.0;
script.mass0 = 0.0;
script.mass1 = 1.0;
script.restPos = script.dampening * 10.0;
script.stiffness = 1.0;
script.force = new vec3(0, 1, 0);
script.type = 0;

var renderMeshVisual = null;
var bboxMin = null;
var bboxMax = null;

var scaleAvg = 1.0;

var upVec = new vec3(0,1,0);
var springAngle = 0.0;
var springSpeed = 0.0;

var liquidObj = null;
var glassBackMaterial = null;

if (checkValid()) {
    initialize();
}

function checkValid() {

    var jointParent = scene.createSceneObject("JointParent");
    jointParent.setParent(script.getSceneObject());
    script.relativeTo = jointParent;
    var joint1 = scene.createSceneObject("Joint1");
    joint1.setParent(jointParent);
    var joint2 = scene.createSceneObject("Joint2");
    joint2.setParent(joint1);
    joint2.getTransform().setLocalPosition(new vec3(0,script.restPos,0));
    script.joints.push(joint1);
    script.joints.push(joint2);
    
    
    // Scale force with object transform scale
    var localScale = script.getTransform().getWorldScale();
    scaleAvg = (localScale.x + localScale.y + localScale.z) / 3.0; 
    script.force = new vec3(0, 0.5, 0).uniformScale(scaleAvg);
    

    if (!global.MathLib) {
        print("LiquidController: ERROR! please add a JSMathLibrary.js script to the scene and put it before the LiquidController script");
        return false;
    }

    if (!global.MathLib.vec3 || !global.MathLib.quat) {
        print("LiquidController: ERROR! please select 'vec3' and 'quat' options under the settings tab of a JSMathLibrary.js script");
        return false;
    }

    if (!global.Point || !global.Constraint) {
        print("LiquidController: ERROR! please add a PositionBasedDynamicsHelpers.js script to the scene and put it before the LiquidController script");
        return false;
    }

    if (script.iterations <= 0) {
        print("LiquidController: Warning, iteration count should be > 0");
        return false;
    }

    if (script.UseObjectForHeight && !script.LiquidHeightObject) {
        print("LiquidController: ERROR! Liquid Height Object not set, please assign a SceneObject to control the height of the liquid.")
        return false;
    }

    if (!script.LiquidMaterial) {
        print("LiquidController: ERROR! Liquid Material not set, please assign this material to the LiquidController.")
        return false;
    }    

    if (!script.GlassMaterial) {
        print("LiquidController: ERROR! Glass Material not set, please assign this material to the LiquidController.")
        return false;
    }    

    if (script.UseGlassBackMaterial && !script.GlassBackMaterial) {
        print("LiquidController: ERROR! Glass Back Material not set, please assign this material to the LiquidController.")
        return false;
    }        

    if (!script.SurfaceDisplacementMaterial) {
        print("LiquidController: ERROR! Surface Displacement Material not set, please assign this material to the LiquidController.")
        return false;
    }      

    if (script.getSceneObject().getComponentCount("Component.RenderMeshVisual") < 1) {
        print("LiquidController: ERROR! No RenderMeshVisual component on this object.")
        return false;
    }  
    if (!script.getSceneObject().getFirstComponent("Component.RenderMeshVisual").mesh) {
        print("LiquidController: ERROR! No mesh assigned to the RenderMeshVisual component.")
        return false;
    }

    for (var i = 0; i < script.joints.length; i++) {
        if (!script.joints[i]) {
            print("LiquidController: Warning, some of the chain joints are not set, simulation will not run. Set a joint or delete empty field");
            return false;
        }
    }
    return true;
}

function initialize() {
    // Create Liquid and Glass Front scene objects
    renderMeshVisual = script.getSceneObject().getFirstComponent("Component.RenderMeshVisual");
    bboxMin = renderMeshVisual.mesh.aabbMin;
    bboxMax = renderMeshVisual.mesh.aabbMax;    
    var renderOrder = renderMeshVisual.getRenderOrder();
    
    glassBackMaterial = null;
    if (script.UseGlassBackMaterial) {
        glassBackMaterial = script.GlassBackMaterial;
    }
    else {
        glassBackMaterial = script.GlassMaterial.clone();
        glassBackMaterial.mainPass.cullMode = CullMode.Front;
        // glassBackMaterial.mainPass.depthWrite = false;
        script.GlassMaterial.mainPass.cullMode = CullMode.Back;
        
    }
    
    
    renderMeshVisual.mainMaterial = glassBackMaterial;
    if (!script.EnableGlassBack) renderMeshVisual.enabled = false;

    renderOrder++;
    if (script.EnableLiquid) liquidObj = createChildObject(script.LiquidMaterial, renderOrder, "Liquid");
    
    renderOrder++;
    if (script.EnableGlassFront) createChildObject(script.GlassMaterial, renderOrder, "GlassFront");
    
    for (var i = 0; i < script.joints.length; i++) {
        var transform = script.joints[i].getTransform();
        links.push({
            transform: transform,
            startRot: global.MathLib.quat.fromEngine(transform.getWorldRotation()),
            startDir: null
        })
        var pos = MathLib.vec3.fromEngine(transform.getWorldPosition());
        var p;
        if (i == 0) {
            p = new global.Point(script.mass0, pos);//static particle
            points.push(p);
            continue;
        } else {
            p = new global.Point(script.mass1, pos);
            points.push(p);
            var c = new global.Constraint(points[i - 1], points[i], script.stiffness, script.type == 0);
            constraints.push(c);
            links[i - 1].startDir = points[i].getPosition().sub(points[i - 1].getPosition());
        }
    }


    if (points.length > 0 && script.iterations > 0) {
        script.createEvent("UpdateEvent").bind(onUpdate);
        script.createEvent("LateUpdateEvent").bind(onLateUpdate);
    }
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Update
//////////////////////////////////////////////////////////////////////////////////////////////////////////////

var rotationPrev = script.relativeTo.getTransform().getWorldRotation();
var rotAmount = 0.0;

function onUpdate(eventData) {
    var rotationCurrent = script.relativeTo.getTransform().getWorldRotation();
    rotAmount = rotationPrev.dot(rotationCurrent);
    if (rotAmount >= 0.99999) rotAmount = 1.0;
    rotAmount = (1.0 - rotAmount) * -10.0;

    script.force = new vec3(0, script.gravity * 0.5, 0).uniformScale(scaleAvg);
    var rotationForce = script.force.add(rotationCurrent.toEulerAngles().uniformScale(rotAmount));
    acc = MathLib.vec3.fromEngine(rotationForce);
    
    updatePhysics(getDeltaTime(), script.iterations);//calculate point positions
    if (script.addRotation) {
        applyRotations();
    }
    applyPositions();
    
    rotationPrev = rotationCurrent;
}

function updatePhysics(dt, iteration) {

    if (updatePin) {
        points[0].setPosition(global.MathLib.vec3.fromEngine(links[0].transform.getWorldPosition()))
    }

    if (script.isRelative) {
        acc = MathLib.vec3.fromEngine(relativeToTransform.getWorldTransform().multiplyDirection(script.force))
    }

    for (var i = 1; i < points.length; i++) {
        points[i].update(dt * timeSpeed, acc);
    }
    for (var i = 0; i < iteration; i++) {
        for (var c in constraints) {
            constraints[c].solve(dt * timeSpeed);
        }
    }
}


function applyRotations() {

    for (var i = 1; i < points.length; i++) {
        var direction = points[i].getPosition().sub(points[i - 1].getPosition());
        var q = MathLib.quat.rotationFromTo(links[i - 1].startDir, direction);
        var newRot = q.multiply(links[i - 1].startRot);
        links[i - 1].transform.setWorldRotation(global.MathLib.quat.toEngine(newRot))
    }
}

function applyPositions() {
    for (var i = 0; i < points.length; i++) {
        var worldPos = global.MathLib.vec3.toEngine(points[i].getPosition());
        links[i].transform.setWorldPosition(worldPos);
    }
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Late Update
//////////////////////////////////////////////////////////////////////////////////////////////////////////////

function clamp(val, min, max) {
    return Math.max(Math.min(val, max), min);
}

var bubblesTimer = 0.0;
var bubblesRampUpSpeed = script.bubblesInOutSpeed.x;
var bubblesRampDownSpeed = script.bubblesInOutSpeed.y;

var foamTimer = 0.0;
var foamRampUpSpeed = script.foamInOutSpeed.x;
var foamRampDownSpeed = script.foamInOutSpeed.y;

function onLateUpdate(eventData) {

    var spring1Pos = script.joints[0].getTransform().getWorldPosition();
    var spring2Pos = script.joints[1].getTransform().getWorldPosition();

    var springVec = spring2Pos.sub(spring1Pos).normalize();
    
    springAngle = springVec.dot(upVec);
    springSpeed = 1.0 - springAngle;

    if (Math.sqrt(springSpeed) > bubblesActivationThreshold) bubblesTimer += getDeltaTime()  * bubblesRampUpSpeed * 1.0;
    else bubblesTimer -= getDeltaTime() * bubblesRampDownSpeed;
        
    if (Math.sqrt(springSpeed) > foamActivationThreshold) foamTimer += getDeltaTime() * foamRampUpSpeed * 1.0;
    else foamTimer -= getDeltaTime() * foamRampDownSpeed;        

    
    bubblesTimer = clamp(bubblesTimer, 0.0, 1.0);
    foamTimer = clamp(foamTimer, 0.0, 1.0);
    
    var liquidHeight = script.liquidHeightScript;
    if (script.UseObjectForHeight) liquidHeight += script.LiquidHeightObject.getTransform().getLocalPosition().y;
    
//    print(Math.sqrt(springSpeed))
//    bubblesTimer = 1.0;
//    foamTimer = 1.0;   

    script.LiquidMaterial.mainPass.liquidHeight = liquidHeight;
    script.LiquidMaterial.mainPass.springVec = springVec;
    script.LiquidMaterial.mainPass.bboxMin = bboxMin;
    script.LiquidMaterial.mainPass.bboxMax = bboxMax;
    script.LiquidMaterial.mainPass.bubblesTimer = bubblesTimer;
    script.LiquidMaterial.mainPass.foamTimer = foamTimer;
    script.LiquidMaterial.mainPass.localScale= script.getTransform().getWorldScale();
    
    script.SurfaceDisplacementMaterial.mainPass.springVec = springVec;
    script.SurfaceDisplacementMaterial.mainPass.foamTimer = foamTimer;

    // Copy main glass object's uniforms into cloned front face culled glass material
    // so both front and back glass uniforms update interactively without refreshing the lens
    if (!script.UseGlassBackMaterial) {
        glassBackMaterial.mainPass.intensity = script.GlassMaterial.mainPass.intensity;
        glassBackMaterial.mainPass.thickness = script.GlassMaterial.mainPass.thickness;
        glassBackMaterial.mainPass.chromaticAberration = script.GlassMaterial.mainPass.chromaticAberration;
        glassBackMaterial.mainPass.exponent = script.GlassMaterial.mainPass.exponent;
        glassBackMaterial.mainPass.darken = script.GlassMaterial.mainPass.darken;
        glassBackMaterial.mainPass.indexOfRefraction = script.GlassMaterial.mainPass.indexOfRefraction;
        glassBackMaterial.mainPass.baseColor = script.GlassMaterial.mainPass.baseColor;
        glassBackMaterial.mainPass.roughness = script.GlassMaterial.mainPass.roughness;
    }

}


function createChildObject(material, renderOrder, name) {
    var meshSceneObj = scene.createSceneObject(name);
    meshSceneObj.setParent(script.getSceneObject());
    var meshVisual = meshSceneObj.createComponent("Component.RenderMeshVisual");
    meshVisual.mesh = renderMeshVisual.mesh;
    meshVisual.mainMaterial = material;
    meshVisual.setRenderOrder(renderOrder);
    
    return meshSceneObj;
}
