<?php namespace Mosaicpro\WP\Plugins\Layout;

use Mosaicpro\WpCore\Shortcode;

/**
 * Class Post_Title_Shortcode
 * @package Mosaicpro\WP\Plugins\Layout
 */
class Post_Title_Shortcode extends Shortcode
{
    /**
     * Holds a Post_Title_Shortcode instance
     * @var
     */
    protected static $instance;

    /**
     * Add the Shortcode to WP
     */
    public function addShortcode()
    {
        add_shortcode('post_title', function($atts)
        {
            $atts = shortcode_atts( ['size' => 'h1'], $atts );
            return '<' . $atts['size'] . '>' . get_the_title() . '</' . $atts['size'] . '>';
        });
    }
}