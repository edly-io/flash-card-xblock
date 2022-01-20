PakistanX Flashcards ![Pylint Workflow](https://github.com/PakistanX/pakx-flashcard-xblock/actions/workflows/pylint.yml/badge.svg)
![ESLint workflow](https://github.com/PakistanX/pakx-flashcard-xblock/actions/workflows/es-lint.yml/badge.svg)
---------------------------------------------

This XBlock enables authoring Flashcards in openedX.



Installation
------------

Install the requirements into the python virtual environment of your
``edx-platform`` installation by running the following command from the
root folder:

    pip install -e git@github.com:PakistanX/pakx-flashcard-xblock.git@release-v0.1.1#egg=pakx_flashcards

Enabling in Studio
------------------

You can enable the Edly Assessment XBlock in studio through the
advanced settings.

1. From the main page of a specific course, navigate to
   `Settings -> Advanced Settings` from the top menu.
2. Check for the ``advanced_modules`` policy key, and add
   ``"pakx_flashcard"``.
3. Click the "Save changes" button.


Usage
-----

The PakistanX Flashcards XBlock features an interactive editor. Add the PakistanX Flashcards 
component to a lesson, then click the `EDIT` button.

![Studio View](/doc/imgs/studio-view.png)

Click `Add Card` then select any combination for front & back of the card.
After making the changes, publish the unit.


![LMS View](/doc/imgs/lms-view.png)

The above shown view is visible to user, user can click on the card to flip it.


Running the workbench
---------------------

`python manage.py runserver 8000`

Access it at 

`http://localhost:8000/` <http://localhost:8000>.
