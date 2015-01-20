
(function() {

    var Element = function() {
        this.initialize();
    };

    var p = Element.prototype;
    p.initialize = function() {
        var _self = this;
        this._visible = ($("[data-name='"+this._name+"']:visible").length > 0);

        $("[data-name='"+this._name+"']").on('remove', function() { _self.killObject();});

        _self.state = 1;
    };

    p._id = -1;
    p._name = "Unknown";
    p.transitions = {};
    p.jqueryObject = null;
    p.htmlDeadState = "";
    p.state = 0;
    p._visible = true;

    p.parseVariables = function(data) {

        if(typeof tmpl !== "undefined")
        {
            var template = this.gJQ().html();
            this.gJQ().html(tmpl(template, data));

        } else {
            console.log("tmpl.js not included");
        }

    };
    /**
     * Function is called when object is recreated in html
     * @returns {boolean}
     */
    p.resurrectObject = function() {
        var _self = this;
        if(_self.state == 0) {
            _self.jqueryObject = $("[data-name='" + this._name + "']").html(_self.htmlDeadState);
            _self.state = 1;
            return true;
        }
        return false;
    };
    /**
     * Called when object html is removed from DOM
     */
    p.killObject = function() {
        var _self = this;
        // Remove events
        $("[data-name='"+this._name+"']").off('remove', function() { _self.killObject();});

        // save html state
        _self.htmlDeadState = _self.jqueryObject.html();
        // Remove jQueryObject
        _self.gJQ().remove();
        _self.jqueryObject = null;

        _self.state = 0;
    };

    /**
     * Use this to remove the DOM element and destroy it from Bind.JS
     */
    p.destroyObject = function() {
        var _self = this;

        _self.killObject();

        $b.OM.remove(_self._name);
    };

    /**
     * Show self, uses transition if applied
     * @param effect
     */
    p.show = function(effect) {
        var _self = this;
        var onComplete = function() {_self.showCompletedEvent();};

        $("[data-name='"+this._name+"']").show(effect, onComplete);

        $("[data-name='"+this._name+"']").trigger("elementShow");
        $(this).trigger("elementShow");
    };
    p.showCompletedEvent = function() {
        $("[data-name='"+this._name+"']").trigger("elementShowFinish");
        this._visible = true;
        $(this).trigger("elementShowFinish");
    };

    /**
     * Hides self, uses transition if applied
     * @param effect
     */
    p.hide = function(effect) {
        var _self = this;
        var onComplete = function() {_self.hideCompletedEvent();};

        $("[data-name='"+this._name+"']").hide(effect, onComplete);

        $("[data-name='"+this._name+"']").trigger("elementHide");
        $(this).trigger("elementHide");
    };
    p.hideCompletedEvent = function() {
        $("[data-name='"+this._name+"']").trigger("elementHideFinish");
        this._visible = false;
        $(this).trigger("elementHideFinish");
    };

    /**
     * Hide or Show _self
     * @param effect string
     */
    p.toggle = function(effect) {

        if($("[data-name='"+this._name+"']").is(":visible"))
        {
            this.hide(effect);
        } else {
            this.show(effect);
        }
    };

    /**
     * Returns jQuery object of _self
     */
    p.gJQ = function(selector)
    {
        if(this.jqueryObject == null || this.jqueryObject.length == 0) {
            this.jqueryObject = $("[data-name='"+ this._name+"']");
        }

        return (typeof selector !== "undefined" ? this.jqueryObject.find(selector) : this.jqueryObject);
    };

    /**
     * jQuery event functions
     * @param eventName
     * @param func
     * @returns {*|jQuery}
     */
    p.on = function(eventName, func) {
        return $(this).on(eventName, func);
    };
    p.off = function(eventName, func) {
        return $(this).off(eventName, func);
    };

    /**
     * Event launch event handler
     * @param event object
     */
    p.launchEvent = function(event) {

        if(this[event.data.eventAction])
        {
            this[event.data.eventAction].apply(this, event.data.eventAttributes);

            return false;
        } else {
            console.log("Event action not found: "+ this +"."+ event.data.eventAction);
        }
    };

    p.toString = function() {
        return "Element["+ this._name +"]";
    };

    $b.Element = Element;
}());