(function ($) {
    "use strict";

    $(function ()
    {
        if (typeof builder == 'undefined')
            return;

        window.builder_instance = new builder({
            "document": "#mp-layout-builder",
            "modal": "bootstrap"
        });

    });

})(jQuery);
