// HandAvatar.js
// Version: 1.0.1
// Event: On Awake
// Description: Sends and receives hand joint data.


//@input Component.ObjectTracking3D handTracking
/** @type {ObjectTracking3D} */
var handTracking = script.handTracking;

//@input float interpolationTarget = -0.25
/** @type {number} */
var interpolationTarget = script.interpolationTarget; //Interpolasyon, belirli bir süre boyunca iki değer arasında geçiş yapmayı ifade eder.
//daha doğal ve akıcı takip sağlar

//@input SceneObject visual
/** @type {SceneObject} */
var visual = script.visual;


//el eklemlerindeki partiallar için bir dizi oluşturduk
const JOINT_NAMES = ["wrist","thumb-0","thumb-1","thumb-2","thumb-3","index-0","index-1","index-2","index-3","mid-0","mid-1","mid-2","mid-3","ring-0","ring-1","ring-2","ring-3","pinky-0","pinky-1","pinky-2","pinky-3","wrist_to_thumb","wrist_to_index","wrist_to_mid","wrist_to_ring","wrist_to_pinky"];

var sendLimit = 10; //belirli bir zaman aralığında gönderilen veri miktarını kontrol eder.

var syncEntity = new global.SyncEntity(script); //global.SyncEntity sınıfından bir örnektir.
// Bu, Lens Studio'nun senkronizasyon özelliklerini kullanma amacına hizmet eder.
// Bu örnek, script içinde veri senkronizasyonunu ve paylaşımını yönetmek için kullanılır.

var handTrackingTransform = handTracking.getTransform(); // el takibi bileşeninin 3D transformunu temsil eder. Bu, elin gerçek dünyadaki konumunu ve yönelimini ifade eder.
var localTransform = script.getTransform(); //scriptin bağlı olduğu nesnenin 3D transformunu temsil eder. Bu, scriptin etkilediği nesnenin konumunu ve yönelimini ifade eder.

/**
 * @class
 * @param {string} jointName eklem adı
 * @param {Transform} source kaynak transform
 * @param {Transform} destination hedef transform
 */
function JointInfo(jointName, source, destination) {  //JointInfo classı oluştu 
    /** @type {string} */   
    this.jointName = jointName;
    /** @type {Transform} */
    this.source = source;
    /** @type {Transform} */
    this.destination = destination;
}

/** @type {JointInfo[]} */ //jointInfo classından nesneler için bir dizi
var jointInfos = [];

/** @type {quat[]} */
var rotDataArray;  //rotDataArray adında bir dizi oluşturulur. Bu dizi, eklemlerin rotasyon verilerini saklamak için kullanılacaktır.

/** @type {float[]} */
var scaleDataArray;  //scaleDataArray adında bir dizi oluşturulur. Bu dizi, eklemlerin ölçek verilerini saklamak için kullanılacaktır.

function initJoints() {
    for (var i=0; i<JOINT_NAMES.length; i++) { //her bir eklemin bilgilerini almak için döngü 
        var trackedObjects = handTracking.getAttachedObjects(JOINT_NAMES[i]); //handTracking nesnesi üzerinden getAttachedObjects fonksiyonu çağrılır. Bu fonksiyon, belirli bir ekleme bağlı olan nesneleri getirir.
        for (var j=0; j<trackedObjects.length; j++) { //her bir eklemin nesnelerini işlemek için kullanılır.
            var sourceTr = trackedObjects[j].getTransform(); //her bir nesnenin transform bilgisi alınır.
            var destObj = findChildObjectWithName(script.getSceneObject(), trackedObjects[j].name); //çocuk nesne aranır.
            var destTr = destObj ? destObj.getTransform() : null; // varsa bu objenin transform bilgisi destTr değişkenine alınır.
            var jointInfo = new JointInfo(JOINT_NAMES[i], sourceTr, destTr); //jointInfo nesnes oluşur gelen datalar için.
            jointInfos.push(jointInfo); //oluşan joşnt infolar diziye eklenir.
        }
    }
    rotDataArray = new Array(jointInfos.length);
    scaleDataArray = new Array(jointInfos.length); //rotDataArray ve scaleDataArray dizileri, 
    //eklemlerin rotasyon ve ölçek verilerini saklamak için kullanılacak boş diziler olarak başlatılır.
    updateRotsFromSource(); //eklemlerin rotasyon bilgilerini güncellemek için çağırılır.
}

function updateRotsFromSource() {
    for (var i=0; i<jointInfos.length; i++) {
        rotDataArray[i] = jointInfos[i].source.getLocalRotation();  //jointInfo nesnesinde source değişkeninden rotasyon ve 
        scaleDataArray[i] = jointInfos[i].source.getLocalScale().x;  //x ekseni boyut bilgileri alınır.
    }
}

/**
 * 
 * @param {quat[]} rots //rotasyonlar dizisi oluşturulur
 */
function setRotsOnDest(rots) {
    for (var i=0; i<jointInfos.length; i++) {
        jointInfos[i].destination.setLocalRotation(rots[i]); 
    }
}

function setScalesOnDest(scales) {  //hedef rotasyona scale değerlerini ekler
    var scaleVal;
    for (var i=0; i<jointInfos.length; i++) {
        scaleVal = scales[i];
        jointInfos[i].destination.setLocalScale(new vec3(scaleVal, scaleVal, scaleVal));
    }
}

initJoints();  

// Initialize property to track all joints
var rotationsProp = syncEntity.addStorageProperty( //manual metodu bu özelliğin manuel olarak kontrol edileceğini belirtir.
    global.StorageProperty.manual("jointRotations", global.StorageTypes.quatArray, rotDataArray, {
        "interpolationTarget": interpolationTarget,
    }));
    //rotationsProp diye bir depolama özelliği oluşturulur ve adı jointRotations.
    //depo türü arrayler ve quatArray Quaternion(3D rotasyon) tipinde veriler saklar.
    //rotDataArray başlangıç değelerini içeren dizi.
    //interpolationTarget ek ayar olarak eklenmiş ve yukarıda tanımlanan değer atanmıştır. 
rotationsProp.setterFunc = setRotsOnDest;
//değer atanacağı zaman çağırılacak fonksiyon belirlenir. hedef transformlara değer atar.
rotationsProp.sendsPerSecondLimit = sendLimit;
//bu satır her saniyede kaç kere veri gönderebileceğini belirler.   
// HACK
/*
Açıklama: Bu satır, iki değerin eşit olup olmadığını kontrol eden bir fonksiyon atanır.
 Ancak, bu durumda her zaman true döndürülerek, eşitlik kontrolü devre dışı bırakılır.
Neden Kullanılıyor: Bu, her zaman true döndüğü için eşitlik kontrolünü devre dışı bırakır ve her güncellemede 
senkronizasyonun gerçekleşmesini sağlar. Bu, bir tür "hile" veya "geçici çözüm" olarak kullanılabilir.
*/
rotationsProp.equalsCheck = function() {
    return true;
};

var scalesProp = syncEntity.addStorageProperty(
    global.StorageProperty.manual("jointScales", global.StorageTypes.floatArray, scaleDataArray, {
        "interpolationTarget": interpolationTarget,
    }));
scalesProp.setterFunc = setScalesOnDest;
scalesProp.sendsPerSecondLimit = sendLimit;
// Force the equals check to always return true, since we don't need to waste time comparing arrays
scalesProp.equalsCheck = function() {
    return true;
};

var rootPosProp = syncEntity.addStorageProperty(global.StorageProperty.forPosition(localTransform, true, {"interpolationTarget": interpolationTarget}));
rootPosProp.sendsPerSecondLimit = sendLimit;
/*
Bu ifade, bir pozisyon depolama özelliği oluşturur. localTransform (scriptin bağlı olduğu nesnenin 3D transformunu temsil eden bir değişken) üzerinden pozisyon bilgisi alınır.
 true ifadesi, bu özelliğin mutlak pozisyonları takip etmesini sağlar.
 "interpolationTarget": interpolationTarget ifadesi ise, pozisyon verileri arasındaki geçişleri kontrol eden bir hedef değeri belirler.
*/

var rootRotProp = syncEntity.addStorageProperty(global.StorageProperty.forRotation(localTransform, true, {"interpolationTarget": interpolationTarget}));
rootRotProp.sendsPerSecondLimit = sendLimit; //rotasyon depolama özelliği 

//manuel olarak kontrol edilecek bir boolean depolama özelliği oluşturur. adı isTracking initial value false 
var enabledProp = syncEntity.addStorageProperty(global.StorageProperty.manualBool("isTracking", false));
var enabledTimeoutEvent = script.createEvent("DelayedCallbackEvent");
enabledTimeoutEvent.bind(enabledTimeout); //event tetiklendiğinde çalışacak fonksiyon belirlenir.

function onUpdate() {
    if (syncEntity.doIOwnStore()) {
        localTransform.setWorldPosition(handTrackingTransform.getWorldPosition());//localTransform el takibinin dünya konumunu takip eder.
        localTransform.setWorldRotation(handTrackingTransform.getWorldRotation());//localTransform  el takibinin dünya dönüşünü takip eder.
        
        if (handTracking.isTracking()) {
            enabledProp.setPendingValue(true); // el takibi devam ediyorsa enabledProp true olur.
            var time = getTime(); // veri gönderme sıklığını kontrol etmek için anlık zaman alınır.
            /*
            Bu kontrol, belirli bir zaman aralığında rotasyon verilerini göndermek için bir sınıra ulaşılıp ulaşılmadığını kontrol eder.
            Eğer sınıra ulaşılmışsa, aşağıdaki işlemleri gerçekleştirir.
            */
            if (rotationsProp.checkWithinSendLimit(time)) {  
                updateRotsFromSource(); //eklemlerin rotasyon bilgilerini güncelleyen fonk. çağırılır.
                rotationsProp.setPendingValue(rotDataArray); //rotasyon taşıyan özelliğin bekleyen değerini rotDataArray dizisi olarak ayarlar.
                rotationsProp.markedDirty = true; 
                // bu özelliğin verilerinin değiştiğini belirtmek için markedDirty özelliği true yapılır.
                //bu senkronizasyon mağazasına veri gönderileceği anlamına gelir.
            }
        } else {
            enabledProp.setPendingValue(false);
        }
    }
}

visual.enabled = false;
syncEntity.notifyOnReady(function() {
    if (!syncEntity.doIOwnStore()) {
        visual.enabled = enabledProp.currentValue || false;
    }
    script.createEvent("UpdateEvent").bind(onUpdate); //onUpdate fonksiyonu güncelleme döngüsüne bağlanır.
});


function enabledTimeout() {
    visual.enabled = false;
}

function onEnabledUpdatedRemote(newValue) {
    enabledTimeoutEvent.enabled = !newValue;
    if (newValue) {
        visual.enabled = true;
    } else {
        enabledTimeoutEvent.reset(.5);
    }
}
enabledProp.onRemoteChange.add(onEnabledUpdatedRemote);


/**
 * Searches through the children of `sceneObject` and returns the first child found with a matching name.
 * NOTE: This function recursively checks the entire child hierarchy and should not be used every frame.
 * It's recommended to only run this function once and store the result.
 * @param {SceneObject} sceneObject Parent object to search the children of
 * @param {string} childName Object name to search for
 * @returns {SceneObject?} Found object (if any)
 */
function findChildObjectWithName(sceneObject, childName) {
    var childCount = sceneObject.getChildrenCount();
    var child;
    var res;
    for (var i=0; i<childCount; i++) {
        child = sceneObject.getChild(i);
        if (child.name == childName) {
            return child;
        }
        res = findChildObjectWithName(child, childName);
        if (res) {
            return res;
        }
    }
    return null;
}