App.directive('tree', function()
{
    return {
        restrict: 'E',
        replace: true,
        scope: {
            collection: '=',
            search: '='
        },
        template: '<ul class="unstyled row">'
            + '   <tree-item ng-repeat="item in collection | filter:search" item="item"></tree-item>'
            + '</ul>'
    }
});

App.directive('draggableTreeItem', function()
{
    return {
        restrict:'A',
        link: function(scope, element, attrs) {
            element.draggable(
            {
                helper: function()
                {
                    return element.clone()
                        .width(element.width())
                        .height(element.outerHeight())
                        .css('lineHeight', element.height() + 'px');
                },
                appendTo: element.closest('.bootstrap'),
                forceHelperSize: true,
                forcePlaceholderSize: true,
                zIndex: 2,
                iframeFix: true
            });
        }
    };
});

App.directive('treeItem', function($compile)
{
    return {
        restrict: 'E',
        replace: true,
        scope: {
            item: '='
        },
        template:
              '<li class="col-md-6">'
                + '<span ng-show="item.value | isArray" class="label label-primary inline-block">//item.key//</span>'
                + '<ul class="unstyled" ng-hide="item.value | isArray">'
                    + '<li ng-show="item.views"><h4>//item.key//</h4></li>'
                    + '<li ng-repeat="view in item.views">'
                        + '<div class="component bcomponent" data-component="//view.component.id//" data-view="//view.component//" data-options="//view.options//" draggable-tree-item>'
                            + '<div class="media">'
                                + '<span class="fa fa-fw pull-left //view.component.icon  || \'fa-2x fa-windows\'//"></span>'
                                + '<div class="media-body">'
                                    + '<h5>//view.component.label//</h5>'
                                    + '<p class="text-muted"><small>//view.component.description//</small></p>'
                                + '</div>'
                            + '</div>'
                        + '</div>'
                    + '</li>'
                + '</ul>'
            + '</li>',
        link: function(scope, element, attrs) {
            if (angular.isArray(scope.item.value))
            {
                element.append('<tree collection="item.value"></tree>');
                $compile(element.contents())(scope);
            }
        }
    }
});