import { Chess } from "chess.js";

export const extractGameMoves =(pgn)=>{
    const game = new Chess()

    //Load thr complete PGN
    game.loadPgn(pgn)

    // Get all moves in verbose format
    const moves = game.history({
        verbose:true
    })

    // Temporary chess game used to 
    // rebuild the game move by move
}