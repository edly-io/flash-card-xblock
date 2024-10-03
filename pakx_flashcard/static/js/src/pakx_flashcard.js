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
            if (e.type === 'keypress' && e.keyCode == 13) {
                flipCardClickHandler($(this));
                _PakXFlashcardXBlock.submitGrades(1);
                $(this).attr('aria-expanded', function (i, attr) {
                    return attr == 'true' ? 'false' : 'true'
                });
            }
        });

        $(_PakXFlashcardXBlock.SELECTOR.FLIP, element).addClass(params.class_name)
    });
}

PakXFlashcardXBlock.prototype.submitGrades = function(grade) {
   var _PakXFlashcardXBlock = this;
   $.post(_PakXFlashcardXBlock.URL.SUBMIT_GRADE, JSON.stringify({'value': grade})).done(function(response) {
      if (response.result === 'success') {
        // FOR NOW NOTHING TO SHOW HERE
      }
  });
}
