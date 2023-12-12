// -----JS CODE-----
// @input bool useFaceMask
// @input Component.FaceMaskVisual[] faceMask {"showIf":"useFaceMask"}
// @input bool useLiquify
// @input Component.LiquifyVisual[] liquify {"showIf":"useLiquify"}
// @input float radius {"showIf":"useLiquify"}
// @input float intensity {"showIf":"useLiquify"}
// @input bool useFaceInset
// @input Component.FaceInsetVisual[] faceInset {"showIf":"useFaceInset"}
// @input bool usePostEffect
// @input Component.PostEffectVisual[] postEffect {"showIf":"usePostEffect"}
// @input bool useImage
// @input Component.Image[] image {"showIf":"useImage"}
// @input bool useFaceStretch
// @input Component.FaceStretchVisual[] faceStretch {"showIf":"useFaceStretch"}
// @ui {"widget":"group_start", "label":"Advanced"}
// @input SceneObject upper
// @input SceneObject lower
// @input float minimum
// @input float maximum
// @ui {"widget":"group_end"}

var time = 0;

var event = script.createEvent("UpdateEvent");
event.bind(function (eventData)
{
    // Normalize Frame Rate
    time += getDeltaTime();
    
    if (time > 0.03)
    {
        
    // Gets the Positions of the lip bindings
    var upper = script.upper.getTransform().getWorldPosition();
    var lower = script.lower.getTransform().getWorldPosition();
    
    // Calculate and modify distance value
    var distance = upper.y - lower.y;
    var dist = Math.round(distance* 100) / 100;
    var num = (dist/2) - 1;    
    
    // Set minimum and maximum values
    if (num < script.minimum)
    {
        num = script.minimum;
    }
    if (num > script.maximum)
    {
        num = script.maximum;
    }
    
    // Set Face Mask Alpha
    if (script.useFaceMask)
    {
        for (var i = 0; i < script.faceMask.length; i++)
        {
         script.faceMask[i].mainPass.baseColor = new vec4(num,num,num,num);   
        }
    }
    
    // set Liquify values
    if (script.useLiquify)
    {
        
        for (var i = 0; i < script.liquify.length; i++)
        {
               
            script.liquify[i].radius = num + script.radius;
            script.liquify[i].intensity = num + script.intensity;
        }
    }
    
    // Set Face inset Size
    if (script.useFaceInset)
    {  

        for (var i = 0; i < script.faceMask.length; i++)
        {
         script.faceInset[i].getTransform().setLocalScale(new vec3(num,num,num));
        }
    }
        else if (!script.useFaceInset)
        {
            for (var i = 0; i < script.faceMask.length; i++)
            {
                 script.faceInset[i].enabled = false;
            } 
        }
    
    // Set post effect Alpha
    if (script.usePostEffect)
    {
        for (var i = 0; i < script.faceMask.length; i++)
        {
         script.postEffect[i].mainPass.baseColor = new vec4(num,num,num,num);   
        }
    }
    
    // Set Image Alpha
    if (script.useImage)
    {
        for (var i = 0; i < script.image.length; i++)
        {
         script.image[i].mainPass.baseColor = new vec4(num,num,num,num);   
        }
    }
    
    // Set Face Stretch Intensity
    if (script.useFaceStretch)
    {
        for (var i = 0; i < script.faceMask.length; i++)
        {
         script.faceStretch[i].setFeatureWeight("Feature0", num);
        }
    } 
        
     time = 0;   
    }
});