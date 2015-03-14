class Board {
    name: string;
    url: string;

    emptyPositions: number;
    rows: number;
    columns: number;
    boardData: number[][];
    usedNumbers: Array<number>;

    constructor() {
        this.boardData = [[]];
        this.usedNumbers = new Array<number>();
        this.emptyPositions = 0;
        this.rows = 0;
        this.columns = 0;
    }

    public setBoard(boardData: number[][]): void {
        this.boardData = boardData;
        this.usedNumbers = new Array<number>();
        this.emptyPositions = 0;
        this.columns = this.boardData[0].length - 1;
        this.rows = this.boardData.length - 1;

        for (var column: number = 0; column < this.columns; column++) {
            for (var row: number = 0; row < this.rows; row++) {
                var value: number = this.boardData[row][column];
                if (value !== 0) {
                    this.usedNumbers.push(value);
                } else {
                    this.emptyPositions++;
                }
            }
        }
    }

    public isSolution(): boolean {
        for (var column: number = 0; column < this.columns; column++) {
            var columnSum: number = 0;
            for (var row: number = 0; row < this.rows; row++) {
                var value: number = this.boardData[row][column];
                if (value === 0) {
                    return false;
                }

                columnSum += value;
            }

            if (columnSum !== this.boardData[this.rows][column]) {
                return false;
            }
        }

        for (var row: number = 0; row < this.rows; row++) {
            var rowSum: number = 0;
            for (var column: number = 0; column < this.columns; column++) {
                rowSum += this.boardData[row][column];
            }

            if (rowSum !== this.boardData[row][this.columns]) {
                return false;
            }
        }

        return true;
    }

    private solve(rowStart: number, columnStart: number): boolean {
        if (this.emptyPositions === 0 &&
            this.isSolution() == true) {
            return true;
        }

        var row: number = rowStart;
        var column: number = columnStart;

        for (; column < this.columns; column++) {
            for (; row < this.rows; row++) {
                var value: number = this.boardData[row][column];
                if (value === 0) {
                    var possibleMoves: Array<number> = this.getAvailableMoves(row, column);
                    if (possibleMoves.length == 0) {
                        return false;
                    }

                    for (var move: number = 0; move < possibleMoves.length; move++) {
                        // Make move
                        var value = possibleMoves[move];
                        this.boardData[row][column] = value;
                        this.emptyPositions--;
                        this.usedNumbers.push(value);

                        var solutionFound = this.solve(row+1, column);
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
    }

    public execute(): number[][] {

        var solutionFound = this.solve(0,0);
        if (solutionFound == false) {
            return undefined;
        }

        return this.boardData;
    }

    public getAvailableMoves(row: number, column: number): Array<number> {
        if (row >= this.boardData.length - 1 ||
            column >= this.boardData[row].length - 1 ) {
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
        var availableValues = new Array<number>();
        var columnMax = this.boardData[row][this.columns];
        var rowMax = this.boardData[this.rows][column];
        var columnMin = 1;
        var rowMin = 1;

        var emptyColumns: number = 0;
        for (var i: number = 0, minValue: number = 1; i < this.columns; i++) {
            if (i === column) continue; // Skip given position

            var value: number = this.boardData[row][i];
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

        var emptyRows: number = 0;
        for (var i: number = 0, minValue: number = 1; i < this.rows; i++) {
            if (i === row) continue; // Skip given position

            var value: number = this.boardData[i][column];
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
        for (var i: number = rangeMin; i <= rangeMax; i++) {
            if (this.usedNumbers.indexOf(i) === -1) {
                availableValues.push(i);
            }
        }

        return availableValues;
    }

    public toString(): string {
        var output = "";
        var largestValue = 0;
        for (var row: number = 0; row < this.boardData.length; row++) {
            for (var column: number = 0; column < this.boardData[row].length; column++) {
                var value: number = this.boardData[row][column];
                if (largestValue <= value) {
                    largestValue = value;
                }
            }
        }
        var largestValueAsString = "" + largestValue;

        for (var row: number = 0; row < this.boardData.length; row++) {
            for (var column: number = 0; column < this.boardData[row].length; column++) {
                var valueAsString: string = "" + this.boardData[row][column];
                while (valueAsString.length <= largestValueAsString.length) {
                    valueAsString = " " + valueAsString;
                }

                output += valueAsString;
            }

            output += "\n";
        }

        return output;
    }
}
