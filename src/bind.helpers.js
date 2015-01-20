// jQuery plugins
$.urlParam = function(name) {
    name = name.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
    var regexS = "[\\?&]"+name+"=([^&#]*)";
    var regex = new RegExp( regexS );
    var results = regex.exec( window.location.href );
    if( results == null )
        return "";
    else
        return decodeURIComponent(results[1].replace(/\+/g, " "));
};


// attach the .compare method to Array's prototype to call it on any array
$b.arrayCompare = function (source, array) {
    // if the other array is a falsy value, return
    if (!source || !array)
        return false;

    // compare lengths - can save a lot of time
    if (source.length != array.length)
        return false;

    for (var i = 0, l=source.length; i < l; i++) {
        // Check if we have nested arrays
        if (source[i] instanceof Array && array[i] instanceof Array) {
            // recurse into the nested arrays
            if (!e.arrayCompare(source[i],array[i]))
                return false;
        }
        else if (source[i] != array[i]) {
            // Warning - two different object instances will never be equal: {x:20} != {x:20}
            return false;
        }
    }
    return true;
};