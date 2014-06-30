(function ($) {
    "use strict";

    $(function ()
    {
        var options_form = $('form.options-form'),
            panels_wrapper = $('.options-panels-wrapper');

        $('body').on('submit', 'form', function(e)
        {
            e.preventDefault();
            handle_save();
        });

        $('.btn-options-submit').on('click', function(){
            handle_save();
        });

        var dup = $('<span></span>').addClass('pull-right fa fa-files-o fa-fw duplicate-panel');

        var panel_selector = '.panel';
        if (panels_wrapper.is('.panel-group'))
            panels_wrapper.find('.accordion-toggle').prepend(dup);

        $('body').on('click', '.duplicate-panel', function(e)
        {
            e.preventDefault();
            e.stopPropagation();

            var panel_parent = $(this).closest(panel_selector),
                panel_parent_clone = panel_parent.clone(false),
                panel_parent_clone_id = panels_wrapper.find(panel_selector).length + 1;

            panel_parent.after(panel_parent_clone);
            if (panels_wrapper.is('.panel-group'))
            {
                panel_parent_clone_id = panel_parent_clone.find('.panel-body').attr('id') + panel_parent_clone_id;
                panel_parent_clone
                    .find('.panel-body').attr('id', panel_parent_clone_id)
                    .end()
                    .find('[data-toggle]').attr('href', '#' + panel_parent_clone_id)
                    .trigger('click');
            }
        });

        function handle_save()
        {
            options_form_save();
            panel_forms_save();
            parent.tb_remove();
        }

        function options_form_save()
        {
            var data_raw = parent.builder_instance.deserialize(options_form.serialize()),
                data_obj = { "data": data_raw },
                data_save = $.extend({}, parent.builder_instance.getOptions(), data_obj);

            parent.builder_instance.setOptions(parent.builder_instance.getOverlayAttachment(), data_save);
        }

        function panel_forms_save()
        {
            var options = parent.builder_instance.getOptions(),
                panels = [],
                panel_forms = $('form.options-panel-form');

            panel_forms.each(function(i, v)
            {
                var data_raw = parent.builder_instance.deserialize($(v).serialize()),
                    panel_clone = $.extend({}, options.panels[0]);

                panel_clone.data = data_raw;
                panels.push(panel_clone);
            });

            options.panels = panels;
            parent.builder_instance.setOptions(parent.builder_instance.getOverlayAttachment(), options);
        }
    });

})(jQuery);
