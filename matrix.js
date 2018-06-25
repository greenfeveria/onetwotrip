const N = process.env.N || 2

const matrix = fillMatrix(N)
console.table(matrix)
console.log(spiral(matrix).toString())

function spiral(matrix) {
  const maxSteps = matrix.length - 1
  const center = (matrix.length / 2) | 0 // Center element of matrix
  const direction = { // W / S / E / N
    0: {
      row: 0,
      column: -1
    },
    1: {
      row: 1,
      column: 0
    },
    2: {
      row: 0,
      column: 1
    }, 
    3: {
      row: -1,
      column: 0
    }
  }

  let row = center
  let column = center
  let orientation = 0
  const result = []
  
  function move(n) {
    for (let i = 0; i < n; i++) {
      row += direction[orientation].row
      column += direction[orientation].column
      result.push(matrix[row][column])
    }
    orientation = (orientation + 1) % 4
  }

  result.push(matrix[row][column])
  for (let i = 1; i <= maxSteps; i++) {
    move(i)
    move(i)
  }
  move(maxSteps)
  return result;
}

function fillMatrix(N) {
  const size = 2 * N - 1
  const matrix = Array(size)
    .fill()
    .map(() => Array(size).fill())
  let value = 1
  for (let i = 0; i < size; i++) {
    for (let y = 0; y < size; y++) {
      matrix[i][y] = value++
    }
  }
  return matrix
}