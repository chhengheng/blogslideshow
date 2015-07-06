BlogSlideShow is a jQuery plugin enhancesing your blog pages with image viewer, which provides fancy transition effects.

BlogSlideShow comprises my library tEffects (https://github.com/dsheiko/Transition-Effects-JS-Library), which tries to apply CSS3 transitions to achive the effects. If the browser does not support CSS3, it visualizes the effects using JS. So the plugin is running effects as good as the browser can afford.

Likely you already have images on blog pages linked. Just add rel attribute containing "blogslideshow" to them.

When you click on such a link, you'll get the image viewer on the overlay. That contains toolbar by which you can navigate images. Besides, you can use keyboard arrows <-, ->, Esc as well.

# Demo #
  * http://demo.dsheiko.com/blogslideshow/


# How To Install #

## JS ##
To make the image viewer available on your page you just need this package files and those lines in your HTML:

```
 <link href="./assets/blogslideshow.css" rel="stylesheet" media="all" />
 <script  src="http://ajax.googleapis.com/ajax/libs/jquery/1.7.1/jquery.min.js"  type="text/javascript"></script>
 <script src="./js/jquery.blogslideshow.min.js" type="text/javascript">  </script>
 <script type="text/javascript">
    $(document).ready(function(){
        $('a[rel=blogslideshow]').bsShow();
    }); 
 </script>
```

Well, that works with no effect applied. Let's define the effect we want:

```
 $('a[rel=blogslideshow]').bsShow({
    effect: 'Jalousie',
    direction: 'horizontal'
});
</script>
```



### Options ###

  * effect - (string) which transition effect to apply.
  * direction - (string) transition direction

### Effects ###
  * FadeInOut
  * Jalousie
  * Ladder
  * Scroll
  * Deck
  * Jaw
  * DiagonalCells
  * RandomCells

## HTML ##

And supply with rel="blogslideshow" all the links to images you want to show through
Blog Slide Show like that:
```
<a href="sample_wiesbaden.jpg" rel="blogslideshow" title="optional...">link</a>
```

Enjoy!