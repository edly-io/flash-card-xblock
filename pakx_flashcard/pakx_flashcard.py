"""PakistanX Flashcards XBlock is used to display random number of cards to user"""

from web_fragments.fragment import Fragment
from xblock.core import XBlock
from xblock.exceptions import JsonHandlerError
from xblock.fields import Scope, String, List

from xblockutils.resources import ResourceLoader

from pakx_flashcard.utils import (resource_string, json_response)

resource_loader = ResourceLoader(__name__)

def _(text):
    """
    Make '_' a no-op, so we can scrape strings
    """
    return text


@XBlock.needs('i18n')
class PakXFlashcardXBlock(XBlock):
    """
    PakistanX Flashcards XBlock is used to display random number of cards to user
    """

    has_score = True

    display_name = String(help=_('This name appears in horizontal navigation at the top of the page.'),
                          default=_('Flip Card Activities'),
                          scope=Scope.content)

    description = String(help=_('A line under the title, saying what to do with the cards.'),
                         default=_('Think of your answer, then turn the card over.'),
                         scope=Scope.content)

    cards = List(help=_('List of card objects'), scope=Scope.content, default=[])

    @property
    def i18n_service(self):
        """ Obtains translation service """
        return self.runtime.service(self, 'i18n')

    @XBlock.json_handler
    def submit_grade(self, data, suffix=''):  # pylint: disable=unused-argument
        """
        Publish data for analytics purposes
        """
        data['max_value'] = 1.0

        self.runtime.publish(self, 'grade', data)
        self.runtime.publish(self, 'completion', {'completion': 1.0})

        return {'result': 'success'}

    def student_view(self, context=None):  # pylint: disable=unused-argument
        """
        The primary view of the PakXFlashcardXBlock, shown to students
        when viewing courses.
        """

        fragment = Fragment()
        html = resource_loader.render_django_template(
            'static/html/pakx_flashcard.html',
            context={'self': self},
            i18n_service=self.i18n_service
        )
        fragment.add_content(html)
        fragment.add_css(resource_string('static/css/pakx_flashcard.css'))
        fragment.add_javascript(resource_string(
            'static/js/src/pakx_flashcard.js'))
        class_name = "small" if len(self.cards) > 2 else "medium"
        gettext = self.i18n_service.gettext
        fragment.initialize_js('PakXFlashcardXBlock', {
                               'class_name': class_name,
                               'text': {
                                   'front_label': gettext('Question'),
                                   'back_label': gettext('Answer'),
                                   'front_hint': gettext('Turn over'),
                                   'back_hint': gettext('Turn over'),
                                   'next': gettext('Next card'),
                                   # The JS fills in {current} and {total}
                                   'count': gettext('Card {current} of {total}'),
                               }})
        return fragment

    def studio_view(self, context):  # pylint: disable=unused-argument
        """
        Studio edit view
        """

        fragment = Fragment()
        fragment.add_content(resource_loader.render_django_template(
            'static/html/pakx_flashcard_edit.html',
            context={'self': self},
            i18n_service=self.i18n_service
        ))
        fragment.add_javascript(resource_string(
            'static/js/src/pakx_flashcard_edit.js'))
        fragment.initialize_js('PakXFlashcardEditXBlock', {"one": "one"})

        return fragment

    @XBlock.json_handler
    def studio_submit(self, data, suffix=''):  # pylint: disable=unused-argument
        if not data.get('title'):
            return {
                'success': False,
                'errors': _("Title can't be empty.")
            }
        description = data.get('description', self.description) or ''
        if not isinstance(description, str):
            raise JsonHandlerError(400, _('The description must be text.'))
        self.display_name = data.get('title')
        self.description = description.strip()
        self.cards = data.get('cards')
        return {
            'result': 'success',
        }

    @XBlock.handler
    def get_state(self, request, suffix=''):  # pylint: disable=unused-argument
        json = json_response(self.cards)
        return json

    @staticmethod
    def workbench_scenarios():
        """A canned scenario for display in the workbench."""
        return [
            ("PakXFlashcardXBlock",
             """<pakx_flashcard/>
             """),
            ("Multiple PakXFlashcardXBlock",
             """<vertical_demo>
                <pakx_flashcard/>
                <pakx_flashcard/>
                <pakx_flashcard/>
                </vertical_demo>
             """),
        ]
