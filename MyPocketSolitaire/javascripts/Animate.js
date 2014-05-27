"use strict";
define(["require", "exports", "Board"], function(require, exports, BoardImport) {
    function getURLParameters(paramName) {
        var sURL = window.document.URL.toString();
        if (sURL.indexOf("?") > 0) {
            var arrParams = sURL.split("?");
            var arrURLParams = arrParams[1].split("&");
            for (var i = 0; i < arrURLParams.length; i++) {
                var sParam = arrURLParams[i].split("=");
                if (sParam[0] === paramName) {
                    return sParam[1];
                }
            }
        }

        return "";
    }

    var Point = (function () {
        function Point() {
        }
        return Point;
    })();

    var BoardPieceView = (function () {
        function BoardPieceView() {
            this.point = new Point();
            this.velocity = new Point();
            this.size = new Point();
            this.image = new Image();
            this.isVisible = true;
            this.isHighlighted = false;
        }
        BoardPieceView.prototype.Draw = function (context) {
            if (this.isVisible === true) {
                if (this.isHighlighted === true) {
                    context.fillStyle = "#FF00FA"; // EmptyMoveAvailable
                    //context.fillStyle = "#FFC38C"; // PreviousMoveFrom
                    //context.fillStyle = "#FF8CC3"; // PreviousMoveTo
                    context.fillRect(this.point.x, this.point.y, this.size.x, this.size.y);
                } else {
                    context.fillStyle = "black";
                    context.fillRect(this.point.x, this.point.y, this.size.x, this.size.y);
                }

                context.drawImage(this.image, this.point.x, this.point.y, this.size.x, this.size.y);
            }
        };

        BoardPieceView.prototype.Update = function (elapsedTime) {
            return false;
        };
        return BoardPieceView;
    })();

    var BoardViewModel = (function () {
        function BoardViewModel() {
            this.boardPieces = new Array();
            this.boardMoveString = "";
            this.emptyImage = new Image();
            this.circleSetImage = new Image();
            this.circleEmptyImage = new Image();
            this.board = new BoardImport.Board();
        }
        BoardViewModel.prototype.Draw = function () {
            this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
            var localContext = this.context;

            this.boardPieces.forEach(function (boardPiece) {
                boardPiece.Draw(localContext);
            });
        };

        BoardViewModel.prototype.Update = function () {
            var updatesOccurred = false;
            this.boardPieces.forEach(function (boardPiece) {
                var updateOccurred = boardPiece.Update(1);
                if (updateOccurred === true) {
                    updatesOccurred = true;
                }
            });

            return updatesOccurred;
        };

        BoardViewModel.prototype.LoadGame = function (game) {
            if ((game.length % 2) === 0) {
                // Game length seems to be correct
                this.boardMoveString = game;
                return true;
            }

            return false;
        };

        BoardViewModel.prototype.MakeMove = function () {
            if (this.boardMoveString.length > 0) {
                // Update board according to given move string
                this.board.MakeMoveFromString(this.boardMoveString.substr(0, 2));
                this.boardMoveString = this.boardMoveString.substr(2);

                // Update view
                var i = 0;
                for (var y = 0; y < BoardImport.Board.BOARD_SIZE; y++) {
                    for (var x = 0; x < BoardImport.Board.BOARD_SIZE; x++) {
                        var boardPiece = boardViewModel.board.Get(y, x);

                        if (boardPiece !== -1) {
                            var imageElement;
                            if (boardPiece === 1) {
                                imageElement = boardViewModel.circleSetImage;
                            } else if (boardPiece === 0) {
                                imageElement = boardViewModel.circleEmptyImage;
                            }

                            if (boardViewModel.boardPieces[i].image != imageElement) {
                                boardViewModel.boardPieces[i].image = imageElement;
                            }
                        }

                        i++;
                    }
                }

                return true;
            }

            return false;
        };

        BoardViewModel.prototype.Select = function (x, y) {
            var selected = false;
            this.boardPieces.forEach(function (boardPiece) {
                if (boardPiece.point.x <= x && boardPiece.point.y <= y && boardPiece.point.x + boardPiece.size.x >= x && boardPiece.point.y + boardPiece.size.y >= y) {
                    if (boardPiece.isHighlighted === false) {
                        selected = true;
                    }

                    boardPiece.isHighlighted = true;
                } else {
                    boardPiece.isHighlighted = false;
                }
            });

            return selected;
        };
        return BoardViewModel;
    })();

    var boardViewModel = new BoardViewModel();
    var loading = 0;
    var gameLoopInterval = 0;

    function gameLoop() {
        var timeout = 10;

        // Update
        var gameLoopRequired = boardViewModel.Update();

        if (gameLoopRequired === false) {
            // Make move if available
            if (boardViewModel.MakeMove() === true) {
                gameLoopRequired = true;
                timeout = 1500;
            }
        }

        // Draw
        boardViewModel.Draw();

        if (gameLoopRequired === true) {
            gameLoopInterval = setTimeout(gameLoop, timeout);
        }
    }

    function loadingResources() {
        loading++;
        if (loading === 2) {
            boardViewModel.Draw();
            setTimeout(gameLoop, 1500);
        }
    }

    function onCanvasClick(event) {
        if (event.pointerType) {
            switch (event.pointerType) {
                case "touch":
                    break;
                case "pen":
                    break;
                case "mouse":
                    break;
            }
        }
    }

    var animate = document.getElementById('canvasCaption');
    animate.textContent = "Initializing...";

    var game = getURLParameters("Game");
    if (game === "") {
        animate.textContent = "No game defined.";
    } else {
        if (boardViewModel.LoadGame(game) === false) {
            animate.textContent = "Couldn't load the given game.";
        } else {
            animate.textContent = "";

            // create a new stage and point it at our canvas:
            var canvas = document.getElementById("boardCanvas");
            var size = window.innerWidth * 0.95;
            if (window.innerHeight < size) {
                size = window.innerHeight * 0.95;
            }

            size = Math.floor(Math.min(size, 800));
            canvas.style.width = size + 'px';
            canvas.style.height = size + 'px';
            canvas.width = size;
            canvas.height = size;

            boardViewModel.canvas = canvas;
            boardViewModel.context = canvas.getContext("2d");

            boardViewModel.circleSetImage.onload = loadingResources;
            boardViewModel.circleEmptyImage.onload = loadingResources;

            boardViewModel.circleSetImage.src = "/MyPocketSolitaire/images/CircleSet.png";
            boardViewModel.circleEmptyImage.src = "/MyPocketSolitaire/images/CircleEmpty.png";

            boardViewModel.boardPieces.length = BoardImport.Board.BOARD_SIZE * BoardImport.Board.BOARD_SIZE;
            var i = 0;
            var pieceSize = Math.floor(size / (BoardImport.Board.BOARD_SIZE));
            for (var y = 0; y < BoardImport.Board.BOARD_SIZE; y++) {
                for (var x = 0; x < BoardImport.Board.BOARD_SIZE; x++) {
                    var boardPiece = boardViewModel.board.Get(y, x);

                    var boardPieceView = new BoardPieceView();
                    boardPieceView.point.x = pieceSize * x;
                    boardPieceView.point.y = pieceSize * y;

                    boardPieceView.size.x = pieceSize;
                    boardPieceView.size.y = pieceSize;

                    if (boardPiece === 1) {
                        boardPieceView.image = boardViewModel.circleSetImage;
                    } else if (boardPiece === 0) {
                        boardPieceView.image = boardViewModel.circleEmptyImage;
                    } else {
                        boardPieceView.isVisible = false;
                    }

                    boardViewModel.boardPieces[i] = boardPieceView;
                    i++;
                }
            }

            canvas.addEventListener("pointermove", onCanvasClick, false);
            canvas.addEventListener("mousemove", onCanvasClick, false);
        }
    }
});
