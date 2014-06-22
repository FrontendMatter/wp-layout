<?php
/**
 * The template for displaying a Builder layouts
 *
 * You can edit the builder layout template by creating a mp_layout_layout.php template
 * in your theme. You can use this template as a guide or starting point.
 *
 * For a list of available custom functions to use inside this template,
 * please refer to the Developer's Guide or the Documentation
 *
 ***************** NOTICE: *****************
 * Do not make changes to this file. Any changes made to this file
 * will be overwritten if the plugin is updated.
 *
 * To overwrite this template with your own, make a copy of it (with the same name)
 * in your theme directory. WordPress will automatically load the template you create
 * in your theme directory instead of this one.
 *
 * See Theme Integration Guide for more information
 ***************** NOTICE: *****************
 */

use Mosaicpro\WP\Plugins\Layout\Layout;

$layout = Layout::getInstance();
$page = $layout->getLayoutTemplate('426123e1-11c3-d9e4-d057-4eb7ce6ecfa0');
$template = $layout->parseTemplateTags($page['template'], false);

get_header(); ?>
<?php if (have_posts()) : while (have_posts()) : the_post(); ?>

    <?php echo do_shortcode($template['content']); ?>

<?php endwhile; endif; ?>
<?php get_footer(); ?>