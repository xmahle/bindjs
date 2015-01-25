(function() {

    var BindSite = function () {
        this.initialize();
    };

    var p = BindSite.prototype = new $b.Site();

    p.Site_initialize = p.initialize;
    p.Site_elementCreated = p.elementCreated;
    p.contentPath = "./";
    p.settingsFilename = "settings.json";

    p.currentPageAnchor = "";

    p.initialize = function() {
        this.Site_initialize();

        $(this).off("objectCreated");

        var _self = window.site = this;

        $(this).on("objectCreated", function(){_self.elementCreated();});
    };

    p.elementCreated = function() {
        var _self = this;

        _self.Site_elementCreated();

        // Events
        _self.gJQ('.header a').on('click', function(){return _self.gotoPage($(this).attr('href'))});
    };

    // Override
    p.launchSite = function() {
        var _self = this;

        // Create layout objects
        $b.OP.partial("body");

        // Change to initial page
        var page = window.location.hash == "" ? 'home' : window.location.hash;
        _self.gotoPage(page);

    };

    p.gotoPage = function(pageAnchor) {
        var _self = this;

        if(_self.currentPageAnchor != pageAnchor) {
            var target = _self.gJQ(pageAnchor + 'Page');
            // Page found?
            if (target.length > 0) {
                // Change nav
                _self.gJQ('.header li').removeClass('active');
                _self.gJQ('.header a[href="'+pageAnchor+'"]').parent().addClass('active');

                // Show it
                _self.gJQ('section').hide();
                target.show();

                _self.currentPageAnchor = pageAnchor;
            }
        }
    };

    p.toString = function() {
        return "BindSite["+ this._name +"]";
    };

    $b.BindSite = BindSite;
}());