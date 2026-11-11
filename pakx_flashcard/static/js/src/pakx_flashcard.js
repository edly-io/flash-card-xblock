/* Javascript for PakXFlashcardXBlock. */
function PakXFlashcardXBlock(runtime, element, params) {
    var _PakXFlashcardXBlock = this;

    _PakXFlashcardXBlock.URL = {
        SUBMIT_GRADE: runtime.handlerUrl(element, 'submit_grade')
    }

    _PakXFlashcardXBlock.SELECTOR = {
        FLIP: '.flip',
        CARD: '.card',
        FRONT: '.front',
        BACK: '.back',
    }

    $(function ($) {
        /* Here's where you'd do things on page load. */
        function flipCardClickHandler(cardItem) {
            cardItem.find(_PakXFlashcardXBlock.SELECTOR.CARD).toggleClass('flipped');
            if (cardItem.find(_PakXFlashcardXBlock.SELECTOR.CARD).hasClass('flipped')) {
                cardItem.find(_PakXFlashcardXBlock.SELECTOR.BACK).focus();
                cardItem.find(_PakXFlashcardXBlock.SELECTOR.BACK).attr({'aria-expanded': true, 'aria-hidden': false, "tabindex": '0'});
                cardItem.find(_PakXFlashcardXBlock.SELECTOR.FRONT).attr({'aria-expanded': false, 'aria-hidden': true, "tabindex": '-1'});
            } else {
                cardItem.find(_PakXFlashcardXBlock.SELECTOR.FRONT).focus();
                cardItem.find(_PakXFlashcardXBlock.SELECTOR.BACK).attr({'aria-expanded': false, 'aria-hidden': true, "tabindex": '-1'});
                cardItem.find(_PakXFlashcardXBlock.SELECTOR.FRONT).attr({'aria-expanded': true, 'aria-hidden': false, "tabindex": '0'});
            }
        }

        $(_PakXFlashcardXBlock.SELECTOR.FLIP, element).click(function(){
            flipCardClickHandler($(this));
            _PakXFlashcardXBlock.submitGrades(1);
        });

        $(_PakXFlashcardXBlock.SELECTOR.FLIP, element).keypress(function(e){
            if (e.type === 'keypress' && e.keyCode === 13) {
                flipCardClickHandler($(this));
                _PakXFlashcardXBlock.submitGrades(1);
                $(this).attr('aria-expanded', function (i, attr) {
                    return attr === 'true' ? 'false' : 'true'
                });
            }
        });

        $(_PakXFlashcardXBlock.SELECTOR.FLIP, element).addClass(params.class_name)

        // Label each face and say how to turn it. The hint repeats what the
        // button role already tells screen readers, so it is hidden from them.
        function addFaceText(selector, label, hint) {
            $(selector, element).each(function () {
                $(this).prepend($('<span class="flashcard-face-label"></span>').text(label));
                $(this).append($('<span class="flashcard-hint" aria-hidden="true"></span>').text(hint));
            });
        }
        addFaceText(_PakXFlashcardXBlock.SELECTOR.FRONT, params.text.front_label, params.text.front_hint);
        addFaceText(_PakXFlashcardXBlock.SELECTOR.BACK, params.text.back_label, params.text.back_hint);

        // The parts to show one card at a time: page dots, a "Card 2 of 6"
        // line for screen readers and a Next card button. The block's CSS
        // hides them all and shows every card; a theme that pages the cards
        // shows them and hides each .flip but .flashcard-current.
        //
        // In the Uber Learn app, Next card is the app's footer button instead:
        // the block posts plugin.footerAction with the label until the last
        // card, then null to hand the button back to Continue. The app answers
        // uber.footerActionAccepted, which hides the block's own button for
        // good, and uber.footerActionClicked on each tap.
        // The messages carry no block id, so the app has one footer per unit:
        // content rule, at most one multi-card flashcard per unit. Two would
        // both turn on one tap, and the first to finish hands back Continue.
        var $wrapper = $('.flashcard_wrapper', element);
        var $cards = $(_PakXFlashcardXBlock.SELECTOR.FLIP, element);
        if ($cards.length > 1) {
            var $dots = $('<div class="flashcard-dots" aria-hidden="true"></div>');
            var $count = $('<p class="flashcard-count" aria-live="polite"></p>');
            var $next = $('<button type="button" class="flashcard-next"></button>').text(params.text.next);
            var current = 0;
            var appOrigin = PakXFlashcardXBlock.appOrigin();
            var appHasNext = false;
            var showCard = function (index) {
                var isLast = index === $cards.length - 1;
                current = index;
                $cards.removeClass('flashcard-current').eq(index).addClass('flashcard-current');
                $dots.children().each(function (i) {
                    $(this).toggleClass('flashcard-dot-done', i < index)
                        .toggleClass('flashcard-dot-current', i === index);
                });
                $count.text(params.text.count
                    .replace('{current}', index + 1)
                    .replace('{total}', $cards.length));
                $next.prop('hidden', isLast || appHasNext);
                if (appOrigin) {
                    window.parent.postMessage({
                        type: 'plugin.footerAction',
                        payload: isLast ? null : {label: params.text.next}
                    }, appOrigin);
                }
            };
            var showNextCard = function () {
                if (current < $cards.length - 1) {
                    showCard(current + 1);
                    $cards.eq(current).find(_PakXFlashcardXBlock.SELECTOR.FRONT).focus();
                }
            };
            $cards.each(function () {
                $dots.append('<span class="flashcard-dot"></span>');
            });
            $wrapper.after($dots, $count, $next);
            $next.click(showNextCard);
            if (appOrigin) {
                window.addEventListener('message', function (event) {
                    if (event.source !== window.parent || event.origin !== appOrigin || !event.data) {
                        return;
                    }
                    if (event.data.type === 'uber.footerActionAccepted') {
                        appHasNext = true;
                        $next.prop('hidden', true);
                    } else if (event.data.type === 'uber.footerActionClicked') {
                        showNextCard();
                    }
                });
            }
            showCard(0);
        }
    }(jQuery));
}

// Origin of the page embedding this block (the Uber Learn app), or null when
// the block is not in an iframe.
PakXFlashcardXBlock.appOrigin = function () {
    if (window.parent === window || !document.referrer) {
        return null;
    }
    try {
        return new URL(document.referrer).origin;
    } catch (e) {
        return null;
    }
};

PakXFlashcardXBlock.prototype.submitGrades = function(grade) {
   var _PakXFlashcardXBlock = this;
   $.post(_PakXFlashcardXBlock.URL.SUBMIT_GRADE, JSON.stringify({'value': grade})).done(function(response) {
      if (response.result === 'success') {
        // FOR NOW NOTHING TO SHOW HERE
      }
  });
}
