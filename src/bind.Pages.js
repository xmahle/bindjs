
(function() {

    var Pages = function() {
        this.initialize();
    };

    var p = Pages.prototype = new $b.Element();

    p.Element_initialize = p.initialize;

    p.currentPage = "";
    p.homePageId = "";
    p.preloadAllPages = true;
    p.chainPageLoading = true;
    p.updateDocumentTitle = true;
    p.contentPath = "content/";
    p.titleSeparator = " - ";
    p.siteTitle = (typeof structure != "undefined" ? structure.title : null);
    p.pages = (typeof structure != "undefined" ? structure.pages : null);
    p.varsFile = (typeof structure != "undefined" ? structure.vars : null);
    p.vars = false;
    p.pageCount = 0;
    // 0 = horizontal, 1 = vertical
    p.transitionDirection = 0;
    p.transitionSpeed = 0.5;
    p.showPageTween = undefined;
    p.autoPosition = true;
    p.onChangeUrl = "";
    p.autoShowScrollbars = true;
    p.progressDisabled = false;
    p.useKeyboard = true;
    p.keyboardEnabled = true;

    p.initialize = function() {
        this.Element_initialize();

        $(this).on("objectCreated", this.elementCreated);
    };

    p.elementCreated = function() {

        // Reference to self, mui importante!
        var _self = this;

        // Add window resize event
        $(window).resize(function(){_self.windowResizeEvent();return false;});

        var windowHeight = $(window).height();

        if(typeof window.site.vars.title != "undefined") {
            _self.siteTitle = window.site.vars.title;
        }

        if(typeof window.site.contentPath != "undefined") {
            _self.contentPath = window.site.contentPath;
        }

        if(_self.updateDocumentTitle && _self.siteTitle != null ) {
            // Update window title
            window.document.siteTitle = _self.siteTitle;
        }

        // Get pages from settings, if available
        if(typeof window.site.settings[_self._name] != "undefined" ) {
            _self.pages = window.site.settings[_self._name];
        }

        // If site structure is available
        if(_self.pages != null)
        {
            // Create page stub for every page!
            $(_self.pages).each(function(index) {
                // Create new div object
                var page = $('<div>')
                    .attr('id', this.id)
                    .addClass("page")
                    .addClass(this.class)
                    .addClass(this.group)
                    .data("name", this.id)
                    .data("object", this.object)
                    .attr("data-name", this.id)
                    .attr("data-object", this.object)
                    .data("template", this.template)
                    .data("content", this.content)
                    .data("index", index)
                    .data("attributes", this.objectAttributes)
                    .attr(this.attributes);


                // Set loaded state
                _self.pages[index].loaded = false;

                _self.gJQ().append(page);

                if(index==0) {
                    // Set first page as homepage
                    _self.homePageId = this.id;
                }

            });

        } else {

            // Initialize all pages
            _self.gJQ().find('.page').each(function(index, element){

                if(index==0) {
                    // Set first page as homepage
                    _self.homePageId = $(element).attr("id");
                }

                $(element).css("top", windowHeight+"px").css("opacity", 0).hide();

            });
        }

        // Init gotoNextPage links
        $('body')
            .on("click", ".gotoNextPage", function(){ _self.gotoNextPage();return false;})
            .on("click", ".gotoPrevPage", function(){ _self.gotoPrevPage();return false;})
            .on("click", ".gotoPage", function(){_self.gotoPage($(this).data('page'));return false;});

        $(window)
            .on("beforeunload", function() {return _self.unloadEvent();});

        // Set page count for easier access
        _self.pageCount = _self.gJQ().find('.page').length;


        $b.OP.partial(_self.gJQ());

        _self.engineCreatedEvent();
    };

    /**
     * Launched on eCreate Event
     */
    p.engineCreatedEvent = function() {

        var _self = this;

        // Get variables from engine if available
        if(window.site.vars && typeof window.site.vars[_self._name] != "undefined" ) {
            _self.vars = window.site.vars[_self._name];
            _self.startLoading();

        } else if(_self.varsFile) {
            var url = _self.varsFile +($b.DEBUG ? '?'+ new Date().getTime() : '');
            $.getJSON(url, function(data){ _self.vars = data; _self.startLoading();});

        } else {
            _self.startLoading();
        }

        return _self;
    };

    p.startLoading = function() {
        var _self = this;

        if(_self.preloadAllPages) {
            // Chain loading must be true
            _self.chainPageLoading = true;

            // Add all pages loaded event
            $(window).one("allPagesLoaded", function() {
                _self.launchPages();
            });

            // Start loading from first page
            _self.loadPage(_self.homePageId);

        } else {
            // Just open the first page, changePage handles loading...
            _self.launchPages();
        }
    };

    p.launchPages = function() {
        var _self = this;

        // set starting page

        var startPage = _self.pageExists(window.site.currentPage) || _self.homePageId;

        if(_self.currentPage == "") {
            _self.changePage(startPage);
        }

        if(_self.useKeyboard) {
            $("body").on("keydown", function(event) {_self.keypressEvent(event);});
        }

        window.site.hideLoadingScreen();
    };

    /**
     * Loads page by page_id
     * @param string page_id
     */
    p.loadPage = function(page_id) {

        var _self = this;
        var pageObject = $("#"+ page_id);

        if(pageObject.length > 0) {

            // Make sure page isn't already loaded
            if(!_self.pages[pageObject.data("index")].loaded) {
                var url = _self.contentPath + pageObject.data("template") +($b.DEBUG ? '?'+ new Date().getTime() : '');

                $.get(url, function(data){_self.pageLoadedEvent(page_id, data);});

            }

        } else {
            console.log(_self +".loadPage("+page_id+"): Page not found");
        }

        return _self;
    };

    /***
     * Returns next notloaded page object from pages /or null starting from startIndex
     * @param int startIndex
     */
    p.getNextUnloadedPage = function(startIndex) {

        var _self = this;
        var nextPageIndex = startIndex +1;

        // Check that the page index is valid!
        if(typeof _self.pages[nextPageIndex] === "undefined") {

            // Check is first page loaded...
            if(!_self.pages[0].loaded) {
                return _self.pages[0];
            }

        } else if(!_self.pages[nextPageIndex].loaded) {

            return _self.pages[nextPageIndex];
        } else {

            return _self.getNextUnloadedPage(nextPageIndex);
        }

        return null;
    };

    /**
     * Launced after every pageLoaded event
     * @param String page_id
     */
    p.pageLoadedEvent = function(page_id, data) {

        var _self = this;
        var pageObject = $("#"+ page_id);

        if(pageObject) {

            // Update loadingProgress
            if($("#loadingScreen").is(":visible")) {
                var cIndex = 1+Number(pageObject.data("index"));
                var w = Math.ceil(cIndex / _self.pageCount *100);

                $("#loadingScreen .bar").width(w+"%");
                $("#loadingScreen .loadProgressPercent").html(w+"%");
            }
            // Update vars
            if(_self.vars) {

                var pageVars = {},
                    layoutVars = typeof window.site.vars.layout != "undefined" ? window.site.vars.layout : {};

                // Add page id as variable
                if(typeof _self.vars[page_id] !== "undefined") {
                    _self.vars[page_id]['id'] = page_id;

                    pageVars = _self.vars[page_id];
                }

                // render template
                pageObject.html(tmpl(data, jQuery.extend(true, {}, layoutVars, pageVars)));
            } else {
                // Just add
                pageObject.html(data);
            }

            // Parse loaded html
            $b.OP.partial(pageObject);

            // Set page as loaded
            _self.pages[pageObject.data("index")].loaded = true;
            // and trigger page loaded event
            pageObject.trigger("pageLoaded");

            // Check if all pages are loaded, and if chain-load is active
            if(_self.isAllPagesLoaded()) {
                // And trigger event
                $(window).trigger("allPagesLoaded");

            } else if(_self.chainPageLoading) {
                // Get next unloaded page
                var nextPage = _self.getNextUnloadedPage(pageObject.data("index"));

                if(nextPage != null && !nextPage.loaded) {
                    // And load it
                    _self.loadPage(nextPage.id);
                }
            }
        }
        return _self;
    };

    /**
     * Check if all pages are loaded and returns, you know true|false
     */
    p.isAllPagesLoaded = function() {

        var _self = this;
        var allLoaded = true;
        $(_self.pages).each(function() {

            if(!this.loaded)
                allLoaded = false;
        });

        return allLoaded;
    };

    /**
     * Checks that page exists
     * @param string page_id
     * @returns false or page_id
     */
    p.pageExists = function(page_id) {
        return ($("#"+ page_id).length > 0 ? page_id : false);
    };

    p.isLastPage = function(page_id) {
        var _self = this;
        pageObject = (typeof page_id !== "undefined" ? $("#"+ page_id) : $("#"+ _self.currentPage));
        return (typeof pageObject !== "undefined" && pageObject.data("index") == (_self.pageCount-1));
    };
    p.isFirstPage = function(page_id) {
        var _self = this;
        pageObject = (typeof page_id !== "undefined" ? $("#"+ page_id) : $("#"+ _self.currentPage));
        return (typeof pageObject !== "undefined" && pageObject.data("index") == 0);
    };


    /**
     * Handles key press event
     * @param event
     */
    p.keypressEvent = function(event) {
        var _self = this;

        if(!_self.keyboardEnabled) {
            return;
        }

        switch(event.keyCode) {
            // Right
            case 39:
                _self.gotoNextPage();
                break;
            // Left
            case 37:
                _self.gotoPrevPage();
                break;
            // Up
            case 38:
                break;
            // Down
            case 40:
                break;

        }
    };

    /**
     * Launched in beforeunload event
     * @returns {*}
     */
    p.unloadEvent = function() {
        var _self = this;

    };

    /**
     * Triggered on window.resize event
     * Calculates correct page.top value
     */
    p.windowResizeEvent = function(pageid)
    {
        var _self = this;
        var height = $(window).height();
        var width = $(window).width();
        pageid = (typeof pageid != "undefined" && pageid != "") ? pageid : (_self.pageChangingTo != "" ? _self.pageChangingTo : _self.currentPage);
        var pageObject = $("#"+  pageid);
        var showPageHeight = pageObject.height();
        var showPageWidth = pageObject.width();
        var topOffset = ((height-showPageHeight)/2);
        var leftOffset = ((width-showPageWidth)/2);

        // Make sure page top is not below 0
        topOffset = (topOffset<0 ? 0 : topOffset);
        leftOffset = (leftOffset<0 ? 0 : leftOffset);

        if(_self.autoPosition) {
            $("#"+ pageid).css("top", topOffset +"px").css("left", leftOffset+"px");
        }

        return _self;
    };

    /**
     * Changes current page to page_id
     * @param page_id
     * @returns self
     */
    p.changePage = function(page_id) {

        var _self = this;

        if(_self.showPageTween != undefined) {
            return _self;
        }

        // Make sure page_id is valid
        if(!_self.pageExists(page_id)) {
            console.log("Page '"+ page_id +"' not found!");
            page_id = _self.homePageId;
        }

        var pageObject = $("#"+page_id);

        if(pageObject.is(":visible")) {
            // If page is already visible, do nothing...
            return _self;
        }

        _self.pageChangingTo = page_id;

        // Update document title if ...
        if(_self.updateDocumentTitle) {
            var siteTitle = (_self.siteTitle != null ? _self.siteTitle +" " : ""),
                pageTitle = (typeof _self.vars[page_id] != "undefined" ? _self.vars[page_id].pageTitle : "");

            window.document.title =  siteTitle + (siteTitle != "" && pageTitle != "" ? _self.titleSeparator : "") + pageTitle;
        }

        // Is target page loaded?
        if(!_self.pages[pageObject.data("index")].loaded) {

            // Add pageLoaded event
            pageObject.one("pageLoaded", function() {

                // Change page
                _self.changePage(page_id);
            });

            // Start loading page
            _self.loadPage(page_id);

            return _self;
        }

        // Hide scrolbars
        _self.gJQ().css("overflow-y", "hidden");

        var hidePageId = _self.currentPage;

        // If there is current page, hide it
        if(hidePageId != "") {
            var hidePageObject = $("#"+ hidePageId);

            // Trigger hide event and Do It!
            hidePageObject.trigger("pageHideStart");

            hidePageObject.hide();
            _self.pageHideCompleteEvent(hidePageId);
        }


        // Trigger show event and Do It!
        pageObject.trigger("pageShowStart");

        pageObject.show();

        _self.pageShowCompleteEvent(page_id);

        return _self;
    };

    /**
     * Triggered on page show tween completed
     * @param pageId String Page Id
     */
    p.pageShowCompleteEvent = function(page_id) {
        var _self = this;
        var old_page_id = _self.currentPage;
        _self.currentPage = page_id;
        _self.pageChangingTo = "";

        // Inform page that it is now visible

        $("#"+ page_id).trigger("pageShowComplete");

        // Show scrolbars
        if(_self.autoShowScrollbars) {
            _self.gJQ().css("overflow-y", "auto");
        }

    };

    /**
     * Triggered on page hide tween completed
     * @param pageId
     */
    p.pageHideCompleteEvent = function(page_id) {
        // Inform page that it is now hidden
        $("#"+ page_id).trigger("pageHideComplete");
    };


    /**
     * Goes to page page_id
     * @param page_id
     * @returns {Pages}
     */
    p.gotoPage = function(page_id) {
        var _self = this;

        if(_self.pageExists(page_id))
        {
            window.location.hash = window.site.getHash(page_id);

        } else {
            console.log(this +".gotoPage("+ page_id +"): Page does not exist");
        }

        return _self;
    };

    p.toString = function() {
        return "Pages["+ this._name +"]";
    };

    $b.Pages = Pages;
}());

(function() {

    var Page = function () {
        this.initialize();
    };

    var p = Page.prototype = new $b.Element();

    p.Element_initialize = p.initialize;

    p.id = "";
    p.template = "";
    p.class = "";

    p.initialize = function() {
        this.Element_initialize();

    };

    p.toString = function() {
        return "Page["+ this._name +"]";
    };

    $b.Page = Page;
}());