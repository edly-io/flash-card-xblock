/* Javascript for PakXFlashcardXBlock. */
function PakXFlashcardXBlock(runtime, element, params) {
    var _PakXFlashcardXBlock = this;

    _PakXFlashcardXBlock.URL = {
        SUBMIT_GRADE: runtime.handlerUrl(element, 'submit_grade'),
        MARK_ALL_SEEN: runtime.handlerUrl(element, 'mark_all_seen')
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
        // In multi-card mode submitGrades is deferred until all cards are flipped.
        var _submitGradeOnFlip = true;

        // Origin shared by both single-card and multi-card paths.
        var appOrigin = PakXFlashcardXBlock.appOrigin();
        var _postToApp = function(message) {
            if (appOrigin) { window.parent.postMessage(message, appOrigin); }
        };

        var showLead = function(index) {
            var cardLead = $cards.eq(index).attr('data-lead');
            var text = cardLead === undefined ? blockLead : cardLead.trim();
            $lead.text(text).prop('hidden', !text);
        };

        function flipCardClickHandler(cardItem) {
            var $card = cardItem.find(_PakXFlashcardXBlock.SELECTOR.CARD);
            if ($card.hasClass('flipped')) { return false; }  // one-way only
            $card.addClass('flipped');
            cardItem.find(_PakXFlashcardXBlock.SELECTOR.BACK).focus();
            cardItem.find(_PakXFlashcardXBlock.SELECTOR.BACK).attr({'aria-expanded': true, 'aria-hidden': false, 'tabindex': '0'});
            cardItem.find(_PakXFlashcardXBlock.SELECTOR.FRONT).attr({'aria-expanded': false, 'aria-hidden': true, 'tabindex': '-1'});
            onCardFlipped($cards.index(cardItem));
            return true;
        }

        // Single-card: grade + plugin.completed + mark_all_seen after XHR succeeds.
        $(_PakXFlashcardXBlock.SELECTOR.FLIP, element).click(function() {
            if (flipCardClickHandler($(this)) && _submitGradeOnFlip) {
                _PakXFlashcardXBlock.submitGrades(1).done(function() {
                    _postToApp({ type: 'plugin.completed', payload: { correct: true } });
                    $.post(_PakXFlashcardXBlock.URL.MARK_ALL_SEEN, JSON.stringify({}));
                });
            }
        });

        $(_PakXFlashcardXBlock.SELECTOR.FLIP, element).keydown(function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                if (flipCardClickHandler($(this)) && _submitGradeOnFlip) {
                    _PakXFlashcardXBlock.submitGrades(1).done(function() {
                        _postToApp({ type: 'plugin.completed', payload: { correct: true } });
                        $.post(_PakXFlashcardXBlock.URL.MARK_ALL_SEEN, JSON.stringify({}));
                    });
                }
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

        // Single-card revisit restore: show the back face without animation.
        if ($cards.length === 1 && params.completed) {
            var $cardEl = $cards.first().find(_PakXFlashcardXBlock.SELECTOR.CARD);
            $cardEl[0].style.transition = 'none';
            $cardEl.addClass('flipped');
            $cards.first().find(_PakXFlashcardXBlock.SELECTOR.BACK).attr({'aria-expanded': true, 'aria-hidden': false, 'tabindex': '0'});
            $cards.first().find(_PakXFlashcardXBlock.SELECTOR.FRONT).attr({'aria-expanded': false, 'aria-hidden': true, 'tabindex': '-1'});
            requestAnimationFrame(function() {
                requestAnimationFrame(function() {
                    $cardEl[0].style.transition = '';
                });
            });
        }

        // ── Multi-card navigation ─────────────────────────────────────────────
        // Shows one card at a time, with prev/next buttons and dot indicators.
        // Next is locked until the current card is flipped. plugin.completed
        // fires once every card has been seen (flipped at least once).
        if ($cards.length > 1) {
            var current = 0;
            var flipped = new Set();
            // Don't submit grade on individual flips; defer to _checkComplete.
            _submitGradeOnFlip = false;
            // Activate paged layout.
            $(element).addClass('fc-paged');

            var $btnPrev = $('.fc-btn-prev', element);
            var $btnNext = $('.fc-btn-next', element);
            var $dots = $('.flashcard-dots', element);
            var cardLabel = (params.text && params.text.card_label) ? params.text.card_label : 'Card';
            var ofLabel   = (params.text && params.text.of_label)   ? params.text.of_label   : 'of';

            $btnPrev.attr('aria-label', params.text.prev || 'Previous card');
            $btnNext.attr('aria-label', params.text.next || 'Next card');

            // Visually-hidden live region announces card position to screen readers.
            var $liveCount = $('<span class="fc-card-count"></span>')
                .attr({'aria-live': 'polite', 'aria-atomic': 'true'});
            $(element).append($liveCount);

            // Build one dot per card (ol > li > span).
            // Dots are progress indicators, not navigation — hidden from AT and
            // keyboard focus so screen readers only hear the card count from the
            // aria-live region.
            $cards.each(function() {
                var $dot = $('<span class="fc-dot"></span>').attr('aria-hidden', 'true');
                $dots.append($('<li></li>').append($dot));
            });

            // Fire plugin.completed once every card has been flipped at least once.
            // plugin.completed and mark_all_seen run after submitGrades XHR succeeds
            // so the app's completion poll finds the grade already saved.
            var _completedSent = params.completed || false;
            var _checkComplete = function() {
                if (_completedSent || flipped.size < $cards.length) { return; }
                _completedSent = true;
                _PakXFlashcardXBlock.submitGrades(1).done(function() {
                    _postToApp({ type: 'plugin.completed', payload: { correct: true } });
                    $.post(_PakXFlashcardXBlock.URL.MARK_ALL_SEEN, JSON.stringify({})).fail(function() {
                        // Persist failure is non-fatal: grade and plugin.completed already sent.
                        // On next load params.completed will be false and revisit re-animates cards.
                    });
                });
            };

            // If previously completed, restore all cards to their flipped state.
            // Transition is disabled during restore so no flip animation runs on load.
            if (params.completed) {
                $cards.each(function(i) {
                    flipped.add(i);
                    var $card = $(this).find(_PakXFlashcardXBlock.SELECTOR.CARD);
                    $card[0].style.transition = 'none';
                    $card.addClass('flipped');
                    $(this).find(_PakXFlashcardXBlock.SELECTOR.BACK).attr({'aria-expanded': true, 'aria-hidden': false, 'tabindex': '0'});
                    $(this).find(_PakXFlashcardXBlock.SELECTOR.FRONT).attr({'aria-expanded': false, 'aria-hidden': true, 'tabindex': '-1'});
                });
                // Re-enable transitions after two frames so they work for future flips
                requestAnimationFrame(function() {
                    requestAnimationFrame(function() {
                        $cards.each(function() {
                            $(this).find(_PakXFlashcardXBlock.SELECTOR.CARD)[0].style.transition = '';
                        });
                    });
                });
            }

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

            var showCard = function(index) {
                current = index;
                showLead(index);

                $cards.removeClass('flashcard-current').eq(index).addClass('flashcard-current');

                // Dots: current = active + aria-current, flipped-but-not-current = done.
                $dots.find('.fc-dot').each(function(i) {
                    var isActive = i === index;
                    var isDone = flipped.has(i) && !isActive;
                    $(this).toggleClass('active', isActive).toggleClass('done', isDone);
                    if (isActive) {
                        $(this).attr('aria-current', 'step');
                    } else {
                        $(this).removeAttr('aria-current');
                    }
                });

                // Update live region so screen readers announce card position on navigation.
                $liveCount.text(cardLabel + ' ' + (index + 1) + ' ' + ofLabel + ' ' + $cards.length);

                $btnPrev.prop('disabled', index === 0);
                _applyNextLock(index);
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
                $dots.find('.fc-dot').eq(index).toggleClass('done', index !== current);
                _applyNextLock(current);
                _checkComplete();
            };

            $btnPrev.click(showPrevCard);
            $btnNext.click(showNextCard);

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
    return $.post(_PakXFlashcardXBlock.URL.SUBMIT_GRADE, JSON.stringify({'value': grade})).done(function(response) {
        if (response.result === 'success') {
            // FOR NOW NOTHING TO SHOW HERE
        }
    });
};
