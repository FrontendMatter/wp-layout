(function ($) {
    "use strict";

    $(function ()
    {
        var f = $('form');
        f.on('submit', function(e)
        {
            e.preventDefault();
            var data = parent.builder_instance.deserialize(f.serialize());
            var options = $.extend({}, parent.builder_instance.getOptions(), data);
            parent.builder_instance.setOptions(parent.builder_instance.getOverlayAttachment(), options);
            parent.tb_remove();
        });
    });

})(jQuery);
