var Board = (function () {
    function Board() {
        this.boardData = [[]];
        this.usedNumbers = new Array();
        this.emptyPositions = 0;
        this.rows = 0;
        this.columns = 0;
    }
    Board.prototype.setBoard = function (boardData) {
        this.boardData = boardData;
        this.usedNumbers = new Array();
        this.emptyPositions = 0;
        this.columns = this.boardData[0].length - 1;
        this.rows = this.boardData.length - 1;

        for (var column = 0; column < this.columns; column++) {
            for (var row = 0; row < this.rows; row++) {
                var value = this.boardData[row][column];
                if (value !== 0) {
                    this.usedNumbers.push(value);
                } else {
                    this.emptyPositions++;
                }
            }
        }
    };

    Board.prototype.isSolution = function () {
        for (var column = 0; column < this.columns; column++) {
            var columnSum = 0;
            for (var row = 0; row < this.rows; row++) {
                var value = this.boardData[row][column];
                if (value === 0) {
                    return false;
                }

                columnSum += value;
            }

            if (columnSum !== this.boardData[this.rows][column]) {
                return false;
            }
        }

        for (var row = 0; row < this.rows; row++) {
            var rowSum = 0;
            for (var column = 0; column < this.columns; column++) {
                rowSum += this.boardData[row][column];
            }

            if (rowSum !== this.boardData[row][this.columns]) {
                return false;
            }
        }

        return true;
    };

    Board.prototype.solve = function (rowStart, columnStart) {
        if (this.emptyPositions === 0 && this.isSolution() == true) {
            return true;
        }

        var row = rowStart;
        var column = columnStart;

        for (; column < this.columns; column++) {
            for (; row < this.rows; row++) {
                var value = this.boardData[row][column];
                if (value === 0) {
                    var possibleMoves = this.getAvailableMoves(row, column);
                    if (possibleMoves.length == 0) {
                        return false;
                    }

                    for (var move = 0; move < possibleMoves.length; move++) {
                        // Make move
                        var value = possibleMoves[move];
                        this.boardData[row][column] = value;
                        this.emptyPositions--;
                        this.usedNumbers.push(value);

                        var solutionFound = this.solve(row + 1, column);
                        if (solutionFound == true) {
                            return solutionFound;
                        }

                        // Undo move
                        if (this.boardData[row][column] != value) {
                            var num = this.boardData[row][column];
                        }

                        this.boardData[row][column] = 0;
                        this.emptyPositions++;
                        this.usedNumbers.pop();
                    }

                    return false;
                }
            }

            row = 0;
        }

        return false;
    };

    Board.prototype.execute = function () {
        var solutionFound = this.solve(0, 0);
        if (solutionFound == false) {
            return undefined;
        }

        return this.boardData;
    };

    Board.prototype.getAvailableMoves = function (row, column) {
        if (row >= this.boardData.length - 1 || column >= this.boardData[row].length - 1) {
            throw new Exception("Position not inside board");
        }

        /*
        Algorithm follows this logic for row
        (and similarly for column):
        Get RANGEmax:
        1. Get count of empty positions in this row
        2. Substract all the existing values from the row total
        3. For the empty squares start taking numbers from start
        (1 onwards) and exclude all the used ones and substract
        these from the row total
        4. Number left is maximum possible value for that row
        3. Take the minimum of row and column maximum possible values
        4. That is used for the RANGEmax
        
        Get available values:
        1. Start from 1 and loop until RANGEmax
        2. Add number to the available values list
        if it's not already at the used numbers list.
        */
        var availableValues = new Array();
        var columnMax = this.boardData[row][this.columns];
        var rowMax = this.boardData[this.rows][column];
        var columnMin = 1;
        var rowMin = 1;

        var emptyColumns = 0;
        for (var i = 0, minValue = 1; i < this.columns; i++) {
            if (i === column)
                continue;

            var value = this.boardData[row][i];
            if (value === 0) {
                while (this.usedNumbers.indexOf(minValue) !== -1) {
                    minValue++;
                }

                columnMax -= minValue;
                minValue++;
                emptyColumns++;
            } else {
                columnMax -= value;
            }
        }

        if (emptyColumns === 0) {
            // Special case that only single position available
            columnMin = columnMax;
        }

        var emptyRows = 0;
        for (var i = 0, minValue = 1; i < this.rows; i++) {
            if (i === row)
                continue;

            var value = this.boardData[i][column];
            if (value === 0) {
                while (this.usedNumbers.indexOf(minValue) !== -1) {
                    minValue++;
                }

                rowMax -= minValue;
                minValue++;
                emptyRows++;
            } else {
                rowMax -= value;
            }
        }

        if (emptyRows === 0) {
            // Special case that only single position available
            rowMin = rowMax;
        }

        var rangeMin = Math.max(rowMin, columnMin);
        var rangeMax = Math.min(rowMax, columnMax);
        for (var i = rangeMin; i <= rangeMax; i++) {
            if (this.usedNumbers.indexOf(i) === -1) {
                availableValues.push(i);
            }
        }

        return availableValues;
    };

    Board.prototype.toString = function () {
        var output = "";
        var largestValue = 0;
        for (var row = 0; row < this.boardData.length; row++) {
            for (var column = 0; column < this.boardData[row].length; column++) {
                var value = this.boardData[row][column];
                if (largestValue <= value) {
                    largestValue = value;
                }
            }
        }
        var largestValueAsString = "" + largestValue;

        for (var row = 0; row < this.boardData.length; row++) {
            for (var column = 0; column < this.boardData[row].length; column++) {
                var valueAsString = "" + this.boardData[row][column];
                while (valueAsString.length <= largestValueAsString.length) {
                    valueAsString = " " + valueAsString;
                }

                output += valueAsString;
            }

            output += "\n";
        }

        return output;
    };
    return Board;
})();
//# sourceMappingURL=Board.js.map
