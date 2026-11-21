"""Tests for PakXFlashcardXBlock — all_cards_seen field and mark_all_seen handler."""
import json
from unittest.mock import MagicMock, patch, PropertyMock

import webob
import pytest
from xblock.fields import Scope, ScopeIds
from xblock.test.toy_runtime import ToyRuntime

from pakx_flashcard.pakx_flashcard import PakXFlashcardXBlock


# ── Helpers ────────────────────────────────────────────────────────────────────

def _make_block(user_id='student1'):
    """Return a ToyRuntime-backed PakXFlashcardXBlock instance."""
    runtime = ToyRuntime()
    scope_ids = ScopeIds(user_id, 'pakx_flashcard', 'def_id', 'usage_id')
    return PakXFlashcardXBlock(runtime, scope_ids=scope_ids)


def _post(block, handler_name, body=None):
    """Call an XBlock JSON handler via a POST webob.Request."""
    payload = json.dumps(body or {}).encode()
    req = webob.Request.blank('/')
    req.method = 'POST'
    req.body = payload
    return getattr(block, handler_name)(req, suffix='')


def _mock_i18n():
    """Return a minimal i18n service stub where gettext is an identity function."""
    svc = MagicMock()
    svc.gettext.side_effect = lambda s: s
    return svc


# ── all_cards_seen field ───────────────────────────────────────────────────────

class TestAllCardsSeenField:
    def test_defaults_to_false(self):
        """all_cards_seen must start False for every new learner."""
        block = _make_block()
        assert block.all_cards_seen is False

    def test_field_scoped_per_user(self):
        """all_cards_seen must use Scope.user_state so each learner keeps their own flag."""
        assert PakXFlashcardXBlock.all_cards_seen.scope == Scope.user_state


# ── mark_all_seen handler ──────────────────────────────────────────────────────

class TestMarkAllSeenHandler:
    def test_sets_field_true_and_returns_success(self):
        """mark_all_seen must set all_cards_seen and return {'result': 'success'}."""
        block = _make_block()
        assert block.all_cards_seen is False  # precondition

        response = _post(block, 'mark_all_seen')

        assert block.all_cards_seen is True
        assert json.loads(response.body) == {'result': 'success'}

    def test_idempotent(self):
        """Calling mark_all_seen a second time must not raise or regress the field."""
        block = _make_block()
        _post(block, 'mark_all_seen')
        response = _post(block, 'mark_all_seen')

        assert block.all_cards_seen is True
        assert json.loads(response.body) == {'result': 'success'}

    def test_submit_grade_does_not_set_field(self):
        """all_cards_seen must remain False after submit_grade; only mark_all_seen sets it."""
        block = _make_block()
        _post(block, 'submit_grade', {'value': 1})
        assert block.all_cards_seen is False


# ── student_view JS params ─────────────────────────────────────────────────────

class TestStudentView:
    def _call_student_view(self, block):
        """Call student_view with all external dependencies patched."""
        i18n = _mock_i18n()
        with patch.object(type(block), 'i18n_service', new_callable=PropertyMock, return_value=i18n), \
             patch('pakx_flashcard.pakx_flashcard.resource_string', return_value=''), \
             patch('pakx_flashcard.pakx_flashcard.resource_loader') as mock_rl:
            mock_rl.render_django_template.return_value = ''
            return block.student_view({})

    def test_completed_true_after_mark_all_seen(self):
        """student_view must pass completed=True to initialize_js after all cards are seen."""
        block = _make_block()
        _post(block, 'mark_all_seen')

        fragment = self._call_student_view(block)

        data = fragment.json_init_args
        assert data['completed'] is True

    def test_completed_false_by_default(self):
        """student_view must pass completed=False for a learner who has not seen all cards."""
        block = _make_block()

        fragment = self._call_student_view(block)

        assert fragment.json_init_args['completed'] is False

    def test_text_labels_in_js_params(self):
        """student_view must include card_label and of_label in the text params for i18n."""
        block = _make_block()

        fragment = self._call_student_view(block)

        text = fragment.json_init_args['text']
        assert 'card_label' in text
        assert 'of_label' in text
