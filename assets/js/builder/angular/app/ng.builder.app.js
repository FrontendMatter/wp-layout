var App = angular.module('App', ['ui.codemirror', 'ngAnimate']);

App.config(function($interpolateProvider)
{
    $interpolateProvider.startSymbol('//');
    $interpolateProvider.endSymbol('//');
});

function AppCtrl($scope, $http, $timeout)
{
    $scope.codemirrorOptions = {
        lineWrapping : true,
        lineNumbers: true,
        // readOnly: 'nocursor',
        indentWithTabs: true,
        mode: 'mustache',
        extraKeys: {
            "Cmd-S": function (instance)
            {
                $scope.handleKeySave();
                return false;
            }
        },
        onLoad: function(_editor)
        {
            // Editor part
            var _doc = _editor.getDoc();
            _editor.focus();
        }
    };

    $scope.page = {
        id: null,
        template: null,
        options: false,
        loading: false,
        saving: false,
        clipboard: null
    };
    $scope.toggleCodeEditor = false;
    $scope.toggleOptionsEditor = false;
    $scope.iframeLoaded = false;

    $scope.resetSearchValue = function()
    {
        $scope.search = '';
    };

    $scope.handleKeySave = function()
    {
        if ($scope.saveComponent || $scope.page.saving || $scope.page.loading)
            return;

        if ($scope.toggleCodeEditor)
            $scope.codeEditorSave();
    };

    $scope.codeEditorSave = function()
    {
        var t = builder_instance.getOverlayAttachment(),
            c = $scope.bodyEditor,
            $f = builder_instance.$,
            reload = false;

        t = t.length ? t : $f(builder_instance.container);

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
                if (t.is(builder_instance.container))
                {
                    var o = {
                        id: $scope.page.id,
                        template: c,
                        reload: true
                    };

                    $scope.page.saving = o;
                    $scope.savePageRequest(o);
                    return;
                }
                else
                {
                    var fc = $f(c);
                    t = t.replaceWith(fc);

                    fc.uniqueId();
                    builder_instance.attachOverlay(fc);
                }
            }
        }

        var tt = t.html(),
            hasTags = tt.match(/\{\{(.*)\}\}/gi) !== null;

        reload = reload ? true : hasTags;

        builder_instance.changeComponent();
        builder_instance.saveComponent(reload);
    };

    $scope.makeTemplate = function(html, outer)
    {
        return builder_instance.makeTemplate(html, outer);
    };

    $scope.selectBreadcrumb = function(id)
    {
        return builder_instance.selectBreadcrumb(id);
    };

    $scope.$watch('displayComponents', function(n,o)
    {
        if (n!==o)
        {
            if (n==true)
            {
                tb_show('', '#TB_inline?width=600&height=550&inlineId=builder-components');
                jQuery('#TB_window').on("tb_unload", function(e)
                {
                    jQuery('[name="displayComponents"]').parent().click();
                });
            }
        }
    });

    $scope.getTemplate = function(id)
    {
        $scope.page.loading = true;
        $scope.page.id = id;

        var url = ajaxurl + '?action=builder_get_page&id=' + id;

        $http({
            method: 'POST',
            url: url,
            headers: {'Content-Type': 'application/x-www-form-urlencoded'}
        })
            .success(function(response, status)
            {
                if (response == -1)
                    return alert('An error occurred while retrieving the template');

                if (typeof response.success !== 'undefined')
                {
                    if (response.success !== true)
                        return alert(response.data);
                }

                $scope.page.template_raw = response.data;
            })
            .error(function(data, status)
            {

            });
    };

    $scope.$watch('page.template_raw', function(newValue, oldValue)
    {
        if (newValue == '')
        {
            builder_instance.$(builder_instance.container).empty();
            $scope.page.loading = false;
        }

        if (newValue !== oldValue && newValue !== '')
            $scope.parseTemplate();
    });

    $scope.parseTemplate = function()
    {
        $scope.code = null;
        $scope.response = null;
        $scope.page.loading = true;

        $http({
            method: 'POST',
            url: ajaxurl + '?action=builder_parse_page',
            data: jQuery.param({ 'template': $scope.page.template_raw }),
            headers: {'Content-Type': 'application/x-www-form-urlencoded'}
        })
            .success(function(response, status)
            {
                $scope.status = status;
                $scope.page.loading = false;

                if (response == -1)
                    return alert('An error occurred while parsing the template');

                if (typeof response.success !== 'undefined')
                {
                    if (response.success !== true)
                        return alert(response.data);
                }

                $scope.page.template = response.data.content;
                $scope.page.options = response.data.options;
            })
            .error(function(data, status)
            {
                $scope.page.template = data || "Request failed";
                $scope.page.loading = false;
                $scope.status = status;
            });
    };

    $scope.$watch('page.template', function(newValue, oldValue)
    {
        if (newValue !== oldValue)
        {
            builder_instance.$(builder_instance.container).html(newValue);
            builder_instance.applyComponent(false);
        }
    });

    $scope.saveComponentRequest = function(saveData)
    {
        saveData = jQuery.extend({}, saveData, {
            'post_id': builder_instance.locationSearchObj().post
        });

        $http({
            method: 'POST',
            url: ajaxurl + '?action=builder_save_component',
            data: jQuery.param(saveData),
            headers: {'Content-Type': 'application/x-www-form-urlencoded'}
        })
            .success(function(data, status)
            {
                $scope.saveComponent = false;
            })
            .error(function(data, status)
            {
                $scope.saveComponent = false;
            });
    };

    $scope.$watch('toggleCodeEditor', function(newValue, oldValue)
    {
        if (newValue !== oldValue)
        {
            if (newValue !== false)
                builder_instance.updateEditor();
            else
                jQuery('#toggle-code-editor').parent().removeClass('active');
        }
    });

    $scope.$watch('saveComponent', function(newValue, oldValue)
    {
        if (newValue !== oldValue && newValue !== false)
            $scope.saveComponentRequest(newValue);
    });

    $scope.$watch('page.saving', function(newValue, oldValue)
    {
        /*if (newValue !== oldValue)
         if (newValue !== false)
         toggleCK('off');*/
    });

    $scope.savePageRequest = function(saveData)
    {
        if ($scope.page.template == null)
            $scope.page.template = saveData.template;

        $http({
            method: 'POST',
            url: ajaxurl + '?action=builder_save_page',
            data: jQuery.param(saveData),
            headers: {'Content-Type': 'application/x-www-form-urlencoded'}
        })
            .success(function(data, status)
            {
                $scope.page.saving = false;

                if (saveData.reload === true)
                    $scope.getTemplate($scope.page.id);
            })
            .error(function(data, status)
            {
                $scope.page.saving = false;
            });
    };

    $scope.getTemplate('426123e1-11c3-d9e4-d057-4eb7ce6ecfa0');
}

function ComponentsCtrl($scope)
{
    $scope.components = [
        {
            "key": "Grid",
            "views": [
                {
                    "component": {
                        "id": "grid-1",
                        "label": "1 column",
                        "description": "Lorem ipsum dolor sit amet, consectetur adipisicing elit. Deserunt, ipsum?",
                        "icon": "fa-2x fa-th-large"
                    }
                },
                {
                    "component": {
                        "id": "grid-2",
                        "label": "2 columns",
                        "description": "Lorem ipsum dolor sit amet, consectetur adipisicing elit. Deserunt, ipsum?",
                        "icon": "fa-2x fa-th-large"
                    }
                },
                {
                    "component": {
                        "id": "grid-3",
                        "label": "3 columns",
                        "description": "Lorem ipsum dolor sit amet, consectetur adipisicing elit. Deserunt, ipsum?",
                        "icon": "fa-2x fa-th-large"
                    }
                },
                {
                    "component": {
                        "id": "grid-4",
                        "label": "4 columns",
                        "description": "Lorem ipsum dolor sit amet, consectetur adipisicing elit. Deserunt, ipsum?",
                        "icon": "fa-2x fa-th-large"
                    }
                }
            ]
        },
        {
            "key": "Sidebars",
            "views": [
                {
                    "component": {
                        "id": "register-sidebar",
                        "label": "New Widget Area",
                        "description": "Lorem ipsum dolor sit amet, consectetur adipisicing elit. Deserunt, ipsum?"
                    },
                    "options": {
                        "id": "1",
                        "type": "shortcode",
                        "shortcode_atts": ["id"],
                        "form": [
                            {
                                "name": "id",
                                "label": "Sidebar ID",
                                "type": "input"
                            }
                        ]
                    }
                },
                {
                    "component": {
                        "id": "display-sidebar",
                        "label": "Existing Sidebar",
                        "description": "Lorem ipsum dolor sit amet, consectetur adipisicing elit. Deserunt, ipsum?"
                    },
                    "options": {
                        "id": "my-sidebar",
                        "type": "shortcode",
                        "shortcode_atts": ["id"],
                        "form": [
                            {
                                "name": "id",
                                "label": "Sidebar ID",
                                "type": "input"
                            }
                        ]
                    }
                }
            ]
        },
        {
            "key": "Post",
            "views": [
                {
                    "component": {
                        "id": "post-title",
                        "label": "The post title",
                        "description": "Lorem ipsum dolor sit amet, consectetur adipisicing elit. Deserunt, ipsum?",
                        "icon": "fa-2x fa-file-text-o"
                    },
                    "options": { "type": "shortcode" }
                },
                {
                    "component": {
                        "id": "post-content",
                        "label": "The post content",
                        "description": "Lorem ipsum dolor sit amet, consectetur adipisicing elit. Deserunt, ipsum?",
                        "icon": "fa-2x fa-file-text-o"
                    },
                    "options": { "type": "shortcode" }
                }
            ]
        }
    ];

    // { "key": "yey", "value": [{ "key": "blah", "value": "blah", "views": {"php.ini": "ini"}}] }
    // [{"key":"common","value": [{ "key":"forms", "value": [{"key":"editors","value":[{"key":"wysihtml5","value":"wysihtml5","views":{"php.wysihtml5":"wysihtml5"}}]}
}