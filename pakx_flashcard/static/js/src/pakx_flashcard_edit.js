function PakXFlashcardEditXBlock(runtime, element, params) {
    var _PakXFlashcardEditXBlock = this, USAGE_ID = $(element).attr("data-usage-id") || $(element).data("usage");
    _PakXFlashcardEditXBlock.runtime = runtime;
    _PakXFlashcardEditXBlock.element = element;
    _PakXFlashcardEditXBlock.editors = {}

    _PakXFlashcardEditXBlock.URL = {
        SAVE: runtime.handlerUrl(element, 'studio_submit'),
        GET_STATE: runtime.handlerUrl(element, 'get_state')
    }

    _PakXFlashcardEditXBlock.SELECTOR = {
        INPUT_TEMPLATE: 'script[type="text/html"][data-name="input-template"]',
        TWO_IMAGE_TEMPLATE: 'script[type="text/html"][data-name="random-id"]',
        INPUT_LIST: USAGE_ID + '-ul',
        ADD_SLIDE_BUTTON: '.add-slide-button',
        EDIT_FORM: USAGE_ID + '-form',
        CANCEL_BUTTON: '.cancel-button',
        TITLE_ID: '#edit_display_name',
        TWO_IMAGE: '.two-images',
        IMAGE_PARA: '.image-paragraph',
        PARA_IMAGE: '.paragraph-image',
        TWO_PARAGRAPHS: '.two-paragraph',
        DELETE_BUTTON: '.del-button',
        ACTION_BUTTONS: '.action-buttons',
        TEXT_AREA: 'textarea[name="editor"]',
    }

    _PakXFlashcardEditXBlock.VIEW = {
        CANCEL_BUTTON: $(_PakXFlashcardEditXBlock.SELECTOR.CANCEL_BUTTON, element),
        INPUT_TEMPLATE: $(_PakXFlashcardEditXBlock.SELECTOR.INPUT_TEMPLATE, element),
        TWO_IMAGE_TEMPLATE: $(_PakXFlashcardEditXBlock.SELECTOR.TWO_IMAGE_TEMPLATE, element),
        TITLE_ELEMENT: $(_PakXFlashcardEditXBlock.SELECTOR.TITLE_ID, element),
        ADD_SLIDE_BUTTON: $(_PakXFlashcardEditXBlock.SELECTOR.ADD_SLIDE_BUTTON, element),
        EDIT_FORM: $(document.getElementById(_PakXFlashcardEditXBlock.SELECTOR.EDIT_FORM)),
        INPUT_LIST: $(document.getElementById(_PakXFlashcardEditXBlock.SELECTOR.INPUT_LIST)),
    }

    $(function () {

        $(_PakXFlashcardEditXBlock.VIEW.ADD_SLIDE_BUTTON).click(function (e) {
            e.preventDefault();
            _PakXFlashcardEditXBlock.SlideInputComponent(_PakXFlashcardEditXBlock.VIEW.INPUT_LIST);
        });

        $(_PakXFlashcardEditXBlock.VIEW.EDIT_FORM).submit(function (e) {
            e.preventDefault();
            _PakXFlashcardEditXBlock.submit(this);
        });

        $(_PakXFlashcardEditXBlock.VIEW.CANCEL_BUTTON).click(function (e) {
            e.preventDefault();
            _PakXFlashcardEditXBlock.cancel(this);
        });

        _PakXFlashcardEditXBlock.updateView(function (res) {
            res.forEach(function (item, index) {
                _PakXFlashcardEditXBlock.SlideInputComponent(_PakXFlashcardEditXBlock.VIEW.INPUT_LIST, item);
            });
        });
    });
}

PakXFlashcardEditXBlock.prototype.changeButtonStatus = function(param, target) {
    _PakXFlashcardEditXBlock = target;
    $(param).parent(_PakXFlashcardEditXBlock.SELECTOR.ACTION_BUTTONS).hide();
}

PakXFlashcardEditXBlock.prototype.addImageParagraph = function(param, target) {
    _PakXFlashcardEditXBlock = target;
    let htmlCode = `
<div class="flip">
    <div class="card">
        <div class="front"><div>Flip Card Image Flip Card Image</div></div>
        <div class="back"><div><img src="http://placehold.it/100x100" alt=""></div></div>
    </div>
</div>`
    _PakXFlashcardEditXBlock.insertSnippet(param, htmlCode, target)
}

PakXFlashcardEditXBlock.prototype.addTwoImages = function(param, target) {
    _PakXFlashcardEditXBlock = target;
    var INPUT_TEMPLATE = $($(_PakXFlashcardEditXBlock.VIEW.TWO_IMAGE_TEMPLATE).text());
    debugger

    let htmlCode = `
<div class="flip">
    <div class="card">
        <div class="front"><div><img src="http://placehold.it/100x100" alt=""></div></div>
        <div class="back"><div><img src="http://placehold.it/100x100" alt=""></div></div>
    </div>
</div>`
    _PakXFlashcardEditXBlock.insertSnippet(param, htmlCode, target)
}

PakXFlashcardEditXBlock.prototype.addParagraphImage = function(param, target) {
    _PakXFlashcardEditXBlock = target;
    let htmlCode = `
<div class="flip">
    <div class="card">
        <div class="front"><div>Flip Card Image Flip Card Image</div></div>
        <div class="back"><div><img src="http://placehold.it/100x100" alt=""></div></div>
    </div>
</div>`
    _PakXFlashcardEditXBlock.insertSnippet(param, htmlCode, target)
}

PakXFlashcardEditXBlock.prototype.addTwoParagraphs = function(param, target) {
    _PakXFlashcardEditXBlock = target;
let htmlCode = `
<div class="flip">
    <div class="card">
        <div class="front"><div>Flip Card Front</div></div>
        <div class="back">
            <div>
                <h1>What is Lorem Ipsum?</h1>
                <p>Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.</p>
            </div>
        </div>
    </div>
</div>`
debugger
    _PakXFlashcardEditXBlock.insertSnippet(param, htmlCode, target)
}

PakXFlashcardEditXBlock.prototype.deleteCard = function(param, target) {
    _PakXFlashcardEditXBlock = target;
    $(param.target).closest('li.field.comp-setting-entry.is-set').remove();
    delete _PakXFlashcardEditXBlock.editors[$(param.target).attr("data-id")]
}

PakXFlashcardEditXBlock.prototype.insertSnippet = function(targetElement, code, target) {
    _PakXFlashcardEditXBlock = target
    var editor = _PakXFlashcardEditXBlock.editors[$(targetElement.target).attr("data-id")]
    editor.setValue(editor.getValue()+code);
    _PakXFlashcardEditXBlock.changeButtonStatus(targetElement.target, target)
}

PakXFlashcardEditXBlock.prototype.getCodeMirror = function(INPUT_TEMPLATE) {
    var _PakXFlashcardEditXBlock = this;
    var xmlEditorTextarea = $(_PakXFlashcardEditXBlock.SELECTOR.TEXT_AREA, INPUT_TEMPLATE),
    xmlEditor = CodeMirror.fromTextArea(xmlEditorTextarea[0], { mode: 'xml', htmlMode: true, lineWrapping: true });
    return xmlEditor
}

PakXFlashcardEditXBlock.prototype.registerButtonEvent = function(INPUT_TEMPLATE, buttonID, callback, dataID) {
    var _PakXFlashcardEditXBlock = this;
    $(buttonID, INPUT_TEMPLATE).attr("data-id", dataID).click(function(e){callback(e, _PakXFlashcardEditXBlock)})
}

PakXFlashcardEditXBlock.prototype.registerButtonEvents = function(INPUT_TEMPLATE, elementID) {
    var _PakXFlashcardEditXBlock = this;
    _PakXFlashcardEditXBlock.registerButtonEvent(INPUT_TEMPLATE, _PakXFlashcardEditXBlock.SELECTOR.TWO_IMAGE, _PakXFlashcardEditXBlock.addTwoImages, elementID)
    _PakXFlashcardEditXBlock.registerButtonEvent(INPUT_TEMPLATE, _PakXFlashcardEditXBlock.SELECTOR.DELETE_BUTTON, _PakXFlashcardEditXBlock.deleteCard, elementID)
    _PakXFlashcardEditXBlock.registerButtonEvent(INPUT_TEMPLATE, _PakXFlashcardEditXBlock.SELECTOR.IMAGE_PARA, _PakXFlashcardEditXBlock.addImageParagraph, elementID)
    _PakXFlashcardEditXBlock.registerButtonEvent(INPUT_TEMPLATE, _PakXFlashcardEditXBlock.SELECTOR.PARA_IMAGE, _PakXFlashcardEditXBlock.addParagraphImage, elementID)
    _PakXFlashcardEditXBlock.registerButtonEvent(INPUT_TEMPLATE, _PakXFlashcardEditXBlock.SELECTOR.TWO_PARAGRAPHS, _PakXFlashcardEditXBlock.addTwoParagraphs, elementID)
}

PakXFlashcardEditXBlock.prototype.elementText = function(element) {
    var _PakXFlashcardEditXBlock = this;
    return $(element).text();
}

PakXFlashcardEditXBlock.prototype.SlideInputComponent = function (element, data) {
    var _PakXFlashcardEditXBlock = this;
    var INPUT_TEMPLATE = $($(_PakXFlashcardEditXBlock.VIEW.INPUT_TEMPLATE).text());
    var timestamp = new Date().getMilliseconds() + Math.random();
    var elementID = timestamp.toString().replace(".", "")
    INPUT_TEMPLATE.attr('id', elementID);
    var xmlEditor = _PakXFlashcardEditXBlock.getCodeMirror(INPUT_TEMPLATE)
    $(_PakXFlashcardEditXBlock.SELECTOR.DELETE_BUTTON, INPUT_TEMPLATE).attr("data-id", elementID)
    _PakXFlashcardEditXBlock.registerButtonEvents(INPUT_TEMPLATE, elementID);
    _PakXFlashcardEditXBlock.editors[elementID] = xmlEditor
    element.append(INPUT_TEMPLATE);
    if (data) {
        xmlEditor.setValue(data);
    } else {
        $(INPUT_TEMPLATE).find(_PakXFlashcardEditXBlock.SELECTOR.ACTION_BUTTONS).show()
    }
}

PakXFlashcardEditXBlock.prototype.cancel = function (element) {
    var _PakXFlashcardEditXBlock = this;
    _PakXFlashcardEditXBlock.runtime.notify('cancel', {});
}

PakXFlashcardEditXBlock.prototype.submit = function (form) {
    var _PakXFlashcardEditXBlock = this;
    var payload = _PakXFlashcardEditXBlock.toJSON(form);
    _PakXFlashcardEditXBlock.runtime.notify("save", {state: 'start', message: 'saving'})
    var config = {
        success: function (response) {
            _PakXFlashcardEditXBlock.runtime.notify('save', {state: 'end'});
        },
        error: function () {
            _PakXFlashcardEditXBlock.runtime.notify("error", {"title": "Error saving data",
                            "message": "Failed to save data"});
        }

    }
    _PakXFlashcardEditXBlock.post(_PakXFlashcardEditXBlock.URL.SAVE, payload, config);
}

PakXFlashcardEditXBlock.prototype.toJSON = function (form) {
    var _PakXFlashcardEditXBlock = this, pages = [];
    var editors = _PakXFlashcardEditXBlock.editors
    for (var key in editors) {
        // check if the property/key is defined in the object itself, not in parent
        if (editors.hasOwnProperty(key)) {
            pages.push(editors[key].getValue());
        }
    }
    var title = _PakXFlashcardEditXBlock.VIEW.TITLE_ELEMENT.val();
    return {title: title, cards: pages}
}

PakXFlashcardEditXBlock.prototype.post = function (url, payload, config = undefined) {
    var _config = {
        url: url,
        type: "POST",
        contentType: false,
        cache: false,
        processData: false,
        data: JSON.stringify(payload)
    };
    _config = $.extend({}, _config, config);
    $.ajax(_config);
}

PakXFlashcardEditXBlock.prototype.updateView = function (cb) {
    var _PakXFlashcardEditXBlock = this;

    $.get(_PakXFlashcardEditXBlock.URL.GET_STATE, function (res) {
        if (cb) {
            cb(res);
        }
    });
}
