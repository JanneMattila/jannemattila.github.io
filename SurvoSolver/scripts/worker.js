(function () {
    "use strict";

    importScripts("Board.js");

    var board = new Board();

    function solve(puzzleIndex, puzzle) {
        postMessage({ "text": "Solving(" + puzzleIndex + "): " + puzzle.name });
        board.setBoard(puzzle.board);
        var solution = board.execute();
        var solutionBoard = board.toString();
        postMessage({
            "text": "Solved(" + puzzleIndex + "): " + puzzle.name,
            "board": solutionBoard
        });
    }

    function messageHandler(event) {
        switch (event.data.cmd) {
            case 'solve':
                solve(event.data.puzzleIndex, event.data.puzzle);
                break;
        }
    }

    addEventListener('message', messageHandler, false);
    postMessage({ "text": "Worker started" });
}());
