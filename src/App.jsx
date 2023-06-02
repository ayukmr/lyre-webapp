import { createSignal } from 'solid-js';

import axios from 'axios';

import {
  FaRegularChessPawn,
  FaRegularChessBishop,
  FaRegularChessKnight,
  FaRegularChessRook,
  FaRegularChessQueen,
  FaRegularChessKing,

  FaSolidChessPawn,
  FaSolidChessBishop,
  FaSolidChessKnight,
  FaSolidChessRook,
  FaSolidChessQueen,
  FaSolidChessKing
} from 'solid-icons/fa';

import styles from './App.module.less';

// solid app
function App() {
  // game data
  const [data, setData] = createSignal(null);

  // logged in user
  const [user,  setUser]  = createSignal(null);
  const [token, setToken] = createSignal(null);

  // selected piece
  const [selected, setSelected] = createSignal(null);
  const [movement, setMovement] = createSignal([]);

  // server host
  const host = 'http:///localhost:9292';

  // icon for piece
  const pieceIcon = (color, type) => (
    {
      white: {
        pawn:   <FaRegularChessPawn   />,
        bishop: <FaRegularChessBishop />,
        knight: <FaRegularChessKnight />,
        rook:   <FaRegularChessRook   />,
        queen:  <FaRegularChessQueen  />,
        king:   <FaRegularChessKing   />
      },

      black: {
        pawn:   <FaSolidChessPawn   />,
        bishop: <FaSolidChessBishop />,
        knight: <FaSolidChessKnight />,
        rook:   <FaSolidChessRook   />,
        queen:  <FaSolidChessQueen  />,
        king:   <FaSolidChessKing   />
      }
    }[color][type]
  );

  // find game piece
  const findPiece = (posX, posY) => (
    data().pieces.find((piece) => (
      piece.pos_x === posX && piece.pos_y === posY
    ))
  );

  // get relative position
  const relativePos = (pos) => (
    data().game.white === user() ? pos : 7 - pos
  );

  // get game data
  const refreshGame = () => {
    axios.get(
      `${host}/game/hello`,
      { headers: { Authorization: `Bearer ${token()}` } }
    ).then(({ data }) => setData(data));
  };

  // find promoting piece
  const findPromoting = () => (
    data().game.white === user()
      ? (
        data().pieces.find((piece) => (
          piece.color === 'white'
            && piece.type === 'pawn'
            && piece.pos_y === 0
        ))
      )
      : (
        data().pieces.find((piece) => (
          piece.color === 'black'
            && piece.type === 'pawn'
            && piece.pos_y === 7
        ))
      )
  );

  // select piece
  const selectPiece = (pieceID) => {
    return (e) => {
      e.stopPropagation();
      setSelected(pieceID);

      // get piece movement
      axios.get(
        `${host}/game/hello/piece/${pieceID}/movement`,
        { headers: { Authorization: `Bearer ${token()}` } }
      ).then(({ data }) => setMovement(data));
    };
  };

  // move piece
  const movePiece = (destX, destY) => {
    return (e) => {
      e.stopPropagation();

      axios.put(
        `${host}/game/hello/piece/${selected()}/move`,
        { destX, destY },
        { headers: { Authorization: `Bearer ${token()}` } }
      ).then(({ data }) => {
        setData(data);

        // clear selection
        setSelected(null);
        setMovement([]);
      });
    };
  };

  // promote piece
  const promotePiece = (type) => {
    return (e) => {
      e.stopPropagation();

      axios.put(
        `${host}/game/hello/piece/${findPromoting().id}/promote`,
        { type },
        { headers: { Authorization: `Bearer ${token()}` } }
      ).then(({ data }) => setData(data));
    };
  };

  setInterval(refreshGame, 1000);
  refreshGame();

  return (
    <>
      <div class={styles.left}>
        <input onInput={(e) => setUser(e.target.value)} />
        <br />
        <input onInput={(e) => setToken(e.target.value)} />
      </div>

      {data() &&
        <div class={styles.right}>
          <span>{data()?.game.turn}'s turn to move</span>
        </div>
      }

      {data()
        ? (
          // render game
          <div
            class={styles.board}
            onClick={() => {
              setSelected(null);
              setMovement([]);
            }}
          >
            {Array(8).fill().map((_, posY) => (
              // render row
              <div class={styles.row}>
                {Array(8).fill().map((_, posX) => {
                  const piece = findPiece(relativePos(posX), relativePos(posY));

                  const move =
                    movement().some((move) => (
                      move[0] === relativePos(posX) && move[1] === relativePos(posY)
                    ));

                  const promoting =
                    piece && findPromoting()?.id === piece.id

                  const checked =
                    piece?.type == 'king' && data().check[piece.color]

                  // render tile
                  return (
                    <div
                      // tile coloring
                      class={`
                        ${styles.tile}
                        ${promoting || move ? styles.highlight : ''}
                        ${checked ? styles.check : ''}
                      `}

                      // click action
                      onClick={
                        piece && data().game[piece.color] === user()
                          ? selectPiece(piece.id)
                          : move && movePiece(relativePos(posX), relativePos(posY))
                      }
                    >
                      {piece && pieceIcon(piece.color, piece.type)}
                    </div>
                  );
                })}
              </div>
            ))}

            {findPromoting() &&
              <div style={{ position: 'absolute' }} class={styles.row}>
                {['bishop', 'knight', 'rook', 'queen'].map((type) => (
                  <div
                    class={`${styles.tile} ${styles.highlight}`}
                    onClick={promotePiece(type)}
                  >
                    {pieceIcon(
                      data().game.white === user()
                        ? 'white'
                        : 'black',
                      type
                    )}
                  </div>
                ))}
              </div>
            }
          </div>
        )
        : <div>wait...</div>
      }
    </>
  );
}

export default App;
