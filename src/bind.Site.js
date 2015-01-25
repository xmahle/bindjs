(function() {

    var Site = function() {
        this.initialize();
    };

    var p = Site.prototype = new $b.Element();

    p.Element_initialize = p.initialize;

    p.contentPath = "content/";
    p.settingsFilename = "";
    p.settingsFile = "";
    p.settings = {};
    p.language = "en";
    p.vars = {};
    p.currentPage = "";
    p.layout = "";
    p.pagesObject = null;
    p.queryArray = [];
    p.customParameters = [];
    p.rootUrl = '/'; // Site root path
    p.scriptStack = []; // Contains status of all loaded javascript files
    p.storage = null;

    p.initialize = function() {
        this.Element_initialize();

        $(this).on("objectCreated", this.elementCreated);
    };

    p.elementCreated = function() {
        var _self = window.site = this;

        // Setup storage
        if(localStorage) {
            _self.storage = {
                get: function(key) {
                    return (localStorage[key] ? JSON.parse(localStorage[key]) : false);
                },
                set: function(key, value) {
                    return localStorage[key] = JSON.stringify(value);
                }
            }
        } else {
            _self.storage = {get:function(){return false;},set:function(){return false;}};
        }

        // Parse query string
        window.site.queryArray = window.location.search.substring(1).split('&');

        _self.settingsFile = _self.contentPath + _self.settingsFilename;

          // Load settings
        if(window.site.settingsFilename) {
            if($b.DEBUG) {
                window.site.gJQ("#status").html("Loading settings...");
            }
            var url = window.site.settingsFile +($b.DEBUG ? '?'+ new Date().getTime() : '');
            $.getJSON(url, function(data){
                window.site.settings = data;
                window.site.contentPath = data.paths.content||window.site.contentPath;
                window.site.settingsLoaded();
            });
        } else {
            window.site.settingsLoaded();
        }
    };

    p.settingsLoaded = function() {
        var _self = this;

        // Set language
        if (typeof(window.site.settings.languages) != "undefined" && !window.site.settings.languages.filter(function (elem) {
                var yes = (window.site.queryArray.indexOf(elem) > -1);
                _self.language = (yes ? elem : _self.language);
                return yes;
            }).length == window.site.queryArray.length) {
            _self.language = window.site.settings.defaultLanguage;
        }

        // Handle preloading!
        if (typeof(window.site.settings.preload) != "undefined") {
            if($b.DEBUG) {
                window.site.gJQ("#status").html("Starting preload...");
            }
            _self.startPreloader();
            return;
        }
        //_self.loadVars();
    };

    p.startPreloader = function() {
        var _self = this;
        var itemCount = 0, counter = 0;
        for(var i in window.site.settings.preload) {
            for(var r in window.site.settings.preload[i]) {
                var file = String(window.site.settings.preload[i][r]).indexOf('//') == 0
                    ?   window.site.settings.preload[i][r]
                    :   window.site.settings.paths[i] + (i === "variables" ? _self.language+'/' : '') + window.site.settings.preload[i][r];
                itemCount++;
                head.load(file, function(){
                    counter++;
                    window.site.gJQ(".bar").css('width', (counter/itemCount)*100 +"%");
                    window.site.gJQ("#status").html("Loaded "+ counter +" / "+itemCount);

                    if(counter === itemCount) {
                        _self.renderLayout();
                    }
                });
            }
        }
    };
    /*
    p.loadVars = function() {
        var _self = this;

        // Load texts
        if(window.site.settings.vars) {
            if($b.DEBUG) {
                _self.gJQ("#status").html("Loading vars...");
            }
            var url = _self.contentPath + _self.language +"/"+ window.site.settings.vars +($b.DEBUG ? '?'+ new Date().getTime() : '');
            $.getJSON(url, function(data){ window.site.vars = data; _self.varsLoaded();});
        } else {
            window.site.vars = false;
            // No variables in this project
            _self.varsLoaded();
        }

        // Check current page from hash
        _self.parseHash();
    };

    p.varsLoaded = function() {
        var _self = this;

        // Load layout
        if(window.site.settings.layout) {
            if($b.DEBUG) {
                _self.gJQ("#status").html("Loading layout...");
            }
            var url = _self.contentPath + window.site.settings.layout +($b.DEBUG ? '?'+ new Date().getTime() : '');
            $.get(url, function(data){ _self.layout = data; _self.layoutLoaded();});
        } else {
            // If layout file not set
            _self.layout = false;
        }
    };

    p.layoutLoaded = function() {
        var _self = this;

        if (_self.layout) {
            if (typeof(tmpl) == "undefined") {
                console.log("tmpl.min.js must be included if layout/variables used!");
            } else {
                // render layout
                _self.gJQ().html(tmpl(_self.layout, window.site.vars.layout));
            }
        }

        _self.launchSite();
    };*/

    p.renderLayout = function() {
        var _self = this;

        if(window.site.settings.vars) {
            window.site.vars = JSON.parse($("#"+window.site.settings.vars).html());
        }

        if (window.site.settings.layout) {
            if(typeof(Mustache) != "undefined") {
                _self.gJQ().html(Mustache.render(window.site.settings.layout, window.site.vars.layout));
            } else
            if (typeof(tmpl) != "undefined") {
                _self.gJQ().html(tmpl(window.site.settings.layout, window.site.vars.layout));
            } else {
                // render layout
                console.log("tmpl.min.js or mustache.js must be included if layout/variables used!");
            }
        }

        // Update site title
        if(window.site.vars.title) {
            window.document.title = window.site.vars.title;
        }
        _self.launchSite();
    };
    p.launchSite = function() {
        var _self = this;

        // add language ass body class, for css changes...
        $("html").addClass("lang-"+ _self.language);

        // Check for mobile and add mobile class
        /*if($.browser && $.browser.mobile) {
            $('body').addClass("mobile");
        }*/

        // Add hash change event
        $(window).on('hashchange', function(){ window.site.hashChangeEvent();return false;});


        // Create layout objects
        $b.OP.partial("body");

        // Setup language selector
        _self.gJQ().on('click', '.changeLanguage', function(){_self.changeLanguage($(this).data("id"));return false;});
        _self.gJQ('.changeLanguage[data-id="'+ site.language +'"]').addClass("disabled");
    };

    p.hideLoadingScreen = function() {
        var _self = this;
        if ($("#loadingScreen").length > 0) {
            $("#loadingScreen").remove();
        }
        if ($(".preload").length > 0) {
            $(".preload").remove();
        }

    };

    p.changeLanguage = function(lang) {
        var _self = this;
        site.language = lang;

        // ToDo: _self.customParameters doesn't work!?
        window.location = "?"+ site.language +"#"+ site.currentPage +(_self.customParameters.length > 0 ? "-"+ _self.customParameters.join("-") : "");
    };

    p.getHash = function(pageId) {

        return pageId;
    };

    /**
     * parseHash
     */
    p.parseHash = function() {
        var _self = this;
        var hashArray = location.hash.replace('#', '').split("-");

        var page = hashArray.shift();
        _self.customParameters = hashArray;


        if(page != _self.currentPage) {
            _self.currentPage = page;

            return true;
        }
        return false;
    };


    /**
     * Used to request send/receive any data from the server
     * @param action Name of the action
     * @param options Object of options sent to server
     * @param callback Callback called if request was successful
     */
    p.request = function(action, options, callback) {
        var _self = this;
        var url = window.site.settings.dataUrl.replace("%action%", action);
        if(typeof options == "undefined") {
            options = {};
        };

        options = jQuery.extend(true, {'id': _self.user.id}, options);
        $.post(url, options, function(data){ _self.requestResponseEvent(data, callback);})
            .fail(function() {_self.requestResponseEvent({'result': 0, 'message': "Request failed"}, callback);});
    };

    p.requestResponseEvent = function(data, callback) {
        var _self = this;
        if(data.result) {
            callback(data.response);
        } else {
            _self.errorEvent(data.message);
        }
    };

    p.errorEvent = function(message) {
        alert(message);
    };

    /***
     * Load css file dynamically (with IE support)
     * @param filename String filename with path
     */
    p.requireStyle = function(filename) {
        var _self = this;
        var fullUrl = (filename.indexOf('//') == 0 ? filename : _self.rootUrl +'/'+ filename);

        if (document.createStyleSheet)
        {
            document.createStyleSheet(fullUrl);
        } else {
            $('<link>')
                .appendTo('head')
                .attr({type: 'text/css', rel: 'stylesheet'})
                .attr('href', fullUrl);
        }
    };
    /**
     * Used to load required javascript file dynamically
     * @param filename String filename with path
     * @param callback Function callback function launched when script has been loaded
     */
    p.requireScript = function(filename, callback) {
        var _self = this;
        if(typeof _self.scriptStack[filename] == "undefined") {
            // Script is unknown, start loading it
            var fullUrl = (filename.indexOf('//') == 0 ? filename : _self.rootUrl +'/'+ filename);

            callbacks = [callback];
            _self.scriptStack[filename] = {loaded: false, callbacks:callbacks};
            $.getScript(fullUrl, function(contents) {if(contents == ""){_self.scriptLoadFailed(filename, "File not found!");}else{_self.scriptLoaded(filename);}})
                .fail(function( jqxhr, settings, exception ) {
                    _self.scriptLoadFailed(filename, exception);
                });

        } else if(!_self.scriptStack[filename].loaded) {
            // Script is known but not yet loaded, add callback to stack
            _self.scriptStack[filename].callbacks.push(callback);

        } else if(_self.scriptStack[filename].loaded) {
            // Script is already loaded, just call the callback
            if(typeof callback == "function")
                callback();
        }
    };

    p.scriptLoadFailed = function(filename, message) {
        console.log("Error loading script '"+ filename +"': "+ message);
    };

    p.scriptLoaded = function(filename) {
        var _self = this;
        // Set script as loaded
        _self.scriptStack[filename].loaded = true;
        // call all callbacks
        for(var i in _self.scriptStack[filename].callbacks) {
            if(typeof _self.scriptStack[filename].callbacks[i] == "function")
                _self.scriptStack[filename].callbacks[i]();
        }
        // Set callbacks to empty, not really needed but..
        _self.scriptStack[filename].callbacks = [];
    };

    /**
     * 	Triggered in window.hashchange event
     */
    p.hashChangeEvent = function(){
        var _self = this;

        if(_self.parseHash()) {
            if(_self.getPagesObject()) {
                _self.getPagesObject().changePage(_self.currentPage);
            } else {
                console.log("Page not found: "+ _self.currentPage);
            }

        }
        return false;
    };

    p.getPagesObject = function() {
        var _self = this;
        if(_self.pagesObject == null) {
            // Get pages object
            _self.pagesObject = $b.OM.find("pages");
        }

        return _self.pagesObject;
    };

    p.toString = function() {
        return "Site["+ this._name +"]";
    };

    $b.Site = Site;
}());