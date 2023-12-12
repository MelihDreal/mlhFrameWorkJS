// -----JS CODE-----
// Ben Knutson 6/25/19
// www.kargraphics.com
// @input SceneObject tween
// @input SceneObject topLeft
// @input SceneObject topRight
// @input SceneObject bottomLeft
// @input SceneObject bottomRight

print("Thanks for trying out the Four Cameras Template! To edit each of the four effects, to into each camera in the Objects panel and delete the folder titled 'Effects[REPLACE ME]'."); 
print("Once you add your own effects, they will go under a perspective camera at the bottom. Make sure to drag that effect up into the correct camera, and change the layer to the corresponding color! When all your effects are added, make sure to delete the perspective camera at the bottom.");
print("If you have any questions feel free to send me an email by going to www.kargraphics.com");

var status = "Small";
var tweening = false;

function onTapped(eventData)
{
    if (status == "Small" && !tweening)
    {
        if (eventData.getTapPosition().x <= 0.5 && eventData.getTapPosition().y <= 0.5)
        {
            topLeft();
        }    
        else if (eventData.getTapPosition().x > 0.5 && eventData.getTapPosition().y <= 0.5)
        {
            topRight();
        }
        else if (eventData.getTapPosition().x <= 0.5 && eventData.getTapPosition().y > 0.5)
        {
            bottomLeft();
        }
        else if (eventData.getTapPosition().x > 0.5 && eventData.getTapPosition().y > 0.5)
        {
            bottomRight();
        }
    }
    else if (status == "topLeft" && !tweening)
    {
        tweening = true;
        global.tweenManager.startTween(script.tween, "topLeftSmall", topLeftSmall );
        status = "Small";  
    }
    else if (status == "topRight")
    {
        tweening = true;
        global.tweenManager.startTween(script.tween, "topRightSmall", topRightSmall );
        status = "Small";
    }
    else if (status == "bottomLeft")
    {
        tweening = true;
        global.tweenManager.startTween(script.tween, "bottomLeftSmall", bottomLeftSmall );
        status = "Small";
    }
    else if (status == "bottomRight")
    {
        tweening = true;
        global.tweenManager.startTween(script.tween, "bottomRightSmall", bottomRightSmall );
        status = "Small";
    }
}

var event = script.createEvent("TapEvent");
event.bind(onTapped);

function topLeft()
{
    if (!tweening)
    {
        if (status == "Small")
        {
            tweening = true;
            script.topRight.enabled = false;
            script.bottomLeft.enabled = false;
            script.bottomRight.enabled = false;
            global.tweenManager.startTween(script.tween, "topLeftBig", setFalse );
            status = "topLeft";
        }
    }
}

function topRight()
{
    if (!tweening)
    {
        if (status == "Small")
        {
            tweening = true;
            script.topLeft.enabled = false;
            script.bottomLeft.enabled = false;
            script.bottomRight.enabled = false;
            global.tweenManager.startTween(script.tween, "topRightBig", setFalse );
            status = "topRight";
        }
    }
}

function bottomLeft()
{
    if (!tweening)
    {
        if (status == "Small")
        {
            tweening = true;
            script.topLeft.enabled = false;
            script.topRight.enabled = false;
            script.bottomRight.enabled = false;
            global.tweenManager.startTween(script.tween, "bottomLeftBig", setFalse );
            status = "bottomLeft";
        }
    }
}

function bottomRight()
{
    if (!tweening)
    {
        if (status == "Small")
        {
            tweening = true;
            script.topLeft.enabled = false;
            script.topRight.enabled = false;
            script.bottomLeft.enabled = false;
            global.tweenManager.startTween(script.tween, "bottomRightBig", setFalse );
            status = "bottomRight";
        }
    }
}

function setFalse()
{
    var delayedEvent = script.createEvent("DelayedCallbackEvent");
delayedEvent.bind(function(eventData)
{
    tweening = false;
});
delayedEvent.reset(.4);
}

function topLeftSmall()
{
    script.topRight.enabled = true;
    script.bottomLeft.enabled = true;
    script.bottomRight.enabled = true;
    
    var delayedEvent = script.createEvent("DelayedCallbackEvent");
delayedEvent.bind(function(eventData)
{
    tweening = false;
});
delayedEvent.reset(.4);

}

function topRightSmall()
{
    script.topLeft.enabled = true;
    script.bottomLeft.enabled = true;
    script.bottomRight.enabled = true;
    var delayedEvent = script.createEvent("DelayedCallbackEvent");
delayedEvent.bind(function(eventData)
{
    tweening = false;
});
delayedEvent.reset(.4);
}

function bottomLeftSmall()
{
    script.topLeft.enabled = true;
    script.topRight.enabled = true;
    script.bottomRight.enabled = true;
    var delayedEvent = script.createEvent("DelayedCallbackEvent");
delayedEvent.bind(function(eventData)
{
    tweening = false;
});
delayedEvent.reset(.4);
}

function bottomRightSmall()
{
    script.topLeft.enabled = true;
    script.topRight.enabled = true;
    script.bottomLeft.enabled = true;
    var delayedEvent = script.createEvent("DelayedCallbackEvent");
delayedEvent.bind(function(eventData)
{
    tweening = false;
});
delayedEvent.reset(.4);
}


