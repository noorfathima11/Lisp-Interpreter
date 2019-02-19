let inputArray = ['a', 'b', 'c', 'd', 'e']
let endIndex = 0

while (inputArray.length > 0) {
  console.log('length', inputArray.length)
  inputArray = inputArray.slice(endIndex + 1)
  endIndex++
  console.log('endIndex', endIndex)
  console.log(inputArray)
}
console.log('Final length', inputArray.length)
