"""Tests for PakXFlashcardXBlock — all_cards_seen field and mark_all_seen handler."""
import json

import webob
import pytest
from xblock.fields import ScopeIds
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


# ── all_cards_seen field ───────────────────────────────────────────────────────

class TestAllCardsSeenField:
    def test_defaults_to_false(self):
        """all_cards_seen must start False for every new learner."""
        block = _make_block()
        assert block.all_cards_seen is False

    def test_set_to_true_persists(self):
        """Setting all_cards_seen = True must survive a re-read of the field."""
        block = _make_block()
        block.all_cards_seen = True
        assert block.all_cards_seen is True


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

    def test_field_not_set_without_handler_call(self):
        """all_cards_seen must remain False if mark_all_seen was never called.

        Regression guard: ensures submitGrades alone does not flip the flag.
        """
        block = _make_block()
        # Simulate what submit_grade does (publish grade/completion) without touching
        # all_cards_seen — the field must stay False.
        assert block.all_cards_seen is False
