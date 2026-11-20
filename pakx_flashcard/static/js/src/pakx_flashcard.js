/* Javascript for PakXFlashcardXBlock. */
function PakXFlashcardXBlock(runtime, element, params) {
    var _PakXFlashcardXBlock = this;

    _PakXFlashcardXBlock.URL = {
        SUBMIT_GRADE: runtime.handlerUrl(element, 'submit_grade')
    };

    _PakXFlashcardXBlock.SELECTOR = {
        FLIP: '.flip',
        CARD: '.card',
        FRONT: '.front',
        BACK: '.back',
    };

    $(function ($) {
        var $wrapper = $('.flashcard_wrapper', element);
        var $cards = $(_PakXFlashcardXBlock.SELECTOR.FLIP, element);
        var $lead = $('.flashcard-lead', element);
        var blockLead = $lead.text();

        // Overridden in multi-card setup to track flipped state.
        var onCardFlipped = function() {};

        var showLead = function(index) {
            var cardLead = $cards.eq(index).attr('data-lead');
            var text = cardLead === undefined ? blockLead : cardLead.trim();
            $lead.text(text).prop('hidden', !text);
        };

        function flipCardClickHandler(cardItem) {
            var $card = cardItem.find(_PakXFlashcardXBlock.SELECTOR.CARD);
            $card.toggleClass('flipped');
            if ($card.hasClass('flipped')) {
                cardItem.find(_PakXFlashcardXBlock.SELECTOR.BACK).focus();
                cardItem.find(_PakXFlashcardXBlock.SELECTOR.BACK).attr({'aria-expanded': true, 'aria-hidden': false, 'tabindex': '0'});
                cardItem.find(_PakXFlashcardXBlock.SELECTOR.FRONT).attr({'aria-expanded': false, 'aria-hidden': true, 'tabindex': '-1'});
            } else {
                cardItem.find(_PakXFlashcardXBlock.SELECTOR.FRONT).focus();
                cardItem.find(_PakXFlashcardXBlock.SELECTOR.BACK).attr({'aria-expanded': false, 'aria-hidden': true, 'tabindex': '-1'});
                cardItem.find(_PakXFlashcardXBlock.SELECTOR.FRONT).attr({'aria-expanded': true, 'aria-hidden': false, 'tabindex': '0'});
            }
            onCardFlipped($cards.index(cardItem));
        }

        $(_PakXFlashcardXBlock.SELECTOR.FLIP, element).click(function() {
            flipCardClickHandler($(this));
            _PakXFlashcardXBlock.submitGrades(1);
        });

        $(_PakXFlashcardXBlock.SELECTOR.FLIP, element).keypress(function(e) {
            if (e.type === 'keypress' && e.keyCode === 13) {
                flipCardClickHandler($(this));
                _PakXFlashcardXBlock.submitGrades(1);
                $(this).attr('aria-expanded', function(i, attr) {
                    return attr === 'true' ? 'false' : 'true';
                });
            }
        });

        $(_PakXFlashcardXBlock.SELECTOR.FLIP, element).addClass(params.class_name);

        // Say how to turn each face. The hint repeats what the button role
        // already tells screen readers, so it is hidden from them.
        function addFaceText(selector, hint) {
            $(selector, element).each(function() {
                if (!$(this).find('.flashcard-hint').length) {
                    $(this).append($('<span class="flashcard-hint" aria-hidden="true"></span>').text(hint));
                }
            });
        }
        addFaceText(_PakXFlashcardXBlock.SELECTOR.FRONT, params.text.front_hint);
        addFaceText(_PakXFlashcardXBlock.SELECTOR.BACK, params.text.back_hint);

        showLead(0);

        // ── Multi-card navigation ─────────────────────────────────────────────
        // Shows one card at a time, with prev/next buttons and dot indicators.
        // Next is locked until the current card is flipped. plugin.completed
        // fires once every card has been seen (flipped at least once).
        if ($cards.length > 1) {
            var current = 0;
            var flipped = new Set();
            var appOrigin = PakXFlashcardXBlock.appOrigin();
            var appHasNext = false;

            // Activate paged layout.
            $(element).addClass('fc-paged');

            var $btnPrev = $('.fc-btn-prev', element);
            var $btnNext = $('.fc-btn-next', element);
            var $dots = $('.flashcard-dots', element);

            $btnPrev.attr('aria-label', params.text.prev || 'Previous card');
            $btnNext.attr('aria-label', params.text.next || 'Next card');

            // Build one dot per card (ol > li > button).
            $cards.each(function(i) {
                var $btn = $('<button type="button"></button>').attr('aria-label', 'Card ' + (i + 1));
                $dots.append($('<li></li>').append($btn));
            });

            var _postToApp = function(message) {
                if (appOrigin) { window.parent.postMessage(message, appOrigin); }
            };

            // Lock or unlock the next button for the given card index.
            var _applyNextLock = function(index) {
                var isLast = index === $cards.length - 1;
                var isFlipped = flipped.has(index);
                if (isLast) {
                    $btnNext.prop('disabled', true).removeClass('fc-locked').removeAttr('aria-disabled');
                } else if (isFlipped) {
                    $btnNext.prop('disabled', false).removeClass('fc-locked').removeAttr('aria-disabled');
                } else {
                    // Clickable but visually locked — mirrors microlearning kc-locked.
                    $btnNext.prop('disabled', false).addClass('fc-locked').attr('aria-disabled', 'true');
                }
            };

            // Fire plugin.completed once every card has been flipped at least once.
            var _completedSent = false;
            var _checkComplete = function() {
                if (_completedSent || flipped.size < $cards.length) { return; }
                _completedSent = true;
                _postToApp({ type: 'plugin.completed', payload: { correct: true } });
            };

            var showCard = function(index) {
                var isLast = index === $cards.length - 1;
                current = index;
                showLead(index);

                $cards.removeClass('flashcard-current').eq(index).addClass('flashcard-current');

                // Dots: current = active + aria-current, flipped-but-not-current = done.
                $dots.find('button').each(function(i) {
                    var isActive = i === index;
                    var isDone = flipped.has(i) && !isActive;
                    $(this).toggleClass('active', isActive).toggleClass('done', isDone);
                    if (isActive) {
                        $(this).attr('aria-current', 'step');
                    } else {
                        $(this).removeAttr('aria-current');
                    }
                });

                $btnPrev.prop('disabled', index === 0);
                _applyNextLock(index);

                // Let the app's footer drive "Next card"; hand back Continue on
                // the last card so the learner can proceed after finishing.
                _postToApp({
                    type: 'plugin.footerAction',
                    payload: isLast ? null : { label: params.text.next }
                });
            };

            var showNextCard = function(event) {
                // Blocked until the current card has been flipped at least once.
                if (!flipped.has(current)) { return; }
                if (current < $cards.length - 1) {
                    showCard(current + 1);
                    var $front = $cards.eq(current).find(_PakXFlashcardXBlock.SELECTOR.FRONT);
                    // Suppress the focus ring on pointer/app-tap navigation;
                    // keep it for keyboard (event.detail === 0) per WCAG 2.4.7.
                    if (!event || event.detail > 0) {
                        $front.addClass('flashcard-no-focus-ring')
                            .one('blur', function() { $(this).removeClass('flashcard-no-focus-ring'); });
                    }
                    $front.focus();
                }
            };

            var showPrevCard = function() {
                if (current > 0) {
                    showCard(current - 1);
                    $cards.eq(current).find(_PakXFlashcardXBlock.SELECTOR.FRONT).focus();
                }
            };

            // Called by flipCardClickHandler after each flip.
            onCardFlipped = function(index) {
                flipped.add(index);
                // Update the dot for the flipped card immediately.
                $dots.find('button').eq(index).toggleClass('done', index !== current);
                _applyNextLock(current);
                _checkComplete();
            };

            $btnPrev.click(showPrevCard);
            $btnNext.click(showNextCard);

            // App footer integration: app takes over the Next button;
            // uber.footerActionClicked drives forward navigation.
            if (appOrigin) {
                window.addEventListener('message', function(evt) {
                    if (evt.source !== window.parent || evt.origin !== appOrigin || !evt.data) { return; }
                    if (evt.data.type === 'uber.footerActionAccepted') {
                        appHasNext = true;
                        $btnNext.prop('hidden', true);
                    } else if (evt.data.type === 'uber.footerActionClicked') {
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
PakXFlashcardXBlock.appOrigin = function() {
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
};
