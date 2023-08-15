"""Setup for pakx_flashcard XBlock."""

from __future__ import absolute_import

import os

from setuptools import setup


def package_data(pkg, roots):
    """Generic function to find package_data.

    All of the files under each of the `roots` will be declared as package
    data for package `pkg`.

    """
    data = []
    for root in roots:
        for dirname, _, files in os.walk(os.path.join(pkg, root)):
            for fname in files:
                data.append(os.path.relpath(os.path.join(dirname, fname), pkg))

    return {pkg: data}


setup(
    name='pakx_flashcard-xblock',
    version='0.1.3',
    description='pakx_flashcard XBlock enables authors to author flashcards with flip functionality',
    license='',
    packages=[
        'pakx_flashcard',
    ],
    install_requires=[
        'XBlock',
    ],
    entry_points={
        'xblock.v1': [
            'pakx_flashcard = pakx_flashcard:PakXFlashcardXBlock',
        ]
    },
    package_data=package_data("pakx_flashcard", ["static", "public", "translations"]),
)
