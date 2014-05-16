var builder = {
    container: '[id="pageContent"]'
}

App.directive('iframe', function($timeout)
{
    return {
        restrict: 'E',
        require: '?ngModel',
        link: function( $scope, $element, $attrs, $ctrl ) 
        {

            $scope.$watch('saveComponent', function(newValue, oldValue)
            {
                if (newValue !== oldValue && newValue !== false)
                    $scope.saveComponentRequest(newValue);
            });

            $scope.$watch('savePage', function(newValue, oldValue)
            {
                if (newValue !== oldValue)
                    if (newValue !== false)
                        toggleCK('off');
            });

            $scope.$watch('toggleCodeEditor', function(newValue, oldValue)
            {
                if (newValue !== oldValue)
                {
                    if (newValue !== false)
                        ngUpdateEditor();
                    else
                        $('#toggle-code-editor').parent().removeClass('active');
                }
            });

            var container = builder.container;

            $scope.selectBreadcrumb = function(id)
            {

                var $frame = angular.element($element),
                    t = $frame.contents().find('#' + id);

                if (t && t.length) 
                    attachOverlay(t);
            };

            function updateBreadcrumb()
            {
                var $frame = angular.element($element),
                    $f = $frame[0].contentWindow.jQuery,
                    a = getOverlayAttachment();

                if (a.length)
                {
                    var b = a.parents(),
                        c = b.get().reverse(),
                        d = getOverlayAttachment().add($f(c));
          
                    var e = d
                        .filter(function()
                        {
                            return !$f(this).is('body, html')
                                && ($f(this).parents(container).length || $f(this).is(container));
                        })
                        .map(function(index)
                        {
                            var t = $f(this),
                                id = t.uniqueId().attr('id'),
                                nn = t.get(0).nodeName,
                                m = getSelectionMode(t),
                                name = ((typeof m == 'undefined') ? nn : m) + '(' + index + ')';

                            return {
                                name: name,
                                id: id
                            };
              
                        })
                        .get();
                }
                else
                    var e = [];

                $timeout(function()
                {
                    $scope.breadcrumb = e
                    $scope.$apply();
                });
            }

            function ngUpdateEditor()
            {
                var a = getOverlayAttachment(),
                    b = a.data('original') ? $('<div/>').html(a.data('original')) : a.clone(),
                    c = a.is('[data-component]') ? b : $('<div/>').html(b.prop('outerHTML'));
                    d = $scope.makeTemplate(c),
                    e = beautify(d);

                $timeout(function()
                {
                    $scope.bodyEditor = e;
                    $scope.$apply();
                });
            }

            $scope.codeEditorSave = function()
            {
                var t = getOverlayAttachment(),
                    c = $scope.bodyEditor,
                    $frame = angular.element($element),
                    $f = $frame[0].contentWindow.jQuery,
                    reload = false;

                if (t.data('original'))
                {
                    t.data('original', c);
                    reload = true;
                }
                else
                {
                    if (t.is('[data-component]'))
                        t.html(c);
                    else
                    {
                        var fc = $f(c);
                            t = t.replaceWith(fc);

                        fc.uniqueId();
                        attachOverlay(fc);
                    }
                }

                var tt = t.html(),
                    hasTags = tt.match(/\{\{(.*)\}\}/gi),
                    reload = reload ? true : (hasTags !== null);

                changeComponent();
                saveComponent(reload);
            };

            function ngSaveComponent(o)
            {
                $timeout(function()
                {
                    $scope.savePage = {};
                    $scope.saveComponent = o;
                    $scope.$apply();
                });
            }

            function ngSavePage(reload)
            {
                if (typeof reload == 'undefined')
                    var reload = false;

                var template = getTemplate(false),
                    searchId = locationSearchObj().id,
                    id = searchId ? isGuid(searchId) : false;
            
                if (id && id.length)
                    id = id[0];
                else
                    id = guid();

                var o = {
                    id: id,
                    template: template,
                    reload: reload
                };

                $timeout(function(){
                    $scope.savePage = o;
                    $scope.savePageRequest(o);
                    $scope.page = o;
                    $scope.$apply();
                });
            }

            function getTemplate(outer)
            {
                if (typeof outer == 'undefined')
                    var outer = true;

                var $frame = angular.element($element),
                    templateContent = $frame.contents().find(container).clone(),
                    template = $scope.makeTemplate(templateContent, outer);

                return template;
            }
            
            function apply()
            {
                var $frame = angular.element($element),
                    template = $ctrl.$viewValue || '';

                $frame.empty();

                var fc = $frame[0].contentDocument,
                    fw = $frame[0].contentWindow;

                fc.open();
                fc.write(template);
                fc.close();

                fw.builder = builder;

                $frame.load(function()
                {

                    $timeout(function(){
                        $scope.iframeLoaded = true;
                        $scope.$apply();
                    });

                    var overlayDisabled = false,
                        $f = this.contentWindow.jQuery,
                        overlay = $f('#overlay'),
                        overlays = {
                            select: overlay,
                            hover: $f('#overlay-hover')
                        },
                        mode = 'all';

                    $f('body')
                        .attr('spellcheck', false)
                        .disableSelection();

                    $f(window).resize(function()
                    {
                        if (overlay.is(':visible'))
                            attachOverlay();
                    });

                    function getSelectionMode(t)
                    {
                        var mode = mode;

                        if (typeof t == 'undefined')
                        {
                            if (!overlay.is(':visible'))
                                return mode;
                            else
                                var t = getOverlayAttachment();
                        }

                        if (t.is('.row')) mode = 'row';
                        if (t.is('[class*="col-"]')) mode = 'column';
                        if (t.is('[data-component]')) mode = 'component';
                        if (t.parent().is('[data-component]') && t.parent().find('> *').filter(function()
                        {
                            return this.nodeType !== 8 
                                && !isExcluded($f(this));
                        }).length == 1) mode = 'component';

                        return mode;
                    }

                    function attachOverlay (t, overlay)
                    {
                        if (typeof overlay == 'undefined')
                            var overlay = overlays.select;

                        toggleComponentsMenu();

                        if (overlay.is(overlays.hover))
                        {
                            if (typeof t == 'undefined')
                                return;

                            var select_t = getOverlayAttachment();
                            if (t.is(select_t))
                                return;
                        }
                        else if (typeof t == 'undefined')
                            var t = getOverlayAttachment();

                        var o_label,
                            mode = getSelectionMode(t);

                        if (mode == 'component' && !t.is('[data-component]'))
                            t = t.parent();

                        switch (mode)
                        {
                            default: o_label = t.get(0).tagName; break;
                            case 'column': 
                                o_label = 'Column (' + (t.attr('class').match(/\bcol-([a-z]+)-([0-9]+)/g) || []).join(' ') + ')';
                                break;

                            case 'row': o_label = 'Row'; break;
                            case 'component': o_label = 'Component (' + t.attr('data-component') + ')'; break;
                        }

                        t.uniqueId();
                        overlay.attr('data-id', t.attr('id'));
                        overlay.find('#overlay-label').text(o_label);

                        if (overlay.is(overlays.select))
                        {
                            connectOverlayToSortables(t);
                            hideOverlay(overlays.hover);
                        }

                        overlay
                            .css({
                                'top': t.offset().top,
                                'left': t.offset().left,
                                'width': t.outerWidth(),
                                'height': t.outerHeight()
                            })
                            .find('.btn-group.open > .dropdown-toggle').click()
                            .end()
                            .find('[id*="overlay-menu"]').show()
                            .end()
                            .show();

                        if (t.outerWidth() < 100)
                            overlay.find('[id*="overlay-menu"]').hide();

                        if (overlay.is(overlays.select))
                        {
                            updateBreadcrumb();
                            if ($scope.toggleCodeEditor)
                                ngUpdateEditor();
                        }

                        toggleCK('off');
                    }

                    function getOverlayAttachment(overlay)
                    {
                        if (typeof overlay == 'undefined')
                            var overlay = overlays.select;

                        return $f('#' + overlay.attr('data-id'));
                    }

                    function getOverlayComponent()
                    {
                        var a = getOverlayAttachment();
                        var c = a.closest('[data-component]');
                        return c.length ? c.attr('data-component') : false;
                    }

                    function connectOverlayToSortables(t)
                    {
                        if (typeof t == 'undefined')
                            var t = getOverlayAttachment();

                        var s = false,
                            disableDraggable = true,
                            mode = getSelectionMode(t),
                            disabled = overlay.draggable('option', 'disabled');

                        switch (mode)
                        {
                            default: 
                      
                                if (t.is('li'))
                                {
                                    s = t.closest('ul') || false;
                                    if (!s.length) s = t.closest('ol') || false;
                                }

                                else if (t.is('div') && !t.is(container))
                                    s = $f('div.ui-sortable');
                                    // s = container;

                                else if (t.is('p'))
                                    s = $f('div.ui-sortable');
                                    // s = container;

                                else if (t.is(':header') && !t.parent().is('.widget-head'))
                                    s = $f('div.ui-sortable');
                                    // s = container;

                                else
                                    s = false;

                                if (s && !s.length)
                                    s = false;

                                break;

                            case 'column': s = t.closest('.row') || false; break;
                            case 'row': s = container; break;
                            case 'component': 
                                s = $f('div.ui-sortable'); 
                                break;
                        }

                        overlay.draggable('option', 'connectToSortable', s);

                        if (!s)
                            overlay.draggable('disable').find('#overlay-move').hide();
                        else if (s && disabled)
                            overlay.draggable('enable').find('#overlay-move').show();
                    }

                    function getElement(x, y, searchDown, m)
                    {
                        var elem = fc.elementFromPoint(x, y),
                            t = false,
                            res = [];

                        if (typeof m != 'undefined')
                            var mode = m;

                        if (typeof searchDown == 'undefined')
                            var searchDown = false;

                        while(elem)
                        {
                            if (!$f(elem).is(overlays.select) 
                                && !$f(elem).is(overlays.hover)
                                && !$f(elem).closest(overlays.select).length
                                && !$f(elem).closest(overlays.hover).length
                                && !isExcluded($f(elem)))
                            {
                                t = $f(elem);
                                break;
                            }

                            if (elem.tagName == 'BODY')
                                break;

                            res.push(elem);
                            elem.style.visibility = "hidden";
                            elem = fc.elementFromPoint(x, y);
                        }

                        for(var i = 0; i < res.length; i++)
                            res[i].style.visibility = "visible";

                        switch (mode)
                        {
                            default: break;

                            case 'column':
                                if (t && !t.is('[class*="col-"]')) t = t.closest('[class*="col-"]') || false;
                                break;

                            case 'row':
                                if (t && !t.is('.row')) t = t.closest('.row') || false;
                                break;

                            case 'component':
                                if (t && !t.is('[data-component]')) 
                                {
                                    var tt = t.closest('[data-component]');

                                    if (!tt.length && searchDown === true)
                                        tt = t.find('[data-component]').first();

                                    t = tt || false;
                                }
                                break;
                        }

                        if (!t.length)
                            return false;

                        return t;
                    }

                    function isExcluded(t)
                    {
                        if (typeof t == 'undefined')
                            return true;

                        var excludeElements = ['body', 'canvas', 'table', '[data-builder-exclude*="element"]', '[data-builder-exclude=""]'],
                            excludeParents = ['canvas', 'table', '[data-builder-exclude*="children"]'],
                            excludeDirectParents = ['body'],
                            excluded = false;

                        // common theme elements
                        excludeElements.push('.widget-head', '.widget-body', 'i');

                        // common bootstrap elements
                        excludeElements.push('.clearfix', '.pull-left', '.pull-right');

                        // bootstrap switch
                        excludeParents.push('.make-switch');

                        $f.each(excludeElements, function(k,v)
                        {
                            if (t.is(v))
                            {
                                excluded = true;
                                return false;
                            }
                        });

                        $f.each(excludeParents, function(k,v)
                        {
                            if (t.parents(v).length)
                            {
                                excluded = true;
                                return false;
                            }
                        });

                        $f.each(excludeDirectParents, function(k,v)
                        {
                            if (t.parent(v).length)
                            {
                                excluded = true;
                                return false;
                            }
                        });

                        return excluded;
                    }

                    function changeComponent(r, t)
                    {
                        if (typeof r == 'undefined')
                            var r = false;

                        if (typeof t == 'undefined')
                            var t = getOverlayAttachment();

                        if (r === false)
                        {
                            var p = t.parents('[data-component]').addBack();
                            if (p.length) p.attr('data-builder-saveComponent', true);
                        }
                        else
                            $f('[data-builder-saveComponent]').removeAttr('data-builder-saveComponent');
                    }

                    function saveComponent(reload)
                    {
                        if (typeof reload == 'undefined')
                            var reload = false;

                        var changes = $f('[data-builder-saveComponent]');
                        if (changes.length)
                        {
                            var components = changes.map(function(){
                                return $f(this).attr('data-component');
                            }).get().reverse(),
                            components_str = components.join(', ');

                            var sct = setInterval(function()
                            {
                                if (!components.length)
                                {
                                    sct = clearInterval(sct);
                                    ngSavePage(reload);
                                }
                                if (!$scope.saveComponent)
                                {
                                    var componentName = components.shift(),
                                        t = changes.filter('[data-component*="' + componentName + '"]'),
                                        id = isGuid(componentName, "php."),
                                        template;

                                    if (id && id.length)
                                        id = id[0];
                                    else
                                    {
                                        id = "php." + guid();
                                        t.attr('data-component', id);
                                    }

                                    if (t.data('original'))
                                        template = $scope.makeTemplate($f('<div/>').html(t.data('original')));
                                    else
                                        template = $scope.makeTemplate(t.clone());

                                    var o = {
                                        name: componentName,
                                        template: template,
                                        id: id
                                    };

                                    ngSaveComponent(o);
                                }
                            }, 10);

                            changeComponent(true);
                        }
                        else
                            ngSavePage(reload);
                    }

                    function deleteElement()
                    {
                        if (!confirm('Are you sure you want to delete this selection?'))
                            return;

                        changeComponent();
                  
                        hideOverlay();

                        var t = getOverlayAttachment(),
                            p = t.parent();

                        getOverlayAttachment().remove();

                        if (!$.trim(p.text()).length)
                            p.empty();

                        saveComponent();
                    }

                    function selectRow()
                    {
                        // mode = 'row';
                        var xy = getXY(overlay.offset().left, overlay.offset().top),
                            x = xy.x,
                            y = xy.y;

                        var t = getElement(x, y, false, 'row');
                            t ? attachOverlay(t) : overlay.hide();
                    }

                    function selectColumn()
                    {
                        // mode = 'column';
                        var xy = getXY(overlay.offset().left, overlay.offset().top),
                            x = xy.x,
                            y = xy.y;

                        var t = getElement(x, y, false, 'column');
                            t ? attachOverlay(t) : overlay.hide();
                    }

                    function selectComponent()
                    {
                        // mode = 'component';
                        var xy = getXY(overlay.offset().left, overlay.offset().top),
                            x = xy.x,
                            y = xy.y;

                        var t = getElement(x, y, true, 'component');
                            t ? attachOverlay(t) : overlay.hide();
                    }

                    function hideOverlay(overlay)
                    {
                        if (typeof overlay == 'undefined')
                            var overlay = overlays.select;

                        overlay.hide();

                        if (overlay.is(overlays.select))
                        {
                            overlays.hover.hide();
                            updateBreadcrumb();
                        }
                    }

                    function getXY(x, y)
                    {
                        if (fw.pageXOffset > 0)
                            x -= fw.pageXOffset;

                        if (fw.pageYOffset > 0)
                            y -= fw.pageYOffset;

                        return { "x": x, "y": y };
                    }

                    function toggleCodeEditor(m)
                    {
                        var e = $scope.toggleCodeEditor,
                            ee = (typeof m == 'undefined') ? !e : m;

                        $timeout(function(){
                            $scope.toggleCodeEditor = ee;
                            $scope.$apply();
                    
                            if (ee)
                                attachOverlay();
                        });
                    }

                    overlay
                        .find('.deleteElement').on('click', function(){
                            deleteElement();
                        })
                        .end()
                        .find('#closeOverlay').on('click', function(){
                            overlay.hide();
                        })
                        .end()
                        .find('#selectAll').on('click', function(){
                            if (mode == 'column')
                                return selectRow();

                            selectColumn();
                        })
                        .end()
                        .find('#toggleCodeEditor').on('click', function(){
                            toggleCodeEditor();
                        });

                    $f('a').on('click', function(e)
                    {
                        e.preventDefault();
                    });

                    // generate unique ID's
                    $f('[data-component]').uniqueId();
                    $f('[data-component=""]').each(function()
                    {
                        $f(this).attr('data-component', guid());

                        if (!$f(this).attr('data-builder-saveComponent'))
                            $f(this).attr('data-builder-saveComponent', true);
                    });

                    // overlays
                    overlays.hover
                        .on('mouseleave', function()
                        {
                            hideOverlay(overlays.hover);
                        });

                    $f.expr[':'].scrollable = function( elem ) 
                    {
                        var scrollable = false,
                            props = [ '', '-x', '-y' ],
                            re = /^(?:auto|scroll)$/i,
                            elem = $f(elem);
                  
                        $f.each( props, function(i,v){
                            return !( scrollable = scrollable || re.test( elem.css( 'overflow' + v ) ) );
                        });
                  
                        return scrollable;
                    };

                    $f('body')
                    .on('mousewheel DOMMouseScroll', function(e)
                    {
                        var scrollTo = null,
                            scrollable = getOverlayAttachment(overlays.hover).closest(':scrollable'),
                            scrollEnd;

                        if (e.type == 'mousewheel')
                            scrollTo = (e.originalEvent.wheelDelta * -1);

                        else if (e.type == 'DOMMouseScroll')
                            scrollTo = 40 * e.originalEvent.detail;

                        if (scrollTo && scrollable.length)
                        {
                            e.preventDefault();

                            var t = getOverlayAttachment();
                                overlayDisabled = true;
                            
                            hideOverlay();
                  
                            scrollable.scrollTop(scrollTo + scrollable.scrollTop());

                            scrollEnd = clearTimeout(scrollEnd);
                            scrollEnd = setTimeout(function()
                            {
                                overlayDisabled = false;
                            },
                            100);
                        }
                    });

                    $f('body')
                    .on('mousemove.builder', function(event)
                    {
                        if (overlayDisabled)
                            return;

                        if ($f(event.srcElement).closest('[id="overlay-label"]').length)
                            return;

                        if ($f(event.srcElement).closest('[id*="overlay-menu"]').length)
                            return;

                        var xy = getXY(event.pageX, event.pageY),
                            x = xy.x,
                            y = xy.y,
                            t = getElement(x, y);

                        if (t && t.length)
                            attachOverlay(t, overlays.hover);
                    })
                    .on('mousedown.builder', function(event)
                    {
                        if (overlayDisabled)
                            return;

                        if ($f(event.srcElement).closest('[contenteditable]').length)
                            return;

                        if ($f(event.srcElement).closest('[id*=overlay-menu]').length)
                            return;

                        event.stopPropagation();

                        var xy = getXY(event.pageX, event.pageY),
                            x = xy.x,
                            y = xy.y,
                            t = getElement(x, y);

                        if (t)
                            attachOverlay(t);
                        else
                            hideOverlay();

                    });

                    overlay.on('dblclick', function(event)
                    {
                        event.stopPropagation();
                        var xy = getXY(event.pageX, event.pageY),
                            x = xy.x,
                            y = xy.y,
                            t = getOverlayAttachment(),
                            mode = getSelectionMode(t),
                            text = $.trim(t.text());

                        if (mode == 'column')
                            return selectRow();

                        var c = 
                            t.find("*")
                            .addBack()
                            .filter(function()
                            {
                                var $t = $f(this);
                                return !isExcluded($t)
                                    && $.trim($t.text()).length > 0;
                            })
                            .first();

                        if (c.length)
                            toggleCK('on', c);
                    });

                    fw.key('command+a', function(e, handler)
                    {
                        if (!overlay.is(':visible'))
                            return;

                        e.preventDefault();

                        if (mode == 'column')
                            return selectRow();

                        if (mode == 'row')
                            return selectComponent();

                        selectColumn();
                    });

                    fw.key('command+s,ctrl+s', function(e, handler)
                    {
                        e.preventDefault();
                        $scope.handleKeySave();
                    });

                    fw.key('command+e', function(e, handler)
                    {
                        if (!overlay.is(':visible'))
                            return;

                        e.preventDefault();
                        toggleCodeEditor();
                    });

                    fw.key('right', function(e, handler)
                    {
                        if (!overlay.is(':visible'))
                            return;

                        var t = getOverlayAttachment(),
                            n = t.next().filter(function(){ return !isExcluded($f(this)); }),
                            matches = false,
                            mode = getSelectionMode(t);
                  
                        if (mode == 'row')
                            matches = $f('body').find('.row');

                        else if (mode == 'column')
                            matches = $f('body').find('[class*="col-"]');

                        else if (mode == 'component')
                            matches = $f('body').find('[data-component]');

                        else
                            matches = $f('body').find(t.get(0).nodeName);

                        if (matches)
                        {
                            matches = matches
                                .filter(function(index){
                                    return !isExcluded($f(this)) 
                                        && $f(this).is(':visible');
                                });

                            var t_index = matches.index(t) + 1;
                                n = matches.eq(t_index).length ? matches.eq(t_index) : matches.eq(0);
                        } 

                        if (typeof n != 'undefined' && n.length)
                            attachOverlay(n);
                    });

                    fw.key('left', function(e, handler)
                    {
                        if (!overlay.is(':visible'))
                            return;

                        var t = getOverlayAttachment(),
                            n = t.prev().filter(function(){ return !isExcluded($f(this)); }),
                            matches = false,
                            mode = getSelectionMode(t);

                        if (mode == 'row')
                            matches = $f('body').find('.row');

                        else if (mode == 'column')
                            matches = $f('body').find('[class*="col-"]');

                        else if (mode == 'component')
                            matches = $f('body').find('[data-component]');

                        else
                            matches = $f('body').find(t.get(0).nodeName);

                        if (matches)
                        {
                            matches = matches
                                .filter(function(index){
                                    return !isExcluded($f(this)) 
                                        && $f(this).is(':visible');
                                });

                            var t_index = matches.index(t);
                                n = matches.eq(t_index - 1);
                        }
                  
                        if (n.length)
                            attachOverlay(n);
                    });

                    fw.key('escape', function(e, handler)
                    {
                        if (overlay.is(':visible'))
                        {
                            e.preventDefault();
                            hideOverlay();
                        }
                        toggleCK('off');
                        toggleCodeEditor(false);
                    });

                    fw.key('o', function(e, handler)
                    {
                        if (overlay.is(':visible'))
                            overlay.find('.btn-group > .dropdown-toggle').click();
                    });

                    fw.key('command+backspace, del', function(e, handler)
                    {
                        if (!overlay.is(':visible'))
                            return;

                        e.preventDefault();
                        deleteElement();
                    });

                    fw.key('command+d', function(e, handler)
                    {
                        if (!overlay.is(':visible'))
                            return;

                        e.preventDefault();
                        var t = getOverlayAttachment(),
                            n = t.clone(),
                            mode = getSelectionMode(t);

                        t.after(n);

                        n.add(n.find('[class*="col-"], .row, [data-component]'))
                        .removeUniqueId()
                        .uniqueId();

                        if (mode == 'row' || mode == 'column')
                        {
                            n.add(n.find('.row, [class*="col-"]')).removeClass('ui-sortable');
                            makeSortables();
                        }

                        attachOverlay(n);
                        changeComponent();
                        saveComponent();
                    });

                    fw.key('command+1, command+2, command+3, command+4', function(e, handler)
                    {
                        e.preventDefault();
                        var t = getOverlayAttachment(),
                            mode = getSelectionMode(t),
                            p = (mode == 'column') ? t.closest('.row') : t,
                            cols_requested,
                            cols_class,
                            cols_total = 12,
                            row_template = $f('<div class="row"></div>');

                        switch (handler.shortcut)
                        {
                            default: break;
                            case 'command+1': cols_requested = 1; break;
                            case 'command+2': cols_requested = 2; break;
                            case 'command+3': cols_requested = 3; break;
                            case 'command+4': cols_requested = 4; break;
                        }

                        cols_class = 'col-md-' + (cols_total / cols_requested);
                  
                        for(var i=1;i<=cols_requested;i++)
                            row_template.append('<div class="' + cols_class + '"></div>');

                        if (overlay.is(':visible'))
                            p.after(row_template);
                        else
                            $f(container).prepend(row_template);

                        row_template.add(row_template.find('[class*="col-"]')).uniqueId();

                        makeSortables();

                        attachOverlay(row_template.children().first());
                  
                        changeComponent();
                        saveComponent();
                    });

                    fw.key('1,2,3,4,5,6,7,8,9,ctrl+0,ctrl+1,ctrl+2', function(e, handler)
                    {
                        if (overlay.is(':visible') && getSelectionMode() == 'column')
                        {
                            e.preventDefault();
                            var t = getOverlayAttachment(),
                                r = t.closest('.row'),
                                cols_total = 12,
                                cols_remaining = 0,
                                cols = r.find('> [class*="col-"]'),
                                col_class = 0;

                            switch (handler.shortcut)
                            {
                                default: 
                                    cols_remaining = cols_total - handler.shortcut;
                                    col_class = handler.shortcut;
                                    break;

                                case 'ctrl+0':
                                    cols_remaining = 2;
                                    col_class = cols_total - cols_remaining;
                                    break;

                                case 'ctrl+1':
                                    cols_remaining = 1;
                                    col_class = cols_total - cols_remaining;
                                    break;

                                case 'ctrl+2':
                                    cols_remaining = 12;
                                    col_class = 12;
                                    break;
                            }

                            t
                            .removeClass (function (index, css) {
                                return (css.match (/\bcol-md-([0-9]+)/g) || []).join(' ');
                            })
                            .addClass('col-md-' + col_class);

                            if (cols.length == 2 || handler.shortcut == 'ctrl+2')
                            {
                                cols.not(t)
                                .removeClass(function (index, css) {
                                    return (css.match (/\bcol-md-([0-9]+)/g) || []).join(' ');
                                })
                                .addClass('col-md-' + cols_remaining);
                            }

                            attachOverlay(t);
                            changeComponent();
                            saveComponent();
                        }
                    });

                    function makeSortableRows()
                    {
                        var rows = $f('.row').not('.ui-sortable');
                            rows = rows
                            .filter(function(index){
                                return !$f(this).closest('[data-builder-exclude]').length;
                            });

                        rows.each(function()
                        {
                            $f(this).sortable(
                            {
                                handle: '#someInexistentHandle',
                                items: '> [class*="col-"]',
                                tolerance: 'pointer',
                                axis: 'x',
                                placeholder: 'placeholder-draggable',
                                forceHelperSize: true,
                                forcePlaceholderSize: true,
                                start: function(e, ui)
                                {
                                    var helperClass = ui.helper.attr('class');
                                    ui.placeholder.addClass(helperClass);
                                    changeComponent();
                                },
                                stop: function(e, ui)
                                {
                                    var el = getOverlayAttachment().show();
                                    ui.item.replaceWith(el).show();
                                    attachOverlay();
                                    changeComponent();
                                    saveComponent();
                                }
                            });

                        });
                    }

                    function makeSelectionSortable(selection)
                    {
                        selection.sortable(
                        {
                            handle: '#someInexistentHandle',
                            items: '> *',
                            tolerance: 'pointer',
                            placeholder: 'placeholder-draggable',
                            forceHelperSize: true,
                            forcePlaceholderSize: true,
                            connectWith: selection,
                            start: function(e, ui)
                            {
                                var t = getOverlayAttachment();
                                changeComponent();

                                ui.placeholder.css({
                                    float: t.css('float'),
                                    width: t.outerWidth(),
                                    height: t.height()
                                });
                            },
                            stop: function(e, ui)
                            {
                                var el = getOverlayAttachment().show();
                                ui.item.replaceWith(el).show();
                                attachOverlay();
                                changeComponent();
                                saveComponent();
                            }
                        });
                    }

                    $f.expr[':'].allowSortable = function(elem, index, match)
                    {
                        var t = $f(elem);

                        var filterDivs = false;
                        if (t.is('div'))
                        {
                            if (t.is('.pull-left') || t.is('.pull-right'))
                                filterDivs = true;
                        }

                        return !t.is('.row')
                            && !t.is('.ui-sortable')
                            && !t.is('.widget')
                            && !t.is('.widget-head')
                            && !t.is('.clearfix')
                            && !t.find('> .clearfix').length
                            && !filterDivs
                            && !t.is('[data-builder-exclude]')
                            && !t.closest('[data-builder-exclude]').length
                            && !t.parent().is('body')
                            && (t.parents(container).length || t.is(container));
                    };

                    function makeSortables()
                    {
                        makeSortableRows();

                        var sortableDivs = $f('div').filter(':allowSortable');
                        makeSelectionSortable(sortableDivs);

                        var sortableLists = $f('ul').filter(':allowSortable');
                        makeSelectionSortable(sortableLists);

                        var sortableOrderedLists = $f('ol').filter(':allowSortable');
                        makeSelectionSortable(sortableOrderedLists);
                    }

                    makeSortables();

                    $(this).contents().find(container)
                    .droppable(
                    {
                        accept: $(".bcomponent"),
                        hoverClass: 'ui-highlight-drops',
                        greedy: true,
                        drop: function( e, t ) 
                        {
                            var d = t.draggable.clone(false);
                            d.uniqueId();

                            $(this).prepend(d);
                            $(this).parents('[data-component]').attr('data-builder-saveComponent', true);

                            if ($(this).is('[data-component]'))
                                $(this).attr('data-builder-saveComponent', true);

                            saveComponent(true);
                        }
                    });

                    overlay.draggable({
                        iframeFix: true,
                        // handle: '#overlay-move',
                        revert: 'invalid',
                        revertDuration: 0,
                        scroll: true,
                        zIndex: 1000000,
                        opacity: .4,
                        // refreshPositions: true,
                        helper: function()
                        {
                            return getOverlayAttachment().clone();
                        },
                        start: function()
                        {
                            var t = getOverlayAttachment();
                            overlayDisabled = true;
                            overlay.add(t).hide();
                        },
                        stop: function()
                        {
                            var t = getOverlayAttachment();
                            overlayDisabled = false;
                            overlay.add(t).show();
                        }
                    });

                    $f('body')
                    .on('focus', '[contenteditable]', function()
                    {
                        var $this = $f(this);
                        $this.data('before', $this.html());

                    return $this;
                    })
                    .on('blur', '[contenteditable]', function()
                    {
                        var $this = $f(this);
                        if ($this.data('before') !== $this.html()) {
                            $this.data('before', $this.html());
                            $this.trigger('change');
                        }
                        else
                            overlayDisabled = false;

                        return $this;
                    })
                    .on('keyup', '[contenteditable]', function()
                    {
                        var d = $f(this).text(),
                            s = (d.match(/([a-z]{1,10})([0-9]{1,2})?(\:)/g) || []).join('').split(':')[0],
                            v = d.split(':')[1],
                            validTags = ['h1', 'h2', 'h3', 'h4', 'h5', 'div', 'span', 'p', 'blockquote'];

                        if (s.length && d.indexOf(s) == 0 && $.inArray(s, validTags) !== -1)
                            $f(this).replaceWith($f('<' + s + ' />').text(v));
                    })
                    .on('change', '[contenteditable]', function()
                    {
                        toggleCK('off');
                    });

                    function toggleCK(s, t)
                    {
                        if (typeof s == 'undefined')
                        {
                            console.log('toggleCK( NO_ARG )');
                            return;
                        }

                        if (s == "on" && $f('[contenteditable]').length)
                            return;

                        if (s == "off" && !$f('[contenteditable]').length)
                            return;

                        var editors = $f('[contenteditable]');
                        if (editors.length)
                        {
                            editors.removeAttr('contenteditable');

                            for(name in fw.CKEDITOR.instances)
                                fw.CKEDITOR.instances[name].destroy();

                            $f('body').disableSelection();
                            overlayDisabled = false;

                            console.log('toggleCK( OFF );');

                            var p = editors.parents('[data-component]');
                            if (p.length) p.attr('data-builder-saveComponent', true);
                                saveComponent();
                            return;
                        }

                        if (typeof t == 'undefined')
                            return;

                        if (!t.length)
                            return;

                        console.log('toggleCK( ON );');

                        t.each(function( index )
                        {
                            var e = $f(this),
                                id = t.attr('id');

                            e.attr('contenteditable', true);
                            // fw.CKEDITOR.inline( id );
                        })
                        .first()
                        .focus();

                        hideOverlay();
                        overlayDisabled = true;
                        $f('body').enableSelection();
                    }

                    window.toggleCK = toggleCK;
                    window.hideOverlay = hideOverlay;
                    window.attachOverlay = attachOverlay;
                    window.getOverlayAttachment = getOverlayAttachment;
                    window.getSelectionMode = getSelectionMode;
                    window.getTemplate = getTemplate;
                    window.changeComponent = changeComponent;
                    window.saveComponent = saveComponent;
                    window.isExcluded = isExcluded;

                });

            }

            $scope.$watch($attrs.ngModel, function(newValue, oldValue){
                if (newValue)
                    apply();
            });
        }
    }
});