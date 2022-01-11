"""PakistanX Flashcards XBlock is used to display random number of cards to user"""

from web_fragments.fragment import Fragment
from xblock.core import XBlock
from xblock.fields import Scope, String, List

from pakx_flashcard.utils import (render_template, resource_string, json_response)


class PakXFlashcardXBlock(XBlock):
    """
    PakistanX Flashcards XBlock is used to display random number of cards to user
    """

    has_score = True

    display_name = String(help='This name appears in horizontal navigation at the top of the page.',
                          default='ilmX Flashcards',
                          scope=Scope.content)

    cards = List(help='List of card objects', scope=Scope.content, default=[])

    @XBlock.json_handler
    def submit_grade(self, data, suffix=''):  # pylint: disable=unused-argument
        """
        Publish data for analytics purposes
        """
        data['max_value'] = 1.0

        self.runtime.publish(self, 'grade', data)
        return {'result': 'success'}

    def student_view(self, context=None):  # pylint: disable=unused-argument
        """
        The primary view of the PakXFlashcardXBlock, shown to students
        when viewing courses.
        """

        fragment = Fragment()
        html = render_template('static/html/pakx_flashcard.html', {'self': self})
        fragment.add_content(html)
        fragment.add_css(resource_string('static/css/pakx_flashcard.css'))
        fragment.add_javascript(resource_string('static/js/src/pakx_flashcard.js'))
        class_name = "small" if len(self.cards) > 2 else "medium"
        fragment.initialize_js('PakXFlashcardXBlock', {'class_name': class_name})
        return fragment

    def studio_view(self, context):  # pylint: disable=unused-argument
        """
        Studio edit view
        """

        fragment = Fragment()
        fragment.add_content(render_template('static/html/pakx_flashcard_edit.html', {'self': self}))
        fragment.add_javascript(resource_string('static/js/src/pakx_flashcard_edit.js'))
        fragment.initialize_js('PakXFlashcardEditXBlock', {"one": "one"})

        return fragment

    @XBlock.json_handler
    def studio_submit(self, data, suffix=''):  # pylint: disable=unused-argument
        self.display_name = data.get('title')
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
