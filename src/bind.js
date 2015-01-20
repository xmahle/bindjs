window.$b = window.$b||{};
window.$b.DEBUG = window.$b.DEBUG||false;
if(!window.$b.DEBUG || typeof window.console == "undefined" || typeof window.console.log == "undefined") {
    // Remove all debug messages if debug is not active!! or console is not supported!
    //window.console = {};
    //window.console.log = function(text){};
}

window.$b.baseUrl = window.location.protocol+"//"+window.location.host + window.location.pathname;

// OM
(function() {

    var OM = function() {
        throw "ObjectManager cannot be instantiated";
    };

    OM._count = 0;
    OM._objects = [];

    /**
     *	Adds new object to stack and returns object ID
     **/
    OM.add = function(object, name) {

        if(OM._objects[name])
        {
            name += "1";
            console.log("Object names must be unique, name changed to "+ name);
        }

        var id = OM._count;

        object._id = id;
        object._name = name;

        OM._objects[name] = object;

        OM._count++;

        return true;
    };

    /**
     * Removes object from stack, returns true if object found&removed
     * @param name
     */
    OM.remove = function(name) {
        var newObjectStack = [],
            result = false;
        for(var i in OM._objects) {
            if(i != name) {
                newObjectStack[i] = OM._objects[i];
            } else {
                result = true;
            }
        }

        OM._objects = newObjectStack;

        console.log("Object removed: "+ name);

        return result;
    };

    /**
     * Finds object from the stack
     * @param string objectname
     * @returns {object} | false
     */
    OM.find = function(name) {

        return OM._objects[name] || false;
    };

    OM.findByElement = function(element) {
        var objectName = $(element).attr('data-name');

        if(typeof objectName != "Undefined") {

            return OM.find(objectName);
        }
        return null;
    };

    $b.OM = OM;
}());

// OP
(function() {

    var OP = function() {
        throw "ObjectParser cannot be instantiated";
    };

    /**
     *	Parses the whole html document and creates objects
     **/
    OP.init = function() {

        OP.partial(window.document);

        $(window).trigger("engineCreated");
    };

    /**
     * Parses part of html
     * @param target jQuery selector
     * @returns number Count of how many objects were created
     */
    OP.partial = function(target) {

        var objectsCreated = 0;
        // Create objects
        $(target).find("[data-object]").each(function(index, element){ objectsCreated += (OP.createElement(element) ? 1 : 0);});

        // Attach events
        $(target).find("[data-event-type]").each(function(index, element){ OP.createEvent(element);});

        return objectsCreated;
    };

    OP.createEvent = function(element)
    {
        var ea = $(element).data();

        var eventOwner = ea.eventOwner || ea.name;
        var eventTarget = ea.eventTarget || ea.name;
        var eventOwnerObject = $b.OM.find(eventOwner);
        var eventTargetObject = $b.OM.find(eventTarget);

        if(eventOwnerObject)
        {
            // Create event when both are e objects
            eventOwnerObject.gJQ().on(ea.eventType, ea, function(event){
                var eventTargetObject = $b.OM.find(eventTarget);

                if(typeof ea.eventDelay !== "undefined") {
                    window.setTimeout(function() {  eventTargetObject.launchEvent(event);}, ea.eventDelay);

                } else {
                    eventTargetObject.launchEvent(event);
                }
                return false;
            });

            console.log("Event created: "+ eventOwner +"."+ ea.eventType +" > "+ eventTarget +"."+ ea.eventAction +"("+ (ea.eventAttributes ? ea.eventAttributes.join() : "") +")");

        } else if(eventTargetObject) {
            // Check if owner is jquery object
            eventOwnerObject = $(eventOwner);
            // create event when only target is e object
            if(eventOwnerObject.length > 0 ) {
                eventOwnerObject.on(ea.eventType, ea, function(event) {

                    if(typeof ea.eventDelay !== "undefined") {
                        window.setTimeout(function() {  eventTargetObject.launchEvent(event);}, ea.eventDelay);

                    } else {
                        eventTargetObject.launchEvent(event);
                    }
                    return false;
                });
            } else {
                $(element).on(ea.eventType, ea, function(event) {

                    if(typeof ea.eventDelay !== "undefined") {
                        window.setTimeout(function() {  eventTargetObject.launchEvent(event);}, ea.eventDelay);

                    } else {
                        eventTargetObject.launchEvent(event);
                    }
                    return false;
                });
            }
            console.log("Event created: "+ eventOwner +"."+ ea.eventType +" > "+ eventTarget +"."+ ea.eventAction +"("+ (ea.eventAttributes ? ea.eventAttributes.join() : "") +")");
        } else {
            console.log("Event owner/target not found: "+ eventOwner +" - "+ eventTarget);
        }
    };

    /**
     * Most important function of them all
     * Creates JavaScript objects, binds them to html and stacks them to OM
     * @param element jQuery object
     */
    OP.createElement = function(element) {

        var elementObjectName = $(element).data("object");
        var elementName = $(element).data("name") || "Unknown";
        var elementAttributes = $(element).data("attributes");

        if(!$b[elementObjectName])
        {
            console.log("Object not found: "+ elementObjectName);
            return false;
        }

        // If element already exists, resurrect it...
        if(element = $b.OM.find(elementName)) {

            if(typeof element['resurrectObject'] == "function") {

                if(element.resurrectObject()) {
                    console.log("Element " + elementName + " resurrected!");
                }
                return false;
            }
        }

        var newObject = new $b[elementObjectName];

        if(newObject)
        {
            // add object to stack
            if($b.OM.add(newObject, elementName))
            {
                // Make sure data-name is same as newObject name
                $(element).data('name', newObject._name);

                // add attributes to newObject
                for (var key in elementAttributes)
                {
                    if(key in newObject)
                    {
                        newObject[key] = elementAttributes[key];
                    } else {
                        console.log("Attribute "+ key +" not found from "+ elementObjectName);
                    }
                }

                console.log("Object created: "+ newObject);

                // init newObject / let the object itself know that it has born!
                $(newObject).trigger("objectCreated");

                return true;
            }

        } else {
            console.log("Object '"+ elementObjectName +"' not found!");
        }
    };

    $b.OP = OP;
}());

//If Function.bind not supported (Like iPad!)
if (!Function.prototype.bind) {
    Function.prototype.bind = function (oThis) {
        if (typeof this !== "function") {
            // closest thing possible to the ECMAScript 5 internal IsCallable function
            throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");
        }

        var aArgs = Array.prototype.slice.call(arguments, 1),
            fToBind = this,
            fNOP = function () {},
            fBound = function () {
                return fToBind.apply(this instanceof fNOP && oThis
                    ? this
                    : oThis,
                    aArgs.concat(Array.prototype.slice.call(arguments)));
            };

        fNOP.prototype = this.prototype;
        fBound.prototype = new fNOP();

        return fBound;
    };
}
