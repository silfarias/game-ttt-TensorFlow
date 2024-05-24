document.addEventListener('DOMContentLoaded', () => {
  
  const celdas = document.querySelectorAll('.cell'); // seleccionar todas las celdas del tablero
  const estadoJuego = document.getElementById('status'); // elemento para mostrar el estado del juego
  const botonReiniciar = document.getElementById('restart'); // botón para reiniciar el juego

  let tablero = Array(9).fill(0); // inicializa el tablero con ceros (vacío)
  let jugadorActual = 1;  // el jugador actual: 1 para 'X' y -1 para 'O'
  let juegoActivo = true; // bandera para indicar si el juego está activo

  // combinaciones ganadoras posibles
  const combinacionesGanadoras = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6]
  ];

  // ruta del modelo
  const rutaModelo = 'model/ttt_model.json';
  let modelo;

  // Cargar el modelo de TensorFlow.js
  tf.ready().then(async () => {
    modelo = await tf.loadLayersModel(rutaModelo);
    console.log('Modelo cargado');
  });

  // Manejar la jugada en una celda específica
  function manejarJugadaCelda(celdaClickeada, indiceCelda) {
    // Actualizar el tablero con el jugador actual
    tablero[indiceCelda] = jugadorActual;
    // Mostrar 'X' o 'O' en la celda clickeada
    celdaClickeada.innerHTML = jugadorActual === 1 ? 'X' : 'O';
  }

  // Validar si hay un ganador o empate
  function validarResultado() {
    // Verificar si hay una combinación ganadora
    let rondaGanada = false;
    for (let i = 0; i < combinacionesGanadoras.length; i++) {
      const condicionGanar = combinacionesGanadoras[i];
      let a = tablero[condicionGanar[0]];
      let b = tablero[condicionGanar[1]];
      let c = tablero[condicionGanar[2]];
      if (a === 0 || b === 0 || c === 0) {
        continue;
      }
      if (a === b && b === c) {
        rondaGanada = true;
        break;
      }
    }

    // Mostrar mensaje si alguien gana
    if (rondaGanada) {
      estadoJuego.innerHTML = jugadorActual === 1 ? 'Jugador gana!' : 'Computadora gana!';
      juegoActivo = false;
      return;
    }

    // Verificar si hay empate
    let rondaEmpate = !tablero.includes(0);
    if (rondaEmpate) {
      estadoJuego.innerHTML = 'Empate!';
      juegoActivo = false;
      return;
    }

    // Cambiar al siguiente jugador
    jugadorActual = jugadorActual === 1 ? -1 : 1;
    if (jugadorActual === -1) {
      manejarMovimientoComputadora();
    }
  }

  // Manejar el movimiento de la computadora
  function manejarMovimientoComputadora() {
    tf.tidy(() => {
      // Convertir el tablero a tensor
      const tensorTablero = tf.tensor(tablero, [1, 9]);
      // Predecir la mejor jugada
      modelo.predict(tensorTablero).data().then(predicciones => {
        let mejorMovimiento = -1;
        let mejorValor = -Infinity;
        // Encontrar el mejor movimiento basado en las predicciones
        for (let i = 0; i < predicciones.length; i++) {
          if (tablero[i] === 0 && predicciones[i] > mejorValor) {
            mejorMovimiento = i;
            mejorValor = predicciones[i];
          }
        }
        // Realizar el mejor movimiento
        if (mejorMovimiento >= 0) {
          tablero[mejorMovimiento] = -1;
          celdas[mejorMovimiento].innerHTML = 'O';
          validarResultado();
        }
      });
    });
  }

  // Manejar el clic en una celda
  function manejarClicCelda(evento) {
    const celdaClickeada = evento.target;
    const indiceCelda = parseInt(celdaClickeada.getAttribute('data-index'));

    // Verificar si la celda ya está ocupada o si el juego ha terminado
    if (tablero[indiceCelda] !== 0 || !juegoActivo) {
      return;
    }

    // Manejar la jugada y validar el resultado
    manejarJugadaCelda(celdaClickeada, indiceCelda);
    validarResultado();
  }

  // Reiniciar el juego
  function manejarReinicioJuego() {
    // Reiniciar el tablero y las variables de estado
    tablero = Array(9).fill(0);
    juegoActivo = true;
    jugadorActual = 1;
    estadoJuego.innerHTML = '';
    celdas.forEach(celda => celda.innerHTML = '');
  }

  // Añadir evento de clic a cada celda
  celdas.forEach(celda => celda.addEventListener('click', manejarClicCelda));
  // Añadir evento de clic al botón de reinicio
  botonReiniciar.addEventListener('click', manejarReinicioJuego);
});


