"use strict";
define(["require", "exports", "./BoardMove"], function(require, exports, BoardMoveImport) {
    /**
    * Board class manages the different operations in game board
    * of pocket solitaire including state and history.
    * It can be used for building solving algorithms, games or different
    * calculation and performance tests.
    * It's meant to provide simple implementation for learning purposes.
    * @class
    */
    var Board = (function () {
        /**
        * Initializes a new instance of the Board class.
        * @constructor
        */
        function Board() {
            this._board = [];
            this._moveHistory = [];
            this.Clear();

            if (Board._indexToKey.length === 0) {
                Board._indexToKey.length = 47;
                Board._indexToKey[2] = "A";
                Board._indexToKey[3] = "B";
                Board._indexToKey[4] = "C";
                Board._indexToKey[9] = "D";
                Board._indexToKey[10] = "E";
                Board._indexToKey[11] = "F";
                Board._indexToKey[14] = "G";
                Board._indexToKey[15] = "H";
                Board._indexToKey[16] = "I";
                Board._indexToKey[17] = "J";
                Board._indexToKey[18] = "K";
                Board._indexToKey[19] = "L";
                Board._indexToKey[20] = "M";
                Board._indexToKey[21] = "N";
                Board._indexToKey[22] = "O";
                Board._indexToKey[23] = "P";
                Board._indexToKey[24] = "Q";
                Board._indexToKey[25] = "R";
                Board._indexToKey[26] = "S";
                Board._indexToKey[27] = "T";
                Board._indexToKey[28] = "U";
                Board._indexToKey[29] = "V";
                Board._indexToKey[30] = "W";
                Board._indexToKey[31] = "X";
                Board._indexToKey[32] = "Y";
                Board._indexToKey[33] = "Z";
                Board._indexToKey[34] = "1";
                Board._indexToKey[37] = "2";
                Board._indexToKey[38] = "3";
                Board._indexToKey[39] = "4";
                Board._indexToKey[44] = "5";
                Board._indexToKey[45] = "6";
                Board._indexToKey[46] = "7";

                Board._keyToIndex = new Object();
                for (var i = 0; i < Board._indexToKey.length; i++) {
                    var key = Board._indexToKey[i];
                    if (typeof key !== "undefined") {
                        Board._keyToIndex[key] = i;
                    }
                }
            }
        }
        /**
        * Clears board to initial state.
        */
        Board.prototype.Clear = function () {
            this._movesLeft = 31;
            this._board = [];
            this._board.length = Board.BOARD_SIZE * Board.BOARD_SIZE;
            this._moveHistory.length = 0;

            var location;
            for (var y = 0; y < Board.BOARD_SIZE; y++) {
                location = y * Board.BOARD_SIZE;
                for (var x = 0; x < Board.BOARD_SIZE; x++) {
                    var selection = 1;
                    if (x < 2 && y < 2) {
                        // Top left corner
                        selection = 0;
                    } else if (x > 4 && y < 2) {
                        // Top right corner
                        selection = 0;
                    } else if (x < 2 && y > 4) {
                        // Bottom left corner
                        selection = 0;
                    } else if (x > 4 && y > 4) {
                        // Bottom right corner
                        selection = 0;
                    }

                    this._board[location + x] = selection;
                }
            }

            this._board[Board.CENTER_PIECE] = 0;
        };

        Board.prototype.GetAllAvailableMoves = function () {
            var moves = new Array();
            for (var row = 0; row < Board.BOARD_SIZE; row++) {
                for (var column = 0; column < Board.BOARD_SIZE; column++) {
                    if (column < 2 && row < 2) {
                        continue;
                    } else if (column > 4 && row < 2) {
                        continue;
                    } else if (column < 2 && row > 4) {
                        continue;
                    } else if (column > 4 && row > 4) {
                        continue;
                    }

                    var availableMoves = this.GetAvailableMoves(row, column);
                    if (availableMoves.length > 0) {
                        var index = this.LocationToIndex(row, column);
                        moves.push(new BoardMoveImport.BoardMove(index, availableMoves));
                    }
                }
            }

            return moves;
        };

        Board.prototype.GetAvailableMoves = function (row, column) {
            var availableMoves = new Array();

            this.CheckAvailableMove(availableMoves, row, column, -2, 0);
            this.CheckAvailableMove(availableMoves, row, column, 2, 0);
            this.CheckAvailableMove(availableMoves, row, column, 0, -2);
            this.CheckAvailableMove(availableMoves, row, column, 0, 2);

            return availableMoves;
        };

        Board.prototype.CheckAvailableMove = function (availableMovesIndex, row, column, rowDelta, columnDelta) {
            var index = this.LocationToIndex(row, column);

            // Is there piece in start position?
            if (this._board[index] === 0) {
                // Empty so this is not possible move.
                return;
            }

            var columnTarget = column + columnDelta;
            var rowTarget = row + rowDelta;

            // Outside the range?
            if (columnTarget < 0 || columnTarget > 6 || rowTarget < 0 || rowTarget > 6) {
                // Outside of the board
                return;
            } else if (columnTarget < 2 && rowTarget < 2) {
                // Top left corner
                return;
            } else if (columnTarget > 4 && rowTarget < 2) {
                // Top right corner
                return;
            } else if (columnTarget < 2 && rowTarget > 4) {
                // Bottom left corner
                return;
            } else if (columnTarget > 4 && rowTarget > 4) {
                // Bottom right corner
                return;
            }

            // Is there piece between?
            index = this.LocationToIndex(row + rowDelta / 2, column + columnDelta / 2);
            if (this._board[index] === 0) {
                // Empty so this is not possible move.
                return;
            }

            index = this.LocationToIndex(row + rowDelta, column + columnDelta);
            if (this._board[index] === 1) {
                // Target location is not empty so this is not possible move.
                return;
            }

            availableMovesIndex.push(index);
        };

        Board.prototype.MakeMove = function (sourceIndex, targetIndex) {
            var betweenIndex = (sourceIndex + targetIndex) / 2;

            this._board[sourceIndex] = 0;
            this._board[betweenIndex] = 0;
            this._board[targetIndex] = 1;

            this._moveHistory.push(sourceIndex);
            this._moveHistory.push(betweenIndex);
            this._moveHistory.push(targetIndex);
            this._movesLeft--;
        };

        Board.prototype.MakeMoveFromString = function (moves) {
            var movesList = new Array(moves.length);
            for (var i = 0; i < moves.length; i++) {
                var index = moves[i];
                movesList[i] = Board._keyToIndex[index];
            }

            for (var i = 0; i < movesList.length; i += 2) {
                this.MakeMove(movesList[i], movesList[i + 1]);
            }
        };

        // Undos the previous move
        Board.prototype.Undo = function () {
            if (this._moveHistory.length >= 3) {
                var value1 = this._moveHistory[this._moveHistory.length - 1];
                this._moveHistory.pop();
                var value2 = this._moveHistory[this._moveHistory.length - 1];
                this._moveHistory.pop();
                var value3 = this._moveHistory[this._moveHistory.length - 1];
                this._moveHistory.pop();

                this._board[value1] = 0;
                this._board[value2] = 1;
                this._board[value3] = 1;

                this._movesLeft++;
                return true;
            }

            return false;
        };

        Board.prototype.LocationToIndex = function (row, column) {
            return column + row * Board.BOARD_SIZE;
        };

        Board.prototype.IsBoardAtWinningState = function () {
            if (this._movesLeft === 0) {
                // Check if the last piece is at the middle
                if (this._board[Board.CENTER_PIECE] === 1) {
                    return true;
                }
            }

            return false;
        };

        Board.prototype.GetMovesLeft = function () {
            return this._movesLeft;
        };

        Board.prototype.MoveHistoryToString = function () {
            var moves = "";
            for (var i = 0; i < this._moveHistory.length; i += 3) {
                moves += Board._indexToKey[this._moveHistory[i]];
                moves += Board._indexToKey[this._moveHistory[i + 2]];
            }
            return moves;
        };

        Board.prototype.ToString = function () {
            var result = "";
            for (var row = 0; row < Board.BOARD_SIZE; row++) {
                for (var column = 0; column < Board.BOARD_SIZE; column++) {
                    if (column < 2 && row < 2) {
                        // Top left corner
                        result += " ";
                    } else if (column > 4 && row < 2) {
                        // Top right corner
                        result += " ";
                    } else if (column < 2 && row > 4) {
                        // Bottom left corner
                        result += " ";
                    } else if (column > 4 && row > 4) {
                        // Bottom right corner
                        result += " ";
                    } else {
                        if (this._board[this.LocationToIndex(row, column)] === 1) {
                            result += "1";
                        } else {
                            result += "0";
                        }
                    }
                }

                result += "\n";
            }

            return result;
        };

        Board.prototype.Get = function (row, column) {
            if (column < 0 || column > 6 || row < 0 || row > 6) {
                // Outside of the board
                return -1;
            } else if (column < 2 && row < 2) {
                // Top left corner
                return -1;
            } else if (column > 4 && row < 2) {
                // Top right corner
                return -1;
            } else if (column < 2 && row > 4) {
                // Bottom left corner
                return -1;
            } else if (column > 4 && row > 4) {
                // Bottom right corner
                return -1;
            }

            var index = this.LocationToIndex(row, column);
            return this._board[index];
        };
        Board.BOARD_SIZE = 7;
        Board.CENTER_PIECE = 24;

        Board._indexToKey = [];
        return Board;
    })();
    exports.Board = Board;
});
