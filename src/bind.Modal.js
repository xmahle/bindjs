(function() {

    var Modal = function () {
        this.initialize();
    };

    var p = Modal.prototype = new $b.Element();

    p.Element_initialize = p.initialize;
    p.Element_show = p.show;
    p.Element_hide = p.hide;
    p.contentFile = "";
    p.overlayId = "overlay";
    p._overlay = "";
    p._modal = "";
    p._content = "";
    p._close = "";
    p.height = -1;
    p.width = -1;
    p.positionOffsetTop = 0;
    p.positionOffsetLeft = 0;
    p.closeClickOverlay = true;

    p.initialize = function() {
        this.Element_initialize();

        $(this).on("objectCreated", this.elementCreated);
    };

    p.elementCreated = function() {

        // Reference to self, mui importante!
        var _self = this;

        // Parent must be body!
        if(_self.gJQ().parent().prop("tagName") != "body") {
            // We have to move dialog under body
            _self.gJQ().appendTo("body");
        }

        // Check that overlay exists
        var overlay = $('#'+ _self.overlayId);
        if(overlay.length == 0)
        {
            // If not, create and append
            overlay = $('<div id="'+ _self.overlayId +'"></div>');

            _self.gJQ().before(overlay);
        }
        // Make sure overlay is hidden
        overlay.hide();

        if(_self.height == -1) {
            _self.height = _self.gJQ().outerHeight();
        }
        if(_self.width == -1) {
            _self.width = _self.gJQ().outerWidth();
        }

        // Add close button event
        _self.gJQ('.closeModal').on('click', function(){_self.hide();return false;});
    };

    // Center the modal in the viewport
    p.center = function () {
        var top, left;

        var _self = this;

        top = Math.max($(window).height() - _self.height, 0) / 2 + _self.positionOffsetTop;
        left = Math.max($(window).width() - _self.width, 0) / 2 + _self.positionOffsetLeft;

        _self.gJQ().css({
            top:top + $(window).scrollTop(),
            left:left + $(window).scrollLeft()
        });
    };

    p.show = function() {
        var _self = this;

        _self.center();

        $(window).on('resize', function(){_self.center();});
        $(window).on('scroll', function(){_self.center();});

        if(_self.closeClickOverlay) {
            $('#'+ _self.overlayId).on('click', function(){_self.hide();}).show();
        } else {
            $('#'+ _self.overlayId).show();
        }

        _self.Element_show();
    };


    p.hide = function() {
        var _self = this;

        if(_self.closeClickOverlay) {
            $('#'+ _self.overlayId).off('click').hide();
        } else {
            $('#'+ _self.overlayId).hide();
        }

        _self.Element_hide();

        $(window).off('resize', function(){_self.center();});
        $(window).off('scroll', function(){_self.center();});
    };

    p.toString = function() {
        return "Modal["+ this._name +"]";
    };

    $b.Modal = Modal;
}());