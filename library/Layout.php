<?php namespace Mosaicpro\WP\Plugins\Layout;

use Mosaicpro\HtmlGenerators\Accordion\Accordion;
use Mosaicpro\HtmlGenerators\Button\Button;
use Mosaicpro\HtmlGenerators\ButtonGroup\ButtonGroup;
use Mosaicpro\HtmlGenerators\ButtonGroup\ButtonToolbar;
use Mosaicpro\WpCore\FormBuilder;
use Mosaicpro\WpCore\MetaBox;
use Mosaicpro\WpCore\PluginGeneric;
use Mosaicpro\WpCore\PostType;
use Mosaicpro\WpCore\ThickBox;

/**
 * Class Layout
 * @package Mosaicpro\WP\Plugins\Layout
 */
class Layout extends PluginGeneric
{
    /**
     * Holds a Layout instance
     * @var
     */
    protected static $instance;

    /**
     * Initialize the plugin
     */
    public static function init()
    {
        $instance = self::getInstance();

        // i18n
        $instance->loadTextDomain();

        // Initialize Layout Templates
        $instance->initTemplates();

        // Load Plugin Templates into the current Theme
        $instance->plugin->initPluginTemplates();

        // Initialize Layout Admin
        $instance->initAdmin();

        // Initialize Shared resources
        $instance->initShared();

        // Initialize Layout Shortcodes
        $instance->initShortcodes();
    }

    /**
     * Get a Singleton instance of Layout
     * @return static
     */
    public static function getInstance()
    {
        if (is_null(self::$instance))
        {
            self::$instance = new static();
        }

        return self::$instance;
    }

    /**
     * Activate the plugin
     */
    public static function activate()
    {
        $instance = self::getInstance();
        $instance->post_types();
        flush_rewrite_rules();
    }

    /**
     * Initialize Admin only resources
     * @return bool
     */
    private function initAdmin()
    {
        if (!is_admin()) return false;

        $this->enqueueAdminAssets();
        $this->metaboxes();
        $this->handle_options_editor();
        $this->handle_save_page();
        $this->handle_get_page();
        $this->handle_parse_page();
        $this->handle_save_component();
    }

    /**
     * Initialize Shared Resources
     */
    private function initShared()
    {
        $this->post_types();
    }

    /**
     * Initialize Layout Templates
     */
    private function initTemplates()
    {
        // Display Custom page templates in WP Admin Post screen
        add_action('init', function()
        {
            $this->plugin->initPostTemplates(get_post_types(['public'=>true]));
        });

        // Set Custom page templates
        $this->plugin->setPageTemplates([
            $this->getPrefix('layout') . '-global.php' => $this->__('Builder Layout Template')
        ]);
    }

    /**
     * Create the layout post types
     */
    private function post_types()
    {
        PostType::make('page', $this->prefix)
            ->setOptions(['show_ui' => false, 'supports' => false])
            ->register();

        PostType::make('component', $this->prefix)
            ->setOptions(['show_ui' => false, 'supports' => false])
            ->register();
    }

    /**
     * Create the Layout metaboxes
     */
    private function metaboxes()
    {
        // Layout Meta Box
        MetaBox::make($this->prefix, 'layout', $this->__('Layout'))
            ->setPostType(null)
            ->setDisplay($this->getMetaboxDisplay())
            ->setPriority('high')
            ->setContext('normal')
            ->register();
    }

    /**
     * Initialize Sidebar Shortcodes
     */
    private function initShortcodes()
    {
        add_action('init', function()
        {
            $shortcodes = [
                'Post_Title',
                'Post_Content'
            ];

            foreach ($shortcodes as $sc)
            {
                require_once realpath(__DIR__) . '/Shortcodes/' . $sc . '.php';
                forward_static_call([__NAMESPACE__ . '\\' . $sc . '_Shortcode', 'init']);
            }
        });
    }

    /**
     * Load the required admin assets
     */
    private function enqueueAdminAssets()
    {
        add_action('admin_footer', function()
        {
            echo $this->getBuilderOverlay();
        });

        add_action('admin_enqueue_scripts', function()
        {
            wp_enqueue_style('mp-layout-admin', plugin_dir_url(plugin_dir_path(__FILE__)) . 'assets/css/layout-admin.css');

            // Keymaster
            wp_enqueue_script('mp-keymaster', plugin_dir_url(plugin_dir_path(__FILE__)) . 'assets/js/builder/lib/keymaster/keymaster.js', ['jquery'], false, true);

            // Angular libraries
            wp_enqueue_script('mp-angular', plugin_dir_url(plugin_dir_path(__FILE__)) . 'assets/js/builder/lib/angular/angular.min.js', ['jquery'], false);
            wp_enqueue_script('mp-angular-animate', plugin_dir_url(plugin_dir_path(__FILE__)) . 'assets/js/builder/lib/angular/angular-animate.js', ['mp-angular'], false);

            // Beautify HTML Dependency
            wp_enqueue_script('mp-beautify', plugin_dir_url(plugin_dir_path(__FILE__)) . 'assets/js/builder/lib/beautify/beautify.js', ['jquery'], false);
            wp_enqueue_script('mp-beautify-html', plugin_dir_url(plugin_dir_path(__FILE__)) . 'assets/js/builder/lib/beautify/beautify-html.js', ['mp-beautify'], false);

            // CodeMirror
            wp_enqueue_style('mp-codemirror', plugin_dir_url(plugin_dir_path(__FILE__)) . 'assets/js/builder/lib/codemirror/lib/codemirror.css');
            wp_enqueue_script('mp-codemirror', plugin_dir_url(plugin_dir_path(__FILE__)) . 'assets/js/builder/lib/codemirror/lib/codemirror.js', ['mp-angular'], false, true);
            wp_enqueue_script('mp-codemirror-ng', plugin_dir_url(plugin_dir_path(__FILE__)) . 'assets/js/builder/angular/directives/ui-codemirror.js', ['mp-codemirror'], false, true);
            wp_enqueue_script('mp-codemirror-xml', plugin_dir_url(plugin_dir_path(__FILE__)) . 'assets/js/builder/lib/codemirror/mode/xml/xml.js', ['mp-codemirror'], false, true);
            wp_enqueue_script('mp-codemirror-overlay', plugin_dir_url(plugin_dir_path(__FILE__)) . 'assets/js/builder/lib/codemirror/addon/mode/overlay.js', ['mp-codemirror'], false, true);
            wp_enqueue_script('mp-codemirror-mustache', plugin_dir_url(plugin_dir_path(__FILE__)) . 'assets/js/builder/lib/codemirror.mode.mustache.js', ['mp-codemirror'], false, true);

            // Builder Library
            wp_enqueue_script('mp-builder', plugin_dir_url(plugin_dir_path(__FILE__)) . 'assets/js/builder/lib/builder.js', ['mp-keymaster', 'mp-angular', 'mp-angular-animate'], false, true);

            // Builder Angular App
            wp_enqueue_script('mp-builder-ng-app', plugin_dir_url(plugin_dir_path(__FILE__)) . 'assets/js/builder/angular/app/ng.builder.app.js', ['mp-angular'], false, true);

            // Button Checkbox Toggle Directive
            wp_enqueue_script('mp-builder-ng-directive-buttons-checkbox', plugin_dir_url(plugin_dir_path(__FILE__)) . 'assets/js/builder/angular/directives/ng.directive.buttons.checkbox.js', ['mp-angular'], false, true);

            // CoreMirror Refresh Directive
            wp_enqueue_script('mp-codemirror-refresh', plugin_dir_url(plugin_dir_path(__FILE__)) . 'assets/js/builder/angular/directives/ui-codemirror-refresh.js', ['mp-codemirror'], false, true);

            // Common Filters
            wp_enqueue_script('mp-ng-filter-isarray', plugin_dir_url(plugin_dir_path(__FILE__)) . 'assets/js/builder/angular/filters/ng.filter.isarray.js', ['mp-angular'], false, true);

            // Components directive
            wp_enqueue_script('mp-builder-components', plugin_dir_url(plugin_dir_path(__FILE__)) . 'assets/js/builder/angular/directives/ng.builder.directive.components.js', ['mp-angular'], false, true);

            // Initialize Builder
            wp_enqueue_script('mp-builder-init', plugin_dir_url(plugin_dir_path(__FILE__)) . 'assets/js/layout-admin.js', ['mp-builder'], false, true);

            // jQuery UI Droppable
            wp_enqueue_script('jquery-ui-droppable');
        });
    }

    /**
     * Builder's MetaBox Content
     * @return array
     */
    private function getMetaboxDisplay()
    {
        $formbuilder = new FormBuilder();
        return [
            '<div>',

                ButtonToolbar::make()
                    ->add(
                        ButtonGroup::make()
                            ->isSm()
                            ->add(Button::regular('<i class="fa fa-fw fa-folder-open"></i> Load')->addClass('mp-layout-add-row'))
                            ->add(Button::regular('<i class="fa fa-fw fa-save"></i> Save as ..')->addAttributes([
                                'ng-click' => 'displayPageOptions=!displayPageOptions',
                                'button-checkbox' => '',
                            ])->isButton())
                    )
                    ->add(
                        $formbuilder->get_checkbox_buttons('displayComponents', null, false,
                            ['true' => '<i class="fa fa-fw fa-windows"></i> Components'],
                            ['buttons-checkbox' => '', 'ng-model' => 'displayComponents'])
                    ),

                $this->getBuilderPage(),
                $this->getBuilderComponents(),
                '<div id="mp-layout-builder" ng-class="{ loading: page.loading || page.saving }"></div>',
                $this->getBuilderFooter(),
            '</div>'
        ];
    }

    /**
     * Builder's Page Options UI
     * @return string
     */
    private function getBuilderPage()
    {
        $formbuilder = new FormBuilder();
        $content =
            '<div ng-show="displayPageOptions == true" class="animate-show ng-hide">
                <hr/>
                ' . $formbuilder->get_input('page.id', 'Page ID', '//page.id//') . '
            </div>';

        return $content;
    }

    /**
     * The Builder's Components UI
     * @return mixed
     */
    private function getBuilderComponents()
    {
        $content =
            '<div id="gallery-components" class="bootstrap" ng-controller="ComponentsCtrl">
                <tree collection="components" search="search"></tree>
            </div>';

        $iframe = ThickBox::register_inline('builder-components', false, $content)->render();
        return $iframe;
    }

    /**
     * The Builder's Footer UI
     * @return string
     */
    private function getBuilderFooter()
    {
        $content =
            '<div id="builder-menu-bottom">' .
                $this->getBuilderBreadcrumb() .
				$this->getBuilderToggleCodeEditor() .
			'</div>' .
            $this->getBuilderCodeEditor();

        return $content;
    }

    /**
     * Save a Builder page template to the DB
     */
    private function handle_save_page()
    {
        $action = 'wp_ajax_builder_save_page';
        add_action($action, function()
        {
            $id = !empty($_REQUEST['id']) ? $_REQUEST['id'] : false;
            $is_post = !empty($_POST);

            if ($is_post)
            {
                // @todo: verify nonce
                // check_ajax_referer( $this->prefix . '_' . $related_item . '_nonce', 'nonce' );
                // if ( false ) wp_send_json_error( 'Security error' );

                $template = $this->getLayoutTemplate($id);
                if ($template)
                    $related_save = ['ID' => $template['post_id']];
                else
                {
                    $related_save = (array) @get_default_post_to_edit($this->getPrefix('page'), true);
                    update_post_meta($related_save['ID'], 'page_id', $id);
                }

                $related_save['post_status'] = 'publish';
                if (isset($_POST['template'])) $related_save['post_content'] = $_POST['template'];
                $saved = @wp_update_post($related_save, true);

                if (is_a($saved, 'WP_Error')) wp_send_json_error($saved->get_error_messages());
                wp_send_json_success();
                die();
            }
        });
    }

    /**
     * Get a builder page template from the DB
     */
    private function handle_get_page()
    {
        $action = 'wp_ajax_builder_get_page';
        add_action($action, function()
        {
            $id = !empty($_REQUEST['id']) ? $_REQUEST['id'] : false;
            $is_post = isset($_POST);

            if ($is_post)
            {
                // @todo: verify nonce
                // check_ajax_referer( $this->prefix . '_' . $related_item . '_nonce', 'nonce' );
                // if ( false ) wp_send_json_error( 'Security error' );

                $template = $this->getLayoutTemplate($id);
                if ($template)
                    wp_send_json_success($template['template']);

                wp_send_json_error( 'Not found' );
                die();
            }
        });
    }

    /**
     * Parse a builder template for special tags and return builder markup & component options
     */
    private function handle_parse_page()
    {
        $action = 'wp_ajax_builder_parse_page';
        add_action($action, function()
        {
            $template = !empty($_REQUEST['template']) ? $_REQUEST['template'] : false;
            $is_post = !empty($_POST);

            if ($is_post)
            {
                // @todo: verify nonce
                // check_ajax_referer( $this->prefix . '_' . $related_item . '_nonce', 'nonce' );
                // if ( false ) wp_send_json_error( 'Security error' );

                $template = stripslashes($template);
                $template = $this->parseTemplateTags($template);

                wp_send_json_success( $template );
                die();
            }
        });
    }

    /**
     * Save a component
     */
    private function handle_save_component()
    {
        $action = 'wp_ajax_builder_save_component';
        add_action($action, function()
        {
            $id = !empty($_REQUEST['id']) ? $_REQUEST['id'] : false;
            $is_post = !empty($_POST);

            if ($is_post)
            {
                // @todo: verify nonce
                // check_ajax_referer( $this->prefix . '_' . $related_item . '_nonce', 'nonce' );
                // if ( false ) wp_send_json_error( 'Security error' );

                $component = $this->getComponent($id);
                if ($component)
                {
                    $post_id = $component['post_id'];
                    $related_save = ['ID' => $post_id];
                }
                else
                {
                    $related_save = (array) @get_default_post_to_edit($this->getPrefix('component'), true);
                    $post_id = $related_save['ID'];
                    update_post_meta($post_id, 'component_id', $id);
                }

                $related_save['post_status'] = 'publish';
                $saved = @wp_update_post($related_save, true);

                if (is_a($saved, 'WP_Error'))
                    wp_send_json_error($saved->get_error_messages());

                if (!empty($_POST['options']))
                    update_post_meta($post_id, 'options', $_POST['options']);

                if (!empty($_POST['template']))
                    update_post_meta($post_id, 'template', $_POST['template']);

                wp_send_json_success();
                die();
            }
        });
    }

    /**
     * Display and handle options forms for components
     */
    private function handle_options_editor()
    {
        $action = 'wp_ajax_builder_editor';
        add_action($action, function()
        {
            $options = $_REQUEST['options'];
            $form = isset($options) && !empty($options['form']) ? $options['form'] : false;
            $panels = isset($options) && !empty($options['panels']) ? $options['panels'] : false;

            wp_enqueue_script('ajax_options_editor', plugin_dir_url(__DIR__) . 'assets/js/builder/lib/ajax_options_editor.js', ['jquery'], '1.0', true);

            ThickBox::getHeader();
            ?>
            <div class="col-md-12">
                <h3>Edit Options</h3>
            </div>
            <hr/>
            <div class="col-md-12">

                <?php
                if ($form)
                {
                    ?>
                    <form action="" method="post" class="options-form">
                    <?php
                    foreach($form as $formControl)
                        $this->makeFormControl($formControl, $options['data'][$formControl['name']]);
                    ?>
                    </form>
                    <?php
                }

                if ($panels)
                {
                    echo "<hr/>";
                    $accordion = Accordion::make();
                    foreach ($panels as $panel)
                    {
                        $panel_form = isset($panel['form']) && !empty($panel['form']) ? $panel['form'] : false;
                        if (!$panel_form) continue;

                        ob_start();
                        ?>
                        <form action="" method="post" class="options-panel-form">
                        <?php
                        foreach ($panel_form as $panel_form_control)
                            $this->makeFormControl($panel_form_control, $panel['data'][$panel_form_control['name']]);
                        ?>
                        </form>
                        <?php
                        $accordion_body = ob_get_clean();
                        $accordion_heading = !empty($panel['label']) ? $panel['label'] : $panel['method'];
                        $accordion->addAccordion($accordion_heading, $accordion_body);
                    }
                    echo $accordion->addClass('options-panels-wrapper');
                }
                ?>

                <hr/>
                <button type="button" class="btn btn-success btn-options-submit">Save</button>

            </div>
            <?php
            ThickBox::getFooter();
            die();
        });
    }

    private function makeFormControl($formControl, $value)
    {
        $formType = isset($formControl['type']) ? $formControl['type'] : "input";
        switch($formType)
        {
            default:
            case 'input':
            case 'textarea':
                FormBuilder::$formType($formControl['name'], $formControl['label'], $value);
                break;

            case 'select':
                FormBuilder::$formType($formControl['name'], $formControl['label'], $value, $formControl['values']);
                break;

            case 'select_range':
                FormBuilder::$formType($formControl['name'], $formControl['label'], $value, $formControl['range'], $formControl['format']);
                break;

            case 'checkbox_buttons':
            case 'radio_buttons':
                FormBuilder::$formType($formControl['name'], $formControl['label'], $value, $formControl['values']);
                break;
        }
    }

    /**
     * The Builder Code Editor UI
     * @return string
     */
    private function getBuilderCodeEditor()
    {
        $content =
            '<div id="builder-editor" ng-show="!saveComponent && !page.loading && !page.saving && toggleCodeEditor == true" class="animate-show ng-hide">
				<textarea ng-model="bodyEditor" ui-codemirror="codemirrorOptions" ui-refresh="toggleCodeEditor" id="" class="form-control"></textarea>
				<div class="btn-group btn-group-xs pull-right">
					<a class="btn btn-primary" ng-click="codeEditorSave()" ng-show="bodyEditor">Save</a>
					<a class="btn btn-inverse" ng-click="toggleCodeEditor=false">Close</a>
				</div>
				<div class="clearfix"></div>
			</div>';

        return $content;
    }

    /**
     * Toggle Code Editor UI
     * @return string
     */
    private function getBuilderToggleCodeEditor()
    {
        $content =
            '<div class="btn-group btn-group-xs ng-hide" data-toggle="buttons" ng-show="page.template && !page.loading">
                <label class="btn btn-inverse">
                    <input type="checkbox" name="codeEditor" buttons-checkbox ng-model="toggleCodeEditor" id="toggle-code-editor"> Code Editor <i class="fa fa-code"></i>
                </label>
            </div>';

        return $content;
    }

    /**
     * The Builder Breadcrumb UI
     * @return string
     */
    private function getBuilderBreadcrumb()
    {
        $content =
            '<div ng-show="breadcrumb">
                <ul id="builder-breadcrumb" class="breadcrumb">
                    <li ng-repeat="item in breadcrumb"><a ng-click="selectBreadcrumb(item.id)">//item.name//</a></li>
                    <!-- <li class="divider" ng-repeat-end></li> -->
                </ul>
                <hr/>
            </div>';

        return $content;
    }

    /**
     * The Builder Overlays UI
     * @return string
     */
    private function getBuilderOverlay()
    {
        $contentDataOverlay =
            '<div class="bootstrap ng-hide" ng-show="!page.saving && !page.loading && page.template">
                <div id="overlay-hover">
                    <span id="overlay-label">Hover Overlay</span>
                </div>
                <div id="overlay">
                    <div id="overlay-menu">
                        <div class="btn-group btn-group-xs">
                            <span class="btn btn-inverse" id="overlay-move"><i class="fa fa-arrows"></i></span>
                            <span class="btn btn-primary" id="overlay-edit-options"><i class="fa fa-pencil"></i></span>
                            <span class="btn btn-danger deleteElement"><i class="fa fa-times"></i></span>
                        </div>
                    </div>
                    <div class="btn-group btn-group-xs dropdown" id="overlay-menu-right">
                          <span type="button" class="btn btn-inverse dropdown-toggle" data-toggle="dropdown">
                            <i class="fa fa-cog"></i>
                          </span>
                          <ul class="dropdown-menu pull-right" role="menu">
                            <li><a href="#" id="closeOverlay"><span class="pull-right strong">(ESC)</span>Close</a></li>
                            <li><a href="#" id="selectAll"><span class="pull-right strong">(&#8984;+A)</span>Toggle selection</a></li>
                            <li class="divider">Edit</li>
                            <li><a href="#" id="toggleOptionsEditor"><span class="pull-right strong">(&#8984;+O)</span>Edit options</a></li>
                            <li><a href="#" id="toggleCodeEditor"><span class="pull-right strong">(&#8984;+E)</span>Code edit</a></li>
                            <li><a href="#" id="cloneElement"><span class="pull-right strong">(&#8984;+D)</span>Duplicate</a></li>
                            <li><a href="#" class="deleteElement"><span class="pull-right strong">(&#8984;+&#8592;, DEL)</span>Remove</a></li>
                          </ul>
                    </div>
                    <span id="overlay-label">Select Overlay</span>
                </div>
            </div>';

        return $contentDataOverlay;
    }

    /**
     * Parse a builder template for components
     * @param $content
     * @return array
     */
    public function parseTemplateTags($content, $builder_markup = true)
    {
        $templateTagsMatch = '/{{([a-zA-Z0-9-._:, |]+)(options=[\"]([^\"]*)[\"])?}}/is';

        preg_match_all($templateTagsMatch, $content, $matches);
        $template_tags = $matches[1];
        $options = $matches[3];

        $componentOptions = [];

        foreach($template_tags as $k => $template_tag)
        {
            $template_tag = trim($template_tag);
            $tag_options = isset($options[$k]) ? $options[$k] : false;
            $tag_replace = '{{' . $template_tag . ($tag_options ? ' options="'.$tag_options.'"' : '') . '}}';

            if ($tag_options)
            {
                $tag_options_obj = [];
                parse_str(htmlspecialchars_decode($tag_options), $tag_options_obj);
                $tag_options_json = str_replace('"', '\\u0022', json_encode($tag_options_obj));
            }

            $component = $this->getComponent($template_tag);
            $tag_db_options = !$component ? false : !empty($component['options']) ? $component['options'] : false;
            $tag_db_template = !$component ? false : !empty($component['template']) ? $component['template'] : false;

            $componentContentTemp = $tag_db_template ? $tag_db_template : $template_tag;
            if ($tag_db_options) $componentOptions[$template_tag] = $tag_db_options;

            if ($tag_db_template)
            {
                preg_match_all($templateTagsMatch, $componentContentTemp, $matchesComponent);
                $componentHasTags = count($matchesComponent[1]) > 0;

                if ($componentHasTags)
                {
                    $parseTemplateTemp = $this->parseTemplateTags($componentContentTemp, $builder_markup);
                    $componentContentTemp = $parseTemplateTemp['content'];
                    $componentOptions = array_merge($componentOptions, $parseTemplateTemp['options']);
                }
            }

            if ($builder_markup)
            {
                $preview = isset($componentOptions[$template_tag]['preview']) && $componentOptions[$template_tag]['preview'] !== false;
                if ($preview)
                {
                    $componentContentPreview = $this->getComponentPreview($tag_db_options, $tag_db_options['type']);
                    if ($componentContentPreview)
                        $componentOptions[$template_tag]['preview'] = $componentContentPreview;
                }

                $componentContent = '<div data-component="' . $template_tag . '"';
                if ($tag_options) $componentContent .= ' data-options="' . $tag_options_json . '"';
                $componentContent .= '>' . $componentContentTemp . '</div>';
            }
            else
            {
                $componentContent = $componentContentTemp;
                if ($tag_db_options['type'] == 'shortcode')
                    $componentContent = $this->getComponentShortcode($tag_db_options);

                if ($tag_db_options['type'] == 'generator')
                    $componentContent = $this->getComponentPreview($tag_db_options, $tag_db_options['type']);

                if (!$componentContent)
                    $componentContent = $componentContentTemp;
            }

            $content = str_replace($tag_replace, $componentContent, $content);
        }

        return ['content' => $content, 'options' => $componentOptions];
    }

    private function getComponentPreview($options, $type)
    {
        switch ($type)
        {
            default:
                return false;
                break;

            case 'generator':
                $generator_id = $options['generator_id'];
                $generator = $generator_id::make();

                $after = isset($options['after']) ? $options['after'] : false;
                if ($after)
                {
                    foreach ($after as $afterKey)
                    {
                        $afterData = $options['data'][$afterKey];
                        if (is_numeric($afterData)) $afterData = (boolean) $afterData;
                        call_user_func_array([$generator, $afterKey], [$afterData]);
                    }
                }

                foreach ($options['panels'] as $panel)
                {
                    $method = $panel['method'];
                    $atts = $panel['atts'];
                    $params = [];
                    foreach ($atts as $att)
                        $params[$att] = $panel['data'][$att];

                    call_user_func_array([$generator, $method], $params);

                    $after = isset($panel['after']) ? $panel['after'] : false;
                    if ($after)
                    {
                        foreach ($after as $afterKey)
                        {
                            $afterData = $panel['data'][$afterKey];
                            if (is_numeric($afterData)) $afterData = (boolean) $afterData;
                            call_user_func_array([$generator, $afterKey], [$afterData]);
                        }
                    }
                }

                return $generator->__toString();
                break;

            case 'shortcode':
                return do_shortcode($this->getComponentShortcode($options));
                break;
        }
    }

    private function getComponentShortcode($options)
    {
        if (!isset($options['shortcode_id'])) return "[invalid shortcode configuration]";

        $shortcode = '[{{shortcode_id}}{{shortcode_atts}}]';
        $shortcode_atts = "";

        if (!empty($options['shortcode_atts']))
        {
            foreach($options['shortcode_atts'] as $shortcode_atts_field)
            {
                if (!empty($options['data'][$shortcode_atts_field]) || (isset($options['data'][$shortcode_atts_field]) && (int) $options['data'][$shortcode_atts_field] == 0))
                    $shortcode_atts .= ' ' . $shortcode_atts_field . '="' . $options['data'][$shortcode_atts_field] . '"';
            }
        }

        $shortcode = str_replace("{{shortcode_id}}", $options['shortcode_id'], $shortcode);
        $shortcode = str_replace("{{shortcode_atts}}", $shortcode_atts, $shortcode);
        return $shortcode;
    }

    /**
     * Get component data from the DB
     * @param $id
     * @return array|bool
     */
    public function getComponent($id)
    {
        $query = new \WP_Query([
            'post_type' => $this->getPrefix('component'),
            'meta_query' => [
                [
                    'key' => 'component_id',
                    'value' => $id
                ]
            ]
        ]);

        $post_id = false;
        if ($query->have_posts())
        {
            while ($query->have_posts())
            {
                $query->the_post();
                $post_id = get_the_ID();
            }
        }

        wp_reset_query();

        if (!$post_id)
            return false;

        $return = [ 'component_id' => $id, 'post_id' => $post_id ];
        $template = get_post_meta($post_id, 'template', true);
        $options = get_post_meta($post_id, 'options', true);
        if (!empty($template)) $return['template'] = $template;
        if (!empty($options)) $return['options'] = $options;
        return $return;
    }

    /**
     * Get page data from the DB
     * @param $id
     * @return array|bool
     */
    public function getLayoutTemplate($id)
    {
        $query = new \WP_Query([
            'post_type' => $this->getPrefix('page'),
            'meta_query' => [
                [
                    'key' => 'page_id',
                    'value' => $id
                ]
            ]
        ]);

        $post_id = false;
        if ($query->have_posts())
        {
            while ($query->have_posts())
            {
                $query->the_post();
                $post_id = get_the_ID();
                $post_content = get_the_content();
            }
        }

        wp_reset_query();

        if (!$post_id)
            return false;

        $return = [ 'page_id' => $id, 'post_id' => $post_id, 'template' => $post_content ];
        return $return;
    }
}