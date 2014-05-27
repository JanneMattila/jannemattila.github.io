"use strict";
define(["require", "exports"], function(require, exports) {
    var BoardMove = (function () {
        /**
        * Initializes a new instance of the BoardMove class.
        * @constructor
        */
        function BoardMove(from, to) {
            this.From = from;
            this.To = to;
        }
        return BoardMove;
    })();
    exports.BoardMove = BoardMove;
});
