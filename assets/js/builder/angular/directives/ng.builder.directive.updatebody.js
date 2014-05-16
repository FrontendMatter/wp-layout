function loadScriptsSync(files, callback)
{
   $.getScript(files.shift(), files.length
       ? function(){loadScriptsSync(files, callback);}
       : callback
   );
}

App.directive('updateBody', function($timeout)
{
  return {
    require: '?ngModel',
    restrict: 'A',
    link: function(scope, element, attrs, ngModel)
    {
      if (!ngModel)
        return;

      function apply()
      {
        scope.$apply(function()
        {
            var html = element.clone().find('.demo-content');
            html = scope.cleanPlannerHTML(html);

            ngModel.$setViewValue(html);
        });
      }

      scope.$watch('template', function(newValue){
        if (newValue)
          $timeout(function(){
            makeSortables();
          });
      });

      $('.demo .placeholder-add').droppable({
        accept: '.bcomponent, #gallery-grid .row',
        drop: function (e,t)
        {
          var el = t.draggable.clone(false, false);

          if (el.is('.bcomponent'))
          {
            var row = $('#gallery-grid > .row:first').clone();
            row.find('[class*="col-"]').append(el);
            $('.demo-content').append(row);
          }
          else
            $('.demo-content').append(el);

          makeSortables();
          apply();
        }
      });

      $('.demo .placeholder-remove').droppable({
        accept: '.demo-content .bcomponent, .demo-content .row',
        drop: function (e,t)
        {
          t.draggable.remove();
        }
      }).disableSelection();

      function makeSortables()
      {
        $('.demo-content .row', element).sortable(
            {
                handle: ".bdrag-column",
                containment: "parent",
                axis: "x",
                items: "> .column",
                helper: 'clone',
                opacity: .5,
                tolerance: 'pointer',
                forcePlaceholderSize: true,
                forceHelperSize: true,
                stop: function(e, t)
                {
                  apply();
                }
            });

            $('.column:not(.ui-sortable)', element).sortable(
            {
                connectWith: ".column",
                helper: "clone",
                items: ".bcomponent",
                handle: ".bdrag-component",
                forcePlaceholderSize: true,
                forceHelperSize: true,
                tolerance: 'pointer',
                stop: function(e, t)
                {
                  apply();
                }
            });
      }

      $('.demo-content', element).sortable(
      {
          connectWith: ".column",
          opacity: .35,
          handle: ".bdrag-row",
          placeholder: "row row-placeholder",
          tolerance: 'pointer',
          forcePlaceholderSize: true,
          forceHelperSize: true,
          items: '.row',
          stop: function(e, t)
          {
            if (t.item.is('.label.bcomponent'))
              t.item.width(t.helper.width());

            makeSortables();
            apply();
            
          }
      });
    }
  }
});