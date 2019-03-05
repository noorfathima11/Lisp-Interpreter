let inputString = ''

process.stdin.on('data', function (inputStdin) {
  inputString += inputStdin
})

process.stdin.on('end', function () {
  main(inputString)
})

function main (inputString) {
  console.log(inputString)
  let [r, c, L, H] = inputString.slice(0, inputString.indexOf('\n')).split(' ').map(ele => ele * 1)
  inputString = inputString.slice(inputString.indexOf('\n') + 1)
  let matrix = inputString.split('\n').map(ln => ln.split(''))
  console.log(matrix)
  console.log(r, c, L, H)
  let smallestUnit = []
  let k = 0
  for (let i = 0; i < matrix.length; i++) {
    let countT = 0
    let countM = 0
    let row = matrix[i]
    for (let j = 1; j < row.length; i++) {
      if (row[j] === 'T') countT++
      if (row[j] === 'M') countM++
    }
  }
  console.log('smallest units', smallestUnit)
}
