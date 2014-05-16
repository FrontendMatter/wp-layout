App.directive('uiCodemirrorRefresh', function(){
    return {
        restrict: 'A',
        require: '?ngModel',
        link: function(scope, element, attrs, ngModel)
        {
            function apply()
            {
                scope.$apply(function()
                {
                    ngModel.$setViewValue(!ngModel.$viewValue);
                });
            }

            element.on('shown.bs.tab', function(){
                apply();
            });
        }
    }
});