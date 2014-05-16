App.directive('prettyhtml', function()
{
  return {
    restrict: 'A',
    link: function(scope, element, attrs)
    {
      scope.$watch(attrs.ngModel, function(newValue, oldValue) 
      {
        if (newValue != oldValue)
        {
          var html = newValue;
              html = html.replace(/(\n|\r|\t)/gm,"");
              html = beautify(html);

          element.text(html);
          prettyPrint();
        }
      });
    }
  }
});