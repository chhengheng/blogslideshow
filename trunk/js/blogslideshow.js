/*
* Blog Slide Show
*
* @package blogslideshow
* @author Dmitry Sheiko
* @version $Revision$
* @license GNU
* @copyright (c) Dmitry Sheiko http://dsheiko.com
* @projectDescription A fancy image viewer, that supports many different types of transition
*                     effects including CSS3/HTML5-related.
* @param {effect : string, css: string } - effect can be one of following fade, scroll, ladder,
*                                          jalousie, rotate, zoom, null
*                                          css [OPTIONAL] - stylesheet filename
* @return void
* 
* Project page: http://blogslideshow.googlecode.com/
* Usage examples:
* window.onload = function(){
*     new bsShow({
*         effect: 'fade'
*     });
* }
* 
* Compatibility:
*	Tested with Google Chrome 4.1, Firefox 3.6.3, Opera 10.10, Apple Safari 4.0.5, IE 8
*	Requires jQuery 1.4+
*
*/

/**
 * Blog Slide Show Component
 * @param object options - available options:
 *  effect : string
 *  css : string
 */
function bsShow(options)
{
    // Reconfigurable Singleton
    if (null !== bsShow.instace) {
        bsShow.instace.merge(options);
        return;
    }
    this.merge(options);
    this.init();
    bsShow.instace = this;
}

(function(bsShow) {

var MIN_WIDTH  = 300,
    MIN_HEIGHT = 300;
    
// JS Helpers
// Shortcut for getElementById
var $ = function(divName) {
    return document.getElementById(divName);
}
// Detects whether it's IE-browser or not
$.ie = function() {
    if (navigator.userAgent.toLowerCase().indexOf("msie") != -1) {
        return true;
    }
    return false;
}

// Helper to pass context of use
$.proxy = function (method, context) {
    if (typeof method == 'string') method = context[method];
    var cb = function () { method.apply(context, arguments); }
    return cb;
 };

// Unbind event
$.unbind = function(node, eType, func) {
    if (document.removeEventListener) {
        node.removeEventListener(eType, func, false);
    } else if (document.detachEvent) {
        node.detachEvent('on' + eType, func);
    }
    return node;
};
// Bind event
$.bind = function(node, eType, func) {
    if (document.addEventListener) {
        node.addEventListener(eType, func, false);
    } else if (document.attachEvent) {
        node.attachEvent('on' + eType, func);
    }
    return node;
};
// Combined function to reset event handler
$.delegate = function(node, eType, cb, context) {
    var func = $.proxy(cb, context);
    $.unbind(node, eType, func);
    $.bind(node, eType, func);
};
// Load given CSS file
$.cssLoad = function(file) {
    var node = document.createElement("link")
    node.href = file;
    node.rel = "stylesheet";
    node.type = "text/css";
    document.body.appendChild(node);
};
// Append given HTML in the document
$.insert = function(tagName, html, options) {
    var node = document.createElement(tagName);
    if (html.length) {
        node.innerHTML = html;
    }
    if (undefined !== options) {
        for (key in options) {
            node[key] = options[key];
        }

    }
    document.body.appendChild(node);
};
// Get window size
$.viewport = function() {
	var w = 0;
	var h = 0;
	//IE
	if(!window.innerWidth)
	{
            //strict mode
            if(!(document.documentElement.clientWidth == 0)) {
                w = document.documentElement.clientWidth;
                h = document.documentElement.clientHeight;
            }
            //quirks mode
            else {
                if(document.body.clientWidth) {
                    w = document.body.clientWidth;
                    h = document.body.clientHeight;
                } else {
                    w = window.document.body.offsetWidth;
                    h = window.document.body.offsetHeight;
                }
            }
	}
	//w3c
	else {
            w = window.innerWidth;
            h = window.innerHeight;
	}
	return {width:w,height:h};
};

/**
 * Variation of asynchronous queue, which iterates given callback specified number of times
 */
var aQueue = {
    iterator : 0,
    timer : null,
    options : {},
    chain : [],
    /**
     * Add an asynchronous iterator intothe queue, which will call 'iteratedCallback' of
     * 'iterations' times and then call 'completedCallback'
     * The method is chainable
     * @param object options {
     *      function options.startedCallback
     *      function options.iteratedCallback
     *      function options.completedCallback
     *      int options.iterations - number of iterations
     *      int options.delay - delay in msec
     *      boolean options.reverse - when reverse is true, decrementing, otherwise incrementing
     *      object options.scope - context of use
     * }
     * @return object aQueue
     */
    add : function(options) {
        aQueue.chain.push(options);
        return aQueue;
    },
    /**
     * Run the queue
     * @return void
     */
    run : function() {
        if (aQueue.chain.length) {
            var options = aQueue.chain.shift();
            aQueue.options = options;
            if (undefined !== options.startedCallback) {
                options.startedCallback(options.scope); // I decided started event handler should
            }                                           // be here for the sake of unified interface
            if (undefined === options.iterations) {
                return;
            }
            aQueue.iterator = 0;
            if (undefined !== options.reverse) {
                aQueue.iterator = options.iterations + 1;
                aQueue.deiterate();
            } else {
                aQueue.iterate();
            }
        }
    },
    /**
     * Iterates iteratedCallback till the number of iterations approaches iterations
     * @return void
     */
    iterate : function() {
        if (++aQueue.iterator <= aQueue.options.iterations) {
            aQueue.options.iteratedCallback(aQueue.iterator, aQueue.options.iterations
                , aQueue.options.scope);
            aQueue.timer = setTimeout(aQueue.iterate, aQueue.options.delay);
        } else {
            aQueue.options.completedCallback(aQueue.options.scope);
            aQueue.timer = null;
            aQueue.run();
        }
    },
    /**
     * Deiterates iteratedCallback
     * @return void
     */
    deiterate : function() {
        if (--aQueue.iterator >= 1) {
            aQueue.options.iteratedCallback(aQueue.iterator, aQueue.options.iterations
                , aQueue.options.scope);
            aQueue.timer = setTimeout(aQueue.deiterate, aQueue.options.delay);
        } else {
            aQueue.options.completedCallback(aQueue.options.scope);
            aQueue.timer = null;
            aQueue.run();
        }
    },
    /**
     * Cancel the queue
     */
    stop : function() {
        aQueue.timer = null;
        aQueue.iterator = aQueue.options.reverse ? 0 : aQueue.options.iterations + 1;
        aQueue.chain = [];
    }
}
/**
 * Show effect callbacks
 */
var effect = {
        /**
         * Opacity style setter
         * @param HTMLNode node
         * @param string value
         */
        opacity : function(node, value) {
            if ($.ie()) {
                node.style.filter = 'alpha(opacity:' + value + ')';
            } else {
                node.style.opacity = value / 100;
            }
        },
        /**
         * Transformation style setter
         * @param HTMLNode node
         * @param string value
         */
        transform : function(node, value) {
              node.style.webkitTransform =  value;
              node.style.MozTransform =  value;
        },
        /**
         * Align node to the screen center. When donor specified the node is aligned
         * according to donor size
         * @param HTMLNode node
         * @param HTMLNode donor OPTIONAL
         */
        centerBy : function(node, donor) {
             if (undefined === donor) {
                 donor = node;
             }
             node.style.left = Math.ceil(document.body.scrollLeft
                    + $.viewport().width/2 - donor.width/2) + 'px';
             node.style.top = Math.ceil(document.body.scrollTop
                    + $.viewport().height/2 - donor.height/2) + 'px';
        },
        /**
         * Makes node size the same as donor
         * @param HTMLNode node
         * @param HTMLNode donor
         */
        sizeBy : function(node, donor) {
            node.style.width = donor.width + 'px';
            node.style.height = donor.height + 'px';
        },
        /**
         * Makes node position the same as donor
         * @param HTMLNode node
         * @param HTMLNode donor
         */
        positionBy : function(node, donor) {
            node.style.top = donor.style.top;
            node.style.left = donor.style.left;
        },
        /**
         * Fade effect
         */
        _fadeStarted : function(scope) {
            scope.spriteNode.className = '';
            effect.opacity(scope.spriteNode, 0);
            scope.spriteNode.src = scope.active;
            effect.centerBy(scope.spriteNode);
        },
        _fadeIterated : function(counter, number, scope) {
            effect.opacity(scope.spriteNode, counter * number * 10);
        },
        _fadeCompleted : function(scope) {
            scope.imageNode.src = scope.active;
            effect.opacity(scope.spriteNode, 100);
            effect.centerBy(scope.boundingBox, scope.imageNode);
            scope.spriteNode.className = 'hidden';
        },
        /**
         * Jalousie effect
         */
        _jalousieStarted : function(scope) {            
            scope.spriteNode.src = scope.active;
            effect.sizeBy(scope.eOverlayNode, scope.spriteNode);
            effect.centerBy(scope.eOverlayNode, scope.spriteNode);
            scope.eOverlayNode.className = '';
            var maxW = scope.spriteNode.width;
            for (var i in scope.eOverlayNode.children) {
                var node = scope.eOverlayNode.children[i];
                if (undefined !== node.style) {
                    node.style.backgroundImage = 'url(' + scope.active + ')';
                    node.style.backgroundPosition = '-' + Math.ceil(i * maxW / 10) + 'px 0px';
                    effect.transform(node, 'scale(0.1, 1)');
                }
            }
        },
        _jalousieIterated : function(counter, number, scope) {
            for (var i in scope.eOverlayNode.children) {
                var node = scope.eOverlayNode.children[i];
                if (undefined !== node.style) {
                    effect.transform(node, 'scale(' + (counter / number) + ', 1)');
                }
            }
            effect.opacity(scope.imageNode, (number - counter) * number * 10);
        },
        _jalousieCompleted : function(scope) {            
            scope.imageNode.src = scope.active;
            effect.opacity(scope.imageNode, 100);
            effect.positionBy(scope.boundingBox, scope.eOverlayNode);
            scope.eOverlayNode.className = 'hidden';
        },
        /**
         * Ladder effect
         */
        _ladderStarted : function(scope) {            
            scope.boundingBox.style.background
                = 'url(' + scope.imageNode.src + ') center center no-repeat';
            scope.spriteNode.src = scope.active;
            effect.centerBy(scope.boundingBox, scope.spriteNode);
            effect.sizeBy(scope.boundingBox, scope.spriteNode);
            scope.imageNode.src = "";
            effect.sizeBy(scope.eOverlayNode, scope.spriteNode);
            effect.centerBy(scope.eOverlayNode, scope.spriteNode);
            scope.eOverlayNode.className = '';
        },
        _ladderIterated : function(counter, number, scope) {
            var maxH = scope.spriteNode.height;
            var maxW = scope.spriteNode.width;
            for (var i in scope.eOverlayNode.children) {
                var node = scope.eOverlayNode.children[i];
                if (undefined !== node.style) {
                    var h = Math.ceil((counter-1) * maxH / number - ( i * maxH / 10));
                    if (h > maxH) {
                        h = maxH;
                    }
                    if (h < 0) {
                        h = 0;
                    }
                    node.style.backgroundImage = 'url(' + scope.active + ')';
                    node.style.backgroundPosition = '-' + Math.ceil(i*maxW/10) + 'px ' + h + 'px';
                }
            }
        },
        _ladderCompleted : function(scope) {
            scope.imageNode.src = scope.active;
            effect.positionBy(scope.boundingBox, scope.eOverlayNode);
            scope.eOverlayNode.className = 'hidden';
            scope.boundingBox.style.background = "";
            for (var i in scope.eOverlayNode.children) {
                var node = scope.eOverlayNode.children[i];
                if (undefined !== node.style) {
                    node.style.background = '';
                }
            }
        },
       /**
        * Scroll left effect
        */
        _scrollStarted : function(scope) {
            scope.boundingBox.style.background
                = 'url(' + scope.imageNode.src + ') center center no-repeat';
            scope.spriteNode.src = scope.active;
            effect.centerBy(scope.boundingBox, scope.spriteNode);
            effect.sizeBy(scope.boundingBox, scope.spriteNode);
            scope.imageNode.src = scope.active;
            scope.imageNode.style.left = scope.spriteNode.width + 'px';
            scope.boundingBox.style.overflow = 'hidden';
            scope.imageNode.style.position = 'relative';
        },
        _scrollIterated : function(counter, number, scope) {
            scope.imageNode.style.left =   Math.ceil((counter - 1)
                * scope.spriteNode.width / number) + 'px';
        },
        _scrollCompleted : function(scope) {
            scope.imageNode.style.left =  "0px";
            scope.boundingBox.style.width = 'auto';
            scope.boundingBox.style.height = 'auto';
            scope.boundingBox.style.overflow = '';
            scope.imageNode.style.position = '';
            scope.boundingBox.style.background = '';
        },
        /**
        * Rotate effect
        */
        _rotateStarted : function(scope) {
            scope.boundingBox.style.background
                = 'url(' + scope.imageNode.src + ') center center no-repeat';
            scope.spriteNode.src = scope.active;
            effect.centerBy(scope.boundingBox, scope.spriteNode);
            effect.sizeBy(scope.boundingBox, scope.spriteNode);
            scope.imageNode.src = scope.active;
            
        },
        _rotateIterated : function(counter, number, scope) {
            effect.transform(scope.imageNode,
                'rotate(' + (counter * 45) + 'deg) scale('+ (counter / number) +')');
        },
        _rotateCompleted : function(scope) {
            effect.transform(scope.imageNode,'rotate(0deg) scale(1)');
            scope.boundingBox.style.background = '';
            scope.boundingBox.style.width = 'auto';
            scope.boundingBox.style.height = 'auto';
        },
         /**
        * Zoom effect
        */
        _zoomStarted : function(scope) {
            scope.spriteNode.src = scope.active;
        },
        _zoomHalfCompleted : function(scope) {
            effect.centerBy(scope.boundingBox, scope.spriteNode);
            effect.sizeBy(scope.boundingBox, scope.spriteNode);
            scope.imageNode.src = scope.active;
        },
        _zoomIterated : function(counter, number, scope) {
            effect.transform(scope.imageNode, 'scale('+ (counter / number) +')');
        },
        _zoomCompleted : function(scope) {
            scope.boundingBox.style.width = 'auto';
            scope.boundingBox.style.height = 'auto';
            effect.transform(scope.imageNode, 'scale(1)');
        }        
};

bsShow.instace = null;

bsShow.prototype = {
        options : {
            'css' : 'blogslideshow.css',
            'effect' : 'fade'
        },
	images : [],
	active : null,
        backup : {},

        // Placeholders
        boundingBox : null, // Overlay
        toolbarNode : null, // Toolbar area with navigation buttons
        maskNode : null, // Mask frezzeing the screen
        prevBtnNode : null, // To previous image button
        nextBtnNode : null, // To next image button
        closeBtnNode : null, // Close overlay button
        imageNode : null, // Image object
        spriteNode: null, // Sprite which is used for visual effects
        eOverlayNode: null,

	init : function() {
            $.cssLoad(this.options.css);
            $.bind(document, 'keydown', $.proxy(this._onKeypress, this));            
            this._walkThroughA();
	},
        merge : function(options) {
            if (undefined !== options) {
                for (var key in options) {
                    this.options[key] = options[key];
                }
            }
        },
        /**
         * Aligns component to center of the screen
         * @return void
         */
        center : function() {            
            if (this.imageNode.width < MIN_WIDTH) {
                this.imageNode.width = MIN_WIDTH;
            }
            if (this.imageNode.height < MIN_HEIGHT) {
                this.imageNode.height = MIN_HEIGHT;
            }
            effect.centerBy(this.boundingBox, this.imageNode);
        },
        /**
         * Retrieves previous and next links
         * @return void
         */
        getNavigation : function() {
          // Get navigation position
            var i = 0; // actual index
            // Get actual pagination
            for (var j in this.images) {
                if (this.images[j].src == this.active
                    || this.images[j].rel == this.active) {
                    i = j;
                }
            }
            var prevLink = (i > 0 ? this.images[i - 1].src : null);
            var nextLink = (i < (this.images.length - 1) ? this.images[i * 1 + 1].src
                : null);
            return {prev:prevLink, next: nextLink};
        },
        /**
         * Updates slide show component
         * @param string href
         * @return void
         */
        showImage : function(href) {
            if (null === href || !href.length) {
                return;
            }
            this.backup  = {
                left: this.imageNode.style.left.replace(/\,px$/, ""),
                top: this.imageNode.style.top.replace(/\,px$/, "")
            };
            this.active = href;
            if (this.options.effect && this.imageNode.src != href)  {
                switch (this.options.effect) {
                    case 'fade' :
                        aQueue.add({
                            startedCallback: effect._fadeStarted,
                            iteratedCallback: effect._fadeIterated,
                            completedCallback: effect._fadeCompleted,
                            iterations: 3,
                            delay: 100,
                            scope: this}).run();
                        break;
                    case 'jalousie' :
                        aQueue.add({
                            startedCallback: effect._jalousieStarted,
                            iteratedCallback: effect._jalousieIterated,
                            completedCallback: effect._jalousieCompleted,
                            iterations: 5,
                            delay: 50,
                            scope: this}).run();
                        break;
                    case 'ladder' :
                        aQueue.add({
                            startedCallback: effect._ladderStarted,
                            iteratedCallback: effect._ladderIterated,
                            completedCallback: effect._ladderCompleted,
                            iterations: 20,
                            delay: 50,
                            reverse: true,
                            scope: this}).run();
                        break;
                    case 'scroll' :
                        aQueue.add({
                            startedCallback: effect._scrollStarted,
                            iteratedCallback: effect._scrollIterated,
                            completedCallback: effect._scrollCompleted,
                            iterations: 5,
                            delay: 150,
                            reverse: true,
                            scope: this}).run();
                        break;
                     case 'rotate' :
                        aQueue.add({
                            startedCallback: effect._rotateStarted,
                            iteratedCallback: effect._rotateIterated,
                            completedCallback: effect._rotateCompleted,
                            iterations: 10,
                            delay: 50,
                            scope: this}).run();
                        break;                    
                    case 'zoom' :
                        aQueue.add({
                            startedCallback: effect._zoomStarted,
                            iteratedCallback: effect._zoomIterated,
                            completedCallback: effect._zoomHalfCompleted,
                            iterations: 5,
                            delay: 50,
                            scope: this,
                            reverse : true}).add({
                            iteratedCallback: effect._zoomIterated,
                            completedCallback: effect._zoomCompleted,
                            iterations: 5,
                            delay: 50,
                            scope: this}).run();
                        break;
                }
            } else {
                this.imageNode.src = href;
            }

           

        },
        /**
         * Event handlers
         * Each handler:
         * @param event e
         * @return void
         */
        _onKeypress : function(e) {
            // Escape
            if (27 == e.keyCode) {
                this._onClickClose(e);
            }
            // Next
            if (39 == e.keyCode) {
                 this._onClickNext(e);
            }
            // Previous
            if (37 == e.keyCode) {
               this._onClickPrev(e);
            }
        },
        _onClickPrev : function(e) {
            if($.ie()) { var e = window.event; } else { e.preventDefault(); }
            e.returnValue = false; // IE fix
            this.timer = null;
            this.showImage(this.getNavigation().prev);
        },
        _onClickNext : function(e) {
            if($.ie()) { var e = window.event; } else { e.preventDefault(); }
            e.returnValue = false; // IE fix
            this.timer = null;
            this.showImage(this.getNavigation().next);
        },
        _onClickClose : function(e) {
            if($.ie()) { var e = window.event; } else { e.preventDefault(); }
            e.returnValue = false; // IE fix
            this.timer = null;
            try {
                document.body.removeChild(this.maskNode);
                document.body.removeChild(this.boundingBox);
                document.body.removeChild(this.spriteNode);
                document.body.removeChild(this.eOverlayNode);
            } catch(e) {  }
        },
        /**
         * Subscribe event handlers for the slide show component
         * @return void
         */
        bindUI : function() {
            $.delegate(this.maskNode, 'click', this._onClickClose, this);
            $.delegate(this.prevBtnNode, 'click', this._onClickPrev, this);
            $.delegate(this.nextBtnNode, 'click', this._onClickNext, this);
            $.delegate(this.closeBtnNode, 'click', this._onClickClose, this);

            this.boundingBox.onmouseover = $.proxy(function(e) {
                this.toolbarNode.className = '';
            }, this);
            this.boundingBox.onmouseout = $.proxy(function(e) {
                this.toolbarNode.className = 'hidden';
            }, this);
            if (!this.options.effect) {
                $.bind(this.imageNode, 'load', $.proxy(this.center, this));
            }
            window.onresize = $.proxy(this.center, this);
        },
        /**
         * Renders HTML for the slide show component
         * @param string href
         * @return void
         */
	renderUI : function(href) {
            if (null === href || !href.length) {
                return;
            }
            var tpl = '<img id="ss-image" src="' + href + '" />' +
                '<div id="ss-toolbar" class="hidden">' +
                '   <div id="ss-prev" class="ss-btn"><!-- --></div>' +
                '   <div id="ss-close" class="ss-btn"><!-- --></div>' +
                '   <div id="ss-next" class="ss-btn"><!-- --></div>' +
                '</div>';

            $.insert('div', '', {id:'ss-mask'});
            $.insert('div', tpl, {id:'ss-window'});
            $.insert('img', '', {id:'ss-sprite', className: 'hidden'});
            $.insert('div', '', {id:'ss-effect-overlay', className: 'hidden'});

            this.maskNode = $('ss-mask');
            this.boundingBox = $('ss-window');
            this.toolbarNode = $('ss-toolbar');
            this.prevBtnNode = $('ss-prev');
            this.nextBtnNode = $('ss-next');
            this.closeBtnNode = $('ss-close');
            this.imageNode = $('ss-image');
            this.spriteNode = $('ss-sprite');
            this.eOverlayNode = $('ss-effect-overlay');

            this._fillEOverlay();
            
            this.bindUI();
            this.center();
            this.showImage(href);
	},
        _fillEOverlay : function() {
            for (var i = 0; i < 10; i++) {
                this.eOverlayNode.appendChild(document.createElement('div'));
            }
        },      
        /**
         * Walks through A elements, looking for those which contains Rel=blogslideshow
         * Collect urls of images to be shown
         */
	_walkThroughA : function() {
            var i = 0;
            var links = document.getElementsByTagName("A");
            for(var j in links) {
                 var relAttr  = links[j].rel + ""; // as a String
                 var re = new RegExp("blogslideshow","gi");
                 if (relAttr && re.test(relAttr) && links[j].href) {
                    // Assigns onclick event for found links
                    links[j].onclick = $.proxy(function(e) {
                        if($.ie()) { var e = window.event; } else { e.preventDefault(); }
                        e.returnValue = false; // IE fix
                        this.renderUI(e.currentTarget.href);
                    }, this);
                    // Storages required info
                    this.images[i] = new Image();
                    this.images[i].src = links[j].href;
                    this.images[i].rel = links[j].href;
                    i++;
                 }
            }
	}
};

})(bsShow);