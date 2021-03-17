"""TO-DO: Write a description of what this XBlock is."""

import pkg_resources
from web_fragments.fragment import Fragment
from xblock.core import XBlock
from xblock.fields import Integer, Scope

from pakx_flashcard.utils import (render_template, resource_string)


class PakXFlashcardXBlock(XBlock):
    """
    TO-DO: document what your XBlock does.
    """

    # Fields are defined on the class.  You can access them in your code as
    # self.<fieldname>.

    has_score = True
    icon_class = 'problem'

    count = Integer(
        default=0, scope=Scope.user_state,
        help="A simple counter, to show something happening",
    )

    def resource_string(self, path):
        """Handy helper for getting resources from our kit."""
        data = pkg_resources.resource_string(__name__, path)
        return data.decode("utf8")

    @XBlock.json_handler
    def submit_grade(self, data, suffix=''):
        """
        Publish data for analytics purposes
        """
        data['max_value'] = 1.0

        self.runtime.publish(self, "grade", data)
        return {'result': 'success'}

    # TO-DO: change this view to display your data your own way.
    def student_view(self, context=None):
        """
        The primary view of the PakXFlashcardXBlock, shown to students
        when viewing courses.
        """

        fragment = Fragment()
        html = render_template("static/html/pakx_flashcard.html", {'self': self})
        fragment.add_content(html)
        fragment.add_css(resource_string("static/css/pakx_flashcard.css"))
        fragment.add_javascript(resource_string("static/js/src/pakx_flashcard.js"))
        fragment.initialize_js('PakXFlashcardXBlock')
        return fragment

    def studio_view(self, context):
        """
        Studio edit view
        """

        fragment = Fragment()
        fragment.add_content(render_template('static/html/pakx_flashcard_edit.html', {'self': self}))
        fragment.add_javascript(resource_string("static/js/src/pakx_flashcard.js"))
        fragment.initialize_js('PakXFlashcardEditXBlock')

        return fragment

    # TO-DO: change this handler to perform your own actions.  You may need more
    # than one handler, or you may not need any handlers at all.
    @XBlock.json_handler
    def increment_count(self, data, suffix=''):
        """
        An example handler, which increments the data.
        """
        # Just to show data coming in...
        assert data['hello'] == 'world'

        self.count += 1
        return {"count": self.count}

    # TO-DO: change this to create the scenarios you'd like to see in the
    # workbench while developing your XBlock.
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
