(function() {

    var CustomSite = function () {
        this.initialize();
    };

    var p = CustomSite.prototype = new $b.Site();

    p.Site_initialize = p.initialize;
    p.Site_elementCreated = p.elementCreated;
    p.settings = {
        "layout": "layout.html",
        "vars": "texts.json",
        "defaultLanguage": "en",
        "languages": [
            "fi",
            "en"
        ],
        "pages": [
            {
                "id": "home",
                "template": "home.html",
                "attributes": {
                },
                "object": "Page",
                "objectAttributes": {
                }
            },
            {
                "id": "about",
                "template": "about.html",
                "attributes": {
                },
                "object": "Page",
                "objectAttributes": {
                }
            }
        ]
    };

    p.initialize = function() {
        this.Site_initialize();
        $(this).off("objectCreated");

        var _self = window.site = this;

        $(this).on("objectCreated", function(){_self.elementCreated();});
    };

    p.elementCreated = function() {
        var _self = this;

        _self.Site_elementCreated();


    };


    p.toString = function() {
        return "CustomSite["+ this._name +"]";
    };

    $b.CustomSite = CustomSite;
}());