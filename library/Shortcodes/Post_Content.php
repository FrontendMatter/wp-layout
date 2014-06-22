<?php namespace Mosaicpro\WP\Plugins\Layout;

use Mosaicpro\WpCore\Shortcode;

/**
 * Class Post_Content_Shortcode
 * @package Mosaicpro\WP\Plugins\Layout
 */
class Post_Content_Shortcode extends Shortcode
{
    /**
     * Holds a Post_Content_Shortcode instance
     * @var
     */
    protected static $instance;

    /**
     * Add the Shortcode to WP
     */
    public function addShortcode()
    {
        add_shortcode('post_content', function($atts)
        {
            $atts = shortcode_atts( ['thumbnail' => true], $atts );
            $content = do_shortcode(get_the_content());

            if ((boolean) intval($atts['thumbnail']) !== false)
                $content = get_the_post_thumbnail(null, [125]) . $content;

            return apply_filters( 'the_content', $content );
        });
    }
}