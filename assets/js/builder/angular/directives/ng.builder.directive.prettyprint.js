App.directive('prettyprint', function()
{
  return {
    restrict: 'A',
    link: function(scope, element, attrs)
    {
      scope.$watch(attrs.ngModel, function(newValue, oldValue) 
      {
        if (newValue != oldValue)
        {
          prettyPrint();
        }
      });
    }
  }
});