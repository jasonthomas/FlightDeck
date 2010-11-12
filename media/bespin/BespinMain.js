;bespin.tiki.register("::text_editor", {
    name: "text_editor",
    dependencies: { "completion": "0.0.0", "undomanager": "0.0.0", "settings": "0.0.0", "canon": "0.0.0", "rangeutils": "0.0.0", "traits": "0.0.0", "theme_manager": "0.0.0", "keyboard": "0.0.0", "edit_session": "0.0.0", "syntax_manager": "0.0.0" }
});
bespin.tiki.module("text_editor:commands/movement",function(require,exports,module) {
/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Bespin.
 *
 * The Initial Developer of the Original Code is
 * Mozilla.
 * Portions created by the Initial Developer are Copyright (C) 2009
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Bespin Team (bespin@mozilla.com)
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

var Range = require('rangeutils:utils/range');
var env = require('environment').env;

// TODO: These should not be using private APIs of the view.

//
// Simple movement.
//
// These simply delegate to the text view, because they take the text view's
// private virtual selection into account.
//

exports.moveDown = function(args, request) {
    var view = env.view;
    view.moveDown();
};

exports.moveLeft = function(args, request) {
    var view = env.view;
    view.moveLeft();
};

exports.moveRight = function(args, request) {
    var view = env.view;
    view.moveRight();
};

exports.moveUp = function(args, request) {
    var view = env.view;
    view.moveUp();
};

//
// Simple selection.
//

exports.selectDown = function(args, request) {
    var view = env.view;
    view.selectDown();
};

exports.selectLeft = function(args, request) {
    var view = env.view;
    view.selectLeft();
};

exports.selectRight = function(args, request) {
    var view = env.view;
    view.selectRight();
};

exports.selectUp = function(args, request) {
    var view = env.view;
    view.selectUp();
};

//
// Move or select to the end of the line or document.
//

var moveOrSelectEnd = function(shift, inLine) {
    var view = env.view, model = env.model;
    var lines = model.lines;
    var selectedRange = view.getSelectedRange(true);
    var row = inLine ? selectedRange.end.row : lines.length - 1;
    view.moveCursorTo({ row: row, col: lines[row].length }, shift);
};

exports.moveLineEnd = function(args, request) {
    moveOrSelectEnd(false, true);
};

exports.selectLineEnd = function(args, request) {
    moveOrSelectEnd(true, true);
};

exports.moveDocEnd = function(args, request) {
    moveOrSelectEnd(false, false);
};

exports.selectDocEnd = function(args, request) {
    moveOrSelectEnd(true, false);
};

//
// Move or select to the beginning of the line or document.
//

var moveOrSelectStart = function(shift, inLine) {
    var view = env.view;
    var range = view.getSelectedRange(true);
    var row = inLine ? range.end.row : 0;
    var position = { row: row, col: 0 };
    view.moveCursorTo(position, shift);
};

exports.moveLineStart = function (args, request) {
    moveOrSelectStart(false, true);
};

exports.selectLineStart = function(args, request) {
    moveOrSelectStart(true, true);
};

exports.moveDocStart = function(args, request) {
    moveOrSelectStart(false, false);
};

exports.selectDocStart = function(args, request) {
    moveOrSelectStart(true, false);
};

//
// Move or select to the next or previous word.
//

var seekNextStop = function(view, text, col, dir, rowChanged) {
    var isDelim;
    var countDelim = 0;
    var wasOverNonDelim = false;

    if (dir < 0) {
        col--;
        if (rowChanged) {
            countDelim = 1;
        }
    }

    while (col < text.length && col > -1) {
        isDelim = view.isDelimiter(text[col]);
        if (isDelim) {
            countDelim++;
        } else {
            wasOverNonDelim = true;
        }
        if ((isDelim || countDelim > 1) && wasOverNonDelim) {
            break;
        }
        col += dir;
    }

    if (dir < 0) {
        col++;
    }

    return col;
};

var moveOrSelectNextWord = function(shiftDown) {
    var view = env.view, model = env.model;
    var lines = model.lines;

    var selectedRange = view.getSelectedRange(true);
    var end = selectedRange.end;
    var row = end.row, col = end.col;

    var currentLine = lines[row];
    var changedRow = false;

    if (col >= currentLine.length) {
        row++;
        changedRow = true;
        if (row < lines.length) {
            col = 0;
            currentLine = lines[row];
        } else {
            currentLine = '';
        }
    }

    col = seekNextStop(view, currentLine, col, 1, changedRow);

    view.moveCursorTo({ row: row, col: col }, shiftDown);
};

var moveOrSelectPreviousWord = function(shiftDown) {
    var view = env.view, model = env.model;

    var lines = model.lines;
    var selectedRange = view.getSelectedRange(true);
    var end = selectedRange.end;
    var row = end.row, col = end.col;

    var currentLine = lines[row];
    var changedRow = false;

    if (col > currentLine.length) {
        col = currentLine.length;
    } else if (col == 0) {
        row--;
        changedRow = true;
        if (row > -1) {
            currentLine = lines[row];
            col = currentLine.length;
        } else {
            currentLine = '';
        }
    }

    col = seekNextStop(view, currentLine, col, -1, changedRow);

    view.moveCursorTo({ row: row, col: col }, shiftDown);
};

exports.moveNextWord = function(args, request) {
    moveOrSelectNextWord(false);
};

exports.selectNextWord = function(args, request) {
    moveOrSelectNextWord(true);
};

exports.movePreviousWord = function(args, request) {
    moveOrSelectPreviousWord(false);
};

exports.selectPreviousWord = function(args, request) {
    moveOrSelectPreviousWord(true);
};

//
// Miscellaneous.
//

/**
 * Selects all characters in the buffer.
 */
exports.selectAll = function(args, request) {
    var view = env.view;
    view.selectAll();
};

});

bespin.tiki.module("text_editor:commands/scrolling",function(require,exports,module) {
/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Bespin.
 *
 * The Initial Developer of the Original Code is
 * Mozilla.
 * Portions created by the Initial Developer are Copyright (C) 2009
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Bespin Team (bespin@mozilla.com)
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */
 
var env = require('environment').env;

// Scrolling commands.

/**
 * Scrolls to the start of the document.
 */
exports.scrollDocStart = function(args, request) {
    env.view.scrollToPosition({ col: 0, row: 0 });
};

/**
 * Scrolls to the end of the document.
 */
exports.scrollDocEnd = function(args, request) {
    env.view.scrollToPosition(env.model.range.end);
};

/**
 * Scrolls down by one screenful of text.
 */
exports.scrollPageDown = function(args, request) {
    env.view.scrollPageDown();
};

/**
 * Scrolls up by one screenful of text.
 */
exports.scrollPageUp = function(args, request) {
    env.view.scrollPageUp();
};


});

bespin.tiki.module("text_editor:commands/editor",function(require,exports,module) {
/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Bespin.
 *
 * The Initial Developer of the Original Code is
 * Mozilla.
 * Portions created by the Initial Developer are Copyright (C) 2009
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Bespin Team (bespin@mozilla.com)
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

var catalog = require('bespin:plugins').catalog;
var settings = require('settings').settings;
var env = require('environment').env;

exports.findNextCommand = function(args, request) {
    var view = env.view, search = view.editor.searchController;
    var sel = view.getSelectedRange();
    var match = search.findNext(sel.end, true);
    if (match) {
        view.setSelection(match, true);
        view.focus();
    }
};

exports.findPrevCommand = function(args, request) {
    var view = env.view, search = view.editor.searchController;
    var sel = view.getSelectedRange();
    var match = search.findPrevious(sel.start, true);
    if (match) {
        view.setSelection(match, true);
        view.focus();
    }
};

/**
 * Utility to allow us to alter the current selection
 * TODO: If the selection is empty, broaden the scope to the whole file?
 */
var withSelection = function(action) {
    var view = env.view;
    var selection = view.getSelectedCharacters();

    var replacement = action(selection);

    var range = view.getSelectedRange();
    var model = env.model;
    model.replaceCharacters(range, replacement);
};

/**
 * 'replace' command
 */
exports.replaceCommand = function(args, request) {
    withSelection(function(selected) {
        return selected.replace(args.search + '/g', args.replace);
    });
};

/**
 * 'entab' command
 */
exports.entabCommand = function(args, request) {
    tabstop = settings.get('tabstop');
    withSelection(function(selected) {
        return selected.replace(' {' + tabstop + '}', '\t');
    });
};

/**
 * 'detab' command
 */
exports.detabCommand = function(args, request) {
    tabstop = settings.get('tabstop');
    withSelection(function(selected) {
        return selected.replace('\t', new Array(tabstop + 1).join(' '));
    });
};

/**
 * 'trim' command
 */
exports.trimCommand = function(args, request) {
    withSelection(function(selected) {
        var lines = selected.split('\n');
        lines = lines.map(function(line) {
            if (args.side === 'left' || args.side === 'both') {
                line = line.replace(/^\s+/, '');
            }
            if (args.side === 'right' || args.side === 'both') {
                line = line.replace(/\s+$/, '');
            }
            return line;
        });
        return lines.join('\n');
    });
};

/**
 * 'uc' command
 */
exports.ucCommand = function(args, request) {
    withSelection(function(selected) {
        return selected.toUpperCase();
    });
};

/**
 * 'lc' command
 */
exports.lcCommand = function(args, request) {
    withSelection(function(selected) {
        return selected.toLowerCase();
    });
};

});

bespin.tiki.module("text_editor:commands/editing",function(require,exports,module) {
/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Bespin.
 *
 * The Initial Developer of the Original Code is
 * Mozilla.
 * Portions created by the Initial Developer are Copyright (C) 2009
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Bespin Team (bespin@mozilla.com)
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

var settings = require('settings').settings;
var env = require('environment').env;
var m_range = require('rangeutils:utils/range');

/*
 * Commands that delete text.
 */

/**
 * Deletes the selection or the previous character, if the selection is an
 * insertion point.
 */
exports.backspace = function(args, request) {
    var view = env.view;
    view.performBackspaceOrDelete(true);
};

/**
 * Deletes the selection or the next character, if the selection is an
 * insertion point.
 */
exports.deleteCommand = function(args, request) {
    var view = env.view;
    view.performBackspaceOrDelete(false);
};

/**
 * Deletes all lines that are partially or fully selected, and position the
 * insertion point at the end of the deleted range.
 */
exports.deleteLines = function(args, request) {
    if (env.model.readOnly) {
        return;
    }

    // In the case of just one line, do nothing.
    if (env.model.lines.length == 1) {
        return;
    }

    var view = env.view;
    view.groupChanges(function() {
        var range = view.getSelectedRange();
        var lines = env.model.lines;
        var lastLine = lines.length - 1;
        var startPos, endPos;

        // Last row gets special treatment.
        if (range.start.row == lastLine) {
            startPos = { col: lines[lastLine - 1].length, row: lastLine - 1 };
        } else {
            startPos = { col: 0, row: range.start.row };
        }

        // Last row gets special treatment.
        if (range.end.row == lastLine) {
            endPos = { col: lines[lastLine].length, row: lastLine};
        } else {
            endPos = { col: 0, row: range.end.row + 1 };
        }

        view.replaceCharacters({
            start: startPos,
            end:   endPos
        }, '');

        view.moveCursorTo(startPos);
    });
};

/*
 * Commands that insert text.
 */

// Inserts a newline, and copies the spaces at the beginning of the current row
// to autoindent.
var newline = function(model, view) {
    var selection = view.getSelectedRange();
    var position = selection.start;
    var row = position.row, col = position.col;

    var lines = model.lines;
    var prefix = lines[row].substring(0, col);

    var spaces = /^\s*/.exec(prefix);
    view.insertText('\n' + spaces);
};

/**
 * Replaces the selection with the given text and updates the selection
 * boundaries appropriately.
 */
exports.insertText = function(args, request) {
    var view = env.view;
    var text = args.text;
    view.insertText(text);
};

/**
 * Inserts a newline at the insertion point.
 */
exports.newline = function(args, request) {
    var model = env.model, view = env.view;
    newline(model, view);
};

/**
 * Join the following line with the current one. Removes trailing whitespaces.
 */
exports.joinLines = function(args, request) {
    var model = env.model;
    if (model.readOnly) {
        return;
    }

    var view = env.view;
    var selection = view.getSelectedRange();
    var lines = model.lines;
    var row = selection.end.row;

    // Last line selected, which can't get joined.
    if (lines.length == row) {
        return;
    }

    view.groupChanges(function() {
        var endCol = lines[row].length;

        view.replaceCharacters({
            start: {
                col: endCol,
                row: row
            },
            end: {
                col: /^\s*/.exec(lines[row + 1])[0].length,
                row: row + 1
        }}, '');
    });
};

/**
 * Creates a new, empty line below the current one, and places the insertion
 * point there.
 */
exports.openLine = function(args, request) {
    if (env.model.readOnly) {
        return;
    }

    var model = env.model, view = env.view;

    var selection = view.getSelectedRange();
    var row = selection.end.row;
    var lines = model.lines;
    view.moveCursorTo({ row: row, col: lines[row].length });

    newline(model, view);
};

/**
 * Inserts a new tab. This is smart about the current inserted whitespaces and
 * the current position of the cursor. If some text is selected, the selected
 * lines will be indented by tabstop spaces.
 */
exports.tab = function(args, request) {
    var view = env.view;

    view.groupChanges(function() {
        var tabstop = settings.get('tabstop');
        var selection = view.getSelectedRange();
        var str = '';

        if (m_range.isZeroLength(selection)){
            var line = env.model.lines[selection.start.row];
            var trailspaces = line.substring(selection.start.col).
                                            match(/^\s*/)[0].length;
            var count = tabstop - (selection.start.col + trailspaces) % tabstop;

            for (var i = 0; i < count; i++) {
                str += ' ';
            }

            view.replaceCharacters({
                 start: selection.start,
                 end:   selection.start
             }, str);

            view.moveCursorTo({
                col: selection.start.col + count + trailspaces,
                row: selection.end.row
            });
        } else {
            for (var i = 0; i < tabstop; i++) {
                str += ' ';
            }

            var startCol;
            var row = selection.start.row - 1;
            while (row++ < selection.end.row) {
                startCol = row == selection.start.row ? selection.start.col : 0;

                view.replaceCharacters({
                    start: { row:  row, col: startCol},
                    end:   { row:  row, col: startCol}
                }, str);
            }

            view.setSelection({
                start: selection.start,
                end: {
                    col: selection.end.col + tabstop,
                    row:  selection.end.row
                }
            });
        }
    }.bind(this));
};

/**
 * Removes a tab of whitespaces. If there is no selection, whitespaces in front
 * of the cursor will be removed. The number of removed whitespaces depends on
 * the setting tabstop and the current cursor position. If there is a selection,
 * then the selected lines are unindented by tabstop spaces.
 */
exports.untab = function(args, request) {
    var view = env.view;

    view.groupChanges(function() {
        var tabstop = settings.get('tabstop');
        var selection = view.getSelectedRange();
        var lines = env.model.lines;
        var count = 0;

        if (m_range.isZeroLength(selection)){
            count = Math.min(
                lines[selection.start.row].substring(0, selection.start.col).
                                                    match(/\s*$/)[0].length,
                (selection.start.col - tabstop) % tabstop || tabstop);

            view.replaceCharacters({
                start: {
                    col: selection.start.col - count,
                    row: selection.start.row
                },
                end: selection.start
            }, '');

            view.moveCursorTo({
                row:  selection.start.row,
                col: selection.end.col - count
            });
        } else {
            var startCol;
            var row = selection.start.row - 1;
            while (row++ < selection.end.row) {
                startCol = row == selection.start.row ? selection.start.col : 0;

                count = Math.min(
                    lines[row].substring(startCol).match(/^\s*/)[0].length,
                    tabstop);

                view.replaceCharacters({
                     start: { row: row, col: startCol},
                     end:   { row: row, col: startCol + count}
                 }, '');
            }

             view.setSelection({
                 start: { row:  selection.start.row, col: selection.start.col},
                 end:   { row:  selection.end.row, col: selection.end.col - count}
             });
       }
    }.bind(this));
};

});

bespin.tiki.module("text_editor:views/gutter",function(require,exports,module) {
/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Bespin.
 *
 * The Initial Developer of the Original Code is
 * Mozilla.
 * Portions created by the Initial Developer are Copyright (C) 2009
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Bespin Team (bespin@mozilla.com)
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

var util = require('bespin:util/util');
var catalog = require('bespin:plugins').catalog;
var rect = require('utils/rect');

var CanvasView = require('views/canvas').CanvasView;

/*
 * A view that renders the gutter for the editor.
 *
 * The domNode attribute contains the domNode for this view that should be
 * added to the document appropriately.
 */
exports.GutterView = function(container, editor) {
    CanvasView.call(this, container, true /* preventDownsize */ );

    this.editor = editor;
    this.domNode.addEventListener('click', this._click.bind(this), false);
};

exports.GutterView.prototype = new CanvasView();

util.mixin(exports.GutterView.prototype, {
    _decorationSpacing: 2,

    drawRect: function(rect, context) {
        var theme = this.editor.themeData.gutter;

        context.fillStyle = theme.backgroundColor;
        context.fillRect(rect.x, rect.y, rect.width, rect.height);

        context.save();

        var paddingLeft = theme.paddingLeft;

        context.translate(paddingLeft - 0.5, -0.5);

        var layoutManager = this.editor.layoutManager;
        var range = layoutManager.characterRangeForBoundingRect(rect);
        var endRow = Math.min(range.end.row,
            layoutManager.textLines.length - 1);
        var lineAscent = layoutManager.fontDimension.lineAscent;

        var decorations = this._loadedDecorations(true);
        var decorationWidths = [];
        for (var i = 0; i < decorations.length; i++) {
            decorationWidths.push(decorations[i].computeWidth(this));
        }

        for (var row = range.start.row; row <= endRow; row++) {
            context.save();

            var rowY = layoutManager.lineRectForRow(row).y;
            context.translate(0, rowY);

            for (var i = 0; i < decorations.length; i++) {
                decorations[i].drawDecoration(this, context, lineAscent, row);
                context.translate(decorationWidths[i] + this._decorationSpacing, 0);
            }
            context.restore();
        }

        context.restore();
    },

    computeWidth: function() {
        var theme = this.editor.themeData.gutter;
        var width = theme.paddingLeft + theme.paddingRight;

        var decorations = this._loadedDecorations(true);
        for (var i = 0; i < decorations.length; i++) {
            width += decorations[i].computeWidth(this);
        }

        width += (decorations.length - 1) * this._decorationSpacing;
        return width;
    },

    _click: function(evt) {
        var point = {x: evt.layerX, y: evt.layerY};
        if (rect.pointInRect(point, this.frame)) {
            var deco = this._decorationAtPoint(point);
            if (deco && ('selected' in deco)) {
                var computedPoint = this.computeWithClippingFrame(point.x, point.y);
                var pos = this.editor.layoutManager.characterAtPoint(computedPoint);
                deco.selected(this, pos.row);
            }
        }
    },

    _loadedDecorations: function(invalidateOnLoaded) {
        var decorations = [];
        var extensions = catalog.getExtensions('gutterDecoration');
        for (var i = 0; i < extensions.length; i++) {
            var promise = extensions[i].load();
            if (promise.isResolved()) {
                promise.then(decorations.push.bind(decorations));
            } else if (invalidateOnLoaded) {
                promise.then(this.invalidate.bind(this));
            }
        }
        return decorations;
    },

    _decorationAtPoint: function(point) {
        var theme = this.editor.themeData.gutter;
        var width = theme.paddingLeft + theme.paddingRight;
        if (point.x > theme.paddingLeft) {
            var decorations = this._loadedDecorations(false);
            var pos = theme.paddingLeft;
            for (var i = 0; i < decorations.length; i++) {
                var deco = decorations[i];
                var w = deco.computeWidth(this);
                if (point.x < pos + w) {
                    return deco;
                }
                pos += w + this._decorationSpacing;
            }
        }
        return null;
    }
});

exports.lineNumbers = {
    drawDecoration: function(gutter, context, lineAscent, row) {
        var editor = gutter.editor;
        var theme = editor.themeData.gutter;
        var layoutManager = editor.layoutManager;

        context.fillStyle = theme.color;
        context.font = editor.font;
        context.fillText('' + (row + 1), 0, lineAscent);
    },

    computeWidth: function(gutter) {
        var layoutManager = gutter.editor.layoutManager;
        var lineCountStr = '' + layoutManager.textLines.length;
        var characterWidth = layoutManager.fontDimension.characterWidth;
        return characterWidth * lineCountStr.length;
    }
};

});

bespin.tiki.module("text_editor:views/editor",function(require,exports,module) {
/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Bespin.
 *
 * The Initial Developer of the Original Code is
 * Mozilla.
 * Portions created by the Initial Developer are Copyright (C) 2009
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Bespin Team (bespin@mozilla.com)
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

var rangeutils = require('rangeutils:utils/range');
var scroller = require('views/scroller');
var util = require('bespin:util/util');

var Buffer = require('models/buffer').Buffer;
var CompletionController = require('completion:controller').
    CompletionController;
var EditorSearchController = require('controllers/search').
    EditorSearchController;
var EditorUndoController = require('controllers/undo').EditorUndoController;
var Event = require('events').Event;
var GutterView = require('views/gutter').GutterView;
var LayoutManager = require('controllers/layoutmanager').LayoutManager;
var ScrollerView = scroller.ScrollerCanvasView;
var TextView = require('views/text').TextView;

var _ = require('underscore')._;
var catalog = require('bespin:plugins').catalog;
var keyboardManager = require('keyboard:keyboard').keyboardManager;
var settings = require('settings').settings;

// Caches the theme data for the entire editor (editor, highlighter, and
// gutter).
var editorThemeData = {};

function computeThemeData(themeManager) {
    var plugin = catalog.plugins['text_editor'];
    var provides = plugin.provides;
    var i = provides.length;
    var themeData = {};

    // If a themeManager was passed, try to access the themeData for the
    // `text_editor` plugin.
    if (themeManager) {
        var themestyles = themeManager.themestyles;

        if (themestyles.currentThemeVariables &&
                themestyles.currentThemeVariables['text_editor']) {
            themeData = themestyles.currentThemeVariables['text_editor'];
        }
    }

    while (i--) {
        if (provides[i].ep === 'themevariable') {
            var value = util.mixin(util.clone(provides[i].defaultValue),
                                        themeData[provides[i].name]);

            switch (provides[i].name) {
                case 'gutter':
                case 'editor':
                case 'scroller':
                case 'highlighterFG':
                case 'highlighterBG':
                    editorThemeData[provides[i].name] = value;
            }
        }
    }
}

// Compute the themeData to make sure there is one when the editor comes up.
computeThemeData();

catalog.registerExtension('themeChange', {
    pointer: computeThemeData
});

/**
 * @class
 *
 * A view responsible for laying out a scrollable text view and its associated
 * gutter view, as well as maintaining a layout manager.
 */
exports.EditorView = function(initialContent) {
    this.elementAppended = new Event();

    this.element = this.container = document.createElement("div");

    var container = this.container;
    container.style.overflow = 'visible';
    container.style.position = 'relative';

    this.scrollOffsetChanged = new Event();
    this.willChangeBuffer = new Event();

    this.selectionChanged = new Event();
    this.textChanged = new Event();

    var gutterView = this.gutterView = new GutterView(container, this);
    var textView = this.textView = new TextView(container, this);
    var verticalScroller = new ScrollerView(this, scroller.LAYOUT_VERTICAL);
    var horizontalScroller = new ScrollerView(this,
        scroller.LAYOUT_HORIZONTAL);
    this.verticalScroller = verticalScroller;
    this.horizontalScroller = horizontalScroller;

    this.completionController = new CompletionController(this);
    this.editorUndoController = new EditorUndoController(this);
    this.searchController = new EditorSearchController(this);

    this._textViewSize = this._oldSize = { width: 0, height: 0 };

    this._themeData = editorThemeData;

    // Create a buffer for the editor and use initialContent as the initial
    // content for the textStorage object.
    this.buffer = new Buffer(null, initialContent);

    // Create all the necessary stuff once the container has been added.
    this.elementAppended.add(function() {
        // Set the font property.
        var fontSize = settings.get('fontsize');
        var fontFace = settings.get('fontface');
        this._font = fontSize + 'px ' + fontFace;

        // Repaint when the theme changes.
        catalog.registerExtension('themeChange', {
            pointer: this._themeVariableChange.bind(this)
        });

        // When the font changes, set our local font property, and repaint.
        catalog.registerExtension('settingChange', {
            match: "font[size|face]",
            pointer: this._fontSettingChanged.bind(this)
        });

        // Likewise when the dimensions change.
        catalog.registerExtension('dimensionsChanged', {
            pointer: this.dimensionsChanged.bind(this)
        });

        // Allow the layout to be recomputed.
        this._dontRecomputeLayout = false;
        this._recomputeLayout();

        var wheelEvent = util.isMozilla ? 'DOMMouseScroll' : 'mousewheel';
        container.addEventListener(wheelEvent, this._onMouseWheel.bind(this),
            false);

        verticalScroller.valueChanged.add(function(value) {
            this.scrollOffset = { y: value };
        }.bind(this));

        horizontalScroller.valueChanged.add(function(value) {
            this.scrollOffset = { x: value };
        }.bind(this));

        this.scrollOffsetChanged.add(function(offset) {
            this._updateScrollOffsetChanged(offset);
        }.bind(this));
    }.bind(this));
};


exports.EditorView.prototype = {
    elementAppended: null,

    textChanged: null,
    selectionChanged: null,

    scrollOffsetChanged: null,
    willChangeBuffer: null,

    _textViewSize: null,

    _textLinesCount: 0,
    _gutterViewWidth: 0,
    _oldSize: null,

    _buffer: null,

    _dontRecomputeLayout: true,

    _themeData: null,

    _layoutManagerSizeChanged: function(size) {
        var fontDimension = this.layoutManager.fontDimension;
        this._textViewSize = {
            width: size.width * fontDimension.characterWidth,
            height: size.height * fontDimension.lineHeight
        };

        if (this._textLinesCount !== size.height) {
            var gutterWidth = this.gutterView.computeWidth();
            if (gutterWidth !== this._gutterViewWidth) {
                this._recomputeLayout(true /* force layout update */);
            } else {
                this.gutterView.invalidate();
            }
            this._textLinesLength = size.height;
        }

        // Clamp the current scrollOffset position.
        this._updateScrollers();
        this.scrollOffset = {};
    },

    _updateScrollers: function() {
        // Don't change anything on the scrollers until the layout is setup.
        if (this._dontRecomputeLayout) {
            return;
        }

        var frame = this.textViewPaddingFrame;
        var width = this._textViewSize.width;
        var height = this._textViewSize.height;
        var scrollOffset = this.scrollOffset;
        var verticalScroller = this.verticalScroller;
        var horizontalScroller = this.horizontalScroller;

        if (height < frame.height) {
            verticalScroller.isVisible = false;
        } else {
            verticalScroller.isVisible = true;
            verticalScroller.proportion = frame.height / height;
            verticalScroller.maximum = height - frame.height;
            verticalScroller.value = scrollOffset.y;
        }

        if (width < frame.width) {
            horizontalScroller.isVisible = false;
        } else {
            horizontalScroller.isVisible = true;
            horizontalScroller.proportion = frame.width / width;
            horizontalScroller.maximum = width - frame.width;
            horizontalScroller.value = scrollOffset.x;
        }
    },

    _onMouseWheel: function(evt) {
        var delta = 0;
        if (evt.wheelDelta) {
            delta = -evt.wheelDelta;
        } else if (evt.detail) {
            delta = evt.detail * 40;
        }

        var isVertical = true;
        if (evt.axis) { // Firefox 3.1 world
            if (evt.axis == evt.HORIZONTAL_AXIS) isVertical = false;
        } else if (evt.wheelDeltaY || evt.wheelDeltaX) {
            if (evt.wheelDeltaX == evt.wheelDelta) isVertical = false;
        } else if (evt.shiftKey) isVertical = false;

        if (isVertical) {
            this.scrollBy(0, delta);
        } else {
            this.scrollBy(delta * 5, 0);
        }

        util.stopEvent(evt);
    },

    scrollTo: function(pos) {
        this.scrollOffset = pos;
    },

    scrollBy: function(deltaX, deltaY) {
        this.scrollOffset = {
            x: this.scrollOffset.x + deltaX,
            y: this.scrollOffset.y + deltaY
        };
    },

    _recomputeLayout: function(forceLayout) {
        // This is necessary as _recomputeLayout is called sometimes when the
        // size of the container is not yet ready (because of FlexBox).
        if (this._dontRecomputeLayout) {
            return;
        }

        var width = this.container.offsetWidth;
        var height = this.container.offsetHeight;

        // Don't recompute unless the size actually changed.
        if (!forceLayout && width == this._oldSize.width
                                    && height == this._oldSize.height) {
            return;
        }

        this._oldSize = {
            width: width,
            height: height
        };

        var gutterWidth = this.gutterView.computeWidth();
        this._gutterViewWidth = gutterWidth;

        this.gutterView.frame = {
            x: 0,
            y: 0,
            width: gutterWidth,
            height: height
        };

        this.textView.frame = {
            x: gutterWidth,
            y: 0,
            width: width - gutterWidth,
            height: height
        };

        // TODO: Get these values from the scroller theme.
        var scrollerPadding = this._themeData.scroller.padding;
        var scrollerSize = this._themeData.scroller.thickness;

        this.horizontalScroller.frame = {
            x: gutterWidth + scrollerPadding,
            y: height - (scrollerSize + scrollerPadding),
            width: width - (gutterWidth + 2 * scrollerPadding + scrollerSize),
            height: scrollerSize
        };

        this.verticalScroller.frame = {
            x: width - (scrollerPadding + scrollerSize),
            y: scrollerPadding,
            width: scrollerSize,
            height: height - (2 * scrollerPadding + scrollerSize)
        };

        // Calls the setter scrollOffset which then clamps the current
        // scrollOffset as needed.
        this.scrollOffset = {};

        this._updateScrollers();
        this.gutterView.invalidate();
        this.textView.invalidate();
        this.verticalScroller.invalidate();
        this.horizontalScroller.invalidate();
    },

    dimensionsChanged: function() {
        this._recomputeLayout();
    },

    /**
     * @property{string}
     *
     * The font to use for the text view and the gutter view. Typically, this
     * value is set via the font settings.
     */
    _font: null,

    _fontSettingChanged: function() {
        var fontSize = settings.get('fontsize');
        var fontFace = settings.get('fontface');
        this._font = fontSize + 'px ' + fontFace;

        // Recompute the layouts.
        this.layoutManager._recalculateMaximumWidth();
        this._layoutManagerSizeChanged(this.layoutManager.size);
        this.textView.invalidate();
    },

    _themeVariableChange: function() {
        // Recompute the entire layout as the gutter might now have a different
        // size. Just calling invalidate() on the gutter wouldn't be enough.
        this._recomputeLayout(true);
    },

    _updateScrollOffsetChanged: function(offset) {
        this.verticalScroller.value = offset.y;
        this.horizontalScroller.value = offset.x;

        this.textView.clippingFrame = { x: offset.x, y: offset.y };

        this.gutterView.clippingFrame = { y: offset.y };

        this._updateScrollers();
        this.gutterView.invalidate();
        this.textView.invalidate();
    },

    /**
     * The text view uses this function to forward key events to the keyboard
     * manager. The editor view is used as a middleman so that it can append
     * predicates as necessary.
     */
    processKeyEvent: function(evt, sender, preds) {
        preds = _(preds).clone();
        preds.completing = this.completionController.isCompleting();
        return keyboardManager.processKeyEvent(evt, sender, preds);
    },

    /**
     * Converts a point in the coordinate system of the document being edited
     * (i.e. of the text view) to the coordinate system of the editor (i.e. of
     * the DOM component containing Bespin).
     */
    convertTextViewPoint: function(pt) {
        var scrollOffset = this.scrollOffset;
        return {
            x: pt.x - scrollOffset.x + this._gutterViewWidth,
            y: pt.y - scrollOffset.y
        };
    },

    // ------------------------------------------------------------------------
    // Helper API:

    /**
     * Replaces the text within a range, as an undoable action.
     *
     * @param {Range} range The range to replace.
     * @param {string} newText The text to insert.
     * @param {boolean} keepSelection True if the selection should be
     *     be preserved, otherwise the cursor is set after newText.
     * @return Returns true if the replacement completed successfully,
     *     otherwise returns false.
     */
    replace: function(range, newText, keepSelection) {
        if (!rangeutils.isRange(range)) {
            throw new Error('replace(): expected range but found "' + range +
                "'");
        }
        if (!util.isString(newText)) {
            throw new Error('replace(): expected text string but found "' +
                text + '"');
        }

        var normalized = rangeutils.normalizeRange(range);

        var view = this.textView;
        var oldSelection = view.getSelectedRange(false);
        return view.groupChanges(function() {
            view.replaceCharacters(normalized, newText);
            if (keepSelection) {
                view.setSelection(oldSelection);
            } else {
                var lines = newText.split('\n');

                var destPosition;
                if (lines.length > 1) {
                    destPosition = {
                        row: range.start.row + lines.length - 1,
                        col: lines[lines.length - 1].length
                    };
                } else {
                    destPosition = rangeutils.addPositions(range.start,
                        { row: 0, col: newText.length });
                }
                view.moveCursorTo(destPosition);
            }
        });
    },

    getText: function(range) {
        if (!rangeutils.isRange(range)) {
            throw new Error('getText(): expected range but found "' + range +
                '"');
        }

        var textStorage = this.layoutManager.textStorage;
        return textStorage.getCharacters(rangeutils.normalizeRange(range));
    },

    /** Scrolls and moves the insertion point to the given line number. */
    setLineNumber: function(lineNumber) {
        if (!util.isNumber(lineNumber)) {
            throw new Error('setLineNumber(): lineNumber must be a number');
        }

        var newPosition = { row: lineNumber - 1, col: 0 };
        this.textView.moveCursorTo(newPosition);
    },

    /** Sets the position of the cursor. */
    setCursor: function(newPosition) {
        if (!rangeutils.isPosition(newPosition)) {
            throw new Error('setCursor(): expected position but found "' +
                newPosition + '"');
        }

        this.textView.moveCursorTo(newPosition);
    },

    /**
     * Group changes so that they are only one undo/redo step.
     * Returns true if the changes were successful.
     */
    changeGroup: function(func) {
        return this.textView.groupChanges(function() {
            func(this);
        }.bind(this));
    },

    /**
     * Adds the supplied tags to the completion manager.
     */
    addTags: function(newTags) {
        this.completionController.tags.add(newTags);
    }
};

Object.defineProperties(exports.EditorView.prototype, {
    themeData: {
        get: function() {
            return this._themeData;
        },

        set: function() {
            throw new Error('themeData can\'t be changed directly.' +
                                ' Use themeManager.');
        }
    },

    font: {
        get: function() {
            return this._font;
        },

        set: function() {
            throw new Error('font can\'t be changed directly.' +
                    ' Use settings fontsize and fontface.');
        }
    },

    buffer: {
        /**
         * Sets a new buffer.
         * The buffer's file has to be loaded when passing to this setter.
         */
        set: function(newBuffer) {
            if (newBuffer === this._buffer) {
                return;
            }

            if (!newBuffer.loadPromise.isResolved()) {
                throw new Error('buffer.set(): the new buffer must first be ' +
                    'loaded!');
            }

            // Was there a former buffer? If yes, then remove some events.
            if (this._buffer !== null) {
                this.layoutManager.sizeChanged.remove(this);
                this.layoutManager.textStorage.changed.remove(this);
                this.textView.selectionChanged.remove(this);
            }

            this.willChangeBuffer(newBuffer);
            catalog.publish(this, 'editorChange', 'buffer', newBuffer);

            this.layoutManager = newBuffer.layoutManager;
            this._buffer = newBuffer;

            var lm = this.layoutManager;
            var tv = this.textView;

            // Watch out for changes to the layoutManager's internal size.
            lm.sizeChanged.add(this,
                this._layoutManagerSizeChanged.bind(this));

            // Map internal events so that developers can listen much easier.
            lm.textStorage.changed.add(this, this.textChanged.bind(this));
            tv.selectionChanged.add(this, this.selectionChanged.bind(this));

            this.textView.setSelection(newBuffer._selectedRange, false);
            this.scrollOffsetChanged(newBuffer._scrollOffset);

            // The layoutManager changed and its size as well. Call the
            // layoutManager.sizeChanged event manually.
            this.layoutManager.sizeChanged(this.layoutManager.size);

            this._recomputeLayout();
        },

        get: function() {
            return this._buffer;
        }
    },

    frame: {
        get: function() {
            return {
                width: this.container.offsetWidth,
                height: this.container.offsetHeight
            };
        }
    },

    textViewPaddingFrame: {
        get: function() {
            var frame = util.clone(this.textView.frame);
            var padding = this.textView.padding;

            frame.width -= padding.left + padding.right;
            frame.height -= padding.top + padding.bottom;
            return frame;
        }
    },

    scrollOffset: {
        set: function(pos) {
            if (pos.x === undefined) pos.x = this.scrollOffset.x;
            if (pos.y === undefined) pos.y = this.scrollOffset.y;

            var frame = this.textViewPaddingFrame;

            if (pos.y < 0) {
                pos.y = 0;
            } else if (this._textViewSize.height < frame.height) {
                pos.y = 0;
            } else if (pos.y + frame.height > this._textViewSize.height) {
                pos.y = this._textViewSize.height - frame.height;
            }

            if (pos.x < 0) {
                pos.x = 0;
            } else if (this._textViewSize.width < frame.width) {
                pos.x = 0;
            } else if (pos.x + frame.width > this._textViewSize.width) {
                pos.x = this._textViewSize.width - frame.width;
            }

            if (pos.x === this.scrollOffset.x && pos.y === this.scrollOffset.y) {
                return;
            }

            this.buffer._scrollOffset = pos;

            this.scrollOffsetChanged(pos);
            catalog.publish(this, 'editorChange', 'scrollOffset', pos);
        },

        get: function() {
            return this.buffer._scrollOffset;
        }
    },

    // -------------------------------------------------------------------------
    // Helper API:

    readOnly: {
        get: function() {
            return this._buffer.model.readOnly;
        },

        set: function(newValue) {
            this._buffer.model.readOnly = newValue;
        }
    },

    focus: {
        get: function() {
            return this.textView.hasFocus;
        },

        set: function(setFocus) {
            if (!util.isBoolean(setFocus)) {
                throw new Error('set focus: expected boolean but found "' +
                                    setFocus + '"');
            }
            this.textView.hasFocus = setFocus;
        }
    },

    selection: {
        /** Returns the currently-selected range. */
        get: function() {
            return util.clone(this.textView.getSelectedRange(false));
        },

        /** Alters the selection. */
        set: function(newSelection) {
            if (!rangeutils.isRange(newSelection)) {
                throw new Error('set selection: position/selection' +
                                    ' must be supplied');
            }

            this.textView.setSelection(newSelection);
        }
    },

    selectedText: {
        /** Returns the text within the given range. */
        get: function() {
            return this.getText(this.selection);
        },

        /** Replaces the current text selection with the given text. */
        set: function(newText) {
            if (!util.isString(newText)) {
                throw new Error('set selectedText: expected string but' +
                    ' found "' + newText + '"');
            }

            return this.replace(this.selection, newText);
        }
    },

    value: {
        /** Returns the current text. */
        get: function() {
            return this.layoutManager.textStorage.value;
        },

        set: function(newValue) {
            if (!util.isString(newValue)) {
                throw new Error('set value: expected string but found "' +
                                        newValue + '"');
            }

            // Use the replace function and not this.model.value = newValue
            // directly as this wouldn't create a new undoable action.
            return this.replace(this.layoutManager.textStorage.range,
                                        newValue, false);
        }
    },

    syntax: {
        /**
         * Returns the initial syntax highlighting context (i.e. the language).
         */
        get: function(newSyntax) {
            return this.layoutManager.syntaxManager.getSyntax();
        },

        /**
         * Sets the initial syntax highlighting context (i.e. the language).
         */
        set: function(newSyntax) {
            if (!util.isString(newSyntax)) {
                throw new Error('set syntax: expected string but found "' +
                                        newValue + '"');
            }

            return this.layoutManager.syntaxManager.setSyntax(newSyntax);
        }
    }
});

});

bespin.tiki.module("text_editor:views/textinput",function(require,exports,module) {
/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Bespin.
 *
 * The Initial Developer of the Original Code is
 * Mozilla.
 * Portions created by the Initial Developer are Copyright (C) 2009
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Bespin Team (bespin@mozilla.com)
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

var util = require('bespin:util/util');
var Event = require('events').Event;
var Range = require('rangeutils:utils/range');

var KeyUtil = require('keyboard:keyutil');

/**
 * @namespace
 *
 * This class provides a hidden text input to provide events similar to those
 * defined in the DOM Level 3 specification. It allows views to support
 * internationalized text input via non-US keyboards, dead keys, and/or IMEs.
 * It also provides support for copy and paste. Currently, an invisible
 * textarea is used, but in the future this module should use
 * DOM 3 TextInput events directly where available.
 *
 * To use this class, instantiate it and provide the optional functions
 *   - copy: function() { return 'text for clipboard' }
 *   - cut: function() { 'Cut some text'; return 'text for clipboard'}
 *   - textInserted: function(newInsertedText) { 'handle new inserted text'; }
 * Note: Pasted text is provided through the textInserted(pastedText) function.
 *
 * You can also provide an DOM node to take focus from by providing the optional
 * "takeFocusFrom" parameter.
 *
 * The DOM node created for text input is in the "domNode" attribute
 * and that caller should add the DOM node to the document in the appropriate
 * place.
 */
exports.TextInput = function(container, delegate) {
    var domNode = this.domNode = document.createElement('textarea');
    domNode.setAttribute('style', 'position: absolute; z-index: -99999; ' +
         'width: 0px; height: 0px; margin: 0px; outline: none; border: 0;');
         // 'z-index: 100; top: 20px; left: 20px; width: 50px; ' +
         // 'height: 50px');

    container.appendChild(domNode);
    this.delegate = delegate;
    this._attachEvents();
};

exports.TextInput.prototype = {
    _composing: false,

    domNode: null,

    delegate: null,

    // This function doesn't work on WebKit! The textContent comes out empty...
    _textFieldChanged: function() {
        if (this._composing || this._ignore) {
            return;
        }

        var textField = this.domNode;
        var text = textField.value;
        // On FF textFieldChanged is called sometimes although nothing changed.
        // -> don't call textInserted() in such a case.
        if (text == '') {
            return;
        }
        textField.value = '';

        this._textInserted(text);
    },

    _copy: function() {
        var copyData = false;
        var delegate = this.delegate;
        if (delegate && delegate.copy) {
            copyData = delegate.copy();
        }
        return copyData;
    },

    _cut: function() {
        var cutData = false;
        var delegate = this.delegate;
        if (delegate && delegate.cut) {
            cutData = delegate.cut();
        }
        return cutData;
    },

    _textInserted: function(text) {
        var delegate = this.delegate;
        if (delegate && delegate.textInserted) {
            delegate.textInserted(text);
        }
    },

    _setValueAndSelect: function(text) {
        var textField = this.domNode;
        textField.value = text;
        textField.select();
    },

    /**
     * Gives focus to the field editor so that input events will be
     * delivered to the view. If you override willBecomeKeyResponderFrom(),
     * you should call this function in your implementation.
     */
    focus: function() {
        this.domNode.focus();
    },

    /**
     * Removes focus from the invisible text input so that input events are no
     * longer delivered to this view. If you override willLoseKeyResponderTo(),
     * you should call this function in your implementation.
     */
     blur: function() {
        this.domNode.blur();
    },

    /**
     * Attaches notification listeners to the text field so that your view will
     * be notified of events. If you override this method, you should call
     * that function as well.
     */
    _attachEvents: function() {
        var textField = this.domNode, self = this;

        // Listen focus/blur event.
        textField.addEventListener('focus', function(evt) {
            if (self.delegate && self.delegate.didFocus) {
                self.delegate.didFocus();
            }
        }, false);
        textField.addEventListener('blur', function(evt) {
            if (self.delegate && self.delegate.didBlur) {
                self.delegate.didBlur();
            }
        }, false);

        KeyUtil.addKeyDownListener(textField, function(evt) {
            if (self.delegate && self.delegate.keyDown) {
                return self.delegate.keyDown(evt);
            } else {
                return false;
            }
        });

        // No way that I can see around this ugly browser sniffing, without
        // more complicated hacks. No browsers have a complete enough
        // implementation of DOM 3 events at the current time (12/2009). --pcw
        if (util.isWebKit) {    // Chrome too
            // On Chrome the compositionend event is fired as well as the
            // textInput event, but only one of them has to be handled.
            if (!util.isChrome) {
                textField.addEventListener('compositionend', function(evt) {
                    self._textInserted(evt.data);
                }, false);
            }
            textField.addEventListener('textInput', function(evt) {
                self._textInserted(evt.data);
            }, false);
            textField.addEventListener('paste', function(evt) {
                self._textInserted(evt.clipboardData.
                    getData('text/plain'));
                evt.preventDefault();
            }, false);
        // This is Firefox only at the moment.
        } else {
            textField.addEventListener('input', function(evt) {
                self._textFieldChanged();
            }, false);

            textField.addEventListener('compositionstart', function(evt) {
                self._composing = true;
            }, false);
            textField.addEventListener('compositionend', function(evt) {
                self._composing = false;
                self._textFieldChanged();
            }, false);

            textField.addEventListener('paste', function(evt) {
                // FIXME: This is ugly and could result in extraneous text
                // being included as part of the text if extra DOMNodeInserted
                // or DOMCharacterDataModified events happen to be in the queue
                // when this function runs. But until Fx supports TextInput
                // events, there's nothing better we can do.

                // Waits till the paste content is pasted to the textarea.
                // Sometimes a delay of 0 is too short for Fx. In such a case
                // the keyUp events occur a little bit later and the pasted
                // content is detected there.
                self._setValueAndSelect('');
                window.setTimeout(function() {
                    self._textFieldChanged();
                }, 0);
            }, false);

            // Fix for bug 583638.
            // Copy and cut is only performed on Mozilla as of changest
            //   http://hg.mozilla.org/mozilla-central/rev/27259a0fcbe6
            // if some text is selected. The following code ensures that this is
            // the case. The code hocks to the `selectionChanged` event of the
            // `delegate` object (which is the textView) and sets and selects
            // some text if there is a selection in the Bespin Editor. This
            // 'enables' copy and cut.
            var wasSelectionBefore = false;
            this.delegate.selectionChanged.add(function(newRange) {
                if (Range.isZeroLength(newRange)) {
                    if (wasSelectionBefore) {
                        textField.value = "";
                    }
                    wasSelection = false;
                } else {
                    if (!wasSelectionBefore) {
                        textField.value = "z";
                        textField.select();
                    }
                    wasSelection = true;
                }
            }.bind(this));
        }

        // Here comes the code for copy and cut...

        // This is the basic copy and cut function. Depending on the
        // OS and browser this function needs to be extended.
        var copyCutBaseFn = function(evt) {
            // Get the data that should be copied/cutted.
            var copyCutData = evt.type.indexOf('copy') != -1 ?
                            self._copy() :
                            self._cut();
            // Set the textField's value equal to the copyCutData.
            // After this function is called, the real copy or cut
            // event takes place and the selected text in the
            // textField is pushed to the OS's clipboard.
            self._setValueAndSelect(copyCutData);
        };

        // For all browsers that are not Safari running on Mac.
        if (!(util.isWebKit && !util.isChrome && util.isMac)) {
            var copyCutMozillaFn = false;
            if (util.isMozilla) {
                // If the browser is Mozilla like, the copyCut function has to
                // be extended.
                copyCutMozillaFn = function(evt) {
                    // Call the basic copyCut function.
                    copyCutBaseFn(evt);

                    self._ignore = true;
                    window.setTimeout(function() {
                        self._setValueAndSelect('');
                        self._ignore = false;
                    }, 0);
                };
            }
            textField.addEventListener('copy', copyCutMozillaFn ||
                copyCutBaseFn, false);
            textField.addEventListener('cut',  copyCutMozillaFn ||
                copyCutBaseFn, false);
         } else {
            // For Safari on Mac (only!) the copy and cut event only occurs if
            // you have some text selected. Fortunately, the beforecopy and
            // beforecut event occurs before the copy or cut event does so we
            // can put the to be copied or cutted text in the textarea.

            // Also, the cut event is fired twice. If it's fired twice within a
            // certain time period, the second call will be skipped.
            var lastCutCall = new Date().getTime();
            var copyCutSafariMacFn = function(evt) {
                var doCut = evt.type.indexOf('cut') != -1;
                if (doCut && new Date().getTime() - lastCutCall < 10) {
                    return;
                }

                // Call the basic copyCut function.
                copyCutBaseFn(evt);

                if (doCut) {
                    lastCutCall = new Date().getTime();
                }
            };

            textField.addEventListener('beforecopy', copyCutSafariMacFn,
                false);
            textField.addEventListener('beforecut',  copyCutSafariMacFn,
                false);
        }
    }
};


});

bespin.tiki.module("text_editor:views/scroller",function(require,exports,module) {
/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Bespin.
 *
 * The Initial Developer of the Original Code is
 * Mozilla.
 * Portions created by the Initial Developer are Copyright (C) 2009
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Bespin Team (bespin@mozilla.com)
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

var util = require('bespin:util/util');
var Event = require('events').Event;
var console = require('bespin:console').console;

var Rect = require('utils/rect');

var CanvasView = require('views/canvas').CanvasView;

var LINE_HEIGHT                 = 15;
var MINIMUM_HANDLE_SIZE         = 20;
var NIB_ARROW_PADDING_BEFORE    = 3;
var NIB_ARROW_PADDING_AFTER     = 5;
var NIB_LENGTH                  = 15;
var NIB_PADDING                 = 8;    // 15/2

var LAYOUT_HORIZONTAL = exports.LAYOUT_HORIZONTAL = 0;
var LAYOUT_VERTICAL = exports.LAYOUT_VERTICAL = 1;

exports.ScrollerCanvasView = function(editor, layoutDirection) {
    CanvasView.call(this, editor.container, false /* preventDownsize */,
        true /* clearOnFullInvalid */);
    this.editor = editor;
    this.layoutDirection = layoutDirection;

    var on = function(eventName, func, target) {
        target = target || this.domNode;
        target.addEventListener(eventName, function(evt) {
            func.call(this, evt);
            util.stopEvent(evt);
        }.bind(this), false);
    }.bind(this);

    on('mouseover', this.mouseEntered);
    on('mouseout', this.mouseExited);
    on('mousedown', this.mouseDown);
    // Bind the following events to the window as we want to catch them
    // even when the mouse is outside of the scroller.
    on('mouseup', this.mouseUp, window);
    on('mousemove', this.mouseMove, window);

    this.valueChanged = new Event();
};

exports.ScrollerCanvasView.prototype = new CanvasView();

util.mixin(exports.ScrollerCanvasView.prototype, {
    lineHeight: 20,

    proportion: 0,

    /**
     * @property
     * Specifies the direction of the scroll bar: one of LAYOUT_HORIZONTAL
     * or LAYOUT_VERTICAL.
     *
     * Changes to this value after the view has been created have no effect.
     */
    layoutDirection: LAYOUT_VERTICAL,

    _isVisible: false,

    _maximum: 0,

    _value: 0,

    valueChanged: null,

    /**
     * @property
     * The dimensions of transparent space inside the frame, given as an object
     * with 'left', 'bottom', 'top', and 'right' properties.
     *
     * Note that the scrollerThickness property includes the padding on the
     * sides of the bar.
     */
    padding: { left: 0, bottom: 0, top: 0, right: 0 },

    _mouseDownScreenPoint: null,
    _mouseDownValue: null,
    _isMouseOver: false,
    _scrollTimer: null,
    _mouseEventPosition: null,
    _mouseOverHandle: false,

    _drawNib: function(ctx, alpha) {
        var theme = this.editor.themeData.scroller;
        var fillStyle, arrowStyle, strokeStyle;

        fillStyle   = theme.nibStyle;
        arrowStyle  = theme.nibArrowStyle;
        strokeStyle = theme.nibStrokeStyle;

        var midpoint = Math.floor(NIB_LENGTH / 2);

        ctx.fillStyle = fillStyle;
        ctx.beginPath();
        ctx.arc(0, 0, Math.floor(NIB_LENGTH / 2), 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = strokeStyle;
        ctx.stroke();

        ctx.fillStyle = arrowStyle;
        ctx.beginPath();
        ctx.moveTo(0, -midpoint + NIB_ARROW_PADDING_BEFORE);
        ctx.lineTo(-midpoint + NIB_ARROW_PADDING_BEFORE,
            midpoint - NIB_ARROW_PADDING_AFTER);
        ctx.lineTo(midpoint - NIB_ARROW_PADDING_BEFORE,
            midpoint - NIB_ARROW_PADDING_AFTER);
        ctx.closePath();
        ctx.fill();
    },

    _drawNibs: function(ctx, alpha) {
        var thickness = this._getClientThickness();
        var parentView = this.parentView;
        var value = this._value;
        var maximum = this._maximum;
        var highlighted = this._isHighlighted();

        // Starting nib
        if (highlighted || value !== 0) {
            ctx.save();
            ctx.translate(NIB_PADDING, thickness / 2);
            ctx.rotate(Math.PI * 1.5);
            ctx.moveTo(0, 0);
            this._drawNib(ctx, alpha);
            ctx.restore();
        }

        // Ending nib
        if (highlighted || value !== maximum) {
            ctx.save();
            ctx.translate(this._getClientLength() - NIB_PADDING,
                thickness / 2);
            ctx.rotate(Math.PI * 0.5);
            ctx.moveTo(0, 0);
            this._drawNib(ctx, alpha);
            ctx.restore();
        }
    },

    // Returns the frame of the scroll bar, not counting any padding.
    _getClientFrame: function() {
        var frame = this.frame;
        var padding = this.padding;
        return {
            x:      padding.left,
            y:      padding.top,
            width:  frame.width - (padding.left + padding.right),
            height: frame.height - (padding.top + padding.bottom)
        };
    },

    // Returns the length of the scroll bar, not counting any padding. Equal to
    // the width or height of the client frame, depending on the layout
    // direction.
    _getClientLength: function() {
        var clientFrame = this._getClientFrame();
        switch (this.layoutDirection) {
        case LAYOUT_HORIZONTAL:
            return clientFrame.width;
        case LAYOUT_VERTICAL:
            return clientFrame.height;
        default:
            console.error("unknown layout direction");
            return null;
        }
    },

    // Returns the thickness of the scroll bar, not counting any padding.
    _getClientThickness: function() {
        var padding = this.padding;
        var scrollerThickness = this.editor.themeData.scroller.thickness;

        switch (this.layoutDirection) {
        case LAYOUT_VERTICAL:
            return scrollerThickness - (padding.left + padding.right);
        case LAYOUT_HORIZONTAL:
            return scrollerThickness - (padding.top + padding.bottom);
        default:
            console.error("unknown layout direction");
            return null;
        }
    },

    // The length of the scroll bar, counting the padding. Equal to frame.width
    // or frame.height, depending on the layout direction of the bar.
    // Read-only.
    _getFrameLength: function() {
        switch (this.layoutDirection) {
        case LAYOUT_HORIZONTAL:
            return this.frame.width;
        case LAYOUT_VERTICAL:
            return this.frame.height;
        default:
            console.error("unknown layout direction");
            return null;
        }
    },

    // The dimensions of the gutter (the middle area between the buttons, which
    // contains the handle or knob).
    _getGutterFrame: function() {
        var clientFrame = this._getClientFrame();
        var thickness = this._getClientThickness();
        switch (this.layoutDirection) {
        case LAYOUT_VERTICAL:
            return {
                x:      clientFrame.x,
                y:      clientFrame.y + NIB_LENGTH,
                width:  thickness,
                height: Math.max(0, clientFrame.height - 2*NIB_LENGTH)
            };
        case LAYOUT_HORIZONTAL:
            return {
                x:      clientFrame.x + NIB_LENGTH,
                y:      clientFrame.y,
                width:  Math.max(0, clientFrame.width - 2*NIB_LENGTH),
                height: thickness
            };
        default:
            console.error("unknown layout direction");
            return null;
        }
    },

    // The length of the gutter, equal to gutterFrame.width or
    // gutterFrame.height depending on the scroll bar's layout direction.
    _getGutterLength: function() {
        var gutterFrame = this._getGutterFrame();
        var gutterLength;
        switch (this.layoutDirection) {
        case LAYOUT_HORIZONTAL:
            gutterLength = gutterFrame.width;
            break;
        case LAYOUT_VERTICAL:
            gutterLength = gutterFrame.height;
            break;
        default:
            console.error("unknown layout direction");
            break;
        }
        return gutterLength;
    },

    // Returns the dimensions of the handle or knob.
    _getHandleFrame: function() {
        var gutterFrame = this._getGutterFrame();
        var handleOffset = this._getHandleOffset();
        var handleLength = this._getHandleLength();
        switch (this.layoutDirection) {
        case LAYOUT_VERTICAL:
            return {
                x:      gutterFrame.x,
                y:      gutterFrame.y + handleOffset,
                width:  gutterFrame.width,
                height: handleLength
            };
        case LAYOUT_HORIZONTAL:
            return {
                x:      gutterFrame.x + handleOffset,
                y:      gutterFrame.y,
                width:  handleLength,
                height: gutterFrame.height
            };
        }
    },

    // Returns the length of the handle or knob.
    _getHandleLength: function() {
        var gutterLength = this._getGutterLength();
        return Math.max(gutterLength * this.proportion, MINIMUM_HANDLE_SIZE);
    },

    // Returns the starting offset of the handle or knob.
    _getHandleOffset: function() {
        var maximum = this._maximum;
        if (maximum === 0) {
            return 0;
        }

        var gutterLength = this._getGutterLength();
        var handleLength = this._getHandleLength();
        var emptyGutterLength = gutterLength - handleLength;

        return emptyGutterLength * this._value / maximum;
    },

    // Determines whether the scroll bar is highlighted.
    _isHighlighted: function() {
        return this._isMouseOver === true ||
            this._mouseDownScreenPoint !== null;
    },

    _segmentForMouseEvent: function(evt) {
        var point = { x: evt.layerX, y: evt.layerY };
        var clientFrame = this._getClientFrame();
        var padding = this.padding;

        if (!Rect.pointInRect(point, clientFrame)) {
            return null;
        }

        var layoutDirection = this.layoutDirection;
        switch (layoutDirection) {
        case LAYOUT_HORIZONTAL:
            if ((point.x - padding.left) < NIB_LENGTH) {
                return 'nib-start';
            } else if (point.x >= clientFrame.width - NIB_LENGTH) {
                return 'nib-end';
            }
            break;
        case LAYOUT_VERTICAL:
            if ((point.y - padding.top) < NIB_LENGTH) {
                return 'nib-start';
            } else if (point.y >= clientFrame.height - NIB_LENGTH) {
                return 'nib-end';
            }
            break;
        default:
            console.error("unknown layout direction");
            break;
        }

        var handleFrame = this._getHandleFrame();
        if (Rect.pointInRect(point, handleFrame)) {
            return 'handle';
        }

        switch (layoutDirection) {
        case LAYOUT_HORIZONTAL:
            if (point.x < handleFrame.x) {
                return 'gutter-before';
            } else if (point.x >= handleFrame.x + handleFrame.width) {
                return 'gutter-after';
            }
            break;
        case LAYOUT_VERTICAL:
            if (point.y < handleFrame.y) {
                return 'gutter-before';
            } else if (point.y >= handleFrame.y + handleFrame.height) {
                return 'gutter-after';
            }
            break;
        default:
            console.error("unknown layout direction");
            break;
        }

        console.error("_segmentForMouseEvent: point ", point,
            " outside view with handle frame ", handleFrame,
            " and client frame ", clientFrame);
        return null;
    },

    /**
     * Adjusts the canvas view's frame to match the parent container's frame.
     */
    adjustFrame: function() {
        var parentFrame = this.frame;
        this.set('layout', {
            left:   0,
            top:    0,
            width:  parentFrame.width,
            height: parentFrame.height
        });
    },

    drawRect: function(rect, ctx) {
        // Only draw when visible.
        if (!this._isVisible) {
            return;
        }

        var highlighted = this._isHighlighted();
        var theme = this.editor.themeData.scroller;
        var alpha = (highlighted) ? theme.fullAlpha : theme.particalAlpha;

        var frame = this.frame;
        ctx.clearRect(0, 0, frame.width, frame.height);

        // Begin master drawing context
        ctx.save();

        // Translate so that we're only drawing in the padding.
        var padding = this.padding;
        ctx.translate(padding.left, padding.top);

        var handleFrame = this._getHandleFrame();
        var gutterLength = this._getGutterLength();
        var thickness = this._getClientThickness();
        var halfThickness = thickness / 2;

        var layoutDirection = this.layoutDirection;
        var handleOffset = this._getHandleOffset() + NIB_LENGTH;
        var handleLength = this._getHandleLength();

        if (layoutDirection === LAYOUT_VERTICAL) {
            // The rest of the drawing code assumes the scroll bar is
            // horizontal. Create that fiction by installing a 90 degree
            // rotation.
            ctx.translate(thickness + 1, 0);
            ctx.rotate(Math.PI * 0.5);
        }

        if (gutterLength <= handleLength) {
            return; // Don't display the scroll bar.
        }

        ctx.globalAlpha = alpha;

        if (highlighted) {
            // Draw the scroll track rectangle.
            var clientLength = this._getClientLength();
            ctx.fillStyle = theme.trackFillStyle;
            ctx.fillRect(NIB_PADDING + 0.5, 0.5,
                clientLength - 2*NIB_PADDING, thickness - 1);
            ctx.strokeStyle = theme.trackStrokeStyle;
            ctx.strokeRect(NIB_PADDING + 0.5, 0.5,
                clientLength - 2*NIB_PADDING, thickness - 1);
        }

        var buildHandlePath = function() {
            ctx.beginPath();
            ctx.arc(handleOffset + halfThickness + 0.5,                 // x
                halfThickness,                                          // y
                halfThickness - 0.5, Math.PI / 2, 3 * Math.PI / 2, false);
            ctx.arc(handleOffset + handleLength - halfThickness - 0.5,  // x
                halfThickness,                                          // y
                halfThickness - 0.5, 3 * Math.PI / 2, Math.PI / 2, false);
            ctx.lineTo(handleOffset + halfThickness + 0.5, thickness - 0.5);
            ctx.closePath();
        };
        buildHandlePath();

        // Paint the interior of the handle path.
        var gradient = ctx.createLinearGradient(handleOffset, 0, handleOffset,
            thickness);
        gradient.addColorStop(0, theme.barFillGradientTopStart);
        gradient.addColorStop(0.4, theme.barFillGradientTopStop);
        gradient.addColorStop(0.41, theme.barFillStyle);
        gradient.addColorStop(0.8, theme.barFillGradientBottomStart);
        gradient.addColorStop(1, theme.barFillGradientBottomStop);
        ctx.fillStyle = gradient;
        ctx.fill();

        // Begin handle shine edge context
        ctx.save();
        ctx.clip();

        // Draw the little shines in the handle.
        ctx.fillStyle = theme.barFillStyle;
        ctx.beginPath();
        ctx.moveTo(handleOffset + halfThickness * 0.4, halfThickness * 0.6);
        ctx.lineTo(handleOffset + halfThickness * 0.9, thickness * 0.4);
        ctx.lineTo(handleOffset, thickness * 0.4);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(handleOffset + handleLength - (halfThickness * 0.4),
            0 + (halfThickness * 0.6));
        ctx.lineTo(handleOffset + handleLength - (halfThickness * 0.9),
            0 + (thickness * 0.4));
        ctx.lineTo(handleOffset + handleLength, 0 + (thickness * 0.4));
        ctx.closePath();
        ctx.fill();

        ctx.restore();
        // End handle border context

        // Begin handle outline context
        ctx.save();
        buildHandlePath();
        ctx.strokeStyle = theme.trackStrokeStyle;
        ctx.stroke();
        ctx.restore();
        // End handle outline context

        this._drawNibs(ctx, alpha);

        ctx.restore();
        // End master drawing context
    },

    _repeatAction: function(method, interval) {
        var repeat = method();
        if (repeat !== false) {
            var func = function() {
                this._repeatAction(method, 100);
            }.bind(this);
            this._scrollTimer = setTimeout(func, interval);
        }
    },

    _scrollByDelta: function(delta) {
        this.value = this._value + delta;
    },

    _scrollUpOneLine: function() {
        this._scrollByDelta(-this.lineHeight);
        return true;
    },

    _scrollDownOneLine: function() {
        this._scrollByDelta(this.lineHeight);
        return true;
    },

    /**
     * Scrolls the page depending on the last mouse position. Scrolling is only
     * performed if the mouse is on the segment gutter-before or -after.
     */
    _scrollPage: function() {
        switch (this._segmentForMouseEvent(this._mouseEventPosition)) {
            case 'gutter-before':
                this._scrollByDelta(this._getGutterLength() * -1);
            break;
            case 'gutter-after':
                this._scrollByDelta(this._getGutterLength());
            break;
            case null:
                // The mouse is outside of the scroller. Just wait, until it
                // comes back in.
            break;
            default:
                // Do not continue repeating this function.
                return false;
            break;
        }

        return true;
    },

    mouseDown: function(evt) {
        this._mouseEventPosition = evt;
        this._mouseOverHandle = false;

        var parentView = this.parentView;
        var value = this._value;
        var gutterLength = this._getGutterLength();

        switch (this._segmentForMouseEvent(evt)) {
        case 'nib-start':
            this._repeatAction(this._scrollUpOneLine.bind(this), 500);
            break;
        case 'nib-end':
            this._repeatAction(this._scrollDownOneLine.bind(this), 500);
            break;
        case 'gutter-before':
            this._repeatAction(this._scrollPage.bind(this), 500);
            break;
        case 'gutter-after':
            this._repeatAction(this._scrollPage.bind(this), 500);
            break;
        case 'handle':
            break;
        default:
            console.error("_segmentForMouseEvent returned an unknown value");
            break;
        }

        // The _mouseDownScreenPoint value might be needed although the segment
        // was not the handle at the moment.
        switch (this.layoutDirection) {
        case LAYOUT_HORIZONTAL:
            this._mouseDownScreenPoint = evt.pageX;
            break;
        case LAYOUT_VERTICAL:
            this._mouseDownScreenPoint = evt.pageY;
            break;
        default:
            console.error("unknown layout direction");
            break;
        }
    },

    mouseMove: function(evt) {
        if (this._mouseDownScreenPoint === null) {
            return;
        }

        // Handle the segments. If the current segment is the handle or
        // nothing, then drag the handle around (as null = mouse outside of
        // scrollbar)
        var segment = this._segmentForMouseEvent(evt);
        if (segment == 'handle' || this._mouseOverHandle === true) {
            this._mouseOverHandle = true;
            if (this._scrollTimer !== null) {
                clearTimeout(this._scrollTimer);
                this._scrollTimer = null;
            }

            var eventDistance;
            switch (this.layoutDirection) {
                case LAYOUT_HORIZONTAL:
                    eventDistance = evt.pageX;
                    break;
                case LAYOUT_VERTICAL:
                    eventDistance = evt.pageY;
                    break;
                default:
                    console.error("unknown layout direction");
                    break;
            }

            var eventDelta = eventDistance - this._mouseDownScreenPoint;

            var maximum = this._maximum;
            var oldValue = this._value;
            var gutterLength = this._getGutterLength();
            var handleLength = this._getHandleLength();
            var emptyGutterLength = gutterLength - handleLength;
            var valueDelta = maximum * eventDelta / emptyGutterLength;
            this.value = oldValue + valueDelta;

            this._mouseDownScreenPoint = eventDistance;
        }

        this._mouseEventPosition = evt;
    },

    mouseEntered: function(evt) {
        this._isMouseOver = true;
        this.invalidate();
    },

    mouseExited: function(evt) {
        this._isMouseOver = false;
        this.invalidate();
    },

    mouseUp: function(evt) {
        this._mouseDownScreenPoint = null;
        this._mouseDownValue = null;
        if (this._scrollTimer) {
            clearTimeout(this._scrollTimer);
            this._scrollTimer = null;
        }
        this.invalidate();
    }

    // mouseWheel: function(evt) {
    //     var parentView = this.get('parentView');
    //
    //     var delta;
    //     switch (parentView.get('layoutDirection')) {
    //     case LAYOUT_HORIZONTAL:
    //         delta = evt.wheelDeltaX;
    //         break;
    //     case LAYOUT_VERTICAL:
    //         delta = evt.wheelDeltaY;
    //         break;
    //     default:
    //         console.error("unknown layout direction");
    //         return;
    //     }
    //
    //     parentView.set('value', parentView.get('value') + 2*delta);
    // }
});

Object.defineProperties(exports.ScrollerCanvasView.prototype, {
    isVisible: {
        set: function(isVisible) {
            if (this._isVisible === isVisible) {
                return;
            }

            this._isVisible = isVisible;
            this.domNode.style.display = isVisible ? 'block' : 'none';
            if (isVisible) {
                this.invalidate();
            }
        }
    },

    maximum: {
        set: function(maximum) {
            if (this._value > this._maximum) {
                this._value = this._maximum;
            }

            if (maximum === this._maximum) {
                return;
            }

            this._maximum = maximum;
            this.invalidate();
        }
    },

    value: {
        set: function(value) {
            if (value < 0) {
                value = 0;
            } else if (value > this._maximum) {
                value = this._maximum;
            }

            if (value === this._value) {
                return;
            }

            this._value = value;
            this.valueChanged(value);
            this.invalidate();
        }
    }
});

});

bespin.tiki.module("text_editor:views/text",function(require,exports,module) {
/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Bespin.
 *
 * The Initial Developer of the Original Code is
 * Mozilla.
 * Portions created by the Initial Developer are Copyright (C) 2009
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Bespin Team (bespin@mozilla.com)
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

var catalog = require('bespin:plugins').catalog;
var util = require('bespin:util/util');

var Event = require('events').Event;
var CanvasView = require('views/canvas').CanvasView;
var LayoutManager = require('controllers/layoutmanager').LayoutManager;
var Range = require('rangeutils:utils/range');
var Rect = require('utils/rect');
var TextInput = require('views/textinput').TextInput;
var console = require('bespin:console').console;
var settings = require('settings').settings;

// Set this to true to outline all text ranges with a box. This may be useful
// when optimizing syntax highlighting engines.
var DEBUG_TEXT_RANGES = false;


exports.TextView = function(container, editor) {
    CanvasView.call(this, container, true /* preventDownsize */ );
    this.editor = editor;

    this.padding = {
        top: 0,
        bottom: 30,
        left: 0,
        right: 30
    };

    this.clippingChanged.add(this.clippingFrameChanged.bind(this));

    var dom = this.domNode;
    dom.style.cursor = "text";
    dom.addEventListener('click', this.click.bind(this), false);
    dom.addEventListener('mousedown', this.mouseDown.bind(this), false);
    dom.addEventListener('mousemove', this.mouseMove.bind(this), false);
    window.addEventListener('mouseup', this.mouseUp.bind(this), false);

    editor.willChangeBuffer.add(this.editorWillChangeBuffer.bind(this));

    // Changeevents.
    this.selectionChanged = new Event();
    this.beganChangeGroup = new Event();
    this.endedChangeGroup = new Event();
    this.willReplaceRange = new Event();
    this.replacedCharacters = new Event();

    this.textInput = new TextInput(container, this);
};

exports.TextView.prototype = new CanvasView();

util.mixin(exports.TextView.prototype, {
    _dragPoint: null,
    _dragTimer: null,
    _enclosingScrollView: null,
    _inChangeGroup: false,
    _insertionPointBlinkTimer: null,
    _insertionPointVisible: true,


    // FIXME: These should be public, not private.
    _keyBuffer: '',
    _keyMetaBuffer: '',
    _keyState: 'start',

    _hasFocus: false,
    _mouseIsDown: false,

    selectionChanged: null,
    beganChangeGroup: null,
    endedChangeGroup: null,
    willReplaceRange: null,
    replacedCharacters: null,

    editorWillChangeBuffer: function(newBuffer) {
        if (this.editor.layoutManager) {
            // Remove events from the old layoutManager.
            var layoutManager = this.editor.layoutManager;
            layoutManager.invalidatedRects.remove(this);
            layoutManager.changedTextAtRow.remove(this);
        }

        // Add the events to the new layoutManager.
        layoutManager = newBuffer.layoutManager;
        layoutManager.invalidatedRects.add(this,
                                this.layoutManagerInvalidatedRects.bind(this));
        layoutManager.changedTextAtRow.add(this,
                                this.layoutManagerChangedTextAtRow.bind(this));
    },

    /**
     * Called by the textInput whenever the textInput gained the focus.
     */
    didFocus: function() {
        // Call _setFocus and not this.hasFocus as we have to pass the
        // 'isFromTextInput' flag.
        this._setFocus(true, true /* fromTextInput */);
    },

    /**
     * Called by the textInput whenever the textinput lost the focus.
     */
    didBlur: function() {
        // Call _setFocus and not this.hasFocus as we have to pass the
        // 'isFromTextInput' flag.
        this._setFocus(false, true /* fromTextInput */);
    },

    _drag: function() {
        var point = this._dragPoint;
        var offset = Rect.offsetFromRect(this.clippingFrame, point);

        this.moveCursorTo(this._selectionPositionForPoint({
                x:  point.x - offset.x,
                y:  point.y - offset.y
            }), true);
    },

    // Draws a single insertion point.
    _drawInsertionPoint: function(rect, context) {
        if (!this._insertionPointVisible) {
            return;
        }

        var range = this.editor.buffer._selectedRange;
        var characterRect = this.editor.layoutManager.
            characterRectForPosition(range.start);
        var x = Math.floor(characterRect.x), y = characterRect.y;
        var width = Math.ceil(characterRect.width);
        var height = characterRect.height;

        context.save();

        var theme = this.editor.themeData.editor;
        if (this._hasFocus) {
            context.strokeStyle = theme.cursorColor;
            context.beginPath();
            context.moveTo(x + 0.5, y);
            context.lineTo(x + 0.5, y + height);
            context.closePath();
            context.stroke();
        } else {
            context.fillStyle = theme.unfocusedCursorBackgroundColor;
            context.fillRect(x + 0.5, y, width - 0.5, height);
            context.strokeStyle = theme.unfocusedCursorColor;
            context.strokeRect(x + 0.5, y + 0.5, width - 1, height - 1);
        }

        context.restore();
    },

    _drawLines: function(rect, context) {
        var editor = this.editor;
        var layoutManager = editor.layoutManager;
        var textLines = layoutManager.textLines;
        var lineAscent = layoutManager.fontDimension.lineAscent;

        var themeData = editor.themeData;
        var fgColors = themeData.highlighterFG;
        var bgColors = themeData.highlighterBG;

        context.save();
        context.font = this.editor.font;

        var range = layoutManager.characterRangeForBoundingRect(rect);
        var rangeStart = range.start, rangeEnd = range.end;
        var startRow = rangeStart.row, endRow = rangeEnd.row;
        for (var row = startRow; row <= endRow; row++) {
            var textLine = textLines[row];
            if (util.none(textLine)) {
                continue;
            }

            // Clamp the start column and end column to fit within the line
            // text.
            var characters = textLine.characters;
            var length = characters.length;
            var endCol = Math.min(rangeEnd.col, length);
            var startCol = rangeStart.col;
            if (startCol >= length) {
                continue;
            }

            // Get the color ranges, or synthesize one if it doesn't exist. We
            // have to be tolerant of bad data, because we may be drawing ahead
            // of the syntax highlighter.
            var colorRanges = textLine.colors;
            if (colorRanges == null) {
                colorRanges = [];
            }

            // Figure out which color range to start in.
            var colorIndex = 0;
            while (colorIndex < colorRanges.length &&
                    startCol < colorRanges[colorIndex].start) {
                colorIndex++;
            }

            var col = (colorIndex < colorRanges.length)
                      ? colorRanges[colorIndex].start
                      : startCol;

            // And finally draw the line.
            while (col < endCol) {
                var colorRange = colorRanges[colorIndex];
                var end = colorRange != null ? colorRange.end : endCol;
                var tag = colorRange != null ? colorRange.tag : 'plain';

                var pos = { row: row, col: col };
                var rect = layoutManager.characterRectForPosition(pos);

                if (bgColors.hasOwnProperty(tag)) {
                    var endPos = { row: row, col: end - 1 };
                    var endRect = layoutManager.
                        characterRectForPosition(endPos);

                    var bg = bgColors[tag];
                    context.fillStyle = bg;
                    context.fillRect(rect.x, rect.y, endRect.x - rect.x +
                        endRect.width, endRect.height);
                }

                var fg = fgColors.hasOwnProperty(tag) ? fgColors[tag] : 'red';

                var snippet = characters.substring(col, end);
                context.fillStyle = fg;
                context.fillText(snippet, rect.x, rect.y + lineAscent);

                if (DEBUG_TEXT_RANGES) {
                    context.strokeStyle = color;
                    context.strokeRect(rect.x + 0.5, rect.y + 0.5,
                        rect.width * snippet.length - 1, rect.height - 1);
                }

                col = end;
                colorIndex++;
            }
        }

        context.restore();
    },

    // Draws the background highlight for selections.
    _drawSelectionHighlight: function(rect, context) {
        var theme = this.editor.themeData.editor;
        var fillStyle = this._hasFocus ?
            theme.selectedTextBackgroundColor :
            theme.unfocusedCursorBackgroundColor;
        var layoutManager = this.editor.layoutManager;

        context.save();

        var range = Range.normalizeRange(this.editor.buffer._selectedRange);
        context.fillStyle = fillStyle;
        layoutManager.rectsForRange(range).forEach(function(rect) {
            context.fillRect(rect.x, rect.y, rect.width, rect.height);
        });

        context.restore();
    },

    // Draws either the selection or the insertion point.
    _drawSelection: function(rect, context) {
        if (this._rangeIsInsertionPoint(this.editor.buffer._selectedRange)) {
            this._drawInsertionPoint(rect, context);
        } else {
            this._drawSelectionHighlight(rect, context);
        }
    },

    _getVirtualSelection: function(startPropertyAsWell) {
        var selectedRange = this.editor.buffer._selectedRange;
        var selectedRangeEndVirtual = this.editor.buffer._selectedRangeEndVirtual;

        return {
            start:  startPropertyAsWell && selectedRangeEndVirtual ?
                    selectedRangeEndVirtual : selectedRange.start,
            end:    selectedRangeEndVirtual || selectedRange.end
        };
    },

    _invalidateSelection: function() {
        var adjustRect = function(rect) {
            return {
                x:      rect.x - 1,
                y:      rect.y,
                width:  rect.width + 2,
                height: rect.height
            };
        };

        var layoutManager = this.editor.layoutManager;
        var range = Range.normalizeRange(this.editor.buffer._selectedRange);
        if (!this._rangeIsInsertionPoint(range)) {
            var rects = layoutManager.rectsForRange(range);
            rects.forEach(function(rect) {
                this.invalidateRect(adjustRect(rect));
            }, this);

            return;
        }

        var rect = layoutManager.characterRectForPosition(range.start);
        this.invalidateRect(adjustRect(rect));
    },

    _isReadOnly: function() {
        return this.editor.layoutManager.textStorage.readOnly;
    },

    _keymappingChanged: function() {
        this._keyBuffer = '';
        this._keyState = 'start';
    },

    _performVerticalKeyboardSelection: function(offset) {
        var textStorage = this.editor.layoutManager.textStorage;
        var selectedRangeEndVirtual = this.editor.buffer._selectedRangeEndVirtual;
        var oldPosition = selectedRangeEndVirtual !== null ?
            selectedRangeEndVirtual : this.editor.buffer._selectedRange.end;
        var newPosition = Range.addPositions(oldPosition,
            { row: offset, col: 0 });

        this.moveCursorTo(newPosition, true, true);
    },

    _rangeIsInsertionPoint: function(range) {
        return Range.isZeroLength(range);
    },

    _rearmInsertionPointBlinkTimer: function() {
        if (!this._insertionPointVisible) {
            // Make sure it ends up visible.
            this.blinkInsertionPoint();
        }

        if (this._insertionPointBlinkTimer !== null) {
            clearInterval(this._insertionPointBlinkTimer);
        }

        this._insertionPointBlinkTimer = setInterval(
                                            this.blinkInsertionPoint.bind(this),
                                            750);
    },

    // Moves the selection, if necessary, to keep all the positions pointing to
    // actual characters.
    _repositionSelection: function() {
        var textLines = this.editor.layoutManager.textLines;
        var textLineLength = textLines.length;

        var range = this.editor.buffer._selectedRange;
        var newStartRow = Math.min(range.start.row, textLineLength - 1);
        var newEndRow = Math.min(range.end.row, textLineLength - 1);
        var startLine = textLines[newStartRow];
        var endLine = textLines[newEndRow];
        this.setSelection({
            start: {
                row: newStartRow,
                col: Math.min(range.start.col, startLine.characters.length)
            },
            end: {
                row: newEndRow,
                col: Math.min(range.end.col, endLine.characters.length)
            }
        });
    },

    _scrollPage: function(scrollUp) {
        var clippingFrame = this.clippingFrame;
        var lineAscent = this.editor.layoutManager.fontDimension.lineAscent;
        this.editor.scrollBy(0,
                    (clippingFrame.height + lineAscent) * (scrollUp ? -1 : 1));
    },

    _scrollWhileDragging: function() {
        var point = this._dragPoint;
        var newPoint = this.computeWithClippingFrame(point.layerX, point.layerY);
        util.mixin(this._dragPoint, newPoint);
        this._drag();
    },

    // Returns the character closest to the given point, obeying the selection
    // rules (including the partialFraction field).
    _selectionPositionForPoint: function(point) {
        var position = this.editor.layoutManager.characterAtPoint(point);
        return position.partialFraction < 0.5 ? position :
            Range.addPositions(position, { row: 0, col: 1 });
    },

    _syntaxManagerUpdatedSyntaxForRows: function(startRow, endRow) {
        if (startRow === endRow) {
            return;
        }

        var layoutManager = this.editor.layoutManager;
        layoutManager.updateTextRows(startRow, endRow);

        layoutManager.rectsForRange({
                start:  { row: startRow, col: 0 },
                end:    { row: endRow,   col: 0 }
            }).forEach(this.invalidateRect, this);
    },

    /**
     * Toggles the visible state of the insertion point.
     */
    blinkInsertionPoint: function() {
        this._insertionPointVisible = !this._insertionPointVisible;
        this._invalidateSelection();
    },

    /**
     * Returns the selected characters.
     */
    copy: function() {
        return this.getSelectedCharacters();
    },

    /**
     * Removes the selected characters from the text buffer and returns them.
     */
    cut: function() {
        var cutData = this.getSelectedCharacters();

        if (cutData != '') {
            this.performBackspaceOrDelete(false);
        }

        return cutData;
    },

    /**
     * Handles click events and sets the focus appropriately. This is needed
     * now that Firefox focus is tightened down; see bugs 125282 and 588381.
     */
    click: function(event) {
        this.focus();
    },

    /**
     * This is where the editor is painted from head to toe. Pitiful tricks are
     * used to draw as little as possible.
     */
    drawRect: function(rect, context) {
        context.fillStyle = this.editor.themeData.editor.backgroundColor;
        context.fillRect(rect.x, rect.y, rect.width, rect.height);

        this._drawSelection(rect, context);
        this._drawLines(rect, context);
    },

    /**
     * Directs keyboard input to this text view.
     */
    focus: function() {
        this.textInput.focus();
    },

    /** Returns the location of the insertion point in pixels. */
    getInsertionPointPosition: function() {
        var editor = this.editor;
        var range = editor.buffer._selectedRange;
        var rect = editor.layoutManager.characterRectForPosition(range.start);
        return { x: rect.x, y: rect.y };
    },

    /**
     * Returns the characters that are currently selected as a string, or the
     * empty string if none are selected.
     */
    getSelectedCharacters: function() {
        return this._rangeIsInsertionPoint(this.editor.buffer._selectedRange) ? '' :
            this.editor.layoutManager.textStorage.getCharacters(Range.
            normalizeRange(this.editor.buffer._selectedRange));
    },

    /*
     * Returns the currently selected range.
     *
     * @param raw If true, the direction of the selection is preserved: the
     *            'start' field will be the selection origin, and the 'end'
     *            field will always be the selection tail.
     */
    getSelectedRange: function(raw) {
        if (!raw) {
            return Range.normalizeRange(this.editor.buffer._selectedRange);
        } else {
            return this.editor.buffer._selectedRange;
        }
    },

    /**
     * Groups all the changes in the callback into a single undoable action.
     * Nested change groups are supported; one undoable action is created for
     * the entire group of changes.
     */
    groupChanges: function(performChanges) {
        if (this._isReadOnly()) {
            return false;
        }

        if (this._inChangeGroup) {
            performChanges();
            return true;
        }

        this._inChangeGroup = true;
        this.beganChangeGroup(this, this.editor.buffer._selectedRange);

        try {
            performChanges();
        } catch (e) {
            console.error("Error in groupChanges(): " + e);
            this._inChangeGroup = false;
            this.endedChangeGroup(this, this.editor.buffer._selectedRange);
            return false;
        } finally {
            this._inChangeGroup = false;
            this.endedChangeGroup(this, this.editor.buffer._selectedRange);
            return true;
        }
    },

    /**
     * Replaces the selection with the given text and updates the selection
     * boundaries appropriately.
     *
     * @return True if the text view was successfully updated; false if the
     *     change couldn't be made because the text view is read-only.
     */
    insertText: function(text) {
        if (this._isReadOnly()) {
            return false;
        }

        this.groupChanges(function() {
            var textStorage = this.editor.layoutManager.textStorage;
            var range = Range.normalizeRange(this.editor.buffer._selectedRange);

            this.replaceCharacters(range, text);

            // Update the selection to point immediately after the inserted
            // text.
            var lines = text.split('\n');

            var destPosition;
            if (lines.length > 1) {
                destPosition = {
                    row:    range.start.row + lines.length - 1,
                    col: lines[lines.length - 1].length
                };
            } else {
                destPosition = Range.addPositions(range.start,
                    { row: 0, col: text.length });
            }

            this.moveCursorTo(destPosition);
        }.bind(this));

        return true;
    },

    /**
     * Returns true if the given character is a word separator.
     */
    isDelimiter: function(character) {
        return '"\',;.!~@#$%^&*?[]<>():/\\-+ \t'.indexOf(character) !== -1;
    },

    keyDown: function(evt) {
        if (evt.charCode === 0 || evt._charCode === 0) {    // hack for Fx
            var preds = { isTextView: true };
            return this.editor.processKeyEvent(evt, this, preds);
        } else if (evt.keyCode === 9) {
            // Stops the tab. Otherwise the editor can lose focus.
            evt.preventDefault();
        } else {
            // This is a real keyPress event. This should not be handled,
            // otherwise the textInput mixin can't detect the key events.
            return false;
        }
    },

    /**
     * Runs the syntax highlighter from the given row to the end of the visible
     * range, and repositions the selection.
     */
    layoutManagerChangedTextAtRow: function(sender, row) {
        this._repositionSelection();
    },

    /**
     * Marks the given rectangles as invalid.
     */
    layoutManagerInvalidatedRects: function(sender, rects) {
        rects.forEach(this.invalidateRect, this);
    },

    mouseDown: function(evt) {
        this.hasFocus = true;
        this._mouseIsDown = true;

        var point = this.computeWithClippingFrame(evt.layerX, evt.layerY);
        util.mixin(point, { layerX: evt.layerX, layerY: evt.layerY});

        switch (evt.detail) {
        case 1:
            var pos = this._selectionPositionForPoint(point);
            this.moveCursorTo(pos, evt.shiftKey);
            break;

        // Select the word under the cursor.
        case 2:
            var pos = this._selectionPositionForPoint(point);
            var line = this.editor.layoutManager.textStorage.lines[pos.row];

            // If there is nothing to select in this line, then skip.
            if (line.length === 0) {
                return true;
            }

            pos.col -= (pos.col == line.length ? 1 : 0);
            var skipOnDelimiter = !this.isDelimiter(line[pos.col]);

            var thisTextView = this;
            var searchForDelimiter = function(pos, dir) {
                for (pos; pos > -1 && pos < line.length; pos += dir) {
                    if (thisTextView.isDelimiter(line[pos]) ===
                            skipOnDelimiter) {
                        break;
                    }
                }
                return pos + (dir == 1 ? 0 : 1);
            };

            var colFrom = searchForDelimiter(pos.col, -1);
            var colTo   = searchForDelimiter(pos.col, 1);

            this.moveCursorTo({ row: pos.row, col: colFrom });
            this.moveCursorTo({ row: pos.row, col: colTo }, true);

            break;

        case 3:
            var lines = this.editor.layoutManager.textStorage.lines;
            var pos = this._selectionPositionForPoint(point);
            this.setSelection({
                start: {
                    row: pos.row,
                    col: 0
                },
                end: {
                    row: pos.row,
                    col: lines[pos.row].length
                }
            });
            break;
        }

        this._dragPoint = point;
        this._dragTimer = setInterval(this._scrollWhileDragging.bind(this), 100);
    },

    mouseMove: function(evt) {
        if (this._mouseIsDown) {
            this._dragPoint = this.computeWithClippingFrame(evt.layerX, evt.layerY);
            util.mixin(this._dragPoint, { layerX: evt.layerX, layerY: evt.layerY});
            this._drag();
        }
    },

    mouseUp: function(evt) {
        this._mouseIsDown = false;
        if (this._dragTimer !== null) {
            clearInterval(this._dragTimer);
            this._dragTimer = null;
        }
    },

    /**
     * Moves the cursor.
     *
     * @param position{Position} The position to move the cursor to.
     *
     * @param select{bool} Whether to preserve the selection origin. If this
     *        parameter is false, the selection is removed, and the insertion
     *        point moves to @position. Typically, this parameter is set when
     *        the mouse is being dragged or the shift key is held down.
     *
     * @param virtual{bool} Whether to save the current end position as the
     *        virtual insertion point. Typically, this parameter is set when
     *        moving vertically.
     */
    moveCursorTo: function(position, select, virtual) {
        var textStorage = this.editor.layoutManager.textStorage;
        var positionToUse = textStorage.clampPosition(position);

        this.setSelection({
            start:  select ? this.editor.buffer._selectedRange.start : positionToUse,
            end:    positionToUse
        });

        if (virtual) {
            var lineCount = textStorage.lines.length;
            var row = position.row, col = position.col;
            if (row > 0 && row < lineCount) {
                this.editor.buffer._selectedRangeEndVirtual = position;
            } else {
                this.editor.buffer._selectedRangeEndVirtual = {
                    row: row < 1 ? 0 : lineCount - 1,
                    col: col
                };
            }
        } else {
            this.editor.buffer._selectedRangeEndVirtual = null;
        }

        this.scrollToPosition(this.editor.buffer._selectedRange.end);
    },

    moveDown: function() {
        var selection = this._getVirtualSelection();
        var range = Range.normalizeRange(selection);
        var position;
        if (this._rangeIsInsertionPoint(this.editor.buffer._selectedRange)) {
            position = range.end;
        } else {
            // Yes, this is actually what Cocoa does... weird, huh?
            position = { row: range.end.row, col: range.start.col };
        }
        position = Range.addPositions(position, { row: 1, col: 0 });

        this.moveCursorTo(position, false, true);
    },

    moveLeft: function() {
        var range = Range.normalizeRange(this.editor.buffer._selectedRange);
        if (this._rangeIsInsertionPoint(range)) {
            this.moveCursorTo(this.editor.layoutManager.textStorage.
                displacePosition(range.start, -1));
        } else {
            this.moveCursorTo(range.start);
        }
    },

    moveRight: function() {
        var range = Range.normalizeRange(this.editor.buffer._selectedRange);
        if (this._rangeIsInsertionPoint(range)) {
            this.moveCursorTo(this.editor.layoutManager.textStorage.
                displacePosition(range.end, 1));
        } else {
            this.moveCursorTo(range.end);
        }
    },

    moveUp: function() {
        var range = Range.normalizeRange(this._getVirtualSelection(true));
        position = Range.addPositions({
            row: range.start.row,
            col: this._getVirtualSelection().end.col
        }, { row: -1, col: 0 });

        this.moveCursorTo(position, false, true);
    },

    parentViewFrameChanged: function() {
        arguments.callee.base.apply(this, arguments);
        this._resize();
    },

    /**
     * As an undoable action, replaces the characters within the old range with
     * the supplied characters.
     *
     * TODO: Factor this out into the undo controller. The fact that commands
     * have to go through the view in order to make undoable changes is
     * counterintuitive.
     *
     * @param oldRange{Range}    The range of characters to modify.
     * @param characters{string} The string to replace the characters with.
     *
     * @return True if the changes were successfully made; false if the changes
     *     couldn't be made because the editor is read-only.
     */
    replaceCharacters: function(oldRange, characters) {
        if (this._isReadOnly()) {
            return false;
        }

        this.groupChanges(function() {
            oldRange = Range.normalizeRange(oldRange);
            this.willReplaceRange(this, oldRange);

            var textStorage = this.editor.layoutManager.textStorage;
            textStorage.replaceCharacters(oldRange, characters);
            this.replacedCharacters(this, oldRange, characters);
        }.bind(this));

        return true;
    },

    /**
     * Performs a delete-backward or delete-forward operation.
     *
     * @param isBackspace{boolean} If true, the deletion proceeds backward (as if
     *     the backspace key were pressed); otherwise, deletion proceeds forward.
     *
     * @return True if the operation was successfully performed; false if the
     *     operation failed because the editor is read-only.
     */
    performBackspaceOrDelete: function(isBackspace) {
        if (this._isReadOnly()) {
            return false;
        }

        var model = this.editor.layoutManager.textStorage;

        var lines = model.lines;
        var line = '', count = 0;
        var tabstop = settings.get('tabstop');
        var range = this.getSelectedRange();

        if (Range.isZeroLength(range)) {
            if (isBackspace) {
                var start = range.start;
                line = lines[start.row];
                var preWhitespaces = line.substring(0, start.col).
                                                    match(/\s*$/)[0].length;

                // If there are less then n-tabstop whitespaces in front, OR
                // the current cursor position is not n times tabstop, THEN
                // delete only 1 character.
                if (preWhitespaces < tabstop
                        || (start.col - tabstop) % tabstop != 0) {
                    count = 1;
                } else {
                    // Otherwise delete tabstop whitespaces.
                    count = tabstop;
                }

                range = {
                    start:  model.displacePosition(start, count * -1),
                    end:    range.end
                };
            } else {
                var end = range.end;
                line = lines[end.row];
                var trailingWhitespaces = line.substring(end.col).
                                                    match(/^\s*/)[0].length;

                // If there are less then n-tabstop whitespaces after the cursor
                // position, then delete only 1 character. Otherwise delete
                // tabstop whitespaces.
                if (trailingWhitespaces < tabstop) {
                    count = 1;
                } else {
                    count = tabstop;
                }

                range = {
                    start:  range.start,
                    end:    model.displacePosition(range.end, count)
                };
            }
        }

        this.groupChanges(function() {
            this.replaceCharacters(range, '');

            // Position the insertion point at the start of all the ranges that
            // were just deleted.
            this.moveCursorTo(range.start);
        }.bind(this));

        return true;
    },

    /** Removes all buffered keys. */
    resetKeyBuffers: function() {
        this._keyBuffer = '';
        this._keyMetaBuffer = '';
    },

    /**
     * If the text view is inside a scrollable view, scrolls down by one page.
     */
    scrollPageDown: function() {
        this._scrollPage(false);
    },

    /**
     * If the text view is inside a scrollable view, scrolls up by one page.
     */
    scrollPageUp: function() {
        this._scrollPage(true);
    },

    /**
     * If this view is in a scrollable container, scrolls to the given
     * character position.
     */
    scrollToPosition: function(position) {
        var rect = this.editor.layoutManager.characterRectForPosition(position);
        var rectX = rect.x, rectY = rect.y;
        var rectWidth = rect.width, rectHeight = rect.height;

        var frame = this.clippingFrame;
        var frameX = frame.x, frameY = frame.y;

        var padding = this.padding;
        var width = frame.width - padding.right;
        var height = frame.height - padding.bottom;

        var x;
        if (rectX >= frameX + 30 /* This is a hack to allow dragging to the left */
                    && rectX + rectWidth < frameX + width) {
            x = frameX;
        } else {
            x = rectX - width / 2 + rectWidth / 2;
        }

        var y;
        if (rectY >= frameY && rectY + rectHeight < frameY + height) {
            y = frameY;
        } else {
            y = rectY - height / 2 + rectHeight / 2;
        }

        this.editor.scrollTo({ x: x, y: y });
    },

    /**
     * Selects all characters in the buffer.
     */
    selectAll: function() {
        var lines = this.editor.layoutManager.textStorage.lines;
        var lastRow = lines.length - 1;
        this.setSelection({
            start:  { row: 0, col: 0 },
            end:    { row: lastRow, col: lines[lastRow].length }
        });
    },

    selectDown: function() {
        this._performVerticalKeyboardSelection(1);
    },

    selectLeft: function() {
        this.moveCursorTo((this.editor.layoutManager.textStorage.
            displacePosition(this.editor.buffer._selectedRange.end, -1)), true);
    },

    selectRight: function() {
        this.moveCursorTo((this.editor.layoutManager.textStorage.
            displacePosition(this.editor.buffer._selectedRange.end, 1)), true);
    },

    selectUp: function() {
        this._performVerticalKeyboardSelection(-1);
    },

    /**
     * Directly replaces the current selection with a new one.
     */
    setSelection: function(newRange, ensureVisible) {
        var textStorage = this.editor.layoutManager.textStorage;

        newRange = textStorage.clampRange(newRange);
        if (Range.equal(newRange, this.editor.buffer._selectedRange)) {
            return;
        }

        // Invalidate the old selection.
        this._invalidateSelection();

        // Set the new selection and invalidate it.
        this.editor.buffer._selectedRange = newRange =
                                                textStorage.clampRange(newRange);
        this._invalidateSelection();

        if (this._hasFocus) {
            this._rearmInsertionPointBlinkTimer();
        }

        if (ensureVisible) {
            this.scrollToPosition(newRange.end);
        }

        this.selectionChanged(newRange);
        catalog.publish(this.editor, 'editorChange', 'selection', newRange);
    },

    textInserted: function(text) {
        // We don't handle the new line char at this point.
        if (text === '\n') {
            return;
        }

        var preds = { isTextView: true, isCommandKey: false };
        if (!this.editor.processKeyEvent(text, this, preds)) {
            this.insertText(text);
            this.resetKeyBuffers();
        }
    },

    /**
     * Changes the internal hasFocus flag if the current hasFocus value is not
     * equal to the parameter 'value'. If 'fromTextInput' is true, then
     * the textInput.focus() and textInput.blur() is not called. This is
     * necessary as otherwise the textInput detects the blur event, calls
     * hasFocus = false and the _setFocus function calls textInput.blur() again.
     * If the textInput was blured, because the entire page lost the focus, then
     * the foucs is not reset to the textInput when the page gains the focus again.
     */
    _setFocus: function(value, fromTextInput) {
        if (value == this._hasFocus) {
            return;
        }

        this._hasFocus = value;

        if (this._hasFocus) {
            this._rearmInsertionPointBlinkTimer();
            this._invalidateSelection();
            if (!fromTextInput) {
                 this.textInput.focus();
            }
        } else {
            if (this._insertionPointBlinkTimer) {
                clearInterval(this._insertionPointBlinkTimer);
                this._insertionPointBlinkTimer = null;
            }
            this._insertionPointVisible = true;
            this._invalidateSelection();
            if (!fromTextInput) {
                 this.textInput.blur();
            }
        }
    }
});

Object.defineProperties(exports.TextView.prototype, {
    hasFocus: {
        get: function() {
            return this._hasFocus;
        },

        set: function(value) {
            this._setFocus(value, false /* fromTextInput*/);
        }
    }
});

});

bespin.tiki.module("text_editor:views/canvas",function(require,exports,module) {
/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Bespin.
 *
 * The Initial Developer of the Original Code is
 * Mozilla.
 * Portions created by the Initial Developer are Copyright (C) 2009
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Bespin Team (bespin@mozilla.com)
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

var util = require('bespin:util/util');
var Rect = require('utils/rect');
var Event = require('events').Event;

/**
 * @class
 *
 * This class provides support for manual scrolling and positioning for canvas-
 * based elements. Derived views should implement drawRect() in order to
 * perform the appropriate canvas drawing logic.
 *
 * The actual size of the canvas is always the size of the container the canvas
 * view is placed in.
 *
 * The canvas that is created is available in the domNode attribute and should
 * be added to the document by the caller.
 */
exports.CanvasView = function(container, preventDownsize, clearOnFullInvalid) {
    if (!container) {
        return;
    }

    this._preventDownsize = preventDownsize || false;
    this._clearOnFullInvalid = clearOnFullInvalid || false;
    this._clippingFrame = this._frame = {
        x: 0,
        y: 0,
        width: 0,
        height: 0
    };
    this._invalidRects = [];

    var canvas = document.createElement('canvas');
    canvas.setAttribute('style', 'position: absolute');
    canvas.innerHTML = 'canvas tag not supported by your browser';
    container.appendChild(canvas);
    this.domNode = canvas;

    this.clippingChanged = new Event();
    this.clippingChanged.add(this.clippingFrameChanged.bind(this));
};

exports.CanvasView.prototype = {
    domNode: null,

    clippingChanged: null,

    _canvasContext: null,
    _canvasId: null,
    _invalidRects: null,
    _lastRedrawTime: null,
    _redrawTimer: null,
    _clippingFrame: null,
    _preventDownsize: false,
    _clearOnFullInvalid: false,

    _frame: null,

    _getContext: function() {
        if (this._canvasContext === null) {
            this._canvasContext = this.domNode.getContext('2d');
        }
        return this._canvasContext;
    },

    computeWithClippingFrame: function(x, y) {
        var clippingFrame = this.clippingFrame;
        return {
            x: x + clippingFrame.x,
            y: y + clippingFrame.y
        };
    },

    /**
     * @property{Number}
     *
     * The minimum delay between canvas redraws in milliseconds, equal to 1000
     * divided by the desired number of frames per second.
     */
    minimumRedrawDelay: 1000.0 / 30.0,

    /**
     * Subclasses can override this method to provide custom behavior whenever
     * the clipping frame changes. The default implementation simply
     * invalidates the entire visible area.
     */
    clippingFrameChanged: function() {
        this.invalidate();
    },

    drawRect: function(rect, context) {
        // abstract
    },

    /**
     * Render the canvas. Rendering is delayed by a few ms to empty the call
     * stack first before rendering. If the canvas was rendered in less then
     * this.minimumRedrawDelay ms, then the next rendering will take in
     * this.minimumRedrawDelay - now + lastRendering ms.
     */
    render: function() {
         // Don't continue if there is a rendering or redraw timer already.
        if (this._renderTimer || this._redrawTimer) {
            return;
        }

        // Queue the redraw at the end of the current event queue to make sure
        // everyting is done when redrawing.
        this._renderTimer = setTimeout(this._tryRedraw.bind(this), 0);
    },

    /**
     * Invalidates the entire visible region of the canvas.
     */
    invalidate: function(rect) {
        this._invalidRects = 'all';
        this.render();
    },

    /**
     * Invalidates the given rect of the canvas, and schedules that portion of
     * the canvas to be redrawn at the end of the run loop.
     */
    invalidateRect: function(rect) {
        var invalidRects = this._invalidRects;
        if (invalidRects !== 'all') {
            invalidRects.push(rect);
            this.render();
        }
    },

    _tryRedraw: function(context) {
        this._renderTimer = null;

        var now = new Date().getTime();
        var lastRedrawTime = this._lastRedrawTime;
        var minimumRedrawDelay = this.minimumRedrawDelay;

        if (lastRedrawTime === null ||
                now - lastRedrawTime >= minimumRedrawDelay) {
            this._redraw();
            return;
        }

        var redrawTimer = this._redrawTimer;
        if (redrawTimer !== null) {
            return; // already scheduled
        }

        // TODO This is not as good as SC.Timer... Will it work?
        this._redrawTimer = window.setTimeout(this._redraw.bind(this),
            minimumRedrawDelay);
    },

     /**
     * Calls drawRect() on all the invalid rects to redraw the canvas contents.
     * Generally, you should not need to call this function unless you override
     * the default implementations of didCreateLayer() or render().
     */
    _redraw: function() {
        var clippingFrame = this.clippingFrame;
        clippingFrame = {
            x:      Math.round(clippingFrame.x),
            y:      Math.round(clippingFrame.y),
            width:  clippingFrame.width,
            height: clippingFrame.height
        };

        var context = this._getContext();
        context.save();
        context.translate(-clippingFrame.x, -clippingFrame.y);

        var invalidRects = this._invalidRects;
        if (invalidRects === 'all') {
            if (this._clearOnFullInvalid) {
                context.clearRect(0, 0, this.domNode.width, this.domNode.height);
            }
            this.drawRect(clippingFrame, context);
        } else {
            Rect.merge(invalidRects).forEach(function(rect) {
                rect = Rect.intersectRects(rect, clippingFrame);
                if (rect.width !== 0 && rect.height !== 0) {
                    context.save();

                    var x = rect.x, y = rect.y;
                    var width = rect.width, height = rect.height;
                    context.beginPath();
                    context.moveTo(x, y);
                    context.lineTo(x + width, y);
                    context.lineTo(x + width, y + height);
                    context.lineTo(x, y + height);
                    context.closePath();
                    context.clip();

                    this.drawRect(rect, context);

                    context.restore();
                }

            }, this);
        }

        context.restore();

        this._invalidRects = [];
        this._redrawTimer = null;
        this._lastRedrawTime = new Date().getTime();
    }
};

Object.defineProperties(exports.CanvasView.prototype, {
    clippingFrame: {
        get: function() {
            return this._clippingFrame;
        },

        set: function(clippingFrame) {
            clippingFrame = util.mixin(util.clone(this._clippingFrame), clippingFrame);

            if (this._clippingFrame === null ||
                    !Rect.rectsEqual(clippingFrame, this._clippingFrame)) {
                this._clippingFrame = clippingFrame;
                this.clippingChanged();
            }
        }
    },

    frame: {
        get: function() {
            return this._frame;
        },
        
        set: function(frame) {
            var domNode = this.domNode;
            var domStyle = domNode.style;
            var preventDownsize = this._preventDownsize;
            var domWidth = domNode.width;
            var domHeight = domNode.height;
            var domStyle = domNode.style;
            domStyle.left = frame.x + 'px';
            domStyle.top = frame.y + 'px';

            var widthChanged, heightChanged;
            if (frame.width !== domWidth) {
                if (frame.width < domWidth) {
                    if (!preventDownsize) {
                        widthChanged = true;
                    }
                } else {
                    widthChanged = true;
                }
            }
            if (frame.height !== domHeight) {
                if (frame.height < domHeight) {
                    if (!preventDownsize) {
                        heightChanged = true;
                    }
                } else {
                    heightChanged = true;
                }
            }

            if (widthChanged) {
                this.domNode.width = frame.width;
            }
            if (heightChanged) {
                this.domNode.height = frame.height;
            }

            this._frame = frame;

            // The clipping frame might have changed if the size changed.
            this.clippingFrame = {
                width: frame.width,
                height: frame.height
            };
        }
    }
});


});

bespin.tiki.module("text_editor:controllers/undo",function(require,exports,module) {
/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Bespin.
 *
 * The Initial Developer of the Original Code is
 * Mozilla.
 * Portions created by the Initial Developer are Copyright (C) 2009
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Bespin Team (bespin@mozilla.com)
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

var console = require('bespin:console').console;
var env = require('environment').env;

/**
 * @class
 *
 * The editor undo controller is a delegate of the text view that groups
 * changes into patches and saves them with the undo manager.
 *
 * This object does not assume that it has exclusive write access to the text
 * storage object, and as such it tries to maintain sensible behavior in the
 * presence of direct modification to the text storage by other objects. This
 * is important for collaboration.
 */
exports.EditorUndoController = function(editor) {
    this.editor = editor;
    var textView = this.textView = editor.textView;

    textView.beganChangeGroup.add(function(sender, selection) {
        this._beginTransaction();
        this._record.selectionBefore = selection;
    }.bind(this));

    textView.endedChangeGroup.add(function(sender, selection) {
        this._record.selectionAfter = selection;
        this._endTransaction();
    }.bind(this));

    textView.replacedCharacters.add(function(sender, oldRange, characters) {
        if (!this._inTransaction) {
            throw new Error('UndoController.textViewReplacedCharacters()' +
                ' called outside a transaction');
        }

        this._record.patches.push({
            oldCharacters:  this._deletedCharacters,
            oldRange:       oldRange,
            newCharacters:  characters,
            newRange:       this.editor.layoutManager.textStorage.
                            resultingRangeForReplacement(oldRange,
                            characters.split('\n'))
        });

        this._deletedCharacters = null;
    }.bind(this));

    textView.willReplaceRange.add(function(sender, oldRange) {
        if (!this._inTransaction) {
            throw new Error('UndoController.textViewWillReplaceRange() called' +
                ' outside a transaction');
        }

        this._deletedCharacters = this.editor.layoutManager.textStorage.
                            getCharacters(oldRange);
    }.bind(this));
};

exports.EditorUndoController.prototype = {
    _inTransaction: false,
    _record: null,

    /**
     * @property{TextView}
     *
     * The view object to forward changes to. This property must be set upon
     * instantiating the undo controller.
     */
    textView: null,

    _beginTransaction: function() {
        if (this._inTransaction) {
            console.trace();
            throw new Error('UndoController._beginTransaction() called with a ' +
                'transaction already in place');
        }

        this._inTransaction = true;
        this._record = { patches: [] };
    },

    _endTransaction: function() {
        if (!this._inTransaction) {
            throw new Error('UndoController._endTransaction() called without a ' +
                'transaction in place');
        }

        this.editor.buffer.undoManager.registerUndo(this, this._record);
        this._record = null;

        this._inTransaction = false;
    },

    _tryApplyingPatches: function(patches) {
        var textStorage = this.editor.layoutManager.textStorage;
        patches.forEach(function(patch) {
            textStorage.replaceCharacters(patch.oldRange, patch.newCharacters);
        });
        return true;
    },

    _undoOrRedo: function(patches, selection) {
        if (this._inTransaction) {
            // Can't think of any reason why this should be supported, and it's
            // often an indication that someone forgot an endTransaction()
            // call somewhere...
            throw new Error('UndoController._undoOrRedo() called while in a transaction');
        }

        if (!this._tryApplyingPatches(patches)) {
            return false;
        }

        this.textView.setSelection(selection, true);
        return true;
    },

    redo: function(record) {
        var patches = record.patches.concat();
        patches.reverse();
        return this._undoOrRedo(patches, record.selectionAfter);
    },

    undo: function(record) {
        return this._undoOrRedo(record.patches.map(function(patch) {
                return {
                    oldCharacters:  patch.newCharacters,
                    oldRange:       patch.newRange,
                    newCharacters:  patch.oldCharacters,
                    newRange:       patch.oldRange
                };
            }), record.selectionBefore);
    }
};

exports.undoManagerCommand = function(args, request) {
    var editor = env.editor;
    editor.buffer.undoManager[request.commandExt.name]()
};

});

bespin.tiki.module("text_editor:controllers/layoutmanager",function(require,exports,module) {
/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Bespin.
 *
 * The Initial Developer of the Original Code is
 * Mozilla.
 * Portions created by the Initial Developer are Copyright (C) 2009
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Bespin Team (bespin@mozilla.com)
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

var util = require('bespin:util/util');
var Event = require("events").Event;
var Range = require('rangeutils:utils/range');
var SyntaxManager = require('syntax_manager').SyntaxManager;
var TextStorage = require('models/textstorage').TextStorage;
var catalog = require('bespin:plugins').catalog;
var settings = require('settings').settings;
var m_scratchcanvas = require('bespin:util/scratchcanvas');

var fontDimension = {};

var computeFontDimension = function() {
    var fontSize = settings.get('fontsize');
    var fontFace = settings.get('fontface');
    var font = fontSize + 'px ' + fontFace;

    var canvas = m_scratchcanvas.get();

    // Measure a large string to work around the fact that width and height
    // are truncated to the nearest integer in the canvas API.
    var str = '';
    for (var i = 0; i < 100; i++) {
        str += 'M';
    }

    var width = canvas.measureStringWidth(font, str) / 100;

    fontDimension.characterWidth = width;

    fontDimension.lineHeight = Math.floor(fontSize * 1.6);
    fontDimension.lineAscent = Math.floor(fontSize * 1.3);
};

computeFontDimension();

catalog.registerExtension('settingChange', {
    match: "font[size|face]",
    pointer: computeFontDimension
});

exports.LayoutManager = function(opts) {
    this.changedTextAtRow = new Event();
    this.invalidatedRects = new Event();

    // Put the global variable on the instance.
    this.fontDimension = fontDimension;

    // There is no setter for textStorage so we have to change it to
    // _textStorage to make things work with util.mixin().
    if (opts.textStorage) {
        opts._textStorage = opts.textStorage;
        delete opts.textStorage;
    } else {
        this._textStorage = new TextStorage();
    }

    util.mixin(this, opts);

    this._textStorage.changed.add(this.textStorageChanged.bind(this));

    this.textLines = [
        {
            characters: '',
            colors:     [
                {
                    start:  0,
                    end:    0,
                    color:  'plain'
                }
            ]
        }
    ];

    var syntaxManager = new SyntaxManager(this);
    this.syntaxManager = syntaxManager;
    syntaxManager.attrsChanged.add(this._attrsChanged.bind(this));

    this._size = { width: 0, height: 0 };
    this.sizeChanged = new Event();

    this._height = 0;

    // Now that the syntax manager is set up, we can recompute the layout.
    // (See comments in _textStorageChanged().)
    this._recomputeEntireLayout();
};

exports.LayoutManager.prototype = {
    _maximumWidth: 0,
    _textStorage: null,

    _size: null,
    sizeChanged: null,

    /**
     * Theme colors. Value is set by editorView class. Don't change this
     * property directly. Use the editorView function to adjust it.
     */
    _theme: { },

    /**
     * @property
     *
     * The margins on each edge in pixels, expressed as an object with 'left',
     * 'bottom', 'top', and 'right' properties.
     *
     * Do not modify the properties of this object directly; clone, adjust, and
     * reset the margin property of the layout manager instead.
     */
    margin: { left: 5, bottom: 6, top: 0, right: 12 },

    /**
     * @property
     *
     * The plugin catalog to use. Typically this will be plugins.catalog, but
     * for testing this may be replaced with a mock object.
     */
    pluginCatalog: catalog,

    /** The syntax manager in use. */
    syntaxManager: null,

    /**
     * @property{Array<object>}
     *
     * The marked-up lines of text. Each line has the properties 'characters',
     * 'colors', and 'lineHeight'.
     */
    textLines: null,

    // Called whenever the text attributes (which usually consist of syntax
    // highlighting) change.
    _attrsChanged: function(startRow, endRow) {
        this.updateTextRows(startRow, endRow);

        var invalidRects = this.rectsForRange({
            start:  { row: startRow, col: 0 },
            end:    { row: endRow, col: 0 }
        });

        this.invalidatedRects(this, invalidRects);
    },

    _computeInvalidRects: function(oldRange, newRange) {
        var startRect = this.characterRectForPosition(oldRange.start);

        var lineRect = {
            x:      startRect.x,
            y:      startRect.y,
            width:  Number.MAX_VALUE,
            height: startRect.height
        };

        return oldRange.end.row === newRange.end.row ?
            [ lineRect ] :
            [
                lineRect,
                {
                    x:      0,
                    y:      startRect.y + fontDimension.lineHeight,
                    width:  Number.MAX_VALUE,
                    height: Number.MAX_VALUE
                }
            ];
    },

    // Returns the last valid position in the buffer.
    _lastCharacterPosition: function() {
        return {
            row: this.textLines.length - 1,
            col: this._maximumWidth
        };
    },

    _recalculateMaximumWidth: function() {
        // Lots of room for optimization here if this turns out to be slow. But
        // for now...
        var textLines = this.textLines;
        var max = 0;
        textLines.forEach(function(line) {
            var width = line.characters.length;
            if (max < width) {
                max = width;
            }
        });
        this._maximumWidth = max;

        this.size = { width: max, height: this.textLines.length };
    },

    _recomputeEntireLayout: function() {
        var entireRange = this._textStorage.range;
        this._recomputeLayoutForRanges(entireRange, entireRange);
    },

    _recomputeLayoutForRanges: function(oldRange, newRange) {
        var oldStartRow = oldRange.start.row, oldEndRow = oldRange.end.row;
        var newEndRow = newRange.end.row;
        var newRowCount = newEndRow - oldStartRow + 1;

        var lines = this._textStorage.lines;
        var theme = this._theme;
        var plainColor = theme.plain;

        var newTextLines = [];
        for (var i = 0; i < newRowCount; i++) {
            var line = lines[oldStartRow + i];
            newTextLines[i] = {
                characters: line,
                colors: [ { start: 0, end: null, color: plainColor } ]
            };
        }

        this.textLines = util.replace(this.textLines, oldStartRow,
                                oldEndRow - oldStartRow + 1, newTextLines);
        this._recalculateMaximumWidth();

        // Resize if necessary.
        var newHeight = this.textLines.length;
        var syntaxManager = this.syntaxManager;
        if (this._height !== newHeight) {
            this._height = newHeight;
        }

        // Invalidate the start row (starting the syntax highlighting).
        syntaxManager.invalidateRow(oldStartRow);

        // Take the cached attributes from the syntax manager.
        this.updateTextRows(oldStartRow, newEndRow + 1);

        this.changedTextAtRow(this, oldStartRow);

        var invalidRects = this._computeInvalidRects(oldRange, newRange);
        this.invalidatedRects(this, invalidRects);
    },

    /**
     * Determines the boundaries of the entire text area.
     *
     * TODO: Unit test.
     */
    boundingRect: function() {
        return this.rectsForRange({
            start:  { row: 0, col: 0 },
            end:    {
                row: this.textLines.length - 1,
                col: this._maximumWidth
            }
        })[0];
    },

    /**
     * Determines the location of the character underneath the given point.
     *
     * @return Returns an object with three properties:
     *   * row: The row of the character nearest the point.
     *   * col: The col of the character nearest the point.
     *   * partialFraction: The fraction of the horizontal distance between
     *       this character and the next character. The extreme left of the
     *       character is 0.0, while the extreme right of the character is 1.0.
     *       If you are calling this function to determine where to place the
     *       cursor, then you should place the cursor after the returned
     *       character if this value is greater than 0.5.
     *
     * If there is no character under the point, then the character nearest the
     * given point is returned, according to the selection rules.
     */
    characterAtPoint: function(point) {
        var margin = this.margin;
        var x = point.x - margin.left, y = point.y - margin.top;

        var characterWidth = fontDimension.characterWidth;
        var textStorage = this._textStorage;
        var clampedPosition = textStorage.clampPosition({
            row: Math.floor(y / fontDimension.lineHeight),
            col: Math.floor(x / characterWidth)
        });

        var lineLength = textStorage.lines[clampedPosition.row].length;
        clampedPosition.partialFraction = x < 0 ||
            clampedPosition.col === lineLength ? 0.0 :
            x % characterWidth / characterWidth;

        return clampedPosition;
    },

    /**
     * Given a rectangle expressed in pixels, returns the range of characters
     * that lie at least partially within the rectangle as an object.
     *
     * TODO: Write unit tests for this method.
     */
    characterRangeForBoundingRect: function(rect) {
        // TODO: variable line heights, needed for word wrap and perhaps
        // extensions as well
        var lineHeight = fontDimension.lineHeight;
        var characterWidth = fontDimension.characterWidth;
        var margin = this.margin;
        var x = rect.x - margin.left, y = rect.y - margin.top;
        return {
            start:  {
                row: Math.max(Math.floor(y / lineHeight), 0),
                col: Math.max(Math.floor(x / characterWidth), 0)
            },
            end:    {
                row: Math.floor((y + rect.height - 1) / lineHeight),
                col: Math.floor((x + rect.width - 1) / characterWidth) + 1
            }
        };
    },

    /**
     * Returns the boundaries of the character at the given position.
     */
    characterRectForPosition: function(position) {
        return this.rectsForRange({
            start:  position,
            end:    { row: position.row, col: position.col + 1 }
        })[0];
    },

    /**
     * Returns the pixel boundaries of the given line.
     *
     * TODO: Unit test.
     */
    lineRectForRow: function(row) {
        return this.rectsForRange({
            start:  { row: row, col: 0                   },
            end:    { row: row, col: this._maximumWidth  }
        })[0];
    },

    rectForPosition: function(position) {
        var margin = this.margin;
        var characterWidth = fontDimension.characterWidth;
        var lineHeight = fontDimension.lineHeight;
        return {
            x:      margin.left + characterWidth * position.col,
            y:      margin.top + lineHeight * position.row,
            width:  characterWidth,
            height: lineHeight
        };
    },

    /**
     * Returns the 1, 2, or 3 rectangles that make up the given range.
     */
    rectsForRange: function(range) {
        var characterWidth = fontDimension.characterWidth;
        var lineHeight = fontDimension.lineHeight;
        var maximumWidth = this._maximumWidth;
        var margin = this.margin;

        var start = range.start, end = range.end;
        var startRow = start.row, startColumn = start.col;
        var endRow = end.row, endColumn = end.col;

        if (startRow === endRow) {
            // The simple rectangle case.
            return [
                {
                    x:      margin.left + characterWidth * startColumn,
                    y:      margin.top + lineHeight * startRow,
                    width:  characterWidth * (endColumn - startColumn),
                    height: lineHeight
                }
            ];
        }

        var rects = [];

        // Top line
        var middleStartRow;
        if (startColumn === 0) {
            middleStartRow = startRow;
        } else {
            middleStartRow = startRow + 1;
            rects.push({
                x:      margin.left + characterWidth * startColumn,
                y:      margin.top + lineHeight * startRow,
                width:  99999, // < Number.MAX_VALUE is not working here.
                height: lineHeight
            });
        }

        // Bottom line
        var middleEndRow;
        if (endColumn === 0) {
            middleEndRow = endRow - 1;
        } else if (endColumn === maximumWidth) {
            middleEndRow = endRow;
        } else {
            middleEndRow = endRow - 1;
            rects.push({
                x:      margin.left,
                y:      margin.top + lineHeight * endRow,
                width:  characterWidth * endColumn,
                height: lineHeight
            });
        }

        // Middle area
        rects.push({
            x:      margin.left,
            y:      margin.top + lineHeight * middleStartRow,
            width:  99999, // < Number.MAX_VALUE is not working here.
            height: lineHeight * (middleEndRow - middleStartRow + 1)
        });

        return rects;
    },

    textStorageChanged: function(oldRange, newRange) {
        this._recomputeLayoutForRanges(oldRange, newRange);
    },

    /**
     * Updates the text lines in the given range to correspond to the current
     * state of the syntax highlighter. Does not actually run the syntax
     * highlighters.
     */
    updateTextRows: function(startRow, endRow) {
        var textLines = this.textLines;
        var attrs = this.syntaxManager.getAttrsForRows(startRow, endRow);
        var theme = this._theme;

        for (var i = 0; i < attrs.length; i++) {
            textLines[startRow + i].colors = attrs[i];
        }
    }
};

Object.defineProperties(exports.LayoutManager.prototype, {
    size: {
        set: function(size) {
            if (size.width !== this._size.width || size.height !== this._size.height) {
                this.sizeChanged(size);
                this._size = size;
            }
        },

        get: function() {
            return this._size;
        }
    },

    textStorage: {
        get: function() {
            return this._textStorage;
        }
    }
})

});

bespin.tiki.module("text_editor:controllers/search",function(require,exports,module) {
/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Bespin.
 *
 * The Initial Developer of the Original Code is
 * Mozilla.
 * Portions created by the Initial Developer are Copyright (C) 2009
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Bespin Team (bespin@mozilla.com)
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

var util = require('bespin:util/util');
var Range = require('rangeutils:utils/range');
var console = require('bespin:console').console;

/**
 * @class
 *
 * Manages the Find functionality.
 */
exports.EditorSearchController = function(editor) {
    this.editor = editor;
};

exports.EditorSearchController.prototype = {

    /**
     * The editor holding the buffer object to search in.
     */
    editor: null,

    /**
     * This is based on the idea from:
     *      http://simonwillison.net/2006/Jan/20/escape/.
     */
    _escapeString: /(\/|\.|\*|\+|\?|\||\(|\)|\[|\]|\{|\}|\\)/g,

    _findMatchesInString: function(str) {
        var result = [];
        var searchRegExp = this.searchRegExp;
        var searchResult;
        var endIndex;

        searchRegExp.lastIndex = 0;

        while (true) {
            searchResult = searchRegExp.exec(str);
            if (searchResult === null) {
                break;
            }

            result.push(searchResult);

            var index = searchResult.index;
            searchRegExp.lastIndex = index + searchResult[0].length;
        }

        return result;
    },

    _makeRange: function(searchResult, row) {
        return {
            start: { row: row, col: searchResult.index },
            end: {
                row: row,
                col: searchResult.index + searchResult[0].length
            }
        };
    },

    /**
     * @property{boolean}
     *
     * True if the search query is a regular expression, false if it's a
     * literal string.
     */
    isRegExp: null,

    /**
     * @property{RegExp}
     *
     * The current search query as a regular expression.
     */
    searchRegExp: null,

    /**
     * @property{String}
     *
     * The current search text.
     */
    searchText: null,

    /**
     * Sets the search query.
     *
     * @param text     The search query to set.
     * @param isRegExp True if the text is a regex, false if it's a literal
     *                 string.
     */
    setSearchText: function(text, isRegExp) {
        var regExp;
        // If the search string is not a RegExp make sure to escape the
        if (!isRegExp) {
            regExp = new RegExp(text.replace(this._escapeString, '\\$1'), 'gi');
        } else {
            regExp = new RegExp(text);
        }
        this.searchRegExp = regExp;
        this.isRegExp = isRegExp;
        this.searchText = text;
    },

    /**
     * Finds the next occurrence of the search query.
     *
     * @param startPos       The position at which to restart the search.
     * @param allowFromStart True if the search is allowed to wrap.
     */
    findNext: function(startPos, allowFromStart) {
        var searchRegExp = this.searchRegExp;
        if (util.none(searchRegExp)) {
            return null;
        }

        startPos = startPos || this.editor.textView.getSelectedRange().end;

        var lines = this.editor.layoutManager.textStorage.lines;
        var searchResult;

        searchRegExp.lastIndex = startPos.col;

        var row;
        for (row = startPos.row; row < lines.length; row++) {
            searchResult = searchRegExp.exec(lines[row]);
            if (!util.none(searchResult)) {
                return this._makeRange(searchResult, row);
            }
        }

        if (!allowFromStart) {
            return null;
        }

        // Wrap around.
        for (row = 0; row <= startPos.row; row++) {
            searchResult = searchRegExp.exec(lines[row]);
            if (!util.none(searchResult)) {
                return this._makeRange(searchResult, row);
            }
        }

        return null;
    },

    /**
     * Finds the previous occurrence of the search query.
     *
     * @param startPos       The position at which to restart the search.
     * @param allowFromStart True if the search is allowed to wrap.
     */
    findPrevious: function(startPos, allowFromEnd) {
        var searchRegExp = this.searchRegExp;
        if (util.none(searchRegExp)) {
            return null;
        }

        startPos = startPos || this.editor.textView.getSelectedRange().start;

        var lines = this.editor.buffer.layoutManager.textStorage.lines;
        var searchResults;

        // Treat the first line specially.
        var firstLine = lines[startPos.row].substring(0, startPos.col);
        searchResults = this._findMatchesInString(firstLine);

        if (searchResults.length !== 0) {
            return this._makeRange(searchResults[searchResults.length - 1],
                                                                startPos.row);
        }

        // Loop over all other lines.
        var row;
        for (row = startPos.row - 1; row !== -1; row--) {
            searchResults = this._findMatchesInString(lines[row]);
            if (searchResults.length !== 0) {
                return this._makeRange(searchResults[searchResults.length - 1],
                                                                        row);
            }
        }

        if (!allowFromEnd) {
            return null;
        }

        // Wrap around.
        for (row = lines.length - 1; row >= startPos.row; row--) {
            searchResults = this._findMatchesInString(lines[row]);
            if (searchResults.length !== 0) {
                return this._makeRange(searchResults[searchResults.length - 1],
                                                                        row);
            }
        }

        return null;
    }
};


});

bespin.tiki.module("text_editor:models/buffer",function(require,exports,module) {
/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Bespin.
 *
 * The Initial Developer of the Original Code is
 * Mozilla.
 * Portions created by the Initial Developer are Copyright (C) 2009
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Bespin Team (bespin@mozilla.com)
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

var env = require('environment').env;

var util = require('bespin:util/util');

var Promise = require('bespin:promise').Promise;
var TextStorage = require('models/textstorage').TextStorage;
var LayoutManager = require('controllers/layoutmanager').LayoutManager;
var UndoManager = require('undomanager').UndoManager;

/**
 * A Buffer connects a model and file together. It also holds the layoutManager
 * that is bound to the model. The syntaxManager can get accessed via the
 * layoutManager as well.
 *
 * Per opened file there is one buffer which means that one buffer is
 * corresponding to one file on the disk. If you open different file, you have
 * to create a new buffer for that file.
 *
 * To create a buffer that is (not yet) bound to a file, just create the Buffer
 * without a file passed.
 */
exports.Buffer = function(file, initialContent) {
    this._file = file;
    this._model = new TextStorage(initialContent);
    this._layoutManager = new LayoutManager({
        textStorage: this._model
    });

    this.undoManager = new UndoManager();

    // If a file is passed, then load it. This is the same as calling reload.
    if (file) {
        this.reload().then(function() {
            this._updateSyntaxManagerInitialContext();
        }.bind(this));
    } else {
        this.loadPromise = new Promise();
        this.loadPromise.resolve();
    }

    // Restore the state of the buffer (selection + scrollOffset).
    // TODO: Refactor this code into the ViewState.
    var history = (env.session ? env.session.history : null);
    var item, selection, scrollOffset;

    // If
    //  1.  Check if a history exists and the buffer has a file (-> path)
    //  2.  Ask the history object for the history for the current file.
    //      If no history is found, null is returned.
    if (history && file &&                                  // 1.
            (item = history.getHistoryForPath(file.path))   // 2.
    ) {
        // There is no state saved in the buffer and the history object
        // has a state saved.
        selection = item.selection;
        scrollOffset = item.scroll;
    }

    // Use the saved values from the history or the default values.
    this._selectedRange = selection || {
        start: { row: 0, col: 0 },
        end: { row: 0, col: 0 }
    };

    this._scrollOffset = scrollOffset || { x: 0, y: 0 };
};

exports.Buffer.prototype = {
    /**
     * The undoManager where the undo/redo stack is stored and handled.
     */
    undoManager: null,

    loadPromise: null,

    _scrollOffset: null,
    _selectedRange: null,
    _selectedRangeEndVirtual: null,

    /**
     * The syntax manager associated with this file.
     */
    _layoutManager: null,

    /**
     * The file object associated with this buffer. The file instance can only
     * be assigned when constructing the buffer or calling saveAs.
     */
    _file: null,

   /**
    * The text model that is holding the content of the file.
    */
    _model: null,

    /**
     * Save the contents of this buffer. Returns a promise that resolves
     * once the file is saved.
     */
    save: function() {
        return this._file.saveContents(this._model.value);
    },

    /**
     * Saves the contents of this buffer to a new file, and updates the file
     * field of this buffer to point to the result.
     *
     * @param {File} newFile The pathname to save to, as a File object.
     * @return A promise to return the newly-saved file.
     */
    saveAs: function(newFile) {
        var promise = new Promise();

        newFile.saveContents(this._model.value).then(function() {
            this._file = newFile;
            this._updateSyntaxManagerInitialContext();
            promise.resolve();
        }.bind(this), function(error) {
            promise.reject(error);
        });

        return promise;
    },

    /**
     * Reload the existing file contents from the server.
     */
    reload: function() {
        var file = this._file;
        var self = this;

        var pr;
        pr =  file.loadContents().then(function(contents) {
            self._model.value = contents;
        });
        this.loadPromise = pr;
        return pr;
    },

    _updateSyntaxManagerInitialContext: function() {
        var ext = this._file.extension();
        var syntaxManager = this._layoutManager.syntaxManager;
        syntaxManager.setSyntaxFromFileExt(ext === null ? '' : ext);
    },

    /**
     * Returns true if the file is untitled (i.e. it is new and has not yet
     * been saved with @saveAs) or false otherwise.
     */
    untitled: function() {
        return util.none(this._file);
    }
};

Object.defineProperties(exports.Buffer.prototype, {
    layoutManager: {
        get: function() {
            return this._layoutManager;
        }
    },

    syntaxManager: {
        get: function() {
            this._layoutManager.syntaxManager;
        }
    },

    file: {
        get: function() {
            return this._file;
        }
    },

    model: {
        get: function() {
            return this._model;
        }
    }
});

});

bespin.tiki.module("text_editor:models/textstorage",function(require,exports,module) {
/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Bespin.
 *
 * The Initial Developer of the Original Code is
 * Mozilla.
 * Portions created by the Initial Developer are Copyright (C) 2009
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Bespin Team (bespin@mozilla.com)
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

var Event = require('events').Event;
var util = require('bespin:util/util');

var TextStorage;

/**
 * Creates a new text storage object holding the given string (if supplied).
 *
 * @constructor
 * @exports TextStorage as text_editor:models.textstorage.TextStorage
 */
TextStorage = function(initialValue) {
    if (initialValue !== null && initialValue !== undefined) {
        this._lines = initialValue.split("\n");
    } else {
        this._lines = [ '' ];
    }

    /**
     * Called whenever the text changes with the old and new ranges supplied.
     */
    this.changed = new Event();

    return this;
};

TextStorage.prototype = {
    /** @lends TextStorage */

    _lines: null,

    /**
     * Whether this model is read-only. Attempts to modify a read-only model
     * result in exceptions.
     *
     * @type {boolean}
     */
    readOnly: false,

    /**
     * Returns the position of the nearest character to the given position,
     * according to the selection rules.
     *
     * @param {position} pos The position to clamp.
     */
    clampPosition: function(pos) {
        var lines = this._lines;

        var row = pos.row;
        if (row < 0) {
            return { row: 0, col: 0 };
        } else if (row >= lines.length) {
            return this.range.end;
        }

        var col = Math.max(0, Math.min(pos.col, lines[row].length));
        return { row: row, col: col };
    },

    /**
     * Returns the actual range closest to the given range, according to the
     * selection rules.
     */
    clampRange: function(range) {
        var start = this.clampPosition(range.start);
        var end = this.clampPosition(range.end);
        return { start: start, end: end };
    },

    /** Deletes all characters in the range. */
    deleteCharacters: function(range) {
        this.replaceCharacters(range, '');
    },

    /**
     * Returns the result of displacing the given position by count characters
     * forward (if count > 0) or backward (if count < 0).
     */
    displacePosition: function(pos, count) {
        var forward = count > 0;
        var lines = this._lines;
        var lineCount = lines.length;

        for (var i = Math.abs(count); i !== 0; i--) {
            if (forward) {
                var rowLength = lines[pos.row].length;
                if (pos.row === lineCount - 1 && pos.col === rowLength) {
                    return pos;
                }
                pos = pos.col === rowLength ?
                    { row: pos.row + 1, col: 0            } :
                    { row: pos.row,     col: pos.col + 1  };
            } else {
                if (pos.row === 0 && pos.col == 0) {
                    return pos;
                }

                if (pos.col === 0) {
                    lines = this._lines;
                    pos = {
                        row:    pos.row - 1,
                        col: lines[pos.row - 1].length
                    };
                } else {
                    pos = { row: pos.row, col: pos.col - 1 };
                }
            }
        }
        return pos;
    },

    /**
     * Returns the characters in the given range as a string.
     */
    getCharacters: function(range) {
        var lines = this._lines;
        var start = range.start, end = range.end;
        var startRow = start.row, endRow = end.row;
        var startCol = start.col, endCol = end.col;

        if (startRow === endRow) {
            return lines[startRow].substring(startCol, endCol);
        }

        var firstLine = lines[startRow].substring(startCol);
        var middleLines = lines.slice(startRow + 1, endRow);
        var endLine = lines[endRow].substring(0, endCol);
        return [ firstLine ].concat(middleLines, endLine).join('\n');
    },

    /** Returns the lines of the text storage as a read-only array. */
    getLines: function() {
        return this._lines;
    },

    /** Returns the span of the entire text content. */
    getRange: function() {
        var lines = this._lines;
        var endRow = lines.length - 1;
        var endCol = lines[endRow].length;
        var start = { row: 0, col: 0 }, end = { row: endRow, col: endCol };
        return { start: start, end: end };
    },

    /** Returns the text in the text storage as a string. */
    getValue: function() {
        return this._lines.join('\n');
    },

    /** Inserts characters at the supplied position. */
    insertCharacters: function(pos, chars) {
        this.replaceCharacters({ start: pos, end: pos }, chars);
    },

    /** Replaces the characters within the supplied range. */
    replaceCharacters: function(oldRange, characters) {
        if (this.readOnly) {
            throw new Error("Attempt to modify a read-only text storage " +
                "object");
        }

        var addedLines = characters.split('\n');
        var addedLineCount = addedLines.length;

        var newRange = this.resultingRangeForReplacement(oldRange, addedLines);

        var oldStart = oldRange.start, oldEnd = oldRange.end;
        var oldStartRow = oldStart.row, oldEndRow = oldEnd.row;
        var oldStartColumn = oldStart.col;

        var lines = this._lines;
        addedLines[0] = lines[oldStartRow].substring(0, oldStartColumn) +
            addedLines[0];
        addedLines[addedLineCount - 1] +=
            lines[oldEndRow].substring(oldEnd.col);

        this._lines = util.replace(lines, oldStartRow, oldEndRow - oldStartRow + 1, addedLines);

        this.changed(oldRange, newRange, characters);
    },

    /**
     * Returns the character range that would be modified if the range were
     * replaced with the given lines.
     */
    resultingRangeForReplacement: function(range, lines) {
        var lineCount = lines.length;
        var lastLineLength = lines[lineCount - 1].length;
        var start = range.start;
        var endRow = start.row + lineCount - 1;
        var endCol = (lineCount === 1 ? start.col : 0) + lastLineLength;
        return { start: start, end: { row: endRow, col: endCol } };
    },

    setLines: function(newLines) {
        this.setValue(newLines.join('\n'));
    },

    setValue: function(newValue) {
        this.replaceCharacters(this.range, newValue);
    }
};

exports.TextStorage = TextStorage;

Object.defineProperties(exports.TextStorage.prototype, {
    lines: {
        get: function() {
            return this.getLines();
        },
        set: function(newLines) {
            return this.setLines(newLines);
        }
    },
    
    range: {
        get: function() {
            return this.getRange();
        }
    },
    
    value: {
        get: function() {
            return this.getValue();
        },
        set: function(newValue) {
            this.setValue(newValue);
        }
    }
});

});

bespin.tiki.module("text_editor:utils/rect",function(require,exports,module) {
/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Bespin.
 *
 * The Initial Developer of the Original Code is
 * Mozilla.
 * Portions created by the Initial Developer are Copyright (C) 2009
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Bespin Team (bespin@mozilla.com)
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

/**
 * @private
 *
 * Returns the distance between the given value and the given inclusive upper
 * and lower bounds, or 0 if the value lies between them.
 *
 * Exported so that the function can be unit tested.
 */
exports._distanceFromBounds = function(value, low, high) {
    if (value < low) {
        return value - low;
    }
    if (value >= high) {
        return value - high;
    }
    return 0;
};

/**
 * Merges the rectangles in a given set and returns the resulting set of non-
 * overlapping rectanlges.
 */
exports.merge = function(set) {
    var modified;
    do {
        modified = false;
        var newSet = [];

        for (var i = 0; i < set.length; i++) {
            var rectA = set[i];
            newSet.push(rectA);
            for (var j = i+1; j < set.length; j++) {
                var rectB = set[j];
                if (exports.rectsSideBySide(rectA, rectB) ||
                                        exports.rectsIntersect(rectA, rectB)) {
                    set.splice(j, 1);

                    // There's room for optimization here...
                    newSet[newSet.length - 1] = exports.unionRects(rectA, rectB);

                    modified = true;
                    break;
                }
            }
        }

        set = newSet;
    } while (modified);

    return set;
};

/**
 * Returns the vector representing the shortest offset between the given
 * rectangle and the given point.
 */
exports.offsetFromRect = function(rect, point) {
    return {
        x: exports._distanceFromBounds(point.x, rect.x, exports.maxX(rect)),
        y: exports._distanceFromBounds(point.y, rect.y, exports.maxY(rect))
    };
};

/**
 * Returns true if the rectanges intersect or false otherwise. Adjacent
 * rectangles don't count; they must actually overlap some region.
 */
exports.rectsIntersect = function(a, b) {
    var intersection = exports.intersectRects(a, b);
    return intersection.width !== 0 && intersection.height !== 0;
};

/**
 * Checks if two rects lay side by side. Returns true if this is true.
 * For example:
 *      +------------+---------------+
 *      |    A       |       B       |
 *      +------------+---------------+
 * will be true, but if B is only one pixel shifted up,
 * then it would return false.
 */
exports.rectsSideBySide = function(a, b) {
    if (a.x == b.x && a.width == b.width) {
        if (a.y < b.y) {
            return (a.y + a.height) == b.y;
        } else {
            return (b.y + b.height) == a.y;
        }
    } else if (a.y == b.y && a.height == b.height) {
        if (a.x < b.x) {
            return (a.x + a.width) == b.x;
        } else {
            return (b.x + b.width) == a.x;
        }
    }
    return false;
};

// extracted from SproutCore
exports.intersectRects = function(r1, r2) {
  // find all four edges
  var ret = {
    x: Math.max(exports.minX(r1), exports.minX(r2)),
    y: Math.max(exports.minY(r1), exports.minY(r2)),
    width: Math.min(exports.maxX(r1), exports.maxX(r2)),
    height: Math.min(exports.maxY(r1), exports.maxY(r2))
  } ;

  // convert edges to w/h
  ret.width = Math.max(0, ret.width - ret.x) ;
  ret.height = Math.max(0, ret.height - ret.y) ;
  return ret ;
};

/** Return the left edge of the frame */
exports.minX = function(frame) {
  return frame.x || 0;
};

/** Return the right edge of the frame. */
exports.maxX = function(frame) {
  return (frame.x || 0) + (frame.width || 0);
};

/** Return the top edge of the frame */
exports.minY = function(frame) {
  return frame.y || 0 ;
};

/** Return the bottom edge of the frame */
exports.maxY = function(frame) {
  return (frame.y || 0) + (frame.height || 0) ;
};

/** Check if the given point is inside the rect. */
exports.pointInRect = function(point, f) {
    return  (point.x >= exports.minX(f)) &&
            (point.y >= exports.minY(f)) &&
            (point.x <= exports.maxX(f)) &&
            (point.y <= exports.maxY(f)) ;
};

/** Returns the union between two rectangles

  @param r1 {Rect} The first rect
  @param r2 {Rect} The second rect
  @returns {Rect} The union rect.
*/
exports.unionRects = function(r1, r2) {
  // find all four edges
  var ret = {
    x: Math.min(exports.minX(r1), exports.minX(r2)),
    y: Math.min(exports.minY(r1), exports.minY(r2)),
    width: Math.max(exports.maxX(r1), exports.maxX(r2)),
    height: Math.max(exports.maxY(r1), exports.maxY(r2))
  } ;

  // convert edges to w/h
  ret.width = Math.max(0, ret.width - ret.x) ;
  ret.height = Math.max(0, ret.height - ret.y) ;
  return ret ;
};

/** Return true if the two frames match.  You can also pass only points or sizes.

  @param r1 {Rect} the first rect
  @param r2 {Rect} the second rect
  @param delta {Float} an optional delta that allows for rects that do not match exactly. Defaults to 0.1
  @returns {Boolean} true if rects match
 */
exports.rectsEqual = function(r1, r2, delta) {
    if (!r1 || !r2) return (r1 == r2) ;
    if (!delta && delta !== 0) delta = 0.1;
    if ((r1.y != r2.y) && (Math.abs(r1.y - r2.y) > delta)) return false ;
    if ((r1.x != r2.x) && (Math.abs(r1.x - r2.x) > delta)) return false ;
    if ((r1.width != r2.width) && (Math.abs(r1.width - r2.width) > delta)) return false ;
    if ((r1.height != r2.height) && (Math.abs(r1.height - r2.height) > delta)) return false ;
    return true ;
};

});

bespin.tiki.module("text_editor:index",function(require,exports,module) {

});
;bespin.tiki.register("::less", {
    name: "less",
    dependencies: {  }
});
bespin.tiki.module("less:index",function(require,exports,module) {
"define metadata";
({
    "description": "Leaner CSS",
    "url": "http://lesscss.org",
    "dependencies": {},
    "provides": [],
    "keywords": ["css", "parser", "lesscss", "browser"],
    "author": "Alexis Sellier <self@cloudhead.net>",
    "contributors": [],
    "version": "1.0.11"
});
"end";

// --- Begin less.js ---

//
// LESS - Leaner CSS v1.0.11
// http://lesscss.org
// 
// Copyright (c) 2010, Alexis Sellier
// Licensed under the MIT license.
//

// Tell the LESS library that this is a dist build. Important when using the
// dist build as a one-file CommonJS package.
var __LESS_DIST__ = true;

// ecma-5.js
//
// -- kriskowal Kris Kowal Copyright (C) 2009-2010 MIT License
// -- tlrobinson Tom Robinson
// dantman Daniel Friesen

//
// Array
//
if (!Array.isArray) {
    Array.isArray = function(obj) {
        return Object.prototype.toString.call(obj) === "[object Array]" ||
               (obj instanceof Array);
    };
}
if (!Array.prototype.forEach) {
    Array.prototype.forEach =  function(block, thisObject) {
        var len = this.length >>> 0;
        for (var i = 0; i < len; i++) {
            if (i in this) {
                block.call(thisObject, this[i], i, this);
            }
        }
    };
}
if (!Array.prototype.map) {
    Array.prototype.map = function(fun /*, thisp*/) {
        var len = this.length >>> 0;
        var res = new Array(len);
        var thisp = arguments[1];

        for (var i = 0; i < len; i++) {
            if (i in this) {
                res[i] = fun.call(thisp, this[i], i, this);
            }
        }
        return res;
    };
}
if (!Array.prototype.filter) {
    Array.prototype.filter = function (block /*, thisp */) {
        var values = [];
        var thisp = arguments[1];
        for (var i = 0; i < this.length; i++) {
            if (block.call(thisp, this[i])) {
                values.push(this[i]);
            }
        }
        return values;
    };
}
if (!Array.prototype.reduce) {
    Array.prototype.reduce = function(fun /*, initial*/) {
        var len = this.length >>> 0;
        var i = 0;

        // no value to return if no initial value and an empty array
        if (len === 0 && arguments.length === 1) throw new TypeError();

        if (arguments.length >= 2) {
            var rv = arguments[1];
        } else {
            do {
                if (i in this) {
                    rv = this[i++];
                    break;
                }
                // if array contains no values, no initial value to return
                if (++i >= len) throw new TypeError();
            } while (true);
        }
        for (; i < len; i++) {
            if (i in this) {
                rv = fun.call(null, rv, this[i], i, this);
            }
        }
        return rv;
    };
}
if (!Array.prototype.indexOf) {
    Array.prototype.indexOf = function (value /*, fromIndex */ ) {
        var length = this.length;
        var i = arguments[1] || 0;

        if (!length)     return -1;
        if (i >= length) return -1;
        if (i < 0)       i += length;

        for (; i < length; i++) {
            if (!Object.prototype.hasOwnProperty.call(this, i)) { continue }
            if (value === this[i]) return i;
        }
        return -1;
    };
}

//
// Object
//
if (!Object.keys) {
    Object.keys = function (object) {
        var keys = [];
        for (var name in object) {
            if (Object.prototype.hasOwnProperty.call(object, name)) {
                keys.push(name);
            }
        }
        return keys;
    };
}

//
// String
//
if (!String.prototype.trim) {
    String.prototype.trim = function () {
        return String(this).replace(/^\s\s*/, '').replace(/\s\s*$/, '');
    };
}
if (typeof(require) !== 'undefined') {
    var less = exports;

    if (typeof(__LESS_DIST__) === 'undefined') {
        var tree = require('less/tree');
    } else {
        var tree = {};
    }
} else {
    var less = tree = {};
}
//
// less.js - parser
//
//    A relatively straight-forward recursive-descent parser.
//    There is no tokenization/lexing stage, the input is parsed
//    in one sweep.
//
//    To make the parser fast enough to run in the browser, several
//    optimization had to be made:
//
//    - Instead of the more commonly used technique of slicing the
//      input string on every match, we use global regexps (/g),
//      and move the `lastIndex` pointer on match, foregoing `slice()`
//      completely. This gives us a 3x speed-up.
//
//    - Matching on a huge input is often cause of slowdowns,
//      especially with the /g flag. The solution to that is to
//      chunkify the input: we split it by /\n\n/, just to be on
//      the safe side. The chunks are stored in the `chunks` var,
//      `j` holds the current chunk index, and `current` holds
//      the index of the current chunk in relation to `input`.
//      This gives us an almost 4x speed-up.
//
//    - In many cases, we don't need to match individual tokens;
//      for example, if a value doesn't hold any variables, operations
//      or dynamic references, the parser can effectively 'skip' it,
//      treating it as a literal.
//      An example would be '1px solid #000' - which evaluates to itself,
//      we don't need to know what the individual components are.
//      The drawback, of course is that you don't get the benefits of
//      syntax-checking on the CSS. This gives us a 50% speed-up in the parser,
//      and a smaller speed-up in the code-gen.
//
//
//    Token matching is done with the `$` function, which either takes
//    a terminal string or regexp, or a non-terminal function to call.
//    It also takes care of moving all the indices forwards.
//
//
less.Parser = function Parser(env) {
    var input,       // LeSS input string
        i,           // current index in `input`
        j,           // current chunk
        furthest,    // furthest index the parser has gone to
        chunks,      // chunkified input
        current,     // index of current chunk, in `input`
        inputLength,
        parser;

    var that = this;

    // This function is called after all files
    // have been imported through `@import`.
    var finish = function () {};

    var imports = this.imports = {
        paths: env && env.paths || [],  // Search paths, when importing
        queue: [],                      // Files which haven't been imported yet
        files: {},                      // Holds the imported parse trees
        push: function (path, callback) {
            var that = this;
            this.queue.push(path);

            //
            // Import a file asynchronously
            //
            less.Parser.importer(path, this.paths, function (root) {
                that.queue.splice(that.queue.indexOf(path), 1); // Remove the path from the queue
                that.files[path] = root;                        // Store the root

                callback(root);

                if (that.queue.length === 0) { finish() }       // Call `finish` if we're done importing
            });
        }
    };

    //
    // Parse from a token, regexp or string, and move forward if match
    //
    function $(tok) {
        var match, args, length, c, index, endIndex;

        //
        // Non-terminal
        //
        if (tok instanceof Function) {
            return tok.call(parser.parsers);
        //
        // Terminal
        //
        //     Either match a single character in the input,
        //     or match a regexp in the current chunk (chunk[j]).
        //
        } else if (typeof(tok) === 'string') {
            match = input.charAt(i) === tok ? tok : null;
            length = 1;

        //  1. We move to the next chunk, if necessary.
        //  2. Set the `lastIndex` to be relative
        //     to the current chunk, and try to match in it.
        //  3. Make sure we matched at `index`. Because we use
        //     the /g flag, the match could be anywhere in the
        //     chunk. We have to make sure it's at our previous
        //     index, which we stored in [2].
        //
        } else {
            if (i >= current + chunks[j].length &&
                j < chunks.length - 1) { // 1.
                current += chunks[j++].length;
            }
            tok.lastIndex = index =  i - current; // 2.
            match = tok.exec(chunks[j]);

            if (match) {
                length = match[0].length;
                if (tok.lastIndex - length !== index) { return } // 3.
            }
        }

        // The match is confirmed, add the match length to `i`,
        // and consume any extra white-space characters (' ' || '\n')
        // which come after that. The reason for this is that LeSS's
        // grammar is mostly white-space insensitive.
        //
        if (match) {
            i += length;
            endIndex = current + chunks[j].length;

            while (i <= endIndex) {
                c = input.charCodeAt(i);
                if (! (c === 32 || c === 10 || c === 9)) { break }
                i++;
            }

            if(typeof(match) === 'string') {
                return match;
            } else {
                return match.length === 1 ? match[0] : match;
            }
        }
    }

    // Same as $(), but don't change the state of the parser,
    // just return the match.
    function peek(tok) {
        var match;

        if (typeof(tok) === 'string') {
            return input.charAt(i) === tok;
        } else {
            tok.lastIndex = i;

            if ((match = tok.exec(input)) &&
               (tok.lastIndex - match[0].length === i)) {
                return match;
            }
        }
    }

    this.env = env || {};

    // The optimization level dictates the thoroughness of the parser,
    // the lower the number, the less nodes it will create in the tree.
    // This could matter for debugging, or if you want to access
    // the individual nodes in the tree.
    this.optimization = ('optimization' in this.env) ? this.env.optimization : 1;

    //
    // The Parser
    //
    return parser = {

        imports: imports,
        //
        // Parse an input string into an abstract syntax tree,
        // call `callback` when done.
        //
        parse: function (str, callback) {
            var root, start, end, zone, line, lines, buff = [], c, error = null;

            i = j = current = furthest = 0;
            chunks = [];
            input = str.replace(/\r\n/g, '\n');

            // Split the input into chunks,
            // delimited by /\n\n/ and 
            // removing comments (see rationale above),
            // depending on the level of optimization.
            if (that.optimization > 0) {
                input = input.replace(/\/\*(?:[^*]|\*+[^\/*])*\*+\//g, function (comment) {
                    return that.optimization > 1 ? '' : comment.replace(/\n(\s*\n)+/g, '\n');
                });
                chunks = input.split(/^(?=\n)/mg);
            } else {
                chunks = [input];
            }
            inputLength = input.length;

            // Start with the primary rule.
            // The whole syntax tree is held under a Ruleset node,
            // with the `root` property set to true, so no `{}` are
            // output. The callback is called when the input is parsed.
            root = new(tree.Ruleset)([], $(this.parsers.primary));
            root.root = true;

            root.toCSS = (function (toCSS) {
                var line, lines, column;

                return function () {
                    try {
                        return toCSS.call(this);
                    } catch (e) {
                        lines = input.split('\n');
                        line = (input.slice(0, e.index).match(/\n/g) || "").length + 1;
                        for (var n = e.index, column = -1;
                                 n >= 0 && input.charAt(n) !== '\n';
                                 n--) { column++ }

                        throw {
                            name: "NameError",
                            message: e.message,
                            line: line,
                            column: column,
                            extract: [
                                lines[line - 2],
                                lines[line - 1],
                                lines[line]
                            ]
                        };
                    }
                };
            })(root.toCSS);

            // If `i` is smaller than the `input.length - 1`,
            // it means the parser wasn't able to parse the whole
            // string, so we've got a parsing error.
            //
            // We try to extract a \n delimited string,
            // showing the line where the parse error occured.
            // We split it up into two parts (the part which parsed,
            // and the part which didn't), so we can color them differently.
            if (i < input.length - 1) {
                i = furthest;
                lines = input.split('\n');
                line = (input.slice(0, i).match(/\n/g) || "").length + 1;

                for (var n = i, column = -1; n >= 0 && input.charAt(n) !== '\n'; n--) { column++ }

                error = {
                    name: "ParseError",
                    message: "Syntax Error on line " + line,
                    filename: env.filename,
                    line: line,
                    column: column,
                    extract: [
                        lines[line - 2],
                        lines[line - 1],
                        lines[line]
                    ]
                };
            }

            if (this.imports.queue.length > 0) {
                finish = function () { callback(error, root) };
            } else {
                callback(error, root);
            }
        },

        //
        // Here in, the parsing rules/functions
        //
        // The basic structure of the syntax tree generated is as follows:
        //
        //   Ruleset ->  Rule -> Value -> Expression -> Entity
        //
        // Here's some LESS code:
        //
        //    .class {
        //      color: #fff;
        //      border: 1px solid #000;
        //      width: @w + 4px;
        //      > .child {...}
        //    }
        //
        // And here's what the parse tree might look like:
        //
        //     Ruleset (Selector '.class', [
        //         Rule ("color",  Value ([Expression [Color #fff]]))
        //         Rule ("border", Value ([Expression [Dimension 1px][Keyword "solid"][Color #000]]))
        //         Rule ("width",  Value ([Expression [Operation "+" [Variable "@w"][Dimension 4px]]]))
        //         Ruleset (Selector [Element '>', '.child'], [...])
        //     ])
        //
        //  In general, most rules will try to parse a token with the `$()` function, and if the return
        //  value is truly, will return a new node, of the relevant type. Sometimes, we need to check
        //  first, before parsing, that's when we use `peek()`.
        //
        parsers: {
            //
            // The `primary` rule is the *entry* and *exit* point of the parser.
            // The rules here can appear at any level of the parse tree.
            //
            // The recursive nature of the grammar is an interplay between the `block`
            // rule, which represents `{ ... }`, the `ruleset` rule, and this `primary` rule,
            // as represented by this simplified grammar:
            //
            //     primary  →  (ruleset | rule)+
            //     ruleset  →  selector+ block
            //     block    →  '{' primary '}'
            //
            // Only at one point is the primary rule not called from the
            // block rule: at the root level.
            //
            primary: function () {
                var node, root = [];

                while (node = $(this.mixin.definition) || $(this.rule)    ||  $(this.ruleset) ||
                              $(this.mixin.call)       || $(this.comment) ||
                              $(/[\n\s]+/g)            || $(this.directive)) {
                    root.push(node);
                }
                return root;
            },

            // We create a Comment node for CSS comments `/* */`,
            // but keep the LeSS comments `//` silent, by just skipping
            // over them.
            comment: function () {
                var comment;

                if (input.charAt(i) !== '/') return;

                if (comment = $(/\/\*(?:[^*]|\*+[^\/*])*\*+\/\n?/g)) {
                    return new(tree.Comment)(comment);
                } else {
                    return $(/\/\/.*/g);
                }
            },

            //
            // Entities are tokens which can be found inside an Expression
            //
            entities: {
                //
                // A string, which supports escaping " and '
                //
                //     "milky way" 'he\'s the one!'
                //
                quoted: function () {
                    var str;
                    if (input.charAt(i) !== '"' && input.charAt(i) !== "'") return;

                    if (str = $(/"((?:[^"\\\r\n]|\\.)*)"|'((?:[^'\\\r\n]|\\.)*)'/g)) {
                        return new(tree.Quoted)(str[0], str[1] || str[2]);
                    }
                },

                //
                // A catch-all word, such as:
                //
                //     black border-collapse
                //
                keyword: function () {
                    var k;
                    if (k = $(/[A-Za-z-]+/g)) { return new(tree.Keyword)(k) }
                },

                //
                // A function call
                //
                //     rgb(255, 0, 255)
                //
                // We also try to catch IE's `alpha()`, but let the `alpha` parser
                // deal with the details.
                //
                // The arguments are parsed with the `entities.arguments` parser.
                //
                call: function () {
                    var name, args;

                    if (! (name = $(/([a-zA-Z0-9_-]+|%)\(/g))) return;

                    if (name[1].toLowerCase() === 'alpha') { return $(this.alpha) }

                    args = $(this.entities.arguments);

                    if (! $(')')) return;

                    if (name) { return new(tree.Call)(name[1], args) }
                },
                arguments: function () {
                    var args = [], arg;

                    while (arg = $(this.expression)) {
                        args.push(arg);
                        if (! $(',')) { break }
                    }
                    return args;
                },
                literal: function () {
                    return $(this.entities.dimension) ||
                           $(this.entities.color) ||
                           $(this.entities.quoted);
                },

                //
                // Parse url() tokens
                //
                // We use a specific rule for urls, because they don't really behave like
                // standard function calls. The difference is that the argument doesn't have
                // to be enclosed within a string, so it can't be parsed as an Expression.
                //
                url: function () {
                    var value;

                    if (input.charAt(i) !== 'u' || !$(/url\(/g)) return;
                    value = $(this.entities.quoted) || $(/[-a-zA-Z0-9_%@$\/.&=:;#+?]+/g);
                    if (! $(')')) throw new(Error)("missing closing ) for url()");

                    return new(tree.URL)(value.value ? value : new(tree.Anonymous)(value));
                },

                //
                // A Variable entity, such as `@fink`, in
                //
                //     width: @fink + 2px
                //
                // We use a different parser for variable definitions,
                // see `parsers.variable`.
                //
                variable: function () {
                    var name, index = i;

                    if (input.charAt(i) === '@' && (name = $(/@[a-zA-Z0-9_-]+/g))) {
                        return new(tree.Variable)(name, index);
                    }
                },

                //
                // A Hexadecimal color
                //
                //     #4F3C2F
                //
                // `rgb` and `hsl` colors are parsed through the `entities.call` parser.
                //
                color: function () {
                    var rgb;

                    if (input.charAt(i) === '#' && (rgb = $(/#([a-fA-F0-9]{6}|[a-fA-F0-9]{3})/g))) {
                        return new(tree.Color)(rgb[1]);
                    }
                },

                //
                // A Dimension, that is, a number and a unit
                //
                //     0.5em 95%
                //
                dimension: function () {
                    var value, c = input.charCodeAt(i);
                    if ((c > 57 || c < 45) || c === 47) return;

                    if (value = $(/(-?[0-9]*\.?[0-9]+)(px|%|em|pc|ex|in|deg|s|ms|pt|cm|mm)?/g)) {
                        return new(tree.Dimension)(value[1], value[2]);
                    }
                }
            },

            //
            // The variable part of a variable definition. Used in the `rule` parser
            //
            //     @fink:
            //
            variable: function () {
                var name;

                if (input.charAt(i) === '@' && (name = $(/(@[a-zA-Z0-9_-]+)\s*:/g))) { return name[1] }
            },

            //
            // A font size/line-height shorthand
            //
            //     small/12px
            //
            // We need to peek first, or we'll match on keywords and dimensions
            //
            shorthand: function () {
                var a, b;

                if (! peek(/[@\w.-]+\/[@\w.-]+/g)) return;

                if ((a = $(this.entity)) && $('/') && (b = $(this.entity))) {
                    return new(tree.Shorthand)(a, b);
                }
            },

            //
            // Mixins
            //
            mixin: {
                //
                // A Mixin call, with an optional argument list
                //
                //     #mixins > .square(#fff);
                //     .rounded(4px, black);
                //     .button;
                //
                // The `while` loop is there because mixins can be
                // namespaced, but we only support the child and descendant
                // selector for now.
                //
                call: function () {
                    var elements = [], e, c, args, index = i;

                    while (e = $(/[#.][a-zA-Z0-9_-]+/g)) {
                        elements.push(new(tree.Element)(c, e));
                        c = $('>');
                    }
                    $('(') && (args = $(this.entities.arguments)) && $(')');

                    if (elements.length > 0 && ($(';') || peek('}'))) {
                        return new(tree.mixin.Call)(elements, args, index);
                    }
                },

                //
                // A Mixin definition, with a list of parameters
                //
                //     .rounded (@radius: 2px, @color) {
                //        ...
                //     }
                //
                // Until we have a finer grained state-machine, we have to
                // do a look-ahead, to make sure we don't have a mixin call.
                // See the `rule` function for more information.
                //
                // We start by matching `.rounded (`, and then proceed on to
                // the argument list, which has optional default values.
                // We store the parameters in `params`, with a `value` key,
                // if there is a value, such as in the case of `@radius`.
                //
                // Once we've got our params list, and a closing `)`, we parse
                // the `{...}` block.
                //
                definition: function () {
                    var name, params = [], match, ruleset, param, value;

                    if (input.charAt(i) !== '.' || peek(/[^{]*(;|})/g)) return;

                    if (match = $(/([#.][a-zA-Z0-9_-]+)\s*\(/g)) {
                        name = match[1];

                        while (param = $(/@[\w-]+/g) || $(this.entities.literal)
                                                     || $(this.entities.keyword)) {
                            // Variable
                            if (param[0] === '@') {
                                if ($(':')) {
                                    if (value = $(this.expression)) {
                                        params.push({ name: param, value: value });
                                    } else {
                                        throw new(Error)("Expected value");
                                    }
                                } else {
                                    params.push({ name: param });
                                }
                            } else {
                                params.push({ value: param });
                            }
                            if (! $(',')) { break }
                        }
                        if (! $(')')) throw new(Error)("Expected )");

                        ruleset = $(this.block);

                        if (ruleset) {
                            return new(tree.mixin.Definition)(name, params, ruleset);
                        }
                    }
                }
            },

            //
            // Entities are the smallest recognized token,
            // and can be found inside a rule's value.
            //
            entity: function () {
                return $(this.entities.literal) || $(this.entities.variable) || $(this.entities.url) ||
                       $(this.entities.call)    || $(this.entities.keyword);
            },

            //
            // A Rule terminator. Note that we use `peek()` to check for '}',
            // because the `block` rule will be expecting it, but we still need to make sure
            // it's there, if ';' was ommitted.
            //
            end: function () {
                return $(';') || peek('}');
            },

            //
            // IE's alpha function
            //
            //     alpha(opacity=88)
            //
            alpha: function () {
                var value;

                if (! $(/opacity=/gi)) return;
                if (value = $(/[0-9]+/g) || $(this.entities.variable)) {
                    if (! $(')')) throw new(Error)("missing closing ) for alpha()");
                    return new(tree.Alpha)(value);
                }
            },

            //
            // A Selector Element
            //
            //     div
            //     + h1
            //     #socks
            //     input[type="text"]
            //
            // Elements are the building blocks for Selectors,
            // they are made out of a `Combinator` (see combinator rule),
            // and an element name, such as a tag a class, or `*`.
            //
            element: function () {
                var e, t;

                c = $(this.combinator);
                e = $(/[.#:]?[a-zA-Z0-9_-]+/g) || $('*') || $(this.attribute) || $(/\([^)@]+\)/g);

                if (e) { return new(tree.Element)(c, e) }
            },

            //
            // Combinators combine elements together, in a Selector.
            //
            // Because our parser isn't white-space sensitive, special care
            // has to be taken, when parsing the descendant combinator, ` `,
            // as it's an empty space. We have to check the previous character
            // in the input, to see if it's a ` ` character. More info on how
            // we deal with this in *combinator.js*.
            //
            combinator: function () {
                var match;
                if (match = $(/[+>~]/g) || $('&') || $(/::/g)) {
                    return new(tree.Combinator)(match);
                } else {
                    return new(tree.Combinator)(input.charAt(i - 1) === " " ? " " : null);
                }
            },

            //
            // A CSS Selector
            //
            //     .class > div + h1
            //     li a:hover
            //
            // Selectors are made out of one or more Elements, see above.
            //
            selector: function () {
                var sel, e, elements = [], match;

                while (e = $(this.element)) { elements.push(e) }

                if (elements.length > 0) { return new(tree.Selector)(elements) }
            },
            tag: function () {
                return $(/[a-zA-Z][a-zA-Z-]*[0-9]?/g) || $('*');
            },
            attribute: function () {
                var attr = '', key, val, op;

                if (! $('[')) return;

                if (key = $(/[a-z-]+/g) || $(this.entities.quoted)) {
                    if ((op = $(/[|~*$^]?=/g)) &&
                        (val = $(this.entities.quoted) || $(/[\w-]+/g))) {
                        attr = [key, op, val.toCSS ? val.toCSS() : val].join('');
                    } else { attr = key }
                }

                if (! $(']')) return;

                if (attr) { return "[" + attr + "]" }
            },

            //
            // The `block` rule is used by `ruleset` and `mixin.definition`.
            // It's a wrapper around the `primary` rule, with added `{}`.
            //
            block: function () {
                var content;

                if ($('{') && (content = $(this.primary)) && $('}')) {
                    return content;
                }
            },

            //
            // div, .class, body > p {...}
            //
            ruleset: function () {
                var selectors = [], s, rules, match, memo = i;

                if (match = peek(/([a-z.#: _-]+)[\s\n]*\{/g)) {
                    i += match[0].length - 1;
                    selectors = [new(tree.Selector)([new(tree.Element)(null, match[1])])];
                } else {
                    while (s = $(this.selector)) {
                        selectors.push(s);
                        if (! $(',')) { break }
                    }
                    if (s) $(this.comment);
                }

                if (selectors.length > 0 && (rules = $(this.block))) {
                    return new(tree.Ruleset)(selectors, rules);
                } else {
                    // Backtrack
                    furthest = i;
                    i = memo;
                }
            },
            rule: function () {
                var value;
                var memo = i;

                if (name = $(this.property) || $(this.variable)) {
                    if ((name.charAt(0) != '@') && (match = peek(/([^@+\/*(;{}-]*);/g))) {
                        i += match[0].length - 1;
                        value = new(tree.Anonymous)(match[1]);
                    } else if (name === "font") {
                        value = $(this.font);
                    } else {
                        value = $(this.value);
                    }

                    if ($(this.end)) {
                        return new(tree.Rule)(name, value, memo);
                    } else {
                        furthest = i;
                        i = memo;
                    }
                }
            },

            //
            // An @import directive
            //
            //     @import "lib";
            //
            // Depending on our environemnt, importing is done differently:
            // In the browser, it's an XHR request, in Node, it would be a
            // file-system operation. The function used for importing is
            // stored in `import`, which we pass to the Import constructor.
            //
            "import": function () {
                var path;
                if ($(/@import\s+/g) &&
                    (path = $(this.entities.quoted) || $(this.entities.url)) &&
                    $(';')) {
                    return new(tree.Import)(path, imports);
                }
            },

            //
            // A CSS Directive
            //
            //     @charset "utf-8";
            //
            directive: function () {
                var name, value, rules, types;

                if (input.charAt(i) !== '@') return;

                if (value = $(this['import'])) {
                    return value;
                } else if (name = $(/@media|@page/g)) {
                    types = $(/[^{]+/g).trim();
                    if (rules = $(this.block)) {
                        return new(tree.Directive)(name + " " + types, rules);
                    }
                } else if (name = $(/@[-a-z]+/g)) {
                    if (name === '@font-face') {
                        if (rules = $(this.block)) {
                            return new(tree.Directive)(name, rules);
                        }
                    } else if ((value = $(this.entity)) && $(';')) {
                        return new(tree.Directive)(name, value);
                    }
                }
            },
            font: function () {
                var value = [], expression = [], weight, shorthand, font, e;

                while (e = $(this.shorthand) || $(this.entity)) {
                    expression.push(e);
                }
                value.push(new(tree.Expression)(expression));

                if ($(',')) {
                    while (e = $(this.expression)) {
                        value.push(e);
                        if (! $(',')) { break }
                    }
                }
                return new(tree.Value)(value, $(this.important));
            },

            //
            // A Value is a comma-delimited list of Expressions
            //
            //     font-family: Baskerville, Georgia, serif;
            //
            // In a Rule, a Value represents everything after the `:`,
            // and before the `;`.
            //
            value: function () {
                var e, expressions = [], important;

                while (e = $(this.expression)) {
                    expressions.push(e);
                    if (! $(',')) { break }
                }
                important = $(this.important);

                if (expressions.length > 0) {
                    return new(tree.Value)(expressions, important);
                }
            },
            important: function () {
                return $(/!\s*important/g);
            },
            sub: function () {
                var e;

                if ($('(') && (e = $(this.expression)) && $(')')) {
                    return e;
                }
            },
            multiplication: function () {
                var m, a, op, operation;
                if (m = $(this.operand)) {
                    while ((op = $(/[\/*]/g)) && (a = $(this.operand))) {
                        operation = new(tree.Operation)(op, [operation || m, a]);
                    }
                    return operation || m;
                }
            },
            addition: function () {
                var m, a, op, operation;
                if (m = $(this.multiplication)) {
                    while ((op = $(/[-+]\s+/g) || (input.charAt(i - 1) != ' ' && $(/[-+]/g))) &&
                           (a = $(this.multiplication))) {
                        operation = new(tree.Operation)(op, [operation || m, a]);
                    }
                    return operation || m;
                }
            },

            //
            // An operand is anything that can be part of an operation,
            // such as a Color, or a Variable
            //
            operand: function () {
                return $(this.sub) || $(this.entities.dimension) ||
                       $(this.entities.color) || $(this.entities.variable);
            },

            //
            // Expressions either represent mathematical operations,
            // or white-space delimited Entities.
            //
            //     1px solid black
            //     @var * 2
            //
            expression: function () {
                var e, delim, entities = [], d;

                while (e = $(this.addition) || $(this.entity)) {
                    entities.push(e);
                }
                if (entities.length > 0) {
                    return new(tree.Expression)(entities);
                }
            },
            property: function () {
                var name;

                if (name = $(/(\*?-?[-a-z_0-9]+)\s*:/g)) {
                    return name[1];
                }
            }
        }
    };
};

less.Parser.importer = null;

if (typeof(require) !== 'undefined' && typeof(__LESS_DIST__) === 'undefined') { var tree = require('less/tree') }

tree.functions = {
    rgb: function (r, g, b) {
        return this.rgba(r, g, b, 1.0);
    },
    rgba: function (r, g, b, a) {
        var rgb = [r, g, b].map(function (c) { return number(c) }),
            a = number(a);
        return new(tree.Color)(rgb, a);
    },
    hsl: function (h, s, l) {
        return this.hsla(h, s, l, 1.0);
    },
    hsla: function (h, s, l, a) {
        h = (((number(h) % 360) + 360) % 360) / 360;
        s = number(s); l = number(l); a = number(a);

        //require('sys').puts(h, s, l)

        var m2 = l <= 0.5 ? l * (s + 1) : l + s - l * s;
        var m1 = l * 2 - m2;

        return this.rgba(hue(h + 1/3) * 255,
                         hue(h)       * 255,
                         hue(h - 1/3) * 255,
                         a);

        function hue(h) {
            h = h < 0 ? h + 1 : (h > 1 ? h - 1 : h);
            if      (h * 6 < 1) return m1 + (m2 - m1) * h * 6;
            else if (h * 2 < 1) return m2;
            else if (h * 3 < 2) return m1 + (m2 - m1) * (2/3 - h) * 6;
            else                return m1;
        }
    },
    opacity: function(color, amount) {
        var alpha = number(amount) * (color.alpha || 1.0);
        return new(tree.Color)(color.rgb, number(amount));
    },
    saturate: function (color, amount) {
        var hsl = color.toHSL();

        hsl.s += amount.value / 100;
        hsl.s = clamp(hsl.s);
        return this.hsl(hsl.h, hsl.s, hsl.l);
    },
    desaturate: function (color, amount) {
        var hsl = color.toHSL();

        hsl.s -= amount.value / 100;
        hsl.s = clamp(hsl.s);
        return this.hsl(hsl.h, hsl.s, hsl.l);
    },
    lighten: function (color, amount) {
        var hsl = color.toHSL();

        hsl.l *= (1 + amount.value / 100);
        hsl.l = clamp(hsl.l);
        return this.hsl(hsl.h, hsl.s, hsl.l);
    },
    darken: function (color, amount) {
        var hsl = color.toHSL();

        hsl.l *= (1 - amount.value / 100);
        hsl.l = clamp(hsl.l);
        return this.hsl(hsl.h, hsl.s, hsl.l);
    },
    greyscale: function (color, amount) {
        return this.desaturate(color, new(tree.Dimension)(100));
    },
    e: function (str) {
        return new(tree.Anonymous)(str);
    },
    '%': function (quoted /* arg, arg, ...*/) {
        var args = Array.prototype.slice.call(arguments, 1),
            str = quoted.content;

        for (var i = 0; i < args.length; i++) {
            str = str.replace(/%s/,    args[i].content)
                     .replace(/%[da]/, args[i].toCSS());
        }
        str = str.replace(/%%/g, '%');
        return new(tree.Quoted)('"' + str + '"', str);
    }
};

function number(n) {
    if (n instanceof tree.Dimension) {
        return parseFloat(n.unit == '%' ? n.value / 100 : n.value);
    } else if (typeof(n) === 'number') {
        return n;
    } else {
        throw {
            error: "RuntimeError",
            message: "color functions take numbers as parameters"
        };
    }
}

function clamp(val) {
    return Math.min(1, Math.max(0, val));
}
if (typeof(require) !== 'undefined' && typeof(__LESS_DIST__) === 'undefined') { var tree = require('less/tree') }

tree.Alpha = function Alpha(val) {
    this.value = val;
};
tree.Alpha.prototype = {
    toCSS: function () {
        return "alpha(opacity=" + this.value.toCSS() + ")";
    },
    eval: function () { return this }
};
if (typeof(require) !== 'undefined' && typeof(__LESS_DIST__) === 'undefined') { var tree = require('less/tree') }

tree.Anonymous = function Anonymous(string) {
    this.value = string.content || string;
};
tree.Anonymous.prototype = {
    toCSS: function () {
        return this.value;
    },
    eval: function () { return this }
};
if (typeof(require) !== 'undefined' && typeof(__LESS_DIST__) === 'undefined') { var tree = require('less/tree') }

//
// A function call node.
//
tree.Call = function Call(name, args) {
    this.name = name;
    this.args = args;
};
tree.Call.prototype = {
    //
    // When evaluating a function call,
    // we either find the function in `tree.functions` [1],
    // in which case we call it, passing the  evaluated arguments,
    // or we simply print it out as it appeared originally [2].
    //
    // The *functions.js* file contains the built-in functions.
    //
    // The reason why we evaluate the arguments, is in the case where
    // we try to pass a variable to a function, like: `saturate(@color)`.
    // The function should receive the value, not the variable.
    //
    eval: function (env) {
        var args = this.args.map(function (a) { return a.eval(env) });

        if (this.name in tree.functions) { // 1.
            return tree.functions[this.name].apply(tree.functions, args);
        } else { // 2.
            return new(tree.Anonymous)(this.name +
                   "(" + args.map(function (a) { return a.toCSS() }).join(', ') + ")");
        }
    },

    toCSS: function (env) {
        return this.eval(env).toCSS();
    }
};
if (typeof(require) !== 'undefined' && typeof(__LESS_DIST__) === 'undefined') { var tree = require('less/tree') }
//
// RGB Colors - #ff0014, #eee
//
tree.Color = function Color(rgb, a) {
    //
    // The end goal here, is to parse the arguments
    // into an integer triplet, such as `128, 255, 0`
    //
    // This facilitates operations and conversions.
    //
    if (Array.isArray(rgb)) {
        this.rgb = rgb;
        this.alpha = a;
    } else if (rgb.length == 6) {
        this.rgb = rgb.match(/.{2}/g).map(function (c) {
            return parseInt(c, 16);
        });
    } else {
        this.rgb = rgb.split('').map(function (c) {
            return parseInt(c + c, 16);
        });
    }
};
tree.Color.prototype = {
    eval: function () { return this },

    //
    // If we have some transparency, the only way to represent it
    // is via `rgba`. Otherwise, we use the hex representation,
    // which has better compatibility with older browsers.
    // Values are capped between `0` and `255`, rounded and zero-padded.
    //
    toCSS: function () {
        if (this.alpha && this.alpha < 1.0) {
            return "rgba(" + this.rgb.concat(this.alpha).join(', ') + ")";
        } else {
            return '#' + this.rgb.map(function (i) {
                i = Math.round(i);
                i = (i > 255 ? 255 : (i < 0 ? 0 : i)).toString(16);
                return i.length === 1 ? '0' + i : i;
            }).join('');
        }
    },

    //
    // Operations have to be done per-channel, if not,
    // channels will spill onto each other. Once we have
    // our result, in the form of an integer triplet,
    // we create a new Color node to hold the result.
    //
    operate: function (op, other) {
        var result = [];

        if (! (other instanceof tree.Color)) {
            other = other.toColor();
        }

        for (var c = 0; c < 3; c++) {
            result[c] = tree.operate(op, this.rgb[c], other.rgb[c]);
        }
        return new(tree.Color)(result);
    },

    toHSL: function () {
        var r = this.rgb[0] / 255,
            g = this.rgb[1] / 255,
            b = this.rgb[2] / 255;

        var max = Math.max(r, g, b), min = Math.min(r, g, b);
        var h, s, l = (max + min) / 2, d = max - min;

        if (max === min) {
            h = s = 0;
        } else {
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2;               break;
                case b: h = (r - g) / d + 4;               break;
            }
            h /= 6;
        }
        return { h: h * 360, s: s, l: l };
    }
};

if (typeof(require) !== 'undefined' && typeof(__LESS_DIST__) === 'undefined') { var tree = require('less/tree') }

tree.Comment = function Comment(value) {
    this.value = value;
};
tree.Comment.prototype = {
    toCSS: function () {
        return this.value;
    }
};
if (typeof(require) !== 'undefined' && typeof(__LESS_DIST__) === 'undefined') { var tree = require('less/tree') }

//
// A number with a unit
//
tree.Dimension = function Dimension(value, unit) {
    this.value = parseFloat(value);
    this.unit = unit || null;
};

tree.Dimension.prototype = {
    eval: function () { return this },
    toColor: function () {
        return new(tree.Color)([this.value, this.value, this.value]);
    },
    toCSS: function () {
        var css = this.value + this.unit;
        return css;
    },

    // In an operation between two Dimensions,
    // we default to the first Dimension's unit,
    // so `1px + 2em` will yield `3px`.
    // In the future, we could implement some unit
    // conversions such that `100cm + 10mm` would yield
    // `101cm`.
    operate: function (op, other) {
        return new(tree.Dimension)
                  (tree.operate(op, this.value, other.value),
                  this.unit || other.unit);
    }
};

if (typeof(require) !== 'undefined' && typeof(__LESS_DIST__) === 'undefined') { var tree = require('less/tree') }

tree.Directive = function Directive(name, value) {
    this.name = name;
    if (Array.isArray(value)) {
        this.ruleset = new(tree.Ruleset)([], value);
    } else {
        this.value = value;
    }
};
tree.Directive.prototype = {
    toCSS: function (ctx, env) {
        if (this.ruleset) {
            this.ruleset.root = true;
            return this.name + ' {\n  ' +
                   this.ruleset.toCSS(ctx, env).trim().replace(/\n/g, '\n  ') + '\n}\n';
        } else {
            return this.name + ' ' + this.value.toCSS() + ';\n';
        }
    },
    eval: function (env) {
        env.frames.unshift(this);
        this.ruleset && this.ruleset.evalRules(env);
        env.frames.shift();
        return this;
    },
    variable: function (name) { return tree.Ruleset.prototype.variable.call(this.ruleset, name) },
    find: function () { return tree.Ruleset.prototype.find.apply(this.ruleset, arguments) },
    rulesets: function () { return tree.Ruleset.prototype.rulesets.apply(this.ruleset) }
};
if (typeof(require) !== 'undefined' && typeof(__LESS_DIST__) === 'undefined') { var tree = require('less/tree') }

tree.Element = function Element(combinator, value) {
    this.combinator = combinator instanceof tree.Combinator ?
                      combinator : new(tree.Combinator)(combinator);
    this.value = value.trim();
};
tree.Element.prototype.toCSS = function () {
    return this.combinator.toCSS() + this.value;
};

tree.Combinator = function Combinator(value) {
    if (value === ' ') {
        this.value = ' ';
    } else {
        this.value = value ? value.trim() : "";
    }
};
tree.Combinator.prototype.toCSS = function () {
    switch (this.value) {
        case ''  : return '';
        case ' ' : return ' ';
        case '&' : return '';
        case ':' : return ' :';
        case '::': return '::';
        case '+' : return ' + ';
        case '~' : return ' ~ ';
        case '>' : return ' > ';
    }
};
if (typeof(require) !== 'undefined' && typeof(__LESS_DIST__) === 'undefined') { var tree = require('less/tree') }

tree.Expression = function Expression(value) { this.value = value };
tree.Expression.prototype = {
    eval: function (env) {
        if (this.value.length > 1) {
            return new(tree.Expression)(this.value.map(function (e) {
                return e.eval(env);
            }));
        } else {
            return this.value[0].eval(env);
        }
    },
    toCSS: function () {
        return this.value.map(function (e) {
            return e.toCSS();
        }).join(' ');
    }
};
if (typeof(require) !== 'undefined' && typeof(__LESS_DIST__) === 'undefined') { var tree = require('less/tree') }
//
// CSS @import node
//
// The general strategy here is that we don't want to wait
// for the parsing to be completed, before we start importing
// the file. That's because in the context of a browser,
// most of the time will be spent waiting for the server to respond.
//
// On creation, we push the import path to our import queue, though
// `import,push`, we also pass it a callback, which it'll call once
// the file has been fetched, and parsed.
//
tree.Import = function Import(path, imports) {
    var that = this;

    this._path = path;

    // The '.less' extension is optional
    if (path instanceof tree.Quoted) {
        this.path = /\.(le?|c)ss$/.test(path.content) ? path.content : path.content + '.less';
    } else {
        this.path = path.value.content || path.value;
    }

    this.css = /css$/.test(this.path);

    // Only pre-compile .less files
    if (! this.css) {
        imports.push(this.path, function (root) {
            that.root = root;
        });
    }
};

//
// The actual import node doesn't return anything, when converted to CSS.
// The reason is that it's used at the evaluation stage, so that the rules
// it imports can be treated like any other rules.
//
// In `eval`, we make sure all Import nodes get evaluated, recursively, so
// we end up with a flat structure, which can easily be imported in the parent
// ruleset.
//
tree.Import.prototype = {
    toCSS: function () {
        if (this.css) {
            return "@import " + this._path.toCSS() + ';\n';
        } else {
            return "";
        }
    },
    eval: function () {
        if (this.css) {
            return this;
        } else {
            for (var i = 0; i < this.root.rules.length; i++) {
                if (this.root.rules[i] instanceof tree.Import) {
                    Array.prototype
                         .splice
                         .apply(this.root.rules,
                                [i, 1].concat(this.root.rules[i].eval()));
                }
            }
            return this.root.rules;
        }
    }
};
if (typeof(require) !== 'undefined' && typeof(__LESS_DIST__) === 'undefined') { var tree = require('less/tree') }

tree.Keyword = function Keyword(value) { this.value = value };
tree.Keyword.prototype = {
    eval: function () { return this },
    toCSS: function () { return this.value }
};
if (typeof(require) !== 'undefined' && typeof(__LESS_DIST__) === 'undefined') { var tree = require('less/tree') }

tree.mixin = {};
tree.mixin.Call = function MixinCall(elements, args, index) {
    this.selector = new(tree.Selector)(elements);
    this.arguments = args;
    this.index = index;
};
tree.mixin.Call.prototype = {
    eval: function (env) {
        var mixins, rules = [], match = false;

        for (var i = 0; i < env.frames.length; i++) {
            if ((mixins = env.frames[i].find(this.selector)).length > 0) {
                for (var m = 0; m < mixins.length; m++) {
                    if (mixins[m].match(this.arguments, env)) {
                        try {
                            Array.prototype.push.apply(
                                  rules, mixins[m].eval(this.arguments, env).rules);
                            match = true;
                        } catch (e) {
                            throw { message: e.message, index: this.index };
                        }
                    }
                }
                if (match) {
                    return rules;
                } else {
                    throw { message: 'No matching definition was found for `' +
                                      this.selector.toCSS().trim() + '('      +
                                      this.arguments.map(function (a) {
                                          return a.toCSS();
                                      }).join(', ') + ")`",
                            index:   this.index };
                }
            }
        }
        throw { message: this.selector.toCSS().trim() + " is undefined",
                index: this.index };
    }
};

tree.mixin.Definition = function MixinDefinition(name, params, rules) {
    this.name = name;
    this.selectors = [new(tree.Selector)([new(tree.Element)(null, name)])];
    this.params = params;
    this.arity = params.length;
    this.rules = rules;
    this._lookups = {};
    this.required = params.reduce(function (count, p) {
        if (p.name && !p.value) { return count + 1 }
        else                    { return count }
    }, 0);
};
tree.mixin.Definition.prototype = {
    toCSS: function () { return "" },
    variable: function (name) { return tree.Ruleset.prototype.variable.call(this, name) },
    find: function () { return tree.Ruleset.prototype.find.apply(this, arguments) },
    rulesets: function () { return tree.Ruleset.prototype.rulesets.apply(this) },

    eval: function (args, env) {
        var frame = new(tree.Ruleset)(null, []), context;

        for (var i = 0, val; i < this.params.length; i++) {
            if (this.params[i].name) {
                if (val = (args && args[i]) || this.params[i].value) {
                    frame.rules.unshift(new(tree.Rule)(this.params[i].name, val.eval(env)));
                } else {
                    throw { message: "wrong number of arguments for " + this.name +
                            ' (' + args.length + ' for ' + this.arity + ')' };
                }
            }
        }
        return new(tree.Ruleset)(null, this.rules).evalRules({
            frames: [this, frame].concat(env.frames)
        });
    },
    match: function (args, env) {
        var argsLength = (args && args.length) || 0;

        if (argsLength < this.required) {
            return false;
        }

        for (var i = 0; i < Math.min(argsLength, this.arity); i++) {
            if (!this.params[i].name) {
                if (args[i].wildcard) { continue }
                else if (args[i].eval(env).toCSS() != this.params[i].value.eval(env).toCSS()) {
                    return false;
                }
            }
        }
        return true;
    }
};
if (typeof(require) !== 'undefined' && typeof(__LESS_DIST__) === 'undefined') { var tree = require('less/tree') }

tree.Operation = function Operation(op, operands) {
    this.op = op.trim();
    this.operands = operands;
};
tree.Operation.prototype.eval = function (env) {
    var a = this.operands[0].eval(env),
        b = this.operands[1].eval(env),
        temp;

    if (a instanceof tree.Dimension && b instanceof tree.Color) {
        if (this.op === '*' || this.op === '+') {
            temp = b, b = a, a = temp;
        } else {
            throw { name: "OperationError",
                    message: "Can't substract or divide a color from a number" };
        }
    }
    return a.operate(this.op, b);
};

tree.operate = function (op, a, b) {
    switch (op) {
        case '+': return a + b;
        case '-': return a - b;
        case '*': return a * b;
        case '/': return a / b;
    }
};
if (typeof(require) !== 'undefined' && typeof(__LESS_DIST__) === 'undefined') { var tree = require('less/tree') }

tree.Quoted = function Quoted(value, content) {
    this.value = value;
    this.content = content;
};
tree.Quoted.prototype = {
    toCSS: function () {
        var css = this.value;
        return css;
    },
    eval: function () {
        return this;
    }
};
if (typeof(require) !== 'undefined' && typeof(__LESS_DIST__) === 'undefined') { var tree = require('less/tree') }

tree.Rule = function Rule(name, value, index) {
    this.name = name;
    this.value = (value instanceof tree.Value) ? value : new(tree.Value)([value]);
    this.index = index;

    if (name.charAt(0) === '@') {
        this.variable = true;
    } else { this.variable = false }
};
tree.Rule.prototype.toCSS = function () {
    if (this.variable) { return "" }
    else {
        return this.name + ": " + this.value.toCSS() + ";";
    }
};

tree.Rule.prototype.eval = function (context) {
    return new(tree.Rule)(this.name, this.value.eval(context));
};

tree.Value = function Value(value) {
    this.value = value;
    this.is = 'value';
};
tree.Value.prototype = {
    eval: function (env) {
        if (this.value.length === 1) {
            return this.value[0].eval(env);
        } else {
            return new(tree.Value)(this.value.map(function (v) {
                return v.eval(env);
            }));
        }
    },
    toCSS: function () {
        return this.value.map(function (e) {
            return e.toCSS();
        }).join(', ');
    }
};

tree.Shorthand = function Shorthand(a, b) {
    this.a = a;
    this.b = b;
};

tree.Shorthand.prototype = {
    toCSS: function (env) {
        return this.a.toCSS(env) + "/" + this.b.toCSS(env);
    },
    eval: function () { return this }
};
if (typeof(require) !== 'undefined' && typeof(__LESS_DIST__) === 'undefined') { var tree = require('less/tree') }

tree.Ruleset = function Ruleset(selectors, rules) {
    this.selectors = selectors;
    this.rules = rules;
    this._lookups = {};
};
tree.Ruleset.prototype = {
    eval: function () { return this },
    evalRules: function (context) {
        var rules = [];

        this.rules.forEach(function (rule) {
            if (rule.evalRules) {
                rules.push(rule.evalRules(context));
            } else if (rule instanceof tree.mixin.Call) {
                Array.prototype.push.apply(rules, rule.eval(context));
            } else {
                rules.push(rule.eval(context));
            }
        });
        this.rules = rules;
        return this;
    },
    match: function (args) {
        return !args || args.length === 0;
    },
    variable: function (name) {
        if (this._variables) { return this._variables[name] }
        else {
            return (this._variables = this.rules.reduce(function (hash, r) {
                if (r instanceof tree.Rule && r.variable === true) {
                    hash[r.name] = r;
                }
                return hash;
            }, {}))[name];
        }
    },
    rulesets: function () {
        if (this._rulesets) { return this._rulesets }
        else {
            return this._rulesets = this.rules.filter(function (r) {
                if (r instanceof tree.Ruleset || r instanceof tree.mixin.Definition) { return r }
            });
        }
    },
    find: function (selector, self) {
        self = self || this;
        var rules = [], rule, match,
            key = selector.toCSS();

        if (key in this._lookups) { return this._lookups[key] }

        this.rulesets().forEach(function (rule) {
            if (rule !== self) {
                for (var j = 0; j < rule.selectors.length; j++) {
                    if (match = selector.match(rule.selectors[j])) {
                        if (selector.elements.length > 1) {
                            Array.prototype.push.apply(rules, rule.find(
                                new(tree.Selector)(selector.elements.slice(1)), self));
                        } else {
                            rules.push(rule);
                        }
                        break;
                    }
                }
            }
        });
        return this._lookups[key] = rules;
    },
    //
    // Entry point for code generation
    //
    //     `context` holds an array of arrays.
    //
    toCSS: function (context, env) {
        var css = [],      // The CSS output
            rules = [],    // node.Rule instances
            rulesets = [], // node.Ruleset instances
            paths = [],    // Current selectors
            selector,      // The fully rendered selector
            rule;

        if (! this.root) {
            if (context.length === 0) {
                paths = this.selectors.map(function (s) { return [s] });
            } else {
                for (var s = 0; s < this.selectors.length; s++) {
                    for (var c = 0; c < context.length; c++) {
                        paths.push(context[c].concat([this.selectors[s]]));
                    }
                }
            }
        } else {
            context = [], env = { frames: [] }
            for (var i = 0; i < this.rules.length; i++) {
                if (this.rules[i] instanceof tree.Import) {
                    Array.prototype.splice
                         .apply(this.rules, [i, 1].concat(this.rules[i].eval(env)));
                }
            }
        }

        // push the current ruleset to the frames stack
        env.frames.unshift(this);

        // Evaluate mixins
        for (var i = 0; i < this.rules.length; i++) {
            if (this.rules[i] instanceof tree.mixin.Call) {
                Array.prototype.splice
                     .apply(this.rules, [i, 1].concat(this.rules[i].eval(env)));
            }
        }

        // Evaluate rules and rulesets
        for (var i = 0; i < this.rules.length; i++) {
            rule = this.rules[i];

            if (rule instanceof tree.Directive) {
                rulesets.push(rule.eval(env).toCSS(paths, env));
            } else if (rule.rules) {
                rulesets.push(rule.toCSS(paths, env));
            } else if (rule instanceof tree.Comment) {
                if (this.root) {
                    rulesets.push(rule.toCSS());
                } else {
                    rules.push(rule.toCSS());
                }
            } else {
                if (rule.toCSS && !rule.variable) {
                    rules.push(rule.eval(env).toCSS());
                } else if (rule.value && !rule.variable) {
                    rules.push(rule.value.toString());
                }
            }
        } 

        rulesets = rulesets.join('');

        // If this is the root node, we don't render
        // a selector, or {}.
        // Otherwise, only output if this ruleset has rules.
        if (this.root) {
            css.push(rules.join('\n'));
        } else {
            if (rules.length > 0) {
                selector = paths.map(function (p) {
                    return p.map(function (s) {
                        return s.toCSS();
                    }).join('').trim();
                }).join(paths.length > 3 ? ',\n' : ', ');
                css.push(selector, " {\n  " + rules.join('\n  ') + "\n}\n");
            }
        }
        css.push(rulesets);

        // Pop the stack
        env.frames.shift();

        return css.join('');
    }
};

if (typeof(require) !== 'undefined' && typeof(__LESS_DIST__) === 'undefined') { var tree = require('less/tree') }

tree.Selector = function Selector(elements) {
    this.elements = elements;
    if (this.elements[0].combinator.value === "") {
        this.elements[0].combinator.value = ' ';
    }
};
tree.Selector.prototype.match = function (other) {
    if (this.elements[0].value === other.elements[0].value) {
        return true;
    } else {
        return false;
    }
};
tree.Selector.prototype.toCSS = function () {
    if (this._css) { return this._css }

    return this._css = this.elements.map(function (e) {
        if (typeof(e) === 'string') {
            return ' ' + e.trim();
        } else {
            return e.toCSS();
        }
    }).join('');
};

if (typeof(require) !== 'undefined' && typeof(__LESS_DIST__) === 'undefined') { var tree = require('less/tree') }

tree.URL = function URL(val) {
    this.value = val;
};
tree.URL.prototype = {
    toCSS: function () {
        return "url(" + this.value.toCSS() + ")";
    },
    eval: function () { return this }
};
if (typeof(require) !== 'undefined' && typeof(__LESS_DIST__) === 'undefined') { var tree = require('less/tree') }

tree.Variable = function Variable(name, index) { this.name = name, this.index = index };
tree.Variable.prototype = {
    eval: function (env) {
        var variable, v, name = this.name;

        if (variable = tree.find(env.frames, function (frame) {
            if (v = frame.variable(name)) {
                return v.value.eval(env);
            }
        })) { return variable }
        else {
            throw { message: "variable " + this.name + " is undefined",
                    index: this.index };
        }
    }
};

if (typeof(require) !== 'undefined' && typeof(__LESS_DIST__) === 'undefined') { var tree = require('less/tree') }

tree.find = function (obj, fun) {
    for (var i = 0, r; i < obj.length; i++) {
        if (r = fun.call(obj, obj[i])) { return r }
    }
    return null;
};
(function () {
//
// Select all links with the 'rel' attribute set to "less"
//
var sheets = [];

less.env = location.hostname == '127.0.0.1' ||
           location.hostname == '0.0.0.0'   ||
           location.hostname == 'localhost' ||
           location.protocol == 'file:'     ? 'development'
                                            : 'production';


// Load the stylesheets when the body is ready
var readyTimer = setInterval(function () {
    if (document.body) {
        if (!document.querySelectorAll && typeof(jQuery) === "undefined") {
            log("No selector method found");
        } else {
            sheets = (document.querySelectorAll || jQuery).call(document, 'link[rel="stylesheet/less"]');
        }
        clearInterval(readyTimer);

        loadStyleSheets(function (root, sheet, env) {
            createCSS(root.toCSS(), sheet, env.lastModified);

            if (env.local) {
                log("less: loading " + sheet.href + " from local storage.");
            } else {
                log("less: parsed " + sheet.href + " successfully.");
            }
        });
    }
}, 10);

//
// Auto-refresh
//
if (less.env === 'development') {
    refreshTimer = setInterval(function () {
        if (/!refresh/.test(location.hash)) {
            loadStyleSheets(function (root, sheet, lastModified) {
                createCSS(root.toCSS(), sheet, lastModified);
            });
        }
    }, 1000);
}

function loadStyleSheets(callback) {
    for (var i = 0; i < sheets.length; i++) {
        loadStyleSheet(sheets[i], callback);
    }
}

function loadStyleSheet(sheet, callback) {
    var css = typeof(localStorage) !== "undefined" && localStorage.getItem(sheet.href);
    var styles = css && JSON.parse(css);

    xhr(sheet.href, function (data, lastModified) {
        if (styles && (new(Date)(lastModified).valueOf() ===
                       new(Date)(styles.timestamp).valueOf())) {
            // Use local copy
            createCSS(styles.css, sheet);
            callback(null, sheet, { local: true });
        } else {
            // Use remote copy (re-parse)
            new(less.Parser)({ optimization: 3 }).parse(data, function (e, root) {
                if (e) { return error(e, sheet.href) }
                try {
                    callback(root, sheet, { local: false, lastModified: lastModified });
                } catch (e) {
                    error(e, sheet.href);
                }
            });
        }
    }, function (status) {
        throw new(Error)("Couldn't load " + sheet.href + " (" + status + ")");
    });
}

function createCSS(styles, sheet, lastModified) {
    var css = document.createElement('style');
    css.type = 'text/css';
    css.media = 'screen';
    css.title = 'less-sheet';

    if (sheet) {
        css.title = sheet.title || sheet.href.match(/(?:^|\/)([-\w]+)\.[a-z]+$/i)[1];

        // Don't update the local store if the file wasn't modified
        if (lastModified && typeof(localStorage) !== "undefined") {
            localStorage.setItem(sheet.href, JSON.stringify({ timestamp: lastModified, css: styles }));
        }
    }

    if (css.styleSheet) {
        css.styleSheet.cssText = styles;
    } else {
        css.appendChild(document.createTextNode(styles));
    }
    document.getElementsByTagName('head')[0].appendChild(css);
}

function xhr(url, callback, errback) {
    var xhr = getXMLHttpRequest();

    if (window.location.protocol === "file:") {
        xhr.open('GET', url, false);
        xhr.send(null);
        if (xhr.status === 0) {
            callback(xhr.responseText);
        } else {
            errback(xhr.status);
        }
    } else {
        xhr.open('GET', url, true);
        xhr.onreadystatechange = function () {
            if (xhr.readyState == 4) {
                if (xhr.status >= 200 && xhr.status < 300) {
                    callback(xhr.responseText,
                             xhr.getResponseHeader("Last-Modified"));
                } else if (typeof(errback) === 'function') {
                    errback(xhr.status);
                }
            }
        };
        xhr.send(null);
    }
}

function getXMLHttpRequest() {
    if (window.XMLHttpRequest) {
        return new(XMLHttpRequest);
    } else {
        try {
            return new(ActiveXObject)("MSXML2.XMLHTTP.3.0");
        } catch (e) {
            log("less: browser doesn't support AJAX.");
            return null;
        }
    }
}

function log(str) {
    if (less.env == 'development' && typeof(console) !== "undefined") { console.log(str) }
}

function error(e, href) {
    var template = ['<div>',
                        '<pre class="ctx"><span>[-1]</span>{0}</pre>',
                        '<pre><span>[0]</span>{current}</pre>',
                        '<pre class="ctx"><span>[1]</span>{2}</pre>',
                    '</div>'].join('\n');

    var elem = document.createElement('div'), timer;
    elem.id = "less-error-message";
    elem.innerHTML = '<h3>' + (e.message || 'There is an error in your .less file') + '</h3>' +
                     '<p><a href="' + href   + '">' + href + "</a> "                +
                     'on line '     + e.line + ', column ' + (e.column + 1)         + ':</p>' +
                     template.replace(/\[(-?\d)\]/g, function (_, i) {
                         return e.line + parseInt(i);
                     }).replace(/\{(\d)\}/g, function (_, i) {
                         return e.extract[parseInt(i)];
                     }).replace(/\{current\}/, e.extract[1].slice(0, e.column)      +
                                               '<span class="error">'               +
                                               e.extract[1].slice(e.column)         +
                                               '</span>');
    // CSS for error messages
    createCSS([
        '#less-error-message span {',
            'margin-right: 15px;',
        '}',
        '#less-error-message pre {',
            'color: #ee4444;',
            'padding: 4px 0;',
            'margin: 0;',
        '}',
        '#less-error-message pre.ctx {',
            'color: #dd7777;',
        '}',
        '#less-error-message h3 {',
            'padding: 15px 0 5px 0;',
            'margin: 0;',
        '}',
        '#less-error-message a {',
            'color: #10a',
        '}',
        '#less-error-message .error {',
            'color: red;',
            'font-weight: bold;',
            'padding-bottom: 2px;',
            'border-bottom: 1px dashed red;',
        '}'
    ].join(''));

    elem.style.cssText = [
        "font-family: Arial, sans-serif",
        "border: 1px solid #e00",
        "background-color: #eee",
        "border-radius: 5px",
        "color: #e00",
        "padding: 15px",
        "margin-bottom: 15px"
    ].join(';');

    if (less.env == 'development') {
        timer = setInterval(function () {
            if (document.body) {
                document.body.insertBefore(elem, document.body.childNodes[0]);
                clearInterval(timer);
            }
        }, 10);
    }
}

less.Parser.importer = function (path, paths, callback) {
    loadStyleSheet({ href: path, title: path }, function (root) {
        callback(root);
    });
};

})();

// --- End less.js ---

});
;bespin.tiki.register("::theme_manager_base", {
    name: "theme_manager_base",
    dependencies: {  }
});
bespin.tiki.module("theme_manager_base:index",function(require,exports,module) {
/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Bespin.
 *
 * The Initial Developer of the Original Code is
 * Mozilla.
 * Portions created by the Initial Developer are Copyright (C) 2009
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Bespin Team (bespin@mozilla.com)
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

"define metadata";
({
    "description": "Defines extension points required for theming",
    "dependencies": { },
    "environments": { "main": true },
    "share": true,
    "provides": [
        {
            "ep": "extensionpoint",
            "name": "themestyles",
            "description": "(Less)files holding the CSS style information for the UI.",

            "params": [
                {
                    "name": "url",
                    "required": true,
                    "description": "Name of the ThemeStylesFile - can also be an array of files."
                }
            ]
        },
        {
            "ep": "extensionpoint",
            "name": "themeChange",
            "description": "Event: Notify when the theme(styles) changed.",

            "params": [
                {
                    "name": "pointer",
                    "required": true,
                    "description": "Function that is called whenever the theme is changed."
                }
            ]

        },
        {
            "ep": "extensionpoint",
            "name": "theme",
            "indexOn": "name",
            "description": "A theme is a way change the look of the application.",

            "params": [
                {
                    "name": "url",
                    "required": false,
                    "description": "Name of a ThemeStylesFile that holds theme specific CSS rules - can also be an array of files."
                },
                {
                    "name": "pointer",
                    "required": true,
                    "description": "Function that returns the ThemeData"
                }
            ]
        }
    ]
})
"end";

});
;bespin.tiki.register("::canon", {
    name: "canon",
    dependencies: { "environment": "0.0.0", "events": "0.0.0", "settings": "0.0.0" }
});
bespin.tiki.module("canon:request",function(require,exports,module) {
/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Bespin.
 *
 * The Initial Developer of the Original Code is
 * Mozilla.
 * Portions created by the Initial Developer are Copyright (C) 2009
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Bespin Team (bespin@mozilla.com)
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

var Event = require('events').Event;
var history = require('canon:history');

/**
 * To create an invocation, you need to do something like this (all the ctor
 * args are optional):
 * <pre>
 * var request = new Request({
 *     command: command,
 *     commandExt: commandExt,
 *     args: args,
 *     typed: typed
 * });
 * </pre>
 */
exports.Request = function(options) {
    options = options || {};

    // Will be used in the keyboard case and the cli case
    this.command = options.command;
    this.commandExt = options.commandExt;

    // Will be used only in the cli case
    this.args = options.args;
    this.typed = options.typed;

    // Have we been initialized?
    this._begunOutput = false;

    this.start = new Date();
    this.end = null;
    this.completed = false;
    this.error = false;

    this.changed = new Event();
};

/**
 * Lazy init to register with the history should only be done on output.
 * init() is expensive, and won't be used in the majority of cases
 */
exports.Request.prototype._beginOutput = function() {
    this._begunOutput = true;
    this.outputs = [];

    history.addRequestOutput(this);
};

/**
 * Sugar for:
 * <pre>request.error = true; request.done(output);</pre>
 */
exports.Request.prototype.doneWithError = function(content) {
    this.error = true;
    this.done(content);
};

/**
 * Declares that this function will not be automatically done when
 * the command exits
 */
exports.Request.prototype.async = function() {
    if (!this._begunOutput) {
        this._beginOutput();
    }
};

/**
 * Complete the currently executing command with successful output.
 * @param output Either DOM node, an SproutCore element or something that
 * can be used in the content of a DIV to create a DOM node.
 */
exports.Request.prototype.output = function(content) {
    if (!this._begunOutput) {
        this._beginOutput();
    }

    if (typeof content !== 'string' && !(content instanceof Node)) {
        content = content.toString();
    }

    this.outputs.push(content);
    this.changed();

    return this;
};

/**
 * All commands that do output must call this to indicate that the command
 * has finished execution.
 */
exports.Request.prototype.done = function(content) {
    this.completed = true;
    this.end = new Date();
    this.duration = this.end.getTime() - this.start.getTime();

    if (content) {
        this.output(content);
    } else {
        this.changed();
    }
};

});

bespin.tiki.module("canon:history",function(require,exports,module) {
/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Bespin.
 *
 * The Initial Developer of the Original Code is
 * Mozilla.
 * Portions created by the Initial Developer are Copyright (C) 2009
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Bespin Team (bespin@mozilla.com)
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

var Trace = require('bespin:util/stacktrace').Trace;
var catalog = require('bespin:plugins').catalog;
var console = require('bespin:console').console;

/**
 * Current requirements are around displaying the command line, and provision
 * of a 'history' command and cursor up|down navigation of history.
 * <p>Future requirements could include:
 * <ul>
 * <li>Multiple command lines
 * <li>The ability to recall key presses (i.e. requests with no output) which
 * will likely be needed for macro recording or similar
 * <li>The ability to store the command history either on the server or in the
 * browser local storage.
 * </ul>
 * <p>The execute() command doesn't really live here, except as part of that
 * last future requirement, and because it doesn't really have anywhere else to
 * live.
 */

/**
 * The array of requests that wish to announce their presence
 */
exports.requests = [];

/**
 * How many requests do we store?
 */
var maxRequestLength = 100;

/**
 * Called by Request instances when some output (or a cell to async() happens)
 */
exports.addRequestOutput = function(request) {
    exports.requests.push(request);
    // This could probably be optimized with some maths, but 99.99% of the
    // time we will only be off by one, and I'm feeling lazy.
    while (exports.requests.length > maxRequestLength) {
        exports.requests.shiftObject();
    }

    catalog.publish(this, 'addedRequestOutput', null, request);
};

/**
 * Execute a new command.
 * This is basically an error trapping wrapper around request.command(...)
 */
exports.execute = function(args, request) {
    // Check the function pointed to in the meta-data exists
    if (!request.command) {
        request.doneWithError('Command not found.');
        return;
    }

    try {
        request.command(args, request);
    } catch (ex) {
        var trace = new Trace(ex, true);
        console.group('Error executing command \'' + request.typed + '\'');
        console.log('command=', request.commandExt);
        console.log('args=', args);
        console.error(ex);
        trace.log(3);
        console.groupEnd();

        request.doneWithError(ex);
    }
};

});

bespin.tiki.module("canon:index",function(require,exports,module) {

});
;bespin.tiki.register("::traits", {
    name: "traits",
    dependencies: {  }
});
bespin.tiki.module("traits:index",function(require,exports,module) {
// Copyright (C) 2010 Google Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// See http://code.google.com/p/es-lab/wiki/Traits
// for background on traits and a description of this library

"define metadata";
({
    "description": "Traits library, traitsjs.org",
    "dependencies": {},
    "provides": []
});
"end";

// --- Begin traits-0.3.js ---

// Copyright (C) 2010 Google Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// See http://code.google.com/p/es-lab/wiki/Traits
// for background on traits and a description of this library

var Trait = (function(){

  // == Ancillary functions ==
  
  var SUPPORTS_DEFINEPROP = (function() {
    try {
      var test = {};
      Object.defineProperty(test, 'x', {get: function() { return 0; } } );
      return test.x === 0;
    } catch(e) {
      return false;
    }
  })();
  
  // IE8 implements Object.defineProperty and Object.getOwnPropertyDescriptor
  // only for DOM objects. These methods don't work on plain objects.
  // Hence, we need a more elaborate feature-test to see whether the
  // browser truly supports these methods:
  function supportsGOPD() {
    try {
      if (Object.getOwnPropertyDescriptor) {
        var test = {x:0};
        return !!Object.getOwnPropertyDescriptor(test,'x');        
      }
    } catch(e) {}
    return false;
  };
  function supportsDP() {
    try {
      if (Object.defineProperty) {
        var test = {};
        Object.defineProperty(test,'x',{value:0});
        return test.x === 0;
      }
    } catch(e) {}
    return false;
  };

  var call = Function.prototype.call;

  /**
   * An ad hoc version of bind that only binds the 'this' parameter.
   */
  var bindThis = Function.prototype.bind ?
    function(fun, self) { return Function.prototype.bind.call(fun, self); } :
    function(fun, self) {
      function funcBound(var_args) {
        return fun.apply(self, arguments);
      }
      return funcBound;
    };

  var hasOwnProperty = bindThis(call, Object.prototype.hasOwnProperty);
  var slice = bindThis(call, Array.prototype.slice);
    
  // feature testing such that traits.js runs on both ES3 and ES5
  var forEach = Array.prototype.forEach ?
      bindThis(call, Array.prototype.forEach) :
      function(arr, fun) {
        for (var i = 0, len = arr.length; i < len; i++) { fun(arr[i]); }
      };
  
  // on v8 version 2.3.4.1, Object.freeze(obj) returns undefined instead of obj
  var freeze = (Object.freeze ? function(obj) { Object.freeze(obj); return obj; }
                              : function(obj) { return obj; });
  var getPrototypeOf = Object.getPrototypeOf || function(obj) { 
    return Object.prototype;
  };
  var getOwnPropertyNames = Object.getOwnPropertyNames ||
      function(obj) {
        var props = [];
        for (var p in obj) { if (hasOwnProperty(obj,p)) { props.push(p); } }
        return props;
      };
  var getOwnPropertyDescriptor = supportsGOPD() ?
      Object.getOwnPropertyDescriptor :
      function(obj, name) {
        return {
          value: obj[name],
          enumerable: true,
          writable: true,
          configurable: true
        };
      };
  var defineProperty = supportsDP() ? Object.defineProperty :
      function(obj, name, pd) {
        obj[name] = pd.value;
      };
  var defineProperties = Object.defineProperties ||
      function(obj, propMap) {
        for (var name in propMap) {
          if (hasOwnProperty(propMap, name)) {
            defineProperty(obj, name, propMap[name]);
          }
        }
      };
  var Object_create = Object.create ||
      function(proto, propMap) {
        var self;
        function dummy() {};
        dummy.prototype = proto || Object.prototype;
        self = new dummy();
        if (propMap) {
          defineProperties(self, propMap);          
        }
        return self;
      };
  var getOwnProperties = Object.getOwnProperties ||
      function(obj) {
        var map = {};
        forEach(getOwnPropertyNames(obj), function (name) {
          map[name] = getOwnPropertyDescriptor(obj, name);
        });
        return map;
      };
  
  // end of ES3 - ES5 compatibility functions
  
  function makeConflictAccessor(name) {
    var accessor = function(var_args) {
      throw new Error("Conflicting property: "+name);
    };
    freeze(accessor.prototype);
    return freeze(accessor);
  };

  function makeRequiredPropDesc(name) {
    return freeze({
      value: undefined,
      enumerable: false,
      required: true
    });
  }
  
  function makeConflictingPropDesc(name) {
    var conflict = makeConflictAccessor(name);
    if (SUPPORTS_DEFINEPROP) {
      return freeze({
       get: conflict,
       set: conflict,
       enumerable: false,
       conflict: true
      }); 
    } else {
      return freeze({
        value: conflict,
        enumerable: false,
        conflict: true
      });
    }
  }
  
  /**
   * Are x and y not observably distinguishable?
   */
  function identical(x, y) {
    if (x === y) {
      // 0 === -0, but they are not identical
      return x !== 0 || 1/x === 1/y;
    } else {
      // NaN !== NaN, but they are identical.
      // NaNs are the only non-reflexive value, i.e., if x !== x,
      // then x is a NaN.
      return x !== x && y !== y;
    }
  }

  // Note: isSameDesc should return true if both
  // desc1 and desc2 represent a 'required' property
  // (otherwise two composed required properties would be turned into
  // a conflict) 
  function isSameDesc(desc1, desc2) {
    // for conflicting properties, don't compare values because
    // the conflicting property values are never equal
    if (desc1.conflict && desc2.conflict) {
      return true;
    } else {
      return (   desc1.get === desc2.get
              && desc1.set === desc2.set
              && identical(desc1.value, desc2.value)
              && desc1.enumerable === desc2.enumerable
              && desc1.required === desc2.required
              && desc1.conflict === desc2.conflict); 
    }
  }
  
  function freezeAndBind(meth, self) {
    return freeze(bindThis(meth, self));
  }

  /* makeSet(['foo', ...]) => { foo: true, ...}
   *
   * makeSet returns an object whose own properties represent a set.
   *
   * Each string in the names array is added to the set.
   *
   * To test whether an element is in the set, perform:
   *   hasOwnProperty(set, element)
   */
  function makeSet(names) {
    var set = {};
    forEach(names, function (name) {
      set[name] = true;
    });
    return freeze(set);
  }

  // == singleton object to be used as the placeholder for a required
  // property == 
  
  var required = freeze({ 
    toString: function() { return '<Trait.required>'; } 
  });

  // == The public API methods ==

  /**
   * var newTrait = trait({ foo:required, ... })
   *
   * @param object an object record (in principle an object literal)
   * @returns a new trait describing all of the own properties of the object
   *          (both enumerable and non-enumerable)
   *
   * As a general rule, 'trait' should be invoked with an object
   * literal, since the object merely serves as a record
   * descriptor. Both its identity and its prototype chain are
   * irrelevant.
   * 
   * Data properties bound to function objects in the argument will be
   * flagged as 'method' properties. The prototype of these function
   * objects is frozen.
   * 
   * Data properties bound to the 'required' singleton exported by
   * this module will be marked as 'required' properties.
   *
   * The <tt>trait</tt> function is pure if no other code can witness
   * the side-effects of freezing the prototypes of the methods. If
   * <tt>trait</tt> is invoked with an object literal whose methods
   * are represented as in-place anonymous functions, this should
   * normally be the case.
   */
  function trait(obj) {
    var map = {};
    forEach(getOwnPropertyNames(obj), function (name) {
      var pd = getOwnPropertyDescriptor(obj, name);
      if (pd.value === required) {
        pd = makeRequiredPropDesc(name);
      } else if (typeof pd.value === 'function') {
        pd.method = true;
        if ('prototype' in pd.value) {
          freeze(pd.value.prototype);
        }
      } else {
        if (pd.get && pd.get.prototype) { freeze(pd.get.prototype); }
        if (pd.set && pd.set.prototype) { freeze(pd.set.prototype); }
      }
      map[name] = pd;
    });
    return map;
  }

  /**
   * var newTrait = compose(trait_1, trait_2, ..., trait_N)
   *
   * @param trait_i a trait object
   * @returns a new trait containing the combined own properties of
   *          all the trait_i.
   * 
   * If two or more traits have own properties with the same name, the new
   * trait will contain a 'conflict' property for that name. 'compose' is
   * a commutative and associative operation, and the order of its
   * arguments is not significant.
   *
   * If 'compose' is invoked with < 2 arguments, then:
   *   compose(trait_1) returns a trait equivalent to trait_1
   *   compose() returns an empty trait
   */
  function compose(var_args) {
    var traits = slice(arguments, 0);
    var newTrait = {};
    
    forEach(traits, function (trait) {
      forEach(getOwnPropertyNames(trait), function (name) {
        var pd = trait[name];
        if (hasOwnProperty(newTrait, name) &&
            !newTrait[name].required) {
          
          // a non-required property with the same name was previously
          // defined this is not a conflict if pd represents a
          // 'required' property itself:
          if (pd.required) {
            return; // skip this property, the required property is
   	            // now present 
          }
            
          if (!isSameDesc(newTrait[name], pd)) {
            // a distinct, non-required property with the same name
            // was previously defined by another trait => mark as
	    // conflicting property
            newTrait[name] = makeConflictingPropDesc(name); 
          } // else,
          // properties are not in conflict if they refer to the same value
          
        } else {
          newTrait[name] = pd;
        }
      });
    });
    
    return freeze(newTrait);
  }

  /* var newTrait = exclude(['name', ...], trait)
   *
   * @param names a list of strings denoting property names.
   * @param trait a trait some properties of which should be excluded.
   * @returns a new trait with the same own properties as the original trait,
   *          except that all property names appearing in the first argument
   *          are replaced by required property descriptors.
   *
   * Note: exclude(A, exclude(B,t)) is equivalent to exclude(A U B, t)
   */
  function exclude(names, trait) {
    var exclusions = makeSet(names);
    var newTrait = {};
    
    forEach(getOwnPropertyNames(trait), function (name) {
      // required properties are not excluded but ignored
      if (!hasOwnProperty(exclusions, name) || trait[name].required) {
        newTrait[name] = trait[name];
      } else {
        // excluded properties are replaced by required properties
        newTrait[name] = makeRequiredPropDesc(name);
      }
    });
    
    return freeze(newTrait);
  }

  /**
   * var newTrait = override(trait_1, trait_2, ..., trait_N)
   *
   * @returns a new trait with all of the combined properties of the
   *          argument traits.  In contrast to 'compose', 'override'
   *          immediately resolves all conflicts resulting from this
   *          composition by overriding the properties of later
   *          traits. Trait priority is from left to right. I.e. the
   *          properties of the leftmost trait are never overridden.
   *
   *  override is associative:
   *    override(t1,t2,t3) is equivalent to override(t1, override(t2, t3)) or
   *    to override(override(t1, t2), t3)
   *  override is not commutative: override(t1,t2) is not equivalent
   *    to override(t2,t1)
   *
   * override() returns an empty trait
   * override(trait_1) returns a trait equivalent to trait_1
   */
  function override(var_args) {
    var traits = slice(arguments, 0);
    var newTrait = {};
    forEach(traits, function (trait) {
      forEach(getOwnPropertyNames(trait), function (name) {
        var pd = trait[name];
        // add this trait's property to the composite trait only if
        // - the trait does not yet have this property
        // - or, the trait does have the property, but it's a required property
        if (!hasOwnProperty(newTrait, name) || newTrait[name].required) {
          newTrait[name] = pd;
        }
      });
    });
    return freeze(newTrait);
  }
  
  /**
   * var newTrait = override(dominantTrait, recessiveTrait)
   *
   * @returns a new trait with all of the properties of dominantTrait
   *          and all of the properties of recessiveTrait not in dominantTrait
   *
   * Note: override is associative:
   *   override(t1, override(t2, t3)) is equivalent to
   *   override(override(t1, t2), t3) 
   */
  /*function override(frontT, backT) {
    var newTrait = {};
    // first copy all of backT's properties into newTrait
    forEach(getOwnPropertyNames(backT), function (name) {
      newTrait[name] = backT[name];
    });
    // now override all these properties with frontT's properties
    forEach(getOwnPropertyNames(frontT), function (name) {
      var pd = frontT[name];
      // frontT's required property does not override the provided property
      if (!(pd.required && hasOwnProperty(newTrait, name))) {
        newTrait[name] = pd; 
      }      
    });
    
    return freeze(newTrait);
  }*/

  /**
   * var newTrait = rename(map, trait)
   *
   * @param map an object whose own properties serve as a mapping from
            old names to new names.
   * @param trait a trait object
   * @returns a new trait with the same properties as the original trait,
   *          except that all properties whose name is an own property
   *          of map will be renamed to map[name], and a 'required' property
   *          for name will be added instead.
   *
   * rename({a: 'b'}, t) eqv compose(exclude(['a'],t),
   *                                 { a: { required: true },
   *                                   b: t[a] })
   *
   * For each renamed property, a required property is generated.  If
   * the map renames two properties to the same name, a conflict is
   * generated.  If the map renames a property to an existing
   * unrenamed property, a conflict is generated.
   *
   * Note: rename(A, rename(B, t)) is equivalent to rename(\n ->
   * A(B(n)), t) Note: rename({...},exclude([...], t)) is not eqv to
   * exclude([...],rename({...}, t))
   */
  function rename(map, trait) {
    var renamedTrait = {};
    forEach(getOwnPropertyNames(trait), function (name) {
      // required props are never renamed
      if (hasOwnProperty(map, name) && !trait[name].required) {
        var alias = map[name]; // alias defined in map
        if (hasOwnProperty(renamedTrait, alias) && 
	    !renamedTrait[alias].required) {
          // could happen if 2 props are mapped to the same alias
          renamedTrait[alias] = makeConflictingPropDesc(alias);
        } else {
          // add the property under an alias
          renamedTrait[alias] = trait[name];
        }
        // add a required property under the original name
        // but only if a property under the original name does not exist
        // such a prop could exist if an earlier prop in the trait was
        // previously aliased to this name
        if (!hasOwnProperty(renamedTrait, name)) {
          renamedTrait[name] = makeRequiredPropDesc(name);     
        }
      } else { // no alias defined
        if (hasOwnProperty(renamedTrait, name)) {
          // could happen if another prop was previously aliased to name
          if (!trait[name].required) {
            renamedTrait[name] = makeConflictingPropDesc(name);            
          }
          // else required property overridden by a previously aliased
          // property and otherwise ignored
        } else {
          renamedTrait[name] = trait[name];
        }
      }
    });
    
    return freeze(renamedTrait);
  }
  
  /**
   * var newTrait = resolve({ oldName: 'newName', excludeName:
   * undefined, ... }, trait)
   *
   * This is a convenience function combining renaming and
   * exclusion. It can be implemented as <tt>rename(map,
   * exclude(exclusions, trait))</tt> where map is the subset of
   * mappings from oldName to newName and exclusions is an array of
   * all the keys that map to undefined (or another falsy value).
   *
   * @param resolutions an object whose own properties serve as a
            mapping from old names to new names, or to undefined if
            the property should be excluded
   * @param trait a trait object
   * @returns a resolved trait with the same own properties as the
   * original trait.
   *
   * In a resolved trait, all own properties whose name is an own property
   * of resolutions will be renamed to resolutions[name] if it is truthy,
   * or their value is changed into a required property descriptor if
   * resolutions[name] is falsy.
   *
   * Note, it's important to _first_ exclude, _then_ rename, since exclude
   * and rename are not associative, for example:
   * rename({a: 'b'}, exclude(['b'], trait({ a:1,b:2 }))) eqv trait({b:1})
   * exclude(['b'], rename({a: 'b'}, trait({ a:1,b:2 }))) eqv
   * trait({b:Trait.required}) 
   *
   * writing resolve({a:'b', b: undefined},trait({a:1,b:2})) makes it
   * clear that what is meant is to simply drop the old 'b' and rename
   * 'a' to 'b'
   */
  function resolve(resolutions, trait) {
    var renames = {};
    var exclusions = [];
    // preprocess renamed and excluded properties
    for (var name in resolutions) {
      if (hasOwnProperty(resolutions, name)) {
        if (resolutions[name]) { // old name -> new name
          renames[name] = resolutions[name];
        } else { // name -> undefined
          exclusions.push(name);
        }
      }
    }
    return rename(renames, exclude(exclusions, trait));
  }

  /**
   * var obj = create(proto, trait)
   *
   * @param proto denotes the prototype of the completed object
   * @param trait a trait object to be turned into a complete object
   * @returns an object with all of the properties described by the trait.
   * @throws 'Missing required property' the trait still contains a
   *         required property.
   * @throws 'Remaining conflicting property' if the trait still
   *         contains a conflicting property. 
   *
   * Trait.create is like Object.create, except that it generates
   * high-integrity or final objects. In addition to creating a new object
   * from a trait, it also ensures that:
   *    - an exception is thrown if 'trait' still contains required properties
   *    - an exception is thrown if 'trait' still contains conflicting
   *      properties 
   *    - the object is and all of its accessor and method properties are frozen
   *    - the 'this' pseudovariable in all accessors and methods of
   *      the object is bound to the composed object.
   *
   *  Use Object.create instead of Trait.create if you want to create
   *  abstract or malleable objects. Keep in mind that for such objects:
   *    - no exception is thrown if 'trait' still contains required properties
   *      (the properties are simply dropped from the composite object)
   *    - no exception is thrown if 'trait' still contains conflicting
   *      properties (these properties remain as conflicting
   *      properties in the composite object) 
   *    - neither the object nor its accessor and method properties are frozen
   *    - the 'this' pseudovariable in all accessors and methods of
   *      the object is left unbound.
   */
  function create(proto, trait) {
    var self = Object_create(proto);
    var properties = {};
  
    forEach(getOwnPropertyNames(trait), function (name) {
      var pd = trait[name];
      // check for remaining 'required' properties
      // Note: it's OK for the prototype to provide the properties
      if (pd.required) {
        if (!(name in proto)) {
          throw new Error('Missing required property: '+name);
        }
      } else if (pd.conflict) { // check for remaining conflicting properties
        throw new Error('Remaining conflicting property: '+name);
      } else if ('value' in pd) { // data property
        // freeze all function properties and their prototype
        if (pd.method) { // the property is meant to be used as a method
          // bind 'this' in trait method to the composite object
          properties[name] = {
            value: freezeAndBind(pd.value, self),
            enumerable: pd.enumerable,
            configurable: pd.configurable,
            writable: pd.writable
          };
        } else {
          properties[name] = pd;
        }
      } else { // accessor property
        properties[name] = {
          get: pd.get ? freezeAndBind(pd.get, self) : undefined,
          set: pd.set ? freezeAndBind(pd.set, self) : undefined,
          enumerable: pd.enumerable,
          configurable: pd.configurable,
          writable: pd.writable            
        };
      }
    });

    defineProperties(self, properties);
    return freeze(self);
  }

  /** A shorthand for create(Object.prototype, trait({...}), options) */
  function object(record, options) {
    return create(Object.prototype, trait(record), options);
  }

  /**
   * Tests whether two traits are equivalent. T1 is equivalent to T2 iff
   * both describe the same set of property names and for all property
   * names n, T1[n] is equivalent to T2[n]. Two property descriptors are
   * equivalent if they have the same value, accessors and attributes.
   *
   * @return a boolean indicating whether the two argument traits are
   *         equivalent.
   */
  function eqv(trait1, trait2) {
    var names1 = getOwnPropertyNames(trait1);
    var names2 = getOwnPropertyNames(trait2);
    var name;
    if (names1.length !== names2.length) {
      return false;
    }
    for (var i = 0; i < names1.length; i++) {
      name = names1[i];
      if (!trait2[name] || !isSameDesc(trait1[name], trait2[name])) {
        return false;
      }
    }
    return true;
  }
  
  // if this code is ran in ES3 without an Object.create function, this
  // library will define it on Object:
  if (!Object.create) {
    Object.create = Object_create;
  }
  // ES5 does not by default provide Object.getOwnProperties
  // if it's not defined, the Traits library defines this utility
  // function on Object 
  if(!Object.getOwnProperties) {
    Object.getOwnProperties = getOwnProperties;
  }
  
  // expose the public API of this module
  function Trait(record) {
    // calling Trait as a function creates a new atomic trait
    return trait(record);
  }
  Trait.required = freeze(required);
  Trait.compose = freeze(compose);
  Trait.resolve = freeze(resolve);
  Trait.override = freeze(override);
  Trait.create = freeze(create);
  Trait.eqv = freeze(eqv);
  Trait.object = freeze(object); // not essential, cf. create + trait
  return freeze(Trait);
  
})();

if (typeof exports !== "undefined") { // CommonJS module support
  exports.Trait = Trait;
}

// --- End traits-0.3.js ---


});
;bespin.tiki.register("::keyboard", {
    name: "keyboard",
    dependencies: { "canon": "0.0.0", "settings": "0.0.0" }
});
bespin.tiki.module("keyboard:keyboard",function(require,exports,module) {
/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Bespin.
 *
 * The Initial Developer of the Original Code is
 * Mozilla.
 * Portions created by the Initial Developer are Copyright (C) 2009
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Bespin Team (bespin@mozilla.com)
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

var catalog = require('bespin:plugins').catalog;
var console = require('bespin:console').console;
var Trace = require('bespin:util/stacktrace').Trace;
var util = require('bespin:util/util');

var settings = require('settings').settings;

var keyutil = require('keyboard:keyutil');
var history = require('canon:history');
var Request = require('canon:request').Request;
var env = require('environment').env;

/*
 * Things to do to sanitize this code:
 * - 'no command' is a bizarre special value at the very least it should be a
 *   constant to make typos more obvious, but it would be better to refactor
 *   so that a natural value like null worked.
 * - sender seems to be totally customized to the editor case, and the functions
 *   that we assume that it has make no sense for the commandLine case. We
 *   should either document and implement the same function set for both cases
 *   or admit that the cases are different enough to have separate
 *   implementations.
 * - remove remaining sproutcore-isms
 * - fold buildFlags into processKeyEvent or something better, preferably the
 *   latter. We don't want the environment to become a singleton
 */

/**
 * Every time we call processKeyEvent, we pass in some flags that require the
 * same processing to set them up. This function can be called to do that
 * setup.
 * @param env Probably environment.env
 * @param flags Probably {} (but check other places where this is called)
 */
exports.buildFlags = function(flags) {
    flags.context = env.contexts[0];
    return flags;
};

/**
 * The canon, or the repository of commands, contains functions to process
 * events and dispatch command messages to targets.
 * @class
 */
var KeyboardManager = function() { };

util.mixin(KeyboardManager.prototype, {
    _customKeymappingCache: { states: {} },

    /**
     * Searches through the command canon for an event matching the given flags
     * with a key equivalent matching the given SproutCore event, and, if the
     * command is found, sends a message to the appropriate target.
     *
     * This will get a couple of upgrades in the not-too-distant future:
     * 1. caching in the Canon for fast lookup based on key
     * 2. there will be an extra layer in between to allow remapping via
     *    user preferences and keyboard mapping plugins
     *
     * @return True if a matching command was found, false otherwise.
     */
    processKeyEvent: function(evt, sender, flags) {
        // Use our modified commandCodes function to detect the meta key in
        // more circumstances than SproutCore alone does.
        var symbolicName = keyutil.commandCodes(evt, true)[0];
        if (util.none(symbolicName)) {
            return false;
        }

        // TODO: Maybe it should be the job of our caller to do this?
        exports.buildFlags(flags);

        flags.isCommandKey = true;
        return this._matchCommand(symbolicName, sender, flags);
    },

    _matchCommand: function(symbolicName, sender, flags) {
        var match = this._findCommandExtension(symbolicName, sender, flags);
        if (match && match.commandExt !== 'no command') {
            if (flags.isTextView) {
                sender.resetKeyBuffers();
            }

            var commandExt = match.commandExt;
            commandExt.load(function(command) {
                var request = new Request({
                    command: command,
                    commandExt: commandExt
                });
                history.execute(match.args, request);
            });
            return true;
        }

        // 'no command' is returned if a keyevent is handled but there is no
        // command executed (for example when switchting the keyboard state).
        if (match && match.commandExt === 'no command') {
            return true;
        } else {
            return false;
        }
    },

    _buildBindingsRegex: function(bindings) {
        // Escape a given Regex string.
        bindings.forEach(function(binding) {
            if (!util.none(binding.key)) {
                binding.key = new RegExp('^' + binding.key + '$');
            } else if (Array.isArray(binding.regex)) {
                binding.key = new RegExp('^' + binding.regex[1] + '$');
                binding.regex = new RegExp(binding.regex.join('') + '$');
            } else {
                binding.regex = new RegExp(binding.regex + '$');
            }
        });
    },

    /**
     * Build the RegExp from the keymapping as RegExp can't stored directly
     * in the metadata JSON and as the RegExp used to match the keys/buffer
     * need to be adapted.
     */
    _buildKeymappingRegex: function(keymapping) {
        for (state in keymapping.states) {
            this._buildBindingsRegex(keymapping.states[state]);
        }
        keymapping._convertedRegExp = true;
    },

    /**
     * Loop through the commands in the canon, looking for something that
     * matches according to #_commandMatches, and return that.
     */
    _findCommandExtension: function(symbolicName, sender, flags) {
        // If the flags indicate that we handle the textView's input then take
        // a look at keymappings as well.
        if (flags.isTextView) {
            var currentState = sender._keyState;

            // Don't add the symbolic name to the key buffer if the alt_ key is
            // part of the symbolic name. If it starts with alt_, this means
            // that the user hit an alt keycombo and there will be a single,
            // new character detected after this event, which then will be
            // added to the buffer (e.g. alt_j will result in ∆).
            if (!flags.isCommandKey || symbolicName.indexOf('alt_') === -1) {
                sender._keyBuffer +=
                    symbolicName.replace(/ctrl_meta|meta/,'ctrl');
                sender._keyMetaBuffer += symbolicName;
            }

            // List of all the keymappings to look at.
            var ak = [ this._customKeymappingCache ];

            // Get keymapping extension points.
            ak = ak.concat(catalog.getExtensions('keymapping'));

            for (var i = 0; i < ak.length; i++) {
                // Check if the keymapping has the current state.
                if (util.none(ak[i].states[currentState])) {
                    continue;
                }

                if (util.none(ak[i]._convertedRegExp)) {
                    this._buildKeymappingRegex(ak[i]);
                }

                // Try to match the current mapping.
                var result = this._bindingsMatch(
                                    symbolicName,
                                    flags,
                                    sender,
                                    ak[i]);

                if (!util.none(result)) {
                    return result;
                }
            }
        }

        var commandExts = catalog.getExtensions('command');
        var reply = null;
        var args = {};

        symbolicName = symbolicName.replace(/ctrl_meta|meta/,'ctrl');

        commandExts.some(function(commandExt) {
            if (this._commandMatches(commandExt, symbolicName, flags)) {
                reply = commandExt;
                return true;
            }
            return false;
        }.bind(this));

        return util.none(reply) ? null : { commandExt: reply, args: args };
    },


    /**
     * Checks if the given parameters fit to one binding in the given bindings.
     * Returns the command and arguments if a command was matched.
     */
    _bindingsMatch: function(symbolicName, flags, sender, keymapping) {
        var match;
        var commandExt = null;
        var args = {};
        var bufferToUse;

        if (!util.none(keymapping.hasMetaKey)) {
            bufferToUse = sender._keyBuffer;
        } else {
            bufferToUse = sender._keyMetaBuffer;
        }

        // Add the alt_key to the buffer as we don't want it to be in the buffer
        // that is saved but for matching, it needs to be there.
        if (symbolicName.indexOf('alt_') === 0 && flags.isCommandKey) {
            bufferToUse += symbolicName;
        }

        // Loop over all the bindings of the keymapp until a match is found.
        keymapping.states[sender._keyState].some(function(binding) {
            // Check if the key matches.
            if (binding.key && !binding.key.test(symbolicName)) {
                return false;
            }

            // Check if the regex matches.
            if (binding.regex && !(match = binding.regex.exec(bufferToUse))) {
                return false;
            }

            // Check for disallowed matches.
            if (binding.disallowMatches) {
                for (var i = 0; i < binding.disallowMatches.length; i++) {
                    if (!!match[binding.disallowMatches[i]]) {
                        return true;
                    }
                }
            }

            // Check predicates.
            if (!exports.flagsMatch(binding.predicates, flags)) {
                return false;
            }

            // If there is a command to execute, then figure out the
            // comand and the arguments.
            if (binding.exec) {
                // Get the command.
                commandExt = catalog.getExtensionByKey('command', binding.exec);
                if (util.none(commandExt)) {
                    throw new Error('Can\'t find command ' + binding.exec +
                        ' in state=' + sender._keyState +
                        ', symbolicName=' + symbolicName);
                }

                // Bulid the arguments.
                if (binding.params) {
                    var value;
                    binding.params.forEach(function(param) {
                        if (!util.none(param.match) && !util.none(match)) {
                            value = match[param.match] || param.defaultValue;
                        } else {
                            value = param.defaultValue;
                        }

                        if (param.type === 'number') {
                            value = parseInt(value);
                        }

                        args[param.name] = value;
                    });
                }
                sender.resetKeyBuffers();
            }

            // Handle the 'then' property.
            if (binding.then) {
                sender._keyState = binding.then;
                sender.resetKeyBuffers();
            }

            // If there is no command matched now, then return a 'false'
            // command to stop matching.
            if (util.none(commandExt)) {
                commandExt = 'no command';
            }

            return true;
        });

        if (util.none(commandExt)) {
            return null;
        }

        return { commandExt: commandExt, args: args };
    },

    /**
     * Check that the given command fits the given key name and flags.
     */
    _commandMatches: function(commandExt, symbolicName, flags) {
        var mappedKeys = commandExt.key;
        if (!mappedKeys) {
            return false;
        }

        // Check predicates
        if (!exports.flagsMatch(commandExt.predicates, flags)) {
            return false;
        }

        if (typeof(mappedKeys) === 'string') {
            if (mappedKeys != symbolicName) {
                return false;
            }
            return true;
        }

        if (!Array.isArray(mappedKeys)) {
            mappedKeys = [mappedKeys];
            commandExt.key = mappedKeys;
        }

        for (var i = 0; i < mappedKeys.length; i++) {
            var keymap = mappedKeys[i];
            if (typeof(keymap) === 'string') {
                if (keymap == symbolicName) {
                    return true;
                }
                continue;
            }

            if (keymap.key != symbolicName) {
                continue;
            }

            return exports.flagsMatch(keymap.predicates, flags);
        }
        return false;
    },

    /**
     * Build a cache of custom keymappings whenever the associated setting
     * changes.
     */
    _customKeymappingChanged: function() {
        var ckc = this._customKeymappingCache =
                            JSON.parse(settings.get('customKeymapping'));

        ckc.states = ckc.states || {};

        for (state in ckc.states) {
            this._buildBindingsRegex(ckc.states[state]);
        }
        ckc._convertedRegExp = true;
    }
});

/**
 *
 */
exports.flagsMatch = function(predicates, flags) {
    if (util.none(predicates)) {
        return true;
    }

    if (!flags) {
        return false;
    }

    for (var flagName in predicates) {
        if (flags[flagName] !== predicates[flagName]) {
            return false;
        }
    }

    return true;
};

/**
 * The global exported KeyboardManager
 */
exports.keyboardManager = new KeyboardManager();

catalog.registerExtension('settingChange', {
    match: "customKeymapping",
    pointer: exports.keyboardManager._customKeymappingChanged
                                        .bind(exports.keyboardManager)
});

});

bespin.tiki.module("keyboard:keyutil",function(require,exports,module) {
/*! @license
==========================================================================
SproutCore -- JavaScript Application Framework
copyright 2006-2009, Sprout Systems Inc., Apple Inc. and contributors.

Permission is hereby granted, free of charge, to any person obtaining a
copy of this software and associated documentation files (the "Software"),
to deal in the Software without restriction, including without limitation
the rights to use, copy, modify, merge, publish, distribute, sublicense,
and/or sell copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
DEALINGS IN THE SOFTWARE.

SproutCore and the SproutCore logo are trademarks of Sprout Systems, Inc.

For more information about SproutCore, visit http://www.sproutcore.com


==========================================================================
@license */

// Most of the following code is taken from SproutCore with a few changes.

var util = require('bespin:util/util');

/**
 * Helper functions and hashes for key handling.
 */
exports.KeyHelper = function() {
    var ret = {
        MODIFIER_KEYS: {
            16: 'shift', 17: 'ctrl', 18: 'alt', 224: 'meta'
        },

        FUNCTION_KEYS : {
              8: 'backspace', 9: 'tab',         13: 'return',   19: 'pause',
             27: 'escape',   33: 'pageup',      34: 'pagedown', 35: 'end',
             36: 'home',     37: 'left',        38: 'up',       39: 'right',
             40: 'down',     44: 'printscreen', 45: 'insert',   46: 'delete',
            112: 'f1',      113: 'f2',         114: 'f3',      115: 'f4',
            116: 'f5',      117: 'f7',         119: 'f8',      120: 'f9',
            121: 'f10',     122: 'f11',        123: 'f12',     144: 'numlock',
            145: 'scrolllock'
        },

        PRINTABLE_KEYS: {
           32: ' ',  48: '0',  49: '1',  50: '2',  51: '3',  52: '4', 53:  '5',
           54: '6',  55: '7',  56: '8',  57: '9',  59: ';',  61: '=', 65:  'a',
           66: 'b',  67: 'c',  68: 'd',  69: 'e',  70: 'f',  71: 'g', 72:  'h',
           73: 'i',  74: 'j',  75: 'k',  76: 'l',  77: 'm',  78: 'n', 79:  'o',
           80: 'p',  81: 'q',  82: 'r',  83: 's',  84: 't',  85: 'u', 86:  'v',
           87: 'w',  88: 'x',  89: 'y',  90: 'z', 107: '+', 109: '-', 110: '.',
          188: ',', 190: '.', 191: '/', 192: '`', 219: '[', 220: '\\',
          221: ']', 222: '\"'
        },

        /**
         * Create the lookup table for Firefox to convert charCodes to keyCodes
         * in the keyPress event.
         */
        PRINTABLE_KEYS_CHARCODE: {},

        /**
         * Allow us to lookup keyCodes by symbolic name rather than number
         */
        KEY: {}
    };

    // Create the PRINTABLE_KEYS_CHARCODE hash.
    for (var i in ret.PRINTABLE_KEYS) {
        var k = ret.PRINTABLE_KEYS[i];
        ret.PRINTABLE_KEYS_CHARCODE[k.charCodeAt(0)] = i;
        if (k.toUpperCase() != k) {
            ret.PRINTABLE_KEYS_CHARCODE[k.toUpperCase().charCodeAt(0)] = i;
        }
    }

    // A reverse map of FUNCTION_KEYS
    for (i in ret.FUNCTION_KEYS) {
        var name = ret.FUNCTION_KEYS[i].toUpperCase();
        ret.KEY[name] = parseInt(i, 10);
    }

    return ret;
}();

/**
 * Determines if the keyDown event is a non-printable or function key.
 * These kinds of events are processed as keyboard shortcuts.
 * If no shortcut handles the event, then it will be sent as a regular
 * keyDown event.
 * @private
 */
var isFunctionOrNonPrintableKey = function(evt) {
    return !!(evt.altKey || evt.ctrlKey || evt.metaKey ||
            ((evt.charCode !== evt.which) &&
                    exports.KeyHelper.FUNCTION_KEYS[evt.which]));
};

/**
 * Returns character codes for the event.
 * The first value is the normalized code string, with any Shift or Ctrl
 * characters added to the beginning.
 * The second value is the char string by itself.
 * @return {Array}
 */
exports.commandCodes = function(evt, dontIgnoreMeta) {
    var code = evt._keyCode || evt.keyCode;
    var charCode = (evt._charCode === undefined ? evt.charCode : evt._charCode);
    var ret = null;
    var key = null;
    var modifiers = '';
    var lowercase;
    var allowShift = true;

    // Absent a value for 'keyCode' or 'which', we can't compute the
    // command codes. Bail out.
    if (code === 0 && evt.which === 0) {
        return false;
    }

    // If the charCode is not zero, then we do not handle a command key
    // here. Bail out.
    if (charCode !== 0) {
        return false;
    }

    // Check for modifier keys.
    if (exports.KeyHelper.MODIFIER_KEYS[charCode]) {
        return [exports.KeyHelper.MODIFIER_KEYS[charCode], null];
    }

    // handle function keys.
    if (code) {
        ret = exports.KeyHelper.FUNCTION_KEYS[code];
        if (!ret && (evt.altKey || evt.ctrlKey || evt.metaKey)) {
            ret = exports.KeyHelper.PRINTABLE_KEYS[code];
            // Don't handle the shift key if the combo is
            //    (meta_|ctrl_)<number>
            // This is necessary for the French keyboard. On that keyboard,
            // you have to hold down the shift key to access the number
            // characters.
            if (code > 47 && code < 58) {
                allowShift = evt.altKey;
            }
        }

        if (ret) {
           if (evt.altKey) {
               modifiers += 'alt_';
           }
           if (evt.ctrlKey) {
               modifiers += 'ctrl_';
           }
           if (evt.metaKey) {
               modifiers += 'meta_';
           }
        } else if (evt.ctrlKey || evt.metaKey) {
            return false;
        }
    }

    // otherwise just go get the right key.
    if (!ret) {
        code = evt.which;
        key = ret = String.fromCharCode(code);
        lowercase = ret.toLowerCase();

        if (evt.metaKey) {
           modifiers = 'meta_';
           ret = lowercase;

        } else ret = null;
    }

    if (evt.shiftKey && ret && allowShift) {
        modifiers += 'shift_';
    }

    if (ret) {
        ret = modifiers + ret;
    }

    if (!dontIgnoreMeta && ret) {
        ret = ret.replace(/ctrl_meta|meta/,'ctrl');
    }

    return [ret, key];
};

// Note: Most of the following code is taken from SproutCore with a few changes.

/**
 * Firefox sends a few key events twice: the first time to the keydown event
 * and then later again to the keypress event. To handle them correct, they
 * should be processed only once. Due to this, we will skip these events
 * in keydown and handle them then in keypress.
 */
exports.addKeyDownListener = function(element, boundFunction) {

    var handleBoundFunction = function(ev) {
        var handled = boundFunction(ev);
        // If the boundFunction returned true, then stop the event.
        if (handled) {
            util.stopEvent(ev);
        }
        return handled;
    };

    element.addEventListener('keydown', function(ev) {
        if (util.isMozilla) {
            // Check for function keys (like DELETE, TAB, LEFT, RIGHT...)
            if (exports.KeyHelper.FUNCTION_KEYS[ev.keyCode]) {
                return true;
                // Check for command keys (like ctrl_c, ctrl_z...)
            } else if ((ev.ctrlKey || ev.metaKey) &&
                    exports.KeyHelper.PRINTABLE_KEYS[ev.keyCode]) {
                return true;
            }
        }

        if (isFunctionOrNonPrintableKey(ev)) {
            return handleBoundFunction(ev);
        }

        return true;
    }, false);

    element.addEventListener('keypress', function(ev) {
        if (util.isMozilla) {
            // If this is a function key, we have to use the keyCode.
            if (exports.KeyHelper.FUNCTION_KEYS[ev.keyCode]) {
                return handleBoundFunction(ev);
            } else if ((ev.ctrlKey || ev.metaKey) &&
                    exports.KeyHelper.PRINTABLE_KEYS_CHARCODE[ev.charCode]){
                // Check for command keys (like ctrl_c, ctrl_z...).
                // For command keys have to convert the charCode to a keyCode
                // as it has been sent from the keydown event to be in line
                // with the other browsers implementations.

                // FF does not allow let you change the keyCode or charCode
                // property. Store to a custom keyCode/charCode variable.
                // The getCommandCodes() function takes care of these
                // special variables.
                ev._keyCode = exports.KeyHelper.PRINTABLE_KEYS_CHARCODE[ev.charCode];
                ev._charCode = 0;
                return handleBoundFunction(ev);
            }
        }

        // normal processing: send keyDown for printable keys.
        if (ev.charCode !== undefined && ev.charCode === 0) {
            return true;
        }

        return handleBoundFunction(ev);
    }, false);
};

});

bespin.tiki.module("keyboard:index",function(require,exports,module) {

});
;bespin.tiki.register("::worker_manager", {
    name: "worker_manager",
    dependencies: { "canon": "0.0.0", "events": "0.0.0", "underscore": "0.0.0" }
});
bespin.tiki.module("worker_manager:index",function(require,exports,module) {
/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Bespin.
 *
 * The Initial Developer of the Original Code is
 * Mozilla.
 * Portions created by the Initial Developer are Copyright (C) 2009
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Bespin Team (bespin@mozilla.com)
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

"define metadata";
({
    "description": "Manages a web worker on the browser side",
    "dependencies": {
        "canon": "0.0.0",
        "events": "0.0.0",
        "underscore": "0.0.0"
    },
    "provides": [
        {
            "ep": "command",
            "name": "worker",
            "description": "Low-level web worker control (for plugin development)"
        },
        {
            "ep": "command",
            "name": "worker restart",
            "description": "Restarts all web workers (for plugin development)",
            "pointer": "#workerRestartCommand"
        }
    ]
});
"end";

if (window == null) {
    throw new Error('The "worker_manager" plugin can only be loaded in the ' +
        'browser, not a web worker. Use "worker" instead.');
}

var proxy = require('bespin:proxy');
var plugins = require('bespin:plugins');
var console = require('bespin:console').console;
var _ = require('underscore')._;
var Event = require('events').Event;
var Promise = require('bespin:promise').Promise;
var env = require('environment').env;

var workerManager = {
    _workers: [],

    add: function(workerSupervisor) {
        this._workers.push(workerSupervisor);
    },

    remove: function(workerSupervisor) {
        this._workers = _(this._workers).without(workerSupervisor);
    },

    restartAll: function() {
        var workers = this._workers;
        _(workers).invoke('kill');
        _(workers).invoke('start');
    }
};

function WorkerSupervisor(pointer) {
    var m = /^([^#:]+)(?::([^#:]+))?#([^#:]+)$/.exec(pointer);
    if (m == null) {
        throw new Error('WorkerSupervisor: invalid pointer specification: "' +
            pointer + '"');
    }

    var packageId = m[1], target = m[3];
    var moduleId = packageId + ":" + (m[2] != null ? m[2] : "index");
    var base = bespin != null && bespin.base != null ? bespin.base : "";

    this._packageId = packageId;
    this._moduleId = moduleId;
    this._base = base;
    this._target = target;

    this._worker = null;
    this._currentId = 0;

    this.started = new Event();
}

WorkerSupervisor.prototype = {
    _onError: function(ev) {
        this._worker = null;
        workerManager.remove(this);

        console.error("WorkerSupervisor: worker failed at file " +
            ev.filename + ":" + ev.lineno + "; fix the worker and use " +
            "'worker restart' to restart it");
    },

    _onMessage: function(ev) {
        var msg = JSON.parse(ev.data);
        switch (msg.op) {
        case 'finish':
            if (msg.id === this._currentId) {
                var promise = this._promise;

                // We have to set the promise to null first, in case the user's
                // then() handler on the promise decides to send another
                // message to the object.
                this._promise = null;

                promise.resolve(msg.result);
            }
            break;

        case 'log':
            console[msg.method].apply(console, msg.args);
            break;
        }
    },

    _promise: null,

    /** An event that fires whenever the worker is started or restarted. */
    started: null,

    /**
     * Terminates the worker. After this call, the worker can be restarted via
     * a call to start().
     */
    kill: function() {
        var oldPromise = this._promise;
        if (oldPromise != null) {
            oldPromise.reject("killed");
            this._promise = null;
        }

        this._worker.terminate();
        this._worker = null;
        workerManager.remove(this);
    },

    /**
     * Invokes a method on the target running in the worker and returns a
     * promise that will resolve to the result of that method.
     */
    send: function(method, args) {
        var oldPromise = this._promise;
        if (oldPromise != null) {
            oldPromise.reject("interrupted");
            this._currentId++;
        }

        var id = this._currentId;
        var promise = new Promise();
        this._promise = promise;

        var msg = { op: 'invoke', id: id, method: method, args: args };
        this._worker.postMessage(JSON.stringify(msg));

        return promise;
    },

    /**
     * Starts the worker. Immediately after this method is called, the
     * "started" event will fire.
     */
    start: function() {
        if (this._worker != null) {
            throw new Error("WorkerSupervisor: worker already started");
        }

        var base = this._base, target = this._target;
        var packageId = this._packageId, moduleId = this._moduleId;

        var worker = new proxy.Worker(base + "BespinEmbedded.js");

        worker.onmessage = this._onMessage.bind(this);
        worker.onerror = this._onError.bind(this);

        var msg = {
            op:     'load',
            base:   base,
            pkg:    packageId,
            module: moduleId,
            target: target
        };
        worker.postMessage(JSON.stringify(msg));

        this._worker = worker;
        this._currentId = 0;

        workerManager.add(this);

        this.started();
    }
};

function workerRestartCommand(args, req) {
    workerManager.restartAll();
}

exports.WorkerSupervisor = WorkerSupervisor;
exports.workerManager = workerManager;
exports.workerRestartCommand = workerRestartCommand;


});
;bespin.tiki.register("::diff", {
    name: "diff",
    dependencies: {  }
});
bespin.tiki.module("diff:index",function(require,exports,module) {
/**
 * Diff Match and Patch
 *
 * Copyright 2006 Google Inc.
 * http://code.google.com/p/google-diff-match-patch/
 *
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// Mozilla: Plugin-metadata
"define metadata";
({
    "description": "Diff/Match/Patch module (support code, no UI)"
});
"end";

/**
 * @fileoverview Computes the difference between two texts to create a patch.
 * Applies the patch onto another text, allowing for errors.
 * @author fraser@google.com (Neil Fraser)
 */

/**
 * Class containing the diff, match and patch methods.
 * @constructor
 */
function diff_match_patch() {

  // Defaults.
  // Redefine these in your program to override the defaults.

  // Number of seconds to map a diff before giving up (0 for infinity).
  this.Diff_Timeout = 1.0;
  // Cost of an empty edit operation in terms of edit characters.
  this.Diff_EditCost = 4;
  // The size beyond which the double-ended diff activates.
  // Double-ending is twice as fast, but less accurate.
  this.Diff_DualThreshold = 32;
  // At what point is no match declared (0.0 = perfection, 1.0 = very loose).
  this.Match_Threshold = 0.5;
  // How far to search for a match (0 = exact location, 1000+ = broad match).
  // A match this many characters away from the expected location will add
  // 1.0 to the score (0.0 is a perfect match).
  this.Match_Distance = 1000;
  // When deleting a large block of text (over ~64 characters), how close does
  // the contents have to match the expected contents. (0.0 = perfection,
  // 1.0 = very loose).  Note that Match_Threshold controls how closely the
  // end points of a delete need to match.
  this.Patch_DeleteThreshold = 0.5;
  // Chunk size for context length.
  this.Patch_Margin = 4;

  /**
   * Compute the number of bits in an int.
   * The normal answer for JavaScript is 32.
   * @return {number} Max bits
   */
  function getMaxBits() {
    var maxbits = 0;
    var oldi = 1;
    var newi = 2;
    while (oldi != newi) {
      maxbits++;
      oldi = newi;
      newi = newi << 1;
    }
    return maxbits;
  }
  // How many bits in a number?
  this.Match_MaxBits = getMaxBits();
}


//  DIFF FUNCTIONS


/**
 * The data structure representing a diff is an array of tuples:
 * [[DIFF_DELETE, 'Hello'], [DIFF_INSERT, 'Goodbye'], [DIFF_EQUAL, ' world.']]
 * which means: delete 'Hello', add 'Goodbye' and keep ' world.'
 */
var DIFF_DELETE = -1;
var DIFF_INSERT = 1;
var DIFF_EQUAL = 0;


/**
 * Find the differences between two texts.  Simplifies the problem by stripping
 * any common prefix or suffix off the texts before diffing.
 * @param {string} text1 Old string to be diffed.
 * @param {string} text2 New string to be diffed.
 * @param {boolean} opt_checklines Optional speedup flag.  If present and false,
 *     then don't run a line-level diff first to identify the changed areas.
 *     Defaults to true, which does a faster, slightly less optimal diff
 * @return {Array.<Array.<*>>} Array of diff tuples.
 */
diff_match_patch.prototype.diff_main = function(text1, text2, opt_checklines) {
  // Check for equality (speedup)
  if (text1 == text2) {
    return [[DIFF_EQUAL, text1]];
  }

  if (typeof opt_checklines == 'undefined') {
    opt_checklines = true;
  }
  var checklines = opt_checklines;

  // Trim off common prefix (speedup)
  var commonlength = this.diff_commonPrefix(text1, text2);
  var commonprefix = text1.substring(0, commonlength);
  text1 = text1.substring(commonlength);
  text2 = text2.substring(commonlength);

  // Trim off common suffix (speedup)
  commonlength = this.diff_commonSuffix(text1, text2);
  var commonsuffix = text1.substring(text1.length - commonlength);
  text1 = text1.substring(0, text1.length - commonlength);
  text2 = text2.substring(0, text2.length - commonlength);

  // Compute the diff on the middle block
  var diffs = this.diff_compute(text1, text2, checklines);

  // Restore the prefix and suffix
  if (commonprefix) {
    diffs.unshift([DIFF_EQUAL, commonprefix]);
  }
  if (commonsuffix) {
    diffs.push([DIFF_EQUAL, commonsuffix]);
  }
  this.diff_cleanupMerge(diffs);
  return diffs;
};


/**
 * Find the differences between two texts.  Assumes that the texts do not
 * have any common prefix or suffix.
 * @param {string} text1 Old string to be diffed.
 * @param {string} text2 New string to be diffed.
 * @param {boolean} checklines Speedup flag.  If false, then don't run a
 *     line-level diff first to identify the changed areas.
 *     If true, then run a faster, slightly less optimal diff
 * @return {Array.<Array.<*>>} Array of diff tuples.
 * @private
 */
diff_match_patch.prototype.diff_compute = function(text1, text2, checklines) {
  var diffs;

  if (!text1) {
    // Just add some text (speedup)
    return [[DIFF_INSERT, text2]];
  }

  if (!text2) {
    // Just delete some text (speedup)
    return [[DIFF_DELETE, text1]];
  }

  var longtext = text1.length > text2.length ? text1 : text2;
  var shorttext = text1.length > text2.length ? text2 : text1;
  var i = longtext.indexOf(shorttext);
  if (i != -1) {
    // Shorter text is inside the longer text (speedup)
    diffs = [[DIFF_INSERT, longtext.substring(0, i)],
             [DIFF_EQUAL, shorttext],
             [DIFF_INSERT, longtext.substring(i + shorttext.length)]];
    // Swap insertions for deletions if diff is reversed.
    if (text1.length > text2.length) {
      diffs[0][0] = diffs[2][0] = DIFF_DELETE;
    }
    return diffs;
  }
  longtext = shorttext = null;  // Garbage collect

  // Check to see if the problem can be split in two.
  var hm = this.diff_halfMatch(text1, text2);
  if (hm) {
    // A half-match was found, sort out the return data.
    var text1_a = hm[0];
    var text1_b = hm[1];
    var text2_a = hm[2];
    var text2_b = hm[3];
    var mid_common = hm[4];
    // Send both pairs off for separate processing.
    var diffs_a = this.diff_main(text1_a, text2_a, checklines);
    var diffs_b = this.diff_main(text1_b, text2_b, checklines);
    // Merge the results.
    return diffs_a.concat([[DIFF_EQUAL, mid_common]], diffs_b);
  }

  // Perform a real diff.
  if (checklines && (text1.length < 100 || text2.length < 100)) {
    // Too trivial for the overhead.
    checklines = false;
  }
  var linearray;
  if (checklines) {
    // Scan the text on a line-by-line basis first.
    var a = this.diff_linesToChars(text1, text2);
    text1 = a[0];
    text2 = a[1];
    linearray = a[2];
  }
  diffs = this.diff_map(text1, text2);
  if (!diffs) {
    // No acceptable result.
    diffs = [[DIFF_DELETE, text1], [DIFF_INSERT, text2]];
  }
  if (checklines) {
    // Convert the diff back to original text.
    this.diff_charsToLines(diffs, linearray);
    // Eliminate freak matches (e.g. blank lines)
    this.diff_cleanupSemantic(diffs);

    // Rediff any replacement blocks, this time character-by-character.
    // Add a dummy entry at the end.
    diffs.push([DIFF_EQUAL, '']);
    var pointer = 0;
    var count_delete = 0;
    var count_insert = 0;
    var text_delete = '';
    var text_insert = '';
    while (pointer < diffs.length) {
      switch (diffs[pointer][0]) {
        case DIFF_INSERT:
          count_insert++;
          text_insert += diffs[pointer][1];
          break;
        case DIFF_DELETE:
          count_delete++;
          text_delete += diffs[pointer][1];
          break;
        case DIFF_EQUAL:
          // Upon reaching an equality, check for prior redundancies.
          if (count_delete >= 1 && count_insert >= 1) {
            // Delete the offending records and add the merged ones.
            var a = this.diff_main(text_delete, text_insert, false);
            diffs.splice(pointer - count_delete - count_insert,
                         count_delete + count_insert);
            pointer = pointer - count_delete - count_insert;
            for (var j = a.length - 1; j >= 0; j--) {
              diffs.splice(pointer, 0, a[j]);
            }
            pointer = pointer + a.length;
          }
          count_insert = 0;
          count_delete = 0;
          text_delete = '';
          text_insert = '';
          break;
      }
     pointer++;
    }
    diffs.pop();  // Remove the dummy entry at the end.
  }
  return diffs;
};


/**
 * Split two texts into an array of strings.  Reduce the texts to a string of
 * hashes where each Unicode character represents one line.
 * @param {string} text1 First string.
 * @param {string} text2 Second string.
 * @return {Array.<string|Array.<string>>} Three element Array, containing the
 *     encoded text1, the encoded text2 and the array of unique strings.  The
 *     zeroth element of the array of unique strings is intentionally blank.
 * @private
 */
diff_match_patch.prototype.diff_linesToChars = function(text1, text2) {
  var lineArray = [];  // e.g. lineArray[4] == 'Hello\n'
  var lineHash = {};   // e.g. lineHash['Hello\n'] == 4

  // '\x00' is a valid character, but various debuggers don't like it.
  // So we'll insert a junk entry to avoid generating a null character.
  lineArray[0] = '';

  /**
   * Split a text into an array of strings.  Reduce the texts to a string of
   * hashes where each Unicode character represents one line.
   * Modifies linearray and linehash through being a closure.
   * @param {string} text String to encode
   * @return {string} Encoded string
   * @private
   */
  function diff_linesToCharsMunge(text) {
    var chars = '';
    // Walk the text, pulling out a substring for each line.
    // text.split('\n') would would temporarily double our memory footprint.
    // Modifying text would create many large strings to garbage collect.
    var lineStart = 0;
    var lineEnd = -1;
    // Keeping our own length variable is faster than looking it up.
    var lineArrayLength = lineArray.length;
    while (lineEnd < text.length - 1) {
      lineEnd = text.indexOf('\n', lineStart);
      if (lineEnd == -1) {
        lineEnd = text.length - 1;
      }
      var line = text.substring(lineStart, lineEnd + 1);
      lineStart = lineEnd + 1;

      if (lineHash.hasOwnProperty ? lineHash.hasOwnProperty(line) :
          (lineHash[line] !== undefined)) {
        chars += String.fromCharCode(lineHash[line]);
      } else {
        chars += String.fromCharCode(lineArrayLength);
        lineHash[line] = lineArrayLength;
        lineArray[lineArrayLength++] = line;
      }
    }
    return chars;
  }

  var chars1 = diff_linesToCharsMunge(text1);
  var chars2 = diff_linesToCharsMunge(text2);
  return [chars1, chars2, lineArray];
};


/**
 * Rehydrate the text in a diff from a string of line hashes to real lines of
 * text.
 * @param {Array.<Array.<*>>} diffs Array of diff tuples.
 * @param {Array.<string>} lineArray Array of unique strings.
 * @private
 */
diff_match_patch.prototype.diff_charsToLines = function(diffs, lineArray) {
  for (var x = 0; x < diffs.length; x++) {
    var chars = diffs[x][1];
    var text = [];
    for (var y = 0; y < chars.length; y++) {
      text[y] = lineArray[chars.charCodeAt(y)];
    }
    diffs[x][1] = text.join('');
  }
};


/**
 * Explore the intersection points between the two texts.
 * @param {string} text1 Old string to be diffed.
 * @param {string} text2 New string to be diffed.
 * @return {Array.<Array.<*>>?} Array of diff tuples or null if no diff
 *     available.
 * @private
 */
diff_match_patch.prototype.diff_map = function(text1, text2) {
  // Don't run for too long.
  var ms_end = (new Date()).getTime() + this.Diff_Timeout * 1000;
  // Cache the text lengths to prevent multiple calls.
  var text1_length = text1.length;
  var text2_length = text2.length;
  var max_d = text1_length + text2_length - 1;
  var doubleEnd = this.Diff_DualThreshold * 2 < max_d;
  var v_map1 = [];
  var v_map2 = [];
  var v1 = {};
  var v2 = {};
  v1[1] = 0;
  v2[1] = 0;
  var x, y;
  var footstep;  // Used to track overlapping paths.
  var footsteps = {};
  var done = false;
  // Safari 1.x doesn't have hasOwnProperty
  var hasOwnProperty = !!(footsteps.hasOwnProperty);
  // If the total number of characters is odd, then the front path will collide
  // with the reverse path.
  var front = (text1_length + text2_length) % 2;
  for (var d = 0; d < max_d; d++) {
    // Bail out if timeout reached.
    if (this.Diff_Timeout > 0 && (new Date()).getTime() > ms_end) {
      return null;
    }

    // Walk the front path one step.
    v_map1[d] = {};
    for (var k = -d; k <= d; k += 2) {
      if (k == -d || k != d && v1[k - 1] < v1[k + 1]) {
        x = v1[k + 1];
      } else {
        x = v1[k - 1] + 1;
      }
      y = x - k;
      if (doubleEnd) {
        footstep = x + ',' + y;
        if (front && (hasOwnProperty ? footsteps.hasOwnProperty(footstep) :
                      (footsteps[footstep] !== undefined))) {
          done = true;
        }
        if (!front) {
          footsteps[footstep] = d;
        }
      }
      while (!done && x < text1_length && y < text2_length &&
             text1.charAt(x) == text2.charAt(y)) {
        x++;
        y++;
        if (doubleEnd) {
          footstep = x + ',' + y;
          if (front && (hasOwnProperty ? footsteps.hasOwnProperty(footstep) :
              (footsteps[footstep] !== undefined))) {
            done = true;
          }
          if (!front) {
            footsteps[footstep] = d;
          }
        }
      }
      v1[k] = x;
      v_map1[d][x + ',' + y] = true;
      if (x == text1_length && y == text2_length) {
        // Reached the end in single-path mode.
        return this.diff_path1(v_map1, text1, text2);
      } else if (done) {
        // Front path ran over reverse path.
        v_map2 = v_map2.slice(0, footsteps[footstep] + 1);
        var a = this.diff_path1(v_map1, text1.substring(0, x),
                                text2.substring(0, y));
        return a.concat(this.diff_path2(v_map2, text1.substring(x),
                                        text2.substring(y)));
      }
    }

    if (doubleEnd) {
      // Walk the reverse path one step.
      v_map2[d] = {};
      for (var k = -d; k <= d; k += 2) {
        if (k == -d || k != d && v2[k - 1] < v2[k + 1]) {
          x = v2[k + 1];
        } else {
          x = v2[k - 1] + 1;
        }
        y = x - k;
        footstep = (text1_length - x) + ',' + (text2_length - y);
        if (!front && (hasOwnProperty ? footsteps.hasOwnProperty(footstep) :
                       (footsteps[footstep] !== undefined))) {
          done = true;
        }
        if (front) {
          footsteps[footstep] = d;
        }
        while (!done && x < text1_length && y < text2_length &&
               text1.charAt(text1_length - x - 1) ==
               text2.charAt(text2_length - y - 1)) {
          x++;
          y++;
          footstep = (text1_length - x) + ',' + (text2_length - y);
          if (!front && (hasOwnProperty ? footsteps.hasOwnProperty(footstep) :
                         (footsteps[footstep] !== undefined))) {
            done = true;
          }
          if (front) {
            footsteps[footstep] = d;
          }
        }
        v2[k] = x;
        v_map2[d][x + ',' + y] = true;
        if (done) {
          // Reverse path ran over front path.
          v_map1 = v_map1.slice(0, footsteps[footstep] + 1);
          var a = this.diff_path1(v_map1, text1.substring(0, text1_length - x),
                                  text2.substring(0, text2_length - y));
          return a.concat(this.diff_path2(v_map2,
                          text1.substring(text1_length - x),
                          text2.substring(text2_length - y)));
        }
      }
    }
  }
  // Number of diffs equals number of characters, no commonality at all.
  return null;
};


/**
 * Work from the middle back to the start to determine the path.
 * @param {Array.<Object>} v_map Array of paths.
 * @param {string} text1 Old string fragment to be diffed.
 * @param {string} text2 New string fragment to be diffed.
 * @return {Array.<Array.<*>>} Array of diff tuples.
 * @private
 */
diff_match_patch.prototype.diff_path1 = function(v_map, text1, text2) {
  var path = [];
  var x = text1.length;
  var y = text2.length;
  /** @type {number?} */
  var last_op = null;
  for (var d = v_map.length - 2; d >= 0; d--) {
    while (1) {
      if (v_map[d].hasOwnProperty ? v_map[d].hasOwnProperty((x - 1) + ',' + y) :
          (v_map[d][(x - 1) + ',' + y] !== undefined)) {
        x--;
        if (last_op === DIFF_DELETE) {
          path[0][1] = text1.charAt(x) + path[0][1];
        } else {
          path.unshift([DIFF_DELETE, text1.charAt(x)]);
        }
        last_op = DIFF_DELETE;
        break;
      } else if (v_map[d].hasOwnProperty ?
                 v_map[d].hasOwnProperty(x + ',' + (y - 1)) :
                 (v_map[d][x + ',' + (y - 1)] !== undefined)) {
        y--;
        if (last_op === DIFF_INSERT) {
          path[0][1] = text2.charAt(y) + path[0][1];
        } else {
          path.unshift([DIFF_INSERT, text2.charAt(y)]);
        }
        last_op = DIFF_INSERT;
        break;
      } else {
        x--;
        y--;
        //if (text1.charAt(x) != text2.charAt(y)) {
        //  throw new Error('No diagonal.  Can\'t happen. (diff_path1)');
        //}
        if (last_op === DIFF_EQUAL) {
          path[0][1] = text1.charAt(x) + path[0][1];
        } else {
          path.unshift([DIFF_EQUAL, text1.charAt(x)]);
        }
        last_op = DIFF_EQUAL;
      }
    }
  }
  return path;
};


/**
 * Work from the middle back to the end to determine the path.
 * @param {Array.<Object>} v_map Array of paths.
 * @param {string} text1 Old string fragment to be diffed.
 * @param {string} text2 New string fragment to be diffed.
 * @return {Array.<Array.<*>>} Array of diff tuples.
 * @private
 */
diff_match_patch.prototype.diff_path2 = function(v_map, text1, text2) {
  var path = [];
  var pathLength = 0;
  var x = text1.length;
  var y = text2.length;
  /** @type {number?} */
  var last_op = null;
  for (var d = v_map.length - 2; d >= 0; d--) {
    while (1) {
      if (v_map[d].hasOwnProperty ? v_map[d].hasOwnProperty((x - 1) + ',' + y) :
          (v_map[d][(x - 1) + ',' + y] !== undefined)) {
        x--;
        if (last_op === DIFF_DELETE) {
          path[pathLength - 1][1] += text1.charAt(text1.length - x - 1);
        } else {
          path[pathLength++] =
              [DIFF_DELETE, text1.charAt(text1.length - x - 1)];
        }
        last_op = DIFF_DELETE;
        break;
      } else if (v_map[d].hasOwnProperty ?
                 v_map[d].hasOwnProperty(x + ',' + (y - 1)) :
                 (v_map[d][x + ',' + (y - 1)] !== undefined)) {
        y--;
        if (last_op === DIFF_INSERT) {
          path[pathLength - 1][1] += text2.charAt(text2.length - y - 1);
        } else {
          path[pathLength++] =
              [DIFF_INSERT, text2.charAt(text2.length - y - 1)];
        }
        last_op = DIFF_INSERT;
        break;
      } else {
        x--;
        y--;
        //if (text1.charAt(text1.length - x - 1) !=
        //    text2.charAt(text2.length - y - 1)) {
        //  throw new Error('No diagonal.  Can\'t happen. (diff_path2)');
        //}
        if (last_op === DIFF_EQUAL) {
          path[pathLength - 1][1] += text1.charAt(text1.length - x - 1);
        } else {
          path[pathLength++] =
              [DIFF_EQUAL, text1.charAt(text1.length - x - 1)];
        }
        last_op = DIFF_EQUAL;
      }
    }
  }
  return path;
};


/**
 * Determine the common prefix of two strings
 * @param {string} text1 First string.
 * @param {string} text2 Second string.
 * @return {number} The number of characters common to the start of each
 *     string.
 */
diff_match_patch.prototype.diff_commonPrefix = function(text1, text2) {
  // Quick check for common null cases.
  if (!text1 || !text2 || text1.charCodeAt(0) !== text2.charCodeAt(0)) {
    return 0;
  }
  // Binary search.
  // Performance analysis: http://neil.fraser.name/news/2007/10/09/
  var pointermin = 0;
  var pointermax = Math.min(text1.length, text2.length);
  var pointermid = pointermax;
  var pointerstart = 0;
  while (pointermin < pointermid) {
    if (text1.substring(pointerstart, pointermid) ==
        text2.substring(pointerstart, pointermid)) {
      pointermin = pointermid;
      pointerstart = pointermin;
    } else {
      pointermax = pointermid;
    }
    pointermid = Math.floor((pointermax - pointermin) / 2 + pointermin);
  }
  return pointermid;
};


/**
 * Determine the common suffix of two strings
 * @param {string} text1 First string.
 * @param {string} text2 Second string.
 * @return {number} The number of characters common to the end of each string.
 */
diff_match_patch.prototype.diff_commonSuffix = function(text1, text2) {
  // Quick check for common null cases.
  if (!text1 || !text2 || text1.charCodeAt(text1.length - 1) !==
                          text2.charCodeAt(text2.length - 1)) {
    return 0;
  }
  // Binary search.
  // Performance analysis: http://neil.fraser.name/news/2007/10/09/
  var pointermin = 0;
  var pointermax = Math.min(text1.length, text2.length);
  var pointermid = pointermax;
  var pointerend = 0;
  while (pointermin < pointermid) {
    if (text1.substring(text1.length - pointermid, text1.length - pointerend) ==
        text2.substring(text2.length - pointermid, text2.length - pointerend)) {
      pointermin = pointermid;
      pointerend = pointermin;
    } else {
      pointermax = pointermid;
    }
    pointermid = Math.floor((pointermax - pointermin) / 2 + pointermin);
  }
  return pointermid;
};


/**
 * Do the two texts share a substring which is at least half the length of the
 * longer text?
 * @param {string} text1 First string.
 * @param {string} text2 Second string.
 * @return {Array.<string>?} Five element Array, containing the prefix of
 *     text1, the suffix of text1, the prefix of text2, the suffix of
 *     text2 and the common middle.  Or null if there was no match.
 */
diff_match_patch.prototype.diff_halfMatch = function(text1, text2) {
  var longtext = text1.length > text2.length ? text1 : text2;
  var shorttext = text1.length > text2.length ? text2 : text1;
  if (longtext.length < 10 || shorttext.length < 1) {
    return null;  // Pointless.
  }
  var dmp = this;  // 'this' becomes 'window' in a closure.

  /**
   * Does a substring of shorttext exist within longtext such that the substring
   * is at least half the length of longtext?
   * Closure, but does not reference any external variables.
   * @param {string} longtext Longer string.
   * @param {string} shorttext Shorter string.
   * @param {number} i Start index of quarter length substring within longtext
   * @return {Array.<string>?} Five element Array, containing the prefix of
   *     longtext, the suffix of longtext, the prefix of shorttext, the suffix
   *     of shorttext and the common middle.  Or null if there was no match.
   * @private
   */
  function diff_halfMatchI(longtext, shorttext, i) {
    // Start with a 1/4 length substring at position i as a seed.
    var seed = longtext.substring(i, i + Math.floor(longtext.length / 4));
    var j = -1;
    var best_common = '';
    var best_longtext_a, best_longtext_b, best_shorttext_a, best_shorttext_b;
    while ((j = shorttext.indexOf(seed, j + 1)) != -1) {
      var prefixLength = dmp.diff_commonPrefix(longtext.substring(i),
                                               shorttext.substring(j));
      var suffixLength = dmp.diff_commonSuffix(longtext.substring(0, i),
                                               shorttext.substring(0, j));
      if (best_common.length < suffixLength + prefixLength) {
        best_common = shorttext.substring(j - suffixLength, j) +
            shorttext.substring(j, j + prefixLength);
        best_longtext_a = longtext.substring(0, i - suffixLength);
        best_longtext_b = longtext.substring(i + prefixLength);
        best_shorttext_a = shorttext.substring(0, j - suffixLength);
        best_shorttext_b = shorttext.substring(j + prefixLength);
      }
    }
    if (best_common.length >= longtext.length / 2) {
      return [best_longtext_a, best_longtext_b,
              best_shorttext_a, best_shorttext_b, best_common];
    } else {
      return null;
    }
  }

  // First check if the second quarter is the seed for a half-match.
  var hm1 = diff_halfMatchI(longtext, shorttext,
                            Math.ceil(longtext.length / 4));
  // Check again based on the third quarter.
  var hm2 = diff_halfMatchI(longtext, shorttext,
                            Math.ceil(longtext.length / 2));
  var hm;
  if (!hm1 && !hm2) {
    return null;
  } else if (!hm2) {
    hm = hm1;
  } else if (!hm1) {
    hm = hm2;
  } else {
    // Both matched.  Select the longest.
    hm = hm1[4].length > hm2[4].length ? hm1 : hm2;
  }

  // A half-match was found, sort out the return data.
  var text1_a, text1_b, text2_a, text2_b;
  if (text1.length > text2.length) {
    text1_a = hm[0];
    text1_b = hm[1];
    text2_a = hm[2];
    text2_b = hm[3];
  } else {
    text2_a = hm[0];
    text2_b = hm[1];
    text1_a = hm[2];
    text1_b = hm[3];
  }
  var mid_common = hm[4];
  return [text1_a, text1_b, text2_a, text2_b, mid_common];
};


/**
 * Reduce the number of edits by eliminating semantically trivial equalities.
 * @param {Array.<Array.<*>>} diffs Array of diff tuples.
 */
diff_match_patch.prototype.diff_cleanupSemantic = function(diffs) {
  var changes = false;
  var equalities = [];  // Stack of indices where equalities are found.
  var equalitiesLength = 0;  // Keeping our own length var is faster in JS.
  var lastequality = null;  // Always equal to equalities[equalitiesLength-1][1]
  var pointer = 0;  // Index of current position.
  // Number of characters that changed prior to the equality.
  var length_changes1 = 0;
  // Number of characters that changed after the equality.
  var length_changes2 = 0;
  while (pointer < diffs.length) {
    if (diffs[pointer][0] == DIFF_EQUAL) {  // equality found
      equalities[equalitiesLength++] = pointer;
      length_changes1 = length_changes2;
      length_changes2 = 0;
      lastequality = diffs[pointer][1];
    } else {  // an insertion or deletion
      length_changes2 += diffs[pointer][1].length;
      if (lastequality !== null && (lastequality.length <= length_changes1) &&
          (lastequality.length <= length_changes2)) {
        // Duplicate record
        diffs.splice(equalities[equalitiesLength - 1], 0,
                     [DIFF_DELETE, lastequality]);
        // Change second copy to insert.
        diffs[equalities[equalitiesLength - 1] + 1][0] = DIFF_INSERT;
        // Throw away the equality we just deleted.
        equalitiesLength--;
        // Throw away the previous equality (it needs to be reevaluated).
        equalitiesLength--;
        pointer = equalitiesLength > 0 ? equalities[equalitiesLength - 1] : -1;
        length_changes1 = 0;  // Reset the counters.
        length_changes2 = 0;
        lastequality = null;
        changes = true;
      }
    }
    pointer++;
  }
  if (changes) {
    this.diff_cleanupMerge(diffs);
  }
  this.diff_cleanupSemanticLossless(diffs);
};


/**
 * Look for single edits surrounded on both sides by equalities
 * which can be shifted sideways to align the edit to a word boundary.
 * e.g: The c<ins>at c</ins>ame. -> The <ins>cat </ins>came.
 * @param {Array.<Array.<*>>} diffs Array of diff tuples.
 */
diff_match_patch.prototype.diff_cleanupSemanticLossless = function(diffs) {
  // Define some regex patterns for matching boundaries.
  var punctuation = /[^a-zA-Z0-9]/;
  var whitespace = /\s/;
  var linebreak = /[\r\n]/;
  var blanklineEnd = /\n\r?\n$/;
  var blanklineStart = /^\r?\n\r?\n/;

  /**
   * Given two strings, compute a score representing whether the internal
   * boundary falls on logical boundaries.
   * Scores range from 5 (best) to 0 (worst).
   * Closure, makes reference to regex patterns defined above.
   * @param {string} one First string
   * @param {string} two Second string
   * @return {number} The score.
   */
  function diff_cleanupSemanticScore(one, two) {
    if (!one || !two) {
      // Edges are the best.
      return 5;
    }

    // Each port of this function behaves slightly differently due to
    // subtle differences in each language's definition of things like
    // 'whitespace'.  Since this function's purpose is largely cosmetic,
    // the choice has been made to use each language's native features
    // rather than force total conformity.
    var score = 0;
    // One point for non-alphanumeric.
    if (one.charAt(one.length - 1).match(punctuation) ||
        two.charAt(0).match(punctuation)) {
      score++;
      // Two points for whitespace.
      if (one.charAt(one.length - 1).match(whitespace) ||
          two.charAt(0).match(whitespace)) {
        score++;
        // Three points for line breaks.
        if (one.charAt(one.length - 1).match(linebreak) ||
            two.charAt(0).match(linebreak)) {
          score++;
          // Four points for blank lines.
          if (one.match(blanklineEnd) || two.match(blanklineStart)) {
            score++;
          }
        }
      }
    }
    return score;
  }

  var pointer = 1;
  // Intentionally ignore the first and last element (don't need checking).
  while (pointer < diffs.length - 1) {
    if (diffs[pointer - 1][0] == DIFF_EQUAL &&
        diffs[pointer + 1][0] == DIFF_EQUAL) {
      // This is a single edit surrounded by equalities.
      var equality1 = diffs[pointer - 1][1];
      var edit = diffs[pointer][1];
      var equality2 = diffs[pointer + 1][1];

      // First, shift the edit as far left as possible.
      var commonOffset = this.diff_commonSuffix(equality1, edit);
      if (commonOffset) {
        var commonString = edit.substring(edit.length - commonOffset);
        equality1 = equality1.substring(0, equality1.length - commonOffset);
        edit = commonString + edit.substring(0, edit.length - commonOffset);
        equality2 = commonString + equality2;
      }

      // Second, step character by character right, looking for the best fit.
      var bestEquality1 = equality1;
      var bestEdit = edit;
      var bestEquality2 = equality2;
      var bestScore = diff_cleanupSemanticScore(equality1, edit) +
          diff_cleanupSemanticScore(edit, equality2);
      while (edit.charAt(0) === equality2.charAt(0)) {
        equality1 += edit.charAt(0);
        edit = edit.substring(1) + equality2.charAt(0);
        equality2 = equality2.substring(1);
        var score = diff_cleanupSemanticScore(equality1, edit) +
            diff_cleanupSemanticScore(edit, equality2);
        // The >= encourages trailing rather than leading whitespace on edits.
        if (score >= bestScore) {
          bestScore = score;
          bestEquality1 = equality1;
          bestEdit = edit;
          bestEquality2 = equality2;
        }
      }

      if (diffs[pointer - 1][1] != bestEquality1) {
        // We have an improvement, save it back to the diff.
        if (bestEquality1) {
          diffs[pointer - 1][1] = bestEquality1;
        } else {
          diffs.splice(pointer - 1, 1);
          pointer--;
        }
        diffs[pointer][1] = bestEdit;
        if (bestEquality2) {
          diffs[pointer + 1][1] = bestEquality2;
        } else {
          diffs.splice(pointer + 1, 1);
          pointer--;
        }
      }
    }
    pointer++;
  }
};


/**
 * Reduce the number of edits by eliminating operationally trivial equalities.
 * @param {Array.<Array.<*>>} diffs Array of diff tuples.
 */
diff_match_patch.prototype.diff_cleanupEfficiency = function(diffs) {
  var changes = false;
  var equalities = [];  // Stack of indices where equalities are found.
  var equalitiesLength = 0;  // Keeping our own length var is faster in JS.
  var lastequality = '';  // Always equal to equalities[equalitiesLength-1][1]
  var pointer = 0;  // Index of current position.
  // Is there an insertion operation before the last equality.
  var pre_ins = false;
  // Is there a deletion operation before the last equality.
  var pre_del = false;
  // Is there an insertion operation after the last equality.
  var post_ins = false;
  // Is there a deletion operation after the last equality.
  var post_del = false;
  while (pointer < diffs.length) {
    if (diffs[pointer][0] == DIFF_EQUAL) {  // equality found
      if (diffs[pointer][1].length < this.Diff_EditCost &&
          (post_ins || post_del)) {
        // Candidate found.
        equalities[equalitiesLength++] = pointer;
        pre_ins = post_ins;
        pre_del = post_del;
        lastequality = diffs[pointer][1];
      } else {
        // Not a candidate, and can never become one.
        equalitiesLength = 0;
        lastequality = '';
      }
      post_ins = post_del = false;
    } else {  // an insertion or deletion
      if (diffs[pointer][0] == DIFF_DELETE) {
        post_del = true;
      } else {
        post_ins = true;
      }
      /*
       * Five types to be split:
       * <ins>A</ins><del>B</del>XY<ins>C</ins><del>D</del>
       * <ins>A</ins>X<ins>C</ins><del>D</del>
       * <ins>A</ins><del>B</del>X<ins>C</ins>
       * <ins>A</del>X<ins>C</ins><del>D</del>
       * <ins>A</ins><del>B</del>X<del>C</del>
       */
      if (lastequality && ((pre_ins && pre_del && post_ins && post_del) ||
                           ((lastequality.length < this.Diff_EditCost / 2) &&
                            (pre_ins + pre_del + post_ins + post_del) == 3))) {
        // Duplicate record
        diffs.splice(equalities[equalitiesLength - 1], 0,
                     [DIFF_DELETE, lastequality]);
        // Change second copy to insert.
        diffs[equalities[equalitiesLength - 1] + 1][0] = DIFF_INSERT;
        equalitiesLength--;  // Throw away the equality we just deleted;
        lastequality = '';
        if (pre_ins && pre_del) {
          // No changes made which could affect previous entry, keep going.
          post_ins = post_del = true;
          equalitiesLength = 0;
        } else {
          equalitiesLength--;  // Throw away the previous equality;
          pointer = equalitiesLength > 0 ? equalities[equalitiesLength - 1] : -1;
          post_ins = post_del = false;
        }
        changes = true;
      }
    }
    pointer++;
  }

  if (changes) {
    this.diff_cleanupMerge(diffs);
  }
};


/**
 * Reorder and merge like edit sections.  Merge equalities.
 * Any edit section can move as long as it doesn't cross an equality.
 * @param {Array.<Array.<*>>} diffs Array of diff tuples.
 */
diff_match_patch.prototype.diff_cleanupMerge = function(diffs) {
  diffs.push([DIFF_EQUAL, '']);  // Add a dummy entry at the end.
  var pointer = 0;
  var count_delete = 0;
  var count_insert = 0;
  var text_delete = '';
  var text_insert = '';
  var commonlength;
  while (pointer < diffs.length) {
    switch (diffs[pointer][0]) {
      case DIFF_INSERT:
        count_insert++;
        text_insert += diffs[pointer][1];
        pointer++;
        break;
      case DIFF_DELETE:
        count_delete++;
        text_delete += diffs[pointer][1];
        pointer++;
        break;
      case DIFF_EQUAL:
        // Upon reaching an equality, check for prior redundancies.
        if (count_delete !== 0 || count_insert !== 0) {
          if (count_delete !== 0 && count_insert !== 0) {
            // Factor out any common prefixies.
            commonlength = this.diff_commonPrefix(text_insert, text_delete);
            if (commonlength !== 0) {
              if ((pointer - count_delete - count_insert) > 0 &&
                  diffs[pointer - count_delete - count_insert - 1][0] ==
                  DIFF_EQUAL) {
                diffs[pointer - count_delete - count_insert - 1][1] +=
                    text_insert.substring(0, commonlength);
              } else {
                diffs.splice(0, 0, [DIFF_EQUAL,
                    text_insert.substring(0, commonlength)]);
                pointer++;
              }
              text_insert = text_insert.substring(commonlength);
              text_delete = text_delete.substring(commonlength);
            }
            // Factor out any common suffixies.
            commonlength = this.diff_commonSuffix(text_insert, text_delete);
            if (commonlength !== 0) {
              diffs[pointer][1] = text_insert.substring(text_insert.length -
                  commonlength) + diffs[pointer][1];
              text_insert = text_insert.substring(0, text_insert.length -
                  commonlength);
              text_delete = text_delete.substring(0, text_delete.length -
                  commonlength);
            }
          }
          // Delete the offending records and add the merged ones.
          if (count_delete === 0) {
            diffs.splice(pointer - count_delete - count_insert,
                count_delete + count_insert, [DIFF_INSERT, text_insert]);
          } else if (count_insert === 0) {
            diffs.splice(pointer - count_delete - count_insert,
                count_delete + count_insert, [DIFF_DELETE, text_delete]);
          } else {
            diffs.splice(pointer - count_delete - count_insert,
                count_delete + count_insert, [DIFF_DELETE, text_delete],
                [DIFF_INSERT, text_insert]);
          }
          pointer = pointer - count_delete - count_insert +
                    (count_delete ? 1 : 0) + (count_insert ? 1 : 0) + 1;
        } else if (pointer !== 0 && diffs[pointer - 1][0] == DIFF_EQUAL) {
          // Merge this equality with the previous one.
          diffs[pointer - 1][1] += diffs[pointer][1];
          diffs.splice(pointer, 1);
        } else {
          pointer++;
        }
        count_insert = 0;
        count_delete = 0;
        text_delete = '';
        text_insert = '';
        break;
    }
  }
  if (diffs[diffs.length - 1][1] === '') {
    diffs.pop();  // Remove the dummy entry at the end.
  }

  // Second pass: look for single edits surrounded on both sides by equalities
  // which can be shifted sideways to eliminate an equality.
  // e.g: A<ins>BA</ins>C -> <ins>AB</ins>AC
  var changes = false;
  pointer = 1;
  // Intentionally ignore the first and last element (don't need checking).
  while (pointer < diffs.length - 1) {
    if (diffs[pointer - 1][0] == DIFF_EQUAL &&
        diffs[pointer + 1][0] == DIFF_EQUAL) {
      // This is a single edit surrounded by equalities.
      if (diffs[pointer][1].substring(diffs[pointer][1].length -
          diffs[pointer - 1][1].length) == diffs[pointer - 1][1]) {
        // Shift the edit over the previous equality.
        diffs[pointer][1] = diffs[pointer - 1][1] +
            diffs[pointer][1].substring(0, diffs[pointer][1].length -
                                        diffs[pointer - 1][1].length);
        diffs[pointer + 1][1] = diffs[pointer - 1][1] + diffs[pointer + 1][1];
        diffs.splice(pointer - 1, 1);
        changes = true;
      } else if (diffs[pointer][1].substring(0, diffs[pointer + 1][1].length) ==
          diffs[pointer + 1][1]) {
        // Shift the edit over the next equality.
        diffs[pointer - 1][1] += diffs[pointer + 1][1];
        diffs[pointer][1] =
            diffs[pointer][1].substring(diffs[pointer + 1][1].length) +
            diffs[pointer + 1][1];
        diffs.splice(pointer + 1, 1);
        changes = true;
      }
    }
    pointer++;
  }
  // If shifts were made, the diff needs reordering and another shift sweep.
  if (changes) {
    this.diff_cleanupMerge(diffs);
  }
};


/**
 * loc is a location in text1, compute and return the equivalent location in
 * text2.
 * e.g. 'The cat' vs 'The big cat', 1->1, 5->8
 * @param {Array.<Array.<*>>} diffs Array of diff tuples.
 * @param {number} loc Location within text1.
 * @return {number} Location within text2.
 */
diff_match_patch.prototype.diff_xIndex = function(diffs, loc) {
  var chars1 = 0;
  var chars2 = 0;
  var last_chars1 = 0;
  var last_chars2 = 0;
  var x;
  for (x = 0; x < diffs.length; x++) {
    if (diffs[x][0] !== DIFF_INSERT) {  // Equality or deletion.
      chars1 += diffs[x][1].length;
    }
    if (diffs[x][0] !== DIFF_DELETE) {  // Equality or insertion.
      chars2 += diffs[x][1].length;
    }
    if (chars1 > loc) {  // Overshot the location.
      break;
    }
    last_chars1 = chars1;
    last_chars2 = chars2;
  }
  // Was the location was deleted?
  if (diffs.length != x && diffs[x][0] === DIFF_DELETE) {
    return last_chars2;
  }
  // Add the remaining character length.
  return last_chars2 + (loc - last_chars1);
};


/**
 * Convert a diff array into a pretty HTML report.
 * @param {Array.<Array.<*>>} diffs Array of diff tuples.
 * @return {string} HTML representation.
 */
diff_match_patch.prototype.diff_prettyHtml = function(diffs) {
  var html = [];
  var i = 0;
  for (var x = 0; x < diffs.length; x++) {
    var op = diffs[x][0];    // Operation (insert, delete, equal)
    var data = diffs[x][1];  // Text of change.
    var text = data.replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/\n/g, '&para;<BR>');
    switch (op) {
      case DIFF_INSERT:
        html[x] = '<INS STYLE="background:#E6FFE6;" TITLE="i=' + i + '">' +
                text + '</INS>';
        break;
      case DIFF_DELETE:
        html[x] = '<DEL STYLE="background:#FFE6E6;" TITLE="i=' + i + '">' +
                text + '</DEL>';
        break;
      case DIFF_EQUAL:
        html[x] = '<SPAN TITLE="i=' + i + '">' + text + '</SPAN>';
        break;
    }
    if (op !== DIFF_DELETE) {
      i += data.length;
    }
  }
  return html.join('');
};


/**
 * Compute and return the source text (all equalities and deletions).
 * @param {Array.<Array.<*>>} diffs Array of diff tuples.
 * @return {string} Source text.
 */
diff_match_patch.prototype.diff_text1 = function(diffs) {
  var text = [];
  for (var x = 0; x < diffs.length; x++) {
    if (diffs[x][0] !== DIFF_INSERT) {
      text[x] = diffs[x][1];
    }
  }
  return text.join('');
};


/**
 * Compute and return the destination text (all equalities and insertions).
 * @param {Array.<Array.<*>>} diffs Array of diff tuples.
 * @return {string} Destination text.
 */
diff_match_patch.prototype.diff_text2 = function(diffs) {
  var text = [];
  for (var x = 0; x < diffs.length; x++) {
    if (diffs[x][0] !== DIFF_DELETE) {
      text[x] = diffs[x][1];
    }
  }
  return text.join('');
};


/**
 * Compute the Levenshtein distance; the number of inserted, deleted or
 * substituted characters.
 * @param {Array.<Array.<*>>} diffs Array of diff tuples.
 * @return {number} Number of changes.
 */
diff_match_patch.prototype.diff_levenshtein = function(diffs) {
  var levenshtein = 0;
  var insertions = 0;
  var deletions = 0;
  for (var x = 0; x < diffs.length; x++) {
    var op = diffs[x][0];
    var data = diffs[x][1];
    switch (op) {
      case DIFF_INSERT:
        insertions += data.length;
        break;
      case DIFF_DELETE:
        deletions += data.length;
        break;
      case DIFF_EQUAL:
        // A deletion and an insertion is one substitution.
        levenshtein += Math.max(insertions, deletions);
        insertions = 0;
        deletions = 0;
        break;
    }
  }
  levenshtein += Math.max(insertions, deletions);
  return levenshtein;
};


/**
 * Crush the diff into an encoded string which describes the operations
 * required to transform text1 into text2.
 * E.g. =3\t-2\t+ing  -> Keep 3 chars, delete 2 chars, insert 'ing'.
 * Operations are tab-separated.  Inserted text is escaped using %xx notation.
 * @param {Array.<Array.<*>>} diffs Array of diff tuples.
 * @return {string} Delta text.
 */
diff_match_patch.prototype.diff_toDelta = function(diffs) {
  var text = [];
  for (var x = 0; x < diffs.length; x++) {
    switch (diffs[x][0]) {
      case DIFF_INSERT:
        text[x] = '+' + encodeURI(diffs[x][1]);
        break;
      case DIFF_DELETE:
        text[x] = '-' + diffs[x][1].length;
        break;
      case DIFF_EQUAL:
        text[x] = '=' + diffs[x][1].length;
        break;
    }
  }
  // Opera doesn't know how to encode char 0.
  return text.join('\t').replace(/\x00/g, '%00').replace(/%20/g, ' ');
};


/**
 * Given the original text1, and an encoded string which describes the
 * operations required to transform text1 into text2, compute the full diff.
 * @param {string} text1 Source string for the diff.
 * @param {string} delta Delta text.
 * @return {Array.<Array.<*>>} Array of diff tuples.
 * @throws {Error} If invalid input.
 */
diff_match_patch.prototype.diff_fromDelta = function(text1, delta) {
  var diffs = [];
  var diffsLength = 0;  // Keeping our own length var is faster in JS.
  var pointer = 0;  // Cursor in text1
  // Opera doesn't know how to decode char 0.
  delta = delta.replace(/%00/g, '\0');
  var tokens = delta.split(/\t/g);
  for (var x = 0; x < tokens.length; x++) {
    // Each token begins with a one character parameter which specifies the
    // operation of this token (delete, insert, equality).
    var param = tokens[x].substring(1);
    switch (tokens[x].charAt(0)) {
      case '+':
        try {
          diffs[diffsLength++] = [DIFF_INSERT, decodeURI(param)];
        } catch (ex) {
          // Malformed URI sequence.
          throw new Error('Illegal escape in diff_fromDelta: ' + param);
        }
        break;
      case '-':
        // Fall through.
      case '=':
        var n = parseInt(param, 10);
        if (isNaN(n) || n < 0) {
          throw new Error('Invalid number in diff_fromDelta: ' + param);
        }
        var text = text1.substring(pointer, pointer += n);
        if (tokens[x].charAt(0) == '=') {
          diffs[diffsLength++] = [DIFF_EQUAL, text];
        } else {
          diffs[diffsLength++] = [DIFF_DELETE, text];
        }
        break;
      default:
        // Blank tokens are ok (from a trailing \t).
        // Anything else is an error.
        if (tokens[x]) {
          throw new Error('Invalid diff operation in diff_fromDelta: ' +
                          tokens[x]);
        }
    }
  }
  if (pointer != text1.length) {
    throw new Error('Delta length (' + pointer +
        ') does not equal source text length (' + text1.length + ').');
  }
  return diffs;
};


//  MATCH FUNCTIONS


/**
 * Locate the best instance of 'pattern' in 'text' near 'loc'.
 * @param {string} text The text to search.
 * @param {string} pattern The pattern to search for.
 * @param {number} loc The location to search around.
 * @return {number} Best match index or -1.
 */
diff_match_patch.prototype.match_main = function(text, pattern, loc) {
  loc = Math.max(0, Math.min(loc, text.length));
  if (text == pattern) {
    // Shortcut (potentially not guaranteed by the algorithm)
    return 0;
  } else if (!text.length) {
    // Nothing to match.
    return -1;
  } else if (text.substring(loc, loc + pattern.length) == pattern) {
    // Perfect match at the perfect spot!  (Includes case of null pattern)
    return loc;
  } else {
    // Do a fuzzy compare.
    return this.match_bitap(text, pattern, loc);
  }
};


/**
 * Locate the best instance of 'pattern' in 'text' near 'loc' using the
 * Bitap algorithm.
 * @param {string} text The text to search.
 * @param {string} pattern The pattern to search for.
 * @param {number} loc The location to search around.
 * @return {number} Best match index or -1.
 * @private
 */
diff_match_patch.prototype.match_bitap = function(text, pattern, loc) {
  if (pattern.length > this.Match_MaxBits) {
    throw new Error('Pattern too long for this browser.');
  }

  // Initialise the alphabet.
  var s = this.match_alphabet(pattern);

  var dmp = this;  // 'this' becomes 'window' in a closure.

  /**
   * Compute and return the score for a match with e errors and x location.
   * Accesses loc and pattern through being a closure.
   * @param {number} e Number of errors in match.
   * @param {number} x Location of match.
   * @return {number} Overall score for match (0.0 = good, 1.0 = bad).
   * @private
   */
  function match_bitapScore(e, x) {
    var accuracy = e / pattern.length;
    var proximity = Math.abs(loc - x);
    if (!dmp.Match_Distance) {
      // Dodge divide by zero error.
      return proximity ? 1.0 : accuracy;
    }
    return accuracy + (proximity / dmp.Match_Distance);
  }

  // Highest score beyond which we give up.
  var score_threshold = this.Match_Threshold;
  // Is there a nearby exact match? (speedup)
  var best_loc = text.indexOf(pattern, loc);
  if (best_loc != -1) {
    score_threshold = Math.min(match_bitapScore(0, best_loc), score_threshold);
  }
  // What about in the other direction? (speedup)
  best_loc = text.lastIndexOf(pattern, loc + pattern.length);
  if (best_loc != -1) {
    score_threshold = Math.min(match_bitapScore(0, best_loc), score_threshold);
  }

  // Initialise the bit arrays.
  var matchmask = 1 << (pattern.length - 1);
  best_loc = -1;

  var bin_min, bin_mid;
  var bin_max = pattern.length + text.length;
  var last_rd;
  for (var d = 0; d < pattern.length; d++) {
    // Scan for the best match; each iteration allows for one more error.
    // Run a binary search to determine how far from 'loc' we can stray at this
    // error level.
    bin_min = 0;
    bin_mid = bin_max;
    while (bin_min < bin_mid) {
      if (match_bitapScore(d, loc + bin_mid) <= score_threshold) {
        bin_min = bin_mid;
      } else {
        bin_max = bin_mid;
      }
      bin_mid = Math.floor((bin_max - bin_min) / 2 + bin_min);
    }
    // Use the result from this iteration as the maximum for the next.
    bin_max = bin_mid;
    var start = Math.max(1, loc - bin_mid + 1);
    var finish = Math.min(loc + bin_mid, text.length) + pattern.length;

    var rd = Array(finish + 2);
    rd[finish + 1] = (1 << d) - 1;
    for (var j = finish; j >= start; j--) {
      // The alphabet (s) is a sparse hash, so the following line generates
      // warnings.
      var charMatch = s[text.charAt(j - 1)];
      if (d === 0) {  // First pass: exact match.
        rd[j] = ((rd[j + 1] << 1) | 1) & charMatch;
      } else {  // Subsequent passes: fuzzy match.
        rd[j] = ((rd[j + 1] << 1) | 1) & charMatch |
                (((last_rd[j + 1] | last_rd[j]) << 1) | 1) |
                last_rd[j + 1];
      }
      if (rd[j] & matchmask) {
        var score = match_bitapScore(d, j - 1);
        // This match will almost certainly be better than any existing match.
        // But check anyway.
        if (score <= score_threshold) {
          // Told you so.
          score_threshold = score;
          best_loc = j - 1;
          if (best_loc > loc) {
            // When passing loc, don't exceed our current distance from loc.
            start = Math.max(1, 2 * loc - best_loc);
          } else {
            // Already passed loc, downhill from here on in.
            break;
          }
        }
      }
    }
    // No hope for a (better) match at greater error levels.
    if (match_bitapScore(d + 1, loc) > score_threshold) {
      break;
    }
    last_rd = rd;
  }
  return best_loc;
};


/**
 * Initialise the alphabet for the Bitap algorithm.
 * @param {string} pattern The text to encode.
 * @return {Object} Hash of character locations.
 * @private
 */
diff_match_patch.prototype.match_alphabet = function(pattern) {
  var s = {};
  for (var i = 0; i < pattern.length; i++) {
    s[pattern.charAt(i)] = 0;
  }
  for (var i = 0; i < pattern.length; i++) {
    s[pattern.charAt(i)] |= 1 << (pattern.length - i - 1);
  }
  return s;
};


//  PATCH FUNCTIONS


/**
 * Increase the context until it is unique,
 * but don't let the pattern expand beyond Match_MaxBits.
 * @param {patch_obj} patch The patch to grow.
 * @param {string} text Source text.
 * @private
 */
diff_match_patch.prototype.patch_addContext = function(patch, text) {
  var pattern = text.substring(patch.start2, patch.start2 + patch.length1);
  var padding = 0;
  while (text.indexOf(pattern) != text.lastIndexOf(pattern) &&
         pattern.length < this.Match_MaxBits - this.Patch_Margin -
         this.Patch_Margin) {
    padding += this.Patch_Margin;
    pattern = text.substring(patch.start2 - padding,
                             patch.start2 + patch.length1 + padding);
  }
  // Add one chunk for good luck.
  padding += this.Patch_Margin;
  // Add the prefix.
  var prefix = text.substring(patch.start2 - padding, patch.start2);
  if (prefix) {
    patch.diffs.unshift([DIFF_EQUAL, prefix]);
  }
  // Add the suffix.
  var suffix = text.substring(patch.start2 + patch.length1,
                              patch.start2 + patch.length1 + padding);
  if (suffix) {
    patch.diffs.push([DIFF_EQUAL, suffix]);
  }

  // Roll back the start points.
  patch.start1 -= prefix.length;
  patch.start2 -= prefix.length;
  // Extend the lengths.
  patch.length1 += prefix.length + suffix.length;
  patch.length2 += prefix.length + suffix.length;
};


/**
 * Compute a list of patches to turn text1 into text2.
 * Use diffs if provided, otherwise compute it ourselves.
 * There are four ways to call this function, depending on what data is
 * available to the caller:
 * Method 1:
 * a = text1, b = text2
 * Method 2:
 * a = diffs
 * Method 3 (optimal):
 * a = text1, b = diffs
 * Method 4 (deprecated, use method 3):
 * a = text1, b = text2, c = diffs
 *
 * @param {string|Array.<Array.<*>>} a text1 (methods 1,3,4) or Array of diff
 * tuples for text1 to text2 (method 2).
 * @param {string|Array.<Array.<*>>} opt_b text2 (methods 1,4) or Array of diff
 * tuples for text1 to text2 (method 3) or undefined (method 2).
 * @param {string|Array.<Array.<*>>} opt_c Array of diff tuples for text1 to
 * text2 (method 4) or undefined (methods 1,2,3).
 * @return {Array.<Array.<*>>} Array of patch objects.
 */
diff_match_patch.prototype.patch_make = function(a, opt_b, opt_c) {
  var text1, diffs;
  if (typeof a == 'string' && typeof opt_b == 'string' &&
      typeof opt_c == 'undefined') {
    // Method 1: text1, text2
    // Compute diffs from text1 and text2.
    text1 = a;
    diffs = this.diff_main(text1, opt_b, true);
    if (diffs.length > 2) {
      this.diff_cleanupSemantic(diffs);
      this.diff_cleanupEfficiency(diffs);
    }
  } else if (typeof a == 'object' && typeof opt_b == 'undefined' &&
      typeof opt_c == 'undefined') {
    // Method 2: diffs
    // Compute text1 from diffs.
    diffs = a;
    text1 = this.diff_text1(diffs);
  } else if (typeof a == 'string' && typeof opt_b == 'object' &&
      typeof opt_c == 'undefined') {
    // Method 3: text1, diffs
    text1 = a;
    diffs = opt_b;
  } else if (typeof a == 'string' && typeof opt_b == 'string' &&
      typeof opt_c == 'object') {
    // Method 4: text1, text2, diffs
    // text2 is not used.
    text1 = a;
    diffs = opt_c;
  } else {
    throw new Error('Unknown call format to patch_make.');
  }

  if (diffs.length === 0) {
    return [];  // Get rid of the null case.
  }
  var patches = [];
  var patch = new patch_obj();
  var patchDiffLength = 0;  // Keeping our own length var is faster in JS.
  var char_count1 = 0;  // Number of characters into the text1 string.
  var char_count2 = 0;  // Number of characters into the text2 string.
  // Start with text1 (prepatch_text) and apply the diffs until we arrive at
  // text2 (postpatch_text).  We recreate the patches one by one to determine
  // context info.
  var prepatch_text = text1;
  var postpatch_text = text1;
  for (var x = 0; x < diffs.length; x++) {
    var diff_type = diffs[x][0];
    var diff_text = diffs[x][1];

    if (!patchDiffLength && diff_type !== DIFF_EQUAL) {
      // A new patch starts here.
      patch.start1 = char_count1;
      patch.start2 = char_count2;
    }

    switch (diff_type) {
      case DIFF_INSERT:
        patch.diffs[patchDiffLength++] = diffs[x];
        patch.length2 += diff_text.length;
        postpatch_text = postpatch_text.substring(0, char_count2) + diff_text +
                         postpatch_text.substring(char_count2);
        break;
      case DIFF_DELETE:
        patch.length1 += diff_text.length;
        patch.diffs[patchDiffLength++] = diffs[x];
        postpatch_text = postpatch_text.substring(0, char_count2) +
                         postpatch_text.substring(char_count2 + diff_text.length);
        break;
      case DIFF_EQUAL:
        if (diff_text.length <= 2 * this.Patch_Margin &&
            patchDiffLength && diffs.length != x + 1) {
          // Small equality inside a patch.
          patch.diffs[patchDiffLength++] = diffs[x];
          patch.length1 += diff_text.length;
          patch.length2 += diff_text.length;
        } else if (diff_text.length >= 2 * this.Patch_Margin) {
          // Time for a new patch.
          if (patchDiffLength) {
            this.patch_addContext(patch, prepatch_text);
            patches.push(patch);
            patch = new patch_obj();
            patchDiffLength = 0;
            // Unlike Unidiff, our patch lists have a rolling context.
            // http://code.google.com/p/google-diff-match-patch/wiki/Unidiff
            // Update prepatch text & pos to reflect the application of the
            // just completed patch.
            prepatch_text = postpatch_text;
            char_count1 = char_count2;
          }
        }
        break;
    }

    // Update the current character count.
    if (diff_type !== DIFF_INSERT) {
      char_count1 += diff_text.length;
    }
    if (diff_type !== DIFF_DELETE) {
      char_count2 += diff_text.length;
    }
  }
  // Pick up the leftover patch if not empty.
  if (patchDiffLength) {
    this.patch_addContext(patch, prepatch_text);
    patches.push(patch);
  }

  return patches;
};


/**
 * Given an array of patches, return another array that is identical.
 * @param {Array.<patch_obj>} patches Array of patch objects.
 * @return {Array.<patch_obj>} Array of patch objects.
 */
diff_match_patch.prototype.patch_deepCopy = function(patches) {
  // Making deep copies is hard in JavaScript.
  var patchesCopy = [];
  for (var x = 0; x < patches.length; x++) {
    var patch = patches[x];
    var patchCopy = new patch_obj();
    patchCopy.diffs = [];
    for (var y = 0; y < patch.diffs.length; y++) {
      patchCopy.diffs[y] = patch.diffs[y].slice();
    }
    patchCopy.start1 = patch.start1;
    patchCopy.start2 = patch.start2;
    patchCopy.length1 = patch.length1;
    patchCopy.length2 = patch.length2;
    patchesCopy[x] = patchCopy;
  }
  return patchesCopy;
};


/**
 * Merge a set of patches onto the text.  Return a patched text, as well
 * as a list of true/false values indicating which patches were applied.
 * @param {Array.<patch_obj>} patches Array of patch objects.
 * @param {string} text Old text.
 * @return {Array.<string|Array.<boolean>>} Two element Array, containing the
 *      new text and an array of boolean values.
 */
diff_match_patch.prototype.patch_apply = function(patches, text) {
  if (patches.length == 0) {
    return [text, []];
  }

  // Deep copy the patches so that no changes are made to originals.
  patches = this.patch_deepCopy(patches);

  var nullPadding = this.patch_addPadding(patches);
  text = nullPadding + text + nullPadding;

  this.patch_splitMax(patches);
  // delta keeps track of the offset between the expected and actual location
  // of the previous patch.  If there are patches expected at positions 10 and
  // 20, but the first patch was found at 12, delta is 2 and the second patch
  // has an effective expected position of 22.
  var delta = 0;
  var results = [];
  for (var x = 0; x < patches.length; x++) {
    var expected_loc = patches[x].start2 + delta;
    var text1 = this.diff_text1(patches[x].diffs);
    var start_loc;
    var end_loc = -1;
    if (text1.length > this.Match_MaxBits) {
      // patch_splitMax will only provide an oversized pattern in the case of
      // a monster delete.
      start_loc = this.match_main(text, text1.substring(0, this.Match_MaxBits),
                                  expected_loc);
      if (start_loc != -1) {
        end_loc = this.match_main(text, text1.substring(text1.length - this.Match_MaxBits),
                                  expected_loc + text1.length - this.Match_MaxBits);
        if (end_loc == -1 || start_loc >= end_loc) {
          // Can't find valid trailing context.  Drop this patch.
          start_loc = -1;
        }
      }
    } else {
      start_loc = this.match_main(text, text1, expected_loc);
    }
    if (start_loc == -1) {
      // No match found.  :(
      results[x] = false;
    } else {
      // Found a match.  :)
      results[x] = true;
      delta = start_loc - expected_loc;
      var text2;
      if (end_loc == -1) {
        text2 = text.substring(start_loc, start_loc + text1.length);
      } else {
        text2 = text.substring(start_loc, end_loc + this.Match_MaxBits);
      }
      if (text1 == text2) {
        // Perfect match, just shove the replacement text in.
        text = text.substring(0, start_loc) +
               this.diff_text2(patches[x].diffs) +
               text.substring(start_loc + text1.length);
      } else {
        // Imperfect match.  Run a diff to get a framework of equivalent
        // indices.
        var diffs = this.diff_main(text1, text2, false);
        if (text1.length > this.Match_MaxBits &&
            this.diff_levenshtein(diffs) / text1.length >
            this.Patch_DeleteThreshold) {
          // The end points match, but the content is unacceptably bad.
          results[x] = false;
        } else {
          this.diff_cleanupSemanticLossless(diffs);
          var index1 = 0;
          var index2;
          for (var y = 0; y < patches[x].diffs.length; y++) {
            var mod = patches[x].diffs[y];
            if (mod[0] !== DIFF_EQUAL) {
              index2 = this.diff_xIndex(diffs, index1);
            }
            if (mod[0] === DIFF_INSERT) {  // Insertion
              text = text.substring(0, start_loc + index2) + mod[1] +
                     text.substring(start_loc + index2);
            } else if (mod[0] === DIFF_DELETE) {  // Deletion
              text = text.substring(0, start_loc + index2) +
                     text.substring(start_loc + this.diff_xIndex(diffs,
                         index1 + mod[1].length));
            }
            if (mod[0] !== DIFF_DELETE) {
              index1 += mod[1].length;
            }
          }
        }
      }
    }
  }
  // Strip the padding off.
  text = text.substring(nullPadding.length, text.length - nullPadding.length);
  return [text, results];
};


/**
 * Add some padding on text start and end so that edges can match something.
 * Intended to be called only from within patch_apply.
 * @param {Array.<patch_obj>} patches Array of patch objects.
 * @return {string} The padding string added to each side.
 */
diff_match_patch.prototype.patch_addPadding = function(patches) {
  var nullPadding = '';
  for (var x = 1; x <= this.Patch_Margin; x++) {
    nullPadding += String.fromCharCode(x);
  }

  // Bump all the patches forward.
  for (var x = 0; x < patches.length; x++) {
    patches[x].start1 += nullPadding.length;
    patches[x].start2 += nullPadding.length;
  }

  // Add some padding on start of first diff.
  var patch = patches[0];
  var diffs = patch.diffs;
  if (diffs.length == 0 || diffs[0][0] != DIFF_EQUAL) {
    // Add nullPadding equality.
    diffs.unshift([DIFF_EQUAL, nullPadding]);
    patch.start1 -= nullPadding.length;  // Should be 0.
    patch.start2 -= nullPadding.length;  // Should be 0.
    patch.length1 += nullPadding.length;
    patch.length2 += nullPadding.length;
  } else if (nullPadding.length > diffs[0][1].length) {
    // Grow first equality.
    var extraLength = nullPadding.length - diffs[0][1].length;
    diffs[0][1] = nullPadding.substring(diffs[0][1].length) + diffs[0][1];
    patch.start1 -= extraLength;
    patch.start2 -= extraLength;
    patch.length1 += extraLength;
    patch.length2 += extraLength;
  }

  // Add some padding on end of last diff.
  patch = patches[patches.length - 1];
  diffs = patch.diffs;
  if (diffs.length == 0 || diffs[diffs.length - 1][0] != DIFF_EQUAL) {
    // Add nullPadding equality.
    diffs.push([DIFF_EQUAL, nullPadding]);
    patch.length1 += nullPadding.length;
    patch.length2 += nullPadding.length;
  } else if (nullPadding.length > diffs[diffs.length - 1][1].length) {
    // Grow last equality.
    var extraLength = nullPadding.length - diffs[diffs.length - 1][1].length;
    diffs[diffs.length - 1][1] += nullPadding.substring(0, extraLength);
    patch.length1 += extraLength;
    patch.length2 += extraLength;
  }

  return nullPadding;
};


/**
 * Look through the patches and break up any which are longer than the maximum
 * limit of the match algorithm.
 * @param {Array.<patch_obj>} patches Array of patch objects.
 */
diff_match_patch.prototype.patch_splitMax = function(patches) {
  for (var x = 0; x < patches.length; x++) {
    if (patches[x].length1 > this.Match_MaxBits) {
      var bigpatch = patches[x];
      // Remove the big old patch.
      patches.splice(x--, 1);
      var patch_size = this.Match_MaxBits;
      var start1 = bigpatch.start1;
      var start2 = bigpatch.start2;
      var precontext = '';
      while (bigpatch.diffs.length !== 0) {
        // Create one of several smaller patches.
        var patch = new patch_obj();
        var empty = true;
        patch.start1 = start1 - precontext.length;
        patch.start2 = start2 - precontext.length;
        if (precontext !== '') {
          patch.length1 = patch.length2 = precontext.length;
          patch.diffs.push([DIFF_EQUAL, precontext]);
        }
        while (bigpatch.diffs.length !== 0 &&
               patch.length1 < patch_size - this.Patch_Margin) {
          var diff_type = bigpatch.diffs[0][0];
          var diff_text = bigpatch.diffs[0][1];
          if (diff_type === DIFF_INSERT) {
            // Insertions are harmless.
            patch.length2 += diff_text.length;
            start2 += diff_text.length;
            patch.diffs.push(bigpatch.diffs.shift());
            empty = false;
          } else if (diff_type === DIFF_DELETE && patch.diffs.length == 1 &&
                     patch.diffs[0][0] == DIFF_EQUAL &&
                     diff_text.length > 2 * patch_size) {
            // This is a large deletion.  Let it pass in one chunk.
            patch.length1 += diff_text.length;
            start1 += diff_text.length;
            empty = false;
            patch.diffs.push([diff_type, diff_text]);
            bigpatch.diffs.shift();
          } else {
            // Deletion or equality.  Only take as much as we can stomach.
            diff_text = diff_text.substring(0, patch_size - patch.length1 -
                                               this.Patch_Margin);
            patch.length1 += diff_text.length;
            start1 += diff_text.length;
            if (diff_type === DIFF_EQUAL) {
              patch.length2 += diff_text.length;
              start2 += diff_text.length;
            } else {
              empty = false;
            }
            patch.diffs.push([diff_type, diff_text]);
            if (diff_text == bigpatch.diffs[0][1]) {
              bigpatch.diffs.shift();
            } else {
              bigpatch.diffs[0][1] =
                  bigpatch.diffs[0][1].substring(diff_text.length);
            }
          }
        }
        // Compute the head context for the next patch.
        precontext = this.diff_text2(patch.diffs);
        precontext =
            precontext.substring(precontext.length - this.Patch_Margin);
        // Append the end context for this patch.
        var postcontext = this.diff_text1(bigpatch.diffs)
                              .substring(0, this.Patch_Margin);
        if (postcontext !== '') {
          patch.length1 += postcontext.length;
          patch.length2 += postcontext.length;
          if (patch.diffs.length !== 0 &&
              patch.diffs[patch.diffs.length - 1][0] === DIFF_EQUAL) {
            patch.diffs[patch.diffs.length - 1][1] += postcontext;
          } else {
            patch.diffs.push([DIFF_EQUAL, postcontext]);
          }
        }
        if (!empty) {
          patches.splice(++x, 0, patch);
        }
      }
    }
  }
};


/**
 * Take a list of patches and return a textual representation.
 * @param {Array.<patch_obj>} patches Array of patch objects.
 * @return {string} Text representation of patches.
 */
diff_match_patch.prototype.patch_toText = function(patches) {
  var text = [];
  for (var x = 0; x < patches.length; x++) {
    text[x] = patches[x];
  }
  return text.join('');
};


/**
 * Parse a textual representation of patches and return a list of patch objects.
 * @param {string} textline Text representation of patches.
 * @return {Array.<patch_obj>} Array of patch objects.
 * @throws {Error} If invalid input.
 */
diff_match_patch.prototype.patch_fromText = function(textline) {
  var patches = [];
  if (!textline) {
    return patches;
  }
  // Opera doesn't know how to decode char 0.
  textline = textline.replace(/%00/g, '\0');
  var text = textline.split('\n');
  var textPointer = 0;
  while (textPointer < text.length) {
    var m = text[textPointer].match(/^@@ -(\d+),?(\d*) \+(\d+),?(\d*) @@$/);
    if (!m) {
      throw new Error('Invalid patch string: ' + text[textPointer]);
    }
    var patch = new patch_obj();
    patches.push(patch);
    patch.start1 = parseInt(m[1], 10);
    if (m[2] === '') {
      patch.start1--;
      patch.length1 = 1;
    } else if (m[2] == '0') {
      patch.length1 = 0;
    } else {
      patch.start1--;
      patch.length1 = parseInt(m[2], 10);
    }

    patch.start2 = parseInt(m[3], 10);
    if (m[4] === '') {
      patch.start2--;
      patch.length2 = 1;
    } else if (m[4] == '0') {
      patch.length2 = 0;
    } else {
      patch.start2--;
      patch.length2 = parseInt(m[4], 10);
    }
    textPointer++;

    while (textPointer < text.length) {
      var sign = text[textPointer].charAt(0);
      try {
        var line = decodeURI(text[textPointer].substring(1));
      } catch (ex) {
        // Malformed URI sequence.
        throw new Error('Illegal escape in patch_fromText: ' + line);
      }
      if (sign == '-') {
        // Deletion.
        patch.diffs.push([DIFF_DELETE, line]);
      } else if (sign == '+') {
        // Insertion.
        patch.diffs.push([DIFF_INSERT, line]);
      } else if (sign == ' ') {
        // Minor equality.
        patch.diffs.push([DIFF_EQUAL, line]);
      } else if (sign == '@') {
        // Start of next patch.
        break;
      } else if (sign === '') {
        // Blank line?  Whatever.
      } else {
        // WTF?
        throw new Error('Invalid patch mode "' + sign + '" in: ' + line);
      }
      textPointer++;
    }
  }
  return patches;
};


/**
 * Class representing one patch operation.
 * @constructor
 */
function patch_obj() {
  this.diffs = [];
  /** @type {number?} */
  this.start1 = null;
  /** @type {number?} */
  this.start2 = null;
  this.length1 = 0;
  this.length2 = 0;
}


/**
 * Emmulate GNU diff's format.
 * Header: @@ -382,8 +481,9 @@
 * Indicies are printed as 1-based, not 0-based.
 * @return {string} The GNU diff string.
 */
patch_obj.prototype.toString = function() {
  var coords1, coords2;
  if (this.length1 === 0) {
    coords1 = this.start1 + ',0';
  } else if (this.length1 == 1) {
    coords1 = this.start1 + 1;
  } else {
    coords1 = (this.start1 + 1) + ',' + this.length1;
  }
  if (this.length2 === 0) {
    coords2 = this.start2 + ',0';
  } else if (this.length2 == 1) {
    coords2 = this.start2 + 1;
  } else {
    coords2 = (this.start2 + 1) + ',' + this.length2;
  }
  var text = ['@@ -' + coords1 + ' +' + coords2 + ' @@\n'];
  var op;
  // Escape the body of the patch with %xx notation.
  for (var x = 0; x < this.diffs.length; x++) {
    switch (this.diffs[x][0]) {
      case DIFF_INSERT:
        op = '+';
        break;
      case DIFF_DELETE:
        op = '-';
        break;
      case DIFF_EQUAL:
        op = ' ';
        break;
    }
    text[x + 1] = op + encodeURI(this.diffs[x][1]) + '\n';
  }
  // Opera doesn't know how to encode char 0.
  return text.join('').replace(/\x00/g, '%00').replace(/%20/g, ' ');
};

// Mozilla: Common JS module loading
exports.diff_match_patch = diff_match_patch;
exports.DIFF_DELETE = DIFF_DELETE;
exports.DIFF_INSERT = DIFF_INSERT;
exports.DIFF_EQUAL = DIFF_EQUAL;


});
;bespin.tiki.register("::js_completion", {
    name: "js_completion",
    dependencies: { "completion": "0.0.0", "underscore": "0.0.0" }
});
bespin.tiki.module("js_completion:index",function(require,exports,module) {
/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Bespin.
 *
 * The Initial Developer of the Original Code is
 * Mozilla.
 * Portions created by the Initial Developer are Copyright (C) 2009
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Bespin Team (bespin@mozilla.com)
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

"define metadata";
({
    "description": "JavaScript code completion",
    "dependencies": { "completion": "0.0.0", "underscore": "0.0.0" },
    "provides": [
        {
            "ep": "completion",
            "name": "js",
            "pointer": "#JSCompletion"
        }
    ]
});
"end";

var _ = require('underscore')._;

function JSCompletion(tags) {
    this.tags = tags;
}

JSCompletion.prototype = {
    tags: null,

    getCompletions: function(prefix, suffix, syntaxManager) {
        if (/^[A-Za-z0-9_\$]/.test(suffix)) {
            return null;
        }

        var m = /[A-Za-z0-9_.\$]+$/.exec(prefix);
        if (m == null) {
            return null;
        }

        var chain = m[0].split(".");
        if (chain.length < 2) {
            return null;
        }

        var ident = chain.pop();
        if (_(chain).any(function(s) { return s === ""; })) {
            return null;
        }

        var module = null;
        var sym = syntaxManager.getSymbol(chain[0]);
        if (sym != null) {
            chain.shift();
            module = sym;
        }

        var namespace = chain.join(".");

        var tags = [];
        _(this.tags.stem(ident)).each(function(tag) {
            if ((module != null && module !== tag.module) ||
                    (namespace === "" && tag.namespace != null) ||
                    (namespace !== "" && namespace !== tag.namespace)) {
                return;
            }

            tags.push(tag);

            if (tags.length >= 10) {
                _.breakLoop();
            }
        });

        return (tags.length > 0) ? { tags: tags, stem: ident } : null;
    }
};

exports.JSCompletion = JSCompletion;


});
;bespin.tiki.register("::edit_session", {
    name: "edit_session",
    dependencies: { "events": "0.0.0" }
});
bespin.tiki.module("edit_session:index",function(require,exports,module) {
/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Bespin.
 *
 * The Initial Developer of the Original Code is
 * Mozilla.
 * Portions created by the Initial Developer are Copyright (C) 2009
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Bespin Team (bespin@mozilla.com)
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

var Promise = require('bespin:promise').Promise;
var catalog = require('bespin:plugins').catalog;
var util = require('bespin:util/util');

var Event = require("events").Event;

exports.EditSession = function() { };

exports.EditSession.prototype = {
    /**
     * @property{TextView}
     *
     * The 'current' view is the editor component that most recently had
     * the focus.
     */
    _currentView: null,


    /**
     * @type{string}
     * The name of the user, or null if no user is logged in.
     */
    currentUser: null,

    /**
     * The history object to store file history in.
     */
    history: null,

    /**
     * figures out the full path, taking into account the current file
     * being edited.
     */
    getCompletePath: function(path) {
        if (path == null) {
            path = '';
        }

        if (path == null || path.substring(0, 1) != '/') {
            var buffer;
            if (this._currentView && this._currentView.buffer) {
                buffer = this._currentView.buffer;
            }
            var file;
            if (buffer) {
                file = buffer.file;
            }
            if (!file) {
                path = '/' + path;
            } else {
                path = file.parentdir() + path;
            }
        }

        return path;
    }
};

Object.defineProperties(exports.EditSession.prototype, {
    currentView: {
        set: function(newView) {
            var oldView = this._currentView;
            if (newView !== oldView) {
                this._currentView = newView;
            }
        },
        
        get: function() {
            return this._currentView;
        }
    }
});

/*
 * set up a session based on a view. This seems a bit convoluted and is
 * likely to change.
 */
exports.createSession = function(view, user) {
    var session = new exports.EditSession();
    if (view) {
        session.currentView = view.textView;
    }
    if (user) {
        session.currentUser = user;
    }
    return session;
};

});
;bespin.tiki.register("::syntax_manager", {
    name: "syntax_manager",
    dependencies: { "worker_manager": "0.0.0", "syntax_directory": "0.0.0", "events": "0.0.0", "underscore": "0.0.0", "settings": "0.0.0" }
});
bespin.tiki.module("syntax_manager:index",function(require,exports,module) {
/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Bespin.
 *
 * The Initial Developer of the Original Code is
 * Mozilla.
 * Portions created by the Initial Developer are Copyright (C) 2009
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Bespin Team (bespin@mozilla.com)
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

var _ = require('underscore')._;
var Event = require('events').Event;
var WorkerSupervisor = require('worker_manager').WorkerSupervisor;
var console = require('bespin:console').console;
var rangeutils = require('rangeutils:utils/range');
var settings = require('settings').settings;
var syntaxDirectory = require('syntax_directory').syntaxDirectory;

// The number of lines to highlight at once.
var GRANULARITY = 100;

// Replaces elements at position i in dest with the elements of src. If i is
// beyond the end of dest, expands dest with copies of fill.
function replace(dest, i, src, fill) {
    while (dest.length < i) {
        dest.push(_(fill).clone());
    }

    var args = [ i, src.length ].concat(src);
    Array.prototype.splice.apply(dest, args);
    return dest;
}

// A simple key-value store in which each key is paired with a corresponding
// line. When the syntax information is updated for a line, the symbols from
// those lines are wiped out and replaced with the new symbols.
function Symbols() {
    this._lines = [];
    this._syms = {};
}

Symbols.prototype = {
    get: function(sym) {
        return this._syms["-" + sym];
    },

    replaceLine: function(row, newSymbols) {
        var lines = this._lines, syms = this._syms;
        if (row < lines.length && _(lines[row]).isArray()) {
            _(lines[row]).each(function(ident) { delete syms["-" + ident]; });
        }

        function stripLeadingDash(s) { return s.substring(1); }
        lines[row] = _(newSymbols).keys().map(stripLeadingDash);

        _(syms).extend(newSymbols);
    }
};

function Context(syntaxInfo, syntaxManager) {
    this._syntaxInfo = syntaxInfo;
    this._syntaxManager = syntaxManager;

    this._invalidRow = 0;
    this._states = [];
    this._active = false;

    this.symbols = new Symbols;
}

Context.prototype = {
    _annotate: function() {
        if (this._invalidRow == null) {
            throw new Error("syntax_manager.Context: attempt to annotate " +
                "without any invalid row");
        }
        if (!this._active) {
            throw new Error("syntax_manager.Context: attempt to annotate " +
                "while inactive");
        }

        if (this._worker == null) {
            this._createWorker();
            return;
        }

        var lines = this._syntaxManager.getTextLines();
        var row = this._invalidRow;
        var state = row === 0 ? this.getName() + ':start' : this._states[row];
        var lastRow = Math.min(lines.length, row + GRANULARITY);
        lines = lines.slice(row, lastRow);

        var runRange = {
            start: { row: row, col: 0 },
            end: { row: lastRow - 1, col: _(lines).last().length }
        };

        var pr = this._worker.send('annotate', [ state, lines, runRange ]);
        pr.then(_(this._annotationFinished).bind(this, row, lastRow));
    },

    _annotationFinished: function(row, lastRow, result) {
        if (!this._active) {
            return;
        }

        var syntaxManager = this._syntaxManager;
        syntaxManager.mergeAttrs(row, result.attrs);
        syntaxManager.mergeSymbols(row, result.symbols);

        replace(this._states, row, result.states);

        if (lastRow >= this._getRowCount()) {
            this._invalidRow = null;    // We're done!
            this._active = false;
            return;
        }

        this._invalidRow = lastRow;
        this._annotate();
    },

    _createWorker: function() {
        var syntaxInfo = this._syntaxInfo;
        if (syntaxInfo == null) {
            return false;
        }

        var worker = new WorkerSupervisor("syntax_worker#syntaxWorker");
        this._worker = worker;

        worker.started.add(this._workerStarted.bind(this));
        worker.start();

        return true;
    },

    _getRowCount: function() {
        return this._syntaxManager.getTextLines().length;
    },

    _workerStarted: function() {
        this._syntaxInfo.settings.forEach(function(name) {
            var value = settings.get(name);
            this._worker.send('setSyntaxSetting', [ name, value ]);
        }, this);

        this._worker.send('loadSyntax', [ this._syntaxInfo.name ]);

        if (this._active) {
            this._annotate();
        }
    },

    // Switches on this syntax context and begins annotation. It is the
    // caller's responsibility to ensure that there exists an invalid row
    // before calling this. (Typically the caller ensures this by calling cut()
    // first.)
    activateAndAnnotate: function() {
        this._active = true;
        this._annotate();
    },

    contextsAtPosition: function(pos) {
        var syntaxInfo = this._syntaxInfo;
        if (syntaxInfo == null) {
            return [ 'plain' ];
        }

        return [ syntaxInfo.name ];             // FIXME
    },

    // Invalidates the syntax context at a row.
    cut: function(row) {
        var endRow = this._getRowCount();
        if (row < 0 || row >= endRow) {
            throw new Error("Attempt to cut the context at an invalid row");
        }

        if (this._invalidRow != null && this._invalidRow < row) {
            return;
        }
        this._invalidRow = row;

        // Mark ourselves as inactive, so that if the web worker was working on
        // a series of rows we know to discard its results.
        this._active = false;
    },

    getName: function() {
        return this._syntaxInfo.name;
    },

    kill: function() {
        var worker = this._worker;
        if (worker == null) {
            return;
        }

        worker.kill();
        this._worker = null;
    }
};

/**
 * The syntax manager coordinates a series of syntax contexts, each run in a
 * separate web worker. It receives text editing notifications, updates and
 * stores the relevant syntax attributes, and provides marked-up text as the
 * layout manager requests it.
 *
 * @constructor
 * @exports SyntaxManager as syntax_manager:SyntaxManager
 */
function SyntaxManager(layoutManager) {
    this.layoutManager = layoutManager;

    /** Called whenever the attributes have been updated. */
    this.attrsChanged = new Event;

    /** Called whenever the syntax (file type) has been changed. */
    this.syntaxChanged = new Event;

    this._context = null;
    this._invalidRows = null;
    this._contextRanges = null;
    this._attrs = [];
    this._symbols = new Symbols;
    this._syntax = 'plain';

    this._reset();
}

SyntaxManager.prototype = {
    /** @lends SyntaxManager */

    _getTextStorage: function() {
        return this.layoutManager.textStorage;
    },

    // Invalidates all the highlighting and recreates the workers.
    _reset: function() {
        var ctx = this._context;
        if (ctx != null) {
            ctx.kill();
            this._context = null;
        }

        var syn = this._syntax;
        var syntaxInfo = syn === 'plain' ? null : syntaxDirectory.get(syn);

        ctx = new Context(syntaxInfo, this);
        this._context = ctx;
        ctx.activateAndAnnotate();
    },

    attrsChanged: null,
    syntaxChanged: null,

    /** Returns the contexts that are active at the position pos. */
    contextsAtPosition: function(pos) {
        return this._context.contextsAtPosition(pos);
    },

    /**
     * Returns the attributes most recently delivered from the syntax engine.
     * Does not instruct the engine to perform any work; use invalidateRow()
     * for that.
     */
    getAttrsForRows: function(startRow, endRow) {
        return this._attrs.slice(startRow, endRow);
    },

    /**
     * Returns the metadata currently associated with the given symbol, or null
     * if the symbol is unknown.
     */
    getSymbol: function(ident) {
        return this._symbols.get(ident);
    },

    /** Returns the current syntax. */
    getSyntax: function() {
        return this._syntax;
    },

    /** A convenience function to return the lines from the text storage. */
    getTextLines: function() {
        return this._getTextStorage().lines;
    },

    /** Marks the text as needing an update starting at the given row. */
    invalidateRow: function(row) {
        var ctx = this._context;
        ctx.cut(row);
        ctx.activateAndAnnotate();
    },

    /**
     * Merges the supplied attributes into the text, overwriting the attributes
     * that were there previously.
     */
    mergeAttrs: function(startRow, newAttrs) {
        replace(this._attrs, startRow, newAttrs, []);
        this.attrsChanged(startRow, startRow + newAttrs.length);
    },

    /**
     * Merges the supplied symbols into the symbol store, overwriting any
     * symbols previously defined on those lines.
     */
    mergeSymbols: function(startRow, newSymbols) {
        var symbols = this._symbols;
        _(newSymbols).each(function(lineSyms, i) {
            symbols.replaceLine(startRow + i, lineSyms);
        });
    },

    /**
     * Sets the syntax and invalidates all the highlighting. If no syntax
     * plugin is available, sets the syntax to "plain".
     */
    setSyntax: function(syntax) {
        this._syntax = syntaxDirectory.hasSyntax(syntax) ? syntax : 'plain';
        this.syntaxChanged(syntax);
        this._reset();
    },

    /** Sets the syntax appropriately for a file extension. */
    setSyntaxFromFileExt: function(fileExt) {
        return this.setSyntax(syntaxDirectory.syntaxForFileExt(fileExt));
    }
};

exports.SyntaxManager = SyntaxManager;


});
;bespin.tiki.register("::completion", {
    name: "completion",
    dependencies: { "jquery": "0.0.0", "ctags": "0.0.0", "rangeutils": "0.0.0", "canon": "0.0.0", "underscore": "0.0.0" }
});
bespin.tiki.module("completion:controller",function(require,exports,module) {
/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Bespin.
 *
 * The Initial Developer of the Original Code is
 * Mozilla.
 * Portions created by the Initial Developer are Copyright (C) 2009
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Bespin Team (bespin@mozilla.com)
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

var ctags = require('ctags');
var range = require('rangeutils:utils/range');
var CompletionUI = require('completion:ui').CompletionUI;
var catalog = require('bespin:plugins').catalog;
var env = require('environment').env;

function CompletionController(editorView) {
    this._editorView = editorView;
    editorView.selectionChanged.add(this._selectionChanged.bind(this));
    editorView.willChangeBuffer.add(this._willChangeBuffer.bind(this));

    // Prebind _syntaxChanged so that we can attach and detach it.
    this._syntaxChanged = this._syntaxChanged.bind(this);

    this.tags = new ctags.Tags();
    this.ui = new CompletionUI(editorView.element);
}

CompletionController.prototype = {
    _buffer: null,
    _completionEngine: null,
    _completions: null,
    _stem: null,

    _hideCompletions: function() {
        this.ui.hide();
    },

    _selectionChanged: function(newRange) {
        var engine = this._completionEngine;
        if (engine == null || !range.isZeroLength(newRange)) {
            return;
        }

        var layoutManager = this._buffer.layoutManager;
        var textStorage = layoutManager.textStorage;
        var syntaxManager = layoutManager.syntaxManager;

        var pos = newRange.start;
        var row = pos.row, col = pos.col;
        var line = textStorage.lines[row];
        var prefix = line.substring(0, col), suffix = line.substring(col);

        var completions = engine.getCompletions(prefix, suffix, syntaxManager);
        if (completions == null) {
            this._hideCompletions();
            return;
        }

        var tags = completions.tags;
        this._stem = completions.stem;
        this._showCompletions(tags);
    },

    _showCompletions: function(completions) {
        var editorView = this._editorView;
        var cursorPt = editorView.textView.getInsertionPointPosition();
        var pt = editorView.convertTextViewPoint(cursorPt);
        var lineHeight = editorView.layoutManager.fontDimension.lineHeight;
        this.ui.show(completions, pt, lineHeight);
    },

    _syntaxChanged: function(newSyntax) {
        var ext = catalog.getExtensionByKey('completion', newSyntax);
        if (ext == null) {
            this._completionEngine = null;
            return;
        }

        ext.load().then(function(engine) {
            this._completionEngine = new engine(this.tags);
        }.bind(this));
    },

    _willChangeBuffer: function(newBuffer) {
        var oldBuffer = this._buffer;
        if (oldBuffer != null) {
            var oldSyntaxManager = oldBuffer.layoutManager.syntaxManager;
            oldSyntaxManager.syntaxChanged.remove(this._syntaxChanged);
        }

        var newSyntaxManager = newBuffer.layoutManager.syntaxManager;
        newSyntaxManager.syntaxChanged.add(this._syntaxChanged);

        this._buffer = newBuffer;
    },

    cancel: function(env) {
        this.ui.hide();
    },

    complete: function(env) {
        var ui = this.ui;
        var tag = ui.getCompletion();
        var ident = tag.name;
        env.view.insertText(ident.substring(this._stem.length));
        ui.hide();
    },

    isCompleting: function() {
        return this.ui.visible;
    },

    moveDown: function(env) {
        this.ui.move('down');
    },

    moveUp: function(env) {
        this.ui.move('up');
    },

    /** The current store of tags. */
    tags: null
};

function makeCommand(name) {
    return function(args, req) {
        return env.editor.completionController[name](env);
    };
}

exports.CompletionController = CompletionController;
exports.completeCommand = makeCommand('complete');
exports.completeCancelCommand = makeCommand('cancel');
exports.completeDownCommand = makeCommand('moveDown');
exports.completeUpCommand = makeCommand('moveUp');


});

bespin.tiki.module("completion:ui",function(require,exports,module) {
/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Bespin.
 *
 * The Initial Developer of the Original Code is
 * Mozilla.
 * Portions created by the Initial Developer are Copyright (C) 2009
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Bespin Team (bespin@mozilla.com)
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

var $ = require('jquery').$;
var _ = require('underscore')._;

var ANIMATION_SPEED = 100;  // in ms

var populate_container_template =
    _.template('<span class="bespin-completion-container"> &mdash; ' +
        '<%= container %></span>');
var populate_second_row_template =
    _.template('<div class="bespin-completion-second-row"><%= type %></div>');
var populate_item_template =
    _.template('<li><div class="bespin-completion-top-row">' +
        '<span class="bespin-completion-kind bespin-completion-kind-' +
            '<%= kind %>"><%= kind %></span>' +
        '<span class="bespin-completion-ident"><%= ident %></span>' +
            '<%= container %></div><%= second_row %></li>');

function CompletionUI(parent) {
    var id = _.uniqueId('bespin-completion-panel');

    var panel = document.createElement("div");
    panel.id = id;
    panel.className = "bespin-completion-panel";
    panel.style.display = 'none';
    panel.innerHTML =
        '<div class="bespin-completion-pointer"></div>' +
        '<div class="bespin-completion-bubble-outer">' +
            '<div class="bespin-completion-bubble-inner">' +
                '<div class="bespin-completion-highlight"></div>' +
                '<ul></ul>' +
            '</div>' +
        '</div>';

    $(parent).append(panel);

    this.panel = $(panel);
    this.parent = $(parent);
}

CompletionUI.prototype = {
    _fromBottom: false,
    _index: 0,
    _tags: null,

    _getHighlightDimensions: function(elem) {
        var pos = elem.position();
        var height = elem.outerHeight() - 2;
        var width = elem.outerWidth() - 2;
        return { left: pos.left, top: pos.top, height: height, width: width };
    },

    _listItemForIndex: function(idx) {
        return this.panel.find("li:eq(" + idx + ")");
    },

    _populate: function() {
        var html = _(this._tags).map(function(tag) {
            var klass = tag['class'], module = tag.module, ns = tag.namespace;

            var container;
            if (klass != null) {
                container = klass;
            } else if (ns != null) {
                container = ns;
            } else {
                container = "";
            }

            if (module != null) {
                container = module + (container != "" ? "#" + container : "");
            }

            var container_html = (container == "") ? "" :
                populate_container_template({ container: container });

            var type = tag.type;
            var second_row_html = (type == null) ? "" :
                populate_second_row_template({ type: type });

            return populate_item_template({
                kind:       tag.kind,
                ident:      tag.name,
                container:  container_html,
                second_row: second_row_html
            });
        });

        this.panel.find("ul").html(html.join("\n"));
    },

    panel: null,
    visible: false,

    getCompletion: function() {
        return this.visible ? this._tags[this._index] : null;
    },

    hide: function() {
        if (!this.visible) {
            return;
        }

        this.panel.fadeOut(ANIMATION_SPEED);
        this.visible = false;
    },

    move: function(dir) {
        var index = this._index;

        var sel = this._listItemForIndex(index);

        var unsel = (dir === 'up') ? sel.prev() : sel.next();
        if (unsel.length === 0) {
            return;
        }

        index = (dir === 'up') ? index - 1 : index + 1;
        this._index = index;

        var selFirstRow = $(sel).find('.bespin-completion-top-row');
        var selSecondRow = $(sel).find('.bespin-completion-second-row');
        var unselFirstRow = $(unsel).find('.bespin-completion-top-row');
        var unselSecondRow = $(unsel).find('.bespin-completion-second-row');

        selSecondRow.hide();
        unselSecondRow.show();

        var highlight = this.panel.find(".bespin-completion-highlight");
        highlight.stop(true, true);
        var highlightDimensions = this._getHighlightDimensions(unsel);
        highlight.animate(highlightDimensions, ANIMATION_SPEED);
        unselSecondRow.hide();

        if (dir === 'down') {
            var height = selSecondRow.height();
            unselFirstRow.css('top', height);
            unselFirstRow.animate({ top: 0 }, ANIMATION_SPEED);
        } else {
            var height = unselSecondRow.height();
            selFirstRow.css('top', -height);
            selFirstRow.animate({ top: 0 }, ANIMATION_SPEED);
        }

        unselSecondRow.fadeIn();
    },

    show: function(tags, point, lineHeight) {
        var tags = _(tags).clone();
        this._tags = tags;

        this._populate();

        var visible = this.visible;
        var panel = this.panel;
        panel.stop(true, true);
        if (!visible) {
            panel.show();
        }

        var parentOffset = this.parent.offset();
        var parentX = parentOffset.left, parentY = parentOffset.top;
        var absX = parentX + point.x, absY = parentY + point.y;

        var panelWidth = panel.outerWidth(), panelHeight = panel.outerHeight();
        var windowWidth = $(window).width(), windowHeight = $(window).height();

        var fromBottom = absY + panelHeight + lineHeight > windowHeight;
        this._fromBottom = fromBottom;

        if (this._index >= tags.length) {
            this._index = tags.length - 1;
        }

        var pointer;
        if (fromBottom) {
            pointer = panel.find('.bespin-completion-pointer');
            pointer.removeClass('bespin-completion-pointer-up');
            pointer.addClass('bespin-completion-pointer-down');
            panel.css({ bottom: -point.y, top: "" });

            // Reverse the list.
            this._tags.reverse();
            this._populate();

            if (!visible) {
                this._index = tags.length - 1;
            }
        } else {
            pointer = panel.find('.bespin-completion-pointer');
            pointer.removeClass('bespin-completion-pointer-down');
            pointer.addClass('bespin-completion-pointer-up');
            panel.css({ top: point.y + lineHeight, bottom: "" });

            if (!visible) {
                this._index = 0;
            }
        }

        if (!visible) {
            var fromRight = absX + point.x + panelWidth > windowWidth;
            if (fromRight) {
                pointer.css({ left: "", right: 32 });
                panel.css('left', Math.min(windowWidth - panelWidth - parentX,
                    point.x - panelWidth + 43));
            } else {
                pointer.css({ left: 32, right: "" });
                panel.css('left', Math.max(parentX, point.x - 43));
            }

            panel.hide().animate({ opacity: 'show' }, ANIMATION_SPEED);
        }

        var highlight = panel.find(".bespin-completion-highlight");
        highlight.stop(true, true);
        var sel = this._listItemForIndex(this._index);
        sel.find(".bespin-completion-second-row").show();

        var highlightDimensions = this._getHighlightDimensions(sel);
        var highlightWidth = highlightDimensions.width;
        var highlightHeight = highlightDimensions.height;
        highlight.css(highlightDimensions);

        this.visible = true;
    }
};

exports.CompletionUI = CompletionUI;


});

bespin.tiki.module("completion:index",function(require,exports,module) {

});
;bespin.tiki.register("::rangeutils", {
    name: "rangeutils",
    dependencies: {  }
});
bespin.tiki.module("rangeutils:utils/range",function(require,exports,module) {
/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Bespin.
 *
 * The Initial Developer of the Original Code is
 * Mozilla.
 * Portions created by the Initial Developer are Copyright (C) 2009
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Bespin Team (bespin@mozilla.com)
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

var util = require('bespin:util/util');

/**
 * Returns the result of adding the two positions.
 */
exports.addPositions = function(a, b) {
    return { row: a.row + b.row, col: a.col + b.col };
};

/** Returns a copy of the given range. */
exports.cloneRange = function(range) {
    var oldStart = range.start, oldEnd = range.end;
    var newStart = { row: oldStart.row, col: oldStart.col };
    var newEnd = { row: oldEnd.row, col: oldEnd.col };
    return { start: newStart, end: newEnd };
};

/**
 * Given two positions a and b, returns a negative number if a < b, 0 if a = b,
 * or a positive number if a > b.
 */
exports.comparePositions = function(positionA, positionB) {
    var rowDiff = positionA.row - positionB.row;
    return rowDiff === 0 ? positionA.col - positionB.col : rowDiff;
};

/**
 * Returns true if the two ranges are equal and false otherwise.
 */
exports.equal = function(rangeA, rangeB) {
    return (exports.comparePositions(rangeA.start, rangeB.start) === 0 &&
                exports.comparePositions(rangeA.end, rangeB.end) === 0);
};

exports.extendRange = function(range, delta) {
    var end = range.end;
    return {
        start: range.start,
        end:   {
            row: end.row + delta.row,
            col: end.col + delta.col
        }
    };
};

/**
 * Given two sets of ranges, returns the ranges of characters that exist in one
 * of the sets but not both.
 */
exports.intersectRangeSets = function(setA, setB) {
    var stackA = util.clone(setA), stackB = util.clone(setB);
    var result = [];
    while (stackA.length > 0 && stackB.length > 0) {
        var rangeA = stackA.shift(), rangeB = stackB.shift();
        var startDiff = exports.comparePositions(rangeA.start, rangeB.start);
        var endDiff = exports.comparePositions(rangeA.end, rangeB.end);

        if (exports.comparePositions(rangeA.end, rangeB.start) < 0) {
            // A is completely before B
            result.push(rangeA);
            stackB.unshift(rangeB);
        } else if (exports.comparePositions(rangeB.end, rangeA.start) < 0) {
            // B is completely before A
            result.push(rangeB);
            stackA.unshift(rangeA);
        } else if (startDiff < 0) {     // A starts before B
            result.push({ start: rangeA.start, end: rangeB.start });
            stackA.unshift({ start: rangeB.start, end: rangeA.end });
            stackB.unshift(rangeB);
        } else if (startDiff === 0) {   // A and B start at the same place
            if (endDiff < 0) {          // A ends before B
                stackB.unshift({ start: rangeA.end, end: rangeB.end });
            } else if (endDiff > 0) {   // A ends after B
                stackA.unshift({ start: rangeB.end, end: rangeA.end });
            }
        } else if (startDiff > 0) {     // A starts after B
            result.push({ start: rangeB.start, end: rangeA.start });
            stackA.unshift(rangeA);
            stackB.unshift({ start: rangeA.start, end: rangeB.end });
        }
    }
    return result.concat(stackA, stackB);
};

exports.isZeroLength = function(range) {
    return range.start.row === range.end.row &&
        range.start.col === range.end.col;
};

/**
 * Returns the greater of the two positions.
 */
exports.maxPosition = function(a, b) {
    return exports.comparePositions(a, b) > 0 ? a : b;
};

/**
 * Converts a range with swapped 'end' and 'start' values into one with the
 * values in the correct order.
 *
 * TODO: Unit test.
 */
exports.normalizeRange = function(range) {
    return this.comparePositions(range.start, range.end) < 0 ? range :
        { start: range.end, end: range.start };
};

/**
 * Returns a single range that spans the entire given set of ranges.
 */
exports.rangeSetBoundaries = function(rangeSet) {
    return {
        start:  rangeSet[0].start,
        end:    rangeSet[rangeSet.length - 1].end
    };
};

exports.toString = function(range) {
    var start = range.start, end = range.end;
    return '[ ' + start.row + ', ' + start.col + ' ' + end.row + ',' + + end.col +' ]';
};

/**
 * Returns the union of the two ranges.
 */
exports.unionRanges = function(a, b) {
    return {
        start:  a.start.row < b.start.row ||
            (a.start.row === b.start.row && a.start.col < b.start.col) ?
            a.start : b.start,
        end:    a.end.row > b.end.row ||
            (a.end.row === b.end.row && a.end.col > b.end.col) ?
            a.end : b.end
    };
};

exports.isPosition = function(pos) {
    return !util.none(pos) && !util.none(pos.row) && !util.none(pos.col);
};

exports.isRange = function(range) {
    return (!util.none(range) && exports.isPosition(range.start) &&
                                                exports.isPosition(range.end));
};

});

bespin.tiki.module("rangeutils:index",function(require,exports,module) {

});
;bespin.tiki.register("::undomanager", {
    name: "undomanager",
    dependencies: {  }
});
bespin.tiki.module("undomanager:index",function(require,exports,module) {
/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Bespin.
 *
 * The Initial Developer of the Original Code is
 * Mozilla.
 * Portions created by the Initial Developer are Copyright (C) 2009
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Bespin Team (bespin@mozilla.com)
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

var util = require('bespin:util/util');
var env = require('environment').env;

/**
 * This simple undo manager coordinates undo for the app that embeds Bespin.
 * It's similar to SproutCore's UndoManager class, but it separates undo and
 * redo and correctly flushes the redo stack when an action is performed.
 */
exports.UndoManager = function() {};

util.mixin(exports.UndoManager.prototype, {
    _redoStack: [],
    _undoStack: [],

    _undoOrRedo: function(method, stack, otherStack) {
        if (stack.length === 0) {
            return false;
        }

        var record = stack.pop();
        if (!record.target[method](record.context)) {
            this._redoStack = [];
            this._undoStack = [];
            return false;
        }

        otherStack.push(record);
        return true;
    },

    /**
     * Redo the last undone action.
     * @return{boolean} True if the action was successfully redone, false
     *     otherwise.
     */
    redo: function() {
        return this._undoOrRedo('redo', this._redoStack, this._undoStack);
    },

    /**
     * Notifies the undo manager that an action was performed. When the action
     * is to be undone, the 'undo' message will be sent to the target with the
     * given context. When the action is to be redone, the 'redo' message is
     * sent in the same way.
     */
    registerUndo: function(target, context) {
        this._redoStack = [];
        this._undoStack.push({ target: target, context: context });
    },

    /**
     * Undoes the last action.
     *
     * @return{boolean} True if the action was successfully undone, false
     *     otherwise.
     */
    undo: function() {
        return this._undoOrRedo('undo', this._undoStack, this._redoStack);
    }
});

exports.global = new exports.UndoManager();

/**
 *
 */
exports.undoManagerCommand = function(args, request) {
    exports.global[request.commandExt.name]();
};

});
;bespin.tiki.register("::command_line", {
    name: "command_line",
    dependencies: { "templater": "0.0.0", "settings": "0.0.0", "matcher": "0.0.0", "theme_manager_base": "0.0.0", "canon": "0.0.0", "keyboard": "0.0.0", "diff": "0.0.0", "types": "0.0.0" }
});
bespin.tiki.module("command_line:commands/basic",function(require,exports,module) {
/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Bespin.
 *
 * The Initial Developer of the Original Code is
 * Mozilla.
 * Portions created by the Initial Developer are Copyright (C) 2009
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Bespin Team (bespin@mozilla.com)
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

var bespin = require('bespin:index');
var util = require('bespin:util/util');
var env = require('environment').env;

/**
 * 'eval' command
 */
exports.evalCommand = function(args, request) {
    var result;
    var javascript = args.javascript;
    try {
        result = eval(javascript);
    } catch (e) {
        result = '<b>Error: ' + e.message + '</b>';
    }

    var msg = '';
    var type = '';
    var x;

    if (util.isFunction(result)) {
        // converts the function to a well formated string
        msg = (result + '').replace(/\n/g, '<br>').replace(/ /g, '&#160');
        type = 'function';
    } else if (util.isObject(result)) {
        if (Array.isArray(result)) {
            type = 'array';
        } else {
            type = 'object';
        }

        var items = [];
        var value;

        for (x in result) {
            if (result.hasOwnProperty(x)) {
                if (util.isFunction(result[x])) {
                    value = '[function]';
                } else if (util.isObject(result[x])) {
                    value = '[object]';
                } else {
                    value = result[x];
                }

                items.push({name: x, value: value});
            }
        }

        items.sort(function(a,b) {
            return (a.name.toLowerCase() < b.name.toLowerCase()) ? -1 : 1;
        });

        for (x = 0; x < items.length; x++) {
            msg += '<b>' + items[x].name + '</b>: ' + items[x].value + '<br>';
        }

    } else {
        msg = result;
        type = typeof result;
    }

    request.done('Result for eval <b>"' + javascript + '"</b>' +
            ' (type: '+ type+'): <br><br>'+ msg);
};

/**
 * 'version' command
 */
exports.versionCommand = function(args, request) {
    var version = 'Bespin ' + bespin.versionNumber + ' (' + 
            bespin.versionCodename + ')';
    request.done(version);
};

var messages = [
    'really wants you to trick it out in some way.',
    'is your Web editor.',
    'would love to be like Emacs on the Web.',
    'is written on the Web platform, so you can tweak it.'
];

/**
 * 'bespin' command
 */
exports.bespinCommand = function(args, request) {
    var index = Math.floor(Math.random() * messages.length);
    request.done('Bespin ' + messages[index]);
};

});

bespin.tiki.module("command_line:commands/simple",function(require,exports,module) {
/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Bespin.
 *
 * The Initial Developer of the Original Code is
 * Mozilla.
 * Portions created by the Initial Developer are Copyright (C) 2009
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Bespin Team (bespin@mozilla.com)
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

var catalog = require('bespin:plugins').catalog;
var console = require('bespin:console').console;
var env = require('environment').env;

/**
 * Action to allow the command line to do completion
 */
exports.completeCommand = function(args, request) {
    var commandLine = env.commandLine;
    commandLine.complete();
};

/**
 * Generate some help text for all commands in this canon, optionally
 * filtered by a <code>prefix</code>, and with <code>options</code> which can
 * specify a prefix and suffix for the generated HTML.
 */
var _getHelp = function(prefix, options) {
    var output = [];

    var command = catalog.getExtensionByKey('command', prefix);
    if (command && command.pointer) {
        // caught a real command
        output.push(command.description);
    } else {
        var showHidden = false;

        if (!prefix && options && options.prefix) {
            output.push(options.prefix);
        }

        if (command) {
            // We must be looking at sub-commands
            output.push('<h2>Sub-Commands of ' + command.name + '</h2>');
            output.push('<p>' + command.description + '</p>');
        } else if (prefix) {
            if (prefix == 'hidden') { // sneaky, sneaky.
                prefix = '';
                showHidden = true;
            }
            output.push('<h2>Commands starting with \'' + prefix + '\':</h2>');
        } else {
            output.push('<h2>Available Commands:</h2>');
        }

        var toBeSorted = [];
        catalog.getExtensions('command').forEach(function(command) {
            toBeSorted.push(command.name);
        });

        var sorted = toBeSorted.sort();

        output.push('<table>');
        for (var i = 0; i < sorted.length; i++) {
            command = catalog.getExtensionByKey('command', sorted[i]);
            if (!command) {
                console.error('Huh? command ', command.name, ' cannot be looked up by name');
                continue;
            }

            if (!showHidden && command.hidden) {
                continue;
            }
            if (command.description === undefined) {
                // Ignore editor actions
                continue;
            }
            if (prefix && command.name.indexOf(prefix) !== 0) {
                // Filtered out by the user
                continue;
            }
            if (!prefix && command.name.indexOf(' ') != -1) {
                // sub command
                continue;
            }
            if (command && command.name == prefix) {
                // sub command, and we've already given that help
                continue;
            }

            // todo add back a column with parameter information, perhaps?

            output.push('<tr>');
            output.push('<th class="right">' + command.name + '</th>');
            output.push('<td>' + command.description + '</td>');
            output.push('</tr>');
        }
        output.push('</table>');

        if (!prefix && options && options.suffix) {
            output.push(options.suffix);
        }
    }

    return output.join('');
};

/**
 *
 */
exports.helpCommand = function(args, request) {
    var output = _getHelp(args.search, {
        prefix: '<h2>Welcome to Bespin - Code in the Cloud</h2><ul>' +
            "<li><a href='http://labs.mozilla.com/projects/bespin' target='_blank'>Home Page</a></li>" +
            "<li><a href='https://wiki.mozilla.org/Labs/Bespin' target='_blank'>Wiki</a></li>" +
            "<li><a href='https://wiki.mozilla.org/Labs/Bespin/UserGuide' target='_blank'>User Guide</a></li>" +
            "<li><a href='https://wiki.mozilla.org/Labs/Bespin/Tips' target='_blank'>Tips and Tricks</a></li>" +
            "<li><a href='https://wiki.mozilla.org/Labs/Bespin/FAQ' target='_blank'>FAQ</a></li>" +
            "<li><a href='https://wiki.mozilla.org/Labs/Bespin/DeveloperGuide' target='_blank'>Developers Guide</a></li>" +
            "</ul>",
         suffix: "For more information, see the <a href='https://wiki.mozilla.org/Labs/Bespin'>Bespin Wiki</a>."
    });
    request.done(output);
};

// TODO: fix
var rootCanon = { aliases:[], commands:[] };

/**
 * 'alias' command
 */
exports.aliasCommand = function(args, request) {
    var aliases = rootCanon.aliases;

    if (!args.alias) {
        // * show all
        var output = '<table>';
        for (var x in aliases) {
            if (aliases.hasOwnProperty(x)) {
                output += '<tr><td style="text-align:right;">' + x + '</td>' +
                        '<td>&#x2192;</td><td>' + aliases[x] + '</td></tr>';
            }
        }
        output += '</table>';
        request.done(output);
    } else {
        // * show just one
        if (args.command === undefined) {
          var alias = aliases[args.alias];
          if (alias) {
              request.done(args.alias + ' &#x2192; ' + aliases[args.alias]);
          } else {
              request.done('No alias set for \'' + args.alias + '\'');
          }
        } else {
            // * save a new alias
            var key = args.alias;
            var value = args.command;
            var aliascmd = value.split(' ')[0];

            if (rootCanon.commands[key]) {
                request.done('There is already a command with the name: ' + key);
            } else if (rootCanon.commands[aliascmd]) {
                aliases[key] = value;
                request.done('Saving alias: ' + key + ' &#x2192; ' + value);
            } else if (aliases[aliascmd]) {
                // TODO: have the symlink to the alias not the end point
                aliases[key] = value;
                request.done('Saving alias: ' + key + ' &#x2192; ' + aliases[value] + ' (' + value + ' was an alias itself)');
            } else {
                request.done('No command or alias with that name.');
            }
        }
    }
};


});

bespin.tiki.module("command_line:commands/history",function(require,exports,module) {
/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Bespin.
 *
 * The Initial Developer of the Original Code is
 * Mozilla.
 * Portions created by the Initial Developer are Copyright (C) 2009
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Bespin Team (bespin@mozilla.com)
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

var catalog = require('bespin:plugins').catalog;
var history = require('canon:history');
var env = require('environment').env;

/**
 * The pointer to the command that we show on up|down
 */
var pointer = 0;

/**
 * CLI 'up'
 * Decrement the 'current entry' pointer
 */
exports.historyPreviousCommand = function(args, request) {
    if (pointer > 0) {
        pointer--;
    }

    var display = history.requests[pointer].typed;
    env.commandLine.setInput(display);
};

/**
 * CLI 'down'
 * Increment the 'current entry' pointer
 */
exports.historyNextCommand = function(args, request) {
    if (pointer < history.requests.length) {
        pointer++;
    }

    var display = (pointer === history.requests.length)
        ? ''
        : history.requests[pointer].typed;

    env.commandLine.setInput(display);
};

/**
 * 'history' command
 */
exports.historyCommand = function(args, request) {
    var output = [];
    output.push('<table>');
    var count = 1;

    history.requests.forEach(function(request) {
        output.push('<tr>');
        output.push('<th>' + count + '</th>');
        output.push('<td>' + request.typed + '</td>');
        output.push('</tr>');
        count++;
    });
    output.push('</table>');

    request.done(output.join(''));
};

/**
 * Reset the pointer to the latest command execution
 */
exports.addedRequestOutput = function() {
    pointer = history.requests.length;
};

});

bespin.tiki.module("command_line:input",function(require,exports,module) {
/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Bespin.
 *
 * The Initial Developer of the Original Code is
 * Mozilla.
 * Portions created by the Initial Developer are Copyright (C) 2009
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Bespin Team (bespin@mozilla.com)
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

var catalog = require('bespin:plugins').catalog;
var console = require('bespin:console').console;
var Promise = require('bespin:promise').Promise;
var groupPromises = require('bespin:promise').group;
var Trace = require('bespin:util/stacktrace').Trace;
var util = require('bespin:util/util');

var types = require('types:types');
var Request = require('canon:request').Request;
var history = require('canon:history');
var keyboard = require('keyboard:keyboard');

var Hint = require('command_line:hint').Hint;
var Level = require('command_line:hint').Level;
var typehint = require('command_line:typehint');

/**
 * An object used during command line parsing to hold the various intermediate
 * data steps.
 * <p>The 'output' of the parse is held in 2 objects: input.hints which is an
 * array of hints to display to the user. In the future this will become a
 * single value.
 * <p>The other output value is input.argsPromise which gives access to an
 * args object for use in executing the final command.
 * @param typed {string} The instruction as typed by the user so far
 * @param options {object} A list of optional named parameters. Can be any of:
 * <b>flags</b>: Flags for us to check against the predicates specified with the
 * commands. Defaulted to <tt>keyboard.buildFlags({ });</tt>
 * if not specified.
 */
exports.Input = function(typed, options) {
    if (util.none(typed)) {
        throw new Error('Input requires something \'typed\' to work on');
    }
    this.typed = typed;
    this.hints = [];
    this.argsPromise = new Promise();

    options = options || {};

    options.flags = options.flags || keyboard.buildFlags({ });
    this.flags = options.flags;

    // Once tokenize() has been called, we have the #typed string cut up into
    // #_parts
    this._parts = [];

    // Once split has been called we have #_parts split into #_unparsedArgs and
    // #commandExt (if there is a matching command).
    this._unparsedArgs = undefined;

    // If #typed specifies a command to execute, this is that commands metadata
    this._commandExt = undefined;

    // Assign matches #_unparsedArgs to the params declared by the #_commandExt
    // A list of arguments in commandExt.params order
    this._assignments = undefined;

    try {
        // Go through the input checking and generating hints,
        // and if possible an arguments array.
        this._tokenize();
    } catch (ex) {
        var trace = new Trace(ex, true);
        console.group('Error calling command: ' + this.typed);
        console.error(ex);
        trace.log(3);
        console.groupEnd();

        if (!this.argsPromise.isComplete()) {
            this.argsPromise.reject(ex);
        }
    }
};

/**
 * Implementation of Input.
 * The majority of the functions in this class are called in sequence by the
 * constructor. Their task is to add to <tt>hints</tt> and to resolve
 * <tt>argsPromise</tt>.
 * <p>The general sequence is:<ul>
 * <li>_tokenize(): convert _typed into _parts
 * <li>_split(): convert _parts into _commandExt and _unparsedArgs
 * <li>_assign(): convert _unparsedArgs into _assignments
 * <li>_convertTypes(): resolve argsPromise by converting _assignments
 * </ul>
 */
exports.Input.prototype = {
    /**
     * Split up the input taking into account ' and "
     */
    _tokenize: function() {
        if (!this.typed || this.typed === '') {
            // We would like to put some initial help here, but for anyone but
            // a complete novice a 'type help' message is very annoying, so we
            // need to find a way to only display this message once, or for
            // until the user click a 'close' button or similar
            this.hints.push(new Hint(Level.Incomplete));
            this.argsPromise.resolve({});
            return;
        }

        // replace(/^\s\s*/, '') = trimLeft()
        var incoming = this.typed.replace(/^\s\s*/, '').split(/\s+/);

        var nextToken;
        while (true) {
            nextToken = incoming.shift();
            if (util.none(nextToken)) {
                break;
            }
            if (nextToken[0] == '"' || nextToken[0] == '\'') {
                // It's quoting time
                var eaten = [ nextToken.substring(1, nextToken.length) ];
                var eataway;
                while (true) {
                    eataway = incoming.shift();
                    if (!eataway) {
                        break;
                    }
                    if (eataway[eataway.length - 1] == '"' ||
                            eataway[eataway.length - 1] == '\'') {
                        // End quoting time
                        eaten.push(eataway.substring(0, eataway.length - 1));
                        break;
                    } else {
                        eaten.push(eataway);
                    }
                }
                this._parts.push(eaten.join(' '));
            } else {
                this._parts.push(nextToken);
            }
        }

        // Split the command from the args
        this._split();
    },

    /**
     * Looks in the catalog for a command extension that matches what has been
     * typed at the command line.
     */
    _split: function() {
        this._unparsedArgs = this._parts.slice(); // aka clone()
        var initial = this._unparsedArgs.shift();
        var commandExt;

        while (true) {
            commandExt = catalog.getExtensionByKey('command', initial);

            if (!commandExt) {
                // Not found. break with commandExt == null
                break;
            }

            if (!keyboard.flagsMatch(commandExt.predicates, this.flags)) {
                // If the predicates say 'no match' then go LA LA LA
                commandExt = null;
                break;
            }

            if (commandExt.pointer) {
                // Valid command, break with commandExt valid
                break;
            }

            // commandExt, but no pointer - this must be a sub-command
            initial += ' ' + this._unparsedArgs.shift();
        }

        this._commandExt = commandExt;

        // Do we know what the command is.
        var hintSpec = null;
        var message;
        if (this._commandExt) {
            // Load the command to check that it will load
            var loadPromise = new Promise();
            commandExt.load().then(function(command) {
                if (command) {
                    loadPromise.resolve(null);
                } else {
                    message = 'Failed to load command ' + commandExt.name +
                            ': Pointer ' + commandExt.pluginName +
                            ':' + commandExt.pointer + ' is null.';
                    loadPromise.resolve(new Hint(Level.Error, message));
                }
            }, function(ex) {
                message = 'Failed to load command ' + commandExt.name +
                        ': Pointer ' + commandExt.pluginName +
                        ':' + commandExt.pointer + ' failed to load.' + ex;
                loadPromise.resolve(new Hint(Level.Error, message));
            });
            this.hints.push(loadPromise);

            // The user hasn't started to type any params
            if (this._parts.length === 1) {
                var cmdExt = this._commandExt;
                if (this.typed == cmdExt.name ||
                        !cmdExt.params || cmdExt.params.length === 0) {
                    hintSpec = exports.documentCommand(cmdExt, this.typed);
                }
            }
        } else {
            // We don't know what the command is
            // TODO: We should probably cache this
            var commandExts = [];
            catalog.getExtensions('command').forEach(function(commandExt) {
                if (keyboard.flagsMatch(commandExt.predicates, this.flags) &&
                        commandExt.description) {
                    commandExts.push(commandExt);
                }
            }.bind(this));

            hintSpec = {
                param: {
                    type: { name: 'selection', data: commandExts },
                    description: 'Commands'
                },
                value: this.typed
            };
        }

        if (hintSpec) {
            var hintPromise = typehint.getHint(this, hintSpec);
            this.hints.push(hintPromise);
        }

        if (util.none(this._commandExt)) {
            this.argsPromise.resolve({});
            return;
        }

        // Assign input to declared parameters
        this._assign();
    },

    /**
     * Work out which arguments are applicable to which parameters.
     * <p>This takes #_commandExt.params and #_unparsedArgs and creates a map of
     * param names to 'assignment' objects, which have the following properties:
     * <ul>
     * <li>param - The matching parameter.
     * <li>index - Zero based index into where the match came from on the input
     * <li>value - The matching input
     * </ul>
     * The resulting #_assignments member created by this function is a list of
     * assignments of arguments in commandExt.params order.
     * TODO: _unparsedArgs should be a list of objects that contain the
     * following values: name, param (when assigned) and maybe hints?
     */
    _assign: function() {
        // TODO: something smarter than just assuming that they are all in order
        this._assignments = [];
        var params = this._commandExt.params;
        var unparsedArgs = this._unparsedArgs;
        var message;

        // Create an error if the command does not take parameters, but we have
        // been given them ...
        if (!params || params.length === 0) {
            // No problem if we're passed nothing or an empty something
            var argCount = 0;
            unparsedArgs.forEach(function(unparsedArg) {
                if (unparsedArg.trim() !== '') {
                    argCount++;
                }
            });

            if (argCount !== 0) {
                message = this._commandExt.name + ' does not take any parameters';
                this.hints.push(new Hint(Level.Error, message));
            }

            this.argsPromise.resolve({});
            return;
        }

        // Special case: if there is only 1 parameter, and that's of type
        // text we put all the params into the first param
        if (params.length == 1 && params[0].type == 'text') {
            // Warning: There is some potential problem here if spaces are
            // significant. It might be better to chop the command of the
            // start of this.typed? But that's not easy because there could
            // be multiple spaces in the command if we're doing sub-commands
            this._assignments[0] = {
                value: unparsedArgs.length === 0 ? null : unparsedArgs.join(' '),
                param: params[0]
            };
        } else {
            // The normal case where we have to assign params individually
            var index = 0;
            var used = [];
            params.forEach(function(param) {
                this._assignParam(param, index++, used);
            }.bind(this));

            // Check there are no params that don't fit
            var unparsed = false;
            unparsedArgs.forEach(function(unparsedArg) {
                if (used.indexOf(unparsedArg) == -1) {
                    message = 'Parameter \'' + unparsedArg + '\' makes no sense.';
                    this.hints.push(new Hint(Level.Error, message));
                    unparsed = true;
                }
            }.bind(this));

            if (unparsed) {
                this.argsPromise.resolve({});
                return;
            }
        }

        // Show a hint for the last parameter
        if (this._parts.length > 1) {
            var assignment = this._getAssignmentForLastArg();

            // HACK! deferred types need to have some parameters
            // by which to determine which type they should defer to
            // so we hack in the assignments so the deferrer can work
            assignment.param.type.assignments = this._assignments;

            if (assignment) {
                this.hints.push(typehint.getHint(this, assignment));
            }
        }

        // Convert input into declared types
        this._convertTypes();
    },

    /**
     * Extract a value from the set of inputs for a given param.
     * @param param The param that we are providing a value for. This is taken
     * from the command meta-data for the commandExt in question.
     * @param index The number of the param - i.e. the index of <tt>param</tt>
     * into the original params array.
     */
    _assignParam: function(param, index, used) {
        var message;
        // Look for '--param X' style inputs
        for (var i = 0; i < this._unparsedArgs.length; i++) {
            var unparsedArg = this._unparsedArgs[i];

            if ('--' + param.name == unparsedArg) {
                used.push(unparsedArg);
                // boolean parameters don't have values, they default to false
                if (types.equals(param.type, 'boolean')) {
                    this._assignments[index] = {
                        value: true,
                        param: param
                    };
                } else {
                    if (i + 1 < this._unparsedArgs.length) {
                        message = 'Missing parameter: ' + param.name;
                        // Missing value for this param
                        this.hints.push(new Hint(Level.Incomplete, message));
                    } else {
                        used.push(this._unparsedArgs[i + 1]);
                    }
                }
                return;
            }
        }

        var value = null;
        if (this._unparsedArgs.length > index) {
            value = this._unparsedArgs[index];
            used.push(this._unparsedArgs[index]);
        }

        // null is a valid default value, and common because it identifies an
        // parameter that is optional. undefined means there is no value from
        // the command line
        if (value !== undefined) {
            this._assignments[index] = { value: value, param: param };
        } else {
            this._assignments[index] = { param: param };

            if (param.defaultValue === undefined) {
                // There is no default, and we've not supplied one so far
                message = 'Missing parameter: ' + param.name;
                this.hints.push(new Hint(Level.Incomplete, message));
            }
        }
    },

    /**
     * Get the parameter, index and value for the last thing the user typed
     * @see _assign()
     */
    _getAssignmentForLastArg: function() {
        var highestAssign = null;
        this._assignments.forEach(function(assignment) {
            if (!highestAssign || !util.none(assignment.value)) {
                highestAssign = assignment;
            }
        });
        return highestAssign;
    },

    /**
     * Convert the passed string array into an args object as specified by the
     * command.params declaration.
     */
    _convertTypes: function() {
        // Use {} when there are no params
        if (!this._commandExt.params) {
            this.argsPromise.resolve({});
            return;
        }

        // The data we pass to the command
        var argOutputs = {};
        // Cache of promises, because we're only done when they're done
        var convertPromises = [];

        this._assignments.forEach(function(assignment) {
            // HACK! deferred types need to have some parameters
            // by which to determine which type they should defer to
            // so we hack in the assignments so the deferrer can work
            assignment.param.type.assignments = this._assignments;

            var promise = this._convertType(assignment, argOutputs);

            promise.then(function(converted) {
                assignment.converted = converted;
                argOutputs[assignment.param.name] = converted;
            }, function(ex) {
                var message = 'Can\'t convert \'' + assignment.value +
                        '\' to a ' + param.type + ': ' + ex;
                this.hints.push(new Hint(Level.Error, message));
            }.bind(this));

            convertPromises.push(promise);
        }.bind(this));

        groupPromises(convertPromises).then(function() {
            this.argsPromise.resolve(argOutputs);
        }.bind(this));
    },

    /**
     * Return a promise which will be resolved on type conversion of the given
     * assignment. The argOutputs object will be filled out with the converted
     * type so the promise is only needed to indicate completion of a group of
     * type conversions.
     */
    _convertType: function(assignment, argOutputs) {
        if (assignment.value !== null) {
            return types.fromString(assignment.value, assignment.param.type);
        } else {
            return new Promise().resolve(assignment.param.defaultValue);
        }
    },

    /**
     * Take the results of a parseInput, wait for the argsPromise to resolve
     * load the command and then execute it.
     */
    execute: function() {
        // Debug to the console
        var loadError = function(ex) {
            var trace = new Trace(ex, true);
            console.group('Error executing: ' + this.typed);
            console.error(ex);
            trace.log(3);
            console.groupEnd();
        }.bind(this);

        this.argsPromise.then(function(args) {
            this._commandExt.load().then(function(command) {
                var request = new Request({
                    command: command,
                    commandExt: this._commandExt,
                    typed: this.typed,
                    args: args
                });
                history.execute(args, request);
            }.bind(this), loadError);
        }.bind(this), loadError);
    }
};

/**
 * Provide some documentation for a command
 */
exports.documentCommand = function(cmdExt, typed) {
    var docs = [];
    docs.push('<h1>' + cmdExt.name + '</h1>');
    docs.push('<h2>Summary</h2>');
    docs.push('<p>' + cmdExt.description + '</p>');

    if (cmdExt.manual) {
        docs.push('<h2>Description</h2>');
        docs.push('<p>' + cmdExt.description + '</p>');
    }

    if (cmdExt.params && cmdExt.params.length > 0) {
        docs.push('<h2>Synopsis</h2>');
        docs.push('<pre>');
        docs.push(cmdExt.name);
        var optionalParamCount = 0;
        cmdExt.params.forEach(function(param) {
            if (param.defaultValue === undefined) {
                docs.push(' <i>');
                docs.push(param.name);
                docs.push('</i>');
            } else if (param.defaultValue === null) {
                docs.push(' <i>[');
                docs.push(param.name);
                docs.push(']</i>');
            } else {
                optionalParamCount++;
            }
        });
        if (optionalParamCount > 3) {
            docs.push(' [options]');
        } else if (optionalParamCount > 0) {
            cmdExt.params.forEach(function(param) {
                if (param.defaultValue) {
                    docs.push(' [--<i>');
                    docs.push(param.name);
                    if (types.equals(param.type, 'boolean')) {
                        docs.push('</i>');
                    } else {
                        docs.push('</i> ' + types.getSimpleName(param.type));
                    }
                    docs.push(']');
                }
            });
        }
        docs.push('</pre>');

        docs.push('<h2>Parameters</h2>');
        cmdExt.params.forEach(function(param) {
            docs.push('<h3 class="cmd_body"><i>' + param.name + '</i></h3>');
            docs.push('<p>' + param.description + '</p>');
            if (types.defaultValue) {
                docs.push('<p>Default: ' + types.defaultValue + '</p>');
            }
        });
    }

    return {
        param: { type: 'text', description: docs.join('') },
        value: typed
    };
};

});

bespin.tiki.module("command_line:hint",function(require,exports,module) {
/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Bespin.
 *
 * The Initial Developer of the Original Code is
 * Mozilla.
 * Portions created by the Initial Developer are Copyright (C) 2009
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Bespin Team (bespin@mozilla.com)
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

/**
 * Various methods on Input return a set of hints, each of which includes an
 * indicator of the severity of the hint.
 */
exports.Level = {
    /**
     * This means that the user has typed something wrong, and needs to go back
     * to correct it. The input field should indicate the error, and we should
     * prevent the action of Return.
     */
    Error: 3,

    /**
     * The command won't work, and we should prevent the action of Return, but
     * not because of anything the user has done. The problem is that they've
     * not finished yet.
     */
    Incomplete: 2,

    /**
     * The command can be executed, however we want to warn the user of
     * something before they press Return. It is likely that this will result
     * in a visual indicator.
     */
    Warning: 1,

    /**
     * We think we can help the user by displaying this hint, but it's
     * existence does not imply anything that the user has done wrong.
     */
    Info: 0
};

/**
 * A Quick wrapper for a Hint, data about something we show to the user as part
 * of typing at the command line.
 * @param element {Element|string} The thing to display
 * @param level {number} See exports.Level
 * @param completion {string} Describes how the command line should look if the
 * user presses TAB
 */
exports.Hint = function(level, element, completion) {
    this.level = level;
    this.element = element;
    this.completion = completion;
};

});

bespin.tiki.module("command_line:views/basic",function(require,exports,module) {
/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Bespin.
 *
 * The Initial Developer of the Original Code is
 * Mozilla.
 * Portions created by the Initial Developer are Copyright (C) 2009
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Bespin Team (bespin@mozilla.com)
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

var console = require('bespin:console').console;
var Promise = require('bespin:promise').Promise;

var basic = require('types:basic');
var PrefixMatcher = require('matcher:prefix').PrefixMatcher;

var Menu = require('command_line:views/menu').Menu;
var MatcherMenu = require('command_line:views/menu').MatcherMenu;

/**
 * A choice between a known set of options
 * @see typehint#getHint()
 */
exports.selection = {
    getHint: function(input, assignment, ext) {
        if (!ext.data) {
            console.error('Missing data for selection type');
            ext.data = [];
        }

        var query = assignment.value || '';
        var matcher = new PrefixMatcher(query);

        var items = ext.data.map(function(name) {
            if (typeof name === 'string') {
                return { name: name };
            }
            return name;
        });

        matcher.addItems(items);

        var menu = new MatcherMenu(input, assignment, matcher);
        return menu.hint;
    },

    resolveTypeSpec: basic.selection.resolveTypeSpec
};

/**
 * We can treat a boolean as a selection between true and false
 * @see typehint#getHint()
 */
exports.bool = {
    getHint: function(input, assignment, ext) {
        var menu = new Menu(input, assignment);
        menu.addItems([ { name: 'true' }, { name: 'false' } ]);
        return menu.hint;
    }
};

});

bespin.tiki.module("command_line:views/cli",function(require,exports,module) {
/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Bespin.
 *
 * The Initial Developer of the Original Code is
 * Mozilla.
 * Portions created by the Initial Developer are Copyright (C) 2009
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Bespin Team (bespin@mozilla.com)
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

var diff_match_patch = require('diff').diff_match_patch;

var util = require('bespin:util/util');
var catalog = require('bespin:plugins').catalog;
var console = require('bespin:console').console;

var keyutil = require('keyboard:keyutil');
var keyboardManager = require('keyboard:keyboard').keyboardManager;

var history = require('canon:history');
var env = require('environment').env;
var settings = require('settings').settings;

var Level = require('command_line:hint').Level;
var Input = require('command_line:input').Input;
var templates = require('command_line:templates');
var requestOutput = require('command_line:views/requestOutput');

var imagePath = catalog.getResourceURL('command_line') + 'images';
var diff = new diff_match_patch();

var cliHeight = 26;

/**
 * A view designed to dock in the bottom of the editor, holding the command
 * line input.
 * TODO: If you click on the console output, and then on the editor, we don't
 * shrink the console because we don't have right event. fix it
 */
exports.CliInputView = function() {
    // Used to track if we have focus, and therefore should the CLI be expanded
    // or collapsed
    this._hasFocus = false;

    // Are we currently pinned?
    this._pinned = false;

    // What should the input field look like when someone presses TAB
    this._completion = '';

    // For parsing the input
    this._input = new Input('');

    // If we discover a change in size, we need to change a few styles
    this._lastOrientation = null;

    // Elements attached to this by the templater. For info only
    this.element = null;
    this._tog = null;
    this._hints = null;
    this._table = null;
    this._completer = null;
    this._inputer = null;

    templates.cli({
        cliInputView: this,
        imagePath: imagePath
    });

    keyutil.addKeyDownListener(this._inputer, function(ev) {
        env.commandLine = this;
        var handled = keyboardManager.processKeyEvent(ev, this, {
            isCommandLine: true, isKeyUp: false
        });
        if (ev.keyCode === keyutil.KeyHelper.KEY.TAB) {
            return true;
        }
        return handled;
    }.bind(this));

    this._inputer.addEventListener('keyup', function(ev) {
        var handled = keyboardManager.processKeyEvent(ev, this, {
            isCommandLine: true, isKeyUp: true
        });

        if (ev.keyCode === keyutil.KeyHelper.KEY.RETURN) {
            this._input.execute();
            this.setInput('');
        } else {
            var typed = this._inputer.value;
            if (this._input.typed !== typed) {
                this._input = new Input(typed);
                this.hintUpdated();
            }
        }

        return handled;
    }.bind(this), true);

    catalog.registerExtension('settingChange', {
        match: '[min|max]ConsoleHeight',
        pointer: this.checkSize.bind(this)
    });

    var requestOutputHandler = requestOutput.createHandler(this);
    catalog.registerExtension('addedRequestOutput', requestOutputHandler);
};

/**
 *
 */
exports.CliInputView.prototype = {
    /**
     * See note in app.js
     */
    elementAppended: function() {
        this.checkSize();
    },

    /**
     * Perhaps this should be part of some widget superclass?
     */
    getOrientation: function() {
        var className = this.element.className;
        var north = /\bnorth\b/.test(className);
        var south = /\bsouth\b/.test(className);
        var east = /\beast\b/.test(className);
        var west = /\bwest\b/.test(className);

        if (north && !south && !east && !west) {
            return 'north';
        }
        if (!north && south && !east && !west) {
            return 'south';
        }
        if (!north && !south && east && !west) {
            return 'east';
        }
        if (!north && !south && !east && west) {
            return 'west';
        }

        throw new Error('Ambiguous orientation: north=' + north +
                ', south=' + south + ', east=' + east + ', west=' + west);
    },

    /**
     * Called whenever anything happens that could affect the output display
     */
    checkSize: function() {
        var orientation = this.getOrientation();

        if (orientation === 'north' || orientation === 'south') {
            var height = settings.get('minConsoleHeight');
            if (this._pinned || this._hasFocus) {
                height = settings.get('maxConsoleHeight');
            }

            this._table.style.height = height + 'px';
            this._tog.style.height = height + 'px';
            this.element.style.height = (height + cliHeight) + 'px';

            catalog.publish(this, 'dimensionsChanged');
        }
    },

    /**
     * Apply the proposed completion
     */
    complete: function() {
        if (this._completion) {
            this._inputer.value = this._completion;
        }
    },

    /**
     * Adjust the displayed input (but don't execute it)
     */
    setInput: function(command) {
        command = command || '';
        this._inputer.value = command;
        this._input = new Input(command);
        this.hintUpdated();
        this.focus();
    },

    /**
     * Push the focus into the input element
     */
    focus: function() {
        this._inputer.focus();
    },

    /**
     * Some sugar around <tt>new Input(...).execute();</tt> that is useful to
     * ensure any output is associated with this command line.
     * Note that this association isn't currently special, however it could
     * become special in the future, and this method will do it for you
     * automagically.
     */
    execute: function(command) {
        // TODO: This is a hack... how to do it right?
        env.commandLine = this;

        var input = new Input(command);
        input.execute();
    },

    /**
     * Place a given value on the command line.
     * TODO: Perhaps we should store existing values that are on the command
     * line so that we can put them back when return is pressed?
     */
    prompt: function(command) {
        this._inputer.value = command;
    },

    /**
     * Sync the hint manually so we can also alter the sizes of the hint and
     * output components to make it fit properly.
     */
    hintUpdated: function() {
        var hints = this._input.hints;
        while (this._hints.firstChild) {
            this._hints.removeChild(this._hints.firstChild);
        }

        var level = Level.Info;
        this.setCompletion('');

        /**
         * Find a way to populate a DOM node with this hint
         */
        var addHint = function(hintNode, hint) {
            if (!hint) {
                return;
            }

            // Defer promises
            if (hint.isPromise) {
                hint.then(function(hint) {
                    addHint(hintNode, hint);
                }.bind(this));
                return;
            }

            if (!hint.element) {
                // If we have nothing to show, ignore
            } else if (hint.element.addEventListener) {
                // instanceof Node?
                hintNode.appendChild(hint.element);
            } else {
                // Maybe we should do something clever with exceptions?
                // For now we just toString and call it done.
                var parent = document.createElement('article');
                var text = hint.element.toString();
                parent.appendChild(document.createTextNode(text));
                hintNode.appendChild(parent);
            }

            this.setCompletion(hint.completion);

            if (hint.level > level) {
                level = hint.level;
            }

            util.setClass(this._inputer, 'cmd_error', level == Level.Error);
        }.bind(this);

        hints.forEach(function(hint) {
            addHint(this._hints, hint);
        }.bind(this));

        util.setClass(this._inputer, 'cmd_error', level == Level.Error);
    },

    /**
     * Scroll the output area to the bottom
     */
    scrollToBottom: function() {
        // Certain browsers have a bug such that scrollHeight is too small
        // when content does not fill the client area of the element
        var scrollHeight = Math.max(this._table.scrollHeight, this._table.clientHeight);
        this._table.scrollTop = scrollHeight - this._table.clientHeight;
    },

    /**
     *
     */
    _focusCheck: function(ev) {
        this._hasFocus = (ev.type == 'focus');
        this._delayedCheckSize();
    },

    /**
     * Calls checkSize(), but only after a delay to allow all the focus/blur
     * events to finish propagating.
     */
    _delayedCheckSize: function() {
        if (this._checkSizeTimeout) {
            window.clearTimeout(this._checkSizeTimeout);
            this._checkSizeTimeout = null;
        }
        this._checkSizeTimeout = window.setTimeout(function() {
            this.checkSize();
        }.bind(this), 100);
    },

    /**
     * onClick for the pin button in the toolbar
     */
    _togglePin: function(ev) {
        var checked = /\bchecked\b/.test(ev.target.className);
        if (checked) {
            util.removeClass(ev.target, 'checked');
            this._pinned = false;
        } else {
            util.addClass(ev.target, 'checked');
            this._pinned = true;
        }

        this._delayedCheckSize();
    },

    /**
     * Set the completion field including setting some styling to ensure that
     * everything displays properly.
     * @param completion {string} The full completion value
     */
    setCompletion: function(completion) {
        this._completion = completion || '';
        var current = this._inputer.value;

        var val;
        if (!completion) {
            val = '';
        } else if (completion.indexOf(current) === 0) {
            val = '<span class="cmd_existing">' + current +
                '</span>' + completion.substring(current.length);
        } else {
            var len = diff.diff_commonPrefix(current, completion);
            var extension = completion.substring(len);
            val = '<span class="cmd_existing">' + current + '</span>' +
                '<span class="cmd_extension">' + extension + '</span>';
        }

        this._completer.innerHTML = val;
    }
};

});

bespin.tiki.module("command_line:views/menu",function(require,exports,module) {
/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Bespin.
 *
 * The Initial Developer of the Original Code is
 * Mozilla.
 * Portions created by the Initial Developer are Copyright (C) 2009
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Bespin Team (bespin@mozilla.com)
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

var Hint = require('command_line:hint').Hint;
var Level = require('command_line:hint').Level;
var env = require('environment').env;

/*
 * TODO:
 * - When there is only one option, and it's the same as what has already been
 *   typed, then don't display it.
 * - keyboard shortcuts for UP/DOWN (hard)
 * - in conjunction with the matchers - find a better way to order the matches
 *   the current order doesn't make sense to the user.
 */

/**
 * Hacky way to prevent menu overload
 */
var MAX_ITEMS = 10;

/**
 * Something of a hack to allow activateItemAction() to function by storing
 * a global latest menu instance. There are probably race conditions associated
 * with this. Technically it's possible to have more than one menu displaying
 * at a time (although probably won't be in the future) and should actually
 * happen now
 */
var latestMenu;

/**
 * Fire a menu accelerator to select a menu item. To save creating a new
 * function for every numeric accelerator, we dig into the commandExt to find
 * a number for the key press and use that.
 */
exports.activateItemAction = function(args, request) {
    var key = request.commandExt.key;
    var index = parseInt(key.replace(/[A-Za-z_]/g, ''), 10);
    if (!latestMenu) {
        return;
    }
    var action = latestMenu._itemActions[index];
    action();
};

/**
 * This is like diff_match_patch.diff_commonPrefix(), however it is case
 * insensitive
 */
var commonPrefixIC = function(a, b) {
    var i = 0;
    while (true) {
        if (a.charAt(i).toLocaleLowerCase() !== b.charAt(i).toLocaleLowerCase()) {
            return i;
        }
        if (i >= a.length || i >= b.length) {
            return i;
        }
        i++;
    }
};

/**
 * A list of the accelerator names, counting from 1 not 0, so we ignore the
 * first character.
 */
var accelerators = '-1234567890';

/**
 * A really basic UI hint for when someone is entering something from a
 * set of items, for example boolean|selection.
 */
exports.Menu = function(input, assignment) {
    if (arguments[0] === 'subclassPrototype') {
        return;
    }

    this.input = input;
    this.assignment = assignment;

    // The list of items
    this._parent = document.createElement('div');
    this._parent.setAttribute('class', 'cmd_menu');

    // We start by saying 'not found' and remove it when we find something
    this._notFound = document.createElement('div');
    this._notFound.setAttribute('class', 'cmd_error');
    this._notFound.innerHTML = 'No matches for \'' + this.input.typed + '\'';
    this._parent.appendChild(this._notFound);

    this._list = document.createElement('ul');
    this._parent.appendChild(this._list);

    // The items that we should be displaying
    this._items = [];

    // The longest string which is a prefix to all the _items.name. A value
    // of null means we have not setup a prefix (probably _items is empty).
    // A value of '' means there is no common prefix.
    this._commonPrefix = null;

    // A store of what to do one key-press of some numbered action, probably
    // via a keyboard accelerator
    this._itemActions = [];

    var argLen = this.assignment.value ? this.assignment.value.length : 0;
    var baseLen = this.input.typed.length - argLen;

    // When someone clicks on a link, this is what we prefix onto what they
    // clicked on to get the full input they were expecting
    this._prefix = this.input.typed.substring(0, baseLen);

    // The 'return value' of the menu - contains the DOM node to display
    this.hint = new Hint(Level.Incomplete, this._parent);

    // See notes for #latestMenu
    latestMenu = this;
};

/**
 * Create the clickable links
 */
exports.Menu.prototype.addItems = function(items) {
    var i = 1;
    var maybeTabMenuItem;
    items.forEach(function(item) {
        // Create the UI component
        if (this._items.length < MAX_ITEMS) {
            var link = document.createElement('li');
            link.appendChild(document.createTextNode(item.name));

            if (item.description || item.path) {
                var dfn = document.createElement('dfn');
                var desc = item.description || item.path;
                dfn.appendChild(document.createTextNode(desc));
                link.appendChild(dfn);
            }

            this._itemActions[i] = function(ev) {
                var str = this._prefix + this._getFullName(item);
                env.commandLine.setInput(str);
            }.bind(this);

            if (i < accelerators.length) {
                var abbr = document.createElement('abbr');
                abbr.innerHTML = "ALT-" + accelerators[i];
                if (i === 1) {
                    maybeTabMenuItem = abbr;
                }
                link.appendChild(abbr);
                i++;
            }

            this._list.appendChild(link);

            link.addEventListener('mousedown', function(ev) {
                var str = this._prefix + this._getFullName(item);
                env.commandLine.setInput(str);
                // Prevent the mousedown event. Otherwise the focused commandLine
                // is blured.
                ev.preventDefault();
            }.bind(this), false);
        }

        if (this._items.length === 0) {
            this._parent.removeChild(this._notFound);
        }

        this._items.push(item);

    }.bind(this));

    var best = this._getBestCompletion();
    this.hint.completion = best.completion;

    if (best.isFirst && maybeTabMenuItem) {
        maybeTabMenuItem.innerHTML = 'TAB';
    }
};

/**
 * Find the best completion.
 * We'd most like to complete on a common prefix, however if one doesn't
 * exist then we go with the first item.
 */
exports.Menu.prototype._getBestCompletion = function() {
    if (this._items.length === 0) {
        return { completion: undefined, isFirst: false };
    }

    var isFirst = (this._items.length === 1);

    var longestPrefix = this._getFullName(this._items[0]);
    if (this._items.length > 1) {
        this._items.forEach(function(item) {
            if (longestPrefix.length > 0) {
                var name = this._getFullName(item);
                var len = commonPrefixIC(longestPrefix, name);
                if (len < longestPrefix.length) {
                    longestPrefix = longestPrefix.substring(0, len);
                }
            }
        }.bind(this));
    }

    // Use the first match if there is no better
    if (!longestPrefix || longestPrefix.length === 0) {
        longestPrefix = this._getFullName(this._items[0]);
        isFirst = true;
    }

    // The length of the argument so far
    var argLen = this.assignment.value ? this.assignment.value.length : 0;
    // What was typed, without the argument so far
    var prefix = this.input.typed.substring(0, this.input.typed.length - argLen);

    var completion = prefix + longestPrefix;

    // If we're fuzzy matching, prefix + longestPrefix might actually be
    // shorter than what we've already typed. In this case it's a useless
    // completion, so we revert to the first. Also, if the completion is
    // the same as what's typed, it's useless - revert to first.
    if (completion.indexOf(this.input.typed) != 0
            || completion === this.input.typed) {
        completion = prefix + this._getFullName(this._items[0]);
        isFirst = true;
    }

    return { completion: completion, isFirst: isFirst };
};

/**
 * If the item has a path in place of a description, then we need to
 * include this in our calculations that use the name
 */
exports.Menu.prototype._getFullName = function(item) {
    return (item.path || '') + item.name;
};

/**
 * A special menu that understands a Matcher and will add items from the matcher
 * into itself.
 */
exports.MatcherMenu = function(input, assignment, matcher, loaded) {
    exports.Menu.call(this, input, assignment);
    this.matcher = matcher;
    this.loaded = loaded;

    this.matcher.addListener({
        itemsAdded: function(addedItems) {
            this.addItems(addedItems);
        }.bind(this),

        itemsCleared: function() {
            this.clearItems();
        }.bind(this)
    });

    if (this.loaded) {
        this.loaded.then(function() {
            this._isLoaded = true;
        }.bind(this));
        this._isLoaded = false;
    } else {
        this._isLoaded = true;
    }
};

exports.MatcherMenu.prototype = new exports.Menu('subclassPrototype');

});

bespin.tiki.module("command_line:views/requestOutput",function(require,exports,module) {
/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Bespin.
 *
 * The Initial Developer of the Original Code is
 * Mozilla.
 * Portions created by the Initial Developer are Copyright (C) 2009
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Bespin Team (bespin@mozilla.com)
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

var util = require('bespin:util/util');
var catalog = require('bespin:plugins').catalog;
var console = require('bespin:console').console;

var env = require('environment').env;

var templates = require('command_line:templates');

var imagePath = catalog.getResourceURL('command_line') + 'images';

/**
 * Adds a row to the CLI output display
 */
exports.RequestOutput = function(request, cliInputView) {
    this.request = request;
    this.cliInputView = cliInputView;

    // Elements attached to this by the templater. For info only
    this.rowin = null;
    this.rowout = null;
    this.output = null;
    this.hide = null;
    this.show = null;
    this.duration = null;
    this.typed = null;
    this.throb = null;

    templates.requestOutput({
        actions: this,
        imagePath: imagePath
    });

    this.cliInputView._table.appendChild(this.rowin);
    this.cliInputView._table.appendChild(this.rowout);

    this.request.changed.add(this.onRequestChange.bind(this));
};

exports.RequestOutput.prototype = {
    /**
     * A single click on an invocation line in the console copies the command to
     * the command line
     */
    copyToInput: function() {
        this.cliInputView.setInput(this.request.typed);
    },

    /**
     * A double click on an invocation line in the console executes the command
     */
    executeRequest: function(ev) {
        // TODO: This is a hack... how to do it right?
        env.commandLine = this.cliInputView;
        this.cliInputView._input = new Input(this.request.typed);
        this.cliInputView._input.execute();
    },

    hideOutput: function(ev) {
        this.output.style.display = 'none';
        util.addClass(this.hide, 'cmd_hidden');
        util.removeClass(this.show, 'cmd_hidden');

        ev.stopPropagation();
    },

    showOutput: function(ev) {
        this.output.style.display = 'block';
        util.removeClass(this.hide, 'cmd_hidden');
        util.addClass(this.show, 'cmd_hidden');

        ev.stopPropagation();
    },

    remove: function(ev) {
        this.cliInputView._table.removeChild(this.rowin);
        this.cliInputView._table.removeChild(this.rowout);
        ev.stopPropagation();
    },

    onRequestChange: function(ev) {
        this.duration.innerHTML = this.request.duration ?
            'completed in ' + (this.request.duration / 1000) + ' sec ' :
            '';

        this.typed.innerHTML = this.request.typed;

        this.output.innerHTML = '';
        this.request.outputs.forEach(function(output) {
            var node;
            if (typeof output == 'string') {
                node = document.createElement('p');
                node.innerHTML = output;
            } else {
                node = output;
            }
            this.output.appendChild(node);
        }, this);
        this.cliInputView.scrollToBottom();

        util.setClass(this.output, 'cmd_error', this.request.error);

        this.throb.style.display = this.request.completed ? 'none' : 'block';
    }
};

/**
 * Return an object which you can call (via a pointer member) to create a
 * RequestOutput.
 * This is designed for use with catalog.registerExtension as follows:
 * <pre>
 * var requestOutputHandler = requestOutput.createHandler(this);
 * catalog.registerExtension('addedRequestOutput', requestOutputHandler);
 * </pre>
 */
exports.createHandler = function(cliInputView) {
    return {
        pointer: function(source, key, request) {
            new exports.RequestOutput(request, cliInputView);
        }
    };
};

});

bespin.tiki.module("command_line:typehint",function(require,exports,module) {
/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Bespin.
 *
 * The Initial Developer of the Original Code is
 * Mozilla.
 * Portions created by the Initial Developer are Copyright (C) 2009
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Bespin Team (bespin@mozilla.com)
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

var catalog = require('bespin:plugins').catalog;
var console = require('bespin:console').console;
var Promise = require('bespin:promise').Promise;
var types = require('types:types');

var Hint = require('command_line:hint').Hint;
var Level = require('command_line:hint').Level;

/**
 * If there isn't a typehint to define a hint UI component then we just use the
 * default - a simple text node containing the description.
 */
function createDefaultHint(description) {
    var parent = document.createElement('article');
    parent.innerHTML = description;

    return new Hint(Level.Info, parent);
};

/**
 * resolve the passed promise by calling
 */
function getHintOrDefault(promise, input, assignment, ext, typeHint) {
    var hint;

    try {
        if (ext && typeof typeHint.getHint === 'function') {
            hint = typeHint.getHint(input, assignment, ext);
        }
    }
    catch (ex) {
        console.error('Failed to get hint for ', ext, ' reason: ', ex);
    }

    if (!hint) {
        hint = createDefaultHint(assignment.param.description);
    }

    promise.resolve(hint);
    return promise;
};

// Warning: These next 2 functions are virtually cut and paste from
// types:type.js
// If you change this, there are probably parallel changes to be made there
// There are 2 differences between the functions:
// - We lookup type|typehint in the catalog
// - There is a concept of a default typehint, where there is no similar
//   thing for types. This is sensible, because hints are optional nice
//   to have things. Not so for types.
// Whilst we could abstract out the changes, I'm not sure this simplifies
// already complex code

/**
 * Given a string, look up the type extension in the catalog
 * @param name The type name. Object type specs are not allowed
 * @returns A promise that resolves to a type extension
 */
function resolveObjectTypeHint(typeSpec) {
    var promise = new Promise();
    var ext = catalog.getExtensionByKey('typehint', typeSpec.name);
    promise.resolve({ ext: ext, typeSpec: typeSpec });
    return promise;
};

/**
 * Look-up a typeSpec and find a corresponding typehint extension. This function
 * does not attempt to load the typehint or go through the resolution process,
 * for that you probably want #resolveType()
 * @param typeSpec A string containing the type name or an object with a name
 * and other type parameters e.g. { name: 'selection', data: [ 'one', 'two' ] }
 * @return a promise that resolves to an object containing the resolved typehint
 * extension and the typeSpec used to resolve the type (which could be different
 * from the passed typeSpec if this was deferred). The object will be in the
 * form { ext:... typeSpec:... }
 */
function resolveTypeHintExt(typeSpec) {
    if (typeof typeSpec === 'string') {
        return resolveObjectTypeHint({ name: typeSpec });
    }

    if (typeof typeSpec === 'object') {
        if (typeSpec.name === 'deferred') {
            var promise = new Promise();
            types.undeferTypeSpec(typeSpec).then(function(newTypeSpec) {
                resolveTypeHintExt(newTypeSpec).then(function(reply) {
                    promise.resolve(reply);
                }, function(ex) {
                    promise.reject(ex);
                });
            });
            return promise;
        } else {
            return resolveObjectTypeHint(typeSpec);
        }
    }

    throw new Error('Unknown typeSpec type: ' + typeof typeSpec);
};

/**
 * Asynchronously find a UI component to match a typeSpec
 * @param input i.e. an instance of input#Input
 * @param assignment The last argument that we are hinting. Specifically it must
 * be an object with the following shape:
 * <tt>{ param: { type:.., description:... }, value:... }</tt>
 * Where:
 * <ul>
 * <li>value - Data typed for this parameter so far, by which the hint can be
 * customized, for example by reducing the options in a selection
 * <li>param - Structure like a param field from command meta-data:
 * <li>param.type - The data type for validation
 * <li>param.description - Description of the field for help purposes
 * </ul>
 * @return An object containing hint data { element:.., completion:... }
 * where <tt>element</tt> is a string / dom node / sc component and
 * <tt>completion</tt> (if set) is a string containing the only possible
 * outcome.
 * @see input#Input.assign() and input#Input.getAssignmentForLastArg()
 */
exports.getHint = function(input, assignment) {
    var promise = new Promise();
    var typeSpec = assignment.param.type;

    resolveTypeHintExt(typeSpec).then(function(data) {
        if (!data.ext) {
            return getHintOrDefault(promise, input, assignment);
        }

        data.ext.load().then(function(typeHint) {
            // We might need to resolve the typeSpec in a custom way
            if (typeof typeHint.resolveTypeSpec === 'function') {
                typeHint.resolveTypeSpec(data.ext, data.typeSpec).then(function() {
                    getHintOrDefault(promise, input, assignment, data.ext, typeHint);
                }, function(ex) {
                    promise.reject(ex);
                });
            } else {
                // Nothing to resolve - just go
                getHintOrDefault(promise, input, assignment, data.ext, typeHint);
            }
        }, function(ex) {
            hint = createDefaultHint(assignment.param.description);
            promise.resolve(hint);
        });
    });

    return promise;
};

});

bespin.tiki.module("command_line:index",function(require,exports,module) {

});

bespin.tiki.module("command_line:templates",function(require,exports,module) {

var templater = require('templater');

templater.compileAll({"requestOutput.htmlt": "\n<!-- The div for the input (i.e. what was typed) -->\n<div class=\"cmd_rowin\" save=\"${actions.rowin}\"\n    onclick=\"${actions.copyToInput}\"\n    ondblclick=\"${actions.executeRequest}\">\n\n  <!-- What the user actually typed -->\n  <div class=\"cmd_gt\">&gt; </div>\n  <div class=\"cmd_typed\" save=\"${actions.typed}\"></div>\n\n  <!-- The extra details that appear on hover -->\n  <div class=\"cmd_duration cmd_hover\" save=\"${actions.duration}\"></div>\n  <img class=\"cmd_hover\" onclick=\"${actions.hideOutput}\" save=\"${actions.hide}\"\n      alt=\"Hide command output\" src=\"${imagePath}/minus.png\"/>\n  <img class=\"cmd_hover cmd_hidden\" onclick=\"${actions.showOutput}\" save=\"${actions.show}\"\n      alt=\"Show command output\" src=\"${imagePath}/plus.png\"/>\n  <img class=\"cmd_hover\" onclick=\"${actions.remove}\"\n      alt=\"Remove this command from the history\" src=\"${imagePath}/closer.png\"/>\n\n</div>\n\n<!-- The div for the command output -->\n<div class=\"cmd_rowout\" save=\"${actions.rowout}\">\n  <div class=\"cmd_output\" save=\"${actions.output}\"></div>\n  <img src=\"${imagePath}/throbber.gif\" save=\"${actions.throb}\"/>\n</div>\n", "cli.htmlt": "\n<div class=\"cmd_line\" save=\"${cliInputView.element}\"\n    onfocus=\"${cliInputView._focusCheck}\" capturefocus=\"capturefocus\"\n    onblur=\"${cliInputView._focusCheck}\" captureblur=\"captureblur\"\n    onclick=\"${cliInputView.focus}\" captureclick=\"captureclick\">\n\n  <!-- The output area that changes height -->\n  <div class=\"cmd_tog stack_children\" save=\"${cliInputView._tog}\">\n\n    <div class=\"cmd_top\">\n      <!-- Side toolbar -->\n      <div class=\"cmd_toolbar\">\n        <img src=\"${imagePath}/dot_clear.gif\" class=\"cmd_pin check\"\n            alt=\"Pin/Unpin the console output\"\n            onclick=\"${cliInputView._togglePin}\"/>\n      </div>\n  \n      <!-- CLI output table -->\n      <div class=\"cmd_table\" save=\"${cliInputView._table}\"></div>\n    </div>\n\n    <!-- A div to hang hints on -->\n    <div class=\"cmd_hints\" save=\"${cliInputView._hints}\"></div>\n\n  </div>\n\n  <!-- The input area, with fixed height -->\n  <div class=\"cmd_cli\">\n\n    <!-- The prompt -->\n    <div class=\"cmd_prompt cmd_gt\">\n      <span class=\"cmd_brackets\">{ }</span> &gt;\n    </div>\n\n    <!-- Where you type commands -->\n    <div class=\"cmd_kbd stack_children\">\n      <div class=\"cmd_completion\" save=\"${cliInputView._completer}\"></div>\n      <div>\n        <input class=\"cmd_input\" type=\"text\" save=\"${cliInputView._inputer}\"/>\n      </div>\n    </div>\n\n  </div>\n\n</div>\n"}, exports);

});
;bespin.tiki.register("::environment", {
    name: "environment",
    dependencies: { "settings": "0.0.0" }
});
bespin.tiki.module("environment:index",function(require,exports,module) {
/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Bespin.
 *
 * The Initial Developer of the Original Code is
 * Mozilla.
 * Portions created by the Initial Developer are Copyright (C) 2009
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Bespin Team (bespin@mozilla.com)
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

"define metadata";
({
    "dependencies": {
        "settings": "0.0.0"
    }
});
"end";

var util = require('bespin:util/util');
var console = require('bespin:console').console;
var catalog = require("bespin:plugins").catalog;
var settings = require('settings').settings;

/**
 * The environment plays a similar role to the environment under unix.
 * Bespin does not currently have a concept of variables, (i.e. things the user
 * directly changes, however it does have a number of pre-defined things that
 * are changed by the system.
 * <p>The role of the Environment is likely to be expanded over time.
 */
exports.Environment = function() {
    // The current command line pushes this value into here
    this.commandLine = null;

    // Fire the sizeChanged event when the window is resized.
    window.addEventListener('resize', this.dimensionsChanged.bind(this), false);
};

Object.defineProperties(exports.Environment.prototype, {

    /**
     * Provides a get() and set() function to set and get settings.
     */
    settings: {
        value: {
            set: function(key, value) {
                if (util.none(key)) {
                    throw new Error('setSetting(): key must be supplied');
                }
                if (util.none(value)) {
                    throw new Error('setSetting(): value must be supplied');
                }

                settings.set(key, value);
            },
            
            get: function(key) {
                if (util.none(key)) {
                    throw new Error('getSetting(): key must be supplied');
                }
                return settings.get(key);
            }
        }
    },

    dimensionsChanged: {
        value: function() {
            catalog.publish(this, 'dimensionsChanged');
        }
    },

    /**
     * Retrieves the EditSession
     */
    session: {
        get: function() {
            return catalog.getObject('session');
        }
    },

    /**
     * Gets the currentView from the session.
     */
    view: {
        get: function() {
            if (!this.session) {
                // This can happen if the session is being reloaded.
                return null;
            }
            return this.session.currentView;
        }
    },

    /**
     * Gets the currentEditor from the session.
     */
    editor: {
        get: function() {
            if (!this.session) {
                // This can happen if the session is being reloaded.
                return null;
            }
            return this.session.currentView.editor;
        }
    },

    /**
     * Returns the currently-active syntax contexts.
     */
    contexts: {
        get: function() {
            // when editorapp is being refreshed, the textView is not available.
            if (!this.view) {
                return [];
            }

            var syntaxManager = this.view.editor.layoutManager.syntaxManager;
            var pos = this.view.getSelectedRange().start;
            return syntaxManager.contextsAtPosition(pos);
        }
    },

    /**
     * The current Buffer from the session
     */
    buffer: {
        get: function() {
            if (!this.session) {
                console.error("command attempted to get buffer but there's no session");
                return undefined;
            }
            return this.view.editor.buffer;
        }
    },

    /**
     * The current editor model might not always be easy to find so you should
     * use <code>instruction.model</code> to access the view where
     * possible.
     */
    model: {
        get: function() {
            if (!this.buffer) {
                console.error('Session has no current buffer');
                return undefined;
            }
            return this.view.editor.layoutManager.textStorage;
        }
    },

    /**
     * gets the current file from the session
     */
    file: {
        get: function() {
            if (!this.buffer) {
                console.error('Session has no current buffer');
                return undefined;
            }
            return this.buffer.file;
        }
    },

    /**
     * If files are available, this will get them. Perhaps we need some other
     * mechanism for populating these things from the catalog?
     */
    files: {
        get: function() {
            return catalog.getObject('files');
        }
    }
});

/**
 * The global environment used throughout this Bespin instance.
 */
exports.env = new exports.Environment();

});
;bespin.tiki.register("::ctags", {
    name: "ctags",
    dependencies: { "traits": "0.0.0", "underscore": "0.0.0" }
});
bespin.tiki.module("ctags:index",function(require,exports,module) {
/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Bespin.
 *
 * The Initial Developer of the Original Code is
 * Mozilla.
 * Portions created by the Initial Developer are Copyright (C) 2009
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Bespin Team (bespin@mozilla.com)
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

var _ = require('underscore')._;
var TagReader = require('./reader').TagReader;
var Trait = require('traits').Trait;

exports.Tags = function() {
    this.tags = [];
};

exports.Tags.prototype = Object.create(Object.prototype, Trait.compose(Trait({
    _search: function(id, pred) {
        var shadowTag = { name: id };
        var tags = this.tags;
        var index = _(tags).sortedIndex(shadowTag, function(tag) {
            return tag.name;
        });

        var start = index, end = index;
        while (start >= 0 && start < tags.length && pred(tags[start])) {
            start--;
        }
        while (end >= 0 && end < tags.length && pred(tags[end])) {
            end++;
        }

        return tags.slice(start + 1, end);
    },

    add: function(newTags) {
        var tags = this.tags;
        Array.prototype.push.apply(tags, newTags);

        tags.sort(function(a, b) {
            var nameA = a.name, nameB = b.name;
            if (nameA < nameB) {
                return -1;
            }
            if (nameA === nameB) {
                return 0;
            }
            return 1;
        });
    },

    /** Returns all the tags that match the given identifier. */
    get: function(id) {
        return this._search(id, function(tag) { return tag.name === id; });
    },

    /**
     * Adds the tags from the supplied JavaScript file to the internal store of
     * tags.
     */
    scan: function(src, file, opts) {
        if (opts === null || opts === undefined) {
            opts = {};
        }

        var lines = src.split("\n");
        var ast = parse(src, file, 1);

        var interp = new Interpreter(ast, file, lines, opts);
        interp.interpret();
        this.add(interp.tags);
    },

    /** Returns all the tags that begin with the given prefix. */
    stem: function(prefix) {
        var len = prefix.length;
        return this._search(prefix, function(tag) {
            return tag.name.substring(0, len) === prefix;
        });
    }
}), TagReader));


});

bespin.tiki.module("ctags:reader",function(require,exports,module) {
/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Bespin.
 *
 * The Initial Developer of the Original Code is
 * Mozilla.
 * Portions created by the Initial Developer are Copyright (C) 2009
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Bespin Team (bespin@mozilla.com)
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

var _ = require('underscore')._;
var Trait = require('traits').Trait;

exports.TagReader = Trait({
    readLines: function(lines) {
        var tags = [];

        _(lines).each(function(line) {
            var parts = line.split("\t");
            if (parts.length < 3) {
                return;
            }

            var name = parts[0];
            if (/^!_TAG_/.test(name)) {
                return;
            }

            // TODO: cope with tab characters in the addr
            var tag = { name: name, tagfile: parts[1], addr: parts[2] };

            var fieldIndex;
            if (parts.length > 3 && parts[3].indexOf(":") === -1) {
                tag.kind = parts[3];
                fieldIndex = 4;
            } else {
                fieldIndex = 3;
            }

            var fields = {};
            _(parts.slice(fieldIndex)).each(function(field) {
                var match = /^([^:]+):(.*)/.exec(field);
                fields[match[1]] = match[2];
            });
            tag.fields = fields;

            tags.push(tag);
        });

        this.add(tags);
    },

    readString: function(str) {
        this.readLines(str.split("\n"));
    }
});


});
;bespin.tiki.register("::templater", {
    name: "templater",
    dependencies: {  }
});
bespin.tiki.module("templater:index",function(require,exports,module) {
/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Bespin.
 *
 * The Initial Developer of the Original Code is
 * Mozilla.
 * Portions created by the Initial Developer are Copyright (C) 2009
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Bespin Team (bespin@mozilla.com)
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

"define metadata";
({});
"end";

// WARNING: do not 'use_strict' without reading the notes in environmentEval;

/**
 * Turn the template into a DOM node, resolving the ${} references to the data.
 * See docs/devguide/template.html.markdown for instructions on writing
 * templates.
 */
exports.processTemplate = function(template, data) {
    data = data || {};
    var parent = document.createElement('div');
    parent.innerHTML = template;
    processNode(parent, data);
    return parent;
};

/**
 * Recursive function to walk the tree processing the attributes as it goes.
 */
function processNode(node, data) {
    var recurse = true;
    // Process attributes
    if (node.attributes && node.attributes.length) {
        // It's good to clean up the attributes when we've processed them,
        // but if we do it straight away, we mess up the array index
        var attrs = Array.prototype.slice.call(node.attributes);
        for (var i = 0; i < attrs.length; i++) {
            var value = attrs[i].value;
            var name = attrs[i].name;

            if (name === 'save') {
                // Save attributes are a setter using the node
                value = stripBraces(value);
                property(value, data, node);
                node.removeAttribute(name);
            } else if (name === 'if') {
                value = stripBraces(value);
                try {
                    var reply = environmentEval(value, data);
                    recurse = !!reply;
                } catch (ex) {
                    console.error('Error with \'', value, '\'', ex);
                    recurse = false;
                }
                if (!recurse) {
                    node.parentNode.removeChild(node);
                }
                node.removeAttribute(name);
            } else if (name === 'foreach') {
                value = stripBraces(value);
                recurse = false;
                try {
                    var array = environmentEval(value, data);
                    array.forEach(function(param) {
                        var clone = node.cloneNode(true);
                        node.parentNode.insertBefore(clone, node);
                        data.param = param;
                        processChildren(clone, data);
                        delete data.param;
                    });
                    node.parentNode.removeChild(node);
                } catch (ex) {
                    console.error('Error with \'', value, '\'', ex);
                    recurse = false;
                }
                node.removeAttribute(name);
            } else if (name.substring(0, 2) === 'on') {
                // Event registration relies on property doing a bind
                value = stripBraces(value);
                var func = property(value, data);
                if (typeof func !== 'function') {
                    console.error('Expected ' + value +
                            ' to resolve to a function, but got ', typeof func);
                }
                node.removeAttribute(name);
                var capture = node.hasAttribute('capture' + name.substring(2));
                node.addEventListener(name.substring(2), func, capture);
            } else {
                // Replace references in other attributes
                var newValue = value.replace(/\$\{[^}]*\}/, function(path) {
                    return environmentEval(path.slice(2, -1), data);
                });
                // Remove '_' prefix of attribute names so the DOM won't try
                // to use them before we've processed the template
                if (name.indexOf('_') === 0) {
                    node.removeAttribute(name);
                    node.setAttribute(name.substring(1), newValue);
                } else if (value !== newValue) {
                    attrs[i].value = newValue;
                }
            }
        }
    }

    // Process child nodes
    if (recurse) {
        processChildren(node, data);
    }

    // Process TextNodes
    if (node.nodeType === 3) {
        // Replace references in other attributes
        value = node.textContent;
        // We can't use the string.replace() with function trick because we need
        // to support functions that return DOM nodes, so we can't have the
        // conversion to a string.
        // Instead we process the string as an array of parts. In order to split
        // the string up, we first replace ${ with \uF001$ and } with \uF002
        // We can then split using \uF001 or \uF002 to get an array of strings
        // where scripts are prefixed with $.
        // \uF001 and \uF002 are just unicode chars reserved for private use.
        value = value.replace(/\$\{([^}]*)\}/, '\uF001$$$1\uF002');
        var parts = value.split(/\uF001|\uF002/);
        if (parts.length > 1) {
            parts.forEach(function(part) {
                if (!part || part === '') {
                    return;
                }
                if (part.charAt(0) === '$') {
                    part = environmentEval(part.slice(1), data);
                }
                // Hmmm isDOMElement ...
                if (typeof part.cloneNode !== 'function') {
                    part = document.createTextNode(part.toString());
                }
                node.parentNode.insertBefore(part, node);
            });
            node.parentNode.removeChild(node);
        }
        newValue = value.replace(/\$\{[^}]*\}/, function(path) {
            return environmentEval(path.slice(2, -1), data);
        });
        if (value !== newValue) {
            node.textContent = newValue;
        }
    }
};

/**
 * Loop through the child nodes of the given node, calling processNode on them
 * all. Note this first clones the set of nodes, so the set of nodes that we
 * visit will be unaffected by additions or removals.
 * @param node The node from which to find children to visit.
 * @param data The data to pass to processNode
 */
function processChildren(node, data) {
    var children = Array.prototype.slice.call(node.childNodes);
    for (var i = 0; i < children.length; i++) {
        processNode(children[i], data);
    }
}

/**
 * Warn of string does not begin '${' and end '}'
 * @return The string stripped of ${ and }, or untouched if it does not match
 */
function stripBraces(str) {
    if (!str.match(/\$\{.*\}/)) {
        console.error('Expected ' + str + ' to match ${...}');
        return str;
    }
    return str.slice(2, -1);
}

/**
 * Combined getter and setter that works with a path through some data set.
 * For example:<ul>
 * <li>property('a.b', { a: { b: 99 }}); // returns 99
 * <li>property('a', { a: { b: 99 }}); // returns { b: 99 }
 * <li>property('a', { a: { b: 99 }}, 42); // returns 99 and alters the
 * input data to be { a: { b: 42 }}
 * </ul>
 * @param path An array of strings indicating the path through the data, or
 * a string to be cut into an array using <tt>split('.')</tt>
 * @param data An object to look in for the <tt>path</tt>
 * @param newValue (optional) If undefined, this value will replace the
 * original value for the data at the path specified.
 * @returns The value pointed to by <tt>path</tt> before any
 * <tt>newValue</tt> is applied.
 */
function property(path, data, newValue) {
    if (typeof path === 'string') {
        path = path.split('.');
    }
    var value = data[path[0]];
    if (path.length === 1) {
        if (newValue !== undefined) {
            data[path[0]] = newValue;
        }
        if (typeof value === 'function') {
            return value.bind(data);
        }
        return value;
    }
    if (!value) {
        console.error('Can\'t find path=', path, " in data=", data);
        return null;
    }
    return property(path.slice(1), value, newValue);
}

/**
 * Like eval, but that creates a context of the variables in <tt>env</tt> in
 * which the script is evaluated.
 * WARNING: This script uses 'with' which is generally regarded to be evil.
 * The alternative is to create a Function at runtime that takes X parameters
 * according to the X keys in the env object, and then call that function using
 * the values in the env object. This is likely to be slow, but workable.
 * @param script The string to be evaluated
 * @param env The environment in which to eval the script.
 * @returns The return value of the script
 */
function environmentEval(script, env) {
    with (env) {
        return eval(script);
    }
}

/**
 * Strip the extension off of a name
 */
function basename(name) {
    var lastDot = name.lastIndexOf('.');
    return name.substring(0, lastDot);
}

/**
 * "compiles" a template. with the current version of templating,
 * this just means making a function that is hanging onto the
 * template text.
 */
exports.compile = function(template) {
    return function(data) {
        return exports.processTemplate(template, data);
    };
};

/**
 * Compiles a collection of templates, returning a new object.
 * The object coming in should have keys that are the filenames of the
 * templates (including the extension) and the values are the templates
 * themselves. The result will have the extensions stripped off of the
 * keys, and the values will be callable functions that render the
 * template with the context provided.
 */
exports.compileAll = function(obj, mixInto) {
    if ("undefined" === typeof(mixInto)) {
        mixInto = {};
    }
    Object.keys(obj).forEach(function(name) {
        mixInto[basename(name)] = exports.compile(obj[name]);
    });
    return mixInto;
};

});
;bespin.tiki.register("::matcher", {
    name: "matcher",
    dependencies: {  }
});
bespin.tiki.module("matcher:index",function(require,exports,module) {
/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Bespin.
 *
 * The Initial Developer of the Original Code is
 * Mozilla.
 * Portions created by the Initial Developer are Copyright (C) 2009
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Bespin Team (bespin@mozilla.com)
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

/**
 * We ignore items whose score is more than <tt>excludeScoreMargin</tt> off
 * the <tt>maxScore</tt>.
 */
var excludeScoreMargin = 500;

/**
 * Base class for matching strategies.
 * @param query {string} The string that we match against.
 * This is the only member of a matcher that should be observed.
 * @constructor
 */
exports.Matcher = function(query) {
    if (arguments[0] === 'subclassPrototype') {
        return;
    }

    this._query = query;

    // Looks something like [ { item:{ name:'...' }, score:N }, ... ]
    this._scoredItems = [];

    // List of objects to be notified of changes.
    this._listeners = [];

    // We ignore items that are way off the pace. This is the pace.
    this._maxScore = null;
};

Object.defineProperties(exports.Matcher.prototype, {
    query: {
        get: function() {
            return this._query;
        },

        set: function(value) {
            this._query = value;
            var addedItems = [];
            this._scoredItems.forEach(function(scoredItem) {
                scoredItem.score = this.score(this._query, scoredItem.item);
                if (scoredItem.score > 0) {
                    addedItems.push(scoredItem.item);
                }
            }, this);

            this._callListeners('itemsCleared');
            this._callListeners('itemsAdded', addedItems);
        }
    },

    /**
     * Add a single item to be considered by this matcher
     */
    addItem: {
        value: function(item) {
            this.addItems([ item ]);
        }
    },

    /**
     * Add multiple items to be considered by this matcher.
     */
    addItems: {
        value: function(items) {
            var addedScoredItems = [];
            var maxScoreChanged = false;

            items.forEach(function(item) {
                var scoredItem = {
                    score: this.score(this._query, item),
                    item: item
                };
                if (scoredItem.score > 0) {
                    addedScoredItems.push(scoredItem);
                }
                if (scoredItem.score > this._maxScore) {
                    this._maxScore = scoredItem.score;
                    maxScoreChanged = true;
                }
                this._scoredItems.push(scoredItem);
            }, this);

            var itemsRemoved = false;
            if (maxScoreChanged) {
                // The max score has changed - this could mean that existing
                // entries are no longer relevant. Check
                this._scoredItems.forEach(function(scoredItem) {
                    if (scoredItem.score + excludeScoreMargin < this._maxScore) {
                        itemsRemoved = true;
                    }
                });
            }

            // TODO: There is a bug here in that listeners will not know how to
            // slot these matches into the previously notified matches (we're not
            // passing the score on).
            var sorter = function(a, b) {
                return b.score - a.score;
            };
            this._scoredItems.sort(sorter);
            addedScoredItems.sort(sorter);

            var scoredItems;
            if (itemsRemoved) {
                this._callListeners('itemsCleared');
                scoredItems = this._scoredItems;
            } else {
                scoredItems = addedScoredItems;
            }

            var addedItems = [];
            scoredItems.forEach(function(scoredItem) {
                if (scoredItem.score + excludeScoreMargin > this._maxScore) {
                    addedItems.push(scoredItem.item);
                }
            }.bind(this));
            this._callListeners('itemsAdded', addedItems);
        }
    },

    addListener: {
        value: function(listener) {
            this._listeners.push(listener);

            var items = [];
            this._scoredItems.forEach(function(scoredItem) {
                if (scoredItem.score > 0) {
                    items.push(scoredItem.item);
                }
            }, this);

            if (typeof listener.itemsAdded === 'function') {
                listener.itemsAdded(items);
            }
        }
    },

    _callListeners: {
        value: function() {
            var args = Array.prototype.slice.call(arguments);
            var method = args.shift();
            this._listeners.forEach(function(listener) {
                if (typeof listener[method] === 'function') {
                    listener[method].apply(null, args);
                }
            });
        }
    }
});

});

bespin.tiki.module("matcher:prefix",function(require,exports,module) {
/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Bespin.
 *
 * The Initial Developer of the Original Code is
 * Mozilla.
 * Portions created by the Initial Developer are Copyright (C) 2009
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Bespin Team (bespin@mozilla.com)
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

var Matcher = require('matcher').Matcher;

/**
 * Performs simple prefix matching.
 */
exports.PrefixMatcher = function(query) {
    Matcher.call(this, query);
};

exports.PrefixMatcher.prototype = new Matcher('subclassPrototype');

exports.PrefixMatcher.prototype.score = function(query, item) {
    var queryLen = query.length;
    if (queryLen > item.name.length) {
        return 0;
    }

    if (item.name.substring(0, queryLen).toLowerCase() === query.toLowerCase()) {
        return 1000 - item.name.length;
    }

    return 0;
};

});

bespin.tiki.module("matcher:quick",function(require,exports,module) {
/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Bespin.
 *
 * The Initial Developer of the Original Code is
 * Mozilla.
 * Portions created by the Initial Developer are Copyright (C) 2009
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Bespin Team (bespin@mozilla.com)
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

var Matcher = require('matcher').Matcher;

/**
 * Provides smart matching suitable for 'quick open' functionality.
 */
exports.QuickMatcher = function(query) {
    Matcher.call(this, query);
};

exports.QuickMatcher.prototype = new Matcher('subclassPrototype');

exports.QuickMatcher.prototype.score = function(query, item) {
    query = query.toLowerCase();
    var str = item.name.toLowerCase();
    var path = item.path ? item.path.toLowerCase() : null;

    // Name prefix match?
    if (str.substring(0, query.length) === query) {
        return 5000 - str.length;
    }

    // Path prefix match?
    if (path && path.substring(0, query.length) === query) {
        return 4000 - path.length;
    }

    // Name suffix match?
    if (str.substring(str.length - query.length, str.length) === query) {
        return 3000 - str.length;
    }

    // Full name fuzzy match?
    if (path) {
        str = path + str;
    }
    var queryChar = query.substring(0, 1);
    var queryIndex = 0;
    var score = 2000;

    for (var i = 0; i < str.length; i++) {
        if (str.substring(i, i + 1) === queryChar) {
            queryIndex++;

            // Have we found the whole query?
            if (queryIndex === query.length) {
                return score;
            }

            queryChar = query.substring(queryIndex, queryIndex + 1);
        } else if (queryIndex !== 0) {
            // Dock a point for every intervening character between the
            // first and last characters in the query.
            score--;
        }
    }

    // No match.
    return 0;
};

});
;bespin.tiki.register("::theme_manager", {
    name: "theme_manager",
    dependencies: { "theme_manager_base": "0.0.0", "settings": "0.0.0", "events": "0.0.0", "less": "0.0.0" }
});
bespin.tiki.module("theme_manager:index",function(require,exports,module) {
/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Bespin.
 *
 * The Initial Developer of the Original Code is
 * Mozilla.
 * Portions created by the Initial Developer are Copyright (C) 2009
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Bespin Team (bespin@mozilla.com)
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

var Promise = require('bespin:promise').Promise;
var catalog = require('bespin:plugins').catalog;
var Event = require('events').Event;
var themestyles = require('themestyles');
var settings = require('settings').settings;

// The current themeExt used on the page.
var currentThemeExt = null;

// Name of the themePlugin that is used as standard theme. This is not the
// base theme.
var standardThemeName = null;

// Load promise for the basePlugin.
var basePluginLoadPromise = null;

// Export the themeStyles object. This is necessary, as in some cases you want
// to access the themeStyles object when the `themeChange` event was fired.
exports.themestyles = themestyles;

exports.themeSettingChanged = function(source, settingName, themeName) {
    // Get the themeExtensionPoint for 'themeName'
    var themeExt = catalog.getExtensionByKey('theme', themeName);

    // 'themeName' === standard : Remove the current set theme.
    // !themeName || !themeExt  : The named theme couldn't get found
    if (themeName === 'standard' || !themeName || !themeExt) {
        themeExt = null;
        // If a standardTheme is given, try to get it.
        if (standardThemeName !== null) {
            themeExt = catalog.getExtensionByKey('theme', standardThemeName);

        }
    }

    // If no theme should get applied (including no standardTheme).
    if (!themeExt) {
        // If there is a currentTheme before switching to 'standard' which means
        // removing the currentTheme as applied on the page.
        if (currentThemeExt) {
            // There might be a themeStyle file to remove.
            themestyles.unregisterThemeStyles(currentThemeExt);

            currentThemeExt = null;

            // Reset the themeVariables applied by the theme.
            themestyles.currentThemeVariables = null;

            // Update the globalVariables.
            themestyles.parseGlobalVariables();

            // Reparse all the applied themeStyles.
            themestyles.reparse();

            // Publish the 'themeChange' event.
            catalog.publish(this, 'themeChange');
        }
        return;
    } else {
        themeExt.load().then(function(theme) {
            // Remove the former themeStyle file, if the former extension has
            // one declaired.
            if (currentThemeExt) {
                themestyles.unregisterThemeStyles(currentThemeExt);
            }

            // The theme is a function. Execute it to get the themeData.
            themestyles.currentThemeVariables = theme();

            // Store the data for later use.
            currentThemeExt = themeExt;

            // Update the globalVariables.
            themestyles.parseGlobalVariables();

            // Reparse all the applied themeStyles.
            themestyles.reparse();

            // If the theme has a url that points to a themeStyles file, then
            // register it.
            if (themeExt.url) {
                themestyles.registerThemeStyles(themeExt);
            }

            // Publish the 'themeChange' event.
            catalog.publish(exports, 'themeChange');
        });
    }
};

catalog.registerExtension('settingChange', {
    match: "theme",
    pointer: exports.themeSettingChanged.bind(exports)
});

/**
 * Sets the standard theme that is used when no other theme is specified or
 * the specified theme is not around.
 */
exports.setStandardTheme = function(themeName) {
    standardThemeName = themeName;

    // If the current theme is equal to themeName, then the theme is already
    // applied. Otherwise, call themeSttingChanged which handles the standard-
    // theme change then.
    if (themeName !== settings.get('theme')) {
        exports.themeSettingChanged(this);
    }
};

/**
 * Sets the plugin that should get treated as 'basePlugin'. BasePlugins contains
 * the generic theming for buttons, inputs, panes etc.
 */
exports.setBasePlugin = function(pluginName) {
    // Set the basePlugin.
    themestyles.basePluginName = pluginName;
};

/**
 * This function has to be called to enable parsing. Before calling this
 * function, parsing is prevented. This allows the developer to prevent parsing
 * until certain basic theme plugins are loaded.
 * Returns a promise that is resolved after all currently applied themeStyles
 * are parsed.
 */
exports.startParsing = function() {
    // Allow the parsing.
    themestyles.preventParsing = false;

    // Reparse all the applied themeStyles.
    return themestyles.reparse();
};

exports.registerTheme = function(extension) {
    var currentThemeName = settings.get('theme');
    if (extension.name === currentThemeName) {
        exports.themeSettingChanged(this, 'theme', extension.name);
    }
};

exports.unregisterTheme = function(extension) {
    if (extension.name === settings.get('theme')) {
        exports.themeSettingChanged(this);
    }
};

// Called when the app is launched.
exports.appLaunched = function() {
    // Fire the `themeChange` event as some plugins might haven't triggered it
    // during the launch of the app.
    catalog.publish(exports, 'themeChange');
};

});

bespin.tiki.module("theme_manager:themestyles",function(require,exports,module) {
/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Bespin.
 *
 * The Initial Developer of the Original Code is
 * Mozilla.
 * Portions created by the Initial Developer are Copyright (C) 2009
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Bespin Team (bespin@mozilla.com)
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

var util = require('bespin:util/util');
var catalog = require('bespin:plugins').catalog;
var console = require('bespin:console').console;
var Promise = require('bespin:promise').Promise;
var group = require('bespin:promise').group;

var proxy = require('bespin:proxy');

var less = require('less');

// The less parser to use.
var lessParser = new less.Parser({ optimization: 3 });

// The incremented styleID number.
var styleID = 1;

// The theme variables as set by the current theme.
exports.currentThemeVariables = null;

// The plugin that should get applied before any other plugins get applied.
exports.basePluginName = null;

// If true, no less file is parsed.
exports.preventParsing = true;

// Stores the variableHeader used by every themeStyleFile for the global
// ThemeVariables.
var globalVariableHeader = '';

// The globalThemeVariables as a combination of the build in once and variables
// defined in a custom theme plugin.
exports.globalThemeVariables = {};

// Stores the internal styleID used with a extension.
var extensionStyleID = {};

// Stores the ThemeStyleFiles' content per plugin - somewhat like a par plugin
// themeStyle cache.
var extensionStyleData = {};

// Takes an JS object that and makes it 'linear'. Every item gets prefixed with
// 'global':
//
//      globalValues = {
//          a: {
//              b: 'test'
//          }
//      }
//
//      returns: { 'global_a_b': 'test' }
var parseGlobalThemeVariables = function(globalValues) {
    var ret = {};
    var nameStack = [];

    var parseSub = function(name, key) {
        nameStack.push(name);
        if (typeof key != 'object') {
            ret[nameStack.join('_')] = key;
        } else {
            for (prop in key) {
                parseSub(prop, key[prop]);
            }
        }
        nameStack.pop();
    };

    parseSub('global', globalValues);
    return ret;
};

//------------------------------------------------------------------------------
// BEGIN: THIS PART IS OVERRIDDEN BY dryice

// Stores the StyleFiles content per plugin during the build of Bespin.
// The variable scheme looks like: { pluginName: { "fileName": data } };
var extensionStyleBuildData = {};

// Stores the default globalTheme ThemeVariables, that are available to every
// ThemeStyleFile.
var defaultGlobalTheme = {
    // standard font.
    font:           'arial, lucida, helvetica, sans-serif',
    // standard font size.
    font_size:      '14px',
    // standard line_height.
    line_height:    '1.8em',
    // text color.
    color:          '#DAD4BA',

    text_shadow:    '1px 1px rgba(0, 0, 0, 0.4)',
    // text error color.
    error_color:    '#F99',
    // the color for headers (<h1> etc).
    header_color:   'white',
    // the color for links.
    link_color:     '#ACF',

    // Basic colors for a controller: textInput, tree etc.
    control: {
        color:          '#E1B41F',
        border:         '1px solid rgba(0, 0, 0, 0.2)',
        border_radius:  '0.25em',
        background:     'rgba(0, 0, 0, 0.2)',

        active: {
            color:          '#FF9600',
            border:         '1px solid #E1B41F',
            inset_color:    '#ff9600',
            background:     'rgba(0, 0, 0, 0.2)'
        }
    },

    pane: {
        h1: {
           font:        "'MuseoSans', Helvetica",
           font_size:   '2.8em',
           color:       "white"
        },

        color:          '#DAD4BA',
        text_shadow:    '1px 1px rgba(0, 0, 0, 0.4)',

        link_color:     'white',

        background:     '#45443C',
        border_radius:  '.5em'
    },

    form: {
        color: 'white',
        text_shadow: '1px 1px rgba(0, 0, 0, 0.4)',

        font: "'Lucida Sans','Lucida Grande',Verdana,Arial,sans-serif",
        font_size: '@global_font_size',
        line_height: '@global_line_height'
    },

    button: {
        color: 'white',
        background: '#3E6CB9'
    },

    container: {
        background:     '#1E1916',
        border:         '1px solid black'
    },

    // The items in the command line menu or something else,
    // that can get selected.
    selectable: {
        color:          'white',
        border:         '0px solid transparent',
        background:     'transparent',

        active: {
            color:          'black',
            border:         '0px solid transparent',
            background:     '#FF8E00'
        },

        hover: {
            color:          'black',
            border:         '0px solid transparent',
            background:     '#FF8E00'
        }
    },

    // A small hint text.
    hint: {
        color:          '#AAA',

        active: {
            color:      'black'
        },

        hover: {
            color:      'black'
        }
    },

    // E.g. in the command line menu, the 'ALT+2'.
    accelerator: {
        color:          '#996633',

        active: {
            color:      'black'
        },

        hover: {
            color:      'black'
        }
    },

    menu: {
        border_color:           'black',
        inset_color_right:      '#1E1916',
        inset_color_top_left:   '#3E3936',
        background:             'transparent'
    }
};

defaultGlobalTheme = parseGlobalThemeVariables(defaultGlobalTheme);

// END: THIS PART IS OVERRIDDEN BY dryice
//------------------------------------------------------------------------------

/**
 * Returns an object with all the themeVariables value for a given plugin.
 */
exports.getPluginThemeVariables = function(pluginName) {
    var plugin = catalog.plugins[pluginName];

    if (!plugin) {
        return null;
    }

    // Hash to look for custom theme variables.
    var themeVariables = {};
    if (exports.currentThemeVariables &&
            exports.currentThemeVariables[pluginName]) {
        themeVariables = exports.currentThemeVariables[pluginName];
    }

    // Set the value for all themeVariables in this plugin.
    plugin.provides.forEach(function(ext) {
        if (ext.ep === 'themevariable') {
            var value = ext.name;
            // The value is the customThemeVariable OR the defaultValue if the
            // customThemeVariable is not given.
            themeVariables[value] = themeVariables[value] || ext.defaultValue;
        }
    });

    return themeVariables;
};

/**
 * Update the globalThemeVariables. This is called whenever the theme changes.
 */
exports.parseGlobalVariables = function() {
    var globalObj = {};
    var globalHeader = '';
    var currentThemeVariables = exports.currentThemeVariables;

    util.mixin(globalObj, defaultGlobalTheme);

    if (currentThemeVariables  && currentThemeVariables['global']) {
        util.mixin(globalObj,
                    parseGlobalThemeVariables(currentThemeVariables['global']));
    }

    exports.globalThemeVariables = globalObj;

    for (prop in globalObj) {
        globalHeader += '@' + prop + ':' + globalObj[prop] + ';';
    }

    globalVariableHeader = globalHeader;
};

// Parse the globalThemeVariables.
exports.parseGlobalVariables();

/**
 * Parse one less files.
 */
var parseLess = function(pr, pluginName, variableHeader) {
    // Use already existing DOM style element or create a new one on the page.
    if (extensionStyleID[pluginName]) {
        styleElem = document.getElementById('_bespin_theme_style_' +
                                                extensionStyleID[pluginName]);
    } else {
        styleElem = document.createElement('style');
        styleElem.setAttribute('id', '_bespin_theme_style_' + styleID);
        extensionStyleID[pluginName] = styleID;
        styleID ++;
        document.body.appendChild(styleElem);
    }

    // DEBUG ONLY.
    // var timer = new Date();

    // Parse the data.
    var dataToParse = globalVariableHeader + // global ThemeVariables
                            variableHeader + // plugin specific ThemeVariables
                            extensionStyleData[pluginName]; // and the data
    lessParser.parse(dataToParse, function(e, tree) {
        var errMsg;
        if (e) {
            errMsg = 'Error less parsing ' +  pluginName + ' ' +  e.message;
            console.error(errMsg);
            pr.reject(errMsg);
            return;
        }

        try {
            var css = tree.toCSS();

            // DEBUG ONLY.
            // console.log('  parsing took: ', (new Date()) - timer, 'ms');
        } catch (e) {
            errMsg = 'Error less parsing ' + pluginName + ' ' + e;
            console.error(errMsg);
            pr.reject(errMsg);
            return;
        }

        // Add the parsed CSS content in the styleElement.
        if (styleElem && styleElem.firstChild) {
            styleElem.firstChild.textContent = css;
        } else {
            var cssContentNode = document.createTextNode(css);
            styleElem.appendChild(cssContentNode);
        }
        pr.resolve();
    });
};

// Queue with all the plugins waiting to get updated.
var parseQueue = {};

/**
 * Parse the less files for a entire plugin. The plugin is not parsed directly,
 * but with a small delay. Otherwise it could happen that the plugin is parsed
 * although not all themeVariables are available.
 * Returns a promise that is resolved after the plugin is successfully parsed.
 * An error during parsing rejects the promise.
 */
exports.parsePlugin = function(pluginName) {
    // Parse only if this is permitted.
    if (exports.preventParsing) {
        return (new Promise).resolve();
    }

    var plugin = catalog.plugins[pluginName];

    if (!plugin) {
        throw "reparsePlugin: plugin " + pluginName + " is not defined!";
    }

    // Start parsing only if it isn't started already.
    if (!parseQueue[pluginName]) {
        // Mark that the plugin is queued.
        parseQueue[pluginName] = new Promise();

        setTimeout(function() {
            // DEBUG ONLY:
            // console.log('=== Parse Plugin: ' + pluginName + ' ===');
            // var time = new Date();

            var themeVariables = exports.getPluginThemeVariables(pluginName);

            // Store the StyleVariables for the StyleData to parse.
            var variableHeader = '';

            for (prop in themeVariables) {
                variableHeader += '@' + prop + ':' + themeVariables[prop] + ';';
            }

            // DEBUG ONLY:
            // console.log('  variables: ', variableHeader, globalVariableHeader);

            var parsePr = new Promise;
            parsePr.then(function(data) {
                parseQueue[this.name].resolve(data);
                parseQueue[this.name] = null;
            }.bind(this), function() {
                parseQueue[this.name].reject(data);
                parseQueue[this.name] = null;
            }.bind(this))

            parseLess(parsePr, pluginName, variableHeader);

            // DEBUG ONLY:
            // console.log('everything took: ', (new Date()) - time, 'ms');
        }.bind(plugin), 0);
    }

    return parseQueue[pluginName];
};

// Function that pocesses the loaded StyleFile content.
var processStyleContent = function(resourceURL, pluginName, data, p) {
    // Convert url(something) to url(resourceURL/something).
    data = data.replace(/url\(['"]*([^'")]*)(['"]*)\)/g,
                                      'url(' + resourceURL + '$1)');
    extensionStyleData[pluginName] += data;

    // Resolve the promise when given.
    if (p) {
        p.resolve();
    }
};

var themeDataLoadPromise = null;

exports.registerThemeStyles = function(extension) {
    var pluginName = extension.getPluginName();
    var resourceURL = catalog.getResourceURL(pluginName);

    // Make the extension.url parameter an array if it isn't yet.
    if (!(extension.url instanceof Array)) {
        extension.url = [ extension.url ];
    }

    // (Re)set the loaded StyleData for the plugin.
    extensionStyleData[pluginName] = '';

    var loadPromises = [];

    var preventParsing = exports.preventParsing;

    // Load the StyleFiles.
    extension.url.forEach(function(styleFile) {
        if (extensionStyleBuildData[pluginName] &&
                extensionStyleBuildData[pluginName][styleFile]) {
            // Process the StyleContent.
            processStyleContent(resourceURL, pluginName,
                                extensionStyleBuildData[pluginName][styleFile]);
        } else {
            var p = new Promise();
            loadPromises.push(p);

            var url = resourceURL + styleFile + '?' + (new Date).getTime();
            proxy.xhr('GET', url, true, function(xhr) {
                xhr.overrideMimeType('text/plain');
            }).then(function(response) {
                  processStyleContent(resourceURL, pluginName, response, p);
            }, function(err) {
                console.error('registerLessFile: Could not load ' +
                        resourceURL + styleFile);

                // The file couldn't get loaded but to make the group
                // work we have to mark this loadPromise as resolved so that
                // at least the other sucessfully loaded files can get
                // proceeded.
                p.resolve();
            });
        }
    });

    if (loadPromises.length === 0) {
        exports.parsePlugin(pluginName);
    } else {
        // If parsing is allowed, then wait until all the styleFiles are loaded
        // and parse the plugin.
        if (!preventParsing) {
            group(loadPromises).then(function() {
                exports.parsePlugin(pluginName);
            });
        }

        if (themeDataLoadPromise !== null) {
            loadPromises = loadPromises.concat(themeDataLoadPromise);
        }
        themeDataLoadPromise = group(loadPromises);
    }
};

/**
 * Call this function to reparse all the ThemeStyles files.
 * Returns a promise. The promise is resolved after all themeStyles are reparsed.
 */
exports.reparse = function() {
    var pr = new Promise();

    // Reparse only if this is permitted.
    if (exports.preventParsing) {
        return pr.resolve();
    }

    // Reparsing makes only sense if there is a themeDataLoadPromise.
    // If the value is null, then no styleFile was loaded and there is nothing
    // to reparse.
    if (themeDataLoadPromise) {
        // When all the styleFiles are loaded.
        themeDataLoadPromise.then(function() {
            var parsePromises = [];

            // Reparese all the themeStyles. Instead of loading the themeStyles
            // again from the server, the cache extensionStyleData is used.
            // Every plugin in this cache is reparsed.

            // Check if a basePlugin is set and parse this one first.
            var basePluginName = exports.basePluginName;
            if (basePluginName !== null && extensionStyleData[basePluginName]) {
                parsePromises.push(exports.parsePlugin(basePluginName));
            }

            // Parse the other plugins.
            for (var pluginName in extensionStyleData) {
                // Skip the basePlugin as this is already parsed.
                if (pluginName === basePluginName) {
                    continue;
                }
                parsePromises.push(exports.parsePlugin(pluginName));
            }

            // After all themeStyles are parsed, resolve the returned promise.
            group(parsePromises).then(pr.resolve.bind(pr), pr.reject.bind(pr));
        }, function(err) {
            pr.reject(err);
        });
    } else {
        pr.resolve();
    }
    return pr;
};

/**
 * Unregister a themeStyle.
 * @param The extension to unregister.
 */
exports.unregisterThemeStyles = function(extension) {
    var pluginName = extension.getPluginName();
    if (!extensionStyleID[pluginName]) {
        return;
    }

    // Remove the style element from the page.
    var styleID = '_bespin_theme_style_' + extensionStyleID[pluginName];
    var styleElement = document.getElementById(styleID);
    styleElement.parentNode.removeChild(styleElement);

    // Remove the style reference.
    delete extensionStyleID[pluginName];
    // Remove the themeStyle cache.
    delete extensionStyleData[pluginName];
};

});
;bespin.tiki.register("::whitetheme", {
    name: "whitetheme",
    dependencies: { "theme_manager": "0.0.0" }
});
bespin.tiki.module("whitetheme:index",function(require,exports,module) {
/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Bespin.
 *
 * The Initial Developer of the Original Code is
 * Mozilla.
 * Portions created by the Initial Developer are Copyright (C) 2009
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Bespin Team (bespin@mozilla.com)
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

exports.whiteTheme = function() {
    return {
        global: {
            // Standard font.
            font:           'arial, lucida, helvetica, sans-serif',
            // Standard font size.
            font_size:      '14px',
            // Standard line_height.
            line_height:    '1.8em',
            // Text color.
            color:          '#2E2E3D',
            // Text shadow css attribute.
            text_shadow:    '1px 1px white',
            // Text error color.
            error_color:    '#C03A38',
            // The color for headers (<h1> etc).
            header_color:   '#222222',
            // The color for links.
            link_color:     '#597BAC',

            // Variables for a pane - e.g. the login pane.
            pane: {
                h1: {
                   font:        "'MuseoSans', Helvetica",
                   font_size:   '2.8em',
                   color:       "#2C3480"
                },

                link_color:     '@global_link_color',

                background:     '#DFDFDF',
                border_radius:  '.5em',

                color:          '#2E2E3D',
                text_shadow:    '1px 1px #DDD'
            },

            // Variables for a html form.
            form: {
                font: "@global_font",
                font_size: '@global_font_size',
                line_height: '@global_line_height',

                color: 'black',
                text_shadow: '0px 0px transparent'
            },

            // Variables for a controller: textInput, tree etc.
            control: {
                color:          '#222',
                border:         '1px solid rgba(0, 0, 0, 0.2)',
                border_radius:  '0.25em',
                background:     'rgba(0, 0, 0, 0.1)',

                active: {
                    color:          '#000',
                    border:         '1px solid #597BAC',
                    inset_color:    '#597BAC',
                    background:     'rgba(0, 0, 0, 0.1)'
                }
            },

            // Variables for html buttons.
            button: {
                color: 'white',
                background: '#3E6CB9'
            },

            // Variables for the containers.
            container: {
                background:     '#F8F8F8',
                border:         '1px solid black'
            },

            // Variables for a menu - e.g. the command line menu.
            menu: {
                border_color:   'black',
                inset_color:    '#999',
                background:     'transparent'
            },

            // Variables for elements that can get selected - e.g. the items
            // in the command line menu.
            selectable: {
                color:          'black',
                border:         '0px solid transparent',
                background:     'transparent',

                active: {
                    color:          'white',
                    border:         '0px solid transparent',
                    background:     '#6780E4'
                },

                hover: {
                    color:          'white',
                    border:         '0px solid transparent',
                    background:     '#6780E4'
                }
            },

            // Variables for hint text.
            hint: {
                color:          '#78788D',

                active: {
                    color:      'white'
                },

                hover: {
                    color:      'white'
                }
            },

            // Variables for accelerator (the text that holds the key short cuts
            // like ALT+2).
            accelerator: {
                color:          '#344DB1',

                active: {
                    color:      'white'
                },

                hover: {
                    color:      'white'
                }
            }
        },

        text_editor: {
            // Variables for the gutter.
            gutter: {
                color: '#888888',
                backgroundColor: '#d2d2d2'
            },

            // Variables for the editor.
            editor: {
                color: '#3D3D3D',
                backgroundColor: '#ffffff',

                cursorColor: '#000000',
                selectedTextBackgroundColor: '#BDD9FC',

                unfocusedCursorColor: '#57A1FF',
                unfocusedCursorBackgroundColor: '#D9E9FC'
            },

            // Variables for the syntax highlighter.
            highlighterFG: {
                plain:     '#030303',
                comment:   '#919191',
                directive: '#999999',
                error:      '#ff0000',
                identifier: '#A7379F',
                keyword:    '#1414EF',
                operator:   '#477ABE',
                string:     '#017F19',
                addition:   '#ffffff',
                deletion:   '#ffffff'
            },

            highlighterBG: {
                plain:      '#ffffff',
                addition:   '#008000',
                deletion:   '#800000'
            },

            // Variables for the scrollers.
            scroller: {
                padding: 5,
                thickness: 17,

                backgroundStyle: "#2A211C",

                fullAlpha: 1.0,
                particalAlpha: 0.3,

                nibStyle: "rgb(150, 150, 150)",
                nibArrowStyle: "rgb(255, 255, 255)",
                nibStrokeStyle: "white",

                trackFillStyle: "rgba(50, 50, 50, 0.2)",
                trackStrokeStyle: "rgb(150, 150, 150)",

                barFillStyle: "rgb(60, 60, 60)",
                barFillGradientTopStart: "rgb(150, 150, 150)",
                barFillGradientTopStop: "rgb(100, 100, 100)",
                barFillGradientBottomStart: "rgb(82, 82, 82)",
                barFillGradientBottomStop: "rgb(104, 104, 104)"
            }
        }
    };
};

});
;bespin.tiki.register("::jquery", {
    name: "jquery",
    dependencies: {  }
});
bespin.tiki.module("jquery:index",function(require,exports,module) {
"define metadata";
({});
"end";

/*!
 * jQuery JavaScript Library v1.4.2
 * http://jquery.com/
 *
 * Copyright 2010, John Resig
 * Dual licensed under the MIT or GPL Version 2 licenses.
 * http://jquery.org/license
 *
 * Includes Sizzle.js
 * http://sizzlejs.com/
 * Copyright 2010, The Dojo Foundation
 * Released under the MIT, BSD, and GPL Licenses.
 *
 * Date: Sat Feb 13 22:33:48 2010 -0500
 */

// Define a local copy of jQuery
var jQuery = function( selector, context ) {
		// The jQuery object is actually just the init constructor 'enhanced'
		return new jQuery.fn.init( selector, context );
	},

	// Map over jQuery in case of overwrite
	_jQuery = window.jQuery,

	// Map over the $ in case of overwrite
	_$ = window.$,

	// Use the correct document accordingly with window argument (sandbox)
	document = window.document,

	// A central reference to the root jQuery(document)
	rootjQuery,

	// A simple way to check for HTML strings or ID strings
	// (both of which we optimize for)
	quickExpr = /^[^<]*(<[\w\W]+>)[^>]*$|^#([\w-]+)$/,

	// Is it a simple selector
	isSimple = /^.[^:#\[\.,]*$/,

	// Check if a string has a non-whitespace character in it
	rnotwhite = /\S/,

	// Used for trimming whitespace
	rtrim = /^(\s|\u00A0)+|(\s|\u00A0)+$/g,

	// Match a standalone tag
	rsingleTag = /^<(\w+)\s*\/?>(?:<\/\1>)?$/,

	// Keep a UserAgent string for use with jQuery.browser
	userAgent = navigator.userAgent,

	// For matching the engine and version of the browser
	browserMatch,
	
	// Has the ready events already been bound?
	readyBound = false,
	
	// The functions to execute on DOM ready
	readyList = [],

	// The ready event handler
	DOMContentLoaded,

	// Save a reference to some core methods
	toString = Object.prototype.toString,
	hasOwnProperty = Object.prototype.hasOwnProperty,
	push = Array.prototype.push,
	slice = Array.prototype.slice,
	indexOf = Array.prototype.indexOf;

jQuery.fn = jQuery.prototype = {
	init: function( selector, context ) {
		var match, elem, ret, doc;

		// Handle $(""), $(null), or $(undefined)
		if ( !selector ) {
			return this;
		}

		// Handle $(DOMElement)
		if ( selector.nodeType ) {
			this.context = this[0] = selector;
			this.length = 1;
			return this;
		}
		
		// The body element only exists once, optimize finding it
		if ( selector === "body" && !context ) {
			this.context = document;
			this[0] = document.body;
			this.selector = "body";
			this.length = 1;
			return this;
		}

		// Handle HTML strings
		if ( typeof selector === "string" ) {
			// Are we dealing with HTML string or an ID?
			match = quickExpr.exec( selector );

			// Verify a match, and that no context was specified for #id
			if ( match && (match[1] || !context) ) {

				// HANDLE: $(html) -> $(array)
				if ( match[1] ) {
					doc = (context ? context.ownerDocument || context : document);

					// If a single string is passed in and it's a single tag
					// just do a createElement and skip the rest
					ret = rsingleTag.exec( selector );

					if ( ret ) {
						if ( jQuery.isPlainObject( context ) ) {
							selector = [ document.createElement( ret[1] ) ];
							jQuery.fn.attr.call( selector, context, true );

						} else {
							selector = [ doc.createElement( ret[1] ) ];
						}

					} else {
						ret = buildFragment( [ match[1] ], [ doc ] );
						selector = (ret.cacheable ? ret.fragment.cloneNode(true) : ret.fragment).childNodes;
					}
					
					return jQuery.merge( this, selector );
					
				// HANDLE: $("#id")
				} else {
					elem = document.getElementById( match[2] );

					if ( elem ) {
						// Handle the case where IE and Opera return items
						// by name instead of ID
						if ( elem.id !== match[2] ) {
							return rootjQuery.find( selector );
						}

						// Otherwise, we inject the element directly into the jQuery object
						this.length = 1;
						this[0] = elem;
					}

					this.context = document;
					this.selector = selector;
					return this;
				}

			// HANDLE: $("TAG")
			} else if ( !context && /^\w+$/.test( selector ) ) {
				this.selector = selector;
				this.context = document;
				selector = document.getElementsByTagName( selector );
				return jQuery.merge( this, selector );

			// HANDLE: $(expr, $(...))
			} else if ( !context || context.jquery ) {
				return (context || rootjQuery).find( selector );

			// HANDLE: $(expr, context)
			// (which is just equivalent to: $(context).find(expr)
			} else {
				return jQuery( context ).find( selector );
			}

		// HANDLE: $(function)
		// Shortcut for document ready
		} else if ( jQuery.isFunction( selector ) ) {
			return rootjQuery.ready( selector );
		}

		if (selector.selector !== undefined) {
			this.selector = selector.selector;
			this.context = selector.context;
		}

		return jQuery.makeArray( selector, this );
	},

	// Start with an empty selector
	selector: "",

	// The current version of jQuery being used
	jquery: "1.4.2",

	// The default length of a jQuery object is 0
	length: 0,

	// The number of elements contained in the matched element set
	size: function() {
		return this.length;
	},

	toArray: function() {
		return slice.call( this, 0 );
	},

	// Get the Nth element in the matched element set OR
	// Get the whole matched element set as a clean array
	get: function( num ) {
		return num == null ?

			// Return a 'clean' array
			this.toArray() :

			// Return just the object
			( num < 0 ? this.slice(num)[ 0 ] : this[ num ] );
	},

	// Take an array of elements and push it onto the stack
	// (returning the new matched element set)
	pushStack: function( elems, name, selector ) {
		// Build a new jQuery matched element set
		var ret = jQuery();

		if ( jQuery.isArray( elems ) ) {
			push.apply( ret, elems );
		
		} else {
			jQuery.merge( ret, elems );
		}

		// Add the old object onto the stack (as a reference)
		ret.prevObject = this;

		ret.context = this.context;

		if ( name === "find" ) {
			ret.selector = this.selector + (this.selector ? " " : "") + selector;
		} else if ( name ) {
			ret.selector = this.selector + "." + name + "(" + selector + ")";
		}

		// Return the newly-formed element set
		return ret;
	},

	// Execute a callback for every element in the matched set.
	// (You can seed the arguments with an array of args, but this is
	// only used internally.)
	each: function( callback, args ) {
		return jQuery.each( this, callback, args );
	},
	
	ready: function( fn ) {
		// Attach the listeners
		jQuery.bindReady();

		// If the DOM is already ready
		if ( jQuery.isReady ) {
			// Execute the function immediately
			fn.call( document, jQuery );

		// Otherwise, remember the function for later
		} else if ( readyList ) {
			// Add the function to the wait list
			readyList.push( fn );
		}

		return this;
	},
	
	eq: function( i ) {
		return i === -1 ?
			this.slice( i ) :
			this.slice( i, +i + 1 );
	},

	first: function() {
		return this.eq( 0 );
	},

	last: function() {
		return this.eq( -1 );
	},

	slice: function() {
		return this.pushStack( slice.apply( this, arguments ),
			"slice", slice.call(arguments).join(",") );
	},

	map: function( callback ) {
		return this.pushStack( jQuery.map(this, function( elem, i ) {
			return callback.call( elem, i, elem );
		}));
	},
	
	end: function() {
		return this.prevObject || jQuery(null);
	},

	// For internal use only.
	// Behaves like an Array's method, not like a jQuery method.
	push: push,
	sort: [].sort,
	splice: [].splice
};

// Give the init function the jQuery prototype for later instantiation
jQuery.fn.init.prototype = jQuery.fn;

jQuery.extend = jQuery.fn.extend = function() {
	// copy reference to target object
	var target = arguments[0] || {}, i = 1, length = arguments.length, deep = false, options, name, src, copy;

	// Handle a deep copy situation
	if ( typeof target === "boolean" ) {
		deep = target;
		target = arguments[1] || {};
		// skip the boolean and the target
		i = 2;
	}

	// Handle case when target is a string or something (possible in deep copy)
	if ( typeof target !== "object" && !jQuery.isFunction(target) ) {
		target = {};
	}

	// extend jQuery itself if only one argument is passed
	if ( length === i ) {
		target = this;
		--i;
	}

	for ( ; i < length; i++ ) {
		// Only deal with non-null/undefined values
		if ( (options = arguments[ i ]) != null ) {
			// Extend the base object
			for ( name in options ) {
				src = target[ name ];
				copy = options[ name ];

				// Prevent never-ending loop
				if ( target === copy ) {
					continue;
				}

				// Recurse if we're merging object literal values or arrays
				if ( deep && copy && ( jQuery.isPlainObject(copy) || jQuery.isArray(copy) ) ) {
					var clone = src && ( jQuery.isPlainObject(src) || jQuery.isArray(src) ) ? src
						: jQuery.isArray(copy) ? [] : {};

					// Never move original objects, clone them
					target[ name ] = jQuery.extend( deep, clone, copy );

				// Don't bring in undefined values
				} else if ( copy !== undefined ) {
					target[ name ] = copy;
				}
			}
		}
	}

	// Return the modified object
	return target;
};

jQuery.extend({
	noConflict: function( deep ) {
		window.$ = _$;

		if ( deep ) {
			window.jQuery = _jQuery;
		}

		return jQuery;
	},
	
	// Is the DOM ready to be used? Set to true once it occurs.
	isReady: false,
	
	// Handle when the DOM is ready
	ready: function() {
		// Make sure that the DOM is not already loaded
		if ( !jQuery.isReady ) {
			// Make sure body exists, at least, in case IE gets a little overzealous (ticket #5443).
			if ( !document.body ) {
				return setTimeout( jQuery.ready, 13 );
			}

			// Remember that the DOM is ready
			jQuery.isReady = true;

			// If there are functions bound, to execute
			if ( readyList ) {
				// Execute all of them
				var fn, i = 0;
				while ( (fn = readyList[ i++ ]) ) {
					fn.call( document, jQuery );
				}

				// Reset the list of functions
				readyList = null;
			}

			// Trigger any bound ready events
			if ( jQuery.fn.triggerHandler ) {
				jQuery( document ).triggerHandler( "ready" );
			}
		}
	},
	
	bindReady: function() {
		if ( readyBound ) {
			return;
		}

		readyBound = true;

		// Catch cases where $(document).ready() is called after the
		// browser event has already occurred.
		if ( document.readyState === "complete" ) {
			return jQuery.ready();
		}

		// Mozilla, Opera and webkit nightlies currently support this event
		if ( document.addEventListener ) {
			// Use the handy event callback
			document.addEventListener( "DOMContentLoaded", DOMContentLoaded, false );
			
			// A fallback to window.onload, that will always work
			window.addEventListener( "load", jQuery.ready, false );

		// If IE event model is used
		} else if ( document.attachEvent ) {
			// ensure firing before onload,
			// maybe late but safe also for iframes
			document.attachEvent("onreadystatechange", DOMContentLoaded);
			
			// A fallback to window.onload, that will always work
			window.attachEvent( "onload", jQuery.ready );

			// If IE and not a frame
			// continually check to see if the document is ready
			var toplevel = false;

			try {
				toplevel = window.frameElement == null;
			} catch(e) {}

			if ( document.documentElement.doScroll && toplevel ) {
				doScrollCheck();
			}
		}
	},

	// See test/unit/core.js for details concerning isFunction.
	// Since version 1.3, DOM methods and functions like alert
	// aren't supported. They return false on IE (#2968).
	isFunction: function( obj ) {
		return toString.call(obj) === "[object Function]";
	},

	isArray: function( obj ) {
		return toString.call(obj) === "[object Array]";
	},

	isPlainObject: function( obj ) {
		// Must be an Object.
		// Because of IE, we also have to check the presence of the constructor property.
		// Make sure that DOM nodes and window objects don't pass through, as well
		if ( !obj || toString.call(obj) !== "[object Object]" || obj.nodeType || obj.setInterval ) {
			return false;
		}
		
		// Not own constructor property must be Object
		if ( obj.constructor
			&& !hasOwnProperty.call(obj, "constructor")
			&& !hasOwnProperty.call(obj.constructor.prototype, "isPrototypeOf") ) {
			return false;
		}
		
		// Own properties are enumerated firstly, so to speed up,
		// if last one is own, then all properties are own.
	
		var key;
		for ( key in obj ) {}
		
		return key === undefined || hasOwnProperty.call( obj, key );
	},

	isEmptyObject: function( obj ) {
		for ( var name in obj ) {
			return false;
		}
		return true;
	},
	
	error: function( msg ) {
		throw msg;
	},
	
	parseJSON: function( data ) {
		if ( typeof data !== "string" || !data ) {
			return null;
		}

		// Make sure leading/trailing whitespace is removed (IE can't handle it)
		data = jQuery.trim( data );
		
		// Make sure the incoming data is actual JSON
		// Logic borrowed from http://json.org/json2.js
		if ( /^[\],:{}\s]*$/.test(data.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, "@")
			.replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, "]")
			.replace(/(?:^|:|,)(?:\s*\[)+/g, "")) ) {

			// Try to use the native JSON parser first
			return window.JSON && window.JSON.parse ?
				window.JSON.parse( data ) :
				(new Function("return " + data))();

		} else {
			jQuery.error( "Invalid JSON: " + data );
		}
	},

	noop: function() {},

	// Evalulates a script in a global context
	globalEval: function( data ) {
		if ( data && rnotwhite.test(data) ) {
			// Inspired by code by Andrea Giammarchi
			// http://webreflection.blogspot.com/2007/08/global-scope-evaluation-and-dom.html
			var head = document.getElementsByTagName("head")[0] || document.documentElement,
				script = document.createElement("script");

			script.type = "text/javascript";

			if ( jQuery.support.scriptEval ) {
				script.appendChild( document.createTextNode( data ) );
			} else {
				script.text = data;
			}

			// Use insertBefore instead of appendChild to circumvent an IE6 bug.
			// This arises when a base node is used (#2709).
			head.insertBefore( script, head.firstChild );
			head.removeChild( script );
		}
	},

	nodeName: function( elem, name ) {
		return elem.nodeName && elem.nodeName.toUpperCase() === name.toUpperCase();
	},

	// args is for internal usage only
	each: function( object, callback, args ) {
		var name, i = 0,
			length = object.length,
			isObj = length === undefined || jQuery.isFunction(object);

		if ( args ) {
			if ( isObj ) {
				for ( name in object ) {
					if ( callback.apply( object[ name ], args ) === false ) {
						break;
					}
				}
			} else {
				for ( ; i < length; ) {
					if ( callback.apply( object[ i++ ], args ) === false ) {
						break;
					}
				}
			}

		// A special, fast, case for the most common use of each
		} else {
			if ( isObj ) {
				for ( name in object ) {
					if ( callback.call( object[ name ], name, object[ name ] ) === false ) {
						break;
					}
				}
			} else {
				for ( var value = object[0];
					i < length && callback.call( value, i, value ) !== false; value = object[++i] ) {}
			}
		}

		return object;
	},

	trim: function( text ) {
		return (text || "").replace( rtrim, "" );
	},

	// results is for internal usage only
	makeArray: function( array, results ) {
		var ret = results || [];

		if ( array != null ) {
			// The window, strings (and functions) also have 'length'
			// The extra typeof function check is to prevent crashes
			// in Safari 2 (See: #3039)
			if ( array.length == null || typeof array === "string" || jQuery.isFunction(array) || (typeof array !== "function" && array.setInterval) ) {
				push.call( ret, array );
			} else {
				jQuery.merge( ret, array );
			}
		}

		return ret;
	},

	inArray: function( elem, array ) {
		if ( array.indexOf ) {
			return array.indexOf( elem );
		}

		for ( var i = 0, length = array.length; i < length; i++ ) {
			if ( array[ i ] === elem ) {
				return i;
			}
		}

		return -1;
	},

	merge: function( first, second ) {
		var i = first.length, j = 0;

		if ( typeof second.length === "number" ) {
			for ( var l = second.length; j < l; j++ ) {
				first[ i++ ] = second[ j ];
			}
		
		} else {
			while ( second[j] !== undefined ) {
				first[ i++ ] = second[ j++ ];
			}
		}

		first.length = i;

		return first;
	},

	grep: function( elems, callback, inv ) {
		var ret = [];

		// Go through the array, only saving the items
		// that pass the validator function
		for ( var i = 0, length = elems.length; i < length; i++ ) {
			if ( !inv !== !callback( elems[ i ], i ) ) {
				ret.push( elems[ i ] );
			}
		}

		return ret;
	},

	// arg is for internal usage only
	map: function( elems, callback, arg ) {
		var ret = [], value;

		// Go through the array, translating each of the items to their
		// new value (or values).
		for ( var i = 0, length = elems.length; i < length; i++ ) {
			value = callback( elems[ i ], i, arg );

			if ( value != null ) {
				ret[ ret.length ] = value;
			}
		}

		return ret.concat.apply( [], ret );
	},

	// A global GUID counter for objects
	guid: 1,

	proxy: function( fn, proxy, thisObject ) {
		if ( arguments.length === 2 ) {
			if ( typeof proxy === "string" ) {
				thisObject = fn;
				fn = thisObject[ proxy ];
				proxy = undefined;

			} else if ( proxy && !jQuery.isFunction( proxy ) ) {
				thisObject = proxy;
				proxy = undefined;
			}
		}

		if ( !proxy && fn ) {
			proxy = function() {
				return fn.apply( thisObject || this, arguments );
			};
		}

		// Set the guid of unique handler to the same of original handler, so it can be removed
		if ( fn ) {
			proxy.guid = fn.guid = fn.guid || proxy.guid || jQuery.guid++;
		}

		// So proxy can be declared as an argument
		return proxy;
	},

	// Use of jQuery.browser is frowned upon.
	// More details: http://docs.jquery.com/Utilities/jQuery.browser
	uaMatch: function( ua ) {
		ua = ua.toLowerCase();

		var match = /(webkit)[ \/]([\w.]+)/.exec( ua ) ||
			/(opera)(?:.*version)?[ \/]([\w.]+)/.exec( ua ) ||
			/(msie) ([\w.]+)/.exec( ua ) ||
			!/compatible/.test( ua ) && /(mozilla)(?:.*? rv:([\w.]+))?/.exec( ua ) ||
		  	[];

		return { browser: match[1] || "", version: match[2] || "0" };
	},

	browser: {}
});

browserMatch = jQuery.uaMatch( userAgent );
if ( browserMatch.browser ) {
	jQuery.browser[ browserMatch.browser ] = true;
	jQuery.browser.version = browserMatch.version;
}

// Deprecated, use jQuery.browser.webkit instead
if ( jQuery.browser.webkit ) {
	jQuery.browser.safari = true;
}

if ( indexOf ) {
	jQuery.inArray = function( elem, array ) {
		return indexOf.call( array, elem );
	};
}

// All jQuery objects should point back to these
rootjQuery = jQuery(document);

// Cleanup functions for the document ready method
if ( document.addEventListener ) {
	DOMContentLoaded = function() {
		document.removeEventListener( "DOMContentLoaded", DOMContentLoaded, false );
		jQuery.ready();
	};

} else if ( document.attachEvent ) {
	DOMContentLoaded = function() {
		// Make sure body exists, at least, in case IE gets a little overzealous (ticket #5443).
		if ( document.readyState === "complete" ) {
			document.detachEvent( "onreadystatechange", DOMContentLoaded );
			jQuery.ready();
		}
	};
}

// The DOM ready check for Internet Explorer
function doScrollCheck() {
	if ( jQuery.isReady ) {
		return;
	}

	try {
		// If IE is used, use the trick by Diego Perini
		// http://javascript.nwbox.com/IEContentLoaded/
		document.documentElement.doScroll("left");
	} catch( error ) {
		setTimeout( doScrollCheck, 1 );
		return;
	}

	// and execute any waiting functions
	jQuery.ready();
}

function evalScript( i, elem ) {
	if ( elem.src ) {
		jQuery.ajax({
			url: elem.src,
			async: false,
			dataType: "script"
		});
	} else {
		jQuery.globalEval( elem.text || elem.textContent || elem.innerHTML || "" );
	}

	if ( elem.parentNode ) {
		elem.parentNode.removeChild( elem );
	}
}

// Mutifunctional method to get and set values to a collection
// The value/s can be optionally by executed if its a function
function access( elems, key, value, exec, fn, pass ) {
	var length = elems.length;
	
	// Setting many attributes
	if ( typeof key === "object" ) {
		for ( var k in key ) {
			access( elems, k, key[k], exec, fn, value );
		}
		return elems;
	}
	
	// Setting one attribute
	if ( value !== undefined ) {
		// Optionally, function values get executed if exec is true
		exec = !pass && exec && jQuery.isFunction(value);
		
		for ( var i = 0; i < length; i++ ) {
			fn( elems[i], key, exec ? value.call( elems[i], i, fn( elems[i], key ) ) : value, pass );
		}
		
		return elems;
	}
	
	// Getting an attribute
	return length ? fn( elems[0], key ) : undefined;
}

function now() {
	return (new Date).getTime();
}
(function() {

	jQuery.support = {};

	var root = document.documentElement,
		script = document.createElement("script"),
		div = document.createElement("div"),
		id = "script" + now();

	div.style.display = "none";
	div.innerHTML = "   <link/><table></table><a href='/a' style='color:red;float:left;opacity:.55;'>a</a><input type='checkbox'/>";

	var all = div.getElementsByTagName("*"),
		a = div.getElementsByTagName("a")[0];

	// Can't get basic test support
	if ( !all || !all.length || !a ) {
		return;
	}

	jQuery.support = {
		// IE strips leading whitespace when .innerHTML is used
		leadingWhitespace: div.firstChild.nodeType === 3,

		// Make sure that tbody elements aren't automatically inserted
		// IE will insert them into empty tables
		tbody: !div.getElementsByTagName("tbody").length,

		// Make sure that link elements get serialized correctly by innerHTML
		// This requires a wrapper element in IE
		htmlSerialize: !!div.getElementsByTagName("link").length,

		// Get the style information from getAttribute
		// (IE uses .cssText insted)
		style: /red/.test( a.getAttribute("style") ),

		// Make sure that URLs aren't manipulated
		// (IE normalizes it by default)
		hrefNormalized: a.getAttribute("href") === "/a",

		// Make sure that element opacity exists
		// (IE uses filter instead)
		// Use a regex to work around a WebKit issue. See #5145
		opacity: /^0.55$/.test( a.style.opacity ),

		// Verify style float existence
		// (IE uses styleFloat instead of cssFloat)
		cssFloat: !!a.style.cssFloat,

		// Make sure that if no value is specified for a checkbox
		// that it defaults to "on".
		// (WebKit defaults to "" instead)
		checkOn: div.getElementsByTagName("input")[0].value === "on",

		// Make sure that a selected-by-default option has a working selected property.
		// (WebKit defaults to false instead of true, IE too, if it's in an optgroup)
		optSelected: document.createElement("select").appendChild( document.createElement("option") ).selected,

		parentNode: div.removeChild( div.appendChild( document.createElement("div") ) ).parentNode === null,

		// Will be defined later
		deleteExpando: true,
		checkClone: false,
		scriptEval: false,
		noCloneEvent: true,
		boxModel: null
	};

	script.type = "text/javascript";
	try {
		script.appendChild( document.createTextNode( "window." + id + "=1;" ) );
	} catch(e) {}

	root.insertBefore( script, root.firstChild );

	// Make sure that the execution of code works by injecting a script
	// tag with appendChild/createTextNode
	// (IE doesn't support this, fails, and uses .text instead)
	if ( window[ id ] ) {
		jQuery.support.scriptEval = true;
		delete window[ id ];
	}

	// Test to see if it's possible to delete an expando from an element
	// Fails in Internet Explorer
	try {
		delete script.test;
	
	} catch(e) {
		jQuery.support.deleteExpando = false;
	}

	root.removeChild( script );

	if ( div.attachEvent && div.fireEvent ) {
		div.attachEvent("onclick", function click() {
			// Cloning a node shouldn't copy over any
			// bound event handlers (IE does this)
			jQuery.support.noCloneEvent = false;
			div.detachEvent("onclick", click);
		});
		div.cloneNode(true).fireEvent("onclick");
	}

	div = document.createElement("div");
	div.innerHTML = "<input type='radio' name='radiotest' checked='checked'/>";

	var fragment = document.createDocumentFragment();
	fragment.appendChild( div.firstChild );

	// WebKit doesn't clone checked state correctly in fragments
	jQuery.support.checkClone = fragment.cloneNode(true).cloneNode(true).lastChild.checked;

	// Figure out if the W3C box model works as expected
	// document.body must exist before we can do this
	jQuery(function() {
		var div = document.createElement("div");
		div.style.width = div.style.paddingLeft = "1px";

		document.body.appendChild( div );
		jQuery.boxModel = jQuery.support.boxModel = div.offsetWidth === 2;
		document.body.removeChild( div ).style.display = 'none';

		div = null;
	});

	// Technique from Juriy Zaytsev
	// http://thinkweb2.com/projects/prototype/detecting-event-support-without-browser-sniffing/
	var eventSupported = function( eventName ) { 
		var el = document.createElement("div"); 
		eventName = "on" + eventName; 

		var isSupported = (eventName in el); 
		if ( !isSupported ) { 
			el.setAttribute(eventName, "return;"); 
			isSupported = typeof el[eventName] === "function"; 
		} 
		el = null; 

		return isSupported; 
	};
	
	jQuery.support.submitBubbles = eventSupported("submit");
	jQuery.support.changeBubbles = eventSupported("change");

	// release memory in IE
	root = script = div = all = a = null;
})();

jQuery.props = {
	"for": "htmlFor",
	"class": "className",
	readonly: "readOnly",
	maxlength: "maxLength",
	cellspacing: "cellSpacing",
	rowspan: "rowSpan",
	colspan: "colSpan",
	tabindex: "tabIndex",
	usemap: "useMap",
	frameborder: "frameBorder"
};
var expando = "jQuery" + now(), uuid = 0, windowData = {};

jQuery.extend({
	cache: {},
	
	expando:expando,

	// The following elements throw uncatchable exceptions if you
	// attempt to add expando properties to them.
	noData: {
		"embed": true,
		"object": true,
		"applet": true
	},

	data: function( elem, name, data ) {
		if ( elem.nodeName && jQuery.noData[elem.nodeName.toLowerCase()] ) {
			return;
		}

		elem = elem == window ?
			windowData :
			elem;

		var id = elem[ expando ], cache = jQuery.cache, thisCache;

		if ( !id && typeof name === "string" && data === undefined ) {
			return null;
		}

		// Compute a unique ID for the element
		if ( !id ) { 
			id = ++uuid;
		}

		// Avoid generating a new cache unless none exists and we
		// want to manipulate it.
		if ( typeof name === "object" ) {
			elem[ expando ] = id;
			thisCache = cache[ id ] = jQuery.extend(true, {}, name);

		} else if ( !cache[ id ] ) {
			elem[ expando ] = id;
			cache[ id ] = {};
		}

		thisCache = cache[ id ];

		// Prevent overriding the named cache with undefined values
		if ( data !== undefined ) {
			thisCache[ name ] = data;
		}

		return typeof name === "string" ? thisCache[ name ] : thisCache;
	},

	removeData: function( elem, name ) {
		if ( elem.nodeName && jQuery.noData[elem.nodeName.toLowerCase()] ) {
			return;
		}

		elem = elem == window ?
			windowData :
			elem;

		var id = elem[ expando ], cache = jQuery.cache, thisCache = cache[ id ];

		// If we want to remove a specific section of the element's data
		if ( name ) {
			if ( thisCache ) {
				// Remove the section of cache data
				delete thisCache[ name ];

				// If we've removed all the data, remove the element's cache
				if ( jQuery.isEmptyObject(thisCache) ) {
					jQuery.removeData( elem );
				}
			}

		// Otherwise, we want to remove all of the element's data
		} else {
			if ( jQuery.support.deleteExpando ) {
				delete elem[ jQuery.expando ];

			} else if ( elem.removeAttribute ) {
				elem.removeAttribute( jQuery.expando );
			}

			// Completely remove the data cache
			delete cache[ id ];
		}
	}
});

jQuery.fn.extend({
	data: function( key, value ) {
		if ( typeof key === "undefined" && this.length ) {
			return jQuery.data( this[0] );

		} else if ( typeof key === "object" ) {
			return this.each(function() {
				jQuery.data( this, key );
			});
		}

		var parts = key.split(".");
		parts[1] = parts[1] ? "." + parts[1] : "";

		if ( value === undefined ) {
			var data = this.triggerHandler("getData" + parts[1] + "!", [parts[0]]);

			if ( data === undefined && this.length ) {
				data = jQuery.data( this[0], key );
			}
			return data === undefined && parts[1] ?
				this.data( parts[0] ) :
				data;
		} else {
			return this.trigger("setData" + parts[1] + "!", [parts[0], value]).each(function() {
				jQuery.data( this, key, value );
			});
		}
	},

	removeData: function( key ) {
		return this.each(function() {
			jQuery.removeData( this, key );
		});
	}
});
jQuery.extend({
	queue: function( elem, type, data ) {
		if ( !elem ) {
			return;
		}

		type = (type || "fx") + "queue";
		var q = jQuery.data( elem, type );

		// Speed up dequeue by getting out quickly if this is just a lookup
		if ( !data ) {
			return q || [];
		}

		if ( !q || jQuery.isArray(data) ) {
			q = jQuery.data( elem, type, jQuery.makeArray(data) );

		} else {
			q.push( data );
		}

		return q;
	},

	dequeue: function( elem, type ) {
		type = type || "fx";

		var queue = jQuery.queue( elem, type ), fn = queue.shift();

		// If the fx queue is dequeued, always remove the progress sentinel
		if ( fn === "inprogress" ) {
			fn = queue.shift();
		}

		if ( fn ) {
			// Add a progress sentinel to prevent the fx queue from being
			// automatically dequeued
			if ( type === "fx" ) {
				queue.unshift("inprogress");
			}

			fn.call(elem, function() {
				jQuery.dequeue(elem, type);
			});
		}
	}
});

jQuery.fn.extend({
	queue: function( type, data ) {
		if ( typeof type !== "string" ) {
			data = type;
			type = "fx";
		}

		if ( data === undefined ) {
			return jQuery.queue( this[0], type );
		}
		return this.each(function( i, elem ) {
			var queue = jQuery.queue( this, type, data );

			if ( type === "fx" && queue[0] !== "inprogress" ) {
				jQuery.dequeue( this, type );
			}
		});
	},
	dequeue: function( type ) {
		return this.each(function() {
			jQuery.dequeue( this, type );
		});
	},

	// Based off of the plugin by Clint Helfers, with permission.
	// http://blindsignals.com/index.php/2009/07/jquery-delay/
	delay: function( time, type ) {
		time = jQuery.fx ? jQuery.fx.speeds[time] || time : time;
		type = type || "fx";

		return this.queue( type, function() {
			var elem = this;
			setTimeout(function() {
				jQuery.dequeue( elem, type );
			}, time );
		});
	},

	clearQueue: function( type ) {
		return this.queue( type || "fx", [] );
	}
});
var rclass = /[\n\t]/g,
	rspace = /\s+/,
	rreturn = /\r/g,
	rspecialurl = /href|src|style/,
	rtype = /(button|input)/i,
	rfocusable = /(button|input|object|select|textarea)/i,
	rclickable = /^(a|area)$/i,
	rradiocheck = /radio|checkbox/;

jQuery.fn.extend({
	attr: function( name, value ) {
		return access( this, name, value, true, jQuery.attr );
	},

	removeAttr: function( name, fn ) {
		return this.each(function(){
			jQuery.attr( this, name, "" );
			if ( this.nodeType === 1 ) {
				this.removeAttribute( name );
			}
		});
	},

	addClass: function( value ) {
		if ( jQuery.isFunction(value) ) {
			return this.each(function(i) {
				var self = jQuery(this);
				self.addClass( value.call(this, i, self.attr("class")) );
			});
		}

		if ( value && typeof value === "string" ) {
			var classNames = (value || "").split( rspace );

			for ( var i = 0, l = this.length; i < l; i++ ) {
				var elem = this[i];

				if ( elem.nodeType === 1 ) {
					if ( !elem.className ) {
						elem.className = value;

					} else {
						var className = " " + elem.className + " ", setClass = elem.className;
						for ( var c = 0, cl = classNames.length; c < cl; c++ ) {
							if ( className.indexOf( " " + classNames[c] + " " ) < 0 ) {
								setClass += " " + classNames[c];
							}
						}
						elem.className = jQuery.trim( setClass );
					}
				}
			}
		}

		return this;
	},

	removeClass: function( value ) {
		if ( jQuery.isFunction(value) ) {
			return this.each(function(i) {
				var self = jQuery(this);
				self.removeClass( value.call(this, i, self.attr("class")) );
			});
		}

		if ( (value && typeof value === "string") || value === undefined ) {
			var classNames = (value || "").split(rspace);

			for ( var i = 0, l = this.length; i < l; i++ ) {
				var elem = this[i];

				if ( elem.nodeType === 1 && elem.className ) {
					if ( value ) {
						var className = (" " + elem.className + " ").replace(rclass, " ");
						for ( var c = 0, cl = classNames.length; c < cl; c++ ) {
							className = className.replace(" " + classNames[c] + " ", " ");
						}
						elem.className = jQuery.trim( className );

					} else {
						elem.className = "";
					}
				}
			}
		}

		return this;
	},

	toggleClass: function( value, stateVal ) {
		var type = typeof value, isBool = typeof stateVal === "boolean";

		if ( jQuery.isFunction( value ) ) {
			return this.each(function(i) {
				var self = jQuery(this);
				self.toggleClass( value.call(this, i, self.attr("class"), stateVal), stateVal );
			});
		}

		return this.each(function() {
			if ( type === "string" ) {
				// toggle individual class names
				var className, i = 0, self = jQuery(this),
					state = stateVal,
					classNames = value.split( rspace );

				while ( (className = classNames[ i++ ]) ) {
					// check each className given, space seperated list
					state = isBool ? state : !self.hasClass( className );
					self[ state ? "addClass" : "removeClass" ]( className );
				}

			} else if ( type === "undefined" || type === "boolean" ) {
				if ( this.className ) {
					// store className if set
					jQuery.data( this, "__className__", this.className );
				}

				// toggle whole className
				this.className = this.className || value === false ? "" : jQuery.data( this, "__className__" ) || "";
			}
		});
	},

	hasClass: function( selector ) {
		var className = " " + selector + " ";
		for ( var i = 0, l = this.length; i < l; i++ ) {
			if ( (" " + this[i].className + " ").replace(rclass, " ").indexOf( className ) > -1 ) {
				return true;
			}
		}

		return false;
	},

	val: function( value ) {
		if ( value === undefined ) {
			var elem = this[0];

			if ( elem ) {
				if ( jQuery.nodeName( elem, "option" ) ) {
					return (elem.attributes.value || {}).specified ? elem.value : elem.text;
				}

				// We need to handle select boxes special
				if ( jQuery.nodeName( elem, "select" ) ) {
					var index = elem.selectedIndex,
						values = [],
						options = elem.options,
						one = elem.type === "select-one";

					// Nothing was selected
					if ( index < 0 ) {
						return null;
					}

					// Loop through all the selected options
					for ( var i = one ? index : 0, max = one ? index + 1 : options.length; i < max; i++ ) {
						var option = options[ i ];

						if ( option.selected ) {
							// Get the specifc value for the option
							value = jQuery(option).val();

							// We don't need an array for one selects
							if ( one ) {
								return value;
							}

							// Multi-Selects return an array
							values.push( value );
						}
					}

					return values;
				}

				// Handle the case where in Webkit "" is returned instead of "on" if a value isn't specified
				if ( rradiocheck.test( elem.type ) && !jQuery.support.checkOn ) {
					return elem.getAttribute("value") === null ? "on" : elem.value;
				}
				

				// Everything else, we just grab the value
				return (elem.value || "").replace(rreturn, "");

			}

			return undefined;
		}

		var isFunction = jQuery.isFunction(value);

		return this.each(function(i) {
			var self = jQuery(this), val = value;

			if ( this.nodeType !== 1 ) {
				return;
			}

			if ( isFunction ) {
				val = value.call(this, i, self.val());
			}

			// Typecast each time if the value is a Function and the appended
			// value is therefore different each time.
			if ( typeof val === "number" ) {
				val += "";
			}

			if ( jQuery.isArray(val) && rradiocheck.test( this.type ) ) {
				this.checked = jQuery.inArray( self.val(), val ) >= 0;

			} else if ( jQuery.nodeName( this, "select" ) ) {
				var values = jQuery.makeArray(val);

				jQuery( "option", this ).each(function() {
					this.selected = jQuery.inArray( jQuery(this).val(), values ) >= 0;
				});

				if ( !values.length ) {
					this.selectedIndex = -1;
				}

			} else {
				this.value = val;
			}
		});
	}
});

jQuery.extend({
	attrFn: {
		val: true,
		css: true,
		html: true,
		text: true,
		data: true,
		width: true,
		height: true,
		offset: true
	},
		
	attr: function( elem, name, value, pass ) {
		// don't set attributes on text and comment nodes
		if ( !elem || elem.nodeType === 3 || elem.nodeType === 8 ) {
			return undefined;
		}

		if ( pass && name in jQuery.attrFn ) {
			return jQuery(elem)[name](value);
		}

		var notxml = elem.nodeType !== 1 || !jQuery.isXMLDoc( elem ),
			// Whether we are setting (or getting)
			set = value !== undefined;

		// Try to normalize/fix the name
		name = notxml && jQuery.props[ name ] || name;

		// Only do all the following if this is a node (faster for style)
		if ( elem.nodeType === 1 ) {
			// These attributes require special treatment
			var special = rspecialurl.test( name );

			// Safari mis-reports the default selected property of an option
			// Accessing the parent's selectedIndex property fixes it
			if ( name === "selected" && !jQuery.support.optSelected ) {
				var parent = elem.parentNode;
				if ( parent ) {
					parent.selectedIndex;
	
					// Make sure that it also works with optgroups, see #5701
					if ( parent.parentNode ) {
						parent.parentNode.selectedIndex;
					}
				}
			}

			// If applicable, access the attribute via the DOM 0 way
			if ( name in elem && notxml && !special ) {
				if ( set ) {
					// We can't allow the type property to be changed (since it causes problems in IE)
					if ( name === "type" && rtype.test( elem.nodeName ) && elem.parentNode ) {
						jQuery.error( "type property can't be changed" );
					}

					elem[ name ] = value;
				}

				// browsers index elements by id/name on forms, give priority to attributes.
				if ( jQuery.nodeName( elem, "form" ) && elem.getAttributeNode(name) ) {
					return elem.getAttributeNode( name ).nodeValue;
				}

				// elem.tabIndex doesn't always return the correct value when it hasn't been explicitly set
				// http://fluidproject.org/blog/2008/01/09/getting-setting-and-removing-tabindex-values-with-javascript/
				if ( name === "tabIndex" ) {
					var attributeNode = elem.getAttributeNode( "tabIndex" );

					return attributeNode && attributeNode.specified ?
						attributeNode.value :
						rfocusable.test( elem.nodeName ) || rclickable.test( elem.nodeName ) && elem.href ?
							0 :
							undefined;
				}

				return elem[ name ];
			}

			if ( !jQuery.support.style && notxml && name === "style" ) {
				if ( set ) {
					elem.style.cssText = "" + value;
				}

				return elem.style.cssText;
			}

			if ( set ) {
				// convert the value to a string (all browsers do this but IE) see #1070
				elem.setAttribute( name, "" + value );
			}

			var attr = !jQuery.support.hrefNormalized && notxml && special ?
					// Some attributes require a special call on IE
					elem.getAttribute( name, 2 ) :
					elem.getAttribute( name );

			// Non-existent attributes return null, we normalize to undefined
			return attr === null ? undefined : attr;
		}

		// elem is actually elem.style ... set the style
		// Using attr for specific style information is now deprecated. Use style instead.
		return jQuery.style( elem, name, value );
	}
});
var rnamespaces = /\.(.*)$/,
	fcleanup = function( nm ) {
		return nm.replace(/[^\w\s\.\|`]/g, function( ch ) {
			return "\\" + ch;
		});
	};

/*
 * A number of helper functions used for managing events.
 * Many of the ideas behind this code originated from
 * Dean Edwards' addEvent library.
 */
jQuery.event = {

	// Bind an event to an element
	// Original by Dean Edwards
	add: function( elem, types, handler, data ) {
		if ( elem.nodeType === 3 || elem.nodeType === 8 ) {
			return;
		}

		// For whatever reason, IE has trouble passing the window object
		// around, causing it to be cloned in the process
		if ( elem.setInterval && ( elem !== window && !elem.frameElement ) ) {
			elem = window;
		}

		var handleObjIn, handleObj;

		if ( handler.handler ) {
			handleObjIn = handler;
			handler = handleObjIn.handler;
		}

		// Make sure that the function being executed has a unique ID
		if ( !handler.guid ) {
			handler.guid = jQuery.guid++;
		}

		// Init the element's event structure
		var elemData = jQuery.data( elem );

		// If no elemData is found then we must be trying to bind to one of the
		// banned noData elements
		if ( !elemData ) {
			return;
		}

		var events = elemData.events = elemData.events || {},
			eventHandle = elemData.handle, eventHandle;

		if ( !eventHandle ) {
			elemData.handle = eventHandle = function() {
				// Handle the second event of a trigger and when
				// an event is called after a page has unloaded
				return typeof jQuery !== "undefined" && !jQuery.event.triggered ?
					jQuery.event.handle.apply( eventHandle.elem, arguments ) :
					undefined;
			};
		}

		// Add elem as a property of the handle function
		// This is to prevent a memory leak with non-native events in IE.
		eventHandle.elem = elem;

		// Handle multiple events separated by a space
		// jQuery(...).bind("mouseover mouseout", fn);
		types = types.split(" ");

		var type, i = 0, namespaces;

		while ( (type = types[ i++ ]) ) {
			handleObj = handleObjIn ?
				jQuery.extend({}, handleObjIn) :
				{ handler: handler, data: data };

			// Namespaced event handlers
			if ( type.indexOf(".") > -1 ) {
				namespaces = type.split(".");
				type = namespaces.shift();
				handleObj.namespace = namespaces.slice(0).sort().join(".");

			} else {
				namespaces = [];
				handleObj.namespace = "";
			}

			handleObj.type = type;
			handleObj.guid = handler.guid;

			// Get the current list of functions bound to this event
			var handlers = events[ type ],
				special = jQuery.event.special[ type ] || {};

			// Init the event handler queue
			if ( !handlers ) {
				handlers = events[ type ] = [];

				// Check for a special event handler
				// Only use addEventListener/attachEvent if the special
				// events handler returns false
				if ( !special.setup || special.setup.call( elem, data, namespaces, eventHandle ) === false ) {
					// Bind the global event handler to the element
					if ( elem.addEventListener ) {
						elem.addEventListener( type, eventHandle, false );

					} else if ( elem.attachEvent ) {
						elem.attachEvent( "on" + type, eventHandle );
					}
				}
			}
			
			if ( special.add ) { 
				special.add.call( elem, handleObj ); 

				if ( !handleObj.handler.guid ) {
					handleObj.handler.guid = handler.guid;
				}
			}

			// Add the function to the element's handler list
			handlers.push( handleObj );

			// Keep track of which events have been used, for global triggering
			jQuery.event.global[ type ] = true;
		}

		// Nullify elem to prevent memory leaks in IE
		elem = null;
	},

	global: {},

	// Detach an event or set of events from an element
	remove: function( elem, types, handler, pos ) {
		// don't do events on text and comment nodes
		if ( elem.nodeType === 3 || elem.nodeType === 8 ) {
			return;
		}

		var ret, type, fn, i = 0, all, namespaces, namespace, special, eventType, handleObj, origType,
			elemData = jQuery.data( elem ),
			events = elemData && elemData.events;

		if ( !elemData || !events ) {
			return;
		}

		// types is actually an event object here
		if ( types && types.type ) {
			handler = types.handler;
			types = types.type;
		}

		// Unbind all events for the element
		if ( !types || typeof types === "string" && types.charAt(0) === "." ) {
			types = types || "";

			for ( type in events ) {
				jQuery.event.remove( elem, type + types );
			}

			return;
		}

		// Handle multiple events separated by a space
		// jQuery(...).unbind("mouseover mouseout", fn);
		types = types.split(" ");

		while ( (type = types[ i++ ]) ) {
			origType = type;
			handleObj = null;
			all = type.indexOf(".") < 0;
			namespaces = [];

			if ( !all ) {
				// Namespaced event handlers
				namespaces = type.split(".");
				type = namespaces.shift();

				namespace = new RegExp("(^|\\.)" + 
					jQuery.map( namespaces.slice(0).sort(), fcleanup ).join("\\.(?:.*\\.)?") + "(\\.|$)")
			}

			eventType = events[ type ];

			if ( !eventType ) {
				continue;
			}

			if ( !handler ) {
				for ( var j = 0; j < eventType.length; j++ ) {
					handleObj = eventType[ j ];

					if ( all || namespace.test( handleObj.namespace ) ) {
						jQuery.event.remove( elem, origType, handleObj.handler, j );
						eventType.splice( j--, 1 );
					}
				}

				continue;
			}

			special = jQuery.event.special[ type ] || {};

			for ( var j = pos || 0; j < eventType.length; j++ ) {
				handleObj = eventType[ j ];

				if ( handler.guid === handleObj.guid ) {
					// remove the given handler for the given type
					if ( all || namespace.test( handleObj.namespace ) ) {
						if ( pos == null ) {
							eventType.splice( j--, 1 );
						}

						if ( special.remove ) {
							special.remove.call( elem, handleObj );
						}
					}

					if ( pos != null ) {
						break;
					}
				}
			}

			// remove generic event handler if no more handlers exist
			if ( eventType.length === 0 || pos != null && eventType.length === 1 ) {
				if ( !special.teardown || special.teardown.call( elem, namespaces ) === false ) {
					removeEvent( elem, type, elemData.handle );
				}

				ret = null;
				delete events[ type ];
			}
		}

		// Remove the expando if it's no longer used
		if ( jQuery.isEmptyObject( events ) ) {
			var handle = elemData.handle;
			if ( handle ) {
				handle.elem = null;
			}

			delete elemData.events;
			delete elemData.handle;

			if ( jQuery.isEmptyObject( elemData ) ) {
				jQuery.removeData( elem );
			}
		}
	},

	// bubbling is internal
	trigger: function( event, data, elem /*, bubbling */ ) {
		// Event object or event type
		var type = event.type || event,
			bubbling = arguments[3];

		if ( !bubbling ) {
			event = typeof event === "object" ?
				// jQuery.Event object
				event[expando] ? event :
				// Object literal
				jQuery.extend( jQuery.Event(type), event ) :
				// Just the event type (string)
				jQuery.Event(type);

			if ( type.indexOf("!") >= 0 ) {
				event.type = type = type.slice(0, -1);
				event.exclusive = true;
			}

			// Handle a global trigger
			if ( !elem ) {
				// Don't bubble custom events when global (to avoid too much overhead)
				event.stopPropagation();

				// Only trigger if we've ever bound an event for it
				if ( jQuery.event.global[ type ] ) {
					jQuery.each( jQuery.cache, function() {
						if ( this.events && this.events[type] ) {
							jQuery.event.trigger( event, data, this.handle.elem );
						}
					});
				}
			}

			// Handle triggering a single element

			// don't do events on text and comment nodes
			if ( !elem || elem.nodeType === 3 || elem.nodeType === 8 ) {
				return undefined;
			}

			// Clean up in case it is reused
			event.result = undefined;
			event.target = elem;

			// Clone the incoming data, if any
			data = jQuery.makeArray( data );
			data.unshift( event );
		}

		event.currentTarget = elem;

		// Trigger the event, it is assumed that "handle" is a function
		var handle = jQuery.data( elem, "handle" );
		if ( handle ) {
			handle.apply( elem, data );
		}

		var parent = elem.parentNode || elem.ownerDocument;

		// Trigger an inline bound script
		try {
			if ( !(elem && elem.nodeName && jQuery.noData[elem.nodeName.toLowerCase()]) ) {
				if ( elem[ "on" + type ] && elem[ "on" + type ].apply( elem, data ) === false ) {
					event.result = false;
				}
			}

		// prevent IE from throwing an error for some elements with some event types, see #3533
		} catch (e) {}

		if ( !event.isPropagationStopped() && parent ) {
			jQuery.event.trigger( event, data, parent, true );

		} else if ( !event.isDefaultPrevented() ) {
			var target = event.target, old,
				isClick = jQuery.nodeName(target, "a") && type === "click",
				special = jQuery.event.special[ type ] || {};

			if ( (!special._default || special._default.call( elem, event ) === false) && 
				!isClick && !(target && target.nodeName && jQuery.noData[target.nodeName.toLowerCase()]) ) {

				try {
					if ( target[ type ] ) {
						// Make sure that we don't accidentally re-trigger the onFOO events
						old = target[ "on" + type ];

						if ( old ) {
							target[ "on" + type ] = null;
						}

						jQuery.event.triggered = true;
						target[ type ]();
					}

				// prevent IE from throwing an error for some elements with some event types, see #3533
				} catch (e) {}

				if ( old ) {
					target[ "on" + type ] = old;
				}

				jQuery.event.triggered = false;
			}
		}
	},

	handle: function( event ) {
		var all, handlers, namespaces, namespace, events;

		event = arguments[0] = jQuery.event.fix( event || window.event );
		event.currentTarget = this;

		// Namespaced event handlers
		all = event.type.indexOf(".") < 0 && !event.exclusive;

		if ( !all ) {
			namespaces = event.type.split(".");
			event.type = namespaces.shift();
			namespace = new RegExp("(^|\\.)" + namespaces.slice(0).sort().join("\\.(?:.*\\.)?") + "(\\.|$)");
		}

		var events = jQuery.data(this, "events"), handlers = events[ event.type ];

		if ( events && handlers ) {
			// Clone the handlers to prevent manipulation
			handlers = handlers.slice(0);

			for ( var j = 0, l = handlers.length; j < l; j++ ) {
				var handleObj = handlers[ j ];

				// Filter the functions by class
				if ( all || namespace.test( handleObj.namespace ) ) {
					// Pass in a reference to the handler function itself
					// So that we can later remove it
					event.handler = handleObj.handler;
					event.data = handleObj.data;
					event.handleObj = handleObj;
	
					var ret = handleObj.handler.apply( this, arguments );

					if ( ret !== undefined ) {
						event.result = ret;
						if ( ret === false ) {
							event.preventDefault();
							event.stopPropagation();
						}
					}

					if ( event.isImmediatePropagationStopped() ) {
						break;
					}
				}
			}
		}

		return event.result;
	},

	props: "altKey attrChange attrName bubbles button cancelable charCode clientX clientY ctrlKey currentTarget data detail eventPhase fromElement handler keyCode layerX layerY metaKey newValue offsetX offsetY originalTarget pageX pageY prevValue relatedNode relatedTarget screenX screenY shiftKey srcElement target toElement view wheelDelta which".split(" "),

	fix: function( event ) {
		if ( event[ expando ] ) {
			return event;
		}

		// store a copy of the original event object
		// and "clone" to set read-only properties
		var originalEvent = event;
		event = jQuery.Event( originalEvent );

		for ( var i = this.props.length, prop; i; ) {
			prop = this.props[ --i ];
			event[ prop ] = originalEvent[ prop ];
		}

		// Fix target property, if necessary
		if ( !event.target ) {
			event.target = event.srcElement || document; // Fixes #1925 where srcElement might not be defined either
		}

		// check if target is a textnode (safari)
		if ( event.target.nodeType === 3 ) {
			event.target = event.target.parentNode;
		}

		// Add relatedTarget, if necessary
		if ( !event.relatedTarget && event.fromElement ) {
			event.relatedTarget = event.fromElement === event.target ? event.toElement : event.fromElement;
		}

		// Calculate pageX/Y if missing and clientX/Y available
		if ( event.pageX == null && event.clientX != null ) {
			var doc = document.documentElement, body = document.body;
			event.pageX = event.clientX + (doc && doc.scrollLeft || body && body.scrollLeft || 0) - (doc && doc.clientLeft || body && body.clientLeft || 0);
			event.pageY = event.clientY + (doc && doc.scrollTop  || body && body.scrollTop  || 0) - (doc && doc.clientTop  || body && body.clientTop  || 0);
		}

		// Add which for key events
		if ( !event.which && ((event.charCode || event.charCode === 0) ? event.charCode : event.keyCode) ) {
			event.which = event.charCode || event.keyCode;
		}

		// Add metaKey to non-Mac browsers (use ctrl for PC's and Meta for Macs)
		if ( !event.metaKey && event.ctrlKey ) {
			event.metaKey = event.ctrlKey;
		}

		// Add which for click: 1 === left; 2 === middle; 3 === right
		// Note: button is not normalized, so don't use it
		if ( !event.which && event.button !== undefined ) {
			event.which = (event.button & 1 ? 1 : ( event.button & 2 ? 3 : ( event.button & 4 ? 2 : 0 ) ));
		}

		return event;
	},

	// Deprecated, use jQuery.guid instead
	guid: 1E8,

	// Deprecated, use jQuery.proxy instead
	proxy: jQuery.proxy,

	special: {
		ready: {
			// Make sure the ready event is setup
			setup: jQuery.bindReady,
			teardown: jQuery.noop
		},

		live: {
			add: function( handleObj ) {
				jQuery.event.add( this, handleObj.origType, jQuery.extend({}, handleObj, {handler: liveHandler}) ); 
			},

			remove: function( handleObj ) {
				var remove = true,
					type = handleObj.origType.replace(rnamespaces, "");
				
				jQuery.each( jQuery.data(this, "events").live || [], function() {
					if ( type === this.origType.replace(rnamespaces, "") ) {
						remove = false;
						return false;
					}
				});

				if ( remove ) {
					jQuery.event.remove( this, handleObj.origType, liveHandler );
				}
			}

		},

		beforeunload: {
			setup: function( data, namespaces, eventHandle ) {
				// We only want to do this special case on windows
				if ( this.setInterval ) {
					this.onbeforeunload = eventHandle;
				}

				return false;
			},
			teardown: function( namespaces, eventHandle ) {
				if ( this.onbeforeunload === eventHandle ) {
					this.onbeforeunload = null;
				}
			}
		}
	}
};

var removeEvent = document.removeEventListener ?
	function( elem, type, handle ) {
		elem.removeEventListener( type, handle, false );
	} : 
	function( elem, type, handle ) {
		elem.detachEvent( "on" + type, handle );
	};

jQuery.Event = function( src ) {
	// Allow instantiation without the 'new' keyword
	if ( !this.preventDefault ) {
		return new jQuery.Event( src );
	}

	// Event object
	if ( src && src.type ) {
		this.originalEvent = src;
		this.type = src.type;
	// Event type
	} else {
		this.type = src;
	}

	// timeStamp is buggy for some events on Firefox(#3843)
	// So we won't rely on the native value
	this.timeStamp = now();

	// Mark it as fixed
	this[ expando ] = true;
};

function returnFalse() {
	return false;
}
function returnTrue() {
	return true;
}

// jQuery.Event is based on DOM3 Events as specified by the ECMAScript Language Binding
// http://www.w3.org/TR/2003/WD-DOM-Level-3-Events-20030331/ecma-script-binding.html
jQuery.Event.prototype = {
	preventDefault: function() {
		this.isDefaultPrevented = returnTrue;

		var e = this.originalEvent;
		if ( !e ) {
			return;
		}
		
		// if preventDefault exists run it on the original event
		if ( e.preventDefault ) {
			e.preventDefault();
		}
		// otherwise set the returnValue property of the original event to false (IE)
		e.returnValue = false;
	},
	stopPropagation: function() {
		this.isPropagationStopped = returnTrue;

		var e = this.originalEvent;
		if ( !e ) {
			return;
		}
		// if stopPropagation exists run it on the original event
		if ( e.stopPropagation ) {
			e.stopPropagation();
		}
		// otherwise set the cancelBubble property of the original event to true (IE)
		e.cancelBubble = true;
	},
	stopImmediatePropagation: function() {
		this.isImmediatePropagationStopped = returnTrue;
		this.stopPropagation();
	},
	isDefaultPrevented: returnFalse,
	isPropagationStopped: returnFalse,
	isImmediatePropagationStopped: returnFalse
};

// Checks if an event happened on an element within another element
// Used in jQuery.event.special.mouseenter and mouseleave handlers
var withinElement = function( event ) {
	// Check if mouse(over|out) are still within the same parent element
	var parent = event.relatedTarget;

	// Firefox sometimes assigns relatedTarget a XUL element
	// which we cannot access the parentNode property of
	try {
		// Traverse up the tree
		while ( parent && parent !== this ) {
			parent = parent.parentNode;
		}

		if ( parent !== this ) {
			// set the correct event type
			event.type = event.data;

			// handle event if we actually just moused on to a non sub-element
			jQuery.event.handle.apply( this, arguments );
		}

	// assuming we've left the element since we most likely mousedover a xul element
	} catch(e) { }
},

// In case of event delegation, we only need to rename the event.type,
// liveHandler will take care of the rest.
delegate = function( event ) {
	event.type = event.data;
	jQuery.event.handle.apply( this, arguments );
};

// Create mouseenter and mouseleave events
jQuery.each({
	mouseenter: "mouseover",
	mouseleave: "mouseout"
}, function( orig, fix ) {
	jQuery.event.special[ orig ] = {
		setup: function( data ) {
			jQuery.event.add( this, fix, data && data.selector ? delegate : withinElement, orig );
		},
		teardown: function( data ) {
			jQuery.event.remove( this, fix, data && data.selector ? delegate : withinElement );
		}
	};
});

// submit delegation
if ( !jQuery.support.submitBubbles ) {

	jQuery.event.special.submit = {
		setup: function( data, namespaces ) {
			if ( this.nodeName.toLowerCase() !== "form" ) {
				jQuery.event.add(this, "click.specialSubmit", function( e ) {
					var elem = e.target, type = elem.type;

					if ( (type === "submit" || type === "image") && jQuery( elem ).closest("form").length ) {
						return trigger( "submit", this, arguments );
					}
				});
	 
				jQuery.event.add(this, "keypress.specialSubmit", function( e ) {
					var elem = e.target, type = elem.type;

					if ( (type === "text" || type === "password") && jQuery( elem ).closest("form").length && e.keyCode === 13 ) {
						return trigger( "submit", this, arguments );
					}
				});

			} else {
				return false;
			}
		},

		teardown: function( namespaces ) {
			jQuery.event.remove( this, ".specialSubmit" );
		}
	};

}

// change delegation, happens here so we have bind.
if ( !jQuery.support.changeBubbles ) {

	var formElems = /textarea|input|select/i,

	changeFilters,

	getVal = function( elem ) {
		var type = elem.type, val = elem.value;

		if ( type === "radio" || type === "checkbox" ) {
			val = elem.checked;

		} else if ( type === "select-multiple" ) {
			val = elem.selectedIndex > -1 ?
				jQuery.map( elem.options, function( elem ) {
					return elem.selected;
				}).join("-") :
				"";

		} else if ( elem.nodeName.toLowerCase() === "select" ) {
			val = elem.selectedIndex;
		}

		return val;
	},

	testChange = function testChange( e ) {
		var elem = e.target, data, val;

		if ( !formElems.test( elem.nodeName ) || elem.readOnly ) {
			return;
		}

		data = jQuery.data( elem, "_change_data" );
		val = getVal(elem);

		// the current data will be also retrieved by beforeactivate
		if ( e.type !== "focusout" || elem.type !== "radio" ) {
			jQuery.data( elem, "_change_data", val );
		}
		
		if ( data === undefined || val === data ) {
			return;
		}

		if ( data != null || val ) {
			e.type = "change";
			return jQuery.event.trigger( e, arguments[1], elem );
		}
	};

	jQuery.event.special.change = {
		filters: {
			focusout: testChange, 

			click: function( e ) {
				var elem = e.target, type = elem.type;

				if ( type === "radio" || type === "checkbox" || elem.nodeName.toLowerCase() === "select" ) {
					return testChange.call( this, e );
				}
			},

			// Change has to be called before submit
			// Keydown will be called before keypress, which is used in submit-event delegation
			keydown: function( e ) {
				var elem = e.target, type = elem.type;

				if ( (e.keyCode === 13 && elem.nodeName.toLowerCase() !== "textarea") ||
					(e.keyCode === 32 && (type === "checkbox" || type === "radio")) ||
					type === "select-multiple" ) {
					return testChange.call( this, e );
				}
			},

			// Beforeactivate happens also before the previous element is blurred
			// with this event you can't trigger a change event, but you can store
			// information/focus[in] is not needed anymore
			beforeactivate: function( e ) {
				var elem = e.target;
				jQuery.data( elem, "_change_data", getVal(elem) );
			}
		},

		setup: function( data, namespaces ) {
			if ( this.type === "file" ) {
				return false;
			}

			for ( var type in changeFilters ) {
				jQuery.event.add( this, type + ".specialChange", changeFilters[type] );
			}

			return formElems.test( this.nodeName );
		},

		teardown: function( namespaces ) {
			jQuery.event.remove( this, ".specialChange" );

			return formElems.test( this.nodeName );
		}
	};

	changeFilters = jQuery.event.special.change.filters;
}

function trigger( type, elem, args ) {
	args[0].type = type;
	return jQuery.event.handle.apply( elem, args );
}

// Create "bubbling" focus and blur events
if ( document.addEventListener ) {
	jQuery.each({ focus: "focusin", blur: "focusout" }, function( orig, fix ) {
		jQuery.event.special[ fix ] = {
			setup: function() {
				this.addEventListener( orig, handler, true );
			}, 
			teardown: function() { 
				this.removeEventListener( orig, handler, true );
			}
		};

		function handler( e ) { 
			e = jQuery.event.fix( e );
			e.type = fix;
			return jQuery.event.handle.call( this, e );
		}
	});
}

jQuery.each(["bind", "one"], function( i, name ) {
	jQuery.fn[ name ] = function( type, data, fn ) {
		// Handle object literals
		if ( typeof type === "object" ) {
			for ( var key in type ) {
				this[ name ](key, data, type[key], fn);
			}
			return this;
		}
		
		if ( jQuery.isFunction( data ) ) {
			fn = data;
			data = undefined;
		}

		var handler = name === "one" ? jQuery.proxy( fn, function( event ) {
			jQuery( this ).unbind( event, handler );
			return fn.apply( this, arguments );
		}) : fn;

		if ( type === "unload" && name !== "one" ) {
			this.one( type, data, fn );

		} else {
			for ( var i = 0, l = this.length; i < l; i++ ) {
				jQuery.event.add( this[i], type, handler, data );
			}
		}

		return this;
	};
});

jQuery.fn.extend({
	unbind: function( type, fn ) {
		// Handle object literals
		if ( typeof type === "object" && !type.preventDefault ) {
			for ( var key in type ) {
				this.unbind(key, type[key]);
			}

		} else {
			for ( var i = 0, l = this.length; i < l; i++ ) {
				jQuery.event.remove( this[i], type, fn );
			}
		}

		return this;
	},
	
	delegate: function( selector, types, data, fn ) {
		return this.live( types, data, fn, selector );
	},
	
	undelegate: function( selector, types, fn ) {
		if ( arguments.length === 0 ) {
				return this.unbind( "live" );
		
		} else {
			return this.die( types, null, fn, selector );
		}
	},
	
	trigger: function( type, data ) {
		return this.each(function() {
			jQuery.event.trigger( type, data, this );
		});
	},

	triggerHandler: function( type, data ) {
		if ( this[0] ) {
			var event = jQuery.Event( type );
			event.preventDefault();
			event.stopPropagation();
			jQuery.event.trigger( event, data, this[0] );
			return event.result;
		}
	},

	toggle: function( fn ) {
		// Save reference to arguments for access in closure
		var args = arguments, i = 1;

		// link all the functions, so any of them can unbind this click handler
		while ( i < args.length ) {
			jQuery.proxy( fn, args[ i++ ] );
		}

		return this.click( jQuery.proxy( fn, function( event ) {
			// Figure out which function to execute
			var lastToggle = ( jQuery.data( this, "lastToggle" + fn.guid ) || 0 ) % i;
			jQuery.data( this, "lastToggle" + fn.guid, lastToggle + 1 );

			// Make sure that clicks stop
			event.preventDefault();

			// and execute the function
			return args[ lastToggle ].apply( this, arguments ) || false;
		}));
	},

	hover: function( fnOver, fnOut ) {
		return this.mouseenter( fnOver ).mouseleave( fnOut || fnOver );
	}
});

var liveMap = {
	focus: "focusin",
	blur: "focusout",
	mouseenter: "mouseover",
	mouseleave: "mouseout"
};

jQuery.each(["live", "die"], function( i, name ) {
	jQuery.fn[ name ] = function( types, data, fn, origSelector /* Internal Use Only */ ) {
		var type, i = 0, match, namespaces, preType,
			selector = origSelector || this.selector,
			context = origSelector ? this : jQuery( this.context );

		if ( jQuery.isFunction( data ) ) {
			fn = data;
			data = undefined;
		}

		types = (types || "").split(" ");

		while ( (type = types[ i++ ]) != null ) {
			match = rnamespaces.exec( type );
			namespaces = "";

			if ( match )  {
				namespaces = match[0];
				type = type.replace( rnamespaces, "" );
			}

			if ( type === "hover" ) {
				types.push( "mouseenter" + namespaces, "mouseleave" + namespaces );
				continue;
			}

			preType = type;

			if ( type === "focus" || type === "blur" ) {
				types.push( liveMap[ type ] + namespaces );
				type = type + namespaces;

			} else {
				type = (liveMap[ type ] || type) + namespaces;
			}

			if ( name === "live" ) {
				// bind live handler
				context.each(function(){
					jQuery.event.add( this, liveConvert( type, selector ),
						{ data: data, selector: selector, handler: fn, origType: type, origHandler: fn, preType: preType } );
				});

			} else {
				// unbind live handler
				context.unbind( liveConvert( type, selector ), fn );
			}
		}
		
		return this;
	}
});

function liveHandler( event ) {
	var stop, elems = [], selectors = [], args = arguments,
		related, match, handleObj, elem, j, i, l, data,
		events = jQuery.data( this, "events" );

	// Make sure we avoid non-left-click bubbling in Firefox (#3861)
	if ( event.liveFired === this || !events || !events.live || event.button && event.type === "click" ) {
		return;
	}

	event.liveFired = this;

	var live = events.live.slice(0);

	for ( j = 0; j < live.length; j++ ) {
		handleObj = live[j];

		if ( handleObj.origType.replace( rnamespaces, "" ) === event.type ) {
			selectors.push( handleObj.selector );

		} else {
			live.splice( j--, 1 );
		}
	}

	match = jQuery( event.target ).closest( selectors, event.currentTarget );

	for ( i = 0, l = match.length; i < l; i++ ) {
		for ( j = 0; j < live.length; j++ ) {
			handleObj = live[j];

			if ( match[i].selector === handleObj.selector ) {
				elem = match[i].elem;
				related = null;

				// Those two events require additional checking
				if ( handleObj.preType === "mouseenter" || handleObj.preType === "mouseleave" ) {
					related = jQuery( event.relatedTarget ).closest( handleObj.selector )[0];
				}

				if ( !related || related !== elem ) {
					elems.push({ elem: elem, handleObj: handleObj });
				}
			}
		}
	}

	for ( i = 0, l = elems.length; i < l; i++ ) {
		match = elems[i];
		event.currentTarget = match.elem;
		event.data = match.handleObj.data;
		event.handleObj = match.handleObj;

		if ( match.handleObj.origHandler.apply( match.elem, args ) === false ) {
			stop = false;
			break;
		}
	}

	return stop;
}

function liveConvert( type, selector ) {
	return "live." + (type && type !== "*" ? type + "." : "") + selector.replace(/\./g, "`").replace(/ /g, "&");
}

jQuery.each( ("blur focus focusin focusout load resize scroll unload click dblclick " +
	"mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave " +
	"change select submit keydown keypress keyup error").split(" "), function( i, name ) {

	// Handle event binding
	jQuery.fn[ name ] = function( fn ) {
		return fn ? this.bind( name, fn ) : this.trigger( name );
	};

	if ( jQuery.attrFn ) {
		jQuery.attrFn[ name ] = true;
	}
});

// Prevent memory leaks in IE
// Window isn't included so as not to unbind existing unload events
// More info:
//  - http://isaacschlueter.com/2006/10/msie-memory-leaks/
if ( window.attachEvent && !window.addEventListener ) {
	window.attachEvent("onunload", function() {
		for ( var id in jQuery.cache ) {
			if ( jQuery.cache[ id ].handle ) {
				// Try/Catch is to handle iframes being unloaded, see #4280
				try {
					jQuery.event.remove( jQuery.cache[ id ].handle.elem );
				} catch(e) {}
			}
		}
	});
}
/*!
 * Sizzle CSS Selector Engine - v1.0
 *  Copyright 2009, The Dojo Foundation
 *  Released under the MIT, BSD, and GPL Licenses.
 *  More information: http://sizzlejs.com/
 */
(function(){

var chunker = /((?:\((?:\([^()]+\)|[^()]+)+\)|\[(?:\[[^[\]]*\]|['"][^'"]*['"]|[^[\]'"]+)+\]|\\.|[^ >+~,(\[\\]+)+|[>+~])(\s*,\s*)?((?:.|\r|\n)*)/g,
	done = 0,
	toString = Object.prototype.toString,
	hasDuplicate = false,
	baseHasDuplicate = true;

// Here we check if the JavaScript engine is using some sort of
// optimization where it does not always call our comparision
// function. If that is the case, discard the hasDuplicate value.
//   Thus far that includes Google Chrome.
[0, 0].sort(function(){
	baseHasDuplicate = false;
	return 0;
});

var Sizzle = function(selector, context, results, seed) {
	results = results || [];
	var origContext = context = context || document;

	if ( context.nodeType !== 1 && context.nodeType !== 9 ) {
		return [];
	}
	
	if ( !selector || typeof selector !== "string" ) {
		return results;
	}

	var parts = [], m, set, checkSet, extra, prune = true, contextXML = isXML(context),
		soFar = selector;
	
	// Reset the position of the chunker regexp (start from head)
	while ( (chunker.exec(""), m = chunker.exec(soFar)) !== null ) {
		soFar = m[3];
		
		parts.push( m[1] );
		
		if ( m[2] ) {
			extra = m[3];
			break;
		}
	}

	if ( parts.length > 1 && origPOS.exec( selector ) ) {
		if ( parts.length === 2 && Expr.relative[ parts[0] ] ) {
			set = posProcess( parts[0] + parts[1], context );
		} else {
			set = Expr.relative[ parts[0] ] ?
				[ context ] :
				Sizzle( parts.shift(), context );

			while ( parts.length ) {
				selector = parts.shift();

				if ( Expr.relative[ selector ] ) {
					selector += parts.shift();
				}
				
				set = posProcess( selector, set );
			}
		}
	} else {
		// Take a shortcut and set the context if the root selector is an ID
		// (but not if it'll be faster if the inner selector is an ID)
		if ( !seed && parts.length > 1 && context.nodeType === 9 && !contextXML &&
				Expr.match.ID.test(parts[0]) && !Expr.match.ID.test(parts[parts.length - 1]) ) {
			var ret = Sizzle.find( parts.shift(), context, contextXML );
			context = ret.expr ? Sizzle.filter( ret.expr, ret.set )[0] : ret.set[0];
		}

		if ( context ) {
			var ret = seed ?
				{ expr: parts.pop(), set: makeArray(seed) } :
				Sizzle.find( parts.pop(), parts.length === 1 && (parts[0] === "~" || parts[0] === "+") && context.parentNode ? context.parentNode : context, contextXML );
			set = ret.expr ? Sizzle.filter( ret.expr, ret.set ) : ret.set;

			if ( parts.length > 0 ) {
				checkSet = makeArray(set);
			} else {
				prune = false;
			}

			while ( parts.length ) {
				var cur = parts.pop(), pop = cur;

				if ( !Expr.relative[ cur ] ) {
					cur = "";
				} else {
					pop = parts.pop();
				}

				if ( pop == null ) {
					pop = context;
				}

				Expr.relative[ cur ]( checkSet, pop, contextXML );
			}
		} else {
			checkSet = parts = [];
		}
	}

	if ( !checkSet ) {
		checkSet = set;
	}

	if ( !checkSet ) {
		Sizzle.error( cur || selector );
	}

	if ( toString.call(checkSet) === "[object Array]" ) {
		if ( !prune ) {
			results.push.apply( results, checkSet );
		} else if ( context && context.nodeType === 1 ) {
			for ( var i = 0; checkSet[i] != null; i++ ) {
				if ( checkSet[i] && (checkSet[i] === true || checkSet[i].nodeType === 1 && contains(context, checkSet[i])) ) {
					results.push( set[i] );
				}
			}
		} else {
			for ( var i = 0; checkSet[i] != null; i++ ) {
				if ( checkSet[i] && checkSet[i].nodeType === 1 ) {
					results.push( set[i] );
				}
			}
		}
	} else {
		makeArray( checkSet, results );
	}

	if ( extra ) {
		Sizzle( extra, origContext, results, seed );
		Sizzle.uniqueSort( results );
	}

	return results;
};

Sizzle.uniqueSort = function(results){
	if ( sortOrder ) {
		hasDuplicate = baseHasDuplicate;
		results.sort(sortOrder);

		if ( hasDuplicate ) {
			for ( var i = 1; i < results.length; i++ ) {
				if ( results[i] === results[i-1] ) {
					results.splice(i--, 1);
				}
			}
		}
	}

	return results;
};

Sizzle.matches = function(expr, set){
	return Sizzle(expr, null, null, set);
};

Sizzle.find = function(expr, context, isXML){
	var set, match;

	if ( !expr ) {
		return [];
	}

	for ( var i = 0, l = Expr.order.length; i < l; i++ ) {
		var type = Expr.order[i], match;
		
		if ( (match = Expr.leftMatch[ type ].exec( expr )) ) {
			var left = match[1];
			match.splice(1,1);

			if ( left.substr( left.length - 1 ) !== "\\" ) {
				match[1] = (match[1] || "").replace(/\\/g, "");
				set = Expr.find[ type ]( match, context, isXML );
				if ( set != null ) {
					expr = expr.replace( Expr.match[ type ], "" );
					break;
				}
			}
		}
	}

	if ( !set ) {
		set = context.getElementsByTagName("*");
	}

	return {set: set, expr: expr};
};

Sizzle.filter = function(expr, set, inplace, not){
	var old = expr, result = [], curLoop = set, match, anyFound,
		isXMLFilter = set && set[0] && isXML(set[0]);

	while ( expr && set.length ) {
		for ( var type in Expr.filter ) {
			if ( (match = Expr.leftMatch[ type ].exec( expr )) != null && match[2] ) {
				var filter = Expr.filter[ type ], found, item, left = match[1];
				anyFound = false;

				match.splice(1,1);

				if ( left.substr( left.length - 1 ) === "\\" ) {
					continue;
				}

				if ( curLoop === result ) {
					result = [];
				}

				if ( Expr.preFilter[ type ] ) {
					match = Expr.preFilter[ type ]( match, curLoop, inplace, result, not, isXMLFilter );

					if ( !match ) {
						anyFound = found = true;
					} else if ( match === true ) {
						continue;
					}
				}

				if ( match ) {
					for ( var i = 0; (item = curLoop[i]) != null; i++ ) {
						if ( item ) {
							found = filter( item, match, i, curLoop );
							var pass = not ^ !!found;

							if ( inplace && found != null ) {
								if ( pass ) {
									anyFound = true;
								} else {
									curLoop[i] = false;
								}
							} else if ( pass ) {
								result.push( item );
								anyFound = true;
							}
						}
					}
				}

				if ( found !== undefined ) {
					if ( !inplace ) {
						curLoop = result;
					}

					expr = expr.replace( Expr.match[ type ], "" );

					if ( !anyFound ) {
						return [];
					}

					break;
				}
			}
		}

		// Improper expression
		if ( expr === old ) {
			if ( anyFound == null ) {
				Sizzle.error( expr );
			} else {
				break;
			}
		}

		old = expr;
	}

	return curLoop;
};

Sizzle.error = function( msg ) {
	throw "Syntax error, unrecognized expression: " + msg;
};

var Expr = Sizzle.selectors = {
	order: [ "ID", "NAME", "TAG" ],
	match: {
		ID: /#((?:[\w\u00c0-\uFFFF-]|\\.)+)/,
		CLASS: /\.((?:[\w\u00c0-\uFFFF-]|\\.)+)/,
		NAME: /\[name=['"]*((?:[\w\u00c0-\uFFFF-]|\\.)+)['"]*\]/,
		ATTR: /\[\s*((?:[\w\u00c0-\uFFFF-]|\\.)+)\s*(?:(\S?=)\s*(['"]*)(.*?)\3|)\s*\]/,
		TAG: /^((?:[\w\u00c0-\uFFFF\*-]|\\.)+)/,
		CHILD: /:(only|nth|last|first)-child(?:\((even|odd|[\dn+-]*)\))?/,
		POS: /:(nth|eq|gt|lt|first|last|even|odd)(?:\((\d*)\))?(?=[^-]|$)/,
		PSEUDO: /:((?:[\w\u00c0-\uFFFF-]|\\.)+)(?:\((['"]?)((?:\([^\)]+\)|[^\(\)]*)+)\2\))?/
	},
	leftMatch: {},
	attrMap: {
		"class": "className",
		"for": "htmlFor"
	},
	attrHandle: {
		href: function(elem){
			return elem.getAttribute("href");
		}
	},
	relative: {
		"+": function(checkSet, part){
			var isPartStr = typeof part === "string",
				isTag = isPartStr && !/\W/.test(part),
				isPartStrNotTag = isPartStr && !isTag;

			if ( isTag ) {
				part = part.toLowerCase();
			}

			for ( var i = 0, l = checkSet.length, elem; i < l; i++ ) {
				if ( (elem = checkSet[i]) ) {
					while ( (elem = elem.previousSibling) && elem.nodeType !== 1 ) {}

					checkSet[i] = isPartStrNotTag || elem && elem.nodeName.toLowerCase() === part ?
						elem || false :
						elem === part;
				}
			}

			if ( isPartStrNotTag ) {
				Sizzle.filter( part, checkSet, true );
			}
		},
		">": function(checkSet, part){
			var isPartStr = typeof part === "string";

			if ( isPartStr && !/\W/.test(part) ) {
				part = part.toLowerCase();

				for ( var i = 0, l = checkSet.length; i < l; i++ ) {
					var elem = checkSet[i];
					if ( elem ) {
						var parent = elem.parentNode;
						checkSet[i] = parent.nodeName.toLowerCase() === part ? parent : false;
					}
				}
			} else {
				for ( var i = 0, l = checkSet.length; i < l; i++ ) {
					var elem = checkSet[i];
					if ( elem ) {
						checkSet[i] = isPartStr ?
							elem.parentNode :
							elem.parentNode === part;
					}
				}

				if ( isPartStr ) {
					Sizzle.filter( part, checkSet, true );
				}
			}
		},
		"": function(checkSet, part, isXML){
			var doneName = done++, checkFn = dirCheck;

			if ( typeof part === "string" && !/\W/.test(part) ) {
				var nodeCheck = part = part.toLowerCase();
				checkFn = dirNodeCheck;
			}

			checkFn("parentNode", part, doneName, checkSet, nodeCheck, isXML);
		},
		"~": function(checkSet, part, isXML){
			var doneName = done++, checkFn = dirCheck;

			if ( typeof part === "string" && !/\W/.test(part) ) {
				var nodeCheck = part = part.toLowerCase();
				checkFn = dirNodeCheck;
			}

			checkFn("previousSibling", part, doneName, checkSet, nodeCheck, isXML);
		}
	},
	find: {
		ID: function(match, context, isXML){
			if ( typeof context.getElementById !== "undefined" && !isXML ) {
				var m = context.getElementById(match[1]);
				return m ? [m] : [];
			}
		},
		NAME: function(match, context){
			if ( typeof context.getElementsByName !== "undefined" ) {
				var ret = [], results = context.getElementsByName(match[1]);

				for ( var i = 0, l = results.length; i < l; i++ ) {
					if ( results[i].getAttribute("name") === match[1] ) {
						ret.push( results[i] );
					}
				}

				return ret.length === 0 ? null : ret;
			}
		},
		TAG: function(match, context){
			return context.getElementsByTagName(match[1]);
		}
	},
	preFilter: {
		CLASS: function(match, curLoop, inplace, result, not, isXML){
			match = " " + match[1].replace(/\\/g, "") + " ";

			if ( isXML ) {
				return match;
			}

			for ( var i = 0, elem; (elem = curLoop[i]) != null; i++ ) {
				if ( elem ) {
					if ( not ^ (elem.className && (" " + elem.className + " ").replace(/[\t\n]/g, " ").indexOf(match) >= 0) ) {
						if ( !inplace ) {
							result.push( elem );
						}
					} else if ( inplace ) {
						curLoop[i] = false;
					}
				}
			}

			return false;
		},
		ID: function(match){
			return match[1].replace(/\\/g, "");
		},
		TAG: function(match, curLoop){
			return match[1].toLowerCase();
		},
		CHILD: function(match){
			if ( match[1] === "nth" ) {
				// parse equations like 'even', 'odd', '5', '2n', '3n+2', '4n-1', '-n+6'
				var test = /(-?)(\d*)n((?:\+|-)?\d*)/.exec(
					match[2] === "even" && "2n" || match[2] === "odd" && "2n+1" ||
					!/\D/.test( match[2] ) && "0n+" + match[2] || match[2]);

				// calculate the numbers (first)n+(last) including if they are negative
				match[2] = (test[1] + (test[2] || 1)) - 0;
				match[3] = test[3] - 0;
			}

			// TODO: Move to normal caching system
			match[0] = done++;

			return match;
		},
		ATTR: function(match, curLoop, inplace, result, not, isXML){
			var name = match[1].replace(/\\/g, "");
			
			if ( !isXML && Expr.attrMap[name] ) {
				match[1] = Expr.attrMap[name];
			}

			if ( match[2] === "~=" ) {
				match[4] = " " + match[4] + " ";
			}

			return match;
		},
		PSEUDO: function(match, curLoop, inplace, result, not){
			if ( match[1] === "not" ) {
				// If we're dealing with a complex expression, or a simple one
				if ( ( chunker.exec(match[3]) || "" ).length > 1 || /^\w/.test(match[3]) ) {
					match[3] = Sizzle(match[3], null, null, curLoop);
				} else {
					var ret = Sizzle.filter(match[3], curLoop, inplace, true ^ not);
					if ( !inplace ) {
						result.push.apply( result, ret );
					}
					return false;
				}
			} else if ( Expr.match.POS.test( match[0] ) || Expr.match.CHILD.test( match[0] ) ) {
				return true;
			}
			
			return match;
		},
		POS: function(match){
			match.unshift( true );
			return match;
		}
	},
	filters: {
		enabled: function(elem){
			return elem.disabled === false && elem.type !== "hidden";
		},
		disabled: function(elem){
			return elem.disabled === true;
		},
		checked: function(elem){
			return elem.checked === true;
		},
		selected: function(elem){
			// Accessing this property makes selected-by-default
			// options in Safari work properly
			elem.parentNode.selectedIndex;
			return elem.selected === true;
		},
		parent: function(elem){
			return !!elem.firstChild;
		},
		empty: function(elem){
			return !elem.firstChild;
		},
		has: function(elem, i, match){
			return !!Sizzle( match[3], elem ).length;
		},
		header: function(elem){
			return /h\d/i.test( elem.nodeName );
		},
		text: function(elem){
			return "text" === elem.type;
		},
		radio: function(elem){
			return "radio" === elem.type;
		},
		checkbox: function(elem){
			return "checkbox" === elem.type;
		},
		file: function(elem){
			return "file" === elem.type;
		},
		password: function(elem){
			return "password" === elem.type;
		},
		submit: function(elem){
			return "submit" === elem.type;
		},
		image: function(elem){
			return "image" === elem.type;
		},
		reset: function(elem){
			return "reset" === elem.type;
		},
		button: function(elem){
			return "button" === elem.type || elem.nodeName.toLowerCase() === "button";
		},
		input: function(elem){
			return /input|select|textarea|button/i.test(elem.nodeName);
		}
	},
	setFilters: {
		first: function(elem, i){
			return i === 0;
		},
		last: function(elem, i, match, array){
			return i === array.length - 1;
		},
		even: function(elem, i){
			return i % 2 === 0;
		},
		odd: function(elem, i){
			return i % 2 === 1;
		},
		lt: function(elem, i, match){
			return i < match[3] - 0;
		},
		gt: function(elem, i, match){
			return i > match[3] - 0;
		},
		nth: function(elem, i, match){
			return match[3] - 0 === i;
		},
		eq: function(elem, i, match){
			return match[3] - 0 === i;
		}
	},
	filter: {
		PSEUDO: function(elem, match, i, array){
			var name = match[1], filter = Expr.filters[ name ];

			if ( filter ) {
				return filter( elem, i, match, array );
			} else if ( name === "contains" ) {
				return (elem.textContent || elem.innerText || getText([ elem ]) || "").indexOf(match[3]) >= 0;
			} else if ( name === "not" ) {
				var not = match[3];

				for ( var i = 0, l = not.length; i < l; i++ ) {
					if ( not[i] === elem ) {
						return false;
					}
				}

				return true;
			} else {
				Sizzle.error( "Syntax error, unrecognized expression: " + name );
			}
		},
		CHILD: function(elem, match){
			var type = match[1], node = elem;
			switch (type) {
				case 'only':
				case 'first':
					while ( (node = node.previousSibling) )	 {
						if ( node.nodeType === 1 ) { 
							return false; 
						}
					}
					if ( type === "first" ) { 
						return true; 
					}
					node = elem;
				case 'last':
					while ( (node = node.nextSibling) )	 {
						if ( node.nodeType === 1 ) { 
							return false; 
						}
					}
					return true;
				case 'nth':
					var first = match[2], last = match[3];

					if ( first === 1 && last === 0 ) {
						return true;
					}
					
					var doneName = match[0],
						parent = elem.parentNode;
	
					if ( parent && (parent.sizcache !== doneName || !elem.nodeIndex) ) {
						var count = 0;
						for ( node = parent.firstChild; node; node = node.nextSibling ) {
							if ( node.nodeType === 1 ) {
								node.nodeIndex = ++count;
							}
						} 
						parent.sizcache = doneName;
					}
					
					var diff = elem.nodeIndex - last;
					if ( first === 0 ) {
						return diff === 0;
					} else {
						return ( diff % first === 0 && diff / first >= 0 );
					}
			}
		},
		ID: function(elem, match){
			return elem.nodeType === 1 && elem.getAttribute("id") === match;
		},
		TAG: function(elem, match){
			return (match === "*" && elem.nodeType === 1) || elem.nodeName.toLowerCase() === match;
		},
		CLASS: function(elem, match){
			return (" " + (elem.className || elem.getAttribute("class")) + " ")
				.indexOf( match ) > -1;
		},
		ATTR: function(elem, match){
			var name = match[1],
				result = Expr.attrHandle[ name ] ?
					Expr.attrHandle[ name ]( elem ) :
					elem[ name ] != null ?
						elem[ name ] :
						elem.getAttribute( name ),
				value = result + "",
				type = match[2],
				check = match[4];

			return result == null ?
				type === "!=" :
				type === "=" ?
				value === check :
				type === "*=" ?
				value.indexOf(check) >= 0 :
				type === "~=" ?
				(" " + value + " ").indexOf(check) >= 0 :
				!check ?
				value && result !== false :
				type === "!=" ?
				value !== check :
				type === "^=" ?
				value.indexOf(check) === 0 :
				type === "$=" ?
				value.substr(value.length - check.length) === check :
				type === "|=" ?
				value === check || value.substr(0, check.length + 1) === check + "-" :
				false;
		},
		POS: function(elem, match, i, array){
			var name = match[2], filter = Expr.setFilters[ name ];

			if ( filter ) {
				return filter( elem, i, match, array );
			}
		}
	}
};

var origPOS = Expr.match.POS;

for ( var type in Expr.match ) {
	Expr.match[ type ] = new RegExp( Expr.match[ type ].source + /(?![^\[]*\])(?![^\(]*\))/.source );
	Expr.leftMatch[ type ] = new RegExp( /(^(?:.|\r|\n)*?)/.source + Expr.match[ type ].source.replace(/\\(\d+)/g, function(all, num){
		return "\\" + (num - 0 + 1);
	}));
}

var makeArray = function(array, results) {
	array = Array.prototype.slice.call( array, 0 );

	if ( results ) {
		results.push.apply( results, array );
		return results;
	}
	
	return array;
};

// Perform a simple check to determine if the browser is capable of
// converting a NodeList to an array using builtin methods.
// Also verifies that the returned array holds DOM nodes
// (which is not the case in the Blackberry browser)
try {
	Array.prototype.slice.call( document.documentElement.childNodes, 0 )[0].nodeType;

// Provide a fallback method if it does not work
} catch(e){
	makeArray = function(array, results) {
		var ret = results || [];

		if ( toString.call(array) === "[object Array]" ) {
			Array.prototype.push.apply( ret, array );
		} else {
			if ( typeof array.length === "number" ) {
				for ( var i = 0, l = array.length; i < l; i++ ) {
					ret.push( array[i] );
				}
			} else {
				for ( var i = 0; array[i]; i++ ) {
					ret.push( array[i] );
				}
			}
		}

		return ret;
	};
}

var sortOrder;

if ( document.documentElement.compareDocumentPosition ) {
	sortOrder = function( a, b ) {
		if ( !a.compareDocumentPosition || !b.compareDocumentPosition ) {
			if ( a == b ) {
				hasDuplicate = true;
			}
			return a.compareDocumentPosition ? -1 : 1;
		}

		var ret = a.compareDocumentPosition(b) & 4 ? -1 : a === b ? 0 : 1;
		if ( ret === 0 ) {
			hasDuplicate = true;
		}
		return ret;
	};
} else if ( "sourceIndex" in document.documentElement ) {
	sortOrder = function( a, b ) {
		if ( !a.sourceIndex || !b.sourceIndex ) {
			if ( a == b ) {
				hasDuplicate = true;
			}
			return a.sourceIndex ? -1 : 1;
		}

		var ret = a.sourceIndex - b.sourceIndex;
		if ( ret === 0 ) {
			hasDuplicate = true;
		}
		return ret;
	};
} else if ( document.createRange ) {
	sortOrder = function( a, b ) {
		if ( !a.ownerDocument || !b.ownerDocument ) {
			if ( a == b ) {
				hasDuplicate = true;
			}
			return a.ownerDocument ? -1 : 1;
		}

		var aRange = a.ownerDocument.createRange(), bRange = b.ownerDocument.createRange();
		aRange.setStart(a, 0);
		aRange.setEnd(a, 0);
		bRange.setStart(b, 0);
		bRange.setEnd(b, 0);
		var ret = aRange.compareBoundaryPoints(Range.START_TO_END, bRange);
		if ( ret === 0 ) {
			hasDuplicate = true;
		}
		return ret;
	};
}

// Utility function for retreiving the text value of an array of DOM nodes
function getText( elems ) {
	var ret = "", elem;

	for ( var i = 0; elems[i]; i++ ) {
		elem = elems[i];

		// Get the text from text nodes and CDATA nodes
		if ( elem.nodeType === 3 || elem.nodeType === 4 ) {
			ret += elem.nodeValue;

		// Traverse everything else, except comment nodes
		} else if ( elem.nodeType !== 8 ) {
			ret += getText( elem.childNodes );
		}
	}

	return ret;
}

// Check to see if the browser returns elements by name when
// querying by getElementById (and provide a workaround)
(function(){
	// We're going to inject a fake input element with a specified name
	var form = document.createElement("div"),
		id = "script" + (new Date).getTime();
	form.innerHTML = "<a name='" + id + "'/>";

	// Inject it into the root element, check its status, and remove it quickly
	var root = document.documentElement;
	root.insertBefore( form, root.firstChild );

	// The workaround has to do additional checks after a getElementById
	// Which slows things down for other browsers (hence the branching)
	if ( document.getElementById( id ) ) {
		Expr.find.ID = function(match, context, isXML){
			if ( typeof context.getElementById !== "undefined" && !isXML ) {
				var m = context.getElementById(match[1]);
				return m ? m.id === match[1] || typeof m.getAttributeNode !== "undefined" && m.getAttributeNode("id").nodeValue === match[1] ? [m] : undefined : [];
			}
		};

		Expr.filter.ID = function(elem, match){
			var node = typeof elem.getAttributeNode !== "undefined" && elem.getAttributeNode("id");
			return elem.nodeType === 1 && node && node.nodeValue === match;
		};
	}

	root.removeChild( form );
	root = form = null; // release memory in IE
})();

(function(){
	// Check to see if the browser returns only elements
	// when doing getElementsByTagName("*")

	// Create a fake element
	var div = document.createElement("div");
	div.appendChild( document.createComment("") );

	// Make sure no comments are found
	if ( div.getElementsByTagName("*").length > 0 ) {
		Expr.find.TAG = function(match, context){
			var results = context.getElementsByTagName(match[1]);

			// Filter out possible comments
			if ( match[1] === "*" ) {
				var tmp = [];

				for ( var i = 0; results[i]; i++ ) {
					if ( results[i].nodeType === 1 ) {
						tmp.push( results[i] );
					}
				}

				results = tmp;
			}

			return results;
		};
	}

	// Check to see if an attribute returns normalized href attributes
	div.innerHTML = "<a href='#'></a>";
	if ( div.firstChild && typeof div.firstChild.getAttribute !== "undefined" &&
			div.firstChild.getAttribute("href") !== "#" ) {
		Expr.attrHandle.href = function(elem){
			return elem.getAttribute("href", 2);
		};
	}

	div = null; // release memory in IE
})();

if ( document.querySelectorAll ) {
	(function(){
		var oldSizzle = Sizzle, div = document.createElement("div");
		div.innerHTML = "<p class='TEST'></p>";

		// Safari can't handle uppercase or unicode characters when
		// in quirks mode.
		if ( div.querySelectorAll && div.querySelectorAll(".TEST").length === 0 ) {
			return;
		}
	
		Sizzle = function(query, context, extra, seed){
			context = context || document;

			// Only use querySelectorAll on non-XML documents
			// (ID selectors don't work in non-HTML documents)
			if ( !seed && context.nodeType === 9 && !isXML(context) ) {
				try {
					return makeArray( context.querySelectorAll(query), extra );
				} catch(e){}
			}
		
			return oldSizzle(query, context, extra, seed);
		};

		for ( var prop in oldSizzle ) {
			Sizzle[ prop ] = oldSizzle[ prop ];
		}

		div = null; // release memory in IE
	})();
}

(function(){
	var div = document.createElement("div");

	div.innerHTML = "<div class='test e'></div><div class='test'></div>";

	// Opera can't find a second classname (in 9.6)
	// Also, make sure that getElementsByClassName actually exists
	if ( !div.getElementsByClassName || div.getElementsByClassName("e").length === 0 ) {
		return;
	}

	// Safari caches class attributes, doesn't catch changes (in 3.2)
	div.lastChild.className = "e";

	if ( div.getElementsByClassName("e").length === 1 ) {
		return;
	}
	
	Expr.order.splice(1, 0, "CLASS");
	Expr.find.CLASS = function(match, context, isXML) {
		if ( typeof context.getElementsByClassName !== "undefined" && !isXML ) {
			return context.getElementsByClassName(match[1]);
		}
	};

	div = null; // release memory in IE
})();

function dirNodeCheck( dir, cur, doneName, checkSet, nodeCheck, isXML ) {
	for ( var i = 0, l = checkSet.length; i < l; i++ ) {
		var elem = checkSet[i];
		if ( elem ) {
			elem = elem[dir];
			var match = false;

			while ( elem ) {
				if ( elem.sizcache === doneName ) {
					match = checkSet[elem.sizset];
					break;
				}

				if ( elem.nodeType === 1 && !isXML ){
					elem.sizcache = doneName;
					elem.sizset = i;
				}

				if ( elem.nodeName.toLowerCase() === cur ) {
					match = elem;
					break;
				}

				elem = elem[dir];
			}

			checkSet[i] = match;
		}
	}
}

function dirCheck( dir, cur, doneName, checkSet, nodeCheck, isXML ) {
	for ( var i = 0, l = checkSet.length; i < l; i++ ) {
		var elem = checkSet[i];
		if ( elem ) {
			elem = elem[dir];
			var match = false;

			while ( elem ) {
				if ( elem.sizcache === doneName ) {
					match = checkSet[elem.sizset];
					break;
				}

				if ( elem.nodeType === 1 ) {
					if ( !isXML ) {
						elem.sizcache = doneName;
						elem.sizset = i;
					}
					if ( typeof cur !== "string" ) {
						if ( elem === cur ) {
							match = true;
							break;
						}

					} else if ( Sizzle.filter( cur, [elem] ).length > 0 ) {
						match = elem;
						break;
					}
				}

				elem = elem[dir];
			}

			checkSet[i] = match;
		}
	}
}

var contains = document.compareDocumentPosition ? function(a, b){
	return !!(a.compareDocumentPosition(b) & 16);
} : function(a, b){
	return a !== b && (a.contains ? a.contains(b) : true);
};

var isXML = function(elem){
	// documentElement is verified for cases where it doesn't yet exist
	// (such as loading iframes in IE - #4833) 
	var documentElement = (elem ? elem.ownerDocument || elem : 0).documentElement;
	return documentElement ? documentElement.nodeName !== "HTML" : false;
};

var posProcess = function(selector, context){
	var tmpSet = [], later = "", match,
		root = context.nodeType ? [context] : context;

	// Position selectors must be done after the filter
	// And so must :not(positional) so we move all PSEUDOs to the end
	while ( (match = Expr.match.PSEUDO.exec( selector )) ) {
		later += match[0];
		selector = selector.replace( Expr.match.PSEUDO, "" );
	}

	selector = Expr.relative[selector] ? selector + "*" : selector;

	for ( var i = 0, l = root.length; i < l; i++ ) {
		Sizzle( selector, root[i], tmpSet );
	}

	return Sizzle.filter( later, tmpSet );
};

// EXPOSE
jQuery.find = Sizzle;
jQuery.expr = Sizzle.selectors;
jQuery.expr[":"] = jQuery.expr.filters;
jQuery.unique = Sizzle.uniqueSort;
jQuery.text = getText;
jQuery.isXMLDoc = isXML;
jQuery.contains = contains;

return;

window.Sizzle = Sizzle;

})();
var runtil = /Until$/,
	rparentsprev = /^(?:parents|prevUntil|prevAll)/,
	// Note: This RegExp should be improved, or likely pulled from Sizzle
	rmultiselector = /,/,
	slice = Array.prototype.slice;

// Implement the identical functionality for filter and not
var winnow = function( elements, qualifier, keep ) {
	if ( jQuery.isFunction( qualifier ) ) {
		return jQuery.grep(elements, function( elem, i ) {
			return !!qualifier.call( elem, i, elem ) === keep;
		});

	} else if ( qualifier.nodeType ) {
		return jQuery.grep(elements, function( elem, i ) {
			return (elem === qualifier) === keep;
		});

	} else if ( typeof qualifier === "string" ) {
		var filtered = jQuery.grep(elements, function( elem ) {
			return elem.nodeType === 1;
		});

		if ( isSimple.test( qualifier ) ) {
			return jQuery.filter(qualifier, filtered, !keep);
		} else {
			qualifier = jQuery.filter( qualifier, filtered );
		}
	}

	return jQuery.grep(elements, function( elem, i ) {
		return (jQuery.inArray( elem, qualifier ) >= 0) === keep;
	});
};

jQuery.fn.extend({
	find: function( selector ) {
		var ret = this.pushStack( "", "find", selector ), length = 0;

		for ( var i = 0, l = this.length; i < l; i++ ) {
			length = ret.length;
			jQuery.find( selector, this[i], ret );

			if ( i > 0 ) {
				// Make sure that the results are unique
				for ( var n = length; n < ret.length; n++ ) {
					for ( var r = 0; r < length; r++ ) {
						if ( ret[r] === ret[n] ) {
							ret.splice(n--, 1);
							break;
						}
					}
				}
			}
		}

		return ret;
	},

	has: function( target ) {
		var targets = jQuery( target );
		return this.filter(function() {
			for ( var i = 0, l = targets.length; i < l; i++ ) {
				if ( jQuery.contains( this, targets[i] ) ) {
					return true;
				}
			}
		});
	},

	not: function( selector ) {
		return this.pushStack( winnow(this, selector, false), "not", selector);
	},

	filter: function( selector ) {
		return this.pushStack( winnow(this, selector, true), "filter", selector );
	},
	
	is: function( selector ) {
		return !!selector && jQuery.filter( selector, this ).length > 0;
	},

	closest: function( selectors, context ) {
		if ( jQuery.isArray( selectors ) ) {
			var ret = [], cur = this[0], match, matches = {}, selector;

			if ( cur && selectors.length ) {
				for ( var i = 0, l = selectors.length; i < l; i++ ) {
					selector = selectors[i];

					if ( !matches[selector] ) {
						matches[selector] = jQuery.expr.match.POS.test( selector ) ? 
							jQuery( selector, context || this.context ) :
							selector;
					}
				}

				while ( cur && cur.ownerDocument && cur !== context ) {
					for ( selector in matches ) {
						match = matches[selector];

						if ( match.jquery ? match.index(cur) > -1 : jQuery(cur).is(match) ) {
							ret.push({ selector: selector, elem: cur });
							delete matches[selector];
						}
					}
					cur = cur.parentNode;
				}
			}

			return ret;
		}

		var pos = jQuery.expr.match.POS.test( selectors ) ? 
			jQuery( selectors, context || this.context ) : null;

		return this.map(function( i, cur ) {
			while ( cur && cur.ownerDocument && cur !== context ) {
				if ( pos ? pos.index(cur) > -1 : jQuery(cur).is(selectors) ) {
					return cur;
				}
				cur = cur.parentNode;
			}
			return null;
		});
	},
	
	// Determine the position of an element within
	// the matched set of elements
	index: function( elem ) {
		if ( !elem || typeof elem === "string" ) {
			return jQuery.inArray( this[0],
				// If it receives a string, the selector is used
				// If it receives nothing, the siblings are used
				elem ? jQuery( elem ) : this.parent().children() );
		}
		// Locate the position of the desired element
		return jQuery.inArray(
			// If it receives a jQuery object, the first element is used
			elem.jquery ? elem[0] : elem, this );
	},

	add: function( selector, context ) {
		var set = typeof selector === "string" ?
				jQuery( selector, context || this.context ) :
				jQuery.makeArray( selector ),
			all = jQuery.merge( this.get(), set );

		return this.pushStack( isDisconnected( set[0] ) || isDisconnected( all[0] ) ?
			all :
			jQuery.unique( all ) );
	},

	andSelf: function() {
		return this.add( this.prevObject );
	}
});

// A painfully simple check to see if an element is disconnected
// from a document (should be improved, where feasible).
function isDisconnected( node ) {
	return !node || !node.parentNode || node.parentNode.nodeType === 11;
}

jQuery.each({
	parent: function( elem ) {
		var parent = elem.parentNode;
		return parent && parent.nodeType !== 11 ? parent : null;
	},
	parents: function( elem ) {
		return jQuery.dir( elem, "parentNode" );
	},
	parentsUntil: function( elem, i, until ) {
		return jQuery.dir( elem, "parentNode", until );
	},
	next: function( elem ) {
		return jQuery.nth( elem, 2, "nextSibling" );
	},
	prev: function( elem ) {
		return jQuery.nth( elem, 2, "previousSibling" );
	},
	nextAll: function( elem ) {
		return jQuery.dir( elem, "nextSibling" );
	},
	prevAll: function( elem ) {
		return jQuery.dir( elem, "previousSibling" );
	},
	nextUntil: function( elem, i, until ) {
		return jQuery.dir( elem, "nextSibling", until );
	},
	prevUntil: function( elem, i, until ) {
		return jQuery.dir( elem, "previousSibling", until );
	},
	siblings: function( elem ) {
		return jQuery.sibling( elem.parentNode.firstChild, elem );
	},
	children: function( elem ) {
		return jQuery.sibling( elem.firstChild );
	},
	contents: function( elem ) {
		return jQuery.nodeName( elem, "iframe" ) ?
			elem.contentDocument || elem.contentWindow.document :
			jQuery.makeArray( elem.childNodes );
	}
}, function( name, fn ) {
	jQuery.fn[ name ] = function( until, selector ) {
		var ret = jQuery.map( this, fn, until );
		
		if ( !runtil.test( name ) ) {
			selector = until;
		}

		if ( selector && typeof selector === "string" ) {
			ret = jQuery.filter( selector, ret );
		}

		ret = this.length > 1 ? jQuery.unique( ret ) : ret;

		if ( (this.length > 1 || rmultiselector.test( selector )) && rparentsprev.test( name ) ) {
			ret = ret.reverse();
		}

		return this.pushStack( ret, name, slice.call(arguments).join(",") );
	};
});

jQuery.extend({
	filter: function( expr, elems, not ) {
		if ( not ) {
			expr = ":not(" + expr + ")";
		}

		return jQuery.find.matches(expr, elems);
	},
	
	dir: function( elem, dir, until ) {
		var matched = [], cur = elem[dir];
		while ( cur && cur.nodeType !== 9 && (until === undefined || cur.nodeType !== 1 || !jQuery( cur ).is( until )) ) {
			if ( cur.nodeType === 1 ) {
				matched.push( cur );
			}
			cur = cur[dir];
		}
		return matched;
	},

	nth: function( cur, result, dir, elem ) {
		result = result || 1;
		var num = 0;

		for ( ; cur; cur = cur[dir] ) {
			if ( cur.nodeType === 1 && ++num === result ) {
				break;
			}
		}

		return cur;
	},

	sibling: function( n, elem ) {
		var r = [];

		for ( ; n; n = n.nextSibling ) {
			if ( n.nodeType === 1 && n !== elem ) {
				r.push( n );
			}
		}

		return r;
	}
});
var rinlinejQuery = / jQuery\d+="(?:\d+|null)"/g,
	rleadingWhitespace = /^\s+/,
	rxhtmlTag = /(<([\w:]+)[^>]*?)\/>/g,
	rselfClosing = /^(?:area|br|col|embed|hr|img|input|link|meta|param)$/i,
	rtagName = /<([\w:]+)/,
	rtbody = /<tbody/i,
	rhtml = /<|&#?\w+;/,
	rnocache = /<script|<object|<embed|<option|<style/i,
	rchecked = /checked\s*(?:[^=]|=\s*.checked.)/i,  // checked="checked" or checked (html5)
	fcloseTag = function( all, front, tag ) {
		return rselfClosing.test( tag ) ?
			all :
			front + "></" + tag + ">";
	},
	wrapMap = {
		option: [ 1, "<select multiple='multiple'>", "</select>" ],
		legend: [ 1, "<fieldset>", "</fieldset>" ],
		thead: [ 1, "<table>", "</table>" ],
		tr: [ 2, "<table><tbody>", "</tbody></table>" ],
		td: [ 3, "<table><tbody><tr>", "</tr></tbody></table>" ],
		col: [ 2, "<table><tbody></tbody><colgroup>", "</colgroup></table>" ],
		area: [ 1, "<map>", "</map>" ],
		_default: [ 0, "", "" ]
	};

wrapMap.optgroup = wrapMap.option;
wrapMap.tbody = wrapMap.tfoot = wrapMap.colgroup = wrapMap.caption = wrapMap.thead;
wrapMap.th = wrapMap.td;

// IE can't serialize <link> and <script> tags normally
if ( !jQuery.support.htmlSerialize ) {
	wrapMap._default = [ 1, "div<div>", "</div>" ];
}

jQuery.fn.extend({
	text: function( text ) {
		if ( jQuery.isFunction(text) ) {
			return this.each(function(i) {
				var self = jQuery(this);
				self.text( text.call(this, i, self.text()) );
			});
		}

		if ( typeof text !== "object" && text !== undefined ) {
			return this.empty().append( (this[0] && this[0].ownerDocument || document).createTextNode( text ) );
		}

		return jQuery.text( this );
	},

	wrapAll: function( html ) {
		if ( jQuery.isFunction( html ) ) {
			return this.each(function(i) {
				jQuery(this).wrapAll( html.call(this, i) );
			});
		}

		if ( this[0] ) {
			// The elements to wrap the target around
			var wrap = jQuery( html, this[0].ownerDocument ).eq(0).clone(true);

			if ( this[0].parentNode ) {
				wrap.insertBefore( this[0] );
			}

			wrap.map(function() {
				var elem = this;

				while ( elem.firstChild && elem.firstChild.nodeType === 1 ) {
					elem = elem.firstChild;
				}

				return elem;
			}).append(this);
		}

		return this;
	},

	wrapInner: function( html ) {
		if ( jQuery.isFunction( html ) ) {
			return this.each(function(i) {
				jQuery(this).wrapInner( html.call(this, i) );
			});
		}

		return this.each(function() {
			var self = jQuery( this ), contents = self.contents();

			if ( contents.length ) {
				contents.wrapAll( html );

			} else {
				self.append( html );
			}
		});
	},

	wrap: function( html ) {
		return this.each(function() {
			jQuery( this ).wrapAll( html );
		});
	},

	unwrap: function() {
		return this.parent().each(function() {
			if ( !jQuery.nodeName( this, "body" ) ) {
				jQuery( this ).replaceWith( this.childNodes );
			}
		}).end();
	},

	append: function() {
		return this.domManip(arguments, true, function( elem ) {
			if ( this.nodeType === 1 ) {
				this.appendChild( elem );
			}
		});
	},

	prepend: function() {
		return this.domManip(arguments, true, function( elem ) {
			if ( this.nodeType === 1 ) {
				this.insertBefore( elem, this.firstChild );
			}
		});
	},

	before: function() {
		if ( this[0] && this[0].parentNode ) {
			return this.domManip(arguments, false, function( elem ) {
				this.parentNode.insertBefore( elem, this );
			});
		} else if ( arguments.length ) {
			var set = jQuery(arguments[0]);
			set.push.apply( set, this.toArray() );
			return this.pushStack( set, "before", arguments );
		}
	},

	after: function() {
		if ( this[0] && this[0].parentNode ) {
			return this.domManip(arguments, false, function( elem ) {
				this.parentNode.insertBefore( elem, this.nextSibling );
			});
		} else if ( arguments.length ) {
			var set = this.pushStack( this, "after", arguments );
			set.push.apply( set, jQuery(arguments[0]).toArray() );
			return set;
		}
	},
	
	// keepData is for internal use only--do not document
	remove: function( selector, keepData ) {
		for ( var i = 0, elem; (elem = this[i]) != null; i++ ) {
			if ( !selector || jQuery.filter( selector, [ elem ] ).length ) {
				if ( !keepData && elem.nodeType === 1 ) {
					jQuery.cleanData( elem.getElementsByTagName("*") );
					jQuery.cleanData( [ elem ] );
				}

				if ( elem.parentNode ) {
					 elem.parentNode.removeChild( elem );
				}
			}
		}
		
		return this;
	},

	empty: function() {
		for ( var i = 0, elem; (elem = this[i]) != null; i++ ) {
			// Remove element nodes and prevent memory leaks
			if ( elem.nodeType === 1 ) {
				jQuery.cleanData( elem.getElementsByTagName("*") );
			}

			// Remove any remaining nodes
			while ( elem.firstChild ) {
				elem.removeChild( elem.firstChild );
			}
		}
		
		return this;
	},

	clone: function( events ) {
		// Do the clone
		var ret = this.map(function() {
			if ( !jQuery.support.noCloneEvent && !jQuery.isXMLDoc(this) ) {
				// IE copies events bound via attachEvent when
				// using cloneNode. Calling detachEvent on the
				// clone will also remove the events from the orignal
				// In order to get around this, we use innerHTML.
				// Unfortunately, this means some modifications to
				// attributes in IE that are actually only stored
				// as properties will not be copied (such as the
				// the name attribute on an input).
				var html = this.outerHTML, ownerDocument = this.ownerDocument;
				if ( !html ) {
					var div = ownerDocument.createElement("div");
					div.appendChild( this.cloneNode(true) );
					html = div.innerHTML;
				}

				return jQuery.clean([html.replace(rinlinejQuery, "")
					// Handle the case in IE 8 where action=/test/> self-closes a tag
					.replace(/=([^="'>\s]+\/)>/g, '="$1">')
					.replace(rleadingWhitespace, "")], ownerDocument)[0];
			} else {
				return this.cloneNode(true);
			}
		});

		// Copy the events from the original to the clone
		if ( events === true ) {
			cloneCopyEvent( this, ret );
			cloneCopyEvent( this.find("*"), ret.find("*") );
		}

		// Return the cloned set
		return ret;
	},

	html: function( value ) {
		if ( value === undefined ) {
			return this[0] && this[0].nodeType === 1 ?
				this[0].innerHTML.replace(rinlinejQuery, "") :
				null;

		// See if we can take a shortcut and just use innerHTML
		} else if ( typeof value === "string" && !rnocache.test( value ) &&
			(jQuery.support.leadingWhitespace || !rleadingWhitespace.test( value )) &&
			!wrapMap[ (rtagName.exec( value ) || ["", ""])[1].toLowerCase() ] ) {

			value = value.replace(rxhtmlTag, fcloseTag);

			try {
				for ( var i = 0, l = this.length; i < l; i++ ) {
					// Remove element nodes and prevent memory leaks
					if ( this[i].nodeType === 1 ) {
						jQuery.cleanData( this[i].getElementsByTagName("*") );
						this[i].innerHTML = value;
					}
				}

			// If using innerHTML throws an exception, use the fallback method
			} catch(e) {
				this.empty().append( value );
			}

		} else if ( jQuery.isFunction( value ) ) {
			this.each(function(i){
				var self = jQuery(this), old = self.html();
				self.empty().append(function(){
					return value.call( this, i, old );
				});
			});

		} else {
			this.empty().append( value );
		}

		return this;
	},

	replaceWith: function( value ) {
		if ( this[0] && this[0].parentNode ) {
			// Make sure that the elements are removed from the DOM before they are inserted
			// this can help fix replacing a parent with child elements
			if ( jQuery.isFunction( value ) ) {
				return this.each(function(i) {
					var self = jQuery(this), old = self.html();
					self.replaceWith( value.call( this, i, old ) );
				});
			}

			if ( typeof value !== "string" ) {
				value = jQuery(value).detach();
			}

			return this.each(function() {
				var next = this.nextSibling, parent = this.parentNode;

				jQuery(this).remove();

				if ( next ) {
					jQuery(next).before( value );
				} else {
					jQuery(parent).append( value );
				}
			});
		} else {
			return this.pushStack( jQuery(jQuery.isFunction(value) ? value() : value), "replaceWith", value );
		}
	},

	detach: function( selector ) {
		return this.remove( selector, true );
	},

	domManip: function( args, table, callback ) {
		var results, first, value = args[0], scripts = [], fragment, parent;

		// We can't cloneNode fragments that contain checked, in WebKit
		if ( !jQuery.support.checkClone && arguments.length === 3 && typeof value === "string" && rchecked.test( value ) ) {
			return this.each(function() {
				jQuery(this).domManip( args, table, callback, true );
			});
		}

		if ( jQuery.isFunction(value) ) {
			return this.each(function(i) {
				var self = jQuery(this);
				args[0] = value.call(this, i, table ? self.html() : undefined);
				self.domManip( args, table, callback );
			});
		}

		if ( this[0] ) {
			parent = value && value.parentNode;

			// If we're in a fragment, just use that instead of building a new one
			if ( jQuery.support.parentNode && parent && parent.nodeType === 11 && parent.childNodes.length === this.length ) {
				results = { fragment: parent };

			} else {
				results = buildFragment( args, this, scripts );
			}
			
			fragment = results.fragment;
			
			if ( fragment.childNodes.length === 1 ) {
				first = fragment = fragment.firstChild;
			} else {
				first = fragment.firstChild;
			}

			if ( first ) {
				table = table && jQuery.nodeName( first, "tr" );

				for ( var i = 0, l = this.length; i < l; i++ ) {
					callback.call(
						table ?
							root(this[i], first) :
							this[i],
						i > 0 || results.cacheable || this.length > 1  ?
							fragment.cloneNode(true) :
							fragment
					);
				}
			}

			if ( scripts.length ) {
				jQuery.each( scripts, evalScript );
			}
		}

		return this;

		function root( elem, cur ) {
			return jQuery.nodeName(elem, "table") ?
				(elem.getElementsByTagName("tbody")[0] ||
				elem.appendChild(elem.ownerDocument.createElement("tbody"))) :
				elem;
		}
	}
});

function cloneCopyEvent(orig, ret) {
	var i = 0;

	ret.each(function() {
		if ( this.nodeName !== (orig[i] && orig[i].nodeName) ) {
			return;
		}

		var oldData = jQuery.data( orig[i++] ), curData = jQuery.data( this, oldData ), events = oldData && oldData.events;

		if ( events ) {
			delete curData.handle;
			curData.events = {};

			for ( var type in events ) {
				for ( var handler in events[ type ] ) {
					jQuery.event.add( this, type, events[ type ][ handler ], events[ type ][ handler ].data );
				}
			}
		}
	});
}

function buildFragment( args, nodes, scripts ) {
	var fragment, cacheable, cacheresults,
		doc = (nodes && nodes[0] ? nodes[0].ownerDocument || nodes[0] : document);

	// Only cache "small" (1/2 KB) strings that are associated with the main document
	// Cloning options loses the selected state, so don't cache them
	// IE 6 doesn't like it when you put <object> or <embed> elements in a fragment
	// Also, WebKit does not clone 'checked' attributes on cloneNode, so don't cache
	if ( args.length === 1 && typeof args[0] === "string" && args[0].length < 512 && doc === document &&
		!rnocache.test( args[0] ) && (jQuery.support.checkClone || !rchecked.test( args[0] )) ) {

		cacheable = true;
		cacheresults = jQuery.fragments[ args[0] ];
		if ( cacheresults ) {
			if ( cacheresults !== 1 ) {
				fragment = cacheresults;
			}
		}
	}

	if ( !fragment ) {
		fragment = doc.createDocumentFragment();
		jQuery.clean( args, doc, fragment, scripts );
	}

	if ( cacheable ) {
		jQuery.fragments[ args[0] ] = cacheresults ? fragment : 1;
	}

	return { fragment: fragment, cacheable: cacheable };
}

jQuery.fragments = {};

jQuery.each({
	appendTo: "append",
	prependTo: "prepend",
	insertBefore: "before",
	insertAfter: "after",
	replaceAll: "replaceWith"
}, function( name, original ) {
	jQuery.fn[ name ] = function( selector ) {
		var ret = [], insert = jQuery( selector ),
			parent = this.length === 1 && this[0].parentNode;
		
		if ( parent && parent.nodeType === 11 && parent.childNodes.length === 1 && insert.length === 1 ) {
			insert[ original ]( this[0] );
			return this;
			
		} else {
			for ( var i = 0, l = insert.length; i < l; i++ ) {
				var elems = (i > 0 ? this.clone(true) : this).get();
				jQuery.fn[ original ].apply( jQuery(insert[i]), elems );
				ret = ret.concat( elems );
			}
		
			return this.pushStack( ret, name, insert.selector );
		}
	};
});

jQuery.extend({
	clean: function( elems, context, fragment, scripts ) {
		context = context || document;

		// !context.createElement fails in IE with an error but returns typeof 'object'
		if ( typeof context.createElement === "undefined" ) {
			context = context.ownerDocument || context[0] && context[0].ownerDocument || document;
		}

		var ret = [];

		for ( var i = 0, elem; (elem = elems[i]) != null; i++ ) {
			if ( typeof elem === "number" ) {
				elem += "";
			}

			if ( !elem ) {
				continue;
			}

			// Convert html string into DOM nodes
			if ( typeof elem === "string" && !rhtml.test( elem ) ) {
				elem = context.createTextNode( elem );

			} else if ( typeof elem === "string" ) {
				// Fix "XHTML"-style tags in all browsers
				elem = elem.replace(rxhtmlTag, fcloseTag);

				// Trim whitespace, otherwise indexOf won't work as expected
				var tag = (rtagName.exec( elem ) || ["", ""])[1].toLowerCase(),
					wrap = wrapMap[ tag ] || wrapMap._default,
					depth = wrap[0],
					div = context.createElement("div");

				// Go to html and back, then peel off extra wrappers
				div.innerHTML = wrap[1] + elem + wrap[2];

				// Move to the right depth
				while ( depth-- ) {
					div = div.lastChild;
				}

				// Remove IE's autoinserted <tbody> from table fragments
				if ( !jQuery.support.tbody ) {

					// String was a <table>, *may* have spurious <tbody>
					var hasBody = rtbody.test(elem),
						tbody = tag === "table" && !hasBody ?
							div.firstChild && div.firstChild.childNodes :

							// String was a bare <thead> or <tfoot>
							wrap[1] === "<table>" && !hasBody ?
								div.childNodes :
								[];

					for ( var j = tbody.length - 1; j >= 0 ; --j ) {
						if ( jQuery.nodeName( tbody[ j ], "tbody" ) && !tbody[ j ].childNodes.length ) {
							tbody[ j ].parentNode.removeChild( tbody[ j ] );
						}
					}

				}

				// IE completely kills leading whitespace when innerHTML is used
				if ( !jQuery.support.leadingWhitespace && rleadingWhitespace.test( elem ) ) {
					div.insertBefore( context.createTextNode( rleadingWhitespace.exec(elem)[0] ), div.firstChild );
				}

				elem = div.childNodes;
			}

			if ( elem.nodeType ) {
				ret.push( elem );
			} else {
				ret = jQuery.merge( ret, elem );
			}
		}

		if ( fragment ) {
			for ( var i = 0; ret[i]; i++ ) {
				if ( scripts && jQuery.nodeName( ret[i], "script" ) && (!ret[i].type || ret[i].type.toLowerCase() === "text/javascript") ) {
					scripts.push( ret[i].parentNode ? ret[i].parentNode.removeChild( ret[i] ) : ret[i] );
				
				} else {
					if ( ret[i].nodeType === 1 ) {
						ret.splice.apply( ret, [i + 1, 0].concat(jQuery.makeArray(ret[i].getElementsByTagName("script"))) );
					}
					fragment.appendChild( ret[i] );
				}
			}
		}

		return ret;
	},
	
	cleanData: function( elems ) {
		var data, id, cache = jQuery.cache,
			special = jQuery.event.special,
			deleteExpando = jQuery.support.deleteExpando;
		
		for ( var i = 0, elem; (elem = elems[i]) != null; i++ ) {
			id = elem[ jQuery.expando ];
			
			if ( id ) {
				data = cache[ id ];
				
				if ( data.events ) {
					for ( var type in data.events ) {
						if ( special[ type ] ) {
							jQuery.event.remove( elem, type );

						} else {
							removeEvent( elem, type, data.handle );
						}
					}
				}
				
				if ( deleteExpando ) {
					delete elem[ jQuery.expando ];

				} else if ( elem.removeAttribute ) {
					elem.removeAttribute( jQuery.expando );
				}
				
				delete cache[ id ];
			}
		}
	}
});
// exclude the following css properties to add px
var rexclude = /z-?index|font-?weight|opacity|zoom|line-?height/i,
	ralpha = /alpha\([^)]*\)/,
	ropacity = /opacity=([^)]*)/,
	rfloat = /float/i,
	rdashAlpha = /-([a-z])/ig,
	rupper = /([A-Z])/g,
	rnumpx = /^-?\d+(?:px)?$/i,
	rnum = /^-?\d/,

	cssShow = { position: "absolute", visibility: "hidden", display:"block" },
	cssWidth = [ "Left", "Right" ],
	cssHeight = [ "Top", "Bottom" ],

	// cache check for defaultView.getComputedStyle
	getComputedStyle = document.defaultView && document.defaultView.getComputedStyle,
	// normalize float css property
	styleFloat = jQuery.support.cssFloat ? "cssFloat" : "styleFloat",
	fcamelCase = function( all, letter ) {
		return letter.toUpperCase();
	};

jQuery.fn.css = function( name, value ) {
	return access( this, name, value, true, function( elem, name, value ) {
		if ( value === undefined ) {
			return jQuery.curCSS( elem, name );
		}
		
		if ( typeof value === "number" && !rexclude.test(name) ) {
			value += "px";
		}

		jQuery.style( elem, name, value );
	});
};

jQuery.extend({
	style: function( elem, name, value ) {
		// don't set styles on text and comment nodes
		if ( !elem || elem.nodeType === 3 || elem.nodeType === 8 ) {
			return undefined;
		}

		// ignore negative width and height values #1599
		if ( (name === "width" || name === "height") && parseFloat(value) < 0 ) {
			value = undefined;
		}

		var style = elem.style || elem, set = value !== undefined;

		// IE uses filters for opacity
		if ( !jQuery.support.opacity && name === "opacity" ) {
			if ( set ) {
				// IE has trouble with opacity if it does not have layout
				// Force it by setting the zoom level
				style.zoom = 1;

				// Set the alpha filter to set the opacity
				var opacity = parseInt( value, 10 ) + "" === "NaN" ? "" : "alpha(opacity=" + value * 100 + ")";
				var filter = style.filter || jQuery.curCSS( elem, "filter" ) || "";
				style.filter = ralpha.test(filter) ? filter.replace(ralpha, opacity) : opacity;
			}

			return style.filter && style.filter.indexOf("opacity=") >= 0 ?
				(parseFloat( ropacity.exec(style.filter)[1] ) / 100) + "":
				"";
		}

		// Make sure we're using the right name for getting the float value
		if ( rfloat.test( name ) ) {
			name = styleFloat;
		}

		name = name.replace(rdashAlpha, fcamelCase);

		if ( set ) {
			style[ name ] = value;
		}

		return style[ name ];
	},

	css: function( elem, name, force, extra ) {
		if ( name === "width" || name === "height" ) {
			var val, props = cssShow, which = name === "width" ? cssWidth : cssHeight;

			function getWH() {
				val = name === "width" ? elem.offsetWidth : elem.offsetHeight;

				if ( extra === "border" ) {
					return;
				}

				jQuery.each( which, function() {
					if ( !extra ) {
						val -= parseFloat(jQuery.curCSS( elem, "padding" + this, true)) || 0;
					}

					if ( extra === "margin" ) {
						val += parseFloat(jQuery.curCSS( elem, "margin" + this, true)) || 0;
					} else {
						val -= parseFloat(jQuery.curCSS( elem, "border" + this + "Width", true)) || 0;
					}
				});
			}

			if ( elem.offsetWidth !== 0 ) {
				getWH();
			} else {
				jQuery.swap( elem, props, getWH );
			}

			return Math.max(0, Math.round(val));
		}

		return jQuery.curCSS( elem, name, force );
	},

	curCSS: function( elem, name, force ) {
		var ret, style = elem.style, filter;

		// IE uses filters for opacity
		if ( !jQuery.support.opacity && name === "opacity" && elem.currentStyle ) {
			ret = ropacity.test(elem.currentStyle.filter || "") ?
				(parseFloat(RegExp.$1) / 100) + "" :
				"";

			return ret === "" ?
				"1" :
				ret;
		}

		// Make sure we're using the right name for getting the float value
		if ( rfloat.test( name ) ) {
			name = styleFloat;
		}

		if ( !force && style && style[ name ] ) {
			ret = style[ name ];

		} else if ( getComputedStyle ) {

			// Only "float" is needed here
			if ( rfloat.test( name ) ) {
				name = "float";
			}

			name = name.replace( rupper, "-$1" ).toLowerCase();

			var defaultView = elem.ownerDocument.defaultView;

			if ( !defaultView ) {
				return null;
			}

			var computedStyle = defaultView.getComputedStyle( elem, null );

			if ( computedStyle ) {
				ret = computedStyle.getPropertyValue( name );
			}

			// We should always get a number back from opacity
			if ( name === "opacity" && ret === "" ) {
				ret = "1";
			}

		} else if ( elem.currentStyle ) {
			var camelCase = name.replace(rdashAlpha, fcamelCase);

			ret = elem.currentStyle[ name ] || elem.currentStyle[ camelCase ];

			// From the awesome hack by Dean Edwards
			// http://erik.eae.net/archives/2007/07/27/18.54.15/#comment-102291

			// If we're not dealing with a regular pixel number
			// but a number that has a weird ending, we need to convert it to pixels
			if ( !rnumpx.test( ret ) && rnum.test( ret ) ) {
				// Remember the original values
				var left = style.left, rsLeft = elem.runtimeStyle.left;

				// Put in the new values to get a computed value out
				elem.runtimeStyle.left = elem.currentStyle.left;
				style.left = camelCase === "fontSize" ? "1em" : (ret || 0);
				ret = style.pixelLeft + "px";

				// Revert the changed values
				style.left = left;
				elem.runtimeStyle.left = rsLeft;
			}
		}

		return ret;
	},

	// A method for quickly swapping in/out CSS properties to get correct calculations
	swap: function( elem, options, callback ) {
		var old = {};

		// Remember the old values, and insert the new ones
		for ( var name in options ) {
			old[ name ] = elem.style[ name ];
			elem.style[ name ] = options[ name ];
		}

		callback.call( elem );

		// Revert the old values
		for ( var name in options ) {
			elem.style[ name ] = old[ name ];
		}
	}
});

if ( jQuery.expr && jQuery.expr.filters ) {
	jQuery.expr.filters.hidden = function( elem ) {
		var width = elem.offsetWidth, height = elem.offsetHeight,
			skip = elem.nodeName.toLowerCase() === "tr";

		return width === 0 && height === 0 && !skip ?
			true :
			width > 0 && height > 0 && !skip ?
				false :
				jQuery.curCSS(elem, "display") === "none";
	};

	jQuery.expr.filters.visible = function( elem ) {
		return !jQuery.expr.filters.hidden( elem );
	};
}
var jsc = now(),
	rscript = /<script(.|\s)*?\/script>/gi,
	rselectTextarea = /select|textarea/i,
	rinput = /color|date|datetime|email|hidden|month|number|password|range|search|tel|text|time|url|week/i,
	jsre = /=\?(&|$)/,
	rquery = /\?/,
	rts = /(\?|&)_=.*?(&|$)/,
	rurl = /^(\w+:)?\/\/([^\/?#]+)/,
	r20 = /%20/g,

	// Keep a copy of the old load method
	_load = jQuery.fn.load;

jQuery.fn.extend({
	load: function( url, params, callback ) {
		if ( typeof url !== "string" ) {
			return _load.call( this, url );

		// Don't do a request if no elements are being requested
		} else if ( !this.length ) {
			return this;
		}

		var off = url.indexOf(" ");
		if ( off >= 0 ) {
			var selector = url.slice(off, url.length);
			url = url.slice(0, off);
		}

		// Default to a GET request
		var type = "GET";

		// If the second parameter was provided
		if ( params ) {
			// If it's a function
			if ( jQuery.isFunction( params ) ) {
				// We assume that it's the callback
				callback = params;
				params = null;

			// Otherwise, build a param string
			} else if ( typeof params === "object" ) {
				params = jQuery.param( params, jQuery.ajaxSettings.traditional );
				type = "POST";
			}
		}

		var self = this;

		// Request the remote document
		jQuery.ajax({
			url: url,
			type: type,
			dataType: "html",
			data: params,
			complete: function( res, status ) {
				// If successful, inject the HTML into all the matched elements
				if ( status === "success" || status === "notmodified" ) {
					// See if a selector was specified
					self.html( selector ?
						// Create a dummy div to hold the results
						jQuery("<div />")
							// inject the contents of the document in, removing the scripts
							// to avoid any 'Permission Denied' errors in IE
							.append(res.responseText.replace(rscript, ""))

							// Locate the specified elements
							.find(selector) :

						// If not, just inject the full result
						res.responseText );
				}

				if ( callback ) {
					self.each( callback, [res.responseText, status, res] );
				}
			}
		});

		return this;
	},

	serialize: function() {
		return jQuery.param(this.serializeArray());
	},
	serializeArray: function() {
		return this.map(function() {
			return this.elements ? jQuery.makeArray(this.elements) : this;
		})
		.filter(function() {
			return this.name && !this.disabled &&
				(this.checked || rselectTextarea.test(this.nodeName) ||
					rinput.test(this.type));
		})
		.map(function( i, elem ) {
			var val = jQuery(this).val();

			return val == null ?
				null :
				jQuery.isArray(val) ?
					jQuery.map( val, function( val, i ) {
						return { name: elem.name, value: val };
					}) :
					{ name: elem.name, value: val };
		}).get();
	}
});

// Attach a bunch of functions for handling common AJAX events
jQuery.each( "ajaxStart ajaxStop ajaxComplete ajaxError ajaxSuccess ajaxSend".split(" "), function( i, o ) {
	jQuery.fn[o] = function( f ) {
		return this.bind(o, f);
	};
});

jQuery.extend({

	get: function( url, data, callback, type ) {
		// shift arguments if data argument was omited
		if ( jQuery.isFunction( data ) ) {
			type = type || callback;
			callback = data;
			data = null;
		}

		return jQuery.ajax({
			type: "GET",
			url: url,
			data: data,
			success: callback,
			dataType: type
		});
	},

	getScript: function( url, callback ) {
		return jQuery.get(url, null, callback, "script");
	},

	getJSON: function( url, data, callback ) {
		return jQuery.get(url, data, callback, "json");
	},

	post: function( url, data, callback, type ) {
		// shift arguments if data argument was omited
		if ( jQuery.isFunction( data ) ) {
			type = type || callback;
			callback = data;
			data = {};
		}

		return jQuery.ajax({
			type: "POST",
			url: url,
			data: data,
			success: callback,
			dataType: type
		});
	},

	ajaxSetup: function( settings ) {
		jQuery.extend( jQuery.ajaxSettings, settings );
	},

	ajaxSettings: {
		url: location.href,
		global: true,
		type: "GET",
		contentType: "application/x-www-form-urlencoded",
		processData: true,
		async: true,
		/*
		timeout: 0,
		data: null,
		username: null,
		password: null,
		traditional: false,
		*/
		// Create the request object; Microsoft failed to properly
		// implement the XMLHttpRequest in IE7 (can't request local files),
		// so we use the ActiveXObject when it is available
		// This function can be overriden by calling jQuery.ajaxSetup
		xhr: window.XMLHttpRequest && (window.location.protocol !== "file:" || !window.ActiveXObject) ?
			function() {
				return new window.XMLHttpRequest();
			} :
			function() {
				try {
					return new window.ActiveXObject("Microsoft.XMLHTTP");
				} catch(e) {}
			},
		accepts: {
			xml: "application/xml, text/xml",
			html: "text/html",
			script: "text/javascript, application/javascript",
			json: "application/json, text/javascript",
			text: "text/plain",
			_default: "*/*"
		}
	},

	// Last-Modified header cache for next request
	lastModified: {},
	etag: {},

	ajax: function( origSettings ) {
		var s = jQuery.extend(true, {}, jQuery.ajaxSettings, origSettings);
		
		var jsonp, status, data,
			callbackContext = origSettings && origSettings.context || s,
			type = s.type.toUpperCase();

		// convert data if not already a string
		if ( s.data && s.processData && typeof s.data !== "string" ) {
			s.data = jQuery.param( s.data, s.traditional );
		}

		// Handle JSONP Parameter Callbacks
		if ( s.dataType === "jsonp" ) {
			if ( type === "GET" ) {
				if ( !jsre.test( s.url ) ) {
					s.url += (rquery.test( s.url ) ? "&" : "?") + (s.jsonp || "callback") + "=?";
				}
			} else if ( !s.data || !jsre.test(s.data) ) {
				s.data = (s.data ? s.data + "&" : "") + (s.jsonp || "callback") + "=?";
			}
			s.dataType = "json";
		}

		// Build temporary JSONP function
		if ( s.dataType === "json" && (s.data && jsre.test(s.data) || jsre.test(s.url)) ) {
			jsonp = s.jsonpCallback || ("jsonp" + jsc++);

			// Replace the =? sequence both in the query string and the data
			if ( s.data ) {
				s.data = (s.data + "").replace(jsre, "=" + jsonp + "$1");
			}

			s.url = s.url.replace(jsre, "=" + jsonp + "$1");

			// We need to make sure
			// that a JSONP style response is executed properly
			s.dataType = "script";

			// Handle JSONP-style loading
			window[ jsonp ] = window[ jsonp ] || function( tmp ) {
				data = tmp;
				success();
				complete();
				// Garbage collect
				window[ jsonp ] = undefined;

				try {
					delete window[ jsonp ];
				} catch(e) {}

				if ( head ) {
					head.removeChild( script );
				}
			};
		}

		if ( s.dataType === "script" && s.cache === null ) {
			s.cache = false;
		}

		if ( s.cache === false && type === "GET" ) {
			var ts = now();

			// try replacing _= if it is there
			var ret = s.url.replace(rts, "$1_=" + ts + "$2");

			// if nothing was replaced, add timestamp to the end
			s.url = ret + ((ret === s.url) ? (rquery.test(s.url) ? "&" : "?") + "_=" + ts : "");
		}

		// If data is available, append data to url for get requests
		if ( s.data && type === "GET" ) {
			s.url += (rquery.test(s.url) ? "&" : "?") + s.data;
		}

		// Watch for a new set of requests
		if ( s.global && ! jQuery.active++ ) {
			jQuery.event.trigger( "ajaxStart" );
		}

		// Matches an absolute URL, and saves the domain
		var parts = rurl.exec( s.url ),
			remote = parts && (parts[1] && parts[1] !== location.protocol || parts[2] !== location.host);

		// If we're requesting a remote document
		// and trying to load JSON or Script with a GET
		if ( s.dataType === "script" && type === "GET" && remote ) {
			var head = document.getElementsByTagName("head")[0] || document.documentElement;
			var script = document.createElement("script");
			script.src = s.url;
			if ( s.scriptCharset ) {
				script.charset = s.scriptCharset;
			}

			// Handle Script loading
			if ( !jsonp ) {
				var done = false;

				// Attach handlers for all browsers
				script.onload = script.onreadystatechange = function() {
					if ( !done && (!this.readyState ||
							this.readyState === "loaded" || this.readyState === "complete") ) {
						done = true;
						success();
						complete();

						// Handle memory leak in IE
						script.onload = script.onreadystatechange = null;
						if ( head && script.parentNode ) {
							head.removeChild( script );
						}
					}
				};
			}

			// Use insertBefore instead of appendChild  to circumvent an IE6 bug.
			// This arises when a base node is used (#2709 and #4378).
			head.insertBefore( script, head.firstChild );

			// We handle everything using the script element injection
			return undefined;
		}

		var requestDone = false;

		// Create the request object
		var xhr = s.xhr();

		if ( !xhr ) {
			return;
		}

		// Open the socket
		// Passing null username, generates a login popup on Opera (#2865)
		if ( s.username ) {
			xhr.open(type, s.url, s.async, s.username, s.password);
		} else {
			xhr.open(type, s.url, s.async);
		}

		// Need an extra try/catch for cross domain requests in Firefox 3
		try {
			// Set the correct header, if data is being sent
			if ( s.data || origSettings && origSettings.contentType ) {
				xhr.setRequestHeader("Content-Type", s.contentType);
			}

			// Set the If-Modified-Since and/or If-None-Match header, if in ifModified mode.
			if ( s.ifModified ) {
				if ( jQuery.lastModified[s.url] ) {
					xhr.setRequestHeader("If-Modified-Since", jQuery.lastModified[s.url]);
				}

				if ( jQuery.etag[s.url] ) {
					xhr.setRequestHeader("If-None-Match", jQuery.etag[s.url]);
				}
			}

			// Set header so the called script knows that it's an XMLHttpRequest
			// Only send the header if it's not a remote XHR
			if ( !remote ) {
				xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
			}

			// Set the Accepts header for the server, depending on the dataType
			xhr.setRequestHeader("Accept", s.dataType && s.accepts[ s.dataType ] ?
				s.accepts[ s.dataType ] + ", */*" :
				s.accepts._default );
		} catch(e) {}

		// Allow custom headers/mimetypes and early abort
		if ( s.beforeSend && s.beforeSend.call(callbackContext, xhr, s) === false ) {
			// Handle the global AJAX counter
			if ( s.global && ! --jQuery.active ) {
				jQuery.event.trigger( "ajaxStop" );
			}

			// close opended socket
			xhr.abort();
			return false;
		}

		if ( s.global ) {
			trigger("ajaxSend", [xhr, s]);
		}

		// Wait for a response to come back
		var onreadystatechange = xhr.onreadystatechange = function( isTimeout ) {
			// The request was aborted
			if ( !xhr || xhr.readyState === 0 || isTimeout === "abort" ) {
				// Opera doesn't call onreadystatechange before this point
				// so we simulate the call
				if ( !requestDone ) {
					complete();
				}

				requestDone = true;
				if ( xhr ) {
					xhr.onreadystatechange = jQuery.noop;
				}

			// The transfer is complete and the data is available, or the request timed out
			} else if ( !requestDone && xhr && (xhr.readyState === 4 || isTimeout === "timeout") ) {
				requestDone = true;
				xhr.onreadystatechange = jQuery.noop;

				status = isTimeout === "timeout" ?
					"timeout" :
					!jQuery.httpSuccess( xhr ) ?
						"error" :
						s.ifModified && jQuery.httpNotModified( xhr, s.url ) ?
							"notmodified" :
							"success";

				var errMsg;

				if ( status === "success" ) {
					// Watch for, and catch, XML document parse errors
					try {
						// process the data (runs the xml through httpData regardless of callback)
						data = jQuery.httpData( xhr, s.dataType, s );
					} catch(err) {
						status = "parsererror";
						errMsg = err;
					}
				}

				// Make sure that the request was successful or notmodified
				if ( status === "success" || status === "notmodified" ) {
					// JSONP handles its own success callback
					if ( !jsonp ) {
						success();
					}
				} else {
					jQuery.handleError(s, xhr, status, errMsg);
				}

				// Fire the complete handlers
				complete();

				if ( isTimeout === "timeout" ) {
					xhr.abort();
				}

				// Stop memory leaks
				if ( s.async ) {
					xhr = null;
				}
			}
		};

		// Override the abort handler, if we can (IE doesn't allow it, but that's OK)
		// Opera doesn't fire onreadystatechange at all on abort
		try {
			var oldAbort = xhr.abort;
			xhr.abort = function() {
				if ( xhr ) {
					oldAbort.call( xhr );
				}

				onreadystatechange( "abort" );
			};
		} catch(e) { }

		// Timeout checker
		if ( s.async && s.timeout > 0 ) {
			setTimeout(function() {
				// Check to see if the request is still happening
				if ( xhr && !requestDone ) {
					onreadystatechange( "timeout" );
				}
			}, s.timeout);
		}

		// Send the data
		try {
			xhr.send( type === "POST" || type === "PUT" || type === "DELETE" ? s.data : null );
		} catch(e) {
			jQuery.handleError(s, xhr, null, e);
			// Fire the complete handlers
			complete();
		}

		// firefox 1.5 doesn't fire statechange for sync requests
		if ( !s.async ) {
			onreadystatechange();
		}

		function success() {
			// If a local callback was specified, fire it and pass it the data
			if ( s.success ) {
				s.success.call( callbackContext, data, status, xhr );
			}

			// Fire the global callback
			if ( s.global ) {
				trigger( "ajaxSuccess", [xhr, s] );
			}
		}

		function complete() {
			// Process result
			if ( s.complete ) {
				s.complete.call( callbackContext, xhr, status);
			}

			// The request was completed
			if ( s.global ) {
				trigger( "ajaxComplete", [xhr, s] );
			}

			// Handle the global AJAX counter
			if ( s.global && ! --jQuery.active ) {
				jQuery.event.trigger( "ajaxStop" );
			}
		}
		
		function trigger(type, args) {
			(s.context ? jQuery(s.context) : jQuery.event).trigger(type, args);
		}

		// return XMLHttpRequest to allow aborting the request etc.
		return xhr;
	},

	handleError: function( s, xhr, status, e ) {
		// If a local callback was specified, fire it
		if ( s.error ) {
			s.error.call( s.context || s, xhr, status, e );
		}

		// Fire the global callback
		if ( s.global ) {
			(s.context ? jQuery(s.context) : jQuery.event).trigger( "ajaxError", [xhr, s, e] );
		}
	},

	// Counter for holding the number of active queries
	active: 0,

	// Determines if an XMLHttpRequest was successful or not
	httpSuccess: function( xhr ) {
		try {
			// IE error sometimes returns 1223 when it should be 204 so treat it as success, see #1450
			return !xhr.status && location.protocol === "file:" ||
				// Opera returns 0 when status is 304
				( xhr.status >= 200 && xhr.status < 300 ) ||
				xhr.status === 304 || xhr.status === 1223 || xhr.status === 0;
		} catch(e) {}

		return false;
	},

	// Determines if an XMLHttpRequest returns NotModified
	httpNotModified: function( xhr, url ) {
		var lastModified = xhr.getResponseHeader("Last-Modified"),
			etag = xhr.getResponseHeader("Etag");

		if ( lastModified ) {
			jQuery.lastModified[url] = lastModified;
		}

		if ( etag ) {
			jQuery.etag[url] = etag;
		}

		// Opera returns 0 when status is 304
		return xhr.status === 304 || xhr.status === 0;
	},

	httpData: function( xhr, type, s ) {
		var ct = xhr.getResponseHeader("content-type") || "",
			xml = type === "xml" || !type && ct.indexOf("xml") >= 0,
			data = xml ? xhr.responseXML : xhr.responseText;

		if ( xml && data.documentElement.nodeName === "parsererror" ) {
			jQuery.error( "parsererror" );
		}

		// Allow a pre-filtering function to sanitize the response
		// s is checked to keep backwards compatibility
		if ( s && s.dataFilter ) {
			data = s.dataFilter( data, type );
		}

		// The filter can actually parse the response
		if ( typeof data === "string" ) {
			// Get the JavaScript object, if JSON is used.
			if ( type === "json" || !type && ct.indexOf("json") >= 0 ) {
				data = jQuery.parseJSON( data );

			// If the type is "script", eval it in global context
			} else if ( type === "script" || !type && ct.indexOf("javascript") >= 0 ) {
				jQuery.globalEval( data );
			}
		}

		return data;
	},

	// Serialize an array of form elements or a set of
	// key/values into a query string
	param: function( a, traditional ) {
		var s = [];
		
		// Set traditional to true for jQuery <= 1.3.2 behavior.
		if ( traditional === undefined ) {
			traditional = jQuery.ajaxSettings.traditional;
		}
		
		// If an array was passed in, assume that it is an array of form elements.
		if ( jQuery.isArray(a) || a.jquery ) {
			// Serialize the form elements
			jQuery.each( a, function() {
				add( this.name, this.value );
			});
			
		} else {
			// If traditional, encode the "old" way (the way 1.3.2 or older
			// did it), otherwise encode params recursively.
			for ( var prefix in a ) {
				buildParams( prefix, a[prefix] );
			}
		}

		// Return the resulting serialization
		return s.join("&").replace(r20, "+");

		function buildParams( prefix, obj ) {
			if ( jQuery.isArray(obj) ) {
				// Serialize array item.
				jQuery.each( obj, function( i, v ) {
					if ( traditional || /\[\]$/.test( prefix ) ) {
						// Treat each array item as a scalar.
						add( prefix, v );
					} else {
						// If array item is non-scalar (array or object), encode its
						// numeric index to resolve deserialization ambiguity issues.
						// Note that rack (as of 1.0.0) can't currently deserialize
						// nested arrays properly, and attempting to do so may cause
						// a server error. Possible fixes are to modify rack's
						// deserialization algorithm or to provide an option or flag
						// to force array serialization to be shallow.
						buildParams( prefix + "[" + ( typeof v === "object" || jQuery.isArray(v) ? i : "" ) + "]", v );
					}
				});
					
			} else if ( !traditional && obj != null && typeof obj === "object" ) {
				// Serialize object item.
				jQuery.each( obj, function( k, v ) {
					buildParams( prefix + "[" + k + "]", v );
				});
					
			} else {
				// Serialize scalar item.
				add( prefix, obj );
			}
		}

		function add( key, value ) {
			// If value is a function, invoke it and return its value
			value = jQuery.isFunction(value) ? value() : value;
			s[ s.length ] = encodeURIComponent(key) + "=" + encodeURIComponent(value);
		}
	}
});
var elemdisplay = {},
	rfxtypes = /toggle|show|hide/,
	rfxnum = /^([+-]=)?([\d+-.]+)(.*)$/,
	timerId,
	fxAttrs = [
		// height animations
		[ "height", "marginTop", "marginBottom", "paddingTop", "paddingBottom" ],
		// width animations
		[ "width", "marginLeft", "marginRight", "paddingLeft", "paddingRight" ],
		// opacity animations
		[ "opacity" ]
	];

jQuery.fn.extend({
	show: function( speed, callback ) {
		if ( speed || speed === 0) {
			return this.animate( genFx("show", 3), speed, callback);

		} else {
			for ( var i = 0, l = this.length; i < l; i++ ) {
				var old = jQuery.data(this[i], "olddisplay");

				this[i].style.display = old || "";

				if ( jQuery.css(this[i], "display") === "none" ) {
					var nodeName = this[i].nodeName, display;

					if ( elemdisplay[ nodeName ] ) {
						display = elemdisplay[ nodeName ];

					} else {
						var elem = jQuery("<" + nodeName + " />").appendTo("body");

						display = elem.css("display");

						if ( display === "none" ) {
							display = "block";
						}

						elem.remove();

						elemdisplay[ nodeName ] = display;
					}

					jQuery.data(this[i], "olddisplay", display);
				}
			}

			// Set the display of the elements in a second loop
			// to avoid the constant reflow
			for ( var j = 0, k = this.length; j < k; j++ ) {
				this[j].style.display = jQuery.data(this[j], "olddisplay") || "";
			}

			return this;
		}
	},

	hide: function( speed, callback ) {
		if ( speed || speed === 0 ) {
			return this.animate( genFx("hide", 3), speed, callback);

		} else {
			for ( var i = 0, l = this.length; i < l; i++ ) {
				var old = jQuery.data(this[i], "olddisplay");
				if ( !old && old !== "none" ) {
					jQuery.data(this[i], "olddisplay", jQuery.css(this[i], "display"));
				}
			}

			// Set the display of the elements in a second loop
			// to avoid the constant reflow
			for ( var j = 0, k = this.length; j < k; j++ ) {
				this[j].style.display = "none";
			}

			return this;
		}
	},

	// Save the old toggle function
	_toggle: jQuery.fn.toggle,

	toggle: function( fn, fn2 ) {
		var bool = typeof fn === "boolean";

		if ( jQuery.isFunction(fn) && jQuery.isFunction(fn2) ) {
			this._toggle.apply( this, arguments );

		} else if ( fn == null || bool ) {
			this.each(function() {
				var state = bool ? fn : jQuery(this).is(":hidden");
				jQuery(this)[ state ? "show" : "hide" ]();
			});

		} else {
			this.animate(genFx("toggle", 3), fn, fn2);
		}

		return this;
	},

	fadeTo: function( speed, to, callback ) {
		return this.filter(":hidden").css("opacity", 0).show().end()
					.animate({opacity: to}, speed, callback);
	},

	animate: function( prop, speed, easing, callback ) {
		var optall = jQuery.speed(speed, easing, callback);

		if ( jQuery.isEmptyObject( prop ) ) {
			return this.each( optall.complete );
		}

		return this[ optall.queue === false ? "each" : "queue" ](function() {
			var opt = jQuery.extend({}, optall), p,
				hidden = this.nodeType === 1 && jQuery(this).is(":hidden"),
				self = this;

			for ( p in prop ) {
				var name = p.replace(rdashAlpha, fcamelCase);

				if ( p !== name ) {
					prop[ name ] = prop[ p ];
					delete prop[ p ];
					p = name;
				}

				if ( prop[p] === "hide" && hidden || prop[p] === "show" && !hidden ) {
					return opt.complete.call(this);
				}

				if ( ( p === "height" || p === "width" ) && this.style ) {
					// Store display property
					opt.display = jQuery.css(this, "display");

					// Make sure that nothing sneaks out
					opt.overflow = this.style.overflow;
				}

				if ( jQuery.isArray( prop[p] ) ) {
					// Create (if needed) and add to specialEasing
					(opt.specialEasing = opt.specialEasing || {})[p] = prop[p][1];
					prop[p] = prop[p][0];
				}
			}

			if ( opt.overflow != null ) {
				this.style.overflow = "hidden";
			}

			opt.curAnim = jQuery.extend({}, prop);

			jQuery.each( prop, function( name, val ) {
				var e = new jQuery.fx( self, opt, name );

				if ( rfxtypes.test(val) ) {
					e[ val === "toggle" ? hidden ? "show" : "hide" : val ]( prop );

				} else {
					var parts = rfxnum.exec(val),
						start = e.cur(true) || 0;

					if ( parts ) {
						var end = parseFloat( parts[2] ),
							unit = parts[3] || "px";

						// We need to compute starting value
						if ( unit !== "px" ) {
							self.style[ name ] = (end || 1) + unit;
							start = ((end || 1) / e.cur(true)) * start;
							self.style[ name ] = start + unit;
						}

						// If a +=/-= token was provided, we're doing a relative animation
						if ( parts[1] ) {
							end = ((parts[1] === "-=" ? -1 : 1) * end) + start;
						}

						e.custom( start, end, unit );

					} else {
						e.custom( start, val, "" );
					}
				}
			});

			// For JS strict compliance
			return true;
		});
	},

	stop: function( clearQueue, gotoEnd ) {
		var timers = jQuery.timers;

		if ( clearQueue ) {
			this.queue([]);
		}

		this.each(function() {
			// go in reverse order so anything added to the queue during the loop is ignored
			for ( var i = timers.length - 1; i >= 0; i-- ) {
				if ( timers[i].elem === this ) {
					if (gotoEnd) {
						// force the next step to be the last
						timers[i](true);
					}

					timers.splice(i, 1);
				}
			}
		});

		// start the next in the queue if the last step wasn't forced
		if ( !gotoEnd ) {
			this.dequeue();
		}

		return this;
	}

});

// Generate shortcuts for custom animations
jQuery.each({
	slideDown: genFx("show", 1),
	slideUp: genFx("hide", 1),
	slideToggle: genFx("toggle", 1),
	fadeIn: { opacity: "show" },
	fadeOut: { opacity: "hide" }
}, function( name, props ) {
	jQuery.fn[ name ] = function( speed, callback ) {
		return this.animate( props, speed, callback );
	};
});

jQuery.extend({
	speed: function( speed, easing, fn ) {
		var opt = speed && typeof speed === "object" ? speed : {
			complete: fn || !fn && easing ||
				jQuery.isFunction( speed ) && speed,
			duration: speed,
			easing: fn && easing || easing && !jQuery.isFunction(easing) && easing
		};

		opt.duration = jQuery.fx.off ? 0 : typeof opt.duration === "number" ? opt.duration :
			jQuery.fx.speeds[opt.duration] || jQuery.fx.speeds._default;

		// Queueing
		opt.old = opt.complete;
		opt.complete = function() {
			if ( opt.queue !== false ) {
				jQuery(this).dequeue();
			}
			if ( jQuery.isFunction( opt.old ) ) {
				opt.old.call( this );
			}
		};

		return opt;
	},

	easing: {
		linear: function( p, n, firstNum, diff ) {
			return firstNum + diff * p;
		},
		swing: function( p, n, firstNum, diff ) {
			return ((-Math.cos(p*Math.PI)/2) + 0.5) * diff + firstNum;
		}
	},

	timers: [],

	fx: function( elem, options, prop ) {
		this.options = options;
		this.elem = elem;
		this.prop = prop;

		if ( !options.orig ) {
			options.orig = {};
		}
	}

});

jQuery.fx.prototype = {
	// Simple function for setting a style value
	update: function() {
		if ( this.options.step ) {
			this.options.step.call( this.elem, this.now, this );
		}

		(jQuery.fx.step[this.prop] || jQuery.fx.step._default)( this );

		// Set display property to block for height/width animations
		if ( ( this.prop === "height" || this.prop === "width" ) && this.elem.style ) {
			this.elem.style.display = "block";
		}
	},

	// Get the current size
	cur: function( force ) {
		if ( this.elem[this.prop] != null && (!this.elem.style || this.elem.style[this.prop] == null) ) {
			return this.elem[ this.prop ];
		}

		var r = parseFloat(jQuery.css(this.elem, this.prop, force));
		return r && r > -10000 ? r : parseFloat(jQuery.curCSS(this.elem, this.prop)) || 0;
	},

	// Start an animation from one number to another
	custom: function( from, to, unit ) {
		this.startTime = now();
		this.start = from;
		this.end = to;
		this.unit = unit || this.unit || "px";
		this.now = this.start;
		this.pos = this.state = 0;

		var self = this;
		function t( gotoEnd ) {
			return self.step(gotoEnd);
		}

		t.elem = this.elem;

		if ( t() && jQuery.timers.push(t) && !timerId ) {
			timerId = setInterval(jQuery.fx.tick, 13);
		}
	},

	// Simple 'show' function
	show: function() {
		// Remember where we started, so that we can go back to it later
		this.options.orig[this.prop] = jQuery.style( this.elem, this.prop );
		this.options.show = true;

		// Begin the animation
		// Make sure that we start at a small width/height to avoid any
		// flash of content
		this.custom(this.prop === "width" || this.prop === "height" ? 1 : 0, this.cur());

		// Start by showing the element
		jQuery( this.elem ).show();
	},

	// Simple 'hide' function
	hide: function() {
		// Remember where we started, so that we can go back to it later
		this.options.orig[this.prop] = jQuery.style( this.elem, this.prop );
		this.options.hide = true;

		// Begin the animation
		this.custom(this.cur(), 0);
	},

	// Each step of an animation
	step: function( gotoEnd ) {
		var t = now(), done = true;

		if ( gotoEnd || t >= this.options.duration + this.startTime ) {
			this.now = this.end;
			this.pos = this.state = 1;
			this.update();

			this.options.curAnim[ this.prop ] = true;

			for ( var i in this.options.curAnim ) {
				if ( this.options.curAnim[i] !== true ) {
					done = false;
				}
			}

			if ( done ) {
				if ( this.options.display != null ) {
					// Reset the overflow
					this.elem.style.overflow = this.options.overflow;

					// Reset the display
					var old = jQuery.data(this.elem, "olddisplay");
					this.elem.style.display = old ? old : this.options.display;

					if ( jQuery.css(this.elem, "display") === "none" ) {
						this.elem.style.display = "block";
					}
				}

				// Hide the element if the "hide" operation was done
				if ( this.options.hide ) {
					jQuery(this.elem).hide();
				}

				// Reset the properties, if the item has been hidden or shown
				if ( this.options.hide || this.options.show ) {
					for ( var p in this.options.curAnim ) {
						jQuery.style(this.elem, p, this.options.orig[p]);
					}
				}

				// Execute the complete function
				this.options.complete.call( this.elem );
			}

			return false;

		} else {
			var n = t - this.startTime;
			this.state = n / this.options.duration;

			// Perform the easing function, defaults to swing
			var specialEasing = this.options.specialEasing && this.options.specialEasing[this.prop];
			var defaultEasing = this.options.easing || (jQuery.easing.swing ? "swing" : "linear");
			this.pos = jQuery.easing[specialEasing || defaultEasing](this.state, n, 0, 1, this.options.duration);
			this.now = this.start + ((this.end - this.start) * this.pos);

			// Perform the next step of the animation
			this.update();
		}

		return true;
	}
};

jQuery.extend( jQuery.fx, {
	tick: function() {
		var timers = jQuery.timers;

		for ( var i = 0; i < timers.length; i++ ) {
			if ( !timers[i]() ) {
				timers.splice(i--, 1);
			}
		}

		if ( !timers.length ) {
			jQuery.fx.stop();
		}
	},
		
	stop: function() {
		clearInterval( timerId );
		timerId = null;
	},
	
	speeds: {
		slow: 600,
 		fast: 200,
 		// Default speed
 		_default: 400
	},

	step: {
		opacity: function( fx ) {
			jQuery.style(fx.elem, "opacity", fx.now);
		},

		_default: function( fx ) {
			if ( fx.elem.style && fx.elem.style[ fx.prop ] != null ) {
				fx.elem.style[ fx.prop ] = (fx.prop === "width" || fx.prop === "height" ? Math.max(0, fx.now) : fx.now) + fx.unit;
			} else {
				fx.elem[ fx.prop ] = fx.now;
			}
		}
	}
});

if ( jQuery.expr && jQuery.expr.filters ) {
	jQuery.expr.filters.animated = function( elem ) {
		return jQuery.grep(jQuery.timers, function( fn ) {
			return elem === fn.elem;
		}).length;
	};
}

function genFx( type, num ) {
	var obj = {};

	jQuery.each( fxAttrs.concat.apply([], fxAttrs.slice(0,num)), function() {
		obj[ this ] = type;
	});

	return obj;
}
if ( "getBoundingClientRect" in document.documentElement ) {
	jQuery.fn.offset = function( options ) {
		var elem = this[0];

		if ( options ) { 
			return this.each(function( i ) {
				jQuery.offset.setOffset( this, options, i );
			});
		}

		if ( !elem || !elem.ownerDocument ) {
			return null;
		}

		if ( elem === elem.ownerDocument.body ) {
			return jQuery.offset.bodyOffset( elem );
		}

		var box = elem.getBoundingClientRect(), doc = elem.ownerDocument, body = doc.body, docElem = doc.documentElement,
			clientTop = docElem.clientTop || body.clientTop || 0, clientLeft = docElem.clientLeft || body.clientLeft || 0,
			top  = box.top  + (self.pageYOffset || jQuery.support.boxModel && docElem.scrollTop  || body.scrollTop ) - clientTop,
			left = box.left + (self.pageXOffset || jQuery.support.boxModel && docElem.scrollLeft || body.scrollLeft) - clientLeft;

		return { top: top, left: left };
	};

} else {
	jQuery.fn.offset = function( options ) {
		var elem = this[0];

		if ( options ) { 
			return this.each(function( i ) {
				jQuery.offset.setOffset( this, options, i );
			});
		}

		if ( !elem || !elem.ownerDocument ) {
			return null;
		}

		if ( elem === elem.ownerDocument.body ) {
			return jQuery.offset.bodyOffset( elem );
		}

		jQuery.offset.initialize();

		var offsetParent = elem.offsetParent, prevOffsetParent = elem,
			doc = elem.ownerDocument, computedStyle, docElem = doc.documentElement,
			body = doc.body, defaultView = doc.defaultView,
			prevComputedStyle = defaultView ? defaultView.getComputedStyle( elem, null ) : elem.currentStyle,
			top = elem.offsetTop, left = elem.offsetLeft;

		while ( (elem = elem.parentNode) && elem !== body && elem !== docElem ) {
			if ( jQuery.offset.supportsFixedPosition && prevComputedStyle.position === "fixed" ) {
				break;
			}

			computedStyle = defaultView ? defaultView.getComputedStyle(elem, null) : elem.currentStyle;
			top  -= elem.scrollTop;
			left -= elem.scrollLeft;

			if ( elem === offsetParent ) {
				top  += elem.offsetTop;
				left += elem.offsetLeft;

				if ( jQuery.offset.doesNotAddBorder && !(jQuery.offset.doesAddBorderForTableAndCells && /^t(able|d|h)$/i.test(elem.nodeName)) ) {
					top  += parseFloat( computedStyle.borderTopWidth  ) || 0;
					left += parseFloat( computedStyle.borderLeftWidth ) || 0;
				}

				prevOffsetParent = offsetParent, offsetParent = elem.offsetParent;
			}

			if ( jQuery.offset.subtractsBorderForOverflowNotVisible && computedStyle.overflow !== "visible" ) {
				top  += parseFloat( computedStyle.borderTopWidth  ) || 0;
				left += parseFloat( computedStyle.borderLeftWidth ) || 0;
			}

			prevComputedStyle = computedStyle;
		}

		if ( prevComputedStyle.position === "relative" || prevComputedStyle.position === "static" ) {
			top  += body.offsetTop;
			left += body.offsetLeft;
		}

		if ( jQuery.offset.supportsFixedPosition && prevComputedStyle.position === "fixed" ) {
			top  += Math.max( docElem.scrollTop, body.scrollTop );
			left += Math.max( docElem.scrollLeft, body.scrollLeft );
		}

		return { top: top, left: left };
	};
}

jQuery.offset = {
	initialize: function() {
		var body = document.body, container = document.createElement("div"), innerDiv, checkDiv, table, td, bodyMarginTop = parseFloat( jQuery.curCSS(body, "marginTop", true) ) || 0,
			html = "<div style='position:absolute;top:0;left:0;margin:0;border:5px solid #000;padding:0;width:1px;height:1px;'><div></div></div><table style='position:absolute;top:0;left:0;margin:0;border:5px solid #000;padding:0;width:1px;height:1px;' cellpadding='0' cellspacing='0'><tr><td></td></tr></table>";

		jQuery.extend( container.style, { position: "absolute", top: 0, left: 0, margin: 0, border: 0, width: "1px", height: "1px", visibility: "hidden" } );

		container.innerHTML = html;
		body.insertBefore( container, body.firstChild );
		innerDiv = container.firstChild;
		checkDiv = innerDiv.firstChild;
		td = innerDiv.nextSibling.firstChild.firstChild;

		this.doesNotAddBorder = (checkDiv.offsetTop !== 5);
		this.doesAddBorderForTableAndCells = (td.offsetTop === 5);

		checkDiv.style.position = "fixed", checkDiv.style.top = "20px";
		// safari subtracts parent border width here which is 5px
		this.supportsFixedPosition = (checkDiv.offsetTop === 20 || checkDiv.offsetTop === 15);
		checkDiv.style.position = checkDiv.style.top = "";

		innerDiv.style.overflow = "hidden", innerDiv.style.position = "relative";
		this.subtractsBorderForOverflowNotVisible = (checkDiv.offsetTop === -5);

		this.doesNotIncludeMarginInBodyOffset = (body.offsetTop !== bodyMarginTop);

		body.removeChild( container );
		body = container = innerDiv = checkDiv = table = td = null;
		jQuery.offset.initialize = jQuery.noop;
	},

	bodyOffset: function( body ) {
		var top = body.offsetTop, left = body.offsetLeft;

		jQuery.offset.initialize();

		if ( jQuery.offset.doesNotIncludeMarginInBodyOffset ) {
			top  += parseFloat( jQuery.curCSS(body, "marginTop",  true) ) || 0;
			left += parseFloat( jQuery.curCSS(body, "marginLeft", true) ) || 0;
		}

		return { top: top, left: left };
	},
	
	setOffset: function( elem, options, i ) {
		// set position first, in-case top/left are set even on static elem
		if ( /static/.test( jQuery.curCSS( elem, "position" ) ) ) {
			elem.style.position = "relative";
		}
		var curElem   = jQuery( elem ),
			curOffset = curElem.offset(),
			curTop    = parseInt( jQuery.curCSS( elem, "top",  true ), 10 ) || 0,
			curLeft   = parseInt( jQuery.curCSS( elem, "left", true ), 10 ) || 0;

		if ( jQuery.isFunction( options ) ) {
			options = options.call( elem, i, curOffset );
		}

		var props = {
			top:  (options.top  - curOffset.top)  + curTop,
			left: (options.left - curOffset.left) + curLeft
		};
		
		if ( "using" in options ) {
			options.using.call( elem, props );
		} else {
			curElem.css( props );
		}
	}
};


jQuery.fn.extend({
	position: function() {
		if ( !this[0] ) {
			return null;
		}

		var elem = this[0],

		// Get *real* offsetParent
		offsetParent = this.offsetParent(),

		// Get correct offsets
		offset       = this.offset(),
		parentOffset = /^body|html$/i.test(offsetParent[0].nodeName) ? { top: 0, left: 0 } : offsetParent.offset();

		// Subtract element margins
		// note: when an element has margin: auto the offsetLeft and marginLeft
		// are the same in Safari causing offset.left to incorrectly be 0
		offset.top  -= parseFloat( jQuery.curCSS(elem, "marginTop",  true) ) || 0;
		offset.left -= parseFloat( jQuery.curCSS(elem, "marginLeft", true) ) || 0;

		// Add offsetParent borders
		parentOffset.top  += parseFloat( jQuery.curCSS(offsetParent[0], "borderTopWidth",  true) ) || 0;
		parentOffset.left += parseFloat( jQuery.curCSS(offsetParent[0], "borderLeftWidth", true) ) || 0;

		// Subtract the two offsets
		return {
			top:  offset.top  - parentOffset.top,
			left: offset.left - parentOffset.left
		};
	},

	offsetParent: function() {
		return this.map(function() {
			var offsetParent = this.offsetParent || document.body;
			while ( offsetParent && (!/^body|html$/i.test(offsetParent.nodeName) && jQuery.css(offsetParent, "position") === "static") ) {
				offsetParent = offsetParent.offsetParent;
			}
			return offsetParent;
		});
	}
});


// Create scrollLeft and scrollTop methods
jQuery.each( ["Left", "Top"], function( i, name ) {
	var method = "scroll" + name;

	jQuery.fn[ method ] = function(val) {
		var elem = this[0], win;
		
		if ( !elem ) {
			return null;
		}

		if ( val !== undefined ) {
			// Set the scroll offset
			return this.each(function() {
				win = getWindow( this );

				if ( win ) {
					win.scrollTo(
						!i ? val : jQuery(win).scrollLeft(),
						 i ? val : jQuery(win).scrollTop()
					);

				} else {
					this[ method ] = val;
				}
			});
		} else {
			win = getWindow( elem );

			// Return the scroll offset
			return win ? ("pageXOffset" in win) ? win[ i ? "pageYOffset" : "pageXOffset" ] :
				jQuery.support.boxModel && win.document.documentElement[ method ] ||
					win.document.body[ method ] :
				elem[ method ];
		}
	};
});

function getWindow( elem ) {
	return ("scrollTo" in elem && elem.document) ?
		elem :
		elem.nodeType === 9 ?
			elem.defaultView || elem.parentWindow :
			false;
}
// Create innerHeight, innerWidth, outerHeight and outerWidth methods
jQuery.each([ "Height", "Width" ], function( i, name ) {

	var type = name.toLowerCase();

	// innerHeight and innerWidth
	jQuery.fn["inner" + name] = function() {
		return this[0] ?
			jQuery.css( this[0], type, false, "padding" ) :
			null;
	};

	// outerHeight and outerWidth
	jQuery.fn["outer" + name] = function( margin ) {
		return this[0] ?
			jQuery.css( this[0], type, false, margin ? "margin" : "border" ) :
			null;
	};

	jQuery.fn[ type ] = function( size ) {
		// Get window width or height
		var elem = this[0];
		if ( !elem ) {
			return size == null ? null : this;
		}
		
		if ( jQuery.isFunction( size ) ) {
			return this.each(function( i ) {
				var self = jQuery( this );
				self[ type ]( size.call( this, i, self[ type ]() ) );
			});
		}

		return ("scrollTo" in elem && elem.document) ? // does it walk and quack like a window?
			// Everyone else use document.documentElement or document.body depending on Quirks vs Standards mode
			elem.document.compatMode === "CSS1Compat" && elem.document.documentElement[ "client" + name ] ||
			elem.document.body[ "client" + name ] :

			// Get document width or height
			(elem.nodeType === 9) ? // is it a document
				// Either scroll[Width/Height] or offset[Width/Height], whichever is greater
				Math.max(
					elem.documentElement["client" + name],
					elem.body["scroll" + name], elem.documentElement["scroll" + name],
					elem.body["offset" + name], elem.documentElement["offset" + name]
				) :

				// Get or set width or height on the element
				size === undefined ?
					// Get width or height on the element
					jQuery.css( elem, type ) :

					// Set the width or height on the element (default to pixels if value is unitless)
					this.css( type, typeof size === "string" ? size : size + "px" );
	};

});

exports.$ = exports.jQuery = jQuery;

});
;bespin.tiki.register("::embedded", {
    name: "embedded",
    dependencies: { "theme_manager": "0.0.0", "text_editor": "0.0.0", "appconfig": "0.0.0", "edit_session": "0.0.0", "screen_theme": "0.0.0" }
});
bespin.tiki.module("embedded:index",function(require,exports,module) {
/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Bespin.
 *
 * The Initial Developer of the Original Code is
 * Mozilla.
 * Portions created by the Initial Developer are Copyright (C) 2009
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Bespin Team (bespin@mozilla.com)
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

"define metadata";
({
    "dependencies": {
        "appconfig": "0.0.0",
        "edit_session": "0.0.0",
        "theme_manager": "0.0.0",
        "screen_theme": "0.0.0",
        "text_editor": "0.0.0"
    }
});
"end";

// This plugin is artificial as a convenience. It's just here to collect up
// the common dependencies for embedded use

});
;bespin.tiki.register("::appconfig", {
    name: "appconfig",
    dependencies: { "jquery": "0.0.0", "canon": "0.0.0", "underscore": "0.0.0", "settings": "0.0.0" }
});
bespin.tiki.module("appconfig:index",function(require,exports,module) {
/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Bespin.
 *
 * The Initial Developer of the Original Code is
 * Mozilla.
 * Portions created by the Initial Developer are Copyright (C) 2009
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Bespin Team (bespin@mozilla.com)
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

var $ = require('jquery').$;
var _ = require('underscore')._;
var settings = require('settings').settings;
var group = require("bespin:promise").group;
var Promise = require("bespin:promise").Promise;
var console = require("bespin:console").console;
var Trace = require("bespin:util/stacktrace").Trace;
var util = require('bespin:util/util');

var firstBespin = true;

/*
 * launch Bespin with the configuration provided. The configuration is
 * an object with the following properties:
 * - theme: an object with the basePlugin as string and the standardTheme as
 *          string. Both are optional. If no basePlugin is given, screen_theme
 *          is used if this exists.
 * - objects: an object with a collection of named objects that will be
 *            registered with the plugin catalog (see PluginCatalog.registerObject)
 *            This will automatically be augmented with sane defaults (for
 *            example, most Bespin users want a text editor!)
 * - gui: instructions on how to build a GUI. Specifically, the current border
 *        layout positions will be filled in. Again this provides sane defaults.
 * - container: node to attach to (optional). If not provided a node will be
 *              created. and added to the body.
 * - settings: settings to preconfigure
 */
exports.launch = function(config) {
    var launchPromise = new Promise();

    // Remove the "Loading..." hint.
    $('#_bespin_loading').remove();

    // This will hold the require function to get the catalog.
    var require;

    // Is this the fist Bespin?
    if (firstBespin) {
        // Use the global require.
        require = bespin.tiki.require;
        firstBespin = false;
    } else {
        // Otherwise create a new tiki-bespin sandbox and a new require function.
        var sandbox = new (bespin.tiki.require('bespin:sandbox').Sandbox);
        require = sandbox.createRequire({
            id: 'index',
            ownerPackage: bespin.tiki.loader.anonymousPackage
        });
    }

    // Here we go: Require the catalog that is used for this Bespin instance.
    var catalog = require('bespin:plugins').catalog;

    // Launch Bespin!
    config = config || {};
    exports.normalizeConfig(catalog, config);
    var objects = config.objects;
    for (var key in objects) {
        catalog.registerObject(key, objects[key]);
    }

    for (var setting in config.settings) {
        settings.set(setting, config.settings[setting]);
    }

    // Resolve the launchPromise and pass the env variable along.
    var resolveLaunchPromise = function() {
        var env = require("environment").env;

        var editor = env.editor;
        if (editor) {
            if (config.lineNumber) {
                editor.setLineNumber(config.lineNumber);
            }
            if (config.stealFocus) {
                editor.focus = true;
            }
            if (config.readOnly) {
                editor.readOnly = config.readOnly;
            }
            if (config.syntax) {
                editor.syntax = config.syntax;
            }
        }
        var commandLine = catalog.getObject('commandLine');
        if (commandLine) {
            env.commandLine = commandLine;
        }

        catalog.publish(this, 'appLaunched');

        launchPromise.resolve(env);
    }.bind(this);

    var themeLoadingPromise = new Promise();

    themeLoadingPromise.then(function() {
        if (objects.loginController) {
            catalog.createObject("loginController").then(
                function(loginController) {
                    var pr = loginController.showLogin();
                    pr.then(function(username) {
                        // Add the username as constructor argument.
                        config.objects.session.arguments.push(username);

                        exports.launchEditor(catalog, config).then(resolveLaunchPromise,
                                        launchPromise.reject.bind(launchPromise));
                    });
                });
        } else {
            exports.launchEditor(catalog, config).then(resolveLaunchPromise,
                                        launchPromise.reject.bind(launchPromise));
        }
    }, function(error) {
        launchPromise.reject(error);
    });

    // If the themeManager plugin is there, then check for theme configuration.
    if (catalog.plugins.theme_manager) {
        bespin.tiki.require.ensurePackage('::theme_manager', function() {
            var themeManager = require('theme_manager');
            if (config.theme.basePlugin) {
                themeManager.setBasePlugin(config.theme.basePlugin);
            }
            if (config.theme.standard) {
                themeManager.setStandardTheme(config.theme.standard);
            }
            themeManager.startParsing().then(function() {
                themeLoadingPromise.resolve();
            }, function(error) {
                themeLoadingPromise.reject(error);
            });
        });
    } else {
        themeLoadingPromise.resolve();
    }

    return launchPromise;
};

exports.normalizeConfig = function(catalog, config) {
    if (config.objects === undefined) {
        config.objects = {};
    }
    if (config.autoload === undefined) {
        config.autoload = [];
    }
    if (config.theme === undefined) {
        config.theme = {};
    }
    if (!config.theme.basePlugin && catalog.plugins.screen_theme) {
        config.theme.basePlugin = 'screen_theme';
    }
    if (!config.initialContent) {
        config.initialContent = '';
    }
    if (!config.settings) {
        config.settings = {};
    }

    if (!config.objects.notifier && catalog.plugins.notifier) {
        config.objects.notifier = {
        };
    }

    if (!config.objects.loginController && catalog.plugins.userident) {
        config.objects.loginController = {
        };
    }
    if (!config.objects.fileHistory && catalog.plugins.file_history) {
        config.objects.fileHistory = {
            factory: 'file_history',
            arguments: [
                "session"
            ],
            objects: {
                "0": "session"
            }
        };
    }
    if (!config.objects.server && catalog.plugins.bespin_server) {
        config.objects.server = {
            factory: "bespin_server"
        };
        config.objects.filesource = {
            factory: "bespin_filesource",
            arguments: [
                "server"
            ],
            objects: {
                "0": "server"
            }
        };
    }
    if (!config.objects.files && catalog.plugins.filesystem &&
        config.objects.filesource) {
        config.objects.files = {
            arguments: [
                "filesource"
            ],
            "objects": {
                "0": "filesource"
            }
        };
    }
    if (!config.objects.editor) {
        config.objects.editor = {
            factory: "text_editor",
            arguments: [
                config.initialContent
            ]
        };
    }
    if (!config.objects.session) {
        config.objects.session = {
            arguments: [
                "editor"
            ],
            "objects": {
                "0": "editor"
            }
        };
    }
    if (!config.objects.commandLine && catalog.plugins.command_line) {
        config.objects.commandLine = {
        };
    }
    if (!config.objects.toolbar && catalog.plugins.toolbar) {
        config.objects.toolbar = {};
    }

    if (config.gui === undefined) {
        config.gui = {};
    }

    var alreadyRegistered = {};
    for (var key in config.gui) {
        var desc = config.gui[key];
        if (desc.component) {
            alreadyRegistered[desc.component] = true;
        }
    }

    if (!config.gui.north && config.objects.toolbar
        && !alreadyRegistered.toolbar) {
        config.gui.north = { component: "toolbar" };
    }
    if (!config.gui.center && config.objects.editor
        && !alreadyRegistered.editor) {
        config.gui.center = { component: "editor" };
    }
    if (!config.gui.south && config.objects.commandLine
        && !alreadyRegistered.commandLine) {
        config.gui.south = { component: "commandLine" };
    }
};

exports.launchEditor = function(catalog, config) {
    var retPr = new Promise();

    if (config === null) {
        var message = 'Cannot start editor without a configuration!';
        console.error(message);
        retPr.reject(message);
        return retPr;
    }

    var pr = createAllObjects(catalog, config);
    pr.then(function() {
        generateGUI(catalog, config, retPr);
    }, function(error) {
        console.error('Error while creating objects');
        new Trace(error).log();
        retPr.reject(error);
    });

    return retPr;
};

var createAllObjects = function(catalog, config) {
    var promises = [];
    for (var objectName in config.objects) {
        promises.push(catalog.createObject(objectName));
    }
    return group(promises);
};

var generateGUI = function(catalog, config, pr) {
    var error;

    var container = document.createElement('div');
    container.setAttribute('class', 'container');

    var centerContainer = document.createElement('div');
    centerContainer.setAttribute('class', 'center-container');
    var centerAdded = false;

    var element = config.element || document.body;
    // Add the 'bespin' class to the element in case it doesn't have this already.
    util.addClass(element, 'bespin');
    element.appendChild(container);

    try {
        // this shouldn't be necessary, but it looks like Firefox has an issue
        // with the box-ordinal-group CSS property
        ['north', 'west', 'center', 'east', 'south'].forEach(function(place) {
            var descriptor = config.gui[place];
            if (!descriptor) {
                return;
            }

            var component = catalog.getObject(descriptor.component);
            if (!component) {
                throw 'Cannot find object ' + descriptor.component +
                                ' to attach to the Bespin UI';
            }

            element = component.element;
            if (!element) {
                throw 'Component ' + descriptor.component + ' does not ' +
                            'have an "element" attribute to attach to the ' +
                            'Bespin UI';
            }

            $(element).addClass(place);

            if (place == 'west' || place == 'east' || place == 'center') {
                if (!centerAdded) {
                    container.appendChild(centerContainer);
                    centerAdded = true;
                }
                centerContainer.appendChild(element);
            } else {
                container.appendChild(element);
            }
        });

        // Call the "elementAppended" callbacks.
        ['north', 'west', 'east', 'south', 'center'].forEach(function(place) {
            var descriptor = config.gui[place];
            if (!descriptor) {
                return;
            }

            var component = catalog.getObject(descriptor.component);
            if (component.elementAppended != null) {
                component.elementAppended();
            }
        });

        pr.resolve();
    } catch (e) {
        console.error(e);
        pr.reject(e);
    }

};

});
;bespin.tiki.register("::events", {
    name: "events",
    dependencies: { "traits": "0.0.0" }
});
bespin.tiki.module("events:index",function(require,exports,module) {
/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Bespin.
 *
 * The Initial Developer of the Original Code is
 * Mozilla.
 * Portions created by the Initial Developer are Copyright (C) 2009
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Bespin Team (bespin@mozilla.com)
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

exports.Event = function() {
    var handlers = [];
    var evt = function() {
        var args = arguments;
        handlers.forEach(function(handler) { handler.func.apply(null, args); });
    };

    /**
     * Adds a new handler via
     *  a) evt.add(handlerFunc)
     *  b) evt.add(reference, handlerFunc)
     */
    evt.add = function() {
        if (arguments.length == 1) {
            handlers.push({
                ref: arguments[0],
                func: arguments[0]
            });
        } else {
            handlers.push({
                ref: arguments[0],
                func: arguments[1]
            });
        }
    };

    evt.remove = function(ref) {
        var notEqual = function(other) { return ref !== other.ref; };
        handlers = handlers.filter(notEqual);
    };

    evt.removeAll = function() {
        handlers = [];
    };

    return evt;
};


});
;bespin.tiki.register("::screen_theme", {
    name: "screen_theme",
    dependencies: { "theme_manager": "0.0.0" }
});
bespin.tiki.module("screen_theme:index",function(require,exports,module) {

});

(function() {
var $ = bespin.tiki.require("jquery").$;
$(document).ready(function() {
    bespin.tiki.require("bespin:plugins").catalog.registerMetadata({"text_editor": {"resourceURL": "resources/text_editor/", "description": "Canvas-based text editor component and many common editing commands", "dependencies": {"completion": "0.0.0", "undomanager": "0.0.0", "settings": "0.0.0", "canon": "0.0.0", "rangeutils": "0.0.0", "traits": "0.0.0", "theme_manager": "0.0.0", "keyboard": "0.0.0", "edit_session": "0.0.0", "syntax_manager": "0.0.0"}, "testmodules": ["tests/testScratchcanvas", "tests/controllers/testLayoutmanager", "tests/models/testTextstorage", "tests/utils/testRect"], "provides": [{"action": "new", "pointer": "views/editor#EditorView", "ep": "factory", "name": "text_editor"}, {"predicates": {"isTextView": true}, "pointer": "commands/editing#backspace", "ep": "command", "key": "backspace", "name": "backspace"}, {"predicates": {"isTextView": true}, "pointer": "commands/editing#deleteCommand", "ep": "command", "key": "delete", "name": "delete"}, {"description": "Delete all lines currently selected", "key": "ctrl_d", "predicates": {"isTextView": true}, "pointer": "commands/editing#deleteLines", "ep": "command", "name": "deletelines"}, {"description": "Create a new, empty line below the current one", "key": "ctrl_return", "predicates": {"isTextView": true}, "pointer": "commands/editing#openLine", "ep": "command", "name": "openline"}, {"description": "Join the current line with the following", "key": "ctrl_shift_j", "predicates": {"isTextView": true}, "pointer": "commands/editing#joinLines", "ep": "command", "name": "joinline"}, {"params": [{"defaultValue": "", "type": "text", "name": "text", "description": "The text to insert"}], "pointer": "commands/editing#insertText", "ep": "command", "name": "insertText"}, {"predicates": {"completing": false, "isTextView": true}, "pointer": "commands/editing#newline", "ep": "command", "key": "return", "name": "newline"}, {"predicates": {"completing": false, "isTextView": true}, "pointer": "commands/editing#tab", "ep": "command", "key": "tab", "name": "tab"}, {"predicates": {"isTextView": true}, "pointer": "commands/editing#untab", "ep": "command", "key": "shift_tab", "name": "untab"}, {"predicates": {"isTextView": true}, "ep": "command", "name": "move"}, {"description": "Repeat the last search (forward)", "pointer": "commands/editor#findNextCommand", "ep": "command", "key": "ctrl_g", "name": "findnext"}, {"description": "Repeat the last search (backward)", "pointer": "commands/editor#findPrevCommand", "ep": "command", "key": "ctrl_shift_g", "name": "findprev"}, {"predicates": {"completing": false, "isTextView": true}, "pointer": "commands/movement#moveDown", "ep": "command", "key": "down", "name": "move down"}, {"predicates": {"isTextView": true}, "pointer": "commands/movement#moveLeft", "ep": "command", "key": "left", "name": "move left"}, {"predicates": {"isTextView": true}, "pointer": "commands/movement#moveRight", "ep": "command", "key": "right", "name": "move right"}, {"predicates": {"completing": false, "isTextView": true}, "pointer": "commands/movement#moveUp", "ep": "command", "key": "up", "name": "move up"}, {"predicates": {"isTextView": true}, "ep": "command", "name": "select"}, {"predicates": {"isTextView": true}, "pointer": "commands/movement#selectDown", "ep": "command", "key": "shift_down", "name": "select down"}, {"predicates": {"isTextView": true}, "pointer": "commands/movement#selectLeft", "ep": "command", "key": "shift_left", "name": "select left"}, {"predicates": {"isTextView": true}, "pointer": "commands/movement#selectRight", "ep": "command", "key": "shift_right", "name": "select right"}, {"predicates": {"isTextView": true}, "pointer": "commands/movement#selectUp", "ep": "command", "key": "shift_up", "name": "select up"}, {"predicates": {"isTextView": true}, "pointer": "commands/movement#moveLineEnd", "ep": "command", "key": ["end", "ctrl_right"], "name": "move lineend"}, {"predicates": {"isTextView": true}, "pointer": "commands/movement#selectLineEnd", "ep": "command", "key": ["shift_end", "ctrl_shift_right"], "name": "select lineend"}, {"predicates": {"isTextView": true}, "pointer": "commands/movement#moveDocEnd", "ep": "command", "key": "ctrl_down", "name": "move docend"}, {"predicates": {"isTextView": true}, "pointer": "commands/movement#selectDocEnd", "ep": "command", "key": "ctrl_shift_down", "name": "select docend"}, {"predicates": {"isTextView": true}, "pointer": "commands/movement#moveLineStart", "ep": "command", "key": ["home", "ctrl_left"], "name": "move linestart"}, {"predicates": {"isTextView": true}, "pointer": "commands/movement#selectLineStart", "ep": "command", "key": ["shift_home", "ctrl_shift_left"], "name": "select linestart"}, {"predicates": {"isTextView": true}, "pointer": "commands/movement#moveDocStart", "ep": "command", "key": "ctrl_up", "name": "move docstart"}, {"predicates": {"isTextView": true}, "pointer": "commands/movement#selectDocStart", "ep": "command", "key": "ctrl_shift_up", "name": "select docstart"}, {"predicates": {"isTextView": true}, "pointer": "commands/movement#moveNextWord", "ep": "command", "key": ["alt_right"], "name": "move nextword"}, {"predicates": {"isTextView": true}, "pointer": "commands/movement#selectNextWord", "ep": "command", "key": ["alt_shift_right"], "name": "select nextword"}, {"predicates": {"isTextView": true}, "pointer": "commands/movement#movePreviousWord", "ep": "command", "key": ["alt_left"], "name": "move prevword"}, {"predicates": {"isTextView": true}, "pointer": "commands/movement#selectPreviousWord", "ep": "command", "key": ["alt_shift_left"], "name": "select prevword"}, {"predicates": {"isTextView": true}, "pointer": "commands/movement#selectAll", "ep": "command", "key": ["ctrl_a", "meta_a"], "name": "select all"}, {"predicates": {"isTextView": true}, "ep": "command", "name": "scroll"}, {"predicates": {"isTextView": true}, "pointer": "commands/scrolling#scrollDocStart", "ep": "command", "key": "ctrl_home", "name": "scroll start"}, {"predicates": {"isTextView": true}, "pointer": "commands/scrolling#scrollDocEnd", "ep": "command", "key": "ctrl_end", "name": "scroll end"}, {"predicates": {"isTextView": true}, "pointer": "commands/scrolling#scrollPageDown", "ep": "command", "key": "pagedown", "name": "scroll down"}, {"predicates": {"isTextView": true}, "pointer": "commands/scrolling#scrollPageUp", "ep": "command", "key": "pageup", "name": "scroll up"}, {"pointer": "commands/editor#lcCommand", "description": "Change all selected text to lowercase", "withKey": "CMD SHIFT L", "ep": "command", "name": "lc"}, {"pointer": "commands/editor#detabCommand", "description": "Convert tabs to spaces.", "params": [{"defaultValue": null, "type": "text", "name": "tabsize", "description": "Optionally, specify a tab size. (Defaults to setting.)"}], "ep": "command", "name": "detab"}, {"pointer": "commands/editor#entabCommand", "description": "Convert spaces to tabs.", "params": [{"defaultValue": null, "type": "text", "name": "tabsize", "description": "Optionally, specify a tab size. (Defaults to setting.)"}], "ep": "command", "name": "entab"}, {"pointer": "commands/editor#trimCommand", "description": "trim trailing or leading whitespace from each line in selection", "params": [{"defaultValue": "both", "type": {"data": [{"name": "left"}, {"name": "right"}, {"name": "both"}], "name": "selection"}, "name": "side", "description": "Do we trim from the left, right or both"}], "ep": "command", "name": "trim"}, {"pointer": "commands/editor#ucCommand", "description": "Change all selected text to uppercase", "withKey": "CMD SHIFT U", "ep": "command", "name": "uc"}, {"predicates": {"isTextView": true}, "pointer": "controllers/undo#undoManagerCommand", "ep": "command", "key": ["ctrl_shift_z"], "name": "redo"}, {"predicates": {"isTextView": true}, "pointer": "controllers/undo#undoManagerCommand", "ep": "command", "key": ["ctrl_z"], "name": "undo"}, {"description": "The distance in characters between each tab", "defaultValue": 8, "type": "number", "ep": "setting", "name": "tabstop"}, {"description": "Customize the keymapping", "defaultValue": "{}", "type": "text", "ep": "setting", "name": "customKeymapping"}, {"description": "The keymapping to use", "defaultValue": "standard", "type": "text", "ep": "setting", "name": "keymapping"}, {"description": "The editor font size in pixels", "defaultValue": 14, "type": "number", "ep": "setting", "name": "fontsize"}, {"description": "The editor font face", "defaultValue": "Monaco, Lucida Console, monospace", "type": "text", "ep": "setting", "name": "fontface"}, {"defaultValue": {"color": "#e5c138", "paddingLeft": 5, "backgroundColor": "#4c4a41", "paddingRight": 10}, "ep": "themevariable", "name": "gutter"}, {"defaultValue": {"color": "#e6e6e6", "selectedTextBackgroundColor": "#526da5", "backgroundColor": "#2a211c", "cursorColor": "#879aff", "unfocusedCursorBackgroundColor": "#73171e", "unfocusedCursorColor": "#ff0033"}, "ep": "themevariable", "name": "editor"}, {"defaultValue": {"comment": "#666666", "directive": "#999999", "keyword": "#42A8ED", "addition": "#FFFFFF", "plain": "#e6e6e6", "module": "#BA4946", "specialmodule": "#C741BB", "builtin": "#307BAD", "deletion": "#FFFFFF", "error": "#ff0000", "operator": "#88BBFF", "identifier": "#D841FF", "string": "#039A0A"}, "ep": "themevariable", "name": "highlighterFG"}, {"defaultValue": {"addition": "#008000", "deletion": "#800000"}, "ep": "themevariable", "name": "highlighterBG"}, {"defaultValue": {"nibStrokeStyle": "rgb(150, 150, 150)", "fullAlpha": 1.0, "barFillStyle": "rgb(0, 0, 0)", "particalAlpha": 0.29999999999999999, "barFillGradientBottomStop": "rgb(44, 44, 44)", "backgroundStyle": "#2A211C", "thickness": 17, "padding": 5, "trackStrokeStyle": "rgb(150, 150, 150)", "nibArrowStyle": "rgb(255, 255, 255)", "barFillGradientBottomStart": "rgb(22, 22, 22)", "barFillGradientTopStop": "rgb(40, 40, 40)", "barFillGradientTopStart": "rgb(90, 90, 90)", "nibStyle": "rgb(100, 100, 100)", "trackFillStyle": "rgba(50, 50, 50, 0.8)"}, "ep": "themevariable", "name": "scroller"}, {"description": "Event: Notify when something within the editor changed.", "params": [{"required": true, "name": "pointer", "description": "Function that is called whenever a change happened."}], "ep": "extensionpoint", "name": "editorChange"}, {"description": "Decoration for the gutter", "ep": "extensionpoint", "name": "gutterDecoration"}, {"description": "Line number decoration for the gutter", "pointer": "views/gutter#lineNumbers", "ep": "gutterDecoration", "name": "lineNumbers"}], "type": "plugins/supported", "name": "text_editor"}, "less": {"resourceURL": "resources/less/", "description": "Leaner CSS", "contributors": [], "author": "Alexis Sellier <self@cloudhead.net>", "url": "http://lesscss.org", "version": "1.0.11", "dependencies": {}, "testmodules": [], "provides": [], "keywords": ["css", "parser", "lesscss", "browser"], "type": "plugins/thirdparty", "name": "less"}, "theme_manager_base": {"resourceURL": "resources/theme_manager_base/", "name": "theme_manager_base", "share": true, "environments": {"main": true}, "dependencies": {}, "testmodules": [], "provides": [{"description": "(Less)files holding the CSS style information for the UI.", "params": [{"required": true, "name": "url", "description": "Name of the ThemeStylesFile - can also be an array of files."}], "ep": "extensionpoint", "name": "themestyles"}, {"description": "Event: Notify when the theme(styles) changed.", "params": [{"required": true, "name": "pointer", "description": "Function that is called whenever the theme is changed."}], "ep": "extensionpoint", "name": "themeChange"}, {"indexOn": "name", "description": "A theme is a way change the look of the application.", "params": [{"required": false, "name": "url", "description": "Name of a ThemeStylesFile that holds theme specific CSS rules - can also be an array of files."}, {"required": true, "name": "pointer", "description": "Function that returns the ThemeData"}], "ep": "extensionpoint", "name": "theme"}], "type": "plugins/supported", "description": "Defines extension points required for theming"}, "canon": {"resourceURL": "resources/canon/", "name": "canon", "environments": {"main": true, "worker": false}, "dependencies": {"environment": "0.0.0", "events": "0.0.0", "settings": "0.0.0"}, "testmodules": [], "provides": [{"indexOn": "name", "description": "A command is a bit of functionality with optional typed arguments which can do something small like moving the cursor around the screen, or large like cloning a project from VCS.", "ep": "extensionpoint", "name": "command"}, {"description": "An extension point to be called whenever a new command begins output.", "ep": "extensionpoint", "name": "addedRequestOutput"}, {"description": "A dimensionsChanged is a way to be notified of changes to the dimension of Bespin", "ep": "extensionpoint", "name": "dimensionsChanged"}, {"description": "How many typed commands do we recall for reference?", "defaultValue": 50, "type": "number", "ep": "setting", "name": "historyLength"}, {"action": "create", "pointer": "history#InMemoryHistory", "ep": "factory", "name": "history"}], "type": "plugins/supported", "description": "Manages commands"}, "traits": {"resourceURL": "resources/traits/", "description": "Traits library, traitsjs.org", "dependencies": {}, "testmodules": [], "provides": [], "type": "plugins/thirdparty", "name": "traits"}, "keyboard": {"resourceURL": "resources/keyboard/", "description": "Keyboard shortcuts", "dependencies": {"canon": "0.0", "settings": "0.0"}, "testmodules": ["tests/testKeyboard"], "provides": [{"description": "A keymapping defines how keystrokes are interpreted.", "params": [{"required": true, "name": "states", "description": "Holds the states and all the informations about the keymapping. See docs: pluginguide/keymapping"}], "ep": "extensionpoint", "name": "keymapping"}], "type": "plugins/supported", "name": "keyboard"}, "worker_manager": {"resourceURL": "resources/worker_manager/", "description": "Manages a web worker on the browser side", "dependencies": {"canon": "0.0.0", "events": "0.0.0", "underscore": "0.0.0"}, "testmodules": [], "provides": [{"description": "Low-level web worker control (for plugin development)", "ep": "command", "name": "worker"}, {"description": "Restarts all web workers (for plugin development)", "pointer": "#workerRestartCommand", "ep": "command", "name": "worker restart"}], "type": "plugins/supported", "name": "worker_manager"}, "diff": {"testmodules": [], "type": "plugins/thirdparty", "resourceURL": "resources/diff/", "description": "Diff/Match/Patch module (support code, no UI)", "name": "diff"}, "edit_session": {"resourceURL": "resources/edit_session/", "description": "Ties together the files being edited with the views on screen", "dependencies": {"events": "0.0.0"}, "testmodules": ["tests/testSession"], "provides": [{"action": "call", "pointer": "#createSession", "ep": "factory", "name": "session"}], "type": "plugins/supported", "name": "edit_session"}, "syntax_manager": {"resourceURL": "resources/syntax_manager/", "name": "syntax_manager", "environments": {"main": true, "worker": false}, "dependencies": {"worker_manager": "0.0.0", "syntax_directory": "0.0.0", "events": "0.0.0", "underscore": "0.0.0", "settings": "0.0.0"}, "testmodules": [], "provides": [], "type": "plugins/supported", "description": "Provides syntax highlighting services for the editor"}, "completion": {"resourceURL": "resources/completion/", "description": "Code completion support", "dependencies": {"jquery": "0.0.0", "ctags": "0.0.0", "rangeutils": "0.0.0", "canon": "0.0.0", "underscore": "0.0.0"}, "testmodules": [], "provides": [{"indexOn": "name", "description": "Code completion support for specific languages", "ep": "extensionpoint", "name": "completion"}, {"description": "Accept the chosen completion", "key": ["return", "tab"], "predicates": {"completing": true}, "pointer": "controller#completeCommand", "ep": "command", "name": "complete"}, {"description": "Abandon the completion", "key": "escape", "predicates": {"completing": true}, "pointer": "controller#completeCancelCommand", "ep": "command", "name": "complete cancel"}, {"description": "Choose the completion below", "key": "down", "predicates": {"completing": true}, "pointer": "controller#completeDownCommand", "ep": "command", "name": "complete down"}, {"description": "Choose the completion above", "key": "up", "predicates": {"completing": true}, "pointer": "controller#completeUpCommand", "ep": "command", "name": "complete up"}], "type": "plugins/supported", "name": "completion"}, "environment": {"testmodules": [], "dependencies": {"settings": "0.0.0"}, "resourceURL": "resources/environment/", "name": "environment", "type": "plugins/supported"}, "undomanager": {"resourceURL": "resources/undomanager/", "description": "Manages undoable events", "testmodules": ["tests/testUndomanager"], "provides": [{"pointer": "#undoManagerCommand", "ep": "command", "key": ["ctrl_shift_z"], "name": "redo"}, {"pointer": "#undoManagerCommand", "ep": "command", "key": ["ctrl_z"], "name": "undo"}], "type": "plugins/supported", "name": "undomanager"}, "command_line": {"resourceURL": "resources/command_line/", "description": "Provides the command line user interface", "dependencies": {"templater": "0.0.0", "settings": "0.0.0", "matcher": "0.0.0", "theme_manager_base": "0.0.0", "canon": "0.0.0", "keyboard": "0.0.0", "diff": "0.0.0", "types": "0.0.0"}, "testmodules": ["tests/testInput"], "provides": [{"url": ["article.less", "cli.less", "menu.less", "requestOutput.less", "global.less"], "ep": "themestyles"}, {"defaultValue": "@global_container_background", "ep": "themevariable", "name": "bg"}, {"defaultValue": "@global_container_background + #090807", "ep": "themevariable", "name": "input_bg_light"}, {"defaultValue": "@global_container_background - #030303", "ep": "themevariable", "name": "input_bg"}, {"defaultValue": "@global_container_background - #050506", "ep": "themevariable", "name": "input_bg2"}, {"defaultValue": "@global_menu_inset_color_top_left", "ep": "themevariable", "name": "border_fg"}, {"defaultValue": "@global_menu_inset_color_right", "ep": "themevariable", "name": "border_fg2"}, {"defaultValue": "@global_menu_background", "ep": "themevariable", "name": "menu_bg"}, {"defaultValue": "@global_menu_border_color", "ep": "themevariable", "name": "border_bg"}, {"defaultValue": "@global_color", "ep": "themevariable", "name": "text"}, {"defaultValue": "@global_header_color", "ep": "themevariable", "name": "hi_text"}, {"defaultValue": "@global_hint_color", "ep": "themevariable", "name": "lo_text"}, {"defaultValue": "@global_hint_color", "ep": "themevariable", "name": "lo_text2"}, {"defaultValue": "@global_link_color", "ep": "themevariable", "name": "link_text"}, {"defaultValue": "@global_error_color", "ep": "themevariable", "name": "error_text"}, {"defaultValue": "@global_selectable_hover_background", "ep": "themevariable", "name": "theme_text"}, {"comment": "#FFCE00", "defaultValue": "rgb(255,206,0)", "ep": "themevariable", "name": "theme_text_light"}, {"defaultValue": "@global_selectable_hover_background - #222000", "ep": "themevariable", "name": "theme_text_dark"}, {"defaultValue": "@global_accelerator_color", "ep": "themevariable", "name": "theme_text_dark2"}, {"comment": "#0E0906", "defaultValue": "rgb(14,9,6)", "ep": "themevariable", "name": "input_submenu"}, {"defaultValue": "@global_font", "ep": "themevariable", "name": "fonts"}, {"defaultValue": "@global_selectable_hover_color", "ep": "themevariable", "name": "li_hover_color"}, {"defaultValue": "@global_hint_hover_color", "ep": "themevariable", "name": "li_hint_hover_color"}, {"defaultValue": "@global_accelerator_hover_color", "ep": "themevariable", "name": "li_accelerator_hover_color"}, {"action": "new", "pointer": "views/cli#CliInputView", "ep": "factory", "name": "commandLine"}, {"description": "Display number|date|none next to each historical instruction", "defaultValue": "none", "type": {"data": ["number", "date", "none"], "name": "selection"}, "ep": "setting", "name": "historyTimeMode"}, {"description": "The maximum size (in pixels) for the command line output area", "defaultValue": 0, "type": "number", "ep": "setting", "name": "minConsoleHeight"}, {"description": "The minimum size (in pixels) for the command line output area", "defaultValue": 300, "type": "number", "ep": "setting", "name": "maxConsoleHeight"}, {"predicates": {"isKeyUp": false, "isCommandLine": true}, "pointer": "commands/simple#completeCommand", "ep": "command", "key": "tab", "name": "complete"}, {"predicates": {"isKeyUp": true, "isCommandLine": true}, "pointer": "views/menu#activateItemAction", "ep": "command", "key": "alt_1", "name": "menu1"}, {"predicates": {"isKeyUp": true, "isCommandLine": true}, "pointer": "views/menu#activateItemAction", "ep": "command", "key": "alt_2", "name": "menu2"}, {"predicates": {"isKeyUp": true, "isCommandLine": true}, "pointer": "views/menu#activateItemAction", "ep": "command", "key": "alt_1", "name": "menu1"}, {"predicates": {"isKeyUp": true, "isCommandLine": true}, "pointer": "views/menu#activateItemAction", "ep": "command", "key": "alt_3", "name": "menu3"}, {"predicates": {"isKeyUp": true, "isCommandLine": true}, "pointer": "views/menu#activateItemAction", "ep": "command", "key": "alt_4", "name": "menu4"}, {"predicates": {"isKeyUp": true, "isCommandLine": true}, "pointer": "views/menu#activateItemAction", "ep": "command", "key": "alt_5", "name": "menu5"}, {"predicates": {"isKeyUp": true, "isCommandLine": true}, "pointer": "views/menu#activateItemAction", "ep": "command", "key": "alt_6", "name": "menu6"}, {"predicates": {"isKeyUp": true, "isCommandLine": true}, "pointer": "views/menu#activateItemAction", "ep": "command", "key": "alt_7", "name": "menu7"}, {"predicates": {"isKeyUp": true, "isCommandLine": true}, "pointer": "views/menu#activateItemAction", "ep": "command", "key": "alt_8", "name": "menu8"}, {"predicates": {"isKeyUp": true, "isCommandLine": true}, "pointer": "views/menu#activateItemAction", "ep": "command", "key": "alt_9", "name": "menu9"}, {"predicates": {"isKeyUp": true, "isCommandLine": true}, "pointer": "views/menu#activateItemAction", "ep": "command", "key": "alt_0", "name": "menu0"}, {"pointer": "commands/simple#helpCommand", "description": "Get help on the available commands.", "params": [{"defaultValue": null, "type": "text", "name": "search", "description": "Search string to narrow the output."}], "ep": "command", "name": "help"}, {"pointer": "commands/simple#aliasCommand", "description": "define and show aliases for commands", "params": [{"defaultValue": null, "type": "text", "name": "alias", "description": "optionally, your alias name"}, {"defaultValue": null, "type": "text", "name": "command", "description": "optionally, the command name"}], "ep": "command", "name": "alias"}, {"description": "evals given js code and show the result", "params": [{"type": "text", "name": "javascript", "description": "The JavaScript to evaluate"}], "hidden": true, "pointer": "commands/basic#evalCommand", "ep": "command", "name": "eval"}, {"description": "show the Bespin version", "hidden": true, "pointer": "commands/basic#versionCommand", "ep": "command", "name": "version"}, {"description": "has", "hidden": true, "pointer": "commands/basic#bespinCommand", "ep": "command", "name": "bespin"}, {"predicates": {"isKeyUp": true, "isCommandLine": true}, "pointer": "commands/history#historyPreviousCommand", "ep": "command", "key": "up", "name": "historyPrevious"}, {"predicates": {"isKeyUp": true, "isCommandLine": true}, "pointer": "commands/history#historyNextCommand", "ep": "command", "key": "down", "name": "historyNext"}, {"params": [], "description": "Show history of the commands", "pointer": "commands/history#historyCommand", "ep": "command", "name": "history"}, {"pointer": "commands/history#addedRequestOutput", "ep": "addedRequestOutput"}, {"indexOn": "name", "description": "A function to allow the command line to show a hint to the user on how they should finish what they're typing", "ep": "extensionpoint", "name": "typehint"}, {"description": "A UI for string that is constrained to be one of a number of pre-defined values", "pointer": "views/basic#selection", "ep": "typehint", "name": "selection"}, {"description": "A UI for a boolean", "pointer": "views/basic#bool", "ep": "typehint", "name": "boolean"}], "type": "plugins/supported", "name": "command_line"}, "rangeutils": {"testmodules": ["tests/test"], "type": "plugins/supported", "resourceURL": "resources/rangeutils/", "description": "Utility functions for dealing with ranges of text", "name": "rangeutils"}, "stylesheet": {"resourceURL": "resources/stylesheet/", "name": "stylesheet", "environments": {"worker": true}, "dependencies": {"standard_syntax": "0.0.0"}, "testmodules": [], "provides": [{"pointer": "#CSSSyntax", "ep": "syntax", "fileexts": ["css", "less"], "name": "css"}], "type": "plugins/supported", "description": "CSS syntax highlighter"}, "html": {"resourceURL": "resources/html/", "name": "html", "environments": {"worker": true}, "dependencies": {"standard_syntax": "0.0.0"}, "testmodules": [], "provides": [{"pointer": "#HTMLSyntax", "ep": "syntax", "fileexts": ["htm", "html"], "name": "html"}], "type": "plugins/supported", "description": "HTML syntax highlighter"}, "js_syntax": {"resourceURL": "resources/js_syntax/", "name": "js_syntax", "environments": {"worker": true}, "dependencies": {"standard_syntax": "0.0.0", "settings": "0.0.0"}, "testmodules": [], "provides": [{"settings": ["specialmodules"], "pointer": "#JSSyntax", "ep": "syntax", "fileexts": ["js", "json"], "name": "js"}, {"description": "Regex that matches special modules", "defaultValue": "^jetpack\\.[^\"']+", "type": "text", "ep": "setting", "name": "specialmodules"}], "type": "plugins/supported", "description": "JavaScript syntax highlighter"}, "ctags": {"resourceURL": "resources/ctags/", "description": "Reads and writes tag files", "dependencies": {"traits": "0.0.0", "underscore": "0.0.0"}, "testmodules": [], "type": "plugins/supported", "name": "ctags"}, "events": {"resourceURL": "resources/events/", "description": "Dead simple event implementation", "dependencies": {"traits": "0.0"}, "testmodules": ["tests/test"], "provides": [], "type": "plugins/supported", "name": "events"}, "templater": {"testmodules": [], "resourceURL": "resources/templater/", "name": "templater", "type": "plugins/supported"}, "matcher": {"resourceURL": "resources/matcher/", "description": "Provides various routines to match items in a list", "dependencies": {}, "testmodules": ["tests/testIndex", "tests/testPrefix", "tests/testQuick"], "type": "plugins/supported", "name": "matcher"}, "theme_manager": {"resourceURL": "resources/theme_manager/", "name": "theme_manager", "share": true, "environments": {"main": true, "worker": false}, "dependencies": {"theme_manager_base": "0.0.0", "settings": "0.0.0", "events": "0.0.0", "less": "0.0.0"}, "testmodules": [], "provides": [{"unregister": "themestyles#unregisterThemeStyles", "register": "themestyles#registerThemeStyles", "ep": "extensionhandler", "name": "themestyles"}, {"unregister": "index#unregisterTheme", "register": "index#registerTheme", "ep": "extensionhandler", "name": "theme"}, {"defaultValue": "standard", "description": "The theme plugin's name to use. If set to 'standard' no theme will be used", "type": "text", "ep": "setting", "name": "theme"}, {"pointer": "#appLaunched", "ep": "appLaunched"}], "type": "plugins/supported", "description": "Handles colors in Bespin"}, "whitetheme": {"resourceURL": "resources/whitetheme/", "description": "Provides a white theme for Bespin", "dependencies": {"theme_manager": "0.0.0"}, "testmodules": [], "provides": [{"url": ["theme.less"], "description": "A basic white theme", "pointer": "index#whiteTheme", "ep": "theme", "name": "white"}], "type": "plugins/supported", "name": "whitetheme"}, "standard_syntax": {"resourceURL": "resources/standard_syntax/", "description": "Easy-to-use basis for syntax engines", "environments": {"worker": true}, "dependencies": {"syntax_worker": "0.0.0", "syntax_directory": "0.0.0", "underscore": "0.0.0"}, "testmodules": [], "type": "plugins/supported", "name": "standard_syntax"}, "jquery": {"testmodules": [], "resourceURL": "resources/jquery/", "name": "jquery", "type": "plugins/thirdparty"}, "embedded": {"testmodules": [], "dependencies": {"theme_manager": "0.0.0", "text_editor": "0.0.0", "appconfig": "0.0.0", "edit_session": "0.0.0", "screen_theme": "0.0.0"}, "resourceURL": "resources/embedded/", "name": "embedded", "type": "plugins/supported"}, "appconfig": {"resourceURL": "resources/appconfig/", "description": "Instantiates components and displays the GUI based on configuration.", "dependencies": {"jquery": "0.0.0", "canon": "0.0.0", "underscore": "0.0.0", "settings": "0.0.0"}, "testmodules": [], "provides": [{"description": "Event: Fired when the app is completely launched.", "ep": "extensionpoint", "name": "appLaunched"}], "type": "plugins/supported", "name": "appconfig"}, "syntax_worker": {"resourceURL": "resources/syntax_worker/", "description": "Coordinates multiple syntax engines", "environments": {"worker": true}, "dependencies": {"syntax_directory": "0.0.0", "underscore": "0.0.0"}, "testmodules": [], "type": "plugins/supported", "name": "syntax_worker"}, "js_completion": {"resourceURL": "resources/js_completion/", "description": "JavaScript code completion", "dependencies": {"completion": "0.0.0", "underscore": "0.0.0"}, "testmodules": [], "provides": [{"pointer": "#JSCompletion", "ep": "completion", "name": "js"}], "type": "plugins/supported", "name": "js_completion"}, "screen_theme": {"resourceURL": "resources/screen_theme/", "description": "Bespins standard theme basePlugin", "dependencies": {"theme_manager": "0.0.0"}, "testmodules": [], "provides": [{"url": ["theme.less"], "ep": "themestyles"}, {"defaultValue": "@global_font", "ep": "themevariable", "name": "container_font"}, {"defaultValue": "@global_font_size", "ep": "themevariable", "name": "container_font_size"}, {"defaultValue": "@global_container_background", "ep": "themevariable", "name": "container_bg"}, {"defaultValue": "@global_color", "ep": "themevariable", "name": "container_color"}, {"defaultValue": "@global_line_height", "ep": "themevariable", "name": "container_line_height"}, {"defaultValue": "@global_pane_background", "ep": "themevariable", "name": "pane_bg"}, {"defaultValue": "@global_pane_border_radius", "ep": "themevariable", "name": "pane_border_radius"}, {"defaultValue": "@global_form_font", "ep": "themevariable", "name": "form_font"}, {"defaultValue": "@global_form_font_size", "ep": "themevariable", "name": "form_font_size"}, {"defaultValue": "@global_form_line_height", "ep": "themevariable", "name": "form_line_height"}, {"defaultValue": "@global_form_color", "ep": "themevariable", "name": "form_color"}, {"defaultValue": "@global_form_text_shadow", "ep": "themevariable", "name": "form_text_shadow"}, {"defaultValue": "@global_pane_link_color", "ep": "themevariable", "name": "pane_a_color"}, {"defaultValue": "@global_font", "ep": "themevariable", "name": "pane_font"}, {"defaultValue": "@global_font_size", "ep": "themevariable", "name": "pane_font_size"}, {"defaultValue": "@global_pane_text_shadow", "ep": "themevariable", "name": "pane_text_shadow"}, {"defaultValue": "@global_pane_h1_font", "ep": "themevariable", "name": "pane_h1_font"}, {"defaultValue": "@global_pane_h1_font_size", "ep": "themevariable", "name": "pane_h1_font_size"}, {"defaultValue": "@global_pane_h1_color", "ep": "themevariable", "name": "pane_h1_color"}, {"defaultValue": "@global_font_size * 1.8", "ep": "themevariable", "name": "pane_line_height"}, {"defaultValue": "@global_pane_color", "ep": "themevariable", "name": "pane_color"}, {"defaultValue": "@global_text_shadow", "ep": "themevariable", "name": "pane_text_shadow"}, {"defaultValue": "@global_font", "ep": "themevariable", "name": "button_font"}, {"defaultValue": "@global_font_size", "ep": "themevariable", "name": "button_font_size"}, {"defaultValue": "@global_button_color", "ep": "themevariable", "name": "button_color"}, {"defaultValue": "@global_button_background", "ep": "themevariable", "name": "button_bg"}, {"defaultValue": "@button_bg - #063A27", "ep": "themevariable", "name": "button_bg2"}, {"defaultValue": "@button_bg - #194A5E", "ep": "themevariable", "name": "button_border"}, {"defaultValue": "@global_control_background", "ep": "themevariable", "name": "control_bg"}, {"defaultValue": "@global_control_color", "ep": "themevariable", "name": "control_color"}, {"defaultValue": "@global_control_border", "ep": "themevariable", "name": "control_border"}, {"defaultValue": "@global_control_border_radius", "ep": "themevariable", "name": "control_border_radius"}, {"defaultValue": "@global_control_active_background", "ep": "themevariable", "name": "control_active_bg"}, {"defaultValue": "@global_control_active_border", "ep": "themevariable", "name": "control_active_border"}, {"defaultValue": "@global_control_active_color", "ep": "themevariable", "name": "control_active_color"}, {"defaultValue": "@global_control_active_inset_color", "ep": "themevariable", "name": "control_active_inset_color"}], "type": "plugins/supported", "name": "screen_theme"}});;
});
})();
/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Bespin.
 *
 * The Initial Developer of the Original Code is
 * Mozilla.
 * Portions created by the Initial Developer are Copyright (C) 2009
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Bespin Team (bespin@mozilla.com)
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

// This script appears at the end of BespinEmbeddedMain and is responsible
// for firing up Bespin on the page.
// This module depends only on Tiki.


(function() {

var Promise = bespin.tiki.require('bespin:promise').Promise;
var group = bespin.tiki.require("bespin:promise").group;
var $ = bespin.tiki.require("jquery").$;

bespin.loaded = new Promise();
bespin.initialized = new Promise();

/**
 * Returns the CSS property of element.
 *   1) If the CSS property is on the style object of the element, use it, OR
 *   2) Compute the CSS property
 *
 * If the property can't get computed, is 'auto' or 'intrinsic', the former
 * calculated property is uesd (this can happen in cases where the textarea
 * is hidden and has no dimension styles).
 */
var getCSSProperty = function(element, container, property) {
    var ret = element.style[property]
                || document.defaultView.getComputedStyle(element, '').
                                        getPropertyValue(property);

    if (!ret || ret == 'auto' || ret == 'intrinsic') {
        ret = container.style[property];
    }
    return ret;
};

bespin.useBespin = function(element, options) {
    var util = bespin.tiki.require('bespin:util/util');

    var baseConfig = {"settings": {"theme": "white"}};
    var baseSettings = baseConfig.settings;
    options = options || {};
    for (var key in options) {
        baseConfig[key] = options[key];
    }

    // we need to separately merge the configured settings
    var configSettings = baseConfig.settings;
    if (baseSettings !== undefined) {
        for (key in baseSettings) {
            if (configSettings[key] === undefined) {
                baseConfig.settings[key] = baseSettings[key];
            }
        }
    }

    var prEnv = null;
    var pr = new Promise();

    bespin.tiki.require.ensurePackage("::appconfig", function() {
        var appconfig = bespin.tiki.require("appconfig");
        if (util.isString(element)) {
            element = document.getElementById(element);
        }

        if (util.none(baseConfig.initialContent)) {
            baseConfig.initialContent = element.value || element.innerHTML;
        }

        element.innerHTML = '';

        if (element.type == 'textarea') {
            var parentNode = element.parentNode;
            // This will hold the Bespin editor.
            var container = document.createElement('div');

            // To put Bespin in the place of the textarea, we have to copy a
            // few of the textarea's style attributes to the div container.
            //
            // The problem is, that the properties have to get computed (they
            // might be defined by a CSS file on the page - you can't access
            // such rules that apply to an element via elm.style). Computed
            // properties are converted to pixels although the dimension might
            // be given as percentage. When the window resizes, the dimensions
            // defined by percentages changes, so the properties have to get
            // recomputed to get the new/true pixels.
            var resizeEvent = function() {
                var style = 'position:relative;';
                [
                    'margin-top', 'margin-left', 'margin-right', 'margin-bottom'
                ].forEach(function(item) {
                    style += item + ':' +
                                getCSSProperty(element, container, item) + ';';
                });

                // Calculating the width/height of the textarea is somewhat
                // tricky. To do it right, you have to include the paddings
                // to the sides as well (eg. width = width + padding-left, -right).
                // This works well, as long as the width of the element is not
                // set or given in pixels. In this case and after the textarea
                // is hidden, getCSSProperty(element, container, 'width') will
                // still return pixel value. If the element has realtiv dimensions
                // (e.g. width='95<percent>') getCSSProperty(...) will return pixel values
                // only as long as the textarea is visible. After it is hidden
                // getCSSProperty will return the relativ dimensions as they
                // are set on the element (in the case of width, 95<percent>).
                // Making the sum of pixel vaules (e.g. padding) and realtive
                // values (e.g. <percent>) is not possible. As such the padding styles
                // are ignored.

                // The complete width is the width of the textarea + the padding
                // to the left and right.
                var width = getCSSProperty(element, container, 'width');
                var height = getCSSProperty(element, container, 'height');
                style += 'height:' + height + ';width:' + width + ';';

                // Set the display property to 'inline-block'.
                style += 'display:inline-block;';
                container.setAttribute('style', style);
            };
            window.addEventListener('resize', resizeEvent, false);

            // Call the resizeEvent once, so that the size of the container is
            // calculated.
            resizeEvent();

            // Insert the div container after the element.
            if (element.nextSibling) {
                parentNode.insertBefore(container, element.nextSibling);
            } else {
                parentNode.appendChild(container);
            }

            // Override the forms onsubmit function. Set the innerHTML and value
            // of the textarea before submitting.
            while (parentNode !== document) {
                if (parentNode.tagName.toUpperCase() === 'FORM') {
                    var oldSumit = parentNode.onsubmit;
                    // Override the onsubmit function of the form.
                    parentNode.onsubmit = function(evt) {
                        element.value = prEnv.editor.value;
                        element.innerHTML = prEnv.editor.value;
                        // If there is a onsubmit function already, then call
                        // it with the current context and pass the event.
                        if (oldSumit) {
                            oldSumit.call(this, evt);
                        }
                    }
                    break;
                }
                parentNode = parentNode.parentNode;
            }

            // Hide the element.
            element.style.display = 'none';

            // The div container is the new element that is passed to appconfig.
            baseConfig.element = container;

            // Check if the textarea has the 'readonly' flag and set it
            // on the config object so that the editor is readonly.
            if (!util.none(element.getAttribute('readonly'))) {
                baseConfig.readOnly = true;
            }
        } else {
            baseConfig.element = element;
        }

        appconfig.launch(baseConfig).then(function(env) {
            prEnv = env;
            pr.resolve(env);
        });
    });

    return pr;
};

$(document).ready(function() {
    // Bespin is now ready to use.
    bespin.loaded.resolve();

    // Holds the lauch promises of all launched Bespins.
    var launchBespinPromises = [];

    var nodes = document.querySelectorAll(".bespin");
    for (var i = 0; i < nodes.length; i++) {
        var node = nodes[i];
        var options = node.getAttribute('data-bespinoptions') || '{}';
        var pr = bespin.useBespin(node, JSON.parse(options));
        pr.then(function(env) {
            node.bespin = env;
        }, function(error) {
            throw new Error('Launch failed: ' + error);
        });
        launchBespinPromises.push(pr);
    }

    // Call the window.onBespinLoad() function after all launched Bespins
    // are ready or throw an error otherwise.
    group(launchBespinPromises).then(function() {
        bespin.initialized.resolve();
        // If users want a custom startup.
        if (window.onBespinLoad) {
          window.onBespinLoad();
        }
    }, function(err) {
        bespin.initialized.reject('At least one Bespin failed to launch!' + err);
    });
});

})();
