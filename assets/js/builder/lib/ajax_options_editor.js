(function ($) {
    "use strict";

    $(document).on('init.builder', function(e, builder_instance)
    {
        var container = builder_instance.modal == 'bootstrap' ? builder_instance.modals.options : $('body');

        function handle_form_submit()
        {
            container.on('submit', 'form', function(e)
            {
                e.preventDefault();
                handle_save();
            });

            container.on('click', '.btn-options-submit', function(){
                handle_save();
            });
        }

        function handle_duplicate()
        {
            var dup = $('<span></span>').addClass('pull-right fa fa-files-o fa-fw duplicate-panel'),
                panels_wrapper = container.find('.options-panels-wrapper');

            var panel_selector = '.panel';
            if (panels_wrapper.is('.panel-group'))
                panels_wrapper.find('.accordion-toggle').prepend(dup);

            container.off('click', '.duplicate-panel');
            container.on('click', '.duplicate-panel', function(e)
            {
                e.preventDefault();
                e.stopPropagation();

                var panel_parent = $(this).parents(panel_selector).first(),
                    panel_parent_clone = panel_parent.clone(false, false),
                    panel_parent_clone_id = panels_wrapper.find(panel_selector).length + 1;

                panel_parent.after(panel_parent_clone);
                if (panels_wrapper.is('.panel-group'))
                {
                    panel_parent_clone_id = panel_parent_clone.find('.panel-body').attr('id') + panel_parent_clone_id;
                    panel_parent_clone
                        .find('.panel-body').attr('id', panel_parent_clone_id)
                        .end()
                        .find('[data-toggle]').attr('href', '#' + panel_parent_clone_id);
                }
            });
        }

        function handle_save()
        {
            options_form_save();
            panel_forms_save();

            // force reload after saving
            builder_instance.scope.page.reload = true;
            builder_instance.closeOptionsModal();
        }

        function options_form_save()
        {
            var options_form = container.find('.options-form'),
                data_raw = builder_instance.deserialize(options_form.find(':input').serialize()),
                data_obj = { "data": data_raw },
                data_save = $.extend({}, builder_instance.getOptions(), data_obj);

            builder_instance.setOptions(builder_instance.getOverlayAttachment(), data_save);
        }

        function panel_forms_save()
        {
            var options = builder_instance.getOptions(),
                panels = [],
                panel_forms = $('.options-panel-form');

            panel_forms.each(function(i, v)
            {
                var data_raw = builder_instance.deserialize($(v).find(':input').serialize()),
                    panel_clone = $.extend({}, options.panels[0]);

                panel_clone.data = data_raw;
                panels.push(panel_clone);
            });

            options.panels = panels;
            builder_instance.setOptions(builder_instance.getOverlayAttachment(), options);
        }

        function init()
        {
            handle_form_submit();
            handle_duplicate();
        }

        if (builder_instance.modal == 'thickbox')
            init();

        if (builder_instance.modal == 'bootstrap')
        {
            $('body').on('loaded.bs.modal', container.selector, function(){
                init();
            });
        }
    });

})(jQuery);
