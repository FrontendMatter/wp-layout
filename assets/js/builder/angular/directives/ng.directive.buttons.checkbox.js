App.directive('buttonsCheckbox', function($timeout) {
    return {
        require: '?ngModel',
        restrict: 'A',
        link: function($scope, element, attrs, ctrl)
        {
            element.bind('change', function()
            {
                var checked = element.prop('checked');

                $timeout(function()
                {
                    ctrl.$setViewValue(checked);
                    $scope.$apply();
                });

            });
        }
    }
});

App.directive('buttonCheckbox', function($timeout) {
    return {
        require: '?ngModel',
        restrict: 'A',
        link: function($scope, element, attrs, ctrl)
        {
            $scope.displayPageOptions = false;
            $scope.$watch('displayPageOptions', function(n,o)
            {
                if (n === o)
                    return;

                if (n === true)
                    element.addClass('active');
                else
                    element.removeClass('active');

                element.trigger('blur');
            });
        }
    }
});